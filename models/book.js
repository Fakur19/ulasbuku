// models/book.js
const mongoose = require('mongoose');

const bookSchema = new mongoose.Schema({
    title: {
        type: String,
        required: [true, 'Book title is required'],
        trim: true
    },
    author: {
        type: String,
        required: [true, 'Author is required'],
        trim: true
    },
    isbn: {
        type: String,
        trim: true,
    },
    description: {
        type: String,
        trim: true
    },
    coverImage: {
        type: String,
        trim: true,
        default: 'https://via.placeholder.com/150x220.png?text=No+Cover'
    },
    genre: { // <-- NEW FIELD
        type: String,
        trim: true,
        default: 'General' // Optional: set a default genre
    },
    addedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    reviews: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Review'
    }]
}, { timestamps: true });

const Book = mongoose.model('Book', bookSchema);
module.exports = Book;