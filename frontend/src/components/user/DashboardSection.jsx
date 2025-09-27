import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './DashboardSection.module.css';

const DashboardSection = ({ apiBaseUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000'}) => {
  const [profile, setProfile] = useState({
    name: 'Loading...',
    contact: 'Loading...',
    email: 'Loading...',
    photo: '/default-photo.jpg' // Fallback for initial state
  });

  const navigate = useNavigate();

  useEffect(() => {
    // Fetch profile data
    fetch(`${apiBaseUrl}/api/users/profile`, { 
      credentials: 'include' 
    })
      .then(res => res.json())
      .then(data => {
        setProfile(prev => ({
          ...prev,
          name: data.name || 'N/A',
          contact: data.contact || 'N/A',
          email: data.email || 'N/A'
        }));
      })
      .catch(err => {
        console.error('Failed to fetch profile:', err);
      });

    // Fetch profile picture blob
    fetch(`${apiBaseUrl}/api/users/profile-pic`, { 
      credentials: 'include' 
    })
      .then(res => res.blob())
      .then(blob => {
        const imgUrl = URL.createObjectURL(blob);
        setProfile(prev => ({ ...prev, photo: imgUrl }));
      })
      .catch(err => {
        console.error('Failed to fetch photo:', err);
        // Fallback to a local default image if the fetch fails
        setProfile(prev => ({ ...prev, photo: '/default-photo.jpg' }));
      });
  }, [apiBaseUrl]);

  return (
    <div className={styles.profileContainer}>
      <h1>Profile</h1>
      <div className={styles.profileHeader}>
        <img
          src={profile.photo}
          alt="Profile"
          onError={(e) => { 
            e.target.onerror = null; 
            e.target.src = '/default-photo.jpg';
          }}
        />
        <h2>{profile.name}</h2>
      </div>
      <div className={styles.profileDetails}>
        <p><strong>Contact:</strong> {profile.contact}</p>
        <p><strong>Email:</strong> {profile.email}</p>
      </div>
      <button 
        className={styles.profileBtn}
        onClick={() => navigate('/cadet/attendance')}
      >
        View Attendance
      </button>
      <button 
        className={styles.profileBtn}
        onClick={() => navigate('/cadet/changePassword')}
      >
        Change Password
      </button>
    </div>
  );
};

export default DashboardSection;
