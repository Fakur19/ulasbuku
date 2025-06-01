// models/comment.js
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const commentSchema = new Schema({
    text: {
        type: String,
        required: [true, 'Comment text cannot be empty.'],
        trim: true,
        maxlength: 1000 // Adjust as needed
    },
    author: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    post: { // Reference to the post this comment belongs to
        type: Schema.Types.ObjectId,
        ref: 'Post',
        required: true
    }
}, { timestamps: true }); // Adds createdAt and updatedAt

const Comment = mongoose.model('Comment', commentSchema);
module.exports = Comment;