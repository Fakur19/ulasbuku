// seed.js
require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/user');
const Book = require('./models/book');
const Review = require('./models/review');
const Post = require('./models/post');

const LOREM_IPSUM_SHORT = "Lorem ipsum dolor sit amet, consectetur adipiscing elit.";
const LOREM_IPSUM_MEDIUM = "Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.";
const LOREM_IPSUM_LONG = "Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum. Curabitur pretium tinnitus, nec sem commodo ia, vulputate mi. Nullam dictum felis eu pede mollis pretium. Integer tinnitus.";

const simpleNames = [
    "Alex", "Ben", "Chris", "Dana", "Eli", "Finn", "Grace", "Haley", "Ian", "Jade",
    "Kyle", "Liam", "Mia", "Noah", "Olivia", "Paul", "Quinn", "Riley", "Sam", "Tara",
    "Jack", "Cal", "Tom", "Sue", "Leo", "Zoe", "Max", "Eva", "Dean", "Ivy",
    "Luke", "Nora", "Owen", "Piper", "Ross", "Skye", "Theo", "Uma", "Vic", "Will",
    "Yara", "Zack", "Amy", "Carl", "Drew", "Eve", "Gary", "Hope", "Joel", "Kim"
];

const generateUserData = () => {
    const users = [];
    for (let i = 0; i < 50; i++) {
        const name = simpleNames[i % simpleNames.length] + (i >= simpleNames.length ? Math.floor(i / simpleNames.length) +1 : ''); // Ensure unique enough usernames
        users.push({
            username: name,
            email: `${name.toLowerCase().replace(/\s+/g, '')}@book.com`,
            password: 'book123', // Will be hashed by pre-save hook
            bio: `Hi, I'm ${name}. ${LOREM_IPSUM_SHORT}`,
            profileImageUrl: `https://robohash.org/${name.toLowerCase().replace(/\s+/g, '')}.png?set=set4&size=150x150`, // Use a consistent set for fun avatars
            role: (i === 0 || i === 1) ? 'admin' : 'user' // Make first two users admins
        });
    }
    return users;
};

const samplePostContents = [
    "Just finished an amazing book! Highly recommend it. 📚 #booklover",
    "Thinking about what to read next. Any suggestions?",
    "Perfect day for reading outdoors. ☀️📖",
    "This author's writing style is incredible. So descriptive!",
    "Exploring new genres today. It's always good to step out of the comfort zone.",
    LOREM_IPSUM_MEDIUM,
    "Can't wait for the sequel to come out!",
    "My current read is blowing my mind. 🤯",
    "Hot take: This popular book is a bit overrated. Thoughts?",
    "Found a hidden gem at the local bookstore today!"
];

const sampleReviewTexts = [
    { rating: 5, text: "Absolutely loved this book! A masterpiece." },
    { rating: 4, text: "A very good read, kept me engaged throughout." },
    { rating: 3, text: "It was an okay book. Had some good parts, some slow ones." },
    { rating: 2, text: "Unfortunately, I didn't enjoy this one much." },
    { rating: 1, text: "Not my cup of tea at all. Couldn't finish it." },
    { rating: 5, text: "Highly recommended! Will read again." },
    { rating: 4, text: "Solid story and well-developed characters." },
    { rating: 3, text: "An interesting concept, but the execution could have been better." },
    { rating: 4, text: "A compelling narrative that makes you think." },
    { rating: 5, text: "A new favorite! Couldn't put it down." }
];


async function seedDatabase() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('MongoDB connected for seeding!');

        // --- Clear Existing Data (Optional - uncomment to clear) ---
        console.log('Clearing existing Users, Reviews, Posts...');
        await User.deleteMany({});
        await Review.deleteMany({});
        await Post.deleteMany({});
        // We also need to update books to clear their reviews arrays if we clear reviews
        await Book.updateMany({}, { $set: { reviews: [] } });
        console.log('Cleared Users, Reviews, Posts, and reset book review arrays.');
        // IMPORTANT: This script ASSUMES BOOKS ALREADY EXIST. 
        // If you want to clear books too, uncomment: await Book.deleteMany({});
        // and ensure your book seeding (e.g., the 50 popular books) is part of this script or run before.


        // --- 1. Seed Users ---
        console.log('Seeding users...');
        const userData = generateUserData();
        const createdUsers = [];
        for (const uData of userData) {
            const user = new User(uData);
            await user.save(); // This will trigger the pre-save hook for password hashing
            createdUsers.push(user);
        }
        console.log(`${createdUsers.length} users created successfully!`);
        const adminUser = createdUsers.find(u => u.role === 'admin') || createdUsers[0];


        // --- 2. Fetch Books (Prerequisite: Books must exist) ---
        const allBooks = await Book.find({}).lean(); // Using .lean() for performance
        if (allBooks.length === 0) {
            console.warn('⚠️ No books found in the database. Cannot seed reviews. Please ensure books are seeded first.');
        } else {
            console.log(`Found ${allBooks.length} books to potentially review.`);
        }

        // --- 3. Seed Reviews ---
        if (allBooks.length > 0 && createdUsers.length > 0) {
            console.log('Seeding reviews...');
            const reviewsToCreate = Math.min(100, createdUsers.length * 2, allBooks.length * 5);
            let reviewsCreatedCount = 0;

            for (let i = 0; i < reviewsToCreate; i++) {
                const randomUser = createdUsers[Math.floor(Math.random() * createdUsers.length)];
                const randomBook = allBooks[Math.floor(Math.random() * allBooks.length)];
                const randomReviewContent = sampleReviewTexts[Math.floor(Math.random() * sampleReviewTexts.length)];

                // Avoid user reviewing the same book multiple times in this seed
                // CORRECTED: Check using the 'user' field
                const existingReview = await Review.findOne({ user: randomUser._id, book: randomBook._id }); 
                if (existingReview) {
                    continue; 
                }

                const review = new Review({
                    text: randomReviewContent.text,
                    rating: randomReviewContent.rating,
                    user: randomUser._id, // CORRECTED: Field name is 'user'
                    book: randomBook._id  // This refers to the _id from the lean book object
                });
                const savedReview = await review.save();

                // Add review to the book's reviews array
                await Book.findByIdAndUpdate(randomBook._id, { $addToSet: { reviews: savedReview._id } });
                reviewsCreatedCount++;
            }
            console.log(`${reviewsCreatedCount} reviews created and linked to books!`);
        }

        // --- 4. Seed Posts ---
        if (createdUsers.length > 0) {
            console.log('Seeding posts...');
            const postsToCreate = Math.min(75, createdUsers.length * 1.5); 
            let postsCreatedCount = 0;

            for (let i = 0; i < postsToCreate; i++) {
                const randomUser = createdUsers[Math.floor(Math.random() * createdUsers.length)];
                const randomPostContent = samplePostContents[Math.floor(Math.random() * samplePostContents.length)];
                
                const postData = {
                    content: randomPostContent,
                    author: randomUser._id,
                };

                if (Math.random() < 0.3) { // 30% chance of having an image
                    const imgNum = Math.floor(Math.random() * 50) + 1;
                    postData.imageUrl = `https://picsum.photos/seed/${randomUser.username.replace(/\s+/g, '')}${i}/600/400`; // Example image
                }

                const post = new Post(postData);
                await post.save();
                postsCreatedCount++;
            }
            console.log(`${postsCreatedCount} posts created!`);
        }
        
        // --- 5. Seed Follow Relationships (Optional) ---
        if (createdUsers.length > 1) {
            console.log('Seeding some follow relationships...');
            const baseUserToFollow = adminUser || createdUsers[0]; 
            for (let i = 1; i < Math.min(createdUsers.length, 15); i++) { 
                if (createdUsers[i]._id.toString() !== baseUserToFollow._id.toString()) {
                    await User.findByIdAndUpdate(createdUsers[i]._id, { $addToSet: { following: baseUserToFollow._id } });
                    await User.findByIdAndUpdate(baseUserToFollow._id, { $addToSet: { followers: createdUsers[i]._id } });
                }
                // Add a few more random follows
                const randomIndexToFollow = Math.floor(Math.random() * createdUsers.length);
                if (i !== randomIndexToFollow && createdUsers[i]._id.toString() !== createdUsers[randomIndexToFollow]._id.toString()) {
                    await User.findByIdAndUpdate(createdUsers[i]._id, { $addToSet: { following: createdUsers[randomIndexToFollow]._id } });
                    await User.findByIdAndUpdate(createdUsers[randomIndexToFollow]._id, { $addToSet: { followers: createdUsers[i]._id } });
                }
            }
            console.log('Basic follow relationships seeded.');
        }


    } catch (error) {
        console.error('Error seeding database:', error);
        if (error.errors) { // Log Mongoose validation errors in more detail
            for (const key in error.errors) {
                console.error(`Validation error for path \`${error.errors[key].path}\`: ${error.errors[key].message}`);
            }
        }
    } finally {
        await mongoose.disconnect();
        console.log('MongoDB disconnected.');
    }
}

seedDatabase();