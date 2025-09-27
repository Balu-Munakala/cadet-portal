import React, { useEffect, useState } from 'react';
import styles from './SystemLogs.module.css';

export default function SystemLogs({ apiBaseUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000'}) {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchLogs = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${apiBaseUrl}/api/master/logs`, { 
        credentials: 'include' 
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setLogs(data);
    } catch (err) {
      console.error('[SystemLogs] ', err);
      setError('Failed to load logs.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [apiBaseUrl]);

  return (
    <div className={styles.container}>
      <h2>System Logs</h2>
      {loading && <div className={styles.loading}>Loading…</div>}
      {error && <div className={styles.error}>{error}</div>}
      {!loading && !logs.length && <div className={styles.noData}>No logs available.</div>}

      {!loading && logs.length > 0 && (
        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>ID</th>
                <th>Level</th>
                <th>Message</th>
                <th>Timestamp</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => {
                const dateObj = new Date(log.created_at);
                const formatted = dateObj.toLocaleString();
                return (
                  <tr key={log.log_id}>
                    <td>{log.log_id}</td>
                    <td>{log.level}</td>
                    <td>{log.message}</td>
                    <td>{formatted}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
