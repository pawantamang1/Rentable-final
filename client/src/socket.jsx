import { io } from "socket.io-client";

// Determine the socket URL based on environment
const getSocketUrl = () => {
  // In development, try direct connection first
  if (import.meta.env.DEV) {
    return import.meta.env.VITE_APP_API_HOST || "http://localhost:5500";
  }

  // In production, use relative path (same origin)
  return window.location.origin;
};

const socketUrl = getSocketUrl();
console.log("🔧 Socket connecting to:", socketUrl);

export const socket = io(socketUrl, {
  transports: ["websocket", "polling"], // Try both transports
  timeout: 20000,
  reconnection: true,
  reconnectionDelay: 1000,
  reconnectionAttempts: 5,
  maxReconnectionAttempts: 5,
  forceNew: false,
  autoConnect: false, // Don't auto-connect, we'll do it manually

  // Additional options that might help
  upgrade: true,
  rememberUpgrade: true,
});

// Add debug listeners
socket.on("connect", () => {
  console.log("🟢 Socket connected with ID:", socket.id);
  console.log("🌐 Connected to:", socketUrl);
});

socket.on("disconnect", (reason) => {
  console.log("🔴 Socket disconnected:", reason);
});

socket.on("connect_error", (error) => {
  console.error("🚨 Socket connection error:", error);
  console.log("❓ Trying to connect to:", socketUrl);

  // Log additional debugging info
  console.log("🔍 Error details:", {
    message: error.message,
    description: error.description,
    context: error.context,
    type: error.type,
  });
});

socket.on("reconnect", (attemptNumber) => {
  console.log("🔄 Socket reconnected after", attemptNumber, "attempts");
});

socket.on("reconnect_error", (error) => {
  console.error("🚨 Socket reconnection error:", error);
});

socket.on("reconnect_failed", () => {
  console.error("💀 Socket failed to reconnect");
});
