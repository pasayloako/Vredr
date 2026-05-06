const express = require('express');
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// API route to serve bible data (optional - for future enhancements)
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Bible Reader API is running' });
});

// Serve index.html for all other routes (SPA support)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start server
app.listen(PORT, () => {
  console.log(`✅ Bible Reader server running on http://localhost:${PORT}`);
  console.log(`📖 Open your browser to view the KJV Bible reader`);
});
