// import Chats from "../models/Chats.js";

// const socketHandler = (io) => {
//   global.onlineUsers = new Map();

//   io.on("connection", (socket) => {
//     console.log(`⚡ New socket connection: ${socket.id}`);

//     // Add user to online users map
//     socket.on("addUser", (userId) => {
//       onlineUsers.set(userId, socket.id);
//       console.log(`👤 User ${userId} connected with socket ${socket.id}`);

//       // Send initial unread count
//       updateUnreadCounts(userId);
//     });

//     // Handle message sending
//     socket.on("sendMsg", async (data) => {
//       try {
//         const { to, from, message } = data;
//         console.log(
//           `✉️ Message from ${from} to ${to}: ${message.substring(0, 30)}...`
//         );

//         // Save message to database
//         const newMessage = await Chats.create({
//           chatUsers: [from, to],
//           message,
//           sender: from,
//           isRead: false,
//         });

//         // Get recipient's socket ID
//         const receiverSocketId = onlineUsers.get(to);

//         if (receiverSocketId) {
//           // Send message to recipient
//           io.to(receiverSocketId).emit("receiveMsg", {
//             _id: newMessage._id,
//             message: newMessage.message,
//             from: newMessage.sender,
//             to,
//             createdAt: newMessage.createdAt,
//             isRead: newMessage.isRead,
//           });
//           console.log(`📤 Forwarded to ${to} (socket ${receiverSocketId})`);
//         }

//         // Update unread counts for both users
//         updateUnreadCounts(from);
//         updateUnreadCounts(to);
//       } catch (error) {
//         console.error("🔴 Error in sendMsg:", error);
//       }
//     });

//     // Mark messages as read
//     socket.on("markAsRead", async (data) => {
//       try {
//         const { receiverID, senderId } = data;
//         console.log(
//           `📖 Marking messages as read between ${senderId} and ${receiverID}`
//         );

//         await Chats.updateMany(
//           {
//             chatUsers: { $all: [senderId, receiverID] },
//             sender: senderId,
//             isRead: false,
//           },
//           { $set: { isRead: true } }
//         );

//         // Update unread counts
//         updateUnreadCounts(receiverID);
//         updateUnreadCounts(senderId);
//       } catch (err) {
//         console.error("Error marking messages as read:", err);
//       }
//     });

//     // Handle disconnection
//     socket.on("disconnect", () => {
//       console.log(`🔥 Socket disconnected: ${socket.id}`);
//       // Remove user from online users map
//       for (let [userId, socketId] of onlineUsers.entries()) {
//         if (socketId === socket.id) {
//           onlineUsers.delete(userId);
//           console.log(`👋 User ${userId} disconnected`);
//           break;
//         }
//       }
//     });

//     // Helper function to update unread counts
//     async function updateUnreadCounts(userId) {
//       try {
//         const result = await Chats.aggregate([
//           {
//             $match: {
//               chatUsers: userId,
//               sender: { $ne: userId },
//               isRead: false,
//             },
//           },
//           { $group: { _id: "$sender", count: { $sum: 1 } } },
//         ]);

//         const unreadMessageCount = result.length;
//         const userSocketId = onlineUsers.get(userId);

//         if (userSocketId) {
//           io.to(userSocketId).emit("unreadMessageCount", unreadMessageCount);
//         }
//       } catch (err) {
//         console.error("Error updating unread counts:", err);
//       }
//     }
//   });
// };

// export default socketHandler;

import Chats from "../models/Chats.js";

const socketHandler = (io) => {
  global.onlineUsers = new Map();

  io.on("connection", (socket) => {
    console.log(`⚡ New socket connection: ${socket.id}`);

    // Add user to online users map
    socket.on("addUser", (userId) => {
      // Remove existing connection if any
      if (onlineUsers.has(userId)) {
        const oldSocketId = onlineUsers.get(userId);
        io.to(oldSocketId).emit(
          "forceDisconnect",
          "Duplicate connection detected"
        );
      }

      onlineUsers.set(userId, socket.id);
      console.log(`👤 User ${userId} connected with socket ${socket.id}`);
      updateUnreadCounts(userId);
    });

    // Remove user from online users
    socket.on("removeUser", (userId) => {
      if (onlineUsers.get(userId) === socket.id) {
        onlineUsers.delete(userId);
        console.log(`👋 User ${userId} intentionally disconnected`);
      }
    });

    socket.on("sendMsg", (data) => {
      const { to, from, message } = data;

      if (to === from) {
        console.error("🚫 Cannot send message to self");
        return;
      }

      console.log(`📡 Broadcasting message from ${from} to ${to}`);

      const msgPayload = {
        message,
        from,
        to,
        createdAt: new Date().toISOString(),
        isRead: false,
      };

      const receiverSocketId = onlineUsers.get(to);
      if (receiverSocketId) {
        io.to(receiverSocketId).emit("receiveMsg", msgPayload);
        console.log(`📤 Forwarded to ${to} (socket ${receiverSocketId})`);
      }

      const senderSocketId = onlineUsers.get(from);
      if (senderSocketId) {
        io.to(senderSocketId).emit("receiveMsg", {
          ...msgPayload,
          fromSelf: true,
          isRead: true,
        });
      }

      // ❌ Do NOT call updateUnreadCounts or save to DB
    });

    // Mark messages as read
    socket.on("markAsRead", async (data) => {
      try {
        const { receiverID, senderId } = data;
        console.log(
          `📖 Marking messages as read between ${senderId} and ${receiverID}`
        );

        await Chats.updateMany(
          {
            chatUsers: { $all: [senderId, receiverID] },
            sender: senderId,
            isRead: false,
          },
          { $set: { isRead: true } }
        );

        updateUnreadCounts(receiverID);
        updateUnreadCounts(senderId);
      } catch (err) {
        console.error("Error marking messages as read:", err);
      }
    });

    // Handle disconnection
    socket.on("disconnect", () => {
      console.log(`🔥 Socket disconnected: ${socket.id}`);
      // Clean up online users map
      for (let [userId, socketId] of onlineUsers.entries()) {
        if (socketId === socket.id) {
          onlineUsers.delete(userId);
          console.log(`👋 User ${userId} disconnected`);
          break;
        }
      }
    });

    // Helper function to update unread counts
    async function updateUnreadCounts(userId) {
      try {
        const result = await Chats.aggregate([
          {
            $match: {
              chatUsers: userId,
              sender: { $ne: userId },
              isRead: false,
            },
          },
          { $group: { _id: "$sender", count: { $sum: 1 } } },
        ]);

        const unreadMessageCount = result.length;
        const userSocketId = onlineUsers.get(userId);

        if (userSocketId) {
          io.to(userSocketId).emit("unreadMessageCount", unreadMessageCount);
        }
      } catch (err) {
        console.error("Error updating unread counts:", err);
      }
    }
  });
};

export default socketHandler;
