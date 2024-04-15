const mongoose = require('mongoose');
const Video = require("../models/video.model");
const asyncHandler = require("../utils/asyncHandler");
const Like = require("../models/likes.model");
const Tweet = require("../models/tweets.model");
const Subscription = require("../models/subscription.model");
const ApiError = require('../utils/ApiError');
const ApiResponce = require("../utils/ApiResponce");

const getChannelStats = asyncHandler(async (req, res) => {
  // TODO: Get the channel stats like total video views, total subscribers, total videos, total likes etc.
    const channelId = req.user._id;
    const VideoStats = await Video.aggregate([
        {
            $match: {
                owner:new mongoose.Types.ObjectId(channelId),
                isPublished:true
            }
        },
        {
            $group:{
                _id:null,
                totalViews:{
                    $sum:"$views"
                },
                totalVideo:{$sum:1}
            }
        },
        {
            $project:{
                _id:0,
                totalViews:1,
                totalVideo:1,
            }
        }
    ])
    if(!VideoStats){
     throw new ApiError(400,"something went wrong while extracting video views");   
    }

    const subcriberStats = await Subscription.aggregate([
        {
            $match:{
                channel:new mongoose.Types.ObjectId(channelId)
            }
        },
        {
            $group:{
                _id:null,
              subscribers:{$sum:1}  
            }
        },
        {
            $project:{
                _id:0,
                subscribers:1
            }
        }

    ])
    if(!subcriberStats){
        throw new ApiError(400,"something went wrong while extracting subscriber stats");
    }
    const totalLikess = await Video.aggregate([{
        $match:{
            owner: new mongoose.Types.ObjectId(channelId),
            isPublished:true
        }
    },
    {
        $lookup:{
            from:"likes",
            localField:"_id",
            foreignField:"video",
            as:"likedVideos",
           
          
        }
    },
    {
        $unwind:"$likedVideos"
    },
    {
        $group:{
            _id:null,
            totalLikes:{$sum:1}
        }
    },
    {
        $project:{
            _id:0,
            totalLikes:1,
            likedVideos:1
        }
    }
])

const totalTweets = await Tweet.aggregate([{
    $match:{
        owner: new mongoose.Types.ObjectId(channelId)
    }
},
{
    $group:{
        _id:null,
        totalTweet:{$sum:1}
    }
},
{
    $project:{
        _id:0,
        totalTweet:1
    }
}
])

const totalComments = await Video.aggregate([{
    $match:{
        owner: new mongoose.Types.ObjectId(channelId),
        isPublished:true
    }
},
    {
        $lookup:{
            from:"comments",
            localField:"_id",
            foreignField:"video",
            as:"comments"
        }
    },
    {
        $unwind:"$comments"
    },
    {
        $group:{
            _id:null,
            comments:{$sum:1}
        }
    },
    {
        $project:{
            _id:0,
            comments:1
        }
    }
])

    return res.status(201).json(new ApiResponce({VideoStats,subcriberStats,totalLikess,totalTweets,totalComments},200,"channel details fetched successfully"))
});

const getChannelVideos = asyncHandler(async (req, res) => {
  // TODO: Get all the videos uploaded by the channel
  const channelId = req.user._id;
  const video =await Video.aggregate([{
    $match:{
        owner: new mongoose.Types.ObjectId(channelId),
        isPublished:true
    }
  }
])

return res.status(201).json(new ApiResponce(video,200,"all videos fetched successfully"));
  
});

module.exports = 
{ getChannelStats, getChannelVideos };
