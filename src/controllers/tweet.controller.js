const mongoose = require("mongoose");
const Tweet = require("../models/tweets.model.js");
const ApiError  = require("../utils/ApiError.js");
const ApiResponce = require("../utils/ApiResponce.js");
const asyncHandler = require("../utils/asyncHandler.js");

const createTweet = asyncHandler(async (req, res) => {

  const {content} = req.body;
  const ownerId = req.user?.id;

//   console.log(isValidObjectId(ownerId));
//   console.log(ownerId);

  if(!content?.trim()){
    throw new ApiError(400,"Tweet must not be empty");
  }

  const tweet = await Tweet.create({
    content,
    owner:ownerId
  })
  if(!tweet){
    throw new ApiError(400,"something went wrong while creating tweet");
  }
  res.status(201).json(new ApiResponce(tweet,200,"tweet posted successfully"));
});

const getTweet = asyncHandler(async (req, res) => {
  // TODO: get tweet
  const {tweetId} = req.params;
//   console.log(tweetId);
  const tweet = await Tweet.findById(tweetId);
  if(!tweet){
    throw new ApiError(400,"tweet not found");
  }
  res.status(200).json(new ApiResponce(tweet,201,"Tweet fetched sucessfully"));
});

const getUserTweet = asyncHandler(async (req,res)=> {
    // TODO: get User Tweet
    const ownerId = req.user?._id;
    // console.log(ownerId);
    if(!(ownerId && mongoose.isValidObjectId(ownerId))){
        throw new ApiError(401,"Owner id is not valid object id");
    }
    const tweet = await Tweet.aggregate([
      {
        $match: {
          owner: new mongoose.Types.ObjectId(ownerId),
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "owner",
          foreignField: "_id",
          as: "userDetails",
          pipeline:[
            {
                $project:{
                    username:1,
                }
            }
          ]
        },
      },
      {
        $project:{
            userDetails:1,
            content:1
        }
      }
    ]);

    res.status(201).json(new ApiResponce(tweet,200,"tweet fetched sucessfully"));
})

const updateTweet = asyncHandler(async (req, res) => {
  //TODO: update tweet
  const ownerId = req.user._id;
  const {tweetId} = req.params;
  const {content} = req.body;
  if(!tweetId && mongoose.isValidObjectId(tweetId)){
    throw new ApiError(401,"tweet object id is invalid");
  }

  if(!content.trim()){
    throw new ApiError(401,"content is required");
  }
  const userTweet = await Tweet.findById(tweetId);
  if(!userTweet){
    throw new ApiError(400,"no such tweet exist");
  }
  if(userTweet.owner.toString()!==ownerId){
    throw new ApiError(400,"you are not allowed to perform this action");
  }
  const updatedTweet = await Tweet.findOneAndUpdate({_id:tweetId, owner: ownerId},{
    $set:{
        content
    }
  },{new:true}
  );

  res.status(201).json(new ApiResponce(updatedTweet,200,"tweet updated sucessfully"));
});


const deleteTweet = asyncHandler(async (req, res) => {
  //TODO: delete tweet
  const {tweetId} = req.params;
  const ownerId = req.user._id;
  
  if(!(tweetId && mongoose.isValidObjectId(tweetId))){
    throw new ApiError(401,"tweet id is not valid object id");
  }
  if(!(ownerId && mongoose.isValidObjectId(ownerId))){
    throw new ApiError(401,"owner id is not valid object id");
  }
  const userTweet = await Tweet.findById(tweetId);
  if (!userTweet) {
    throw new ApiError(400, "no such tweet exist");
  }
  if (userTweet.owner.toString() !== ownerId) {
    throw new ApiError(400, "you are not allowed to perform this action");
  }

  const deletedTweet = await Tweet.findOneAndDelete({_id:tweetId,owner:ownerId});
  if(!deletedTweet){
    throw new ApiError(400,"problem while deleting tweet");
  }
  res.status(200).json(new ApiResponce(deletedTweet,201,"tweet deleted sucessfully"));
});

module.exports = {createTweet,getTweet,getUserTweet,updateTweet,deleteTweet};
