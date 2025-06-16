import dotenv from "dotenv"; //to use environment variables
import express from "express";
const app = express(); //create an express app
dotenv.config();

import cookieParser from "cookie-parser";
import cors from "cors";
import "express-async-errors";
import morgan from "morgan";

//security packages
import mongoSanitize from "express-mongo-sanitize";
import helmet from "helmet";
import xss from "xss-clean";

import connectDB from "./database/connectDB.js"; //function to connect to the database
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

//static folder for frontend build files in production mode only (to serve frontend files)
const __dirname = dirname(fileURLToPath(import.meta.url));

//set static folder for frontend build files
app.use(express.static(path.resolve(__dirname, "../client/dist")));

app.use(express.json()); //to parse json data
app.use(helmet({ contentSecurityPolicy: false })); //secure headers
app.use(xss()); //sanitize input , prevent cross site scripting
app.use(mongoSanitize()); //prevents mongodb operator injection

app.set("trust proxy", 1); //trust first proxy

app.use(
  cors({
    origin: process.env.CLIENT_URL,
    credentials: true,
  })
); //to allow cross origin requests
app.use(cookieParser()); //to parse cookies

app.use(function (req, res, next) {
  res.header("Content-Type", "application/json;charset=UTF-8");
  res.header("Access-Control-Allow-Credentials", true);
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept"
  );
  next();
});

app.use("/api/auth", authRoutes);
app.use("/api/owner/real-estate", authorizeOwnerUser, ownerPropertyRoutes);
app.use("/api/tenant/real-estate", authorizeTenantUser, tenantPropertyRoutes);

app.use("/api/owner", authorizeOwnerUser, ownerUserRoutes);
app.use("/api/tenant", authorizeTenantUser, tenantUserRoutes);

app.use("/api/sendEmail", emailSenderRoutes); //send email

app.use("/api/contract", contractRoutes);

app.use("/api/rentDetail", authorizeOwnerUser, ownerRentDetailRoutes);
app.use("/api/rentDetailTenant", authorizeTenantUser, tenantRentDetailRoutes);

app.use("/api/chat", chatRoutes);

//serve frontend files in production mode only

app.get("*", (req, res) => {
  res.sendFile(path.resolve(__dirname, "../client/dist", "index.html"));
});

app.use(errorHandlerMiddleware);
app.use(routeNotFoundMiddleware);

const PORT = process.env.PORT || 5500; //port number

//start the server and connect to the database
const start = async () => {
  try {
    await connectDB(process.env.MONGO_URI);
  } catch (error) {
    console.log(error);
  }
};
start();

const server = app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

// after your routes but before the catch-all route
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path} - Route not found`);
  next();
});

// Make sure your auth routes are properly mounted
console.log('Auth routes mounted at /api/auth');

// Socket setup
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL,
    credentials: true,
  },
  connectionStateRecovery: {},
});

socketHandler(io);
