import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './NotificationManager.module.css';

export default function NotificationManager({ apiBaseUrl = process.env.REACT_APP_API_URL}) {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const navigate = useNavigate();

  useEffect(() => {
    fetchNotifications();
  }, [apiBaseUrl]);

  const fetchNotifications = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${apiBaseUrl}/api/master/notifications`, { 
        credentials: 'include' 
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setNotifications(data);
    } catch (err) {
      console.error('[NotificationManager] ', err);
      setError('Failed to load notifications.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <h2>All Notifications (System-wide)</h2>
      {loading && <div className={styles.loading}>Loading…</div>}
      {error && <div className={styles.error}>{error}</div>}

      {!loading && !notifications.length && <div className={styles.noData}>No notifications found.</div>}

      {!loading && notifications.length > 0 && (
        <ul className={styles.list}>
          {notifications.map((n) => {
            const {
              notification_id,
              regimental_number,
              cadet_name,
              type,
              message,
              link,
              is_read,
              created_at,
            } = n;
            const dateObj = new Date(created_at);
            const formattedDate = dateObj.toLocaleDateString();
            const formattedTime = dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

            return (
              <li key={notification_id} className={styles.item}>
                <div className={styles.header}>
                  <span className={styles.type}>{type}</span>
                  <span className={styles.cadet}>
                    Cadet: {cadet_name} ({regimental_number})
                  </span>
                  <span className={styles.timestamp}>
                    {formattedDate} {formattedTime}
                  </span>
                </div>
                <p className={styles.message}>{message}</p>
                {link && (
                  <button onClick={() => navigate(link)} className={styles.link}>
                    View Details
                  </button>
                )}
                <div className={styles.status}>
                  {is_read ? <span className={styles.read}>Read</span> : <span className={styles.unread}>Unread</span>}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
