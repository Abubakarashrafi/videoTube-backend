const mongoose = require("mongoose");
const Like = require("../models/likes.model");
const Video = require("../models/video.model");
const Comment = require("../models/comment.model");
const Tweet = require("../models/tweets.model");
const asyncHandler = require("../utils/asyncHandler");
const ApiError = require("../utils/ApiError");
const ApiResponce = require("../utils/ApiResponce");

const toggleVideoLike = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  const userId = req.user._id;
  //TODO: toggle like on video
  if (!mongoose.isValidObjectId(videoId)) {
    throw new ApiError(400, "video id is not valid videoId");
  }
  const video = await Video.findById(videoId);
  if (!video || !video.isPublished) {
    throw new ApiError(400, "no such video exist");
  }
  const isLiked = await Like.findOne({ likedBy: userId, video: videoId });
  if (isLiked) {
    await Like.deleteOne(isLiked);
    return res
      .status(201)
      .json(new ApiResponce(isLiked, 200, "like removed successfully"));
  }
  const like = await Like.create({
    likedBy: userId,
    video: videoId,
  });
  return res.status(201).json(new ApiResponce(like, 200, "liked successfully"));
});

const toggleCommentLike = asyncHandler(async (req, res) => {
  const { commentId } = req.params;
  if (!mongoose.isValidObjectId(commentId)) {
    throw new ApiError(400, "comment id is not valid object id");
  }
  const comment = await Comment.findById(commentId);
  if (!comment) {
    throw new ApiError(400, "no such comment found");
  }
  const isLiked = await Like.find({
    likedBy: req.user._id,
    comment: commentId,
  });
  console.log(isLiked);
  if (isLiked.length) {
    const disliked = await Like.findOneAndDelete(isLiked);
    if (!disliked) {
      throw new ApiError(400, "failed to remove like");
    }
    return res
      .status(201)
      .json(new ApiResponce(disliked, 200, "like removed successfully"));
  } else {
    const like = await Like.create({
      likedBy: req.user._id,
      comment: commentId,
    });
    if (!like) {
      throw new ApiError(400, "failed to like");
    }
    return res
      .status(201)
      .json(new ApiResponce(like, 200, "like added successfully"));
  }
});

const toggleTweetLike = asyncHandler(async (req, res) => {
  const { tweetId } = req.params;
  if (!mongoose.isValidObjectId(tweetId)) {
    throw new ApiError(400, "tweet id is not valid object id");
  }
  const tweet = await Tweet.findById(tweetId);
  if (!tweet) {
    throw new ApiError(400, "no such tweet found");
  }
  const isLiked = await Like.findOne({ likedBy: req.user._id, tweet: tweetId });
  if (isLiked) {
    if (isLiked.likedBy.toString() != req.user._id) {
      throw new ApiError(400, "you are not allow to perform this action");
    }
    await Like.deleteOne(isLiked);
    return res
      .status(201)
      .json(new ApiResponce(isLiked, 200, "like remove successfully"));
  }
  const like = await Like.create({ likedBy: req.user._id, tweet: tweetId });
  return res
    .status(201)
    .json(new ApiResponce(like, 200, "like added successfully"));
});

const getLikedVideos = asyncHandler(async (req, res) => {
  const likedVideo = await Like.aggregate([
    {
      $match:{
        likedBy:new mongoose.Types.ObjectId(req.user._id)
      }
    },
    {
      $lookup:{
        from:"videos",
        localField:"video",
        foreignField:"_id",
        as:"likedVideos"
      }
    },
      {
        $unwind:"$likedVideos"
      },
    {
      $project:{
        likedVideos:1
      }
    }
  ])
   if (!likedVideo.length) {
     return res.json(new ApiResponce(200, "user have no liked vedios"));
   }

   return res
     .status(200)
     .json(
       new ApiResponce(likedVideo, 201, "liked vedios fetched successfully")
     );
});

module.exports = {
  toggleCommentLike,
  toggleTweetLike,
  toggleVideoLike,
  getLikedVideos,
};
