// routes/profile.js
const express = require('express');
const router = express.Router();
const User = require('../models/user');
const Review = require('../models/review');
const Post = require('../models/post'); // Ensure Post is required
const { requireAuth } = require('../middleware/authMiddleware');

// GET current user's profile page (view own profile)
router.get('/', requireAuth, async (req, res) => {
    try {
        if (!req.user || !req.user._id) {
            return res.redirect('/auth/login?message=' + encodeURIComponent('Please log in to view your profile.'));
        }
        const user = await User.findById(req.user._id).lean(); // Use .lean() if not modifying and just passing
        if (!user) {
            // This case should ideally not happen if requireAuth works and user exists
            return res.status(404).send('User not found.');
        }

        const reviews = await Review.find({ user: user._id })
            .populate('book', 'title coverImage')
            .sort({ createdAt: -1 })
            .lean();

        const userPosts = await Post.find({ author: user._id })
            .populate('author', 'username profileImageUrl') // For postCard consistency
            .populate({
                path: 'comments',
                populate: { path: 'author', select: 'username profileImageUrl' },
                options: { sort: { createdAt: 'asc' } }
            })
            .sort({ createdAt: -1 })
            .limit(20)
            .lean(); 

        res.render('profile/show', { 
            pageTitle: `${user.username}'s Profile`,
            profileUser: user, // user is now a plain object
            reviews,
            userPosts: userPosts,
            currentRequestUrl: req.originalUrl, // <-- PASS req.originalUrl
            // currentUser is available via res.locals (a Mongoose doc)
            isFollowing: false // Not applicable for own profile, or set as needed if template expects it
        });
    } catch (err) {
        console.error('Error fetching own profile:', err);
        res.status(500).send('Error loading profile page.');
    }
});

// GET form to edit current user's profile
router.get('/edit', requireAuth, async (req, res) => {
    try {
        if (!req.user) { // Added for robustness
            return res.redirect('/auth/login?message=' + encodeURIComponent('Please log in to edit your profile.'));
        }
        const user = await User.findById(req.user._id); // Keep as Mongoose doc for potential methods/instance use
        if (!user) {
            return res.status(404).send('User not found.');
        }
        res.render('profile/edit', {
            pageTitle: 'Edit Profile',
            user: user, 
            error: null,
            success: null,
            formData: {} // Initialize for form repopulation if needed
        });
    } catch (err) {
        console.error('Error fetching user for edit:', err);
        res.status(500).send('Error loading edit profile page.');
    }
});

// POST (update) current user's profile
router.post('/edit', requireAuth, async (req, res) => {
    const { bio, profileImageUrl } = req.body;
    try {
        if (!req.user) { // Added for robustness
            return res.status(401).redirect('/auth/login?message=' + encodeURIComponent('Authentication required.'));
        }
        const userToUpdate = await User.findById(req.user._id);
        if (!userToUpdate) {
            return res.status(404).send('User not found for update.');
        }

        userToUpdate.bio = bio || '';
        userToUpdate.profileImageUrl = profileImageUrl || userToUpdate.profileImageUrl; 

        await userToUpdate.save();
        res.redirect('/profile'); 

    } catch (err) {
        console.error('Error updating profile:', err);
        let errorMessage = 'Failed to update profile.';
        if (err.errors) {
            errorMessage = Object.values(err.errors).map(e => e.message).join(', ');
        }
        
        // Fetch fresh user data for form consistency on error, even if User.findById fails, use req.body
        let userForForm = null;
        if(req.user) { // Attempt to fetch fresh data only if req.user exists
           userForForm = await User.findById(req.user._id);
        }

        res.render('profile/edit', {
            pageTitle: 'Edit Profile',
            user: userForForm || { username: req.user?.username, email: req.user?.email }, // Fallback if userForForm fetch fails
            error: errorMessage,
            formData: req.body // Pass submitted data back for repopulation
        });
    }
});

module.exports = router;