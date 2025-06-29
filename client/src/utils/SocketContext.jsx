// import { createContext, useEffect, useMemo, useState } from "react";
// import { useSelector } from "react-redux";
// import { socket } from "../socket";

// export const SocketContext = createContext();

// export const SocketProvider = ({ children }) => {
//   const [socketMessage, setSocketMessage] = useState(null);
//   const [unreadMessageCount, setUnreadMessageCount] = useState(0);
//   const { user } = useSelector((store) => store.auth);

//   //   test socekt connection
//   // Add this to your SocketContext or a test component
//   useEffect(() => {
//     if (socket) {
//       // Test ping
//       socket.emit("ping", { test: "frontend test" });

//       socket.on("pong", (data) => {
//         console.log("✅ Socket server responded:", data);
//       });

//       socket.on("serverTest", (data) => {
//         console.log("📡 Received server test:", data);
//       });
//     }
//   }, [socket]);

//   useEffect(() => {
//     const onConnect = () => {
//       socket.emit("addUser", user?._id);
//     };
//     socket.connect();
//     socket.on("connect", onConnect);
//     return () => {
//       socket.off("connect", onConnect);
//       socket.disconnect();
//     };
//   }, []);

//   useEffect(() => {
//     const handleReceiveMessage = (message) => {
//       setSocketMessage({
//         fromSelf: false,
//         message: message.message,
//         from: message.from,
//         to: message.to,
//       });
//     };

//     const handleUnreadMessageCount = (unreadMessageCount) => {
//       setUnreadMessageCount(unreadMessageCount);
//     };

//     socket.on("receiveMsg", (message) => {
//       handleReceiveMessage(message);
//     });

//     socket.on("unreadMessageCount", (unreadMessageCount) => {
//       handleUnreadMessageCount(unreadMessageCount);
//     });

//     return () => {
//       socket.off("receiveMsg", handleReceiveMessage);
//       socket.off("unreadMessageCount", handleUnreadMessageCount);
//     };
//   }, []);

//   const sendMessage = (sender, receiver, message) => {
//     socket.emit("sendMsg", {
//       to: receiver,
//       from: sender,
//       message,
//     });
//   };

//   const value = useMemo(
//     () => ({
//       socketMessage,
//       unreadMessageCount,
//       sendMessage,
//     }),
//     [socket, socketMessage, unreadMessageCount]
//   );

//   return (
//     <SocketContext.Provider value={value}>{children}</SocketContext.Provider>
//   );
// };

import { createContext, useEffect, useMemo, useState } from "react";
import { useSelector } from "react-redux";
import { socket } from "../socket";

export const SocketContext = createContext();

export const SocketProvider = ({ children }) => {
  const [socketMessage, setSocketMessage] = useState(null);
  const [unreadMessageCount, setUnreadMessageCount] = useState(0);
  const [isConnected, setIsConnected] = useState(false);
  const { user } = useSelector((store) => store.auth);

  // Connection management
  useEffect(() => {
    if (!user?._id) return;

    console.log("🔄 Initializing socket connection for user:", user._id);

    const connectSocket = () => {
      if (!socket.connected) {
        console.log("🔌 Attempting socket connection...");
        socket.connect();
      }
    };

    // Clean up any existing connection
    if (socket.connected) {
      socket.emit("removeUser", user._id);
      socket.disconnect();
    }

    // Initial connection with delay
    const connectTimeout = setTimeout(connectSocket, 500);

    const onConnect = () => {
      console.log("✅ Socket connected, ID:", socket.id);
      setIsConnected(true);
      socket.emit("addUser", user._id);
    };

    const onDisconnect = (reason) => {
      console.log("❌ Socket disconnected:", reason);
      setIsConnected(false);
      // Auto-reconnect after delay
      setTimeout(connectSocket, 3000);
    };

    const onConnectError = (err) => {
      console.error("🚨 Connection error:", err.message);
      setIsConnected(false);
    };

    // Message handlers
    const handleReceiveMessage = (message) => {
      console.log("📥 Received message:", {
        from: message.from,
        to: message.to,
        currentUser: user._id,
        isSelf: message.from === user._id,
        content: message.message.substring(0, 20) + "...",
      });
      setSocketMessage({
        ...message,
        fromSelf: message.from === user._id,
      });
    };

    const handleUnreadCount = (count) => {
      console.log("🔢 Unread count updated:", count);
      setUnreadMessageCount(count);
    };

    // Add event listeners
    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);
    socket.on("connect_error", onConnectError);
    socket.on("receiveMsg", handleReceiveMessage);
    socket.on("unreadMessageCount", handleUnreadCount);

    // Cleanup
    return () => {
      console.log("🧹 Cleaning up socket listeners");
      clearTimeout(connectTimeout);
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
      socket.off("connect_error", onConnectError);
      socket.off("receiveMsg", handleReceiveMessage);
      socket.off("unreadMessageCount", handleUnreadCount);
      socket.emit("removeUser", user._id);
      socket.disconnect();
    };
  }, [user?._id]);

  const sendMessage = (receiverId, message) => {
    if (!isConnected || !user?._id) {
      console.error("❌ Send failed - no connection/user");
      return false;
    }

    console.log("📤 Sending message to:", receiverId);
    socket.emit("sendMsg", {
      to: receiverId,
      from: user._id,
      message,
      timestamp: new Date(),
    });

    return true;
  };

  const markAsRead = (chatPartnerId) => {
    if (!isConnected || !user?._id) return false;

    console.log("📖 Marking as read with:", {
      receiverID: user._id,
      senderId: chatPartnerId,
    });

    socket.emit("markAsRead", {
      receiverID: user._id,
      senderId: chatPartnerId,
    });

    return true;
  };

  const value = useMemo(
    () => ({
      isConnected,
      socketMessage,
      unreadMessageCount,
      sendMessage,
      markAsRead,
      socket,
    }),
    [isConnected, socketMessage, unreadMessageCount]
  );

  return (
    <SocketContext.Provider value={value}>{children}</SocketContext.Provider>
  );
};
