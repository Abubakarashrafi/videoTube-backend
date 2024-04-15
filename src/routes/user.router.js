const express = require('express');
const userRouter = express.Router();
const upload = require('../middleware/multer.middleware');
// const {registerUser, loginUser, logoutUser, refreshAccessToken, updateAvatar, getCurrentUser, updateCoverImage,getChannel,getWatchHistory,updatePassword,updateDetails} = require('../controllers/user.controller');
const verifyToken = require('../middleware/auth.middleware');
const user = require("../controllers/user.controller");

userRouter.route("/register").post(
  upload.fields([
    {
      name: "avatar",
      maxCount: 1,
    },
    {
      name: "coverImage",
      maxCount: 1,
    },
  ]),
  user.registerUser
  
);
userRouter.route("/login").post(user.loginUser);
userRouter.route("/logout").post(verifyToken,user.logoutUser);
userRouter.route("/refresh-token").post(user.refreshAccessToken)
userRouter.route("/update-avatar").patch( verifyToken,upload.single("avatar"),user.updateAvatar );
userRouter.route("/update-cover-image").patch(verifyToken,upload.single("coverImage"),user.updateCoverImage);
userRouter.route("/update-password").patch(verifyToken,user.updatePassword);
userRouter.route("/update-account").patch(verifyToken,user.updateDetails);
userRouter.route("/current-user").get(verifyToken,user.getCurrentUser);
userRouter.route("/Channel/:username").get(verifyToken,user.getChannel);
userRouter.route("/watch-history").get(verifyToken,user.getWatchHistory);

module.exports = userRouter