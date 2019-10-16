const mongoose = require('mongoose');

const Schema =  mongoose.Schema;

const TweetSchema = new Schema({
    user:{
        type: String,
        required: true
    },
    content:{
        type:String,
        default: ""
    },
    retweeted:{
        type: Number,
        default: 0
    },
    property:{
        likes:{
            type:Number,
            default:0
        }
    },
    timestamp:{
        type:Number,
        default: Date.now();
    },
    childType:{
        type:String,
        default: null
    }
    
});

const Tweet = mongoose.model("Tweet", TweetSchema);
module.exports = Tweet;