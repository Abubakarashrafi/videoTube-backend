const mongoose = require('mongoose'); 
const Video = require("../models/video.model");
const User = require('../models/user.model');
const ApiError = require("../utils/ApiError");
const ApiResponce = require("../utils/ApiResponce");
const {uploadFile, deleteFile} = require("../utils/cloudinary");
const asyncHandler = require("../utils/asyncHandler");

const getAllVideos = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, query, sortBy, sortType, userId } = req.query;
  //TODO: get all videos based on query, sort, pagination
    const pipeline = [];
    // Match stage for filtering by userId

    if (!mongoose.isValidObjectId(userId)) {
      throw new ApiError(400, "Invalid userId!");
    }

    const user = await User.findById(userId);

    if (!user) {
      throw new ApiError(404, "User Not available witht this userId!");
    }

    if (userId) {
      pipeline.push({
        $match: {
          owner: new Types.ObjectId(userId),
        },
      });
    }

    // Match stage for based on text query
    if (query) {
      pipeline.push({
        $match: {
          $or: [
            { title: { $regex: query, $options: "i" } },
            { description: { $regex: query, $options: "i" } },
          ],
        },
      });
    }

    // Sort stage
    if (sortBy && sortType) {
      const sortTypeValue = sortType === "desc" ? -1 : 1;
      pipeline.push({
        $sort: { [sortBy]: sortTypeValue },
      });
    }

    // populate the owner
    pipeline.push({
      $lookup: {
        from: "users",
        localField: "owner",
        foreignField: "_id",
        as: "owner",
        pipeline: [
          {
            $project: {
              username: 1,
              fullName: 1,
              avatar: 1,
            },
          },
        ],
      },
    });

    // add the calculated owner field
    pipeline.push({
      $addFields: {
        owner: {
          $first: "$owner",
        },
      },
    });

    const aggregate = Video.aggregate(pipeline);

    Video.aggregatePaginate(aggregate, { page, limit })
      .then(function (result) {
        return res
          .status(200)
          .json(
            new ApiResponce(200, { result }, "Fetched videos successfully")
          );
      })
      .catch(function (error) {
        throw error;
      });
});


const publishAVideo = asyncHandler(async (req, res) => {
  const { title, description } = req.body;
  
  if(!(title?.trim() || description?.trim())){
    throw new ApiError(400,"title and description must not be empty");
  }
  const videoPath = req.files?.video?.[0].path;
  const thumbnailPath = req.files?.thumbnail?.[0].path;
  if(!videoPath){
    throw new ApiError(400,"video file required");
  }
  if(!thumbnailPath){
    throw new ApiError(400,"thumbnail Path required");
  }
  const video = await uploadFile(videoPath);
  const thumbnail = await uploadFile(thumbnailPath);

  if(!video){
    throw new ApiError(400,"Something went wrong while uploading video to cloudinary");
  }
  if(!thumbnail){
    throw new ApiError(400,"Something went wrong while uploading thumbnail to cloudinary");
  }
  const publishVideo = await Video.create({
    videoFile:video.url,
    thumbnail:thumbnail.url,    
    title,
    description,
    duration:video.duration,
    owner: req.user?._id
  })

  if(!publishVideo) throw new ApiError(400,"something went wrong while uploading video");

  res.status(200).json(new ApiResponce(publishVideo,200,"video uploaded successfully"));


});

const getVideoById = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  if(!mongoose.isValidObjectId(videoId)) throw new ApiError(400,"video id is not valid object id");
  const video = await Video.findById(videoId);
  if((!video || !video.isPublished)) throw new ApiError(400,"no such video exist");
  video.views++;
  await video.save();
  const user = req.user;
  user.watchHistory.push(videoId);
  await user.save();
  res.status(200).json(new ApiResponce(video,201,"video fetched sucessfully"));
});

const updateVideo = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  const {title,description} = req.body;
 if(!mongoose.isValidObjectId(videoId)) {
    throw new ApiError(400,"video id is not valid object id");
}
const video = await Video.findById(videoId);
if(video.owner.toString()!==req.user?._id){
  throw new ApiError(400,"you are not allowed to perform this action");
}
const thumbnailPath = req.file?.path;
if(!((title?.trim() || description?.trim() || thumbnailPath))) {
   throw new ApiError(400,"title, description or thumbnail required");
} 
let thumbnail;
if(thumbnailPath){
     thumbnail = await uploadFile(thumbnailPath);
    if(!thumbnail){
        throw new ApiError(400,"failed to upload thumbnail");
    }
    
    const user = await Video.findById(videoId);
    const oldThumbnail = user?.thumbnail;
    // console.log(user);
    if(!oldThumbnail){
        throw new ApiError(400,"failed to retrieve old thumbnail");
    }
    const publicId = oldThumbnail.split("/").pop().split(".")[0];
    const deleteOldThumbnail = await deleteFile(publicId);
    if(!deleteOldThumbnail){
        throw new ApiError(400,"failed to delete old thumbnail");
        
    }
}
const updateDetails = await Video.findByIdAndUpdate(videoId,{
    $set:{
        description,
        title,
        thumbnail:thumbnail?.url
    }
},{new:true})

    if(!updateDetails){
        throw new ApiError(400,"failed to update details");
    }
    return res.status(201).json(new ApiResponce(updateDetails,200,"video details updated successfully"));

});


const deleteVideo = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  if(!mongoose.isValidObjectId(videoId)){
    throw new ApiError(400,"video id is not valid object id");
  }
  const video = await Video.findById(videoId);
  if(!video){
    throw new ApiError(400,"no such video found");
  }
  if(video.owner.toString()!=req.user._id){
    throw new ApiError(400,"you are not allowed to perform this action");
  }

  const videoPath = video.videoFile;
  const publicId = videoPath.split("/").pop().split(".")[0];
  const deleteFromCloudinary = await deleteFile(publicId);
  if(!deleteFromCloudinary){
    throw new ApiError(500,"failed to delete video from cloudinary");
  }
  const deleteVideo = await Video.findByIdAndDelete(videoId);
  if(!deleteVideo){
    throw new ApiError(400,"failed to delete video");
  }
  
  return res.status(201).json(new ApiResponce(deleteVideo,200,"video deleted sucessfully"));
});

const togglePublishStatus = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  if(!mongoose.isValidObjectId(videoId)){
    throw new ApiError(400,"video id is not valid object id");
  }
  const video = await Video.findById(videoId);
  if(!video){
    throw new ApiError(400,"no such video found");
  }
  if(video.owner.toString()!=req.user._id){
    throw new ApiError(400,"you are not allowed to perform this action");
  }
  video.isPublished = !video.isPublished;
   await video.save();
  return res.status(201).json(new ApiResponce(video,200,(video.isPublished==true)?`video published sucessfully`:`video set to private successfully`));
});

module.exports ={
  getAllVideos,
  publishAVideo,
  getVideoById,
  updateVideo,
  deleteVideo,
  togglePublishStatus,
};
