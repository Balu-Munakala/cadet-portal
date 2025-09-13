import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaUsers, FaUserShield, FaChartPie, FaBell } from 'react-icons/fa';
import styles from './DashboardSection.module.css';

const MasterDashboardSection = ({ apiBaseUrl = process.env.REACT_APP_API_URL}) => {
  const [profile, setProfile] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [picUrl, setPicUrl] = useState('/default.jpg');
  const [searchTerm, setSearchTerm] = useState('');

  const navigate = useNavigate();

  useEffect(() => {
    // Single function to fetch all initial data
    const fetchInitialData = async () => {
      try {
        const [profileRes, picRes, notificationsRes] = await Promise.all([
          fetch(`${apiBaseUrl}/api/master/profile`, { credentials: 'include' }),
          fetch(`${apiBaseUrl}/api/master/profile-pic`, { credentials: 'include' }),
          fetch(`${apiBaseUrl}/api/notifications`, { credentials: 'include' })
        ]);

        if (profileRes.ok) {
          const profileData = await profileRes.json();
          setProfile(profileData);
        }

        if (picRes.ok) {
          const picBlob = await picRes.blob();
          setPicUrl(URL.createObjectURL(picBlob));
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
            src={picUrl}
            alt="Master"
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
        <p><strong>Contact:</strong> {profile?.contact || 'N/A'}</p>
        <p><strong>Email:</strong> {profile?.email || 'N/A'}</p>
      </div>

      <div className={styles.quickAccessCards}>
        <div className={styles.card} onClick={() => navigate('/administrator/manage-users')}>
          <FaUsers className={styles.cardIcon} />
          <h3>Manage Cadets</h3>
          <p>View and manage all registered cadet users.</p>
        </div>
        <div className={styles.card} onClick={() => navigate('/administrator/manage-admins')}>
          <FaUserShield className={styles.cardIcon} />
          <h3>Manage Admins</h3>
          <p>Approve, assign, and monitor ANOs and caretakers.</p>
        </div>
        <div className={styles.card} onClick={() => navigate('/administrator/system-reports')}>
          <FaChartPie className={styles.cardIcon} />
          <h3>System Reports</h3>
          <p>Monitor system-level analytics and logs.</p>
        </div>
        <div className={styles.card} onClick={() => navigate('/administrator/notifications')}>
          <FaBell className={styles.cardIcon} />
          <h3>Notifications</h3>
          <p>Review system-wide alerts and announcements.</p>
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
          placeholder="Search for admins, users, or system logs..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
        />
      </div>
    </div>
  );
};

export default MasterDashboardSection;
