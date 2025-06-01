const express = require('express');
// mergeParams: true allows us to get the :bookId from the parent router (books.js)
const router = express.Router({ mergeParams: true });
const Review = require('../models/review');
const Book = require('../models/book');
const { requireAuth } = require('../middleware/authMiddleware');

// POST a new review for a specific book (Protected Route)
router.post('/', requireAuth, async (req, res) => {
    const { bookId } = req.params;
    const { text, rating } = req.body;

    try {
        const book = await Book.findById(bookId);
        if (!book) {
            // Handle book not found, maybe redirect or show an error
            return res.status(404).send('Book not found');
        }

        const review = new Review({
            text,
            rating,
            user: req.user._id, // req.user from requireAuth
            book: bookId
        });

        await review.save();

        // Add review to book's reviews array
        book.reviews.push(review._id);
        await book.save();

        res.redirect(`/books/${bookId}`);

    } catch (err) {
        console.error("Error adding review:", err);
        // Potentially render the book page again with an error message
        const bookForError = await Book.findById(bookId).populate('reviews').populate('addedBy', 'username');
         let errorMessage = 'Failed to add review.';
        if (err.errors) {
            errorMessage = Object.values(err.errors).map(e => e.message).join(', ');
        }
        // It's tricky to pass the error back to the book show page directly without a more complex setup
        // For simplicity, we'll just redirect. Consider flash messages for better UX.
        res.redirect(`/books/${bookId}?error=${encodeURIComponent(errorMessage)}`);
    }
});


// (Optional: Add routes for updating and deleting reviews here if needed)


module.exports = router;