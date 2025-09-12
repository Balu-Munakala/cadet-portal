import React, { useState, useEffect } from 'react';
import styles from './NotificationsSection.module.css';

// Accept the API base URL as a prop
export default function NotificationsSection({ apiBaseUrl }) {
  const [notes, setNotes] = useState([]);

  const fetchNotes = async () => {
    try {
      const res = await fetch(`${apiBaseUrl}/api/notifications`, {
        credentials: 'include' // Using session cookies
      });
      if (res.ok) {
        setNotes(await res.json());
      }
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    }
  };

  useEffect(() => {
    fetchNotes();
    const iv = setInterval(fetchNotes, 30000);
    return () => clearInterval(iv);
  }, [apiBaseUrl]); // Added apiBaseUrl to dependency array

  const markRead = async (id) => {
    try {
      await fetch(`${apiBaseUrl}/api/notifications/${id}/read`, {
        method: 'POST',
        credentials: 'include' // Using session cookies
      });
      setNotes(notes.filter(n => n.id !== id));
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  };

  return (
    <div className={styles.container}>
      <h1>Notifications</h1>
      <ul className={styles.list}>
        {notes.map(n => (
          <li key={n.id} className={styles.item}>
            <div>
              <strong>{n.type}</strong>: {n.message}
              <div className={styles.time}>{new Date(n.created_at).toLocaleString()}</div>
            </div>
            <button className={styles.readBtn} onClick={() => markRead(n.id)}>Mark read</button>
          </li>
        ))}
        {notes.length === 0 && <li className={styles.empty}>No new notifications.</li>}
      </ul>
    </div>
  );
}
