import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import errorHandler from "./middlewares/error.middleware.js" ;

const app = express() ;

// middlewares 

app.use(express.json()) ;
app.use(express.urlencoded({extended:true})) ;
app.use(cors()) ;
app.use(cookieParser()) ;


app.use(errorHandler) ;

export default app ;