import React, { useState, useEffect, useCallback } from 'react';
import styles from './AdminNotifications.module.css';

export default function AdminNotifications({ apiBaseUrl = process.env.REACT_APP_API_URL }) {
  // State for the creation form
  const [formData, setFormData] = useState({ title: '', message: '' });
  const [isPosting, setIsPosting] = useState(false);
  const [feedback, setFeedback] = useState(null);

  // State for the list of sent notifications
  const [notifications, setNotifications] = useState([]);
  const [isLoadingList, setIsLoadingList] = useState(true);
  const [listError, setListError] = useState(null);

  const fetchNotifications = useCallback(async () => {
    setIsLoadingList(true);
    setListError(null);
    try {
      const res = await fetch(`${apiBaseUrl}/api/notifications/admin`, {
        credentials: 'include',
      });
      if (!res.ok) throw new Error('Failed to fetch notifications.');
      const data = await res.json();
      setNotifications(data);
    } catch (err) {
      setListError(err.message);
    } finally {
      setIsLoadingList(false);
    }
  }, [apiBaseUrl]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsPosting(true);
    setFeedback(null);
    try {
      const res = await fetch(`${apiBaseUrl}/api/notifications`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(formData),
      });
      const resJson = await res.json();
      if (!res.ok) {
        throw new Error(resJson.msg || `HTTP ${res.status}`);
      }
      setFeedback({ type: 'success', text: resJson.msg });
      setFormData({ title: '', message: '' }); // Clear form
      fetchNotifications(); // Refresh the list after posting
    } catch (err) {
      setFeedback({ type: 'error', text: err.message || 'Error posting notification.' });
    } finally {
      setIsPosting(false);
    }
  };

  return (
    <div className={styles.container}>
      <section className={styles.section}>
        <h2 className={styles.heading}>Post a New Notification</h2>
        <form className={styles.form} onSubmit={handleSubmit}>
          {/* Form groups for title and message */}
          <div className={styles.formGroup}>
            <label className={styles.label} htmlFor="title">Title</label>
            <input
              className={styles.input} id="title" name="title" type="text" required
              value={formData.title} onChange={handleChange}
            />
          </div>
          <div className={styles.formGroup}>
            <label className={styles.label} htmlFor="message">Message</label>
            <textarea
              className={styles.textarea} id="message" name="message" rows="5" required
              value={formData.message} onChange={handleChange}
            />
          </div>
          <button type="submit" className={styles.button} disabled={isPosting}>
            {isPosting ? 'Posting...' : 'Post to My Cadets'}
          </button>
        </form>
        {feedback && (
          <div className={`${styles.feedback} ${styles[feedback.type]}`}>
            {feedback.text}
          </div>
        )}
      </section>

      <div className={styles.divider}></div>

      <section className={styles.section}>
        <h2 className={styles.heading}>Previously Sent Notifications</h2>
        {isLoadingList && <p>Loading notifications...</p>}
        {listError && <p className={styles.errorText}>{listError}</p>}
        {!isLoadingList && notifications.length === 0 && (
          <p>You have not sent any notifications yet.</p>
        )}
        {!isLoadingList && notifications.length > 0 && (
          <ul className={styles.notificationList}>
            {notifications.map((notif, index) => (
              <li key={index} className={styles.notificationItem}>
                <p className={styles.notificationMessage}>{notif.message}</p>
                <small className={styles.notificationDate}>
                  Sent on: {new Date(notif.created_at).toLocaleString()}
                </small>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}