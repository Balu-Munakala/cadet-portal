// src/components/Attendance/AttendanceSection.jsx
import React, { useState } from 'react';
import styles from './AttendanceSection.module.css';
import TakeAttendance from './TakeAttendance';
import ViewAttendance from './ViewAttendance';

export default function AttendanceSection() {
  const [view, setView] = useState('dashboard');

  const renderContent = () => {
    switch (view) {
      case 'take':
        // Pass setView to allow the child component to navigate back
        return <TakeAttendance setView={setView} />;
      case 'view':
        // Pass setView to allow the child component to navigate back
        return <ViewAttendance setView={setView} />;
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
                <i className={`fas fa-clipboard-check ${styles.icon}`}></i>
                Take Attendance
              </button>

              <button
                type="button"
                className={styles.button}
                onClick={() => setView('view')}
              >
                <i className={`fas fa-eye ${styles.icon}`}></i>
                View Attendance
              </button>
            </div>
          </div>
        );
    }
  };

  return <div className={styles.page}>{renderContent()}</div>;
}