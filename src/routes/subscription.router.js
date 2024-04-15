const express = require('express');
const subscriptionRoute = express.Router();
const subscription = require("../controllers/subscription.controller");
const verifyToken = require("../middleware/auth.middleware");

subscriptionRoute.route("/subscription/:channelId").post(verifyToken,subscription.toggleSubscription);
subscriptionRoute.route("/subscription/:channelId").get(verifyToken,subscription.getUserChannelSubscribers);
subscriptionRoute.route("/subscriptions/:subscriberId").get(verifyToken,subscription.getSubscribedChannels
);

module.exports = subscriptionRoute;