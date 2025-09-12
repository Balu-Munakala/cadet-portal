import React, { useState, useEffect } from 'react';
import { FaEdit, FaTrashAlt } from 'react-icons/fa';
import styles from './FallinDetailsSection.module.css';

export default function FallinDetailsSection({ apiBaseUrl }) {
  const [fallins, setFallins] = useState([]);
  const [formData, setFormData] = useState({
    fallin_id: '',
    date: '',
    time: '',
    type: 'Afternoon',
    location: '',
    dress_code: '',
    instructions: '',
    activity_details: '',
  });
  const [isEditMode, setIsEditMode] = useState(false);
  const [message, setMessage] = useState(null); // { type: 'error'|'success', text: '' }
  const [showModal, setShowModal] = useState(false);
  const [modalContent, setModalContent] = useState({});

  useEffect(() => {
    // Load all fallins for this ANO
    fetchFallinDetails();
  }, [apiBaseUrl]);

  const fetchFallinDetails = async () => {
    try {
      const res = await fetch(`${apiBaseUrl}/api/fallin`, { credentials: 'include' });
      if (!res.ok) throw new Error('Failed to fetch fallin details');
      const data = await res.json();
      setFallins(data);
    } catch (err) {
      console.error('[Fetch Fallin Error]', err);
      setMessage({ type: 'error', text: 'Error loading fallin details.' });
    }
  };

  const handleChange = e => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const resetForm = () => {
    setFormData({
      fallin_id: '',
      date: '',
      time: '',
      type: 'Afternoon',
      location: '',
      dress_code: '',
      instructions: '',
      activity_details: '',
    });
    setIsEditMode(false);
    setMessage(null);
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setMessage(null);

    // The backend already knows ano_id from JWT → no need to send it in payload
    const payload = {
      date: formData.date,
      time: formData.time,
      type: formData.type,
      location: formData.location,
      dress_code: formData.dress_code,
      instructions: formData.instructions,
      activity_details: formData.activity_details
    };

    let url = `${apiBaseUrl}/api/fallin`;
    let method = 'POST';
    if (isEditMode) {
      url = `${apiBaseUrl}/api/fallin/${formData.fallin_id}`;
      method = 'PUT';
    }

    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload)
      });
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.msg || 'Save failed');
      }
      await fetchFallinDetails();
      resetForm();
      setMessage({ type: 'success', text: isEditMode ? 'Fallin updated successfully!' : 'Fallin created successfully!' });
    } catch (err) {
      console.error('[Save Fallin Error]', err);
      setMessage({ type: 'error', text: err.message || 'Error saving fallin.' });
    }
  };

  const handleEdit = async id => {
    setMessage(null);
    try {
      const res = await fetch(`${apiBaseUrl}/api/fallin/${id}`, { credentials: 'include' });
      if (!res.ok) throw new Error('Fetch failed');
      const data = await res.json();
      // Format date to yyyy-MM-dd if needed
      const formattedDate = data.date ? data.date.slice(0, 10) : '';
      setFormData({
        fallin_id: data.fallin_id,
        date: formattedDate,
        time: data.time,
        type: data.type,
        location: data.location || '',
        dress_code: data.dress_code,
        instructions: data.instructions || '',
        activity_details: data.activity_details || ''
      });
      setIsEditMode(true);
    } catch (err) {
      console.error('[Edit Fallin Error]', err);
      setMessage({ type: 'error', text: 'Error loading fallin for edit.' });
    }
  };

  const handleDelete = async id => {
    setModalContent({
      title: 'Confirm Deletion',
      message: 'Are you sure you want to delete this fallin?',
      onConfirm: async () => {
        try {
          const res = await fetch(`${apiBaseUrl}/api/fallin/${id}`, {
            method: 'DELETE',
            credentials: 'include'
          });
          if (!res.ok) {
            const errData = await res.json();
            throw new Error(errData.msg || 'Delete failed');
          }
          await fetchFallinDetails();
          if (isEditMode && formData.fallin_id === id) {
            resetForm();
          }
          setShowModal(false);
          setMessage({ type: 'success', text: 'Fallin deleted successfully.' });
        } catch (err) {
          console.error('[Delete Fallin Error]', err);
          setMessage({ type: 'error', text: 'Error deleting fallin.' });
          setShowModal(false);
        }
      },
    });
    setShowModal(true);
  };

  return (
    <div className={styles.container}>
      <h2>Fallin Management</h2>
      {message && (
        <div className={`${styles.message} ${styles[message.type]}`}>
          {message.text}
        </div>
      )}

      <form onSubmit={handleSubmit} className={styles.form}>
        <input type="hidden" name="fallin_id" value={formData.fallin_id} />
        <div className={styles.formGroup}>
          <label>Date</label>
          <input
            type="date"
            name="date"
            value={formData.date}
            onChange={handleChange}
            required
          />
        </div>

        <div className={styles.formGroup}>
          <label>Time</label>
          <input
            type="time"
            name="time"
            value={formData.time}
            onChange={handleChange}
            required
          />
        </div>

        <div className={styles.formGroup}>
          <label>Type</label>
          <select name="type" value={formData.type} onChange={handleChange}>
            <option value="Morning">Morning</option>
            <option value="Afternoon">Afternoon</option>
            <option value="Drill">Drill</option>
            <option value="Theory">Theory</option>
            <option value="Special">Special</option>
          </select>
        </div>

        <div className={styles.formGroup}>
          <label>Location</label>
          <input
            type="text"
            name="location"
            value={formData.location}
            onChange={handleChange}
            required
          />
        </div>

        <div className={styles.formGroup}>
          <label>Dress Code</label>
          <input
            type="text"
            name="dress_code"
            value={formData.dress_code}
            onChange={handleChange}
            required
          />
        </div>

        <div className={styles.formGroup}>
          <label>Instructions</label>
          <textarea
            name="instructions"
            value={formData.instructions}
            onChange={handleChange}
            required
          />
        </div>

        <div className={styles.formGroup}>
          <label>Activity Details</label>
          <textarea
            name="activity_details"
            value={formData.activity_details}
            onChange={handleChange}
            required
          />
        </div>

        <div className={styles.buttonGroup}>
          <button type="submit" className={styles.submitBtn}>
            {isEditMode ? 'Update Fallin' : 'Add Fallin'}
          </button>
          <button type="button" onClick={resetForm} className={styles.clearBtn}>
            Clear
          </button>
        </div>
      </form>

      <h3>Existing Fallins</h3>
      <table className={styles.table}>
        <thead>
          <tr>
            <th>Date</th>
            <th>Time</th>
            <th>Type</th>
            <th>Location</th>
            <th>Dress Code</th>
            <th>Instructions</th>
            <th>Activity Details</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {fallins.length > 0 ? (
            fallins.map(f => (
              <tr key={f.fallin_id}>
                <td>{f.date.slice(0, 10)}</td>
                <td>{f.time}</td>
                <td>{f.type}</td>
                <td>{f.location}</td>
                <td>{f.dress_code}</td>
                <td>{f.instructions}</td>
                <td>{f.activity_details}</td>
                <td className={styles.actionBtns}>
                  <button onClick={() => handleEdit(f.fallin_id)} className={styles.editBtn}>
                    <FaEdit />
                  </button>
                  <button onClick={() => handleDelete(f.fallin_id)} className={styles.deleteBtn}>
                    <FaTrashAlt />
                  </button>
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="8" className={styles.noData}>
                No fallins found.
              </td>
            </tr>
          )}
        </tbody>
      </table>

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
};
