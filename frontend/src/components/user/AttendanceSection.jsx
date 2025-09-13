import React, { useEffect, useState } from 'react';
import styles from './AttendanceSection.module.css';

export default function AttendanceSection({ apiBaseUrl = process.env.REACT_APP_API_URL}) {
  const [attendanceData, setAttendanceData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);

  const fetchAttendanceData = async () => {
    setLoading(true);
    setMessage(null);

    try {
      // 1) Fetch profile to get regimental_number
      const profRes = await fetch(`${apiBaseUrl}/api/users/profile`, {
        credentials: 'include'
      });
      if (!profRes.ok) {
        throw new Error(`Profile HTTP ${profRes.status}`);
      }
      const { regimental_number } = await profRes.json();

      // 2) Fetch Fall-Ins for this cadet’s ANO
      const fallinRes = await fetch(`${apiBaseUrl}/api/fallin/userfallin`, {
        credentials: 'include'
      });
      if (!fallinRes.ok) {
        throw new Error(`Fallin HTTP ${fallinRes.status}`);
      }
      const fallinList = await fallinRes.json();

      // 3) For each fallin, fetch attendance and pick out this user’s row
      const attendancePromises = fallinList.map(async (f) => {
        try {
          const attRes = await fetch(`${apiBaseUrl}/api/attendance/view/${f.fallin_id}`, {
            credentials: 'include'
          });
          if (!attRes.ok) {
            return {
              fallin_id: f.fallin_id,
              date: f.date,
              time: f.time,
              location: f.location,
              status: 'Not recorded'
            };
          }
          const attList = await attRes.json();
          // Find the record for this cadet
          const record = attList.find((row) => row.regimental_number === regimental_number);
          if (record) {
            return {
              fallin_id: f.fallin_id,
              date: f.date,
              time: f.time,
              location: f.location,
              status: record.status
            };
          } else {
            return {
              fallin_id: f.fallin_id,
              date: f.date,
              time: f.time,
              location: f.location,
              status: 'Not recorded'
            };
          }
        } catch (err) {
          console.error('[Fetch Attendance Row Error]', err);
          return {
            fallin_id: f.fallin_id,
            date: f.date,
            time: f.time,
            location: f.location,
            status: 'Error'
          };
        }
      });

      const results = await Promise.all(attendancePromises);
      // Sort newest first
      results.sort((a, b) => {
        const da = new Date(a.date + 'T' + a.time);
        const db = new Date(b.date + 'T' + b.time);
        return db - da;
      });

      setAttendanceData(results);
    } catch (err) {
      console.error('[Load Data Error]', err);
      setMessage({ type: 'error', text: 'Failed to load attendance information.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAttendanceData();
  }, [apiBaseUrl]);

  const handleRefresh = () => {
    setAttendanceData([]);
    setMessage(null);
    fetchAttendanceData();
  };

  return (
    <div className={styles.container}>
      <h2>Fall-In Attendance</h2>
      {message && (
        <div
          className={`${styles.message} ${
            message.type === 'error' ? styles.error : styles.info
          }`}
        >
          {message.text}
        </div>
      )}
      {loading && <p>Loading…</p>}
      {!loading && attendanceData.length > 0 && (
        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Date</th>
                <th>Time</th>
                <th>Location</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {attendanceData.map((row) => (
                <tr key={row.fallin_id}>
                  <td>{row.date ? new Date(row.date).toLocaleDateString() : '-'}</td>
                  <td>{row.time || '-'}</td>
                  <td>{row.location || '-'}</td>
                  <td>{row.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {!loading && attendanceData.length === 0 && (
        <p>No fall-in attendance available.</p>
      )}
      <button
        className={styles.refreshBtn}
        onClick={handleRefresh}
        disabled={loading}
      >
        Refresh
      </button>
    </div>
  );
}
