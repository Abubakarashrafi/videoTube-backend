const mongoose = require('mongoose');
const Video = require("../models/video.model");
const ApiError = require("../utils/ApiError");
const ApiResponce = require("../utils/ApiResponce");
const asyncHandler = require("../utils/asyncHandler");
const Comment = require("../models/comment.model");

const getVideoComments = asyncHandler(async (req,res) => {
  const { videoId } = req.params;
  const { page = 1, limit = 10 } = req.query;

  if(!mongoose.isValidObjectId(videoId)){
    throw new ApiError(400,"video id is not valid object id");
  }
  const getComments = await Comment.aggregate([
    {
        $match:{
            video: new mongoose.Types.ObjectId(videoId)
        }
    },
          {
            $lookup: {
              from:"users",
              localField:"owner",
              foreignField: "_id",
              as: "commentedBy"
            }
          },
          {
            $project: {
              username:1,
              fullName:1,
              avatar:1
            }
          }
        ])
  Comment.aggregatePaginate(getComments, { page, limit })
    .then(function (results) {
     res.status(200).json(new ApiResponce(results,201,"comments fetched successfully"))
    })
    .catch(function (err) {
      throw new ApiError(400,err.message);
    });
});

const addComment = asyncHandler(async (req, res) => {
  const { content} = req.body;
  const { videoId } = req.params; 
  if(!content?.trim()){
    throw new ApiError(400,"Content must not be empty");
  }
  if(!mongoose.isValidObjectId(videoId)){
    throw new ApiError(400,"video id is not valid object id");
  }

  const video = await Video.findById(videoId);
  if(!video || !video.isPublished){
    throw new ApiError(400,"no such video found");
  }
  const comment = await Comment.create({
    content,
    video:videoId,
    owner:req.user._id
  }) 

  if(!comment){
    throw new ApiError(400,"failed to add comment");
  }

  res.status(200).json(new ApiResponce(comment,201,"Comment added successfully"));
});

const updateComment = asyncHandler(async (req, res) => {
    
    const { content } = req.body;
    const { videoId,commentId }= req.params;
    
    if(!content?.trim()){
        throw new ApiError(400,"content must not be empty");
    }

    if(!mongoose.isValidObjectId(videoId)){
        throw new ApiError(400,"video id is not valid object id");
    }

    const comment = await Comment.findById({_id:commentId,video:videoId});
    if(!comment){
        throw new ApiError(400,"no such comment exist");
    }
    if(!comment.owner.toString()===req.user._id){
        throw new ApiError(400,"you are not allowed to edit this comment");
    }
    const updateComment = await Comment.findByIdAndUpdate(commentId,{
        $set:{
            content
        }
    },{new:true})

    if(!updateComment){
        throw new ApiError(400,"error while updating comment");
    }

    res.status(200).json(new ApiResponce(updateComment,201,"comment updated successfully"));
});

const deleteComment = asyncHandler(async (req, res) => {

  const {commentId,videoId} = req.params;
  if(!(mongoose.isValidObjectId(commentId) || mongoose.isValidObjectId(videoId))){
    throw new ApiError(400,"comment id or video id is invalid");
  }

  const comment = await Comment.findById({_id:commentId,video:videoId});
  if(!comment){
    throw new ApiError(400,"no such comment found");
  }
  if(comment.owner.toString()!= req.user._id){
    throw new ApiError(400,"you are not allowed to perform this action");
  }

  const deletedComment = await Comment.findByIdAndDelete({_id:commentId,video:videoId});
  if(!deletedComment){
    throw new ApiError(400,"error while deleting comment");
  }

  res.status(200).json(new ApiResponce(deletedComment,201,"comment deleted successfully"));

});

module.exports = { getVideoComments, addComment, updateComment, deleteComment };