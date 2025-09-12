import React, { useEffect, useState } from 'react';
import styles from './TakeAttendance.module.css';
import { FaEdit, FaTrashAlt, FaSave } from 'react-icons/fa';

export default function TakeAttendance({ apiBaseUrl }) {
  const [fallins, setFallins] = useState([]);
  const [selectedFallin, setSelectedFallin] = useState(null);
  const [cadets, setCadets] = useState([]);
  const [attendanceMap, setAttendanceMap] = useState({});
  const [message, setMessage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [modalContent, setModalContent] = useState({});

  useEffect(() => {
    fetchFallinList();
  }, [apiBaseUrl]);

  async function fetchFallinList() {
    setLoading(true);
    setMessage(null);
    try {
      const res = await fetch(`${apiBaseUrl}/api/attendance/fallins`, { credentials: 'include' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setFallins(data);
    } catch (err) {
      console.error('[Fetch Fallins Error]', err);
      setMessage({ type: 'error', text: 'Failed to load fallins.' });
    } finally {
      setLoading(false);
    }
  }

  async function handleSelectFallin(fallin) {
    setSelectedFallin(fallin);
    setCadets([]);
    setAttendanceMap({});
    setMessage(null);
    setLoading(true);

    try {
      const [cadetRes, attRes] = await Promise.all([
        fetch(`${apiBaseUrl}/api/attendance/students/${fallin.fallin_id}`, { credentials: 'include' }),
        fetch(`${apiBaseUrl}/api/attendance/view/${fallin.fallin_id}`, { credentials: 'include' })
      ]);

      if (!cadetRes.ok) throw new Error(`HTTP ${cadetRes.status}`);
      const cadetList = await cadetRes.json();

      if (!attRes.ok) {
        throw new Error(`HTTP ${attRes.status}`);
      }
      const attList = await attRes.json();

      const existingMap = {};
      attList.forEach((row) => {
        existingMap[row.regimental_number] = {
          attendance_id: row.attendance_id,
          status: row.status
        };
      });

      const initMap = {};
      cadetList.forEach((cadet) => {
        if (existingMap[cadet.regimental_number]) {
          initMap[cadet.regimental_number] = {
            attendance_id: existingMap[cadet.regimental_number].attendance_id,
            status: existingMap[cadet.regimental_number].status
          };
        } else {
          initMap[cadet.regimental_number] = {
            attendance_id: null,
            status: 'Present'
          };
        }
      });

      setCadets(cadetList);
      setAttendanceMap(initMap);
    } catch (err) {
      console.error('[Fetch Cadets/Attendance Error]', err);
      setMessage({ type: 'error', text: 'Failed to load cadets or attendance.' });
    } finally {
      setLoading(false);
    }
  }

  function handleStatusChange(regimental_number, newStatus) {
    setAttendanceMap((prev) => ({
      ...prev,
      [regimental_number]: {
        ...prev[regimental_number],
        status: newStatus
      }
    }));
  }

  async function handleEdit(regimental_number) {
    setMessage(null);
    setLoading(true);
    const { attendance_id, status } = attendanceMap[regimental_number];

    try {
      if (attendance_id) {
        const res = await fetch(`${apiBaseUrl}/api/attendance/${attendance_id}`, {
          method: 'PUT',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status })
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        setMessage({ type: 'success', text: `Updated ${regimental_number} → ${status}` });
      } else {
        const payload = {
          records: [{ regimental_number, status }]
        };
        const res = await fetch(
          `${apiBaseUrl}/api/attendance/mark/${selectedFallin.fallin_id}`,
          {
            method: 'POST',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
          }
        );
        if (!res.ok) {
          const errJson = await res.json();
          throw new Error(errJson.msg || `HTTP ${res.status}`);
        }
        const newAttRes = await fetch(
          `${apiBaseUrl}/api/attendance/view/${selectedFallin.fallin_id}`,
          { credentials: 'include' }
        );
        if (!newAttRes.ok) throw new Error(`HTTP ${newAttRes.status}`);
        const updatedList = await newAttRes.json();
        const updatedMap = {};
        updatedList.forEach((rec) => {
          updatedMap[rec.regimental_number] = {
            attendance_id: rec.attendance_id,
            status: rec.status
          };
        });
        setAttendanceMap((prev) => ({
          ...prev,
          [regimental_number]: {
            attendance_id: updatedMap[regimental_number].attendance_id,
            status: updatedMap[regimental_number].status
          }
        }));
        setMessage({ type: 'success', text: `Recorded ${regimental_number} → ${status}` });
      }
    } catch (err) {
      console.error('[Edit Attendance Error]', err);
      setMessage({ type: 'error', text: `Failed to save ${regimental_number}.` });
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(regimental_number) {
    const { attendance_id } = attendanceMap[regimental_number];
    if (!attendance_id) {
      setMessage({ type: 'error', text: `No existing record for ${regimental_number}.` });
      return;
    }

    setModalContent({
      title: 'Confirm Deletion',
      message: 'Are you sure you want to delete this attendance record?',
      onConfirm: async () => {
        setLoading(true);
        try {
          const res = await fetch(`${apiBaseUrl}/api/attendance/${attendance_id}`, {
            method: 'DELETE',
            credentials: 'include'
          });
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          setAttendanceMap((prev) => ({
            ...prev,
            [regimental_number]: { attendance_id: null, status: 'Present' }
          }));
          setMessage({ type: 'success', text: `Deleted attendance for ${regimental_number}.` });
          setShowModal(false);
        } catch (err) {
          console.error('[Delete Attendance Error]', err);
          setMessage({ type: 'error', text: `Failed to delete ${regimental_number}.` });
          setShowModal(false);
        } finally {
          setLoading(false);
        }
      },
    });
    setShowModal(true);
  }

  async function handleSubmitAll() {
    if (!selectedFallin) return;
    setMessage(null);
    setLoading(true);

    const existingUpdates = [];
    const newRecords = [];

    Object.entries(attendanceMap).forEach(([regimental_number, { attendance_id, status }]) => {
      if (attendance_id) {
        existingUpdates.push({ attendance_id, status });
      } else {
        newRecords.push({ regimental_number, status });
      }
    });

    try {
      const updatePromises = existingUpdates.map(({ attendance_id, status }) =>
        fetch(`${apiBaseUrl}/api/attendance/${attendance_id}`, {
          method: 'PUT',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status })
        })
      );
      
      const bulkRes = newRecords.length ? await fetch(
        `${apiBaseUrl}/api/attendance/mark/${selectedFallin.fallin_id}`,
        {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ records: newRecords })
        }
      ) : null;

      const [updateResults, bulkResult] = await Promise.allSettled([
        Promise.all(updatePromises),
        bulkRes,
      ]);

      if (updateResults.status === 'rejected' || (bulkResult && !bulkResult.ok)) {
        throw new Error('Some attendance records failed to save.');
      }
      
      const newAttRes = await fetch(
        `${apiBaseUrl}/api/attendance/view/${selectedFallin.fallin_id}`,
        { credentials: 'include' }
      );
      if (!newAttRes.ok) throw new Error(`HTTP ${newAttRes.status}`);
      const updatedList = await newAttRes.json();
      const updatedMap = {};
      updatedList.forEach((rec) => {
        updatedMap[rec.regimental_number] = {
          attendance_id: rec.attendance_id,
          status: rec.status
        };
      });
      setAttendanceMap((prev) => ({ ...prev, ...updatedMap }));
      setMessage({ type: 'success', text: 'All attendance saved successfully.' });
    } catch (err) {
      console.error('[Submit All Error]', err);
      setMessage({ type: 'error', text: 'Failed to save all attendance.' });
    } finally {
      setLoading(false);
    }
  }

  function handleBack() {
    setSelectedFallin(null);
    setCadets([]);
    setAttendanceMap({});
    setMessage(null);
  }

  return (
    <div className={styles.container}>
      <h1 className={styles.heading}>Take Attendance</h1>
      {message && (
        <div className={`${styles.message} ${styles[message.type]}`}>
          {message.text}
        </div>
      )}
      {loading && <p>Loading…</p>}
      {!loading && !selectedFallin && (
        <div className={styles.fallinList}>
          {fallins.length > 0 ? (
            fallins.map((f) => (
              <div
                key={f.fallin_id}
                className={styles.fallinCard}
                onClick={() => handleSelectFallin(f)}
              >
                <h3>
                  {new Date(f.date).toLocaleDateString()} @ {f.time}
                </h3>
                <p><strong>Type:</strong> {f.type}</p>
                <p><strong>Location:</strong> {f.location}</p>
              </div>
            ))
          ) : (
            <p>No fallins available.</p>
          )}
        </div>
      )}
      {!loading && selectedFallin && (
        <>
          <button className={styles.backButton} onClick={handleBack}>
            ← Back to Fallin List
          </button>
          <div className={styles.selectedFallinInfo}>
            <h2>
              {new Date(selectedFallin.date).toLocaleDateString()} @{' '}
              {selectedFallin.time} — {selectedFallin.location}
            </h2>
          </div>
          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Regimental Number</th>
                  <th>Name</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {cadets.length > 0 ? (
                  cadets.map((c) => {
                    const record = attendanceMap[c.regimental_number] || {
                      attendance_id: null,
                      status: 'Present'
                    };
                    return (
                      <tr key={c.regimental_number}>
                        <td>{c.regimental_number}</td>
                        <td>{c.name}</td>
                        <td>
                          <select
                            className={styles.statusSelect}
                            value={record.status}
                            onChange={(e) =>
                              handleStatusChange(c.regimental_number, e.target.value)
                            }
                          >
                            <option value="Present">Present</option>
                            <option value="Absent">Absent</option>
                            <option value="Late">Late</option>
                            <option value="Excused">Excused</option>
                          </select>
                        </td>
                        <td className={styles.actionBtns}>
                          <button
                            className={styles.editBtn}
                            onClick={() => handleEdit(c.regimental_number)}
                            disabled={loading}
                          >
                            <FaEdit />
                          </button>
                          <button
                            className={styles.deleteBtn}
                            onClick={() => handleDelete(c.regimental_number)}
                            disabled={loading}
                          >
                            <FaTrashAlt />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan="4" className={styles.noData}>
                      No cadets found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          {cadets.length > 0 && (
            <div style={{ textAlign: 'center', marginTop: '20px' }}>
              <button
                className={styles.submitAllBtn}
                onClick={handleSubmitAll}
                disabled={loading}
              >
                <FaSave /> Submit All
              </button>
            </div>
          )}
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
