// import { useContext, useEffect, useState } from "react";
// import { useSelector } from "react-redux";
// import { socket } from "../socket";
// import { SocketContext } from "./SocketContext";

// const SocketDebugger = () => {
//   const { isConnected, socketMessage } = useContext(SocketContext);
//   const { user } = useSelector((state) => state.auth);
//   const [logs, setLogs] = useState([]);
//   const [testMessage, setTestMessage] = useState("");

//   const addLog = (message, type = "info") => {
//     const timestamp = new Date().toLocaleTimeString();
//     setLogs((prev) => [...prev.slice(-10), { message, type, timestamp }]); // Keep last 10 logs
//   };

//   useEffect(() => {
//     addLog(
//       `Socket connected: ${isConnected}`,
//       isConnected ? "success" : "error"
//     );
//   }, [isConnected]);

//   useEffect(() => {
//     if (socketMessage) {
//       addLog(`Received message: ${socketMessage.message}`, "success");
//     }
//   }, [socketMessage]);

//   const testConnection = () => {
//     addLog("Testing connection...", "info");
//     socket.emit("ping", { test: "debug test", userId: user?._id });
//   };

//   const sendTestMessage = () => {
//     if (!testMessage.trim()) return;

//     addLog(`Sending test message: ${testMessage}`, "info");
//     socket.emit("testMessage", { message: testMessage, from: user?._id });
//     setTestMessage("");
//   };

//   return (
//     <div className="fixed bottom-4 right-4 bg-white border rounded-lg shadow-lg p-4 max-w-sm z-50">
//       <div className="flex items-center gap-2 mb-2">
//         <div
//           className={`w-3 h-3 rounded-full ${
//             isConnected ? "bg-green-500" : "bg-red-500"
//           }`}
//         ></div>
//         <span className="font-semibold">Socket Status</span>
//       </div>

//       <div className="text-sm mb-2">
//         <p>Connected: {isConnected ? "✅" : "❌"}</p>
//         <p>User ID: {user?._id || "Not logged in"}</p>
//         <p>Socket ID: {socket?.id || "None"}</p>
//         <p>API Host: {import.meta.env.VITE_APP_API_HOST || "Not set"}</p>
//       </div>

//       <div className="mb-2">
//         <button
//           onClick={testConnection}
//           className="bg-blue-500 text-white px-2 py-1 rounded text-xs mr-2"
//         >
//           Test Ping
//         </button>
//       </div>

//       <div className="mb-2">
//         <input
//           type="text"
//           value={testMessage}
//           onChange={(e) => setTestMessage(e.target.value)}
//           placeholder="Test message"
//           className="border rounded px-2 py-1 text-xs w-full mb-1"
//         />
//         <button
//           onClick={sendTestMessage}
//           className="bg-green-500 text-white px-2 py-1 rounded text-xs"
//           disabled={!testMessage.trim()}
//         >
//           Send Test
//         </button>
//       </div>

//       <div className="max-h-32 overflow-y-auto">
//         <div className="text-xs">
//           <strong>Logs:</strong>
//           {logs.map((log, index) => (
//             <div
//               key={index}
//               className={`${
//                 log.type === "success"
//                   ? "text-green-600"
//                   : log.type === "error"
//                   ? "text-red-600"
//                   : "text-gray-600"
//               }`}
//             >
//               [{log.timestamp}] {log.message}
//             </div>
//           ))}
//         </div>
//       </div>
//     </div>
//   );
// };

// export default SocketDebugger;
