const express = require('express');
const cors = require('cors');
const app = express();
const PORT = process.env.PORT || 5000;

// The CORS configuration is now dynamic
const allowedOrigins = [
  'http://localhost:3000', // For local development
  'https://cadet-portal.vercel.app', // Your Vercel frontend URL
  process.env.FRONTEND_URL, // A dedicated environment variable for a production URL
];

// Configure CORS
app.use(cors({
  origin: function (origin, callback) {
    // Check if the requested origin is in our allowed list
    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  }
}));

// Define a simple test route
app.get('/', (req, res) => {
  res.send('Backend is running!');
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});