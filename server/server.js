// import dotenv from "dotenv"; //to use environment variables
// import express from "express";
// const app = express(); //create an express app
// dotenv.config();

// import cookieParser from "cookie-parser";
// import cors from "cors";
// import "express-async-errors";
// import morgan from "morgan";

// //security packages
// import mongoSanitize from "express-mongo-sanitize";
// import helmet from "helmet";
// import xss from "xss-clean";

// import connectDB from "./database/connectDB.js"; //function to connect to the database
// //routes
// import authRoutes from "./routes/authRoutes.js";
// import chatRoutes from "./routes/chatRoutes.js";
// import contractRoutes from "./routes/contractRoutes.js";
// import emailSenderRoutes from "./routes/emailSenderRoutes.js";
// import ownerPropertyRoutes from "./routes/ownerPropertyRoutes.js";
// import ownerUserRoutes from "./routes/ownerUserRoutes.js";
// import ownerRentDetailRoutes from "./routes/rentDetailOwnerRoutes.js";
// import tenantRentDetailRoutes from "./routes/rentDetailTenantRoutes.js";
// import tenantPropertyRoutes from "./routes/tenantPropertyRoutes.js";
// import tenantUserRoutes from "./routes/tenantUserRoutes.js";


// import { Server } from "socket.io";
// import errorHandlerMiddleware from "./middleware/error-handler.js";
// import routeNotFoundMiddleware from "./middleware/route-not-found.js";
// import {
//   authorizeOwnerUser,
//   authorizeTenantUser,
// } from "./middleware/userAuthorization.js";
// import socketHandler from "./services/socketHandler.js";

// import path, { dirname } from "path";
// import { fileURLToPath } from "url";

// //using morgan for logging requests
// if (process.env.NODE_ENV !== "production") {
//   app.use(morgan("dev"));
// }

// //static folder for frontend build files in production mode only (to serve frontend files)
// const __dirname = dirname(fileURLToPath(import.meta.url));

// //set static folder for frontend build files
// app.use(express.static(path.resolve(__dirname, "../client/dist")));

// app.use(express.json()); //to parse json data
// app.use(helmet({ contentSecurityPolicy: false })); //secure headers
// app.use(xss()); //sanitize input , prevent cross site scripting
// app.use(mongoSanitize()); //prevents mongodb operator injection

// app.set("trust proxy", 1); //trust first proxy

// app.use(
//   cors({
//     origin: process.env.CLIENT_URL,
//     credentials: true,
//   })
// ); //to allow cross origin requests
// app.use(cookieParser()); //to parse cookies

// app.use(function (req, res, next) {
//   res.header("Content-Type", "application/json;charset=UTF-8");
//   res.header("Access-Control-Allow-Credentials", true);
//   res.header(
//     "Access-Control-Allow-Headers",
//     "Origin, X-Requested-With, Content-Type, Accept"
//   );
//   next();
// });

// app.use("/api/auth", authRoutes);
// app.use("/api/owner/real-estate", authorizeOwnerUser, ownerPropertyRoutes);
// app.use("/api/tenant/real-estate", authorizeTenantUser, tenantPropertyRoutes);

// app.use("/api/owner", authorizeOwnerUser, ownerUserRoutes);
// app.use("/api/tenant", authorizeTenantUser, tenantUserRoutes);

// app.use("/api/sendEmail", emailSenderRoutes); //send email

// app.use("/api/contract", contractRoutes);

// app.use("/api/rentDetail", authorizeOwnerUser, ownerRentDetailRoutes);
// app.use("/api/rentDetailTenant", authorizeTenantUser, tenantRentDetailRoutes);

// app.use("/api/chat", chatRoutes);

// //serve frontend files in production mode only

// app.get("*", (req, res) => {
//   res.sendFile(path.resolve(__dirname, "../client/dist", "index.html"));
// });

// app.use(errorHandlerMiddleware);
// app.use(routeNotFoundMiddleware);

// const PORT = process.env.PORT || 5500; //port number

// //start the server and connect to the database
// const start = async () => {
//   try {
//     await connectDB(process.env.MONGO_URI);
//   } catch (error) {
//     console.log(error);
//   }
// };
// start();

// const server = app.listen(PORT, () => {
//   console.log(`Server is running on port ${PORT}`);
// });

// // after your routes but before the catch-all route
// app.use((req, res, next) => {
//   console.log(`${req.method} ${req.path} - Route not found`);
//   next();
// });

// // Make sure your auth routes are properly mounted
// console.log("Auth routes mounted at /api/auth");

// // Socket.IO server initialization:
// const io = new Server(server, {
//   cors: {
//     origin: process.env.CLIENT_URL,
//     methods: ["GET", "POST"],
//     credentials: true,
//   },
//   transports: ["websocket", "polling"], // Explicitly set transports
//   pingTimeout: 60000,
//   pingInterval: 25000,
// });

// socketHandler(io);


import dotenv from "dotenv";
import express from "express";
const app = express();
dotenv.config();

import cookieParser from "cookie-parser";
import cors from "cors";
import "express-async-errors";
import morgan from "morgan";

//security packages
import mongoSanitize from "express-mongo-sanitize";
import helmet from "helmet";
import xss from "xss-clean";

import connectDB from "./database/connectDB.js";
//routes
import authRoutes from "./routes/authRoutes.js";
import chatRoutes from "./routes/chatRoutes.js";
import contractRoutes from "./routes/contractRoutes.js";
import emailSenderRoutes from "./routes/emailSenderRoutes.js";
import ownerPropertyRoutes from "./routes/ownerPropertyRoutes.js";
import ownerUserRoutes from "./routes/ownerUserRoutes.js";
import ownerRentDetailRoutes from "./routes/rentDetailOwnerRoutes.js";
import tenantRentDetailRoutes from "./routes/rentDetailTenantRoutes.js";
import tenantPropertyRoutes from "./routes/tenantPropertyRoutes.js";
import tenantUserRoutes from "./routes/tenantUserRoutes.js";
import adminRoutes from "./routes/adminRoutes.js"; 

import { Server } from "socket.io";
import errorHandlerMiddleware from "./middleware/error-handler.js";
import routeNotFoundMiddleware from "./middleware/route-not-found.js";
import {
  authorizeOwnerUser,
  authorizeTenantUser,
} from "./middleware/userAuthorization.js";
import socketHandler from "./services/socketHandler.js";

import path, { dirname } from "path";
import { fileURLToPath } from "url";

//using morgan for logging requests
if (process.env.NODE_ENV !== "production") {
  app.use(morgan("dev"));
}

//static folder for frontend build files in production mode only
const __dirname = dirname(fileURLToPath(import.meta.url));

// =============================================================================
// MIDDLEWARE SETUP (CORRECT ORDER)
// =============================================================================

app.use(express.json()); // MUST be before routes
app.use(helmet({ contentSecurityPolicy: false }));
app.use(xss());
app.use(mongoSanitize());

app.set("trust proxy", 1);

app.use(
  cors({
    origin: process.env.CLIENT_URL,
    credentials: true,
  })
);
app.use(cookieParser()); // MUST be before auth routes

app.use(function (req, res, next) {
  res.header("Content-Type", "application/json;charset=UTF-8");
  res.header("Access-Control-Allow-Credentials", true);
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept"
  );
  next();
});

// =============================================================================
// ROUTES SETUP (CORRECT ORDER)
// =============================================================================

// 1. Auth routes FIRST (no auth middleware needed)
app.use("/api/auth", authRoutes);

// 2. Email routes (might not need auth)
app.use("/api/sendEmail", emailSenderRoutes);

// 3. CONTRACT routes (check if these need auth)
app.use("/api/contract", contractRoutes);

// 4. CHAT routes (check if these need auth)
app.use("/api/chat", chatRoutes);

// 5. OWNER routes with auth middleware
app.use("/api/owner/real-estate", authorizeOwnerUser, ownerPropertyRoutes);
app.use("/api/owner", authorizeOwnerUser, ownerUserRoutes);
app.use("/api/rentDetail", authorizeOwnerUser, ownerRentDetailRoutes);

// 6. TENANT routes with auth middleware
app.use("/api/tenant/real-estate", authorizeTenantUser, tenantPropertyRoutes);
app.use("/api/tenant", authorizeTenantUser, tenantUserRoutes);
app.use("/api/rentDetailTenant", authorizeTenantUser, tenantRentDetailRoutes);

// 7. ADMIN routes (no auth middleware needed)
app.use("/api/admin", adminRoutes);

// =============================================================================
// DEBUGGING MIDDLEWARE (ADD THIS TEMPORARILY)
// =============================================================================

// Add this middleware to debug route matching
app.use((req, res, next) => {
  console.log(`🔍 REQUEST: ${req.method} ${req.path}`);
  console.log(`🔍 HEADERS:`, req.headers);
  console.log(`🔍 QUERY:`, req.query);
  next();
});

// =============================================================================
// STATIC FILES & FRONTEND (MUST BE AFTER API ROUTES)
// =============================================================================

// Serve static files AFTER API routes
app.use(express.static(path.resolve(__dirname, "../client/dist")));

// Catch-all route for frontend (MUST BE LAST)
app.get("*", (req, res) => {
  // Only serve frontend for non-API routes
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({ msg: "API route not found" });
  }
  res.sendFile(path.resolve(__dirname, "../client/dist", "index.html"));
});

// =============================================================================
// ERROR HANDLING (MUST BE LAST)
// =============================================================================

app.use(errorHandlerMiddleware);
app.use(routeNotFoundMiddleware);

const PORT = process.env.PORT || 5500;

const start = async () => {
  try {
    await connectDB(process.env.MONGO_URI);
    console.log("✅ Connected to MongoDB");
  } catch (error) {
    console.log("❌ MongoDB connection error:", error);
  }
};
start();

const server = app.listen(PORT, () => {
  console.log(`🚀 Server is running on port ${PORT}`);
  console.log(`🌐 API Base URL: http://localhost:${PORT}/api`);
});

// Socket.IO server initialization
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL,
    methods: ["GET", "POST"],
    credentials: true,
  },
  transports: ["websocket", "polling"],
  pingTimeout: 60000,
  pingInterval: 25000,
});

socketHandler(io);

// =============================================================================
// ADDITIONAL DEBUGGING - CHECK YOUR MIDDLEWARE FILES
// =============================================================================

/*
ISSUE: "Property was not found" suggests the route isn't being matched correctly.

POSSIBLE CAUSES:
1. Route not registered properly
2. Middleware blocking the request
3. Authentication failing
4. Route path mismatch

DEBUGGING STEPS:
1. Check if your tenantPropertyRoutes.js has the recommendations route
2. Verify authentication middleware is working
3. Check the exact URL you're hitting in Postman
4. Verify JWT token is valid
*/

// =============================================================================
// MIDDLEWARE DEBUGGING HELPERS
// =============================================================================

// Add this to your authorizeTenantUser middleware for debugging
const debugAuthMiddleware = (req, res, next) => {
  console.log("🔐 Auth Debug:");
  console.log("- Headers:", req.headers);
  console.log("- Cookies:", req.cookies);
  console.log("- Authorization:", req.headers.authorization);
  next();
};

// Use it like this in your routes:
// app.use("/api/tenant", debugAuthMiddleware, authorizeTenantUser, tenantUserRoutes);

// =============================================================================
// ROUTE TESTING HELPERS
// =============================================================================

// Add a simple test route to verify everything works
app.get("/api/test", (req, res) => {
  res.json({ 
    message: "Server is working!",
    timestamp: new Date().toISOString()
  });
});

// Add a protected test route
app.get("/api/tenant/test", authorizeTenantUser, (req, res) => {
  res.json({ 
    message: "Tenant auth is working!",
    user: req.user,
    timestamp: new Date().toISOString()
  });
});

export default app;