import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import errorHandler from "./middlewares/error.middleware.js";
import authRoutes from "./modules/auth/auth.routes.js" ;

const app = express() ;

// middlewares 

app.use(express.json()) ;
app.use(express.urlencoded({extended:true})) ;
app.use(cors()) ;
app.use(cookieParser()) ;


// routes
app.use("/api/auth", authRoutes);   

// error handler middleware i.e always remain at the last of all middlewares
app.use(errorHandler) ;

export default app ;