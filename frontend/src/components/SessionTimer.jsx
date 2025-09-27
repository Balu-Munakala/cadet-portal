import React, { useState, useEffect } from 'react';
import styles from './SessionTimer.module.css';

const SessionTimer = ({ onSessionExpired }) => {
  const [timeLeft, setTimeLeft] = useState(3600); // 1 hour in seconds
  const [isWarning, setIsWarning] = useState(false);

  useEffect(() => {
    // Get session start time from localStorage or set current time
    const sessionStart = localStorage.getItem('sessionStart');
    const now = Date.now();
    
    if (!sessionStart) {
      // Set session start time to current time
      localStorage.setItem('sessionStart', now.toString());
      setTimeLeft(3600); // Start with full 1 hour
    } else {
      // Calculate remaining time based on elapsed time
      const elapsed = Math.floor((now - parseInt(sessionStart)) / 1000);
      const remaining = Math.max(0, 3600 - elapsed);
      setTimeLeft(remaining);
    }

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        const newTime = prev - 1;
        
        if (newTime <= 0) {
          clearInterval(timer);
          localStorage.removeItem('sessionStart');
          if (onSessionExpired) {
            onSessionExpired();
          }
          return 0;
        }
        
        // Show warning when less than 5 minutes left
        setIsWarning(newTime <= 300);
        
        return newTime;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [onSessionExpired]);

  const formatTime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  if (timeLeft <= 0) {
    return (
      <div className={`${styles.sessionTimer} ${styles.expired}`}>
        <span className={styles.icon}>⏰</span>
        <span>Session Expired</span>
      </div>
    );
  }

  return (
    <div className={`${styles.sessionTimer} ${isWarning ? styles.warning : ''}`}>
      <span className={styles.icon}>🕒</span>
      <span className={styles.time}>{formatTime(timeLeft)}</span>
      {isWarning && <span className={styles.warningText}>Session expires soon!</span>}
    </div>
  );
};

export default SessionTimer;