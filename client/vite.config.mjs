import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    host: true, // Allow external connections (helps with networking issues)
    proxy: {
      "/api": {
        target: "http://localhost:5500",
        changeOrigin: true,
        secure: false,
      },
      // Optional: Proxy Socket.IO if you want (though direct connection usually works better)
      "/socket.io": {
        target: "http://localhost:5500",
        changeOrigin: true,
        secure: false,
        ws: true, // Enable WebSocket proxying
      },
    },
  },
  // Ensure Socket.IO client works properly
  define: {
    global: "globalThis",
  },
});
