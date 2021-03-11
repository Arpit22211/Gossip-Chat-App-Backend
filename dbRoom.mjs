import mongoose from "mongoose";

const roomSchema= new mongoose.Schema({
  roomname:String,
});

export default mongoose.model("rooms",roomSchema);
