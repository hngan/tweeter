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
    interest:{type: Number, default: 0},
    id: {type:String}
}, { strict: false });

const Tweet = mongoose.model("Tweet", TweetSchema);
module.exports = Tweet;

/*
{
    id: String,
    author: username,
    content: text,
    retweeted: number,
    property: {{likes: number}},
    timestamp: Date.now()/1000,
    childType:String,
    users:[String],
    parent: String,
    replies:[String],
    interest:number,
    media:[]
}

*/