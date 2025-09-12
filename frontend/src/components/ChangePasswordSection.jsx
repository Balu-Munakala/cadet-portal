import React, { useState } from 'react';
import styles from './ChangePasswordSection.module.css';

// A simple modal component to replace alert() and window.confirm()
const Modal = ({ message, onConfirm, onCancel }) => (
  <div className={styles.modalOverlay}>
    <div className={styles.modal}>
      <p>{message}</p>
      <div className={styles.modalActions}>
        {onCancel && <button onClick={onCancel}>Cancel</button>}
        {onConfirm && <button onClick={onConfirm}>OK</button>}
      </div>
    </div>
  </div>
);

const ChangePasswordSection = ({ apiBaseUrl }) => {
  const [formData, setFormData] = useState({
    current_password: '',
    new_password: '',
    confirm_password: ''
  });
  const [message, setMessage] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState(''); // 'confirm' or 'alert'
  const [modalMessage, setModalMessage] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setMessage('');
  };

  const showModal = (msg, type) => {
    setModalMessage(msg);
    setModalType(type);
    setIsModalOpen(true);
  };

  const handleModalConfirm = () => {
    setIsModalOpen(false);
    if (modalType === 'confirm') {
      // Logic for confirmed action
    }
  };

  const handleModalCancel = () => {
    setIsModalOpen(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const { current_password, new_password, confirm_password } = formData;

    if (new_password !== confirm_password) {
      setMessage('New password and confirmation do not match.');
      return;
    }

    if (current_password === new_password) {
      setMessage('New password cannot be the same as the current password.');
      return;
    }

    try {
      const response = await fetch(`${apiBaseUrl}/api/change-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({ current_password, new_password }) // Correct payload
      });

      const result = await response.json();

      if (response.ok) {
        setMessage('Password changed successfully!');
        setFormData({ current_password: '', new_password: '', confirm_password: '' });
      } else {
        setMessage(result.message || 'Password change failed.');
      }
    } catch (err) {
      console.error(err);
      setMessage('An error occurred while changing the password.');
    }
  };

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Change Password</h1>
      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.formGroup}>
          <label htmlFor="current_password">Current Password</label>
          <input
            type="password"
            id="current_password"
            name="current_password"
            value={formData.current_password}
            onChange={handleChange}
            required
          />
        </div>
        <div className={styles.formGroup}>
          <label htmlFor="new_password">New Password</label>
          <input
            type="password"
            id="new_password"
            name="new_password"
            value={formData.new_password}
            onChange={handleChange}
            required
          />
        </div>
        <div className={styles.formGroup}>
          <label htmlFor="confirm_password">Confirm New Password</label>
          <input
            type="password"
            id="confirm_password"
            name="confirm_password"
            value={formData.confirm_password}
            onChange={handleChange}
            required
          />
        </div>
        <button type="submit" className={styles.submitButton}>Change Password</button>
        {message && (
          <p className={
            message.startsWith('Password changed') ? styles.success : styles.error
          }>
            {message}
          </p>
        )}
      </form>
      {isModalOpen && (
        <Modal
          message={modalMessage}
          onConfirm={modalType === 'confirm' ? handleModalConfirm : null}
          onCancel={modalType === 'confirm' ? handleModalCancel : null}
        />
      )}
    </div>
  );
};

export default ChangePasswordSection;
