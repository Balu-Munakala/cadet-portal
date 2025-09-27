import React, { useEffect, useState } from 'react';
import styles from './AchievementsSection.module.css';

// The component now accepts the API base URL as a prop
export default function AchievementsSection({ apiBaseUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000'}) {
  const [achievements, setAchievements] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null); // { type: 'error'|'info', text: '' }

  const fetchAchievements = async () => {
    setLoading(true);
    setMessage(null);
    try {
      // Use the prop for the API call
      const res = await fetch(`${apiBaseUrl}/api/achievements`, {
        credentials: 'include'
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setAchievements(data);
    } catch (err) {
      console.error('[Fetch User Achievements Error]', err);
      setMessage({ type: 'error', text: 'Failed to load achievements.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAchievements();
  }, [apiBaseUrl]); // Added apiBaseUrl to dependency array

  return (
    <div className={styles.container}>
      <h2>Achievements Feed</h2>
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

      {!loading && achievements.length === 0 && <p>No achievements to show.</p>}

      <div className={styles.grid}>
        {achievements.map((ach) => (
          <div key={ach.achievement_id} className={styles.card}>
            {ach.image_path && (
              <img
                src={`/uploads/${ach.image_path}`}
                alt={ach.title}
                className={styles.cardImage}
              />
            )}
            <div className={styles.cardBody}>
              <h3 className={styles.cardTitle}>{ach.title}</h3>
              {ach.description && <p className={styles.cardDesc}>{ach.description}</p>}
              <p className={styles.cardDate}>
                {new Date(ach.created_at).toLocaleDateString()}{' '}
                {new Date(ach.created_at).toLocaleTimeString()}
              </p>
            </div>
          </div>
        ))}
      </div>

      <button
        className={styles.refreshBtn}
        onClick={fetchAchievements}
        disabled={loading}
      >
        Refresh
      </button>
    </div>
  );
}
