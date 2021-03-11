import express from "express";
import mongoose from "mongoose";
import Messages from "./dbMessages.mjs";
import Rooms from "./dbRoom.mjs";
import Pusher from "pusher";
import bodyParser from "body-parser";
import fileUpload from "express-fileupload";
import {dirname} from "path";
import {fileURLToPath} from 'url';
//app config
const app=express();


const port= process.env.PORT || 9000;

const pusher = new Pusher({
  appId: '1080099',
  key: 'a1020590fce419779207',
  secret: 'bb40b67b7c870737f472',
  cluster: 'eu',
  encrypted: true
});

//middleware
app.use(express.json());
app.use(fileUpload());
app.use(bodyParser.urlencoded({extended:true}));
app.use((req,res,next)=>{
  res.setHeader("Access-Control-Allow-Origin","*");
  res.setHeader("Access-Control-Allow-Headers","*");
  next();
});

mongoose.connect("mongodb+srv://admin:FxEVjtLOkxPKl5xj@cluster0.5ogj6.mongodb.net/watsappDB?retryWrites=true&w=majority",{
useNewUrlParser:true,
useUnifiedTopology:true,
useCreateIndex:true,
});

const db=mongoose.connection;
db.once('open',()=>{
  console.log("DB Connected");
// same as dbMessages.js
  const msgCollection=db.collection("messagecontents");
  const changeStream=msgCollection.watch();

  changeStream.on("change",(change)=>{
    console.log("A change occured",change);

    if(change.operationType==='insert'){
      const messageDetails= change.fullDocument;
      pusher.trigger('messages','inserted',
        {
          name:messageDetails.name,
          message:messageDetails.message,
          timestamp:messageDetails.timestamp,
          received:messageDetails.received,
          roomid:messageDetails.roomid,
          imgName:messageDetails.imgName,
        }
    );
    }
    else{
      console.log("err triggering pusher");
    }
  });

  const roomCollection=db.collection("rooms");
  const changeStream1=roomCollection.watch();

  changeStream1.on("change",(change)=>{
    console.log("A change occured",change);

    if(change.operationType==='insert'){
      const roomDetails= change.fullDocument;
      pusher.trigger('rooms','inserted',
        {
          roomname:roomDetails.roomname,
        }
    );
    }
    else{
      console.log("err triggering pusher");
    }
  });
});

app.use(express.json());
//api routes base URL
app.get("/",(req,res)=>res.status(200).send("Server Started"));

app.get("/messages/sync",(req,res)=>{
  Messages.find((err,data)=>{
    if(err){
     res.status(500).send(err);
   }
   else{
     res.status(200).send(data);
   }
  });
});

app.get("/rooms/sync",(req,res)=>{
  Rooms.find((err,data)=>{
    if(err){
     res.status(500).send(err);
   }
   else{
     res.status(200).send(data);
   }
  });
});

app.get("/rooms/:roomId",(req,res)=>{

  Rooms.findOne({_id:req.params.roomId},(err,data)=>{
    if(err){
     res.status(500).send(err);
    }
    else{
     res.status(200).send(data);
    }
  });
  });

const __dirname=dirname(fileURLToPath(import.meta.url));

app.post('/upload',(req,res)=>{
  if(req.files===null){
    return res.status(400).json({msg:'No file uploaded'});
  }

  const file=req.files.file;
  file.mv(`${__dirname}/../watsapp-mern/public/uploads/${file.name}`,err=>{
  if(err){
    console.error(err);
    return res.status(500).send(err);
  }

  res.json({fileName:file.name,filePath:`/uploads/${file.name}`});
});
});

app.post("/messages/new",(req,res)=>{
  const dbMessage=req.body;
  Messages.create(dbMessage,(err,data)=>{
    if(err){
      res.status(500).send(err);
    }
    else{
      res.status(201).send(data);
    }
  });
});

app.post("/rooms/new",(req,res)=>{
  const dbRoom=req.body;
  Rooms.create(dbRoom,(err,data)=>{
    if(err){
      res.status(500).send(err);
    }
    else{
      res.status(201).send(data);
    }
  });
});
//listen
app.listen(port, ()=>console.log(`Listening on localhost:${port}`));
