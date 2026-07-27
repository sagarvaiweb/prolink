import mongoose from "mongoose";

const connectDB = async ( ) => {
    try{
        const connect = await mongoose.connect(process.env.MONGO_URL) ;
        console.log("mongodb is connected  successfully") ;

       } catch(err){
        console.log("mongodb connection failed" , err) ;
        throw err
       }
}

export default connectDB ;
