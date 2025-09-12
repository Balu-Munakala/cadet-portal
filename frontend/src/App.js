import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import HomePage from './pages/HomePage';
import UserDashboard from './pages/UserDashboard';
import AdminDashboard from './pages/AdminDashboard';
import MasterDashboard from './pages/MasterDashboard';

// Define the base URL for your API.
// This uses the environment variable set on Vercel for production,
// and falls back to localhost for local development.
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<HomePage apiBaseUrl={API_BASE_URL} />} />
        <Route path="/cadet" element={<UserDashboard apiBaseUrl={API_BASE_URL} />} />
        <Route path="/admin" element={<AdminDashboard apiBaseUrl={API_BASE_URL} />} />
        <Route path="/administrator" element={<MasterDashboard apiBaseUrl={API_BASE_URL} />} />
        {/* Add more routes as needed */}
      </Routes>
    </Router>
  );
}

export default App;