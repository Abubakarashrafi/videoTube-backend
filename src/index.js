require('dotenv').config();
const express = require("express");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const app = express();
const connectDB = require("./db/connect");

app.use(
  cors({
    origin: process.env.CORS_ORIGIN,
    Credential: true,
  })
);

app.use(express.json({ limit: "16kb" }));

app.use(
  express.urlencoded({
    extended: true,
    limit: "16kb",
  })
);

app.use(express.static("public"));
app.use(cookieParser());

const userRouter = require("./routes/user.router");
app.use("/api/v1/", userRouter);

const tweetsRouter = require("./routes/tweets.router");
app.use("/api/v1/",tweetsRouter);

const playlistRouter = require("./routes/playlist.router");
app.use("/api/v1/",playlistRouter);

const commentRouter = require("./routes/comment.router");
app.use("/api/v1/",commentRouter);

const videoRouter = require("./routes/video.router");
app.use("/api/v1/",videoRouter);

const likeRouter = require("./routes/likes.router");
app.use("/api/v1/",likeRouter);

const subscriptionRoute = require("./routes/subscription.router");
app.use("/api/v1/",subscriptionRoute);

const dashboardRouter = require("./routes/dashboard.router");
app.use("/api/v1/",dashboardRouter);


const server = async ()=>{
    try {
        await connectDB()
        console.log("Database connected");
        app.listen(process.env.PORT || 4000,()=>{
            console.log(
              `Server is running at port http://localhost:${process.env.PORT}`
            );
        })
    } catch (error) {
        console.log("Database connected fail",error);
    }
}
server();  