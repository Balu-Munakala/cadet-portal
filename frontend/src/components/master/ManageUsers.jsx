import React, { useEffect, useState } from 'react';
import styles from './ManageUsers.module.css';
import { FaUserCheck } from 'react-icons/fa';

export default function ManageUsers({ apiBaseUrl = process.env.REACT_APP_API_URL}) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [modalContent, setModalContent] = useState({});

  const fetchUsers = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${apiBaseUrl}/api/master/users`, {
        credentials: 'include'
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setUsers(data);
    } catch (err) {
      console.error('[ManageUsers] ', err);
      setError('Failed to load users.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [apiBaseUrl]);

  const toggleApprove = async (userId, currentlyApproved) => {
    setModalContent({
      title: 'Confirm Action',
      message: `Are you sure you want to ${currentlyApproved ? 'disapprove' : 'approve'} this cadet?`,
      onConfirm: async () => {
        try {
          const endpoint = `${apiBaseUrl}/api/users/${userId}/${
            currentlyApproved ? 'disapprove' : 'approve'
          }`;
    
          const res = await fetch(endpoint, {
            method: 'PUT',
            credentials: 'include',
          });
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          fetchUsers();
          setShowModal(false);
        } catch (err) {
          console.error('[ManageUsers Toggle Approve] ', err);
          setError('Action failed.');
          setShowModal(false);
        }
      }
    });
    setShowModal(true);
  };

  return (
    <div className={styles.container}>
      <h2>Manage Cadets</h2>

      {loading && <div className={styles.loading}>Loading…</div>}
      {error && <div className={styles.error}>{error}</div>}

      {!loading && !users.length && <div className={styles.noData}>No cadets found.</div>}

      {!loading && users.length > 0 && (
        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Regimental No.</th>
                <th>Name</th>
                <th>Email</th>
                <th>ANO ID</th>
                <th>Approved</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id}>
                  <td>{u.regimental_number}</td>
                  <td>{u.name}</td>
                  <td>{u.email}</td>
                  <td>{u.ano_id}</td>
                  <td className={u.is_approved ? styles.statusApproved : styles.statusDisapproved}>
                    {u.is_approved ? 'Yes' : 'No'}
                  </td>
                  <td>
                    <button
                      className={styles.actionBtn}
                      onClick={() => toggleApprove(u.id, u.is_approved)}
                    >
                      <FaUserCheck /> {u.is_approved ? 'Disapprove' : 'Approve'}
                    </button>
                  </td>
                </tr>
              ))}
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
