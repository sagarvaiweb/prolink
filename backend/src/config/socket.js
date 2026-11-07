import jwt from "jsonwebtoken";
import { Server } from "socket.io";
import { User } from "../models/User.model.js";

let io;

export const initializeSocketServer = (httpServer) => {
  io = new Server(httpServer, {
    cors: {
      origin: process.env.FRONTEND_URL,
      credentials: true,
    },
  });

  io.use(async (socket, next) => {
    try {
      const authorization = socket.handshake.headers.authorization;
      const token = socket.handshake.auth?.token ??
        (authorization?.startsWith("Bearer ") ? authorization.slice(7) : null);

      if (!token) return next(new Error("Authentication required."));

      const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
      const user = await User.findById(decoded._id).select("_id accountStatus");
      if (!user || user.accountStatus !== "active") {
        return next(new Error("User account is not active."));
      }

      socket.data.userId = String(user._id);
      next();
    } catch {
      next(new Error("Invalid or expired access token."));
    }
  });

  io.on("connection", (socket) => {
    socket.join(socket.data.userId);
  });

  return io;
};

export const emitNotificationToUser = (userId, notification) => {
  io?.to(String(userId)).emit("notification:new", notification);
};
