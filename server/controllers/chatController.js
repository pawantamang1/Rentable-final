import Chat from "../models/Chats.js";
import OwnerUser from "../models/OwnerUser.js";
import TenantUser from "../models/TenantUser.js";

/**
 * @description Send message with duplicate prevention
 * @returns {object} message
 */
const sendMessage = async (req, res) => {
  try {
    const { to, message } = req.body;
    const { userId: from } = req.user;

    // Basic validation
    if (!to || !message || !message.trim()) {
      return res.status(400).json({ msg: "Invalid message data" });
    }

    // Check for recent duplicate messages (within last 2 seconds)
    const recentDuplicate = await Chat.findOne({
      chatUsers: { $all: [from, to] },
      message: message.trim(),
      sender: from,
      createdAt: { $gte: new Date(Date.now() - 2000) }, // Last 2 seconds
    });

    if (recentDuplicate) {
      console.log("🚫 Duplicate message prevented:", message);
      return res.status(200).json({
        newMessage: recentDuplicate,
        msg: "Message already sent",
        chatId: to,
      });
    }

    // Create new message
    const newMessage = await Chat.create({
      chatUsers: [from, to],
      message: message.trim(),
      sender: from,
    });

    res.status(201).json({
      newMessage,
      msg: "Message sent successfully",
      chatId: to,
      messageId: newMessage._id,
    });
  } catch (error) {
    console.error("Send message error:", error);
    res.status(500).json({ msg: "Failed to send message" });
  }
};

/**
 * @description Get all messages for a chat
 * @returns {object} message
 */
const getMessages = async (req, res) => {
  try {
    const { to } = req.body;
    const { userId: from } = req.user;

    if (!to) {
      return res.status(400).json({ msg: "Recipient ID required" });
    }

    const msgs = await Chat.find({
      chatUsers: { $all: [from, to] },
    }).sort({ createdAt: 1 });

    const messages = msgs.map((msg) => {
      return {
        fromSelf: msg.sender === from,
        message: msg.message,
        isRead: msg.isRead,
        createdAt: msg.createdAt,
        _id: msg._id,
      };
    });

    return res.status(200).json({ messages });
  } catch (error) {
    console.error("Get messages error:", error);
    res.status(500).json({ msg: "Failed to get messages" });
  }
};

/**
 * @description Get all chats for a user
 * @returns {object} message
 */
const getChats = async (req, res) => {
  try {
    const { userId } = req.user;

    const lastMessages = await Chat.aggregate([
      {
        $match: {
          chatUsers: { $in: [userId] },
        },
      },
      {
        $sort: { createdAt: -1 },
      },
      {
        $addFields: {
          sortedChatUsers: { $sortArray: { input: "$chatUsers", sortBy: 1 } },
        },
      },
      {
        $group: {
          _id: "$sortedChatUsers",
          lastMessage: { $first: "$$ROOT" },
        },
      },
      {
        $replaceRoot: { newRoot: "$lastMessage" },
      },
    ]);

    const chatContacts = lastMessages.map((lastMessage) => {
      const to = lastMessage.chatUsers.find((id) => id !== userId);
      lastMessage.to = to;
      return to;
    });

    let contacts = [];
    if (req.path.includes("tenant")) {
      contacts = await OwnerUser.find({ _id: { $in: chatContacts } }).select(
        "firstName lastName profileImage slug"
      );
    } else if (req.path.includes("owner")) {
      contacts = await TenantUser.find({ _id: { $in: chatContacts } }).select(
        "firstName lastName profileImage slug"
      );
    }

    const chats = lastMessages
      .map((lastMessage) => {
        const contact = contacts.find(
          (contact) => contact._id.toString() === lastMessage.to
        );
        return {
          ...lastMessage,
          ...contact?._doc,
        };
      })
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    return res.status(200).json({ chats });
  } catch (error) {
    console.error("Get chats error:", error);
    res.status(500).json({ msg: "Failed to get chats" });
  }
};

export { getChats, getMessages, sendMessage };
