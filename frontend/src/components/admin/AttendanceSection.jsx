import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './AttendanceSection.module.css';

const AttendanceDashboard = ({ apiBaseUrl }) => {
  const navigate = useNavigate();
  const [view, setView] = useState('dashboard');

  const renderContent = () => {
    switch (view) {
      case 'take':
        // Assuming TakeAttendance.jsx exists and is imported
        return <TakeAttendance apiBaseUrl={apiBaseUrl} onBack={() => setView('dashboard')} />;
      case 'view':
        // Assuming ViewAttendance.jsx exists and is imported
        return <ViewAttendance apiBaseUrl={apiBaseUrl} onBack={() => setView('dashboard')} />;
      default:
        return (
          <div className={styles.container}>
            <h1 className={styles.heading}>Attendance Dashboard</h1>
            <div className={styles.buttonContainer}>
              <button
                type="button"
                className={styles.button}
                onClick={() => setView('take')}
              >
                Take Attendance
              </button>
              <button
                type="button"
                className={styles.button}
                onClick={() => setView('view')}
              >
                View Attendance
              </button>
            </div>
          </div>
        );
    }
  };

  return <div className={styles.page}>{renderContent()}</div>;
};

export default AttendanceDashboard;
