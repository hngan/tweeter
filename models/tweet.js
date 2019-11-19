const mongoose = require('mongoose');

const Schema =  mongoose.Schema;

const TweetSchema = new Schema({
    username:{
        type:String,
        default:""
    },
    author: { type: Schema.Types.ObjectId, ref: 'User' },
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
            default:0,
        }
    },
    timestamp:{
        type:Number,
        default: Date.now()/1000
    },
    childType:{
        type:String,
        default: null
    },
    users:[{type: Schema.Types.ObjectId, ref:'User'}], //keep tracks of people who already liked
    parent: {type: Schema.Types.ObjectId, ref: 'Tweet'},
    replies:[{type: Schema.Types.ObjectId, ref: 'Tweet'}],
    interest:{type: Number, default: 0}
});

const Tweet = mongoose.model("Tweet", TweetSchema);
module.exports = Tweet;