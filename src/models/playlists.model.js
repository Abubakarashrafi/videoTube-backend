const mongoose = require("mongoose");

const PlaylistSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  videos: [
  {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Video",
  }
],

  owner :{
    type:mongoose.Schema.Types.ObjectId,
    ref:"User"
  }
},{ timeseries:true });

module.exports = mongoose.model("Playlist",PlaylistSchema);