const mongoose = require('mongoose');
const Subscription = require("../models/subscription.model");
const User = require("../models/user.model");
const asyncHandler = require("../utils/asyncHandler");
const ApiError = require("../utils/ApiError");
const ApiResponce = require("../utils/ApiResponce");

const toggleSubscription = asyncHandler(async (req, res) => {
  const { channelId } = req.params;
  if(req.user._id == channelId){
    throw new ApiError(400,"cant subscribe to your own channel");
  }
  if(!mongoose.isValidObjectId(channelId)){
    throw new ApiError(400,"channel id is not valid object id");
  }
  const channel = await User.findById(channelId);
  if(!channel){
    throw new ApiError(400,"no such channel found");
  }
  const isSubscribed = await Subscription.findOne({subscriber:req.user._id,channel:channelId});
  if(isSubscribed){
    const toggleSubscription = await Subscription.deleteOne(isSubscribed);
    if(!toggleSubscription){
        throw new ApiError(400,"fail to remove subscription");
    }
    return res.status(201).json(new ApiResponce(isSubscribed,200,"subscription removed"));
  }
  const toggleSubscription = await Subscription.create({
    subscriber:req.user._id,
    channel:channelId
  })
  if(!toggleSubscription){
    throw new ApiError(400,"failed to add subscription");
  }
  return res.status(201).json(new ApiResponce(toggleSubscription,200,"subscribed successfully"));
});

// controller to return subscriber list of a channel
const getUserChannelSubscribers = asyncHandler(async (req, res) => {
  const { channelId } = req.params;
  if(!mongoose.isValidObjectId(channelId)){
    throw new ApiError(400,"channel id is not valid object id");
  }
  
  const channel = await Subscription.aggregate([
    {
      $match: {
        channel: new mongoose.Types.ObjectId(channelId),
      },
       },
       {
         $lookup: {
           from: "users",
           localField: "subscriber",
           foreignField: "_id",
           as: "subscribers",
           pipeline:[
            {
                $project:{
                    username:1,
                    fullName:1,
                    avatar:1
                }
            }
           ]
         },
       },
       {
        $project:{
            subscribers:1
        }
       }
       
  ]);
 if(!channel.length){
     throw new ApiError(400,"no such channel found");
 }
return res
  .status(201)
  .json(new ApiResponce(channel[0].subscribers, 200, (channel.length!=0)?`${channel.length} subscribers fetched`:"channel have 0 subscribers"));
});

// controller to return channel list to which user has subscribed
const getSubscribedChannels = asyncHandler(async (req, res) => {
  const { subscriberId } = req.params;
  if(!mongoose.isValidObjectId(subscriberId)){
    throw new ApiError(400,"subscriber id is not valid object id");
  }
  const subscribedTo = await Subscription.aggregate([
    {
        $match:{
            subscriber:new mongoose.Types.ObjectId(subscriberId)
        }
    },
    {
        $lookup:{
            from:"users",
            localField:"channel",
            foreignField:"_id",
            as:"subscribedTo",
            pipeline:[
                {
                    $project:{
                        username:1,
                        fullName:1,
                        avatar:1
                    }
                }
            ]
        }
    },
    {
        $project:{
            subscribedTo:1
        }
    }
  ])
  if(!subscribedTo.length){
    throw new ApiError(400,"no such user found");
  }
  return res.status(201).json(new ApiResponce(subscribedTo[0].subscribedTo,200,(subscribedTo.length>0)?`user has subscribed to ${subscribedTo.length} channels`:"0 channels found"));
});

module.exports ={ toggleSubscription, getUserChannelSubscribers, getSubscribedChannels };
