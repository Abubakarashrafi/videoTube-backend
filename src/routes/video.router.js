const express = require("express");
const videoRouter = express.Router();
const video = require("../controllers/video.controller");
const verifyToken = require("../middleware/auth.middleware");
const upload = require("../middleware/multer.middleware");

videoRouter.route("/video").post(verifyToken,upload.fields([
    {
        name:"video",
        maxCount:1
    },
    {
        name:"thumbnail",
        maxCount:1
    }
]),video.publishAVideo);

videoRouter.route("/video/:videoId").get(verifyToken,video.getVideoById);
videoRouter.route("/video/:videoId").post(verifyToken,upload.single("thumbnail"),video.updateVideo)
.delete(verifyToken,video.deleteVideo)
.patch(verifyToken,video.togglePublishStatus);

module.exports = videoRouter;