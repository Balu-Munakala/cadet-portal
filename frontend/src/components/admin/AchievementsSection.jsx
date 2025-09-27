import React, { useEffect, useState } from 'react';
import styles from './AchievementsSection.module.css';

export default function ManageAchievementsSection({ apiBaseUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000'}) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [imageFile, setImageFile] = useState(null);

  const [achievements, setAchievements] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null); // { type: 'error'|'success', text: '' }
  const [showModal, setShowModal] = useState(false);
  const [modalContent, setModalContent] = useState({});

  useEffect(() => {
    fetchAchievements();
  }, [apiBaseUrl]);

  const fetchAchievements = async () => {
    setLoading(true);
    setMessage(null);
    try {
      const res = await fetch(`${apiBaseUrl}/api/achievements/admin`, {
        credentials: 'include'
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setAchievements(data);
    } catch (err) {
      console.error('[Fetch Achievements Error]', err);
      setMessage({ type: 'error', text: 'Failed to load achievements.' });
    } finally {
      setLoading(false);
    }
  };

  const handleImageChange = (e) => {
    setImageFile(e.target.files[0]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage(null);

    if (!title.trim()) {
      setMessage({ type: 'error', text: 'Title is required.' });
      return;
    }

    const formData = new FormData();
    formData.append('title', title);
    formData.append('description', description);
    if (imageFile) {
      formData.append('image', imageFile);
    }

    setLoading(true);
    try {
      const res = await fetch(`${apiBaseUrl}/api/achievements/admin`, {
        method: 'POST',
        credentials: 'include',
        body: formData
      });
      if (!res.ok) {
        const errJson = await res.json();
        throw new Error(errJson.msg || `HTTP ${res.status}`);
      }
      setMessage({ type: 'success', text: 'Achievement posted.' });
      setTitle('');
      setDescription('');
      setImageFile(null);
      fetchAchievements();
    } catch (err) {
      console.error('[Post Achievement Error]', err);
      setMessage({ type: 'error', text: 'Failed to post achievement.' });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (achievementId) => {
    setModalContent({
      title: 'Confirm Deletion',
      message: 'Delete this achievement? This action cannot be undone.',
      onConfirm: async () => {
        try {
          const res = await fetch(`${apiBaseUrl}/api/achievements/admin/${achievementId}`, {
            method: 'DELETE',
            credentials: 'include'
          });
          if (!res.ok) {
            const errJson = await res.json();
            throw new Error(errJson.msg || `HTTP ${res.status}`);
          }
          setMessage({ type: 'success', text: 'Deleted successfully.' });
          fetchAchievements();
          setShowModal(false);
        } catch (err) {
          console.error('[Delete Achievement Error]', err);
          setMessage({ type: 'error', text: 'Failed to delete.' });
          setShowModal(false);
        }
      },
    });
    setShowModal(true);
  };

  return (
    <div className={styles.container}>
      <h2>Post New Achievement</h2>
      {message && (
        <div
          className={`${styles.message} ${
            message.type === 'error' ? styles.error : styles.success
          }`}
        >
          {message.text}
        </div>
      )}

      <form className={styles.form} onSubmit={handleSubmit}>
        <div className={styles.field}>
          <label>Title *</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={150}
            placeholder="e.g. Cadet of the Month"
            required
          />
        </div>

        <div className={styles.field}>
          <label>Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Add details, highlights, etc."
            rows={4}
          />
        </div>

        <div className={styles.field}>
          <label>Image</label>
          <input type="file" accept="image/*" onChange={handleImageChange} />
        </div>

        <button type="submit" className={styles.submitBtn} disabled={loading}>
          {loading ? 'Posting…' : 'Post Achievement'}
        </button>
      </form>

      <h2 className={styles.sectionTitle}>Your Achievements</h2>
      {loading && <p>Loading…</p>}

      {!loading && achievements.length === 0 && <p className={styles.noData}>No achievements yet.</p>}

      <div className={styles.grid}>
        {achievements.map((ach) => (
          <div key={ach.achievement_id} className={styles.card}>
            {ach.image_path && (
              <img
                src={`${apiBaseUrl}/uploads/${ach.image_path}`}
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
              <button
                className={styles.deleteBtn}
                onClick={() => handleDelete(ach.achievement_id)}
                disabled={loading}
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>

      {showModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <h3>{modalContent.title}</h3>
            <p>{modalContent.message}</p>
            <div className={styles.modalActions}>
              <button onClick={() => setShowModal(false)} className={styles.cancelBtn}>Cancel</button>
              <button onClick={modalContent.onConfirm} className={styles.confirmBtn}>Confirm</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
