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
            default:0
        }
    },
    timestamp:{
        type:Number,
        default: Date.now()/1000
    },
    childType:{
        type:String,
        default: null
    }
    
});

const Tweet = mongoose.model("Tweet", TweetSchema);
module.exports = Tweet;