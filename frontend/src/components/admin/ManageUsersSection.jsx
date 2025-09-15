import React, { useEffect, useState, useCallback } from 'react';
import { FaCheckCircle, FaTimesCircle } from 'react-icons/fa';
import styles from './ManageUsersSection.module.css';

export default function ManageUsersSection({ apiBaseUrl = process.env.REACT_APP_API_URL }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState(null); // { type: 'error'|'success', text: '' }
  const [showModal, setShowModal] = useState(false);
  const [modalContent, setModalContent] = useState({});

  // Use useCallback to memoize the fetchUsers function
  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setMessage(null);
    try {
      const res = await fetch(`${apiBaseUrl}/api/admin/manage-users`, {
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
  }, [apiBaseUrl]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleAction = async (actionType, userId) => {
    const isApprove = actionType === 'approve';
    const url = isApprove 
      ? `${apiBaseUrl}/api/admin/manage-users/approve/${userId}` 
      : `${apiBaseUrl}/api/admin/manage-users/${userId}`;
    const method = isApprove ? 'PUT' : 'DELETE';

    try {
      const res = await fetch(url, {
        method,
        credentials: 'include',
      });
      const resJson = await res.json();
      if (!res.ok) {
        throw new Error(resJson.msg || `HTTP ${res.status}`);
      }
      setMessage({ type: 'success', text: resJson.msg });
      fetchUsers(); // Re-fetch the list to show updated data
    } catch (err) {
      console.error(`[${actionType} User Error]`, err);
      setMessage({ type: 'error', text: `Failed to ${actionType} user.` });
    } finally {
      setShowModal(false);
    }
  };

  const openConfirmationModal = (action, user) => {
    let title, message, onConfirm;
    if (action === 'approve') {
      title = 'Approve User';
      message = `Are you sure you want to approve ${user.name}?`;
      onConfirm = () => handleAction('approve', user.id);
    } else { // 'delete' or 'reject'
      title = user.is_approved ? 'Delete User' : 'Reject User';
      message = `Are you sure you want to delete ${user.name}? This action cannot be undone.`;
      onConfirm = () => handleAction('delete', user.id);
    }
    setModalContent({ title, message, onConfirm });
    setShowModal(true);
  };

  const pendingUsers = users.filter((u) => !u.is_approved);
  const approvedUsers = users.filter((u) => u.is_approved);

  return (
    <div className={styles.container}>
      <h2>Manage Cadet Registrations</h2>

      {message && (
        <div className={`${styles.message} ${message.type === 'error' ? styles.error : styles.success}`}>
          {message.text}
        </div>
      )}

      {loading && <p className={styles.loading}>Loading cadet list…</p>}

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
                          <button className={styles.approveBtn} onClick={() => openConfirmationModal('approve', user)} title="Approve User">
                            <FaCheckCircle /> Approve
                          </button>
                          <button className={styles.deleteBtn} onClick={() => openConfirmationModal('delete', user)} title="Reject User">
                            <FaTimesCircle /> Reject
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className={styles.noData}>No pending cadets.</p>
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
                          <button className={styles.deleteBtn} onClick={() => openConfirmationModal('delete', user)} title="Delete User">
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className={styles.noData}>No approved cadets.</p>
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