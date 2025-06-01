// models/user.js
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const Schema = mongoose.Schema;

const userSchema = new Schema({
    username: {
        type: String,
        required: [true, 'Username is required'],
        unique: true,
        trim: true,
        minlength: 3
    },
    email: {
        type: String,
        required: [true, 'Email is required'],
        unique: true,
        trim: true,
        lowercase: true,
        match: [/.+@.+\..+/, 'Please enter a valid email address']
    },
    password: {
        type: String,
        required: [true, 'Password is required'],
        minlength: 6
    },
    bio: {
        type: String,
        trim: true,
        maxlength: 500,
        default: ''
    },
    profileImageUrl: {
        type: String,
        trim: true,
        default: 'https://via.placeholder.com/150/CCCCCC/B0B0B0?Text=User'
    },
    following: [{
        type: Schema.Types.ObjectId,
        ref: 'User'
    }],
    followers: [{
        type: Schema.Types.ObjectId,
        ref: 'User'
    }],
    role: { // <-- NEW FIELD for user role
        type: String,
        enum: ['user', 'admin'], // Possible roles
        default: 'user'        // Default role for new users
    }
}, { timestamps: true });

// ... (rest of your existing userSchema methods: pre-save for password, comparePassword) ...
userSchema.pre('save', async function(next) {
    if (!this.isModified('password')) return next();
    try {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
        next();
    } catch (error) {
        next(error);
    }
});

userSchema.methods.comparePassword = async function(candidatePassword) {
    return bcrypt.compare(candidatePassword, this.password);
};

const User = mongoose.model('User', userSchema);
module.exports = User;