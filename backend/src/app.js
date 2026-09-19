import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import passport from "./config/passport.js";
import errorHandler from "./middlewares/error.middleware.js";
import authRoutes from "./modules/auth/auth.routes.js" ;
import userRoutes from "./modules/user/user.routes.js" ;
import networkingRoutes from "./modules/networking/networking.routes.js";
import notificationRoutes from "./modules/notification/notification.routes.js";

const app = express() ;

// middlewares 

app.use(express.json()) ;
app.use(express.urlencoded({extended:true})) ;
app.use( cors({
    origin: process.env.FRONTEND_URL, // exact frontend origin
    credentials: true, // allows cookies to be sent/received
  })) ;

app.use(cookieParser()) ;
app.use(passport.initialize()); 


// routes
app.use("/api/auth", authRoutes); 
app.use("/api/users", userRoutes);  
app.use("/api/networking", networkingRoutes);
app.use("/api/notifications", notificationRoutes);

// error handler middleware i.e always remain at the last of all middlewares
app.use(errorHandler) ;

export default app ;
