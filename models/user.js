const mongoose = require('mongoose');

const Schema =  mongoose.Schema;

const UserSchema = new Schema({
    username:{
        type: String,
        unique: true,
        required: true
    },
    email:{
        type: String,
        unique: true,
        required: true
    },
    password:{
        type: String,
        required: true
    },
    verified:{
        type: Boolean,
        default: false
    },
    tweets: [{ type: Schema.Types.ObjectId, ref: 'Tweet' }]
});

const User = mongoose.model("User", UserSchema);
module.exports = User;