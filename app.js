// app.js
require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const cookieParser = require('cookie-parser');
const methodOverride = require('method-override');

// Route imports
const authRoutes = require('./routes/auth');
const bookRoutes = require('./routes/books');
const reviewRoutes = require('./routes/reviews');
const profileRoutes = require('./routes/profile'); // For user's own profile management
const userRoutes = require('./routes/users');     // For public user profiles
const postRoutes = require('./routes/posts');     //Import post routes

// Model imports (only User needed here for res.locals.currentUser)
const User = require('./models/user');

const app = express();
const port = process.env.PORT || 3000;

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
    .then(() => console.log('MongoDB connected successfully!'))
    .catch(err => console.error('MongoDB connection error:', err));

// Middleware
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public'))); // Serve static files like CSS and JS
app.use(methodOverride('_method'));

// Middleware to make user available in all templates
app.use(async (req, res, next) => {
    const token = req.cookies.token;
    res.locals.currentUser = null; // Initialize to null
    if (token) {
        try {
            const jwt = require('jsonwebtoken');
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            const user = await User.findById(decoded.userId).select('-password');
            if (user) {
                res.locals.currentUser = user;
            }
        } catch (err) {
            // Invalid token, or user not found, currentUser remains null
            console.log('Error verifying token or finding user:', err.message);
            // Optionally clear an invalid cookie
            // res.clearCookie('token');
        }
    }
    next();
});

// Routes
app.get('/', (req, res) => {
    // Pass pageTitle for the home page
    res.render('home', { pageTitle: 'Welcome to Ulasbuku' });
});

app.use('/auth', authRoutes);
app.use('/books', bookRoutes); // Handles all routes starting with /books
app.use('/books/:bookId/reviews', reviewRoutes); // Handles routes like /books/someId/reviews
app.use('/profile', profileRoutes); // Handles routes for the logged-in user's profile, e.g., /profile, /profile/edit
app.use('/users', userRoutes);     // Handles routes for viewing other users' profiles, e.g., /users/someUserId
app.use(postRoutes);               // <-- ***** NEW: Use post routes. This will handle GET /feed and POST /posts *****

// Basic Error Handling (should be last)
app.use((req, res, next) => { // 404 Not Found
    res.status(404).render('404', { pageTitle: 'Page Not Found' }); // Assuming you have a 404.ejs
});



app.use((err, req, res, next) => {
    console.error("Global Error Handler:", err.stack);
    res.status(err.status || 500).send(err.message || 'Something broke!'); // Or render an error page
});

app.listen(port, () => {
    console.log(`Server listening at http://localhost:${port}`);
});