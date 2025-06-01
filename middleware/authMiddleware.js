// middleware/authMiddleware.js
const jwt = require('jsonwebtoken');
const User = require('../models/user'); // Ensure User model is accessible

const requireAuth = (req, res, next) => {
    const token = req.cookies.token;
    res.locals.currentUser = null; // Initialize

    if (token) {
        jwt.verify(token, process.env.JWT_SECRET, async (err, decodedToken) => {
            if (err) {
                console.log("Token verification error:", err.message);
                // No redirect here, just ensure currentUser is null and proceed
                // Protected routes themselves will handle lack of req.user if needed,
                // or they might redirect. For general visibility, just set locals.
                return next(); 
            } else {
                try {
                    const user = await User.findById(decodedToken.userId).select('-password');
                    if (user) {
                        req.user = user; // Make user object available in request
                        res.locals.currentUser = user; // Make user available in views
                    } else {
                         console.log("User from token not found in DB.");
                    }
                } catch (dbError) {
                    console.error("Error fetching user from DB in requireAuth:", dbError);
                }
                return next();
            }
        });
    } else {
        return next(); // No token, proceed, currentUser remains null
    }
};

// ***** NEW: requireAdmin Middleware *****
// const requireAdmin = (req, res, next) => {
//     // First, ensure the user is authenticated (req.user should be set by requireAuth or similar)
//     // For robust standalone use, it should ideally call requireAuth logic or re-check.
//     // Assuming requireAuth has already run and populated req.user if logged in:
//     if (!req.user) { // If not logged in at all
//         // req.flash('error', 'You must be logged in to access this page.');
//         return res.status(401).redirect('/auth/login?message=' + encodeURIComponent('Please log in.'));
//     }

//     if (req.user.role === 'admin') {
//         next(); // User is an admin, proceed
//     } else {
//         // req.flash('error', 'You do not have permission to access this page.');
//         res.status(403).send('Forbidden: You do not have administrative privileges. <a href="/">Go Home</a>');
//         // Or redirect to a specific "access denied" page or home page
//         // return res.redirect('/');
//     }
// };

const requireAdmin = (req, res, next) => {
    if (req.user && req.user.role === 'admin') {
        next(); // User is present and is an admin, proceed
    } else if (req.user) { // User is logged in but not an admin
        // req.flash('error', 'You do not have permission to access this page.');
        console.log(`Access denied for user: ${req.user.username} (role: ${req.user.role}) to admin route.`);
        res.status(403).send('Access Denied. You do not have administrative privileges. <a href="/">Go Home</a>');
    } else { // No user is logged in
        // req.flash('error', 'You must be logged in as an admin to access this page.');
        console.log('Admin access denied: No user logged in.');
        res.redirect('/auth/login?message=' + encodeURIComponent('Admin login required.'));
    }
};

module.exports = { requireAuth, requireAdmin };