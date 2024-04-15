const mongoose = require('mongoose');

const Subscription = new mongoose.Schema({
    subscriber : {
        type : mongoose.Schema.Types.ObjectId, // one who is subscribing
        ref : "User"
        
    },
    channel : {
        type : mongoose.Schema.Types.ObjectId, // one to whom subscriber is subscribing 
        ref : "User"
    }
}, {timestamps : true}
)

module.exports = mongoose.model("Subscription",Subscription);

