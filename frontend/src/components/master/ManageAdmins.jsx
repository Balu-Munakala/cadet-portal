import React, { useEffect, useState } from 'react';
import styles from './ManageAdmins.module.css';
import { FaUserEdit } from 'react-icons/fa';

export default function ManageAdmins({ apiBaseUrl = process.env.REACT_APP_API_URL}) {
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [modalContent, setModalContent] = useState({});

  const fetchAdmins = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${apiBaseUrl}/api/master/manage-admins`, { 
        credentials: 'include' 
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setAdmins(data);
    } catch (err) {
      console.error('[ManageAdmins] ', err);
      setError('Failed to load admins.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdmins();
  }, [apiBaseUrl]);

  const toggleApprove = async (adminId, currentlyApproved) => {
    setModalContent({
      title: 'Confirm Action',
      message: `Are you sure you want to ${currentlyApproved ? 'disapprove' : 'approve'} this admin?`,
      onConfirm: async () => {
        try {
          const endpoint = `${apiBaseUrl}/api/master/manage-admins/${adminId}/${
            currentlyApproved ? 'disapprove' : 'approve'
          }`;
    
          const res = await fetch(endpoint, {
            method: 'PUT',
            credentials: 'include',
          });
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          fetchAdmins();
          setShowModal(false);
        } catch (err) {
          console.error('[ManageAdmins Toggle Approve] ', err);
          setError('Action failed.');
          setShowModal(false);
        }
      }
    });
    setShowModal(true);
  };

  return (
    <div className={styles.container}>
      <h2>Manage ANO Admins</h2>

      {loading && <div className={styles.loading}>Loading…</div>}
      {error && <div className={styles.error}>{error}</div>}

      {!loading && !admins.length && <div className={styles.noData}>No admins found.</div>}

      {!loading && admins.length > 0 && (
        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>ANO ID</th>
                <th>Name</th>
                <th>Email</th>
                <th>Contact</th>
                <th>Role</th>
                <th>Type</th>
                <th>Approved</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {admins.map((a) => (
                <tr key={a.id}>
                  <td>{a.ano_id}</td>
                  <td>{a.name}</td>
                  <td>{a.email}</td>
                  <td>{a.contact || '—'}</td>
                  <td>{a.role}</td>
                  <td>{a.type}</td>
                  <td className={a.is_approved ? styles.statusApproved : styles.statusDisapproved}>
                    {a.is_approved ? 'Yes' : 'No'}
                  </td>
                  <td>
                    <button
                      className={styles.actionBtn}
                      onClick={() => toggleApprove(a.id, a.is_approved)}
                    >
                      <FaUserEdit /> {a.is_approved ? 'Disapprove' : 'Approve'}
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
