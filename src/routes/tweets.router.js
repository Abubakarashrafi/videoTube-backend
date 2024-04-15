const express = require("express");
const tweetsRouter = express.Router();
const tweet = require("../controllers/tweet.controller");
const verifyToken = require("../middleware/auth.middleware");

tweetsRouter.route("/tweet").post(verifyToken,tweet.createTweet);
tweetsRouter.route("/tweet/:tweetId").get(verifyToken,tweet.getTweet);
tweetsRouter.route("/tweet").get(verifyToken,tweet.getUserTweet);
tweetsRouter.route("/tweet/:tweetId").patch(verifyToken,tweet.updateTweet);
tweetsRouter.route("/tweet/:tweetId").delete(verifyToken,tweet.deleteTweet);


module.exports = tweetsRouter;