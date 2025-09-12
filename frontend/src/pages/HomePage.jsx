import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './HomePage.module.css';

const HomePage = ({ apiBaseUrl }) => {
  const [activeForm, setActiveForm] = useState(null); // 'login' | 'register'
  const [formType, setFormType] = useState('user');  // 'user' | 'admin'
  const [anoList, setAnoList] = useState([]);
  const [loginData, setLoginData] = useState({ identifier: '', password: '' });
  const [registerData, setRegisterData] = useState({
    name: '',
    email: '',
    contact: '',
    regimental_number: '',
    ano_id: '',
    role: 'ANO',
    type: 'user',
    password: '',
    confirm_password: ''
  });
  const [message, setMessage] = useState('');
  
  // Initialize useNavigate hook for smoother navigation
  const navigate = useNavigate();

  // Fetch ANO list on mount
  useEffect(() => {
    if (!apiBaseUrl) {
      console.error("API base URL is not defined.");
      return;
    }
    const fetchANOList = async () => {
      try {
        const res = await fetch(`${apiBaseUrl}/auth/anos`, {
          credentials: 'include' // Important for cookies
        });
        const data = await res.json();
        if (res.ok) setAnoList(data);
        else console.error('Failed to fetch ANO list:', data.message);
      } catch (err) {
        console.error('Failed to fetch ANO list:', err);
      }
    };
    fetchANOList();
  }, [apiBaseUrl]);

  // Handle Login
  const handleLogin = async e => {
    e.preventDefault();
    setMessage('');
    try {
      const res = await fetch(`${apiBaseUrl}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',  // Critical for session cookies
        body: JSON.stringify({
          identifier: loginData.identifier,
          password: loginData.password
        })
      });
      const data = await res.json();
      if (res.ok) {
        // Use navigate for a smoother redirect
        navigate(data.redirect);
      } else {
        setMessage(data.msg || data.message || 'Invalid credentials.');
      }
    } catch {
      setMessage('Server error. Try again later.');
    }
  };

  // Handle Register
  const handleRegister = async e => {
    e.preventDefault();
    setMessage('');
    if (registerData.password !== registerData.confirm_password) {
      setMessage('❌ Passwords do not match!');
      return;
    }

    const endpoint =
      formType === 'admin'
        ? `${apiBaseUrl}/auth/register-admin`
        : `${apiBaseUrl}/auth/register-user`;

    const payload =
      formType === 'admin'
        ? {
            ano_id: registerData.ano_id, // Use consistent key
            role: registerData.role,
            type: registerData.type,
            name: registerData.name,
            email: registerData.email,
            contact: registerData.contact,
            password: registerData.password
          }
        : {
            regimental_number: registerData.regimental_number,
            ano_id: registerData.ano_id,
            name: registerData.name,
            email: registerData.email,
            contact: registerData.contact,
            password: registerData.password
          };

    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',  // Keep cookies consistent
        body: JSON.stringify(payload)
      });
      const result = await res.json();
      if (res.ok) {
        setMessage('✅ Registered successfully!');
        setTimeout(() => setActiveForm(null), 1500);
      } else {
        setMessage(result.msg || result.message || 'Registration failed.');
      }
    } catch {
      setMessage('Server error. Try again later.');
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setRegisterData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  return (
    <div className={styles.homepage}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.logoContainer}>
          <img src="logo.png" alt="Logo" />
        </div>
        <div className={styles.centerImageContainer}>
          <img
            src="https://cdn.gitam.edu/images/logo/gitam-new-logo.png"
            alt="GITAM Logo"
          />
        </div>
        <div className={styles.buttonGroup}>
          <button
            className={styles.textButton}
            onClick={() =>
              setActiveForm(prev => (prev === 'login' ? null : 'login'))
            }
          >
            {activeForm === 'login' ? 'Close' : 'Login'}
          </button>
          <button
            className={styles.textButton}
            onClick={() =>
              setActiveForm(prev => (prev === 'register' ? null : 'register'))
            }
          >
            {activeForm === 'register' ? 'Close' : 'Register'}
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className={styles.mainContent}>
        {/* Login Form */}
        {activeForm === 'login' && (
          <div className={styles.loginContainer}>
            <div className={styles.loginBox}>
              <form onSubmit={handleLogin}>
                <input
                  type="text"
                  name="identifier"
                  placeholder="Regimental No./ANO ID"
                  value={loginData.identifier}
                  onChange={e =>
                    setLoginData({
                      ...loginData,
                      identifier: e.target.value
                    })
                  }
                  required
                />
                <input
                  type="password"
                  name="password"
                  placeholder="Password"
                  value={loginData.password}
                  onChange={e =>
                    setLoginData({
                      ...loginData,
                      password: e.target.value
                    })
                  }
                  required
                />
                <button type="submit" className={styles.loginBtn}>Login</button>
              </form>
              {message && <p className={styles.errorMessage}>{message}</p>}
            </div>
          </div>
        )}

        {/* Register Form */}
        {activeForm === 'register' && (
          <div className={styles.loginContainer}>
            <div className={styles.loginBox}>
              {/* toggle user/admin */}
              <div className={styles.toggleGroup}>
                <button
                  className={`${styles.toggleBtn} ${formType === 'user' ? styles.active : ''}`}
                  onClick={() => setFormType('user')}
                >
                  User
                </button>
                <button
                  className={`${styles.toggleBtn} ${formType === 'admin' ? styles.active : ''}`}
                  onClick={() => setFormType('admin')}
                >
                  Admin
                </button>
              </div>

              <form onSubmit={handleRegister}>
                {/* admin fields */}
                {formType === 'admin' && (
                  <>
                    <input
                      type="text"
                      name="anoId"
                      placeholder="ANO ID"
                      value={registerData.anoId}
                      onChange={handleInputChange}
                      required
                    />
                    <select
                      name="role"
                      value={registerData.role}
                      onChange={handleInputChange}
                    >
                      <option value="ANO">ANO</option>
                      <option value="Caretaker">Caretaker</option>
                    </select>
                    <select
                      name="type"
                      value={registerData.type}
                      onChange={handleInputChange}
                      required
                    >
                      <option value="FSFS">FSFS</option>
                      <option value="GNL">GNL</option>
                      <option value="GOVT">GOVT</option>
                    </select>
                  </>
                )}

                {/* user fields */}
                {formType === 'user' && (
                  <>
                    <input
                      type="text"
                      name="regimental_number"
                      placeholder="Regimental Number"
                      value={registerData.regimental_number}
                      onChange={handleInputChange}
                      required
                    />
                    <select
                      name="ano_id"
                      value={registerData.ano_id}
                      onChange={handleInputChange}
                      required
                    >
                      <option value="">Select ANO/CTO</option>
                      {anoList.map(admin => (
                        <option key={admin.ano_id} value={admin.ano_id}>
                          {admin.name} ({admin.role})
                        </option>
                      ))}
                    </select>
                  </>
                )}

                {/* common fields */}
                <input
                  type="text"
                  name="name"
                  placeholder="Full Name"
                  value={registerData.name}
                  onChange={handleInputChange}
                  required
                />
                <input
                  type="email"
                  name="email"
                  placeholder="Email Address"
                  value={registerData.email}
                  onChange={handleInputChange}
                  required
                />
                <input
                  type="text"
                  name="contact"
                  placeholder="Contact Number"
                  value={registerData.contact}
                  onChange={handleInputChange}
                />
                <input
                  type="password"
                  name="password"
                  placeholder="Password"
                  value={registerData.password}
                  onChange={handleInputChange}
                  required
                />
                <input
                  type="password"
                  name="confirm_password"
                  placeholder="Confirm Password"
                  value={registerData.confirm_password}
                  onChange={handleInputChange}
                  required
                />
                <button type="submit" className={styles.loginBtn}>
                  Register
                </button>
              </form>
              {message && <p className={styles.errorMessage}>{message}</p>}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default HomePage;