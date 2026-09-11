import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import errorHandler from "./middlewares/error.middleware.js";
import authRoutes from "./modules/auth/auth.routes.js" ;
import userRoutes from "./modules/user/user.routes.js" ;

const app = express() ;

// middlewares 

app.use(express.json()) ;
app.use(express.urlencoded({extended:true})) ;
app.use( cors({
    origin: "http://localhost:3000", // exact frontend origin
    credentials: true, // allows cookies to be sent/received
  })) ;
app.use(cookieParser()) ;


// routes
app.use("/api/auth", authRoutes); 
app.use("/api/users", userRoutes);  

// error handler middleware i.e always remain at the last of all middlewares
app.use(errorHandler) ;

export default app ;