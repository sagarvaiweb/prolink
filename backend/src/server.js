import "dotenv/config"
import { createServer } from "node:http";
import app from "./app.js";
import connectDB from "./config/db.js";
import { initializeSocketServer } from "./config/socket.js";
import { scheduleDailySnapshot } from "./modules/dashboard/snapshot.service.js";


const PORT = process.env.PORT || 5000 ;

const startServer = async ()=>{
 try{
    await connectDB() ;
    scheduleDailySnapshot();

    const httpServer = createServer(app);
    initializeSocketServer(httpServer);
    httpServer.listen(PORT ,()=>{
    console.log(`server is running on port ${PORT}`) ; })

 } catch(err){
    console.log("server failed to start" , err) ;
 }

}

startServer() ;
