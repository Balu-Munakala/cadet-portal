import React, { useEffect, useState } from 'react';
import { FaCheckCircle, FaTimesCircle } from 'react-icons/fa';
import styles from './ManageUsersSection.module.css';

export default function ManageUsersSection({ apiBaseUrl = process.env.REACT_APP_API_URL}) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState(null); // { type: 'error'|'success', text: '' }
  const [showModal, setShowModal] = useState(false);
  const [modalContent, setModalContent] = useState({});

  useEffect(() => {
    fetchUsers();
  }, [apiBaseUrl]);

  async function fetchUsers() {
    setLoading(true);
    setMessage(null);
    try {
      const res = await fetch(`${apiBaseUrl}/api/manage-users`, {
        credentials: 'include',
      });
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }
      const allUsers = await res.json();
      setUsers(allUsers);
    } catch (err) {
      console.error('[Fetch Users Error]', err);
      setMessage({ type: 'error', text: 'Failed to load cadet list.' });
    } finally {
      setLoading(false);
    }
  }

  async function handleApprove(userId) {
    setModalContent({
      title: 'Approve User',
      message: 'Are you sure you want to approve this cadet?',
      onConfirm: async () => {
        try {
          const res = await fetch(`${apiBaseUrl}/api/manage-users/approve/${userId}`, {
            method: 'PUT',
            credentials: 'include',
          });
          if (!res.ok) {
            const errJson = await res.json();
            throw new Error(errJson.msg || `HTTP ${res.status}`);
          }
          setMessage({ type: 'success', text: 'User approved successfully.' });
          fetchUsers();
          setShowModal(false);
        } catch (err) {
          console.error('[Approve User Error]', err);
          setMessage({ type: 'error', text: 'Failed to approve user.' });
          setShowModal(false);
        }
      }
    });
    setShowModal(true);
  }

  async function handleDelete(userId) {
    setModalContent({
      title: 'Reject User',
      message: 'Are you sure you want to reject and delete this user? This action cannot be undone.',
      onConfirm: async () => {
        try {
          const res = await fetch(`${apiBaseUrl}/api/manage-users/${userId}`, {
            method: 'DELETE',
            credentials: 'include',
          });
          if (!res.ok) {
            const errJson = await res.json();
            throw new Error(errJson.msg || `HTTP ${res.status}`);
          }
          setMessage({ type: 'success', text: 'User deleted successfully.' });
          fetchUsers();
          setShowModal(false);
        } catch (err) {
          console.error('[Delete User Error]', err);
          setMessage({ type: 'error', text: 'Failed to delete user.' });
          setShowModal(false);
        }
      }
    });
    setShowModal(true);
  }

  const pendingUsers = users.filter((u) => u.is_approved === 0);
  const approvedUsers = users.filter((u) => u.is_approved === 1);

  return (
    <div className={styles.container}>
      <h2>Manage Cadet Registrations</h2>

      {message && (
        <div
          className={`${styles.message} ${
            message.type === 'error' ? styles.error : styles.success
          }`}
        >
          {message.text}
        </div>
      )}

      {loading && <p>Loading cadet list…</p>}

      {!loading && (
        <>
          <section className={styles.section}>
            <h3>Pending Approval ({pendingUsers.length})</h3>
            {pendingUsers.length > 0 ? (
              <div className={styles.tableWrapper}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>Regimental No.</th>
                      <th>Name</th>
                      <th>Email</th>
                      <th>Contact</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pendingUsers.map((user) => (
                      <tr key={user.id}>
                        <td>{user.regimental_number}</td>
                        <td>{user.name}</td>
                        <td>{user.email}</td>
                        <td>{user.contact || '—'}</td>
                        <td className={styles.actions}>
                          <button
                            className={styles.approveBtn}
                            onClick={() => handleApprove(user.id)}
                            title="Approve User"
                          >
                            <FaCheckCircle /> Approve
                          </button>
                          <button
                            className={styles.deleteBtn}
                            onClick={() => handleDelete(user.id)}
                            title="Reject User"
                          >
                            <FaTimesCircle /> Reject
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p>No pending cadets.</p>
            )}
          </section>

          <section className={styles.section}>
            <h3>Approved Cadets ({approvedUsers.length})</h3>
            {approvedUsers.length > 0 ? (
              <div className={styles.tableWrapper}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>Regimental No.</th>
                      <th>Name</th>
                      <th>Email</th>
                      <th>Contact</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {approvedUsers.map((user) => (
                      <tr key={user.id}>
                        <td>{user.regimental_number}</td>
                        <td>{user.name}</td>
                        <td>{user.email}</td>
                        <td>{user.contact || '—'}</td>
                        <td className={styles.actions}>
                          <button
                            className={styles.deleteBtn}
                            onClick={() => handleDelete(user.id)}
                            title="Delete User"
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p>No approved cadets.</p>
            )}
          </section>
        </>
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
