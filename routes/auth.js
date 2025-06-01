const express = require('express');
const router = express.Router();
const User = require('../models/user');
const jwt = require('jsonwebtoken');

// Signup Page
router.get('/signup', (req, res) => {
    res.render('auth/signup', { error: null, success: null });
});

// Signup Handle
router.post('/signup', async (req, res) => {
    try {
        const { username, email, password, confirmPassword } = req.body;

        if (password !== confirmPassword) {
            return res.render('auth/signup', { error: 'Passwords do not match!', success: null, username, email });
        }

        const existingUser = await User.findOne({ $or: [{ email }, { username }] });
        if (existingUser) {
            return res.render('auth/signup', { error: 'Username or email already exists!', success: null, username, email });
        }

        const user = new User({ username, email, password });
        await user.save();
        res.render('auth/signup', { success: 'Registration successful! Please log in.', error: null });
    } catch (err) {
        console.error(err);
        let errorMessage = 'An error occurred during registration.';
        if (err.errors) {
            errorMessage = Object.values(err.errors).map(e => e.message).join(', ');
        }
        res.render('auth/signup', { error: errorMessage, success: null, username: req.body.username, email: req.body.email });
    }
});

// Login Page
router.get('/login', (req, res) => {
    res.render('auth/login', { error: null });
});

// Login Handle
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email });

        if (!user) {
            return res.render('auth/login', { error: 'Invalid email or password.' });
        }

        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            return res.render('auth/login', { error: 'Invalid email or password.' });
        }

        const token = jwt.sign({ userId: user._id, username: user.username }, process.env.JWT_SECRET, { expiresIn: '1h' });
        res.cookie('token', token, { httpOnly: true, maxAge: 3600000 }); // 1 hour
        res.redirect('/books');

    } catch (err) {
        console.error(err);
        res.render('auth/login', { error: 'An error occurred. Please try again.' });
    }
});

// Logout Handle
router.get('/logout', (req, res) => {
    res.clearCookie('token');
    res.redirect('/');
});

module.exports = router;