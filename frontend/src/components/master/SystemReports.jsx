import React, { useEffect, useState } from 'react';
import styles from './SystemReports.module.css';

export default function SystemReports({ apiBaseUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000'}) {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchSummary = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${apiBaseUrl}/api/master/reports/summary`, { 
        credentials: 'include' 
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setSummary(data);
    } catch (err) {
      console.error('[SystemReports] ', err);
      setError('Failed to load report summary.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSummary();
  }, [apiBaseUrl]);

  if (loading) return <div className={styles.loading}>Loading…</div>;
  if (error) return <div className={styles.error}>{error}</div>;

  return (
    <div className={styles.container}>
      <h2>System Reports</h2>
      <div className={styles.reportItem}>
        <span className={styles.label}>Total ANOs:</span>
        <span className={styles.value}>{summary.totalAdmins}</span>
      </div>
      <div className={styles.reportItem}>
        <span className={styles.label}>Total Cadets:</span>
        <span className={styles.value}>{summary.totalCadets}</span>
      </div>
      <div className={styles.reportItem}>
        <span className={styles.label}>Total Events:</span>
        <span className={styles.value}>{summary.totalEvents}</span>
      </div>
      <div className={styles.reportItem}>
        <span className={styles.label}>Total Fall-Ins:</span>
        <span className={styles.value}>{summary.totalFallins}</span>
      </div>
      <div className={styles.reportItem}>
        <span className={styles.label}>Total Attendance:</span>
        <span className={styles.value}>{summary.totalAttendance}</span>
      </div>
    </div>
  );
}
