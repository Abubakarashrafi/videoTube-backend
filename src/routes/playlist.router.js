const express = require("express");
const playlistRouter = express.Router();
const playlist = require("../controllers/playlists.controller");
const verifyToken = require("../middleware/auth.middleware");

playlistRouter.route("/playlist").post(verifyToken,playlist.createPlaylist);
playlistRouter.route("/playlistById/:userId").get(verifyToken,playlist.getUserPlaylists);
playlistRouter.route("/playlist/:playlistId/video/:videoId")
.post(verifyToken,playlist.addVideoToPlaylist)
.delete(verifyToken,playlist.removeVideoFromPlaylist);
playlistRouter.route("/playlist/:playlistId")
.get(verifyToken,playlist.getPlaylistById)
.delete(verifyToken,playlist.deletePlaylist)
.patch(verifyToken,playlist.updatePlaylist);


module.exports = playlistRouter;