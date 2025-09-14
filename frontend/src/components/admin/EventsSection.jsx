import React, { useEffect, useState } from 'react';
import styles from './EventsSection.module.css';

export default function AdminEventsSection({ apiBaseUrl = process.env.REACT_APP_API_URL}) {
  const [eventDate, setEventDate] = useState('');
  const [fallinTime, setFallinTime] = useState('');
  const [dressCode, setDressCode] = useState('');
  const [location, setLocation] = useState('');
  const [instructions, setInstructions] = useState('');

  const [events, setEvents] = useState([]);
  const [editingEvent, setEditingEvent] = useState(null); // { event_id, ... }
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null); // { type: 'error'|'success', text: '' }
  const [showModal, setShowModal] = useState(false);
  const [modalContent, setModalContent] = useState({});

  // 1) On mount, fetch existing events
  useEffect(() => {
    fetchEvents();
  }, [apiBaseUrl]);

  const fetchEvents = async () => {
    setLoading(true);
    setMessage(null);
    try {
      const res = await fetch(`${apiBaseUrl}/api/events`, { credentials: 'include' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setEvents(data);
    } catch (err) {
      console.error('[Fetch Events Error]', err);
      setMessage({ type: 'error', text: 'Failed to load events.' });
    } finally {
      setLoading(false);
    }
  };

  // Reset form fields
  const resetForm = () => {
    setEventDate('');
    setFallinTime('');
    setDressCode('');
    setLocation('');
    setInstructions('');
    setEditingEvent(null);
    setMessage(null);
  };

  // When “Edit” is clicked on an event
  const handleEditClick = (evt) => {
    setEditingEvent(evt);
    setEventDate(evt.event_date.slice(0, 10)); // YYYY-MM-DD
    setFallinTime(evt.fallin_time.slice(0, 5)); // HH:MM
    setDressCode(evt.dress_code);
    setLocation(evt.location);
    setInstructions(evt.instructions);
    setMessage(null);
  };

  // Create or update
  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage(null);

    if (
      !eventDate ||
      !fallinTime ||
      !dressCode.trim() ||
      !location.trim() ||
      !instructions.trim()
    ) {
      setMessage({ type: 'error', text: 'All fields are required.' });
      return;
    }

    const payload = {
      event_date: eventDate,
      fallin_time: fallinTime + ':00', // add seconds
      dress_code: dressCode,
      location,
      instructions,
    };

    setLoading(true);
    try {
      let res;
      if (editingEvent) {
        // Update existing
        res = await fetch(`${apiBaseUrl}/api/events/${editingEvent.event_id}`, {
          method: 'PUT',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      } else {
        // Create new
        res = await fetch(`${apiBaseUrl}/api/events`, {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      }
      if (!res.ok) {
        const errJson = await res.json();
        throw new Error(errJson.msg || `HTTP ${res.status}`);
      }
      setMessage({
        type: 'success',
        text: editingEvent ? 'Event updated.' : 'Event created.',
      });
      resetForm();
      fetchEvents();
    } catch (err) {
      console.error('[Submit Event Error]', err);
      setMessage({
        type: 'error',
        text: editingEvent ? 'Failed to update event.' : 'Failed to create event.',
      });
    } finally {
      setLoading(false);
    }
  };

  // Delete an event
  const handleDelete = async (eventId) => {
    setModalContent({
      title: 'Confirm Deletion',
      message: 'Delete this event? This action cannot be undone.',
      onConfirm: async () => {
        try {
          const res = await fetch(`${apiBaseUrl}/api/events/${eventId}`, {
            method: 'DELETE',
            credentials: 'include',
          });
          if (!res.ok) {
            const errJson = await res.json();
            throw new Error(errJson.msg || `HTTP ${res.status}`);
          }
          setMessage({ type: 'success', text: 'Event deleted.' });
          if (editingEvent && editingEvent.event_id === eventId) {
            resetForm();
          }
          fetchEvents();
          setShowModal(false);
        } catch (err) {
          console.error('[Delete Event Error]', err);
          setMessage({ type: 'error', text: 'Failed to delete event.' });
          setShowModal(false);
        }
      },
    });
    setShowModal(true);
  };

  return (
    <div className={styles.container}>
      <h2>{editingEvent ? 'Edit Event' : 'Create New Event'}</h2>

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
          <label>Event Date *</label>
          <input
            type="date"
            value={eventDate}
            onChange={(e) => setEventDate(e.target.value)}
            required
          />
        </div>

        <div className={styles.field}>
          <label>Fallin Time *</label>
          <input
            type="time"
            value={fallinTime}
            onChange={(e) => setFallinTime(e.target.value)}
            required
          />
        </div>

        <div className={styles.field}>
          <label>Dress Code *</label>
          <input
            type="text"
            value={dressCode}
            onChange={(e) => setDressCode(e.target.value)}
            placeholder="e.g. Khaki Uniform"
            required
          />
        </div>

        <div className={styles.field}>
          <label>Location *</label>
          <input
            type="text"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="e.g. Government Women's College Entrance"
            required
          />
        </div>

        <div className={styles.field}>
          <label>Instructions *</label>
          <textarea
            value={instructions}
            onChange={(e) => setInstructions(e.target.value)}
            placeholder="Full event instructions, notes, etc."
            rows={4}
            required
          />
        </div>

        <div className={styles.buttonRow}>
          <button type="submit" className={styles.submitBtn} disabled={loading}>
            {editingEvent ? 'Update Event' : 'Create Event'}
          </button>
          {editingEvent && (
            <button
              type="button"
              className={styles.cancelBtn}
              onClick={resetForm}
              disabled={loading}
            >
              Cancel
            </button>
          )}
        </div>
      </form>

      <h2 className={styles.sectionTitle}>Your ANO’s Events</h2>
      {loading && <p>Loading…</p>}

      {!loading && events.length === 0 && <p>No events scheduled.</p>}

      <div className={styles.list}>
        {events.map((evt) => (
          <div key={evt.event_id} className={styles.eventCard}>
            <div className={styles.eventHeader}>
              <div>
                <strong>{new Date(evt.event_date).toLocaleDateString()}</strong> @{' '}
                {evt.fallin_time.slice(0, 5)}
              </div>
              <div className={styles.actionBtns}>
                <button
                  className={styles.editBtn}
                  onClick={() => handleEditClick(evt)}
                >
                  Edit
                </button>
                <button
                  className={styles.deleteBtn}
                  onClick={() => handleDelete(evt.event_id)}
                >
                  Delete
                </button>
              </div>
            </div>
            <div className={styles.eventBody}>
              <p>
                <strong>Dress Code:</strong> {evt.dress_code}
              </p>
              <p>
                <strong>Location:</strong> {evt.location}
              </p>
              <p className={styles.instructions}>{evt.instructions}</p>
            </div>
            <div className={styles.eventFooter}>
              Posted on{' '}
              {new Date(evt.created_at).toLocaleDateString()}{' '}
              {new Date(evt.created_at).toLocaleTimeString()}
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
