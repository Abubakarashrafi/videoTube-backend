const mongoose = require('mongoose');

const LikeSchema = new mongoose.Schema({
    comment:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"Comment"
    },
    tweet:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"Tweet"
    },
    video:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"Video"
    },
    likedBy:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"User"
    }
},{timestamps:true});

module.exports = mongoose.model("Like",LikeSchema);