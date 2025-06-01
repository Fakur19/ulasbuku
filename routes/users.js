// routes/users.js
const express = require('express');
const router = express.Router();
const User = require('../models/user');
const Review = require('../models/review');
const Post = require('../models/post');
const { requireAuth } = require('../middleware/authMiddleware');

// GET - User search page and results
router.get('/search', async (req, res) => {
    try {
        const searchQuery = req.query.query || ''; 
        let usersFound = [];
        let searchPerformed = false; 

        if (searchQuery.trim() !== '') {
            searchPerformed = true;
            usersFound = await User.find({
                username: { $regex: searchQuery, $options: 'i' } 
            })
            .select('username profileImageUrl _id') 
            .limit(20) 
            .lean();   
        }

        res.render('users/search', {
            pageTitle: 'Search Users',
            searchQuery: searchQuery,    
            usersFound: usersFound,      
            searchPerformed: searchPerformed,
            currentRequestUrl: req.originalUrl // <-- PASS req.originalUrl
            // currentUser is available globally via res.locals
        });
    } catch (err) {
        console.error("Error searching users:", err);
        res.status(500).send('An error occurred while searching for users.');
    }
});

// GET a specific user's profile page - REQUIRES AUTHENTICATION
router.get('/:userId', requireAuth, async (req, res) => {
    if (!req.user) {
        return res.redirect('/auth/login?message=' + encodeURIComponent('Please log in to view profiles.'));
    }

    try {
        const profileUser = await User.findById(req.params.userId)
            .select('username bio profileImageUrl createdAt followers following email') 
            .lean();

        if (!profileUser) {
            return res.status(404).render('404', { pageTitle: 'User Not Found' });
        }

        const reviews = await Review.find({ user: profileUser._id })
            .populate('book', 'title coverImage')
            .sort({ createdAt: -1 })
            .lean();

        const userPosts = await Post.find({ author: profileUser._id })
            .populate('author', 'username profileImageUrl')
            .populate({
                path: 'comments',
                populate: { path: 'author', select: 'username profileImageUrl' },
                options: { sort: { createdAt: 'asc' } }
            })
            .sort({ createdAt: -1 })
            .limit(20)
            .lean();
            
        let isFollowing = false;
        if (req.user.following) { 
            isFollowing = req.user.following.some(followedId => followedId.equals(profileUser._id));
        }

        let displayEmail = null;
        if (req.user._id.equals(profileUser._id)) {
            displayEmail = profileUser.email; 
        }

        res.render('profile/show', { 
            pageTitle: `${profileUser.username}'s Profile`,
            profileUser: { ...profileUser, email: displayEmail },
            reviews, 
            userPosts, 
            isFollowing,
            currentRequestUrl: req.originalUrl // <-- PASS req.originalUrl
            // currentUser (from res.locals) is also available
        });

    } catch (err) {
        console.error('Error fetching user profile:', err);
        if (err.kind === 'ObjectId') {
            return res.status(404).render('404', { pageTitle: 'User Not Found (Invalid ID)' });
        }
        res.status(500).send('Error loading user profile.');
    }
});

// POST - Follow a user
router.post('/:userId/follow', requireAuth, async (req, res) => {
    if (!req.user) return res.redirect('/auth/login'); // Should be caught by requireAuth
    const userIdToFollow = req.params.userId;
    const currentUserId = req.user._id;

    if (userIdToFollow === currentUserId.toString()) {
        return res.redirect(`/users/${userIdToFollow}`);
    }
    try {
        await User.findByIdAndUpdate(currentUserId, { $addToSet: { following: userIdToFollow } });
        await User.findByIdAndUpdate(userIdToFollow, { $addToSet: { followers: currentUserId } });
        res.redirect(`/users/${userIdToFollow}`);
    } catch (err) { 
        console.error('Error following user:', err);
        res.redirect(`/users/${userIdToFollow}`);
    }
});

// POST - Unfollow a user
router.post('/:userId/unfollow', requireAuth, async (req, res) => {
    if (!req.user) return res.redirect('/auth/login'); // Should be caught by requireAuth
    const userIdToUnfollow = req.params.userId;
    const currentUserId = req.user._id;

    if (userIdToUnfollow === currentUserId.toString()) {
        return res.redirect(`/users/${userIdToUnfollow}`);
    }
    try {
        await User.findByIdAndUpdate(currentUserId, { $pull: { following: userIdToUnfollow } });
        await User.findByIdAndUpdate(userIdToUnfollow, { $pull: { followers: currentUserId } });
        res.redirect(`/users/${userIdToUnfollow}`);
    } catch (err) { 
        console.error('Error unfollowing user:', err);
        res.redirect(`/users/${userIdToUnfollow}`);
    }
});

// GET - List of users a specific user is following
router.get('/:userId/following', requireAuth, async (req, res) => {
    if (!req.user) return res.redirect('/auth/login');
    try {
        const user = await User.findById(req.params.userId)
            .populate({ path: 'following', select: 'username profileImageUrl _id' })
            .lean();
        if (!user) { return res.status(404).render('404', { pageTitle: 'User Not Found' }); }
        res.render('users/userList', {
            pageTitle: `Users Followed by ${user.username}`, listTitle: `${user.username} is Following:`,
            usersToList: user.following || [], profileUser: user, currentRequestUrl: req.originalUrl // <-- PASS req.originalUrl
        });
    } catch (err) { 
        console.error("Error fetching following list:", err);
        res.status(500).send('Error loading list.');
    }
});

// GET - List of users following a specific user
router.get('/:userId/followers', requireAuth, async (req, res) => {
    if (!req.user) return res.redirect('/auth/login');
    try {
        const user = await User.findById(req.params.userId)
            .populate({ path: 'followers', select: 'username profileImageUrl _id' })
            .lean();
        if (!user) { return res.status(404).render('404', { pageTitle: 'User Not Found' }); }
        res.render('users/userList', {
            pageTitle: `Followers of ${user.username}`, listTitle: `Followers of ${user.username}:`,
            usersToList: user.followers || [], profileUser: user, currentRequestUrl: req.originalUrl // <-- PASS req.originalUrl
        });
    } catch (err) { 
        console.error("Error fetching followers list:", err);
        res.status(500).send('Error loading list.');
    }
});

module.exports = router;