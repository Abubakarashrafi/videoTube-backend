const express = require("express");
const dashboardRouter = express.Router();
const dashboard = require("../controllers/dashboard.controller");
const verifyToken = require("../middleware/auth.middleware");

dashboardRouter.route("/dashboard").get(verifyToken,dashboard.getChannelStats);
dashboardRouter.route("/dashboard/video").get(verifyToken,dashboard.getChannelVideos);

module.exports = dashboardRouter;