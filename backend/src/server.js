import dotenv from "dotenv";
import app from "./app.js";
import connectDB from "./config/db.js";

dotenv.config() ;


const PORT = process.env.PORT || 5000 ;

const startServer = async ()=>{
 try{
    await connectDB() ;

    app.listen(PORT ,()=>{
    console.log(`server is running on port ${PORT}`) ; })

 } catch(err){
    console.log("server failed to start" , err) ;
 }

}

startServer() ;