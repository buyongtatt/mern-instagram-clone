import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import Pusher from "pusher";
import dotenv from "dotenv";
import dbModel from "./dbModel.js";

// app config
const app = express();
const port = process.env.PORT || 8080;
dotenv.config();

const pusher = new Pusher({
  appId: "1167262",
  key: "7823e11a4ac99b94b3a5",
  secret: "a22da47e6fd861d49526",
  cluster: "ap1",
  useTLS: true,
});

// middleware
app.use(express.json());
app.use(cors());

// db config
const connection_url = process.env.URI;
mongoose.connect(connection_url, {
  useCreateIndex: true,
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

mongoose.connection.once("open", () => {
  console.log("DB Connected");

  const changeStream = mongoose.connection.collection("posts").watch();

  changeStream.on("change", (change) => {
    console.log("Change Triggered on pusher");
    console.log(change);
    console.log("End of Change");

    if (change.operationType === "insert") {
      console.log("Triggering Pusher ***IMG UPLOAD***");

      const postDetails = change.fullDocument;
      pusher.trigger("posts", "inserted", {
        user: postDetails.user,
        caption: postDetails.caption,
        image: postDetails.image,
      });
    } else {
      console.log("Unknown trigger from Pusher");
    }
  });
});

// api routes
app.get("/", (req, res) => {
  res.status(200).send("hello world");
});

app.post("/upload", (req, res) => {
  const body = req.body;

  dbModel.create(body, (err, data) => {
    if (err) {
      res.status(500).send(err);
    } else {
      res.status(201).send(data);
    }
  });
});

app.get("/sync", (req, res) => {
  dbModel.find((err, data) => {
    if (err) {
      res.status(500).send(err);
    } else {
      res.status(200).send(data);
    }
  });
});

// listener
app.listen(port, () => {
  console.log("listening in port: " + port);
});
