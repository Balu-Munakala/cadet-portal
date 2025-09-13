import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaClipboardList, FaCalendarAlt, FaChartLine, FaQuestionCircle } from 'react-icons/fa';
import styles from './DashboardSection.module.css';

const DashboardSection = ({ apiBaseUrl }) => {
  const [profile, setProfile] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');

  const navigate = useNavigate();

  useEffect(() => {
    console.log('API Base URL is:', apiBaseUrl); 
    const fetchInitialData = async () => {
      try {
        const [profileRes, picRes, notificationsRes] = await Promise.all([
          fetch(`${apiBaseUrl}/api/admin/profile`, { credentials: 'include' }),
          fetch(`${apiBaseUrl}/api/admin/profile-pic`, { credentials: 'include' }),
          fetch(`${apiBaseUrl}/api/admin/notifications`, { credentials: 'include' })
        ]);

        // --- IMPROVED ERROR HANDLING ---
        if (!profileRes.ok) {
          // If the response is not OK, read it as text to see the HTML
          const errorText = await profileRes.text();
          console.error('Failed to fetch profile. Server responded with:', errorText);
          // You might want to navigate to login here, e.g., navigate('/login');
          return; // Stop further execution
        }
        
        const profileData = await profileRes.json();
        setProfile(profileData);
        
        // You can add similar checks for picRes and notificationsRes
        if (picRes.ok) {
          const picBlob = await picRes.blob();
          setProfile(prev => ({ ...prev, photoUrl: URL.createObjectURL(picBlob) }));
        }

        if (notificationsRes.ok) {
          const notificationsData = await notificationsRes.json();
          setNotifications(notificationsData);
        }
      } catch (err) {
        console.error('Initial data fetch error:', err);
      }
    };
    
    fetchInitialData();
  }, [apiBaseUrl]);

  return (
    <div className={styles.profileContainer}>
      <div className={styles.profileHeader}>
        <div className={styles.profilePictureContainer}>
          <img
            className={styles.profilePhoto}
            src={profile?.photoUrl || '/default.jpg'}
            alt="Profile"
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = '/default.jpg';
            }}
          />
        </div>
        <h1 className={styles.fullName}>
          {profile ? profile.name : 'Loading...'}
        </h1>
      </div>

      <div className={styles.profileDetails}>
        <div>
          <span>Contact: </span>
          <span>{profile?.contact || 'N/A'}</span>
        </div>
        <div>
          <span>Email: </span>
          <span>{profile?.email || 'N/A'}</span>
        </div>
      </div>

      <div className={styles.quickAccessCards}>
        <div className={styles.card} onClick={() => navigate('/admin/attendance')}>
          <FaClipboardList className={styles.cardIcon} />
          <h3>Attendance</h3>
          <p>Quickly take attendance for your unit.</p>
        </div>
        <div className={styles.card} onClick={() => navigate('/admin/events')}>
          <FaCalendarAlt className={styles.cardIcon} />
          <h3>View Events</h3>
          <p>Check upcoming events and schedules.</p>
        </div>
        <div className={styles.card} onClick={() => navigate('/admin/adminReports')}>
          <FaChartLine className={styles.cardIcon} />
          <h3>Generate Reports</h3>
          <p>Create and view detailed reports.</p>
        </div>
        <div className={styles.card} onClick={() => navigate('/admin/supportQueries')}>
          <FaQuestionCircle className={styles.cardIcon} />
          <h3>Support Queries</h3>
          <p>Manage and resolve support queries.</p>
        </div>
      </div>

      <div className={styles.notificationPanel}>
        <h2>Notifications</h2>
        <div className={styles.notifications}>
          {notifications.length > 0 ? (
            notifications.map((n, i) => (
              <div key={i} className={styles.notificationItem}>
                <p>{n.message}</p>
              </div>
            ))
          ) : (
            <p className={styles.noNotifications}>No new notifications</p>
          )}
        </div>
      </div>

      <div className={styles.searchBar}>
        <input
          type="text"
          placeholder="Search for cadets, events, or reports..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
        />
      </div>
    </div>
  );
};

export default DashboardSection;
