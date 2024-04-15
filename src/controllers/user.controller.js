const mongoose = require('mongoose');
const User = require('../models/user.model');
const {uploadFile, deleteFile} = require('../utils/cloudinary');

const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const ApiResponce = require('../utils/ApiResponce');
const jwt = require('jsonwebtoken');


const genAccessAndRefreshToken = async(userId)=>{
    try{
        const user = await User.findById(userId);
        const accessToken = user.generateAccessToken(); 
        const refreshToken = user.generateRefreshToken();

        user.refreshToken = refreshToken;
         
        await user.save({validateBeforeSave : false})

        return {accessToken,refreshToken}
    } catch(error) {
        throw new ApiError(500,"Something went wrong while generating token");
    }
}
 
const registerUser = asyncHandler(async (req,res)=>{
    const {username,email,fullName,password} = req.body;
    if(![username,email,fullName,password].some((field)=>
        field?.trim()==="")
        ){
        const existedUser = await User.findOne( {$or : [ { username } , { email } ] } );
        if(!existedUser){
            
        const avatarPath = req.files?.avatar?.[0]?.path ?? null;
        const coverImagePath = req.files?.coverImage?.[0]?.path ?? null;
            
        const coverImage = await uploadFile(coverImagePath)
            if(avatarPath){
                const avatar = await uploadFile(avatarPath)
                if(avatar){
                    const user = await User.create({
                        username : username.toLowerCase(),
                        email,
                        fullName,
                        password,
                        avatar : avatar.url,
                        coverImage : coverImage?.url || ""
                   })
                    const createdUser = await User.findById(user._id).select("-password -refreshToken");
                    if(createdUser){
                        return res.json(new ApiResponce(createdUser,200,"User registered successfully"));
                        }else {
                            throw new ApiError(500,"something went wrong while registering user")
                        }

                } else {
                        throw new ApiError(400,"Avatar file missing");
                    }        
            } else {
                throw new ApiError(400,"Avatar file missing");
            }
        } else {
             throw new ApiError(409,"Username or email already exist ");
        } 
    } else {
             throw new ApiError(400,"All fields required");
    }
 }) 

const loginUser = asyncHandler( async (req,res) => {
    const {username, email, password} = req.body;
    if((username || email ) && password){
        const user = await User.findOne({$or : [ { username }, { email } ]});
        if(user){
            const isMatched = await user.isPasswordCorrect(password);
            if(isMatched){
                const {accessToken, refreshToken} = await genAccessAndRefreshToken(user._id);
                const loggedUser = await User.findById(user._id).select("-password -refreshToken");
                const options = {
                    httpOnly : true, 
                    secure : false
            }
           
           return res
             .status(200)
             .cookie("accessToken", accessToken, options)
             .cookie("refreshToken", refreshToken, options)
             .json(new ApiResponce({
                user : 
                    loggedUser,accessToken,refreshToken
                
             },201,"User login successfully"))
            } else {
                throw new ApiError(400,"invalid password");
            }
        } else {
            throw new ApiError(400,"User does not exist");
        }
    } else {
        throw new ApiError(400,"All fields required");
    }
})

const logoutUser = asyncHandler(async (req,res)=>{
    await User.findByIdAndUpdate(req.user._id,{
        $unset : {
            refreshToken : 1
        }
    },
        {
            new : true
        }
    )
    const options = {
        httpOnly : true,
        secure : true
    }
    res.status(201).clearCookie("accessToken",options).clearCookie("refreshToken",options).json(new ApiResponce ({},200,"user logout successfully"));
})

const refreshAccessToken = asyncHandler(async (req,res) => {
    const incomingToken = req.cookies.refreshToken || req.body.refreshToken
    if(incomingToken){
    const decodeToken = jwt.verify(incomingToken,process.env.REFRESH_TOKEN_SECRET)   
    const user = await User.findById(decodeToken._id);
        if(user){
            if(incomingToken == user.refreshToken){
                const options = {
                    httpOnly : true,
                    secure : true
                }
                const {accessToken, refreshToken} = await genAccessAndRefreshToken(user._id);
                return res.status(201)
                .cookie("accessToken",accessToken,options)
                .cookie("refreshToken",refreshToken,options)
                .json(
                    new ApiResponce({accessToken,refreshToken},201,"Access Token refreshed")
                )                
            } else {
                throw new ApiError(401,"refresh token is expired or expired");
            }
        } else {
            throw new ApiError(401,"invalid refresh token")
        }
    }else {
        throw new ApiError(401,"Unauthorized request");
    }
})

const updatePassword = asyncHandler(async (req, res) => {
    const {oldPassword, newPassword, confirmPassword} = req.body;
    if(oldPassword && newPassword && confirmPassword){
        if(newPassword === confirmPassword){
        const user = await User.findById(req.user._id);
        const passwordMatch = await user.isPasswordCorrect(oldPassword);
            if(passwordMatch){
                user.password = newPassword;
                await user.save({ validateBeforeSave : false });
                return res.status(201).json(new ApiResponce({},200,"password change successfully"));
            } else {
                throw new ApiError(400,"Invalid old password");
            }
        } else {
            throw new ApiError(400,"new password and confirm password are different");
        }
    }else {
        throw new ApiError(400,"All fields required");
    }
})

const getCurrentUser = asyncHandler(async (req,res) => {
    const user = req.user;
    return res.json({data : user})

})

const updateDetails = asyncHandler(async (req,res) => {
    const {fullName, email} = req.body
    if(fullName || email) {
        const user = await User.findByIdAndUpdate(req.user._id,{
            $set : {
                fullName,
                email,
            }
        },
        {
            new : true
        }
        ).select("-password");
        return res.status(201).json(new ApiResponce({updated_details : user},200,"User details updated successfully"));

    } else {
        throw new ApiError(400,"All fields required");
    }
})

const updateAvatar = asyncHandler(async (req,res) => {
    const avatarPath = req.file.path;
    // console.log(req.file.path); 
    if(avatarPath){
        const avatar = await uploadFile(avatarPath);
        if(avatar.url){
            const oldAvatar = req.user.avatar;
            if(oldAvatar){
                const publicId = oldAvatar.split("/").pop().split(".")[0];              
                await deleteFile(publicId);
            }
            const user = await User.findByIdAndUpdate(req.user._id,{
                $set : {
                    avatar : avatar.url
                }
            }, {new : true}
            ).select("-password")
            return res.status(201).json(new ApiResponce({avatar : user},200,"Avatar updated successfully"));
        }else {
            throw new ApiError(400,"Error while uploading Avatar");
        }
    } else {
        throw new ApiError(400,"Avatar file missing");
    }
})

const updateCoverImage = asyncHandler(async (req,res) => {
    const coverImagePath = req.file?.path;
    if(coverImagePath){
        const coverImage = await uploadFile(coverImagePath);
        if(coverImage.url){
            const oldCoverImage = req.user.coverImage;
            if(oldCoverImage){
                const publicId = oldCoverImage.split("/").pop().split(".")[0];
                await deleteFile(publicId)
            }
            const user = await User.findByIdAndUpdate(req.user._id,{
                $set : {
                    coverImage : coverImage.url
                }
            },{ new : true}).select("-password");

            return res.status(201).json(new ApiResponce(user,200,"cover image updated successfully"));

        } else {
            throw new ApiError(400,"Error while uploading cover image");
        }
    }else {
        throw new ApiError(400,"All fields required");
    }
})

const getChannel = asyncHandler (async (req,res) => {
    const {username} = req.params;
    if(username){
        const channel = await User.aggregate([
          {
            $match: {
              username: username.toLowerCase(),
            },
          },
          {
            $lookup: {
              from: "subscriptions",
              localField: "_id",
              foreignField: "channel",
              as: "subscribers",
            },
          },
          {
            $lookup: {
              from: "subscriptions",
              localField: "_id",
              foreignField: "subscriber",
              as: "subscribedTo",
            },
          },
          {
            $addFields: {
              subscribersCount: {
                $size: "$subscribers"
              },
              subcribedToCount: {
                $size: "$subscribedTo"
              },
              isSubscribed: {
                $cond: {
                  if: { $in: [req.user?._id, "$subscribers.subscriber"] },
                  then: true,
                  else: false,
                },
              },
            },
          },
          {
            $project: {
              fullName: 1,
              username: 1,
              subcribedToCount: 1,
              subscribersCount: 1,
              isSubscribed: 1,
              avatar : 1,
              coverImage: 1,
              email: 1,
              subscribers:1
            },
          },
        ]);
        if(!channel?.length){
            throw new ApiError(400,"channel does not exists");
        }
        return res.status(200).json(new ApiResponce(channel[0],201,"User channel fetched successfully"));
    } else {
        throw new ApiError(400,"Username is missing");
    }
})  

const getWatchHistory = asyncHandler(async (req,res) => {
    const user = await User.aggregate([
      {
        $match: {
            _id:new mongoose.Types.ObjectId(req.user?._id),
        }
      },
      {
        $lookup: {
          from: "videos",
          localField: "watchHistory",
          foreignField:"_id",
          as:"watchHistory",
          pipeline: [
            {
                $lookup:{
                    from:"users",
                    localField:"owner",
                    foreignField:"_id",
                    as:"Owner",
                    pipeline: [
                        {
                            $project:{
                                fullName:1,
                                username:1,
                                avatar:1,
                                coverImage:1
                            }
                        }
                    ]
                }
            },
             {
                 $addFields:{
                     owner:{                    
                     $first : "$Owner"
                 }
                 }
             }
          ]
        },
        
      },
    ]);

    return res.status(200).json(new ApiResponce(user[0].watchHistory,201,"User watch History fetched successfuly"));
})

module.exports = { 
    registerUser, 
    loginUser, 
    logoutUser, 
    refreshAccessToken, 
    updatePassword, 
    getCurrentUser, 
    updateDetails, 
    updateAvatar, 
    updateCoverImage,
    getChannel,
    getWatchHistory 
};


