const express = require('express');
const commentRouter = express.Router();
const comment = require("../controllers/comment.controller");
const verifyToken = require("../middleware/auth.middleware");


commentRouter.route("/comment/:videoId").get(comment.getVideoComments)
.post(verifyToken,comment.addComment);

commentRouter
.route("/comment/:commentId/video/:videoId")
.patch(verifyToken,comment.updateComment)
.delete(verifyToken,comment.deleteComment);
// commentRouter.route("/comment/:commentId/video/:videoId").delete()

module.exports = commentRouter;