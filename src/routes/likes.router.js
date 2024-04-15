const express = require("express");
const likeRouter = express.Router();
const like = require("../controllers/like.controller");
const verifyToken = require("../middleware/auth.middleware");

likeRouter.route("/like/video/:videoId").post(verifyToken,like.toggleVideoLike);
likeRouter.route("/like/comment/:commentId").post(verifyToken,like.toggleCommentLike);
likeRouter.route("/like/tweet/:tweetId").post(verifyToken,like.toggleTweetLike);
likeRouter.route("/like").get(verifyToken,like.getLikedVideos);


module.exports = likeRouter;