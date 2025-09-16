import React, { useEffect, useState } from 'react';
import styles from './ManageUsers.module.css';
import { FaUserCheck, FaUserTimes, FaTrash } from 'react-icons/fa';

export default function ManageUsers({ apiBaseUrl = process.env.REACT_APP_API_URL }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [modalContent, setModalContent] = useState({});

  const fetchUsers = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${apiBaseUrl}/api/master/manage-users`, {
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

  const toggleApprove = async (regimentalNumber, currentlyApproved) => {
    setModalContent({
      title: 'Confirm Action',
      message: `Are you sure you want to ${currentlyApproved ? 'disapprove' : 'approve'} this cadet?`,
      onConfirm: async () => {
        try {
          const endpoint = `${apiBaseUrl}/api/master/manage-users/${regimentalNumber}/${
            currentlyApproved ? 'disable' : 'enable'
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

  const deleteUser = async (regimentalNumber) => {
    setModalContent({
      title: 'Confirm Deletion',
      message: 'Are you sure you want to permanently delete this cadet? This action cannot be undone.',
      onConfirm: async () => {
        try {
          const res = await fetch(`${apiBaseUrl}/api/master/manage-users/${regimentalNumber}`, {
            method: 'DELETE',
            credentials: 'include',
          });
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          fetchUsers();
          setShowModal(false);
        } catch (err) {
          console.error('[ManageUsers Delete] ', err);
          setError('Deletion failed.');
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
                <th>Contact</th>
                <th>ANO ID</th>
                <th>Approved</th>
                <th>Created At</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.regimental_number}>
                  <td>{u.regimental_number}</td>
                  <td>{u.name}</td>
                  <td>{u.email}</td>
                  <td>{u.contact || 'N/A'}</td>
                  <td>{u.ano_id || 'N/A'}</td>
                  <td className={u.is_approved ? styles.statusApproved : styles.statusDisapproved}>
                    {u.is_approved ? 'Yes' : 'No'}
                  </td>
                  <td>{new Date(u.created_at).toLocaleDateString()}</td>
                  <td>
                    <div className={styles.actionButtons}>
                      <button
                        className={u.is_approved ? styles.disableBtn : styles.approveBtn}
                        onClick={() => toggleApprove(u.regimental_number, u.is_approved)}
                        title={u.is_approved ? 'Disapprove' : 'Approve'}
                      >
                        {u.is_approved ? <FaUserTimes /> : <FaUserCheck />}
                        {u.is_approved ? ' Disapprove' : ' Approve'}
                      </button>
                      <button
                        className={styles.deleteBtn}
                        onClick={() => deleteUser(u.regimental_number)}
                        title="Delete"
                      >
                        <FaTrash />
                      </button>
                    </div>
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