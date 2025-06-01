// routes/posts.js
const express = require('express');
const router = express.Router();
const Post = require('../models/post');
const User = require('../models/user');
const Comment = require('../models/comment');
const { requireAuth } = require('../middleware/authMiddleware');
const multer = require('multer');
const path = require('path');

// --- Multer Configuration ---
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'public/uploads/post_images/');
    },
    filename: function (req, file, cb) {
        cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname));
    }
});
const fileFilter = (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) { cb(null, true); } 
    else { 
        req.fileValidationError = 'Only image files (jpeg, png, gif) are allowed.';
        cb(null, false); 
    }
};
const upload = multer({ storage: storage, limits: { fileSize: 1024 * 1024 * 5 }, fileFilter: fileFilter });

// GET the feed
router.get('/feed', requireAuth, async (req, res) => {
    try {
        if (!req.user || !req.user._id) {
            return res.redirect('/auth/login');
        }
        
        let authorsToQuery = [req.user._id]; 
        let feedTypeMessage = "Semua yang Anda suka, ditambah postingan Anda sendiri, di satu tempat.";
        const currentUserWithFollowing = await User.findById(req.user._id).select('following').lean();

        if (currentUserWithFollowing && currentUserWithFollowing.following && currentUserWithFollowing.following.length > 0) {
            authorsToQuery = [...authorsToQuery, ...currentUserWithFollowing.following];
            feedTypeMessage += " dan postingan teman anda";
        } else {
            feedTypeMessage += ". Ikuti seseorang untuk melihat postingan mereka juga";
        }
        
        const postsQuery = { author: { $in: authorsToQuery } };
        const posts = await Post.find(postsQuery)
            .populate('author', 'username profileImageUrl')
            .populate({
                path: 'comments',
                populate: { path: 'author', select: 'username profileImageUrl' },
                options: { sort: { createdAt: 'asc' } }
            })
            .sort({ createdAt: -1 })
            .limit(50);
        
        res.render('feed/index', {
            pageTitle: 'Beranda Anda', posts: posts,
            feedTypeMessage: feedTypeMessage, 
            error: req.query.error || null,
            success: req.query.success || null,
            currentRequestUrl: req.originalUrl // <-- PASS req.originalUrl
        });
    } catch (err) {
        console.error('Error fetching feed:', err); 
        res.status(500).send('Error loading the feed.');
    }
});

// POST - Create a new post
router.post('/posts', requireAuth, (req, res) => {
    upload.single('postImage')(req, res, async function (err) {
        if (!req.user) {
            return res.status(401).redirect('/auth/login?message=' + encodeURIComponent('Authentication required.'));
        }
        if (err instanceof multer.MulterError) {
            return res.redirect('/feed?error=' + encodeURIComponent('Image upload error: ' + err.message));
        } else if (req.fileValidationError) {
            return res.redirect('/feed?error=' + encodeURIComponent(req.fileValidationError));
        } else if (err) {
            return res.redirect('/feed?error=' + encodeURIComponent('An unexpected error occurred during image upload.'));
        }

        const { content } = req.body;
        if (!content || content.trim() === '') { return res.redirect('/feed?error=' + encodeURIComponent('Post content cannot be empty.')); }
        if (content.length > 280) { return res.redirect('/feed?error=' + encodeURIComponent('Post content cannot exceed 280 characters.'));}
        
        try {
            const postData = { content: content, author: req.user._id };
            if (req.file) { postData.imageUrl = '/uploads/post_images/' + req.file.filename; }
            const newPost = new Post(postData);
            await newPost.save();
            res.redirect('/feed?success=' + encodeURIComponent('Post created!'));
        } catch (saveError) {
            console.error('Error saving post to DB:', saveError);
            let errorMessage = 'Could not create post.';
            if (saveError.errors?.content) errorMessage = saveError.errors.content.message;
            else if (saveError.message) errorMessage = saveError.message;
            res.redirect('/feed?error=' + encodeURIComponent(errorMessage));
        }
    });
});

// POST - Create a new comment on a specific post
router.post('/posts/:postId/comments', requireAuth, async (req, res) => {
    const { postId } = req.params;
    const { text } = req.body;
    const referer = req.get('referer') || '/feed'; 

    if (!req.user) { return res.status(401).redirect('/auth/login?message=' + encodeURIComponent('Please log in to comment.')); }
    if (!text || text.trim() === '') { return res.redirect(`${referer}#post-${postId}&commentError=` + encodeURIComponent('Comment text cannot be empty.')); }
    if (text.length > 1000) { return res.redirect(`${referer}#post-${postId}&commentError=` + encodeURIComponent('Comment cannot exceed 1000 characters.')); }

    try {
        const post = await Post.findById(postId);
        if (!post) { return res.status(404).redirect('/feed?error=' + encodeURIComponent('Post not found.')); }
        const newComment = new Comment({ text: text, author: req.user._id, post: postId });
        await newComment.save();
        post.comments.push(newComment._id);
        await post.save();
        res.redirect(`${referer}#post-${postId}`);
    } catch (err) {
        console.error('Error creating comment:', err);
        res.redirect(`${referer}#post-${postId}&commentError=` + encodeURIComponent('Could not add comment: ' + (err.message || 'Server error')));
    }
});

module.exports = router;