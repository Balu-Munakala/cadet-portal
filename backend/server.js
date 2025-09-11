const express = require('express');
const cors = require('cors');
const { Pool } = require('pg'); // Import the Pool class from pg
const app = express();
const PORT = process.env.PORT || 5000;

// Use a single environment variable for the database URL
const dbConnectionString = process.env.DATABASE_URL;

// Create a new Pool instance for database connections
const pool = new Pool({
  connectionString: dbConnectionString,
  ssl: {
    rejectUnauthorized: false
  }
});

const allowedOrigins = [
  'http://localhost:3000',
  'https://cadet-portal.vercel.app',
  process.env.FRONTEND_URL,
];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  }
}));

app.use(express.json());

// Add a new test route to verify database connection
app.get('/db-test', async (req, res) => {
  try {
    const result = await pool.query('SELECT NOW()');
    res.send(`Database connected! Current time: ${result.rows[0].now}`);
  } catch (err) {
    res.status(500).send('Database connection failed.');
    console.error(err);
  }
});

app.get('/', (req, res) => {
  res.send('Backend is running!');
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});