import mongoose from "mongoose";
import { ensureNotificationIndexes } from "../models/Notification.model.js";

const connectDB = async ( ) => {
    try{
        const connect = await mongoose.connect(process.env.MONGO_URL) ;
        await ensureNotificationIndexes();
        console.log("mongodb is connected  successfully") ;

       } catch(err){
        console.log("mongodb connection failed" , err) ;
        throw err
       }
}

export default connectDB ;
