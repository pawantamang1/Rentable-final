// // import { createContext, useEffect, useMemo, useState } from "react";
// // import { useSelector } from "react-redux";
// // import { socket } from "../socket";

// // export const SocketContext = createContext();

// // export const SocketProvider = ({ children }) => {
// //   const [socketMessage, setSocketMessage] = useState(null);
// //   const [unreadMessageCount, setUnreadMessageCount] = useState(0);
// //   const { user } = useSelector((store) => store.auth);

// //   //   test socekt connection
// //   // Add this to your SocketContext or a test component
// //   useEffect(() => {
// //     if (socket) {
// //       // Test ping
// //       socket.emit("ping", { test: "frontend test" });

// //       socket.on("pong", (data) => {
// //         console.log("✅ Socket server responded:", data);
// //       });

// //       socket.on("serverTest", (data) => {
// //         console.log("📡 Received server test:", data);
// //       });
// //     }
// //   }, [socket]);

// //   useEffect(() => {
// //     const onConnect = () => {
// //       socket.emit("addUser", user?._id);
// //     };
// //     socket.connect();
// //     socket.on("connect", onConnect);
// //     return () => {
// //       socket.off("connect", onConnect);
// //       socket.disconnect();
// //     };
// //   }, []);

// //   useEffect(() => {
// //     const handleReceiveMessage = (message) => {
// //       setSocketMessage({
// //         fromSelf: false,
// //         message: message.message,
// //         from: message.from,
// //         to: message.to,
// //       });
// //     };

// //     const handleUnreadMessageCount = (unreadMessageCount) => {
// //       setUnreadMessageCount(unreadMessageCount);
// //     };

// //     socket.on("receiveMsg", (message) => {
// //       handleReceiveMessage(message);
// //     });

// //     socket.on("unreadMessageCount", (unreadMessageCount) => {
// //       handleUnreadMessageCount(unreadMessageCount);
// //     });

// //     return () => {
// //       socket.off("receiveMsg", handleReceiveMessage);
// //       socket.off("unreadMessageCount", handleUnreadMessageCount);
// //     };
// //   }, []);

// //   const sendMessage = (sender, receiver, message) => {
// //     socket.emit("sendMsg", {
// //       to: receiver,
// //       from: sender,
// //       message,
// //     });
// //   };

// //   const value = useMemo(
// //     () => ({
// //       socketMessage,
// //       unreadMessageCount,
// //       sendMessage,
// //     }),
// //     [socket, socketMessage, unreadMessageCount]
// //   );

// //   return (
// //     <SocketContext.Provider value={value}>{children}</SocketContext.Provider>
// //   );
// // };

// import { createContext, useEffect, useMemo, useState } from "react";
// import { useSelector } from "react-redux";
// import { socket } from "../socket";

// export const SocketContext = createContext();

// export const SocketProvider = ({ children }) => {
//   const [socketMessage, setSocketMessage] = useState(null);
//   const [unreadMessageCount, setUnreadMessageCount] = useState(0);
//   const [isConnected, setIsConnected] = useState(false);
//   const { user } = useSelector((store) => store.auth);

//   // Connection management with auto-reconnect
//   useEffect(() => {
//     if (!user?._id) return;

//     const connectSocket = () => {
//       if (!socket.connected) {
//         console.log("🔌 Attempting socket connection...");
//         socket.connect();
//       }
//     };

//     const onConnect = () => {
//       console.log("✅ Socket connected, ID:", socket.id);
//       setIsConnected(true);
//       socket.emit("addUser", user._id);
//     };

//     const onDisconnect = (reason) => {
//       console.log("❌ Socket disconnected:", reason);
//       setIsConnected(false);
//       // Auto-reconnect after delay
//       setTimeout(connectSocket, 3000);
//     };

//     const onConnectError = (err) => {
//       console.error("🚨 Connection error:", err.message);
//       setIsConnected(false);
//     };

//     // Initial connection
//     connectSocket();

//     // Event listeners
//     socket.on("connect", onConnect);
//     socket.on("disconnect", onDisconnect);
//     socket.on("connect_error", onConnectError);

//     // Cleanup
//     return () => {
//       socket.off("connect", onConnect);
//       socket.off("disconnect", onDisconnect);
//       socket.off("connect_error", onConnectError);
//       socket.disconnect();
//     };
//   }, [user?._id]);

//   // Message handling with proper ID comparison
//   useEffect(() => {
//     const handleReceiveMessage = (message) => {
//       console.log("📥 New message:", {
//         from: message.from,
//         to: message.to,
//         content: message.message.substring(0, 20) + "...",
//       });

//       setSocketMessage({
//         fromSelf: message.from === user?._id, // Critical fix
//         message: message.message,
//         from: message.from,
//         to: message.to,
//         timestamp: message.timestamp || new Date(),
//         _id: message._id || `temp_${Date.now()}`,
//       });
//     };

//     const handleMessageConfirmation = (ack) => {
//       console.log("✔️ Message confirmed:", ack);
//     };

//     socket.on("receiveMsg", handleReceiveMessage);
//     socket.on("msgConfirmed", handleMessageConfirmation);

//     return () => {
//       socket.off("receiveMsg", handleReceiveMessage);
//       socket.off("msgConfirmed", handleMessageConfirmation);
//     };
//   }, [user?._id]);

//   // Connection health monitoring
//   useEffect(() => {
//     if (!isConnected) return;

//     const heartbeat = setInterval(() => {
//       socket.emit("ping", {
//         userId: user?._id,
//         timestamp: new Date().toISOString(),
//       });
//     }, 25000); // 25 seconds

//     return () => clearInterval(heartbeat);
//   }, [isConnected, user?._id]);

//   const sendMessage = (receiverId, message) => {
//     if (!isConnected || !user?._id) {
//       console.error("❌ Send failed - no connection/user");
//       return false;
//     }

//     const tempId = `temp_${Date.now()}`;
//     console.log("📤 Sending message with temp ID:", tempId);

//     socket.emit("sendMsg", {
//       to: receiverId,
//       from: user._id,
//       message,
//       tempId,
//       timestamp: new Date(),
//     });

//     return tempId; // Return temp ID for optimistic updates
//   };

//   const markAsRead = (chatPartnerId) => {
//     if (!isConnected || !user?._id) return false;

//     console.log("📖 Marking as read with:", {
//       receiverId: user._id,
//       senderId: chatPartnerId,
//     });

//     socket.emit("markAsRead", {
//       receiverID: user._id,
//       senderId: chatPartnerId,
//     });

//     return true;
//   };

//   const value = useMemo(
//     () => ({
//       isConnected,
//       socketMessage,
//       unreadMessageCount,
//       sendMessage,
//       markAsRead,
//       socket, // For debugging
//       connectionStatus: isConnected ? "online" : "offline",
//     }),
//     [isConnected, socketMessage, unreadMessageCount]
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

  // Connection management with auto-reconnect and enhanced logging
  useEffect(() => {
    if (!user?._id) {
      console.log("⏸️ No user ID - skipping socket connection");
      return;
    }

    console.log("🔄 Initializing socket connection for user:", user._id);

    const connectSocket = () => {
      if (!socket.connected) {
        console.log("🔌 Attempting socket connection...");
        socket.connect();
      } else {
        console.log("ℹ️ Socket already connected");
      }
    };

    // Add delay before initial connection attempt
    const connectTimeout = setTimeout(connectSocket, 1000);

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
      console.log("Connection details:", {
        url: socket.io.uri,
        connected: socket.connected,
        id: socket.id,
      });
      setIsConnected(false);
    };

    const onReconnectAttempt = (attempt) => {
      console.log(`🔁 Reconnection attempt ${attempt}`);
    };

    const onReconnectFailed = () => {
      console.error("💀 Reconnection failed");
    };

    // Debug all socket events
    const onAnyEvent = (event, ...args) => {
      if (!event.includes("ping") && !event.includes("pong")) {
        console.log(`📡 [${event}]`, args);
      }
    };

    // Add event listeners
    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);
    socket.on("connect_error", onConnectError);
    socket.on("reconnect_attempt", onReconnectAttempt);
    socket.on("reconnect_failed", onReconnectFailed);
    socket.onAny(onAnyEvent);

    // Cleanup function
    return () => {
      console.log("🧹 Cleaning up socket listeners");
      clearTimeout(connectTimeout);
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
      socket.off("connect_error", onConnectError);
      socket.off("reconnect_attempt", onReconnectAttempt);
      socket.off("reconnect_failed", onReconnectFailed);
      socket.offAny(onAnyEvent);
      if (socket.connected) {
        socket.disconnect();
      }
    };
  }, [user?._id]);

  // Message handling with proper ID comparison
  useEffect(() => {
    if (!isConnected) return;

    const handleReceiveMessage = (message) => {
      console.log("📥 New message:", {
        from: message.from,
        to: message.to,
        content: message.message.substring(0, 20) + "...",
      });

      setSocketMessage({
        fromSelf: message.from === user?._id,
        message: message.message,
        from: message.from,
        to: message.to,
        timestamp: message.timestamp || new Date(),
        _id: message._id || `temp_${Date.now()}`,
      });
    };

    const handleUnreadCountUpdate = (count) => {
      console.log("🔢 Unread count updated:", count);
      setUnreadMessageCount(count);
    };

    socket.on("receiveMsg", handleReceiveMessage);
    socket.on("unreadMessageCount", handleUnreadCountUpdate);

    return () => {
      socket.off("receiveMsg", handleReceiveMessage);
      socket.off("unreadMessageCount", handleUnreadCountUpdate);
    };
  }, [isConnected, user?._id]);

  // Connection health monitoring
  useEffect(() => {
    if (!isConnected) return;

    const heartbeat = setInterval(() => {
      socket.emit("ping", {
        userId: user?._id,
        timestamp: new Date().toISOString(),
      });
    }, 25000); // 25 seconds

    return () => clearInterval(heartbeat);
  }, [isConnected, user?._id]);

  const sendMessage = (receiverId, message) => {
    if (!isConnected || !user?._id) {
      console.error("❌ Send failed - no connection/user");
      return false;
    }

    const tempId = `temp_${Date.now()}`;
    console.log("📤 Sending message with temp ID:", tempId);

    socket.emit("sendMsg", {
      to: receiverId,
      from: user._id,
      message,
      tempId,
      timestamp: new Date(),
    });

    return tempId;
  };

  const markAsRead = (chatPartnerId) => {
    if (!isConnected || !user?._id) {
      console.error("❌ Mark as read failed - no connection/user");
      return false;
    }

    console.log("📖 Marking as read with:", {
      receiverId: user._id,
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
      socket, // Expose socket for debugging
      connectionStatus: isConnected ? "online" : "offline",
    }),
    [isConnected, socketMessage, unreadMessageCount]
  );

  return (
    <SocketContext.Provider value={value}>{children}</SocketContext.Provider>
  );
};
