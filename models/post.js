// models/post.js
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const postSchema = new Schema({
    content: {
        type: String,
        required: [true, 'Post content cannot be empty.'],
        trim: true,
        minlength: 1,
        maxlength: 280 // Similar to Twitter's character limit, adjust as needed
    },
    author: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    imageUrl: { // <-- NEW FIELD for post image
        type: String,
        trim: true
    },
    comments: [{ // <-- NEW FIELD to store comment ObjectIds
        type: Schema.Types.ObjectId,
        ref: 'Comment'
    }]
    // Future enhancements could include:
    // likes: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    // comments: [{
    //     user: { type: Schema.Types.ObjectId, ref: 'User' },
    //     text: String,
    //     createdAt: { type: Date, default: Date.now }
    // }]
}, { timestamps: true }); // Adds createdAt and updatedAt

const Post = mongoose.model('Post', postSchema);
module.exports = Post;