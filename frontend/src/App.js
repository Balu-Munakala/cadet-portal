import React, { useState } from 'react';
import './App.css';

// Use the environment variable for the backend URL
const backendUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000';

function App() {
  const [message, setMessage] = useState('');

  const testConnection = async () => {
    try {
      const response = await fetch(backendUrl);
      const text = await response.text();
      setMessage(text);
    } catch (error) {
      setMessage('Error connecting to backend.');
      console.error('Error:', error);
    }
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>Frontend-Backend Connection Test</h1>
        <button onClick={testConnection}>Test Connection</button>
        <p>{message}</p>
      </header>
    </div>
  );
}

export default App;