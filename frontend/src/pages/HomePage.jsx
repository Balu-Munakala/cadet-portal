import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './HomePage.module.css';

const HomePage = ({ apiBaseUrl }) => {
  const [activeForm, setActiveForm] = useState(null); // 'login' | 'register' | 'reset'
  const [formType, setFormType] = useState('user');  // 'user' | 'admin'
  const [resetStep, setResetStep] = useState(1); // 1: email, 2: otp, 3: new password
  const [anoList, setAnoList] = useState([]);
  const [loginData, setLoginData] = useState({ identifier: '', password: '' });
  const [resetData, setResetData] = useState({
    email: '',
    userType: 'user',
    otp: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [registerData, setRegisterData] = useState({
    name: '',
    email: '',
    contact: '',
    regimental_number: '',
    ano_id: '',
    role: 'ANO',
    type: 'FSFS',
    password: '',
    confirm_password: ''
  });
  const [message, setMessage] = useState('');
  
  const navigate = useNavigate();

  useEffect(() => {
    if (!apiBaseUrl) {
      console.error("API base URL is not defined.");
      return;
    }
    const fetchANOList = async () => {
      try {
        const res = await fetch(`${apiBaseUrl}/auth/anos`, {
          credentials: 'include'
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

  const handleLogin = async e => {
    e.preventDefault();
    setMessage('');
    try {
      const res = await fetch(`${apiBaseUrl}/auth/login`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({
          identifier: loginData.identifier,
          password: loginData.password
        })
      });
      
      const data = await res.json();
      if (res.ok) {
        // Initialize session timer
        localStorage.setItem('sessionStart', Date.now().toString());
        navigate(data.redirect);
      } else {
        setMessage(data.msg || data.message || 'Invalid credentials.');
      }
    } catch (error) {
      setMessage('Server error. Try again later.');
    }
  };

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
            anoId: registerData.ano_id,
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
        credentials: 'include',
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

  const handlePasswordReset = async (e) => {
    e.preventDefault();
    setMessage('');

    if (resetStep === 1) {
      // Request OTP
      try {
        const res = await fetch(`${apiBaseUrl}/password-reset/request`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            email: resetData.email,
            userType: resetData.userType
          })
        });
        
        const data = await res.json();
        if (res.ok) {
          setMessage('✅ OTP sent to your email!');
          setResetStep(2);
        } else {
          setMessage(data.message || 'Failed to send OTP');
        }
      } catch (error) {
        setMessage('Server error. Try again later.');
      }
    } else if (resetStep === 2) {
      // Verify OTP
      try {
        const res = await fetch(`${apiBaseUrl}/password-reset/verify-otp`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            email: resetData.email,
            otp: resetData.otp,
            userType: resetData.userType
          })
        });
        
        const data = await res.json();
        if (res.ok) {
          setMessage('✅ OTP verified! Enter new password.');
          setResetStep(3);
        } else {
          setMessage(data.message || 'Invalid OTP');
        }
      } catch (error) {
        setMessage('Server error. Try again later.');
      }
    } else if (resetStep === 3) {
      // Reset password
      if (resetData.newPassword !== resetData.confirmPassword) {
        setMessage('❌ Passwords do not match!');
        return;
      }

      try {
        const res = await fetch(`${apiBaseUrl}/password-reset/reset`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            email: resetData.email,
            otp: resetData.otp,
            newPassword: resetData.newPassword,
            userType: resetData.userType
          })
        });
        
        const data = await res.json();
        if (res.ok) {
          setMessage('✅ Password reset successfully!');
          setTimeout(() => {
            setActiveForm('login');
            setResetStep(1);
            setResetData({
              email: '',
              userType: 'user',
              otp: '',
              newPassword: '',
              confirmPassword: ''
            });
          }, 2000);
        } else {
          setMessage(data.message || 'Failed to reset password');
        }
      } catch (error) {
        setMessage('Server error. Try again later.');
      }
    }
  };

  const handleResetInputChange = (e) => {
    const { name, value } = e.target;
    setResetData(prev => ({
      ...prev,
      [name]: value
    }));
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
          <button
            className={styles.textButton}
            onClick={() => {
              if (activeForm === 'reset') {
                setActiveForm(null);
                setResetStep(1);
                setResetData({
                  email: '',
                  userType: 'user',
                  otp: '',
                  newPassword: '',
                  confirmPassword: ''
                });
              } else {
                setActiveForm('reset');
              }
            }}
          >
            {activeForm === 'reset' ? 'Close' : 'Reset Password'}
          </button>
        </div>
      </div>

      <div className={styles.mainContent}>
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
                <button
                  type="button"
                  className={styles.forgotPasswordBtn}
                  onClick={() => setActiveForm('reset')}
                >
                  Forgot Password?
                </button>
              </form>
              {message && <p className={styles.errorMessage}>{message}</p>}
            </div>
          </div>
        )}

        {activeForm === 'reset' && (
          <div className={styles.loginContainer}>
            <div className={styles.loginBox}>
              <h3 className={styles.resetTitle}>
                {resetStep === 1 && 'Reset Password - Enter Email'}
                {resetStep === 2 && 'Reset Password - Enter OTP'}
                {resetStep === 3 && 'Reset Password - New Password'}
              </h3>

              <form onSubmit={handlePasswordReset}>
                {resetStep === 1 && (
                  <>
                    <select
                      name="userType"
                      value={resetData.userType}
                      onChange={handleResetInputChange}
                      required
                    >
                      <option value="user">User</option>
                      <option value="admin">Admin</option>
                      <option value="master">Master</option>
                    </select>
                    <input
                      type="email"
                      name="email"
                      placeholder="Enter your email address"
                      value={resetData.email}
                      onChange={handleResetInputChange}
                      required
                    />
                    <button type="submit" className={styles.loginBtn}>
                      Send OTP
                    </button>
                  </>
                )}

                {resetStep === 2 && (
                  <>
                    <input
                      type="text"
                      name="otp"
                      placeholder="Enter 6-digit OTP"
                      value={resetData.otp}
                      onChange={handleResetInputChange}
                      maxLength="6"
                      required
                    />
                    <button type="submit" className={styles.loginBtn}>
                      Verify OTP
                    </button>
                    <button
                      type="button"
                      className={styles.backBtn}
                      onClick={() => setResetStep(1)}
                    >
                      Back
                    </button>
                  </>
                )}

                {resetStep === 3 && (
                  <>
                    <input
                      type="password"
                      name="newPassword"
                      placeholder="Enter new password"
                      value={resetData.newPassword}
                      onChange={handleResetInputChange}
                      required
                    />
                    <input
                      type="password"
                      name="confirmPassword"
                      placeholder="Confirm new password"
                      value={resetData.confirmPassword}
                      onChange={handleResetInputChange}
                      required
                    />
                    <button type="submit" className={styles.loginBtn}>
                      Reset Password
                    </button>
                    <button
                      type="button"
                      className={styles.backBtn}
                      onClick={() => setResetStep(2)}
                    >
                      Back
                    </button>
                  </>
                )}
              </form>
              {message && <p className={styles.errorMessage}>{message}</p>}
            </div>
          </div>
        )}

        {activeForm === 'register' && (
          <div className={styles.loginContainer}>
            <div className={styles.loginBox}>
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
                {formType === 'admin' && (
                  <>
                    <input
                      type="text"
                      name="ano_id"
                      placeholder="ANO ID"
                      value={registerData.ano_id}
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