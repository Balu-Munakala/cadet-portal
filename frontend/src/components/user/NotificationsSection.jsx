import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './NotificationsSection.module.css';

export default function NotificationsSection({ apiBaseUrl = process.env.REACT_APP_API_URL}) {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [marking, setMarking] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  // 1) Fetch notifications on mount
  useEffect(() => {
    fetchNotifications();
  }, [apiBaseUrl]);

  const fetchNotifications = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${apiBaseUrl}/api/notifications`, {
        credentials: 'include'
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setNotifications(data);
    } catch (err) {
      console.error('[Fetch Notifications Error]', err);
      setError('Failed to load notifications.');
    } finally {
      setLoading(false);
    }
  };

  // 2) Mark a single notification as read
  const markAsRead = async (notificationId) => {
    setMarking(true);
    try {
      const res = await fetch(`${apiBaseUrl}/api/notifications/${notificationId}/read`, {
        method: 'PUT',
        credentials: 'include'
      });
      if (!res.ok) {
        const body = await res.json();
        throw new Error(body.msg || `HTTP ${res.status}`);
      }
      // Update local state so that this notification becomes “read”
      setNotifications((prev) =>
        prev.map((n) =>
          n.notification_id === notificationId ? { ...n, is_read: 1 } : n
        )
      );
    } catch (err) {
      console.error('[Mark As Read Error]', err);
    } finally {
      setMarking(false);
    }
  };

  return (
    <div className={styles.container}>
      <h2>Notifications</h2>

      {loading ? (
        <p className={styles.loadingText}>Loading…</p>
      ) : error ? (
        <p className={styles.errorText}>{error}</p>
      ) : notifications.length === 0 ? (
        <p className={styles.noData}>You have no notifications.</p>
      ) : (
        <ul className={styles.list}>
          {notifications.map((n) => (
            <li
              key={n.notification_id}
              className={`${styles.notificationItem} ${
                n.is_read ? styles.read : styles.unread
              }`}
              onClick={() => {
                if (!n.is_read) {
                  markAsRead(n.notification_id);
                }
                if (n.link) {
                  navigate(n.link);
                }
              }}
            >
              <div className={styles.header}>
                <span className={styles.type}>{n.type}</span>
                <span className={styles.timestamp}>
                  {new Date(n.created_at).toLocaleString()}
                </span>
              </div>
              <p className={styles.message}>{n.message}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
