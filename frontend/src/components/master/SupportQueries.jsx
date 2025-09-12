import React, { useEffect, useState } from 'react';
import styles from './SupportQueries.module.css';
import { FaTrashAlt } from 'react-icons/fa';

export default function SupportQueries({ apiBaseUrl }) {
  const [queries, setQueries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [modalContent, setModalContent] = useState({});

  const fetchQueries = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${apiBaseUrl}/api/master/support-queries`, { 
        credentials: 'include' 
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setQueries(data);
    } catch (err) {
      console.error('[SupportQueries] ', err);
      setError('Failed to load support queries.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQueries();
  }, [apiBaseUrl]);

  const deleteQuery = async (queryId) => {
    setModalContent({
      title: 'Confirm Deletion',
      message: 'Are you sure you want to delete this support query? This action cannot be undone.',
      onConfirm: async () => {
        try {
          const res = await fetch(`${apiBaseUrl}/api/master/support-queries/${queryId}`, {
            method: 'DELETE',
            credentials: 'include'
          });
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          fetchQueries();
          setShowModal(false);
        } catch (err) {
          console.error('[SupportQueries Delete] ', err);
          setError('Failed to delete query.');
          setShowModal(false);
        }
      }
    });
    setShowModal(true);
  };

  return (
    <div className={styles.container}>
      <h2>All Support Queries</h2>
      {loading && <div className={styles.loading}>Loading…</div>}
      {error && <div className={styles.error}>{error}</div>}
      {!loading && !queries.length && <div className={styles.noData}>No queries found.</div>}

      {!loading && queries.length > 0 && (
        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Cadet</th>
                <th>Message</th>
                <th>Response</th>
                <th>Status</th>
                <th>Submitted At</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {queries.map((q) => {
                const dateObj = new Date(q.created_at);
                const formattedDate = dateObj.toLocaleDateString();
                const formattedTime = dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

                return (
                  <tr key={q.query_id}>
                    <td>{q.cadet_name} ({q.regimental_number})</td>
                    <td>{q.message}</td>
                    <td>{q.response || <em>– no reply –</em>}</td>
                    <td className={q.status === 'Resolved' ? styles.statusResolved : styles.statusPending}>{q.status}</td>
                    <td>{formattedDate} {formattedTime}</td>
                    <td>
                      <button
                        className={styles.deleteBtn}
                        onClick={() => deleteQuery(q.query_id)}
                      >
                        <FaTrashAlt /> Delete
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
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
