const User = require('../models/user.model')
const jwt = require('jsonwebtoken');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');

const verifyToken = asyncHandler(async (req,_,next)=>{
    try {
        const token = req.cookies?.accessToken || req.header("Authentication")?.replace("Bearer ","")
        // console.log(req.cookies);
        if(token){   
            const decode = jwt.verify(token,process.env.ACCESS_TOKEN_SECRET);
            const user = await User.findById(decode?._id).select("-password -refreshToken");
            if(user){
                req.user = user;
                next()
            } else {
                throw new ApiError(400,"Invalid access token")
            }
        }else {
            throw new ApiError(400,"Unauthorized request");
        }
    } catch (error) {
        console.log(error.message || new ApiError(500,"internal server error"));
    }
})

module.exports = verifyToken;