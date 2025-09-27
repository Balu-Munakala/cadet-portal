import React, { useEffect, useState } from 'react';
import styles from './ViewAttendance.module.css';

export default function ViewAttendance({ apiBaseUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000'}) {
  const [fallins, setFallins] = useState([]);
  const [selectedFallinId, setSelectedFallinId] = useState('');
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [loadingFallins, setLoadingFallins] = useState(false);
  const [loadingRecords, setLoadingRecords] = useState(false);
  const [message, setMessage] = useState(null); // { type: 'error'|'info', text: '' }

  // 1) Fetch all fallins for this ANO
  useEffect(() => {
    const fetchFallins = async () => {
      setLoadingFallins(true);
      setMessage(null);
      try {
        const res = await fetch(`${apiBaseUrl}/api/attendance/fallins`, {
          credentials: 'include',
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        setFallins(data);
        if (data.length > 0) {
          // Pre‐select the most recent fallin
          setSelectedFallinId(data[0].fallin_id);
        }
      } catch (err) {
        console.error('[Fetch Fallins Error]', err);
        setMessage({ type: 'error', text: 'Failed to load fall‐in events.' });
      } finally {
        setLoadingFallins(false);
      }
    };

    fetchFallins();
  }, [apiBaseUrl]);

  // 2) Whenever selectedFallinId changes, fetch attendance for that fallin
  useEffect(() => {
    if (!selectedFallinId) {
      setAttendanceRecords([]);
      return;
    }

    const fetchAttendance = async () => {
      setLoadingRecords(true);
      setMessage(null);
      try {
        const res = await fetch(`${apiBaseUrl}/api/attendance/view/${selectedFallinId}`, {
          credentials: 'include',
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        setAttendanceRecords(data);
      } catch (err) {
        console.error('[Fetch Attendance Error]', err);
        setMessage({ type: 'error', text: 'Failed to load attendance records.' });
      } finally {
        setLoadingRecords(false);
      }
    };

    fetchAttendance();
  }, [selectedFallinId, apiBaseUrl]);

  // 3) Handle dropdown change
  const handleFallinChange = (e) => {
    setSelectedFallinId(e.target.value);
  };

  return (
    <div className={styles.container}>
      <h2>View Attendance</h2>

      {message && (
        <div
          className={`${styles.message} ${
            message.type === 'error' ? styles.error : styles.info
          }`}
        >
          {message.text}
        </div>
      )}

      <div className={styles.controls}>
        <label htmlFor="fallinSelect">Select Fall-in:</label>
        {loadingFallins ? (
          <span className={styles.loadingText}>Loading fall-ins…</span>
        ) : (
          <select
            id="fallinSelect"
            value={selectedFallinId}
            onChange={handleFallinChange}
            className={styles.select}
          >
            {fallins.map((f) => (
              <option key={f.fallin_id} value={f.fallin_id}>
                {new Date(f.date).toLocaleDateString()} @ {f.time} — {f.type}
              </option>
            ))}
            {fallins.length === 0 && (
              <option value="">No fall-in events found</option>
            )}
          </select>
        )}
      </div>

      <div className={styles.tableWrapper}>
        {loadingRecords ? (
          <p className={styles.loadingText}>Loading attendance…</p>
        ) : attendanceRecords.length > 0 ? (
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Regimental No.</th>
                <th>Name</th>
                <th>Status</th>
                <th>Remarks</th>
                <th>Recorded At</th>
                <th>Last Updated</th>
              </tr>
            </thead>
            <tbody>
              {attendanceRecords.map((rec) => (
                <tr key={rec.attendance_id}>
                  <td>{rec.regimental_number}</td>
                  <td>{rec.name}</td>
                  <td>{rec.status}</td>
                  <td>{rec.remarks || '-'}</td>
                  <td>
                    {new Date(rec.recorded_at).toLocaleDateString()}{' '}
                    {new Date(rec.recorded_at).toLocaleTimeString()}
                  </td>
                  <td>
                    {new Date(rec.updated_at).toLocaleDateString()}{' '}
                    {new Date(rec.updated_at).toLocaleTimeString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : selectedFallinId ? (
          <p className={styles.noData}>No attendance records for this fall-in.</p>
        ) : null}
      </div>
    </div>
  );
}
