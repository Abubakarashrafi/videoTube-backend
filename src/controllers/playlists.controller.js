const mongoose = require("mongoose");
const Playlist = require("../models/playlists.model.js");
const User = require("../models/user.model.js");
const Video = require("../models/video.model.js");
const ApiError = require("../utils/ApiError.js");
const ApiResponce = require("../utils/ApiResponce.js");
const asyncHandler = require('../utils/asyncHandler.js');

const createPlaylist = asyncHandler(async (req, res) => {
  const { name, description } = req.body;
  if(!(name?.trim() || description?.trim())){
    throw new ApiError(400,"name or description required");
  }
  const playlist = await Playlist.create({
    name,
    description,
    owner : req.user?._id,
    videos: []
  });
  if(!playlist){
    throw new ApiError(400,"something went wrong while creating playlist");
  }
  res.status(200).json(new ApiResponce(playlist,201,"Playlist created sucessfully"));
});

const getUserPlaylists = asyncHandler(async (req, res) => {
  const {userId} = req.params;
  // console.log(userId);
  
  if(!mongoose.isValidObjectId(userId)){
    throw new ApiError(400,"userId is not valid object id");
  }
  const user = await User.findById(userId);
  if(!user){
    throw new ApiError(400,"user doesnt exist");
  }
  const playList = await Playlist.aggregate([
    {
      $match:{
        owner:new mongoose.Types.ObjectId(userId)
      }
    },
    {
      $lookup:{
        from:"videos",
        localField:"videos",
        foreignField:"_id",
        as:"videos"
      }
    },
    {
      $project:{
        name:1,
        description:1,
        videos:1,
      }
    }
  ])
  if(!playList.length){
    throw new ApiError(400,"playList doesnt exist");
  }
  res.status(200).json(new ApiResponce(playList,201,"playList fetched sucessfully"));
});

const getPlaylistById = asyncHandler(async (req, res) => {
  const { playlistId } = req.params;
  //TODO: get playlist by id
  if(!mongoose.isValidObjectId(playlistId)){
    throw new ApiError(400,"playlist id is not valid object id");
  }
  const playlistExist = await Playlist.findById(playlistId);
  if(!playlistExist){
    throw new ApiError(400,"playlist doesnt exist");
  }
  res.status(200).json(new ApiResponce(playlistExist,201,"playList fetched"));

});

const addVideoToPlaylist = asyncHandler(async (req, res) => {
  const { playlistId, videoId } = req.params;
  if(!(mongoose.isValidObjectId(playlistId))){
    throw new ApiError(400,"playList id is not valid object id");
  }
  if(!(mongoose.isValidObjectId(videoId))){
    throw new ApiError(400,"Video id is not valid object id");
  }
  const playList = await Playlist.findById(playlistId);
  if(!playList){
    throw new ApiError(400,"Playlist not found");
  }
  const video = await Video.findById(videoId);
  if (!video || !video.isPublished) {
    throw new ApiError(400, "Video not found");
  }
  if(playList.owner.toString()!= req.user?._id){
    throw new ApiError(400,"not the owner of playList");
  }

  const videoInPlayList = await Playlist.findOne({$and:[{_id:playlistId},{videos:videoId}]});
  if(videoInPlayList){
    throw new ApiError(400,"video already exist in playlist");
  }  
  
  playList.videos.push(videoId);
  const updatedPlaylist = await playList.save();

  if (!updatedPlaylist) {
    throw new ApiError(400, "failed to add video in playlist");
  }

  res.status(200).json(new ApiResponce(updatedPlaylist,201,"Video added to playList sucessfully"));
});

const removeVideoFromPlaylist = asyncHandler(async (req, res) => {
  const { playlistId, videoId } = req.params;
  if(!mongoose.isValidObjectId(playlistId)){
    throw new ApiError(400,"playList id is not valid object id");
  }

  if(!mongoose.isValidObjectId(videoId)){
    throw new ApiError(400,"video id is not valid object id");
  }

  const playList = await Playlist.findById(playlistId);
  if(!playList){
    throw new ApiError(400,"no such playList found");
  }
  const video = await Playlist.findOne({$and:[{_id:playlistId},{videos:videoId}]})
  if(!video){
    throw new ApiError(400,"no such video present in playList");
  }
  if (playList.owner.toString() != req.user?._id) {
    throw new ApiError(400, "not the owner of playList");
  }

  playList.videos.pull(videoId);
  const updatedPlaylist = await playList.save();

  if(!updatedPlaylist){
    throw new ApiError(400,"failed to remove video from playlist");
  }
  res.status(200).json(new ApiResponce(video,201,"video removed from playList sucessfully"));
});

const deletePlaylist = asyncHandler(async (req, res) => {
  const { playlistId } = req.params;
  if(!mongoose.isValidObjectId(playlistId)){
    throw new ApiError(400,"playLIst id is not valid object id");
  }

  const playList = await Playlist.findById(playlistId);
  if(!playList){
    throw new ApiError(400,"No such playList exist");
  }
  if (!playList.owner.toString() == req.user?._id) {
    throw new ApiError(400, "not the owner of playList");
  }
  const playlistDeleted = await Playlist.findByIdAndDelete(playlistId);
  if(!playlistDeleted){
    throw new ApiError(400,"error while deleting playlist");
  }
  res.status(200).json(new ApiResponce(playlistDeleted,201,"playlist deleted successfully"));
});

const updatePlaylist = asyncHandler(async (req, res) => {
  const { playlistId } = req.params;
  const { name, description } = req.body;
  
  if(!mongoose.isValidObjectId(playlistId)){
    throw new ApiError(400,"playList id is not valid object id");
  }

  if(!(name?.trim() || description?.trim())){
    throw new ApiError(400,"name or description required");
  }
  const playlist = await Playlist.findById(playlistId);
  if (!playlist) {
    throw new ApiError(400,"No such playList exist");
  }
  if(playlist.owner.toString()!=req.user.id){
    throw new ApiError(400,"you are not allowed to perform this action");
  }
  const playList = await Playlist.findByIdAndUpdate(playlistId,{
    $set:{
      name,
      description
    }
  },{new:true});
  if(!playList){
    throw new ApiError(400,"playlist not found");
  }
  res.status(200).json(new ApiResponce(playList,201,"playlist updated successfully"));
});

module.exports = {
  createPlaylist,
  getUserPlaylists,
  getPlaylistById,
  addVideoToPlaylist,
  removeVideoFromPlaylist,
  deletePlaylist,
  updatePlaylist,
};
