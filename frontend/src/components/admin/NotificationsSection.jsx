import React, { useState } from 'react';
import styles from './NotificationsSection.module.css';

export default function NotificationsSection({ apiBaseUrl = process.env.REACT_APP_API_URL}) {
  const [formData, setFormData] = useState({
    title: '',
    message: ''
  });
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState(null); // { type: 'error'|'success', text: '' }

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setFeedback(null);
    try {
      const res = await fetch(`${apiBaseUrl}/api/admin/notifications`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(formData),
      });
      if (!res.ok) {
        const errJson = await res.json();
        throw new Error(errJson.msg || `HTTP ${res.status}`);
      }
      setFeedback({ type: 'success', text: 'Notification posted successfully!' });
      // Clear form
      setFormData({ title: '', message: '' });
    } catch (err) {
      console.error('[Post Notification Error]', err);
      setFeedback({ type: 'error', text: 'Error posting notification. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <h1 className={styles.heading}>Post Notification</h1>
      <form className={styles.form} onSubmit={handleSubmit}>
        <div className={styles.formGroup}>
          <label className={styles.label} htmlFor="title">Title</label>
          <input
            className={styles.input}
            id="title"
            name="title"
            type="text"
            required
            value={formData.title}
            onChange={handleChange}
          />
        </div>
        <div className={styles.formGroup}>
          <label className={styles.label} htmlFor="message">Message</label>
          <textarea
            className={styles.textarea}
            id="message"
            name="message"
            rows="5"
            required
            value={formData.message}
            onChange={handleChange}
          />
        </div>
        <button type="submit" className={styles.button} disabled={loading}>
          {loading ? 'Posting...' : 'Post Notification'}
        </button>
      </form>
      {feedback && (
        <div className={`${styles.confirmationMessage} ${
          feedback.type === 'success' ? styles.success : styles.error
        }`}>
          {feedback.text}
        </div>
      )}
    </div>
  );
}
