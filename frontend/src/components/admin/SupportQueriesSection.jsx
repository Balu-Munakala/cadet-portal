import React, { useEffect, useState } from 'react';
import { FaEdit, FaTrashAlt } from 'react-icons/fa';
import styles from './SupportQueriesSection.module.css';

export default function SupportQueriesSection({ apiBaseUrl }) {
  const [queries, setQueries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [replyText, setReplyText] = useState(''); // for the currently editing query
  const [editingId, setEditingId] = useState(null);
  const [feedback, setFeedback] = useState(null); // { type, text }
  const [showModal, setShowModal] = useState(false);
  const [modalContent, setModalContent] = useState({});

  useEffect(() => {
    fetchAllQueries();
  }, [apiBaseUrl]);

  const fetchAllQueries = async () => {
    setLoading(true);
    setFeedback(null);
    try {
      const res = await fetch(`${apiBaseUrl}/api/support-queries/admin`, {
        credentials: 'include'
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setQueries(data);
    } catch (err) {
      console.error('[Fetch All Queries Error]', err);
      setFeedback({ type: 'error', text: 'Failed to load support queries.' });
    } finally {
      setLoading(false);
    }
  };

  const handleEditClick = (q) => {
    setEditingId(q.query_id);
    setReplyText(q.response || '');
    setFeedback(null);
  };

  const cancelReply = () => {
    setEditingId(null);
    setReplyText('');
  };

  const submitReply = async (queryId) => {
    if (!replyText.trim()) {
      setFeedback({ type: 'error', text: 'Response cannot be empty.' });
      return;
    }
    setFeedback(null);
    try {
      const res = await fetch(`${apiBaseUrl}/api/support-queries/admin/${queryId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ response: replyText.trim() })
      });
      const result = await res.json();
      if (!res.ok) {
        throw new Error(result.msg || `HTTP ${res.status}`);
      }
      setFeedback({ type: 'success', text: 'Response saved.' });
      setEditingId(null);
      setReplyText('');
      fetchAllQueries();
    } catch (err) {
      console.error('[Submit Reply Error]', err);
      setFeedback({ type: 'error', text: 'Failed to save response.' });
    }
  };

  const deleteQuery = async (queryId) => {
    setModalContent({
      title: 'Confirm Deletion',
      message: 'Are you sure you want to delete this query? This action cannot be undone.',
      onConfirm: async () => {
        try {
          const res = await fetch(`${apiBaseUrl}/api/support-queries/admin/${queryId}`, {
            method: 'DELETE',
            credentials: 'include'
          });
          const result = await res.json();
          if (!res.ok) {
            throw new Error(result.msg || `HTTP ${res.status}`);
          }
          setFeedback({ type: 'success', text: 'Query deleted.' });
          fetchAllQueries();
          setShowModal(false);
        } catch (err) {
          console.error('[Delete Query Error]', err);
          setFeedback({ type: 'error', text: 'Failed to delete query.' });
          setShowModal(false);
        }
      },
    });
    setShowModal(true);
  };

  return (
    <div className={styles.container}>
      <h2>Support Queries (Admin)</h2>

      {feedback && (
        <div className={`${styles.feedback} ${feedback.type === 'error' ? styles.error : styles.success}`}>
          {feedback.text}
        </div>
      )}

      {loading ? (
        <p className={styles.loadingText}>Loading…</p>
      ) : queries.length === 0 ? (
        <p className={styles.noData}>No support queries at the moment.</p>
      ) : (
        <div className={styles.listWrapper}>
          {queries.map((q) => (
            <div key={q.query_id} className={styles.queryCard}>
              <div className={styles.header}>
                <div>
                  <strong>Cadet:</strong> {q.cadet_name} ({q.regimental_number})
                </div>
                <div className={styles.dates}>
                  <span>
                    <strong>Submitted:</strong>{' '}
                    {new Date(q.created_at).toLocaleDateString()}{' '}
                    {new Date(q.created_at).toLocaleTimeString()}
                  </span>
                  <span className={q.status === 'Open' ? styles.statusOpen : styles.statusClosed}>
                    <strong>Status:</strong> {q.status}
                  </span>
                </div>
              </div>

              <p className={styles.userMessage}>
                <strong>Message:</strong> {q.message}
              </p>

              {q.status === 'Open' && editingId !== q.query_id && (
                <button className={styles.replyBtn} onClick={() => handleEditClick(q)}>
                  <FaEdit /> Reply
                </button>
              )}

              {q.status === 'Closed' && (
                <p className={styles.adminResponse}>
                  <strong>Response:</strong> {q.response}
                </p>
              )}

              {editingId === q.query_id && (
                <div className={styles.replySection}>
                  <textarea
                    rows={4}
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    placeholder="Type your response…"
                  />
                  <div className={styles.replyActions}>
                    <button
                      className={styles.submitReplyBtn}
                      onClick={() => submitReply(q.query_id)}
                    >
                      Submit Reply
                    </button>
                    <button className={styles.cancelBtn} onClick={cancelReply}>
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              <button className={styles.deleteBtn} onClick={() => deleteQuery(q.query_id)}>
                <FaTrashAlt /> Delete Query
              </button>
            </div>
          ))}
        </div>
      )}

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
