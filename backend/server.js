const express = require('express');
const cors = require('cors');
const app = express();
const PORT = process.env.PORT || 5000;

// The URL of your Vercel frontend deployment
const vercelFrontendURL = 'https://cadet-portal.vercel.app'; 

app.use(cors({
  origin: vercelFrontendURL
}));

// Define a simple test route
app.get('/', (req, res) => {
  res.send('Backend is running!');
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});