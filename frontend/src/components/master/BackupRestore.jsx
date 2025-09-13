import React, { useState } from 'react';
import styles from './BackupRestore.module.css';

export default function BackupRestore({ apiBaseUrl = process.env.REACT_APP_API_URL}) {
  const [message, setMessage] = useState('');
  const [loadingBackup, setLoadingBackup] = useState(false);
  const [loadingRestore, setLoadingRestore] = useState(false);

  const triggerBackup = async () => {
    setLoadingBackup(true);
    setMessage('');
    try {
      const res = await fetch(`${apiBaseUrl}/api/master/backup`, {
        method: 'POST',
        credentials: 'include',
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.msg || `HTTP ${res.status}`);
      setMessage(data.msg);
    } catch (err) {
      console.error('[BackupRestore] Backup Error', err);
      setMessage('Backup failed.');
    } finally {
      setLoadingBackup(false);
    }
  };

  const triggerRestore = async () => {
    setLoadingRestore(true);
    setMessage('');
    try {
      const res = await fetch(`${apiBaseUrl}/api/master/restore`, {
        method: 'POST',
        credentials: 'include',
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.msg || `HTTP ${res.status}`);
      setMessage(data.msg);
    } catch (err) {
      console.error('[BackupRestore] Restore Error', err);
      setMessage('Restore failed.');
    } finally {
      setLoadingRestore(false);
    }
  };

  return (
    <div className={styles.container}>
      <h2>Backup & Restore</h2>
      <div className={styles.buttons}>
        <button
          onClick={triggerBackup}
          disabled={loadingBackup}
          className={styles.btn}
        >
          {loadingBackup ? 'Backing up…' : 'Trigger Backup'}
        </button>
        <button
          onClick={triggerRestore}
          disabled={loadingRestore}
          className={styles.btn}
        >
          {loadingRestore ? 'Restoring…' : 'Trigger Restore'}
        </button>
      </div>
      {message && <p className={styles.message}>{message}</p>}
    </div>
  );
}
