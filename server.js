const express = require('express');
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Bible API Base URL
const BIBLE_API_BASE = 'https://raw.githubusercontent.com/wldeh/bible-api/refs/heads/main/bibles/en-kjv';

// Pre-computed chapter counts for all 66 books
const MAX_CHAPTERS = {
    "Genesis": 50, "Exodus": 40, "Leviticus": 27, "Numbers": 36, "Deuteronomy": 34,
    "Joshua": 24, "Judges": 21, "Ruth": 4, "1 Samuel": 31, "2 Samuel": 24,
    "1 Kings": 22, "2 Kings": 25, "1 Chronicles": 29, "2 Chronicles": 36, "Ezra": 10,
    "Nehemiah": 13, "Esther": 10, "Job": 42, "Psalms": 150, "Proverbs": 31,
    "Ecclesiastes": 12, "Song of Solomon": 8, "Isaiah": 66, "Jeremiah": 52,
    "Lamentations": 5, "Ezekiel": 48, "Daniel": 12, "Hosea": 14, "Joel": 3,
    "Amos": 9, "Obadiah": 1, "Jonah": 4, "Micah": 7, "Nahum": 3, "Habakkuk": 3,
    "Zephaniah": 3, "Haggai": 2, "Zechariah": 14, "Malachi": 4, "Matthew": 28,
    "Mark": 16, "Luke": 24, "John": 21, "Acts": 28, "Romans": 16, "1 Corinthians": 16,
    "2 Corinthians": 13, "Galatians": 6, "Ephesians": 6, "Philippians": 4,
    "Colossians": 4, "1 Thessalonians": 5, "2 Thessalonians": 3, "1 Timothy": 6,
    "2 Timothy": 4, "Titus": 3, "Philemon": 1, "Hebrews": 13, "James": 5,
    "1 Peter": 5, "2 Peter": 3, "1 John": 5, "2 John": 1, "3 John": 1,
    "Jude": 1, "Revelation": 22
};

// Helper function to convert display name to API format
function getApiBookName(displayName) {
    const lower = displayName.toLowerCase();
    const specials = {
        "1 samuel": "1_samuel", "2 samuel": "2_samuel",
        "1 kings": "1_kings", "2 kings": "2_kings",
        "1 chronicles": "1_chronicles", "2 chronicles": "2_chronicles",
        "1 corinthians": "1_corinthians", "2 corinthians": "2_corinthians",
        "1 thessalonians": "1_thessalonians", "2 thessalonians": "2_thessalonians",
        "1 timothy": "1_timothy", "2 timothy": "2_timothy",
        "1 peter": "1_peter", "2 peter": "2_peter",
        "1 john": "1_john", "2 john": "2_john", "3 john": "3_john"
    };
    if (specials[lower]) return specials[lower];
    return lower.replace(/ /g, "_");
}

// API: Get list of all books
app.get('/api/books', (req, res) => {
    const books = Object.keys(MAX_CHAPTERS);
    res.json({
        success: true,
        books: books,
        chapters: MAX_CHAPTERS
    });
});

// API: Get chapter information (max chapters for a book)
app.get('/api/book/:bookName', (req, res) => {
    const { bookName } = req.params;
    const maxChapters = MAX_CHAPTERS[bookName];
    
    if (!maxChapters) {
        return res.status(404).json({
            success: false,
            error: 'Book not found'
        });
    }
    
    res.json({
        success: true,
        book: bookName,
        maxChapters: maxChapters
    });
});

// API: Get specific chapter verses
app.get('/api/bible/:book/:chapter', async (req, res) => {
    const { book, chapter } = req.params;
    const chapterNum = parseInt(chapter);
    
    // Validate book exists
    if (!MAX_CHAPTERS[book]) {
        return res.status(404).json({
            success: false,
            error: 'Book not found'
        });
    }
    
    // Validate chapter range
    if (chapterNum < 1 || chapterNum > MAX_CHAPTERS[book]) {
        return res.status(400).json({
            success: false,
            error: `Chapter must be between 1 and ${MAX_CHAPTERS[book]}`
        });
    }
    
    try {
        const apiBook = getApiBookName(book);
        const maxVerses = 200;
        const promises = [];
        
        // Fetch all verses in parallel
        for (let v = 1; v <= maxVerses; v++) {
            const url = `${BIBLE_API_BASE}/books/${apiBook}/chapters/${chapterNum}/verses/${v}.json`;
            promises.push(
                fetch(url).then(res => res.ok ? res.json() : null).catch(() => null)
            );
        }
        
        const results = await Promise.all(promises);
        const verses = [];
        
        for (let i = 0; i < results.length; i++) {
            const data = results[i];
            if (data && data.text) {
                verses.push({
                    number: parseInt(data.verse) || (i + 1),
                    text: data.text.trim()
                });
            } else {
                if (verses.length > 0 && i + 1 > verses.length + 5) break;
            }
        }
        
        if (verses.length === 0) {
            throw new Error('No verses found');
        }
        
        res.json({
            success: true,
            book: book,
            chapter: chapterNum,
            verses: verses,
            totalVerses: verses.length
        });
        
    } catch (error) {
        console.error('Error fetching Bible chapter:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch chapter data'
        });
    }
});

// API: Get random chapter
app.get('/api/random', (req, res) => {
    const books = Object.keys(MAX_CHAPTERS);
    const randomIndex = Math.floor(Math.random() * books.length);
    const randomBook = books[randomIndex];
    const randomChapter = Math.floor(Math.random() * MAX_CHAPTERS[randomBook]) + 1;
    
    res.json({
        success: true,
        book: randomBook,
        chapter: randomChapter
    });
});

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        version: '1.0.0',
        totalBooks: Object.keys(MAX_CHAPTERS).length
    });
});

// Serve index.html for all other routes (SPA support)
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start server
app.listen(PORT, () => {
    console.log(`✅ Bible Reader server running on http://localhost:${PORT}`);
    console.log(`📖 API endpoints:`);
    console.log(`   - GET /api/books - Get all books`);
    console.log(`   - GET /api/bible/:book/:chapter - Get chapter verses`);
    console.log(`   - GET /api/random - Get random chapter`);
    console.log(`   - GET /api/health - Health check`);
});
