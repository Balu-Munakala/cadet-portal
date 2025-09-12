import React, { useEffect, useState } from 'react';
import styles from './EventsSection.module.css';

export default function UserEventsSection({ apiBaseUrl }) {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null); // { type: 'error'|'info', text: '' }

  useEffect(() => {
    fetchEvents();
  }, [apiBaseUrl]);

  const fetchEvents = async () => {
    setLoading(true);
    setMessage(null);
    try {
      const res = await fetch(`${apiBaseUrl}/api/events`, { 
        credentials: 'include' 
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setEvents(data);
    } catch (err) {
      console.error('[Fetch User Events Error]', err);
      setMessage({ type: 'error', text: 'Failed to load events.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <h2>Upcoming Events</h2>
      {message && (
        <div
          className={`${styles.message} ${
            message.type === 'error' ? styles.error : styles.info
          }`}
        >
          {message.text}
        </div>
      )}
      {loading && <p>Loading…</p>}

      {!loading && events.length === 0 && <p>No upcoming events.</p>}

      <div className={styles.list}>
        {events.map((evt) => (
          <div key={evt.event_id} className={styles.eventCard}>
            <div className={styles.header}>
              <div>
                <strong>{new Date(evt.event_date).toLocaleDateString()}</strong> @{' '}
                {evt.fallin_time.slice(0, 5)}
              </div>
              <div className={styles.dressCode}>
                <em>Dress:</em> {evt.dress_code}
              </div>
            </div>
            <div className={styles.body}>
              <p>
                <strong>Location:</strong> {evt.location}
              </p>
              <p className={styles.instructions}>{evt.instructions}</p>
            </div>
            <div className={styles.footer}>
              Posted on{' '}
              {new Date(evt.created_at).toLocaleDateString()}{' '}
              {new Date(evt.created_at).toLocaleTimeString()}
            </div>
          </div>
        ))}
      </div>

      <button
        className={styles.refreshBtn}
        onClick={fetchEvents}
        disabled={loading}
      >
        Refresh
      </button>
    </div>
  );
}
