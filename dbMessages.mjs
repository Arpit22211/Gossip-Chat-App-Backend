import mongoose from "mongoose";

const watsappSchema= new mongoose.Schema({
  message:String,
  name:String,
  timestamp:String,
  received:Boolean,
  roomid:String,
  imgName:String,
});

export default mongoose.model("messagecontents",watsappSchema);
