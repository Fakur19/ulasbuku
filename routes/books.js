// routes/books.js
const express = require('express');
const router = express.Router();
const Book = require('../models/book');
const Review = require('../models/review');
const { requireAuth, requireAdmin } = require('../middleware/authMiddleware');

// GET all books (INDEX - with search, filter, review stats, and sorting)
router.get('/', async (req, res) => {
    try {
        let queryFilter = {};
        const searchTerm = req.query.search || '';
        const selectedGenre = req.query.genre || 'All';
        const currentSort = req.query.sort || 'newest'; // Default sort to 'newest'

        if (searchTerm) {
            queryFilter.$or = [
                { title: { $regex: searchTerm, $options: 'i' } },
                { author: { $regex: searchTerm, $options: 'i' } }
            ];
        }
        if (selectedGenre && selectedGenre !== 'All' && selectedGenre !== '') {
            queryFilter.genre = selectedGenre;
        }

        // Initial fetch from DB - default sort is by createdAt
        const booksData = await Book.find(queryFilter)
            .populate('addedBy', 'username profileImageUrl')
            .sort({ createdAt: -1 }) // DB sorts by newest initially
            .lean();

        const bookIds = booksData.map(book => book._id);
        const reviewsForBooks = await Review.find({ book: { $in: bookIds } }).select('book rating');

        let booksWithStats = booksData.map(book => {
            const bookReviews = reviewsForBooks.filter(review => review.book.equals(book._id));
            const reviewCount = bookReviews.length;
            let averageRating = 0;
            if (reviewCount > 0) {
                const sumOfRatings = bookReviews.reduce((sum, review) => sum + review.rating, 0);
                averageRating = sumOfRatings / reviewCount;
            }
            return { ...book, reviewCount, averageRating };
        });
        
        // --- NEW: JavaScript-based Sorting based on currentSort ---
        if (currentSort === 'rating_desc') {
            booksWithStats.sort((a, b) => (b.averageRating || 0) - (a.averageRating || 0));
        } else if (currentSort === 'reviews_desc') {
            booksWithStats.sort((a, b) => (b.reviewCount || 0) - (a.reviewCount || 0));
        }
        // If currentSort is 'newest', it's already sorted by createdAt from the database query.

        let genres = await Book.distinct('genre');
        genres = genres.filter(genre => genre && genre.trim() !== '').sort();

        res.render('books/index', { 
            books: booksWithStats,
            genres,
            selectedGenre,
            searchTerm,
            currentSort // Pass currentSort to the template
        });
    } catch (err) {
        console.error("Error fetching books with stats and sorting:", err);
        res.status(500).send("Error fetching books. Please try again later.");
    }
});

// ... (rest of your book routes: GET /new, POST /, GET /:id/edit, PUT /:id, GET /:id) ...
// Ensure these are the versions with admin restrictions if that's your current setup

// GET form to create a new book (Protected for Admins)
router.get('/new', requireAuth, requireAdmin, (req, res) => {
    res.render('books/new', { 
        book: { title: '', author: '', genre: '', isbn: '', description: '', coverImage: '' }, 
        error: null 
    });
});

// POST a new book (Protected for Admins)
router.post('/', requireAuth, requireAdmin, async (req, res) => {
    const { title, author, isbn, description, coverImage, genre } = req.body;
    const bookData = {
        title, author, isbn, description,
        coverImage: coverImage || undefined,
        genre: genre || undefined,
        addedBy: req.user._id 
    };
    try {
        const newBook = new Book(bookData);
        await newBook.save();
        res.redirect(`/books/${newBook._id}`);
    } catch (err) { /* ... error handling ... */ 
        let errorMessage = 'Failed to add book.';
        if (err.errors) errorMessage = Object.values(err.errors).map(e => e.message).join(', ');
        res.render('books/new', { book: bookData, error: errorMessage });
    }
});

// GET form to edit an existing book
router.get('/:id/edit', requireAuth, async (req, res) => {
    try {
        const book = await Book.findById(req.params.id);
        if (!book) return res.status(404).send('Book not found.');
        
        let canAccessEdit = false;
        if (book.addedBy.equals(req.user._id)) canAccessEdit = true;
        else if (req.user.role === 'admin') canAccessEdit = true;

        if (!canAccessEdit) return res.status(403).send('Permission denied.');
        res.render('books/edit', { book, error: null });
    } catch (err) { /* ... error handling ... */ 
        console.error(err); 
        res.status(500).send("Error loading edit page.");
    }
});

// PUT (update) an existing book
router.put('/:id', requireAuth, async (req, res) => {
    try {
        const bookToUpdate = await Book.findById(req.params.id);
        if (!bookToUpdate) return res.status(404).send('Book not found.');

        let canUpdate = false;
        if (bookToUpdate.addedBy.equals(req.user._id)) canUpdate = true;
        else if (req.user.role === 'admin') canUpdate = true;

        if (!canUpdate) return res.status(403).send('Permission denied.');
        
        const { title, author, isbn, description, coverImage, genre } = req.body;
        bookToUpdate.title = title;
        bookToUpdate.author = author;
        bookToUpdate.isbn = isbn;
        bookToUpdate.description = description;
        bookToUpdate.coverImage = coverImage || bookToUpdate.coverImage;
        bookToUpdate.genre = genre;

        await bookToUpdate.save();
        res.redirect(`/books/${bookToUpdate._id}`);
    } catch (err) { /* ... error handling ... */ 
        console.error(err);
        // Re-render edit form with error and submitted data
        const { title, author, isbn, description, coverImage, genre } = req.body;
        const bookForForm = { _id: req.params.id, title, author, isbn, description, coverImage, genre, addedBy: req.user._id }; 
        let errorMessage = 'Failed to update book.';
        if (err.errors) errorMessage = Object.values(err.errors).map(e => e.message).join(', ');
        res.render('books/edit', { book: bookForForm, error: errorMessage });
    }
});

// GET a specific book by ID (SHOW page)
router.get('/:id', async (req, res) => {
    try {
        const book = await Book.findById(req.params.id)
            .populate('addedBy', 'username profileImageUrl')
            .populate({
                path: 'reviews',
                options: { sort: { createdAt: -1 } },
                populate: { path: 'user', select: 'username profileImageUrl' }
            });
        if (!book) return res.status(404).send('Book not found.');
        res.render('books/show', { 
            book, newReview: {}, error: req.query.error || null 
        });
    } catch (err) { /* ... error handling ... */ 
        console.error(err); 
        res.status(500).send("Error loading book details.");
    }
});


module.exports = router;