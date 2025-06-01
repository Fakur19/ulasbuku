require('dotenv').config();
const mongoose = require('mongoose');
const Book = require('./models/book');
const User = require('./models/user'); // We need the User model

// --- Configuration ---
// Option 1: Specify an existing user's email. The script will try to find this user.
const SEED_USER_EMAIL = 'admin@book.com'; // !!! REPLACE with an email of a user you signed up via the app

// Option 2: Or, define details for a user to be created by this script if the above email is not found.
const NEW_USER_DETAILS = {
    username: 'BookAdmin', // Changed username for clarity
    email: SEED_USER_EMAIL, 
    password: 'bookadmin',
    role: 'admin' // <-- Set role to admin
};
// --- End Configuration ---


// In your seed.js file, replace the old sampleBooks array with this:
const sampleBooks = [
    // Classic Literature
    {
        title: 'To Kill a Mockingbird',
        author: 'Harper Lee',
        genre: 'Classic Fiction',
        isbn: '9780061120084',
        description: 'A novel about the serious issues of rape and racial inequality in the American South, narrated by a young girl, Scout Finch.',
        coverImage: 'https://covers.openlibrary.org/b/isbn/9780061120084-L.jpg'
    },
    {
        title: '1984',
        author: 'George Orwell',
        genre: 'Dystopian Fiction',
        isbn: '9780451524935',
        description: 'A chilling prophecy about the future and a devastating cautionary tale of a totalitarian regime.',
        coverImage: 'https://covers.openlibrary.org/b/isbn/9780451524935-L.jpg'
    },
    {
        title: 'Pride and Prejudice',
        author: 'Jane Austen',
        genre: 'Classic Romance',
        isbn: '9780141439518',
        description: 'A witty and romantic novel of manners, centered on the headstrong Elizabeth Bennet and the proud Mr. Darcy.',
        coverImage: 'https://covers.openlibrary.org/b/isbn/9780141439518-L.jpg'
    },
    {
        title: 'The Great Gatsby',
        author: 'F. Scott Fitzgerald',
        genre: 'Classic Fiction',
        isbn: '9780743273565',
        description: 'A story of the fabulously wealthy Jay Gatsby and his new love for the beautiful Daisy Buchanan, of lavish parties on Long Island at a time when The New York Times noted "gin was the national drink and sex the national obsession."',
        coverImage: 'https://covers.openlibrary.org/b/isbn/9780743273565-L.jpg'
    },
    {
        title: 'Moby Dick',
        author: 'Herman Melville',
        genre: 'Adventure Classic',
        isbn: '9780142437247',
        description: 'The epic tale of Captain Ahab\'s obsessive quest to hunt the white whale, Moby Dick.',
        coverImage: 'https://covers.openlibrary.org/b/isbn/9780142437247-L.jpg'
    },
    // Contemporary Fiction
    {
        title: 'Where the Crawdads Sing',
        author: 'Delia Owens',
        genre: 'Contemporary Fiction',
        isbn: '9780735219090',
        description: 'A heartbreaking coming-of-age story and a surprising tale of possible murder, set in the marshes of North Carolina.',
        coverImage: 'https://covers.openlibrary.org/b/isbn/9780735219090-L.jpg'
    },
    {
        title: 'The Silent Patient',
        author: 'Alex Michaelides',
        genre: 'Psychological Thriller',
        isbn: '9781250301697',
        description: 'A psychotherapist becomes obsessed with his patient, a famous painter who has gone silent after allegedly murdering her husband.',
        coverImage: 'https://covers.openlibrary.org/b/isbn/9781250301697-L.jpg'
    },
    {
        title: 'Klara and the Sun',
        author: 'Kazuo Ishiguro',
        genre: 'Science Fiction',
        isbn: '9780571364879',
        description: 'The story of Klara, an Artificial Friend with outstanding observational qualities, who watches carefully the behavior of those who come in to browse, and of those who pass on the street outside.',
        coverImage: 'https://covers.openlibrary.org/b/isbn/9780571364879-L.jpg'
    },
    {
        title: 'Project Hail Mary',
        author: 'Andy Weir',
        genre: 'Science Fiction',
        isbn: '9780593135204',
        description: 'An amnesiac astronaut wakes up on a solo mission in deep space, tasked with saving humanity.',
        coverImage: 'https://covers.openlibrary.org/b/isbn/9780593135204-L.jpg'
    },
    {
        title: 'The Midnight Library',
        author: 'Matt Haig',
        genre: 'Fantasy Fiction',
        isbn: '9780525559474',
        description: 'Between life and death there is a library, and within that library, the shelves go on forever. Every book provides a chance to try another life you could have lived.',
        coverImage: 'https://covers.openlibrary.org/b/isbn/9780525559474-L.jpg'
    },
    // Science Fiction & Fantasy
    {
        title: 'Dune',
        author: 'Frank Herbert',
        genre: 'Science Fiction',
        isbn: '9780441172719',
        description: 'Set on the desert planet Arrakis, Dune is the story of the boy Paul Atreides, heir to a noble family tasked with ruling an inhospitable world where the only thing of value is the “spice” melange.',
        coverImage: 'https://covers.openlibrary.org/b/isbn/9780441172719-L.jpg'
    },
    {
        title: 'The Hobbit',
        author: 'J.R.R. Tolkien',
        genre: 'Fantasy',
        isbn: '9780547928227',
        description: 'A reluctant hobbit, Bilbo Baggins, sets out to the Lonely Mountain with a spirited group of dwarves to reclaim their mountain home, and the gold within it, from the dragon Smaug.',
        coverImage: 'https://covers.openlibrary.org/b/isbn/9780547928227-L.jpg'
    },
    {
        title: 'A Game of Thrones',
        author: 'George R.R. Martin',
        genre: 'Fantasy',
        isbn: '9780553593716',
        description: 'The first book in A Song of Ice and Fire, a series of epic fantasy novels. Summers span decades. Winter can last a lifetime. And the struggle for the Iron Throne has begun.',
        coverImage: 'https://covers.openlibrary.org/b/isbn/9780553593716-L.jpg'
    },
    {
        title: 'The Name of the Wind',
        author: 'Patrick Rothfuss',
        genre: 'Fantasy',
        isbn: '9780756404741',
        description: 'The story of Kvothe, a magically gifted young man who grows to be the most notorious wizard his world has ever seen.',
        coverImage: 'https://covers.openlibrary.org/b/isbn/9780756404741-L.jpg'
    },
    {
        title: 'Foundation',
        author: 'Isaac Asimov',
        genre: 'Science Fiction',
        isbn: '9780553293357',
        description: 'The first novel in Isaac Asimov\'s classic science-fiction saga of the decay of the Galactic Empire and the rise of the Foundation.',
        coverImage: 'https://covers.openlibrary.org/b/isbn/9780553293357-L.jpg'
    },
    {
        title: 'The Martian',
        author: 'Andy Weir',
        genre: 'Science Fiction',
        isbn: '9780804139021',
        description: 'An astronaut, Mark Watney, is presumed dead and left behind on Mars. He must rely on his ingenuity to find a way to survive.',
        coverImage: 'https://covers.openlibrary.org/b/isbn/9780804139021-L.jpg'
    },
    {
        title: 'Mistborn: The Final Empire',
        author: 'Brandon Sanderson',
        genre: 'Fantasy',
        isbn: '9780765350381',
        description: 'In a world where ash falls from the sky and mists rule the night, a young thief discovers her latent magical abilities.',
        coverImage: 'https://covers.openlibrary.org/b/isbn/9780765350381-L.jpg'
    },
    // Mystery & Thriller
    {
        title: 'The Girl with the Dragon Tattoo',
        author: 'Stieg Larsson',
        genre: 'Mystery',
        isbn: '9780307473479',
        description: 'A journalist and a young female hacker uncover a dark family secret and a string of murders.',
        coverImage: 'https://covers.openlibrary.org/b/isbn/9780307473479-L.jpg'
    },
    {
        title: 'Gone Girl',
        author: 'Gillian Flynn',
        genre: 'Thriller',
        isbn: '9780307588371',
        description: 'On the day of their fifth wedding anniversary, Nick Dunne\'s wife, Amy, disappears. Under pressure from the police and a growing media frenzy, Nick\'s portrait of a blissful union begins to crumble.',
        coverImage: 'https://covers.openlibrary.org/b/isbn/9780307588371-L.jpg'
    },
    {
        title: 'The Da Vinci Code',
        author: 'Dan Brown',
        genre: 'Thriller',
        isbn: '9780307474278',
        description: 'A murder inside the Louvre, and clues in Da Vinci paintings, lead to the discovery of a religious mystery protected by a secret society for two thousand years.',
        coverImage: 'https://covers.openlibrary.org/b/isbn/9780307474278-L.jpg'
    },
    // Young Adult
    {
        title: 'The Hunger Games',
        author: 'Suzanne Collins',
        genre: 'YA Dystopian',
        isbn: '9780439023528',
        description: 'In a post-apocalyptic nation, Katniss Everdeen volunteers to take her younger sister\'s place in the annual Hunger Games, a televised fight to the death.',
        coverImage: 'https://covers.openlibrary.org/b/isbn/9780439023528-L.jpg'
    },
    {
        title: 'Harry Potter and the Sorcerer\'s Stone',
        author: 'J.K. Rowling',
        genre: 'YA Fantasy',
        isbn: '9780590353427',
        description: 'Harry Potter has no idea how famous he is. That\'s because he\'s being raised by his miserable aunt and uncle who are terrified Harry will learn that he\'s really a wizard, just as his parents were.',
        coverImage: 'https://covers.openlibrary.org/b/isbn/9780590353427-L.jpg'
    },
    {
        title: 'The Fault in Our Stars',
        author: 'John Green',
        genre: 'YA Contemporary',
        isbn: '9780525478812',
        description: 'A heartbreaking and beautiful story about two teenagers who meet at a cancer support group.',
        coverImage: 'https://covers.openlibrary.org/b/isbn/9780525478812-L.jpg'
    },
    {
        title: 'Six of Crows',
        author: 'Leigh Bardugo',
        genre: 'YA Fantasy',
        isbn: '9781627792127',
        description: 'Criminal prodigy Kaz Brekker is offered a chance at a deadly heist that could make him rich beyond his wildest dreams - but he can\'t pull it off alone.',
        coverImage: 'https://covers.openlibrary.org/b/isbn/9781627792127-L.jpg'
    },
    // Non-Fiction
    {
        title: 'Sapiens: A Brief History of Humankind',
        author: 'Yuval Noah Harari',
        genre: 'Non-Fiction History',
        isbn: '9780062316097',
        description: 'A groundbreaking narrative of humanity\'s creation and evolution—a #1 international bestseller that explores the ways in which biology and history have defined us and enhanced our understanding of what it means to be “human.”',
        coverImage: 'https://covers.openlibrary.org/b/isbn/9780062316097-L.jpg'
    },
    {
        title: 'Educated: A Memoir',
        author: 'Tara Westover',
        genre: 'Memoir',
        isbn: '9780399590504',
        description: 'An unforgettable memoir about a young girl who, kept out of school, leaves her survivalist family and goes on to earn a PhD from Cambridge University.',
        coverImage: 'https://covers.openlibrary.org/b/isbn/9780399590504-L.jpg'
    },
    {
        title: 'Becoming',
        author: 'Michelle Obama',
        genre: 'Memoir',
        isbn: '9781524763138',
        description: 'The inspiring and deeply personal memoir of the former First Lady of the United States.',
        coverImage: 'https://covers.openlibrary.org/b/isbn/9781524763138-L.jpg'
    },
    {
        title: 'The Immortal Life of Henrietta Lacks',
        author: 'Rebecca Skloot',
        genre: 'Non-Fiction Science',
        isbn: '9781400052189',
        description: 'The story of Henrietta Lacks, a poor black tobacco farmer whose cells—taken without her knowledge in 1951—became one of the most important tools in medicine.',
        coverImage: 'https://covers.openlibrary.org/b/isbn/9781400052189-L.jpg'
    },
    {
        title: 'Thinking, Fast and Slow',
        author: 'Daniel Kahneman',
        genre: 'Psychology',
        isbn: '9780374533557',
        description: 'A Nobel laureate explains the two systems that drive the way we think: System 1 is fast, intuitive, and emotional; System 2 is slower, more deliberative, and more logical.',
        coverImage: 'https://covers.openlibrary.org/b/isbn/9780374533557-L.jpg'
    },
    // More variety
    {
        title: 'The Lord of the Rings',
        author: 'J.R.R. Tolkien',
        genre: 'Fantasy',
        isbn: '9780618640157', // often a combined edition
        description: 'The epic fantasy adventure of Frodo Baggins and the Fellowship\'s quest to destroy the One Ring.',
        coverImage: 'https://covers.openlibrary.org/b/isbn/9780618640157-L.jpg'
    },
    {
        title: 'Brave New World',
        author: 'Aldous Huxley',
        genre: 'Dystopian Fiction',
        isbn: '9780060850524',
        description: 'A dystopian novel which prophesied a future society devoid of pain, war, poverty, and suffering - but at what cost?',
        coverImage: 'https://covers.openlibrary.org/b/isbn/9780060850524-L.jpg'
    },
    {
        title: 'The Catcher in the Rye',
        author: 'J.D. Salinger',
        genre: 'Classic Fiction',
        isbn: '9780316769488',
        description: 'The story of teenager Holden Caulfield\'s disillusionment with the adult world.',
        coverImage: 'https://covers.openlibrary.org/b/isbn/9780316769488-L.jpg'
    },
    {
        title: 'Fahrenheit 451',
        author: 'Ray Bradbury',
        genre: 'Dystopian Fiction',
        isbn: '9781451673319',
        description: 'A future American society where books are outlawed and "firemen" burn any that are found.',
        coverImage: 'https://covers.openlibrary.org/b/isbn/9781451673319-L.jpg'
    },
    {
        title: 'The Hitchhiker\'s Guide to the Galaxy',
        author: 'Douglas Adams',
        genre: 'Sci-Fi Comedy',
        isbn: '9780345391803',
        description: 'Seconds before the Earth is demolished to make way for a galactic freeway, Arthur Dent is plucked off the planet by his friend Ford Prefect, a researcher for the revised edition of The Hitchhiker\'s Guide to the Galaxy.',
        coverImage: 'https://covers.openlibrary.org/b/isbn/9780345391803-L.jpg'
    },
    {
        title: 'Crime and Punishment',
        author: 'Fyodor Dostoevsky',
        genre: 'Classic Psychological Fiction',
        isbn: '9780140449136',
        description: 'A psychological drama detailing an impoverished student\'s moral dilemmas following his murder of an elderly pawnbroker.',
        coverImage: 'https://covers.openlibrary.org/b/isbn/9780140449136-L.jpg'
    },
    {
        title: 'The Kite Runner',
        author: 'Khaled Hosseini',
        genre: 'Historical Fiction',
        isbn: '9781594631931',
        description: 'An unforgettable, heartbreaking story of the unlikely friendship between a wealthy boy and the son of his father’s servant, The Kite Runner is a beautifully crafted novel set in a country that is in the process of being destroyed.',
        coverImage: 'https://covers.openlibrary.org/b/isbn/9781594631931-L.jpg'
    },
    {
        title: 'The Book Thief',
        author: 'Markus Zusak',
        genre: 'Historical Fiction',
        isbn: '9780375842207',
        description: 'Narrated by Death, this is the story of Liesel Meminger, a foster girl living outside of Munich in Nazi Germany, who scratches out a meager existence for herself by stealing when she encounters something she can’t resist–books.',
        coverImage: 'https://covers.openlibrary.org/b/isbn/9780375842207-L.jpg'
    },
    {
        title: 'The Road',
        author: 'Cormac McCarthy',
        genre: 'Post-Apocalyptic Fiction',
        isbn: '9780307387899',
        description: 'A father and his son walk alone through burned America. Nothing moves in the ravaged landscape save the ash on the wind.',
        coverImage: 'https://covers.openlibrary.org/b/isbn/9780307387899-L.jpg'
    },
    {
        title: 'American Gods',
        author: 'Neil Gaiman',
        genre: 'Fantasy',
        isbn: '9780380789030',
        description: 'A recently released ex-convict named Shadow meets a mysterious man who calls himself "Wednesday" and who knows more than he first seems to about Shadow\'s life and past.',
        coverImage: 'https://covers.openlibrary.org/b/isbn/9780380789030-L.jpg'
    },
    {
        title: 'The Handmaid\'s Tale',
        author: 'Margaret Atwood',
        genre: 'Dystopian Fiction',
        isbn: '9780385490818',
        description: 'Set in a near-future New England, in a totalitarian state resembling a theonomy, which has overthrown the United States government.',
        coverImage: 'https://covers.openlibrary.org/b/isbn/9780385490818-L.jpg'
    },
    {
        title: 'Cosmos',
        author: 'Carl Sagan',
        genre: 'Non-Fiction Science',
        isbn: '9780345539434',
        description: 'Based on the landmark television series, Sagan explores 15 billion years of cosmic evolution and the development of science and civilization.',
        coverImage: 'https://covers.openlibrary.org/b/isbn/9780345539434-L.jpg'
    },
    {
        title: 'A Short History of Nearly Everything',
        author: 'Bill Bryson',
        genre: 'Popular Science',
        isbn: '9780767908184',
        description: 'A quest to understand everything that has happened from the Big Bang to the rise of civilization.',
        coverImage: 'https://covers.openlibrary.org/b/isbn/9780767908184-L.jpg'
    },
    {
        title: 'The Power of Habit',
        author: 'Charles Duhigg',
        genre: 'Self-Help Psychology',
        isbn: '9780812981605',
        description: 'An exploration of the science of habit formation in our lives, companies, and societies.',
        coverImage: 'https://covers.openlibrary.org/b/isbn/9780812981605-L.jpg'
    },
    {
        title: 'Atomic Habits',
        author: 'James Clear',
        genre: 'Self-Help',
        isbn: '9780735211292',
        description: 'An easy and proven way to build good habits and break bad ones, by making tiny changes that deliver powerful results.',
        coverImage: 'https://covers.openlibrary.org/b/isbn/9780735211292-L.jpg'
    },
    {
        title: 'The Subtle Art of Not Giving a F\*ck',
        author: 'Mark Manson',
        genre: 'Self-Help',
        isbn: '9780062457714',
        description: 'A counterintuitive approach to living a good life.',
        coverImage: 'https://covers.openlibrary.org/b/isbn/9780062457714-L.jpg'
    },
    {
        title: 'Freakonomics',
        author: 'Steven D. Levitt & Stephen J. Dubner',
        genre: 'Economics',
        isbn: '9780060731335',
        description: 'A rogue economist explores the hidden side of everything.',
        coverImage: 'https://covers.openlibrary.org/b/isbn/9780060731335-L.jpg'
    },
    {
        title: 'Good Omens',
        author: 'Neil Gaiman & Terry Pratchett',
        genre: 'Fantasy Comedy',
        isbn: '9780060853976',
        description: 'The Antichrist has been born, and an angel and a demon team up to prevent Armageddon.',
        coverImage: 'https://covers.openlibrary.org/b/isbn/9780060853976-L.jpg'
    },
    {
        title: 'The Color Purple',
        author: 'Alice Walker',
        genre: 'Historical Fiction',
        isbn: '9780156028356',
        description: 'An inspiring story of a woman named Celie, who finds her voice in the early 20th-century American South.',
        coverImage: 'https://covers.openlibrary.org/b/isbn/9780156028356-L.jpg'
    },
    {
        title: 'Beloved',
        author: 'Toni Morrison',
        genre: 'Historical Fiction',
        isbn: '9781400033416',
        description: 'A haunting novel about the legacy of slavery, centered on a former slave named Sethe.',
        coverImage: 'https://covers.openlibrary.org/b/isbn/9781400033416-L.jpg'
    },
    {
        title: 'The Shining',
        author: 'Stephen King',
        genre: 'Horror',
        isbn: '9780307743657',
        description: 'Jack Torrance becomes the winter caretaker at the isolated Overlook Hotel in Colorado, hoping to cure his writer\'s block. He settles in with his wife, Wendy, and his son, Danny, who is plagued by psychic premonitions.',
        coverImage: 'https://covers.openlibrary.org/b/isbn/9780307743657-L.jpg'
    }
];

// Disclaimer: 
// - ISBNs are for common editions but variations exist.
// - Cover images are fetched from Open Library Covers API (covers.openlibrary.org).
//   If a cover is not found for a specific ISBN, a placeholder or "not found" image might be displayed by the API.
// - Descriptions are brief summaries.

async function seedDatabase() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('MongoDB connected for seeding!');

        // 1. Find or create the seed user
        let seedUser = await User.findOne({ email: SEED_USER_EMAIL });

        if (!seedUser) {
            console.log(`User with email ${SEED_USER_EMAIL} not found. Creating a new user...`);
            seedUser = new User(NEW_USER_DETAILS);
            await seedUser.save();
            console.log(`User "${seedUser.username}" created with ID: ${seedUser._id}`);
        } else {
            console.log(`Found user "${seedUser.username}" with ID: ${seedUser._id}`);
        }

        // 2. Prepare books with the user's ID
        const booksWithUser = sampleBooks.map(book => ({
            ...book,
            addedBy: seedUser._id
        }));

        // 3. Clear existing books (optional: uncomment if you want to clear before seeding)
        console.log('Clearing existing books...');
        await Book.deleteMany({});
        console.log('Existing books cleared.');

        // 4. Insert new books
        console.log('Inserting sample books...');
        await Book.insertMany(booksWithUser);
        console.log(`${booksWithUser.length} sample books inserted successfully!`);

    } catch (error) {
        console.error('Error seeding database:', error);
    } finally {
        await mongoose.disconnect();
        console.log('MongoDB disconnected.');
    }
}

seedDatabase();