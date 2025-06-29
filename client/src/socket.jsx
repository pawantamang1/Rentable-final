
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
  withCredentials: true,
  transports: ["websocket", "polling"],
  reconnection: true,
  reconnectionAttempts: 5,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 5000,
  autoConnect: false,
  forceNew: true,
  timeout: 20000,
  pingTimeout: 60000,
  pingInterval: 25000,
});

// Global connection events
socket.on("connect", () => {
  console.log("🟢 [Global] Socket connected with ID:", socket.id);
});

socket.on("disconnect", (reason) => {
  console.log("🔴 [Global] Socket disconnected:", reason);
});

socket.on("connect_error", (error) => {
  console.error("🚨 [Global] Socket connection error:", error.message);
  console.log("Connection details:", {
    url: socket.io.uri,
    connected: socket.connected,
    id: socket.id,
  });
});

socket.on("reconnect_attempt", (attempt) => {
  console.log(`🔁 [Global] Reconnection attempt ${attempt}`);
});

socket.on("reconnect_failed", () => {
  console.error("💀 [Global] Reconnection failed");
});

// Debug all events (except ping/pong)
socket.onAny((event, ...args) => {
  if (!event.includes("ping") && !event.includes("pong")) {
    console.log(`📡 [Global][${event}]`, args);
  }
});
