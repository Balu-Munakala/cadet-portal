import React, { useEffect, useState } from 'react';
import styles from './AdminReportsSection.module.css';

export default function AdminReportsSection({ apiBaseUrl = process.env.REACT_APP_API_URL}) {
  // Summary state
  const [summary, setSummary] = useState({
    totalCadets: null,
    pendingCadets: null,
    totalEvents: null,
    avgAttendance: null,
  });

  // Detailed attendance table state
  const [attendanceDetails, setAttendanceDetails] = useState([]);
  
  // Loading & error states
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState(null); // { type: 'error'|'info', text: '' }

  // On mount, fetch summary and details
  useEffect(() => {
    const fetchAllData = async () => {
      setLoading(true);
      setMessage(null);

      try {
        const [usersRes, eventsRes, attSumRes, attDetailsRes] = await Promise.all([
          fetch(`${apiBaseUrl}/api/admin/reports/users`, { credentials: 'include' }),
          fetch(`${apiBaseUrl}/api/admin/reports/events-count`, { credentials: 'include' }),
          fetch(`${apiBaseUrl}/api/admin/reports/attendance-summary`, { credentials: 'include' }),
          fetch(`${apiBaseUrl}/api/admin/reports/attendance-details`, { credentials: 'include' }),
        ]);

        const usersData = await usersRes.json();
        const eventsData = await eventsRes.json();
        const attSumData = await attSumRes.json();
        const attDetailsData = await attDetailsRes.json();
        
        // Update summary state
        setSummary({
          totalCadets: usersData.totalCadets,
          pendingCadets: usersData.pendingCadets,
          totalEvents: eventsData.totalEvents,
          avgAttendance: attSumData.avgAttendance,
        });

        // Update attendance details state
        setAttendanceDetails(attDetailsData);

      } catch (err) {
        console.error('[AdminReports] Fetch Error', err);
        setMessage({ type: 'error', text: 'Failed to load report data.' });
      } finally {
        setLoading(false);
      }
    };

    fetchAllData();
  }, [apiBaseUrl]);

  if (loading) return <div className={styles.loading}>Loading…</div>;
  if (message) return <div className={`${styles.message} ${styles[message.type]}`}>{message.text}</div>;

  return (
    <div className={styles.container}>
      <h2>Admin Reports</h2>

      <div className={styles.cardsWrapper}>
        <div className={styles.card}>
          <h3>Total Cadets</h3>
          <p className={styles.cardValue}>{summary.totalCadets ?? '-'}</p>
        </div>
        <div className={styles.card}>
          <h3>Pending Approvals</h3>
          <p className={styles.cardValue}>{summary.pendingCadets ?? '-'}</p>
        </div>
        <div className={styles.card}>
          <h3>Total Events</h3>
          <p className={styles.cardValue}>{summary.totalEvents ?? '-'}</p>
        </div>
        <div className={styles.card}>
          <h3>Avg. Attendance (%)</h3>
          <p className={styles.cardValue}>
            {summary.avgAttendance !== null ? `${summary.avgAttendance}%` : '-'}
          </p>
        </div>
      </div>

      <h3 className={styles.sectionTitle}>Recent Attendance Details</h3>
      {attendanceDetails.length > 0 ? (
        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Fall-in ID</th>
                <th>Date</th>
                <th>Time</th>
                <th>Present</th>
                <th>Total Cadets</th>
                <th>% Present</th>
              </tr>
            </thead>
            <tbody>
              {attendanceDetails.map((row) => (
                <tr key={row.fallin_id}>
                  <td>{row.fallin_id}</td>
                  <td>{new Date(row.date).toLocaleDateString()}</td>
                  <td>{row.time.slice(0, 5)}</td>
                  <td>{row.attendedCount}</td>
                  <td>{row.totalCadets}</td>
                  <td>{row.percentage}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className={styles.noData}>No recent attendance data available.</p>
      )}
    </div>
  );
}
