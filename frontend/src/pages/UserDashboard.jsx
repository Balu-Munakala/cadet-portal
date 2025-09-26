import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './UserDashboard.module.css';
import { FaSignOutAlt } from 'react-icons/fa';

import DashboardSection from '../components/user/DashboardSection';
import ProfileSection from '../components/user/ProfileSection';
import FallinDetailsSection from '../components/user/FallinDetailsSection';
import AchievementsSection from '../components/user/AchievementsSection';
import AttendanceSection from '../components/user/AttendanceSection';
import EventsSection from '../components/user/EventsSection';
import ChangePasswordSection from '../components/ChangePasswordSection';
import NotificationsSection from '../components/user/NotificationsSection';
import ContactUsSection from '../components/user/ContactUsSection';

const UserDashboard = ({ apiBaseUrl }) => {
  const [user, setUser] = useState(null);
  const [currentSection, setCurrentSection] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [showModal, setShowModal] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const res = await fetch(`${apiBaseUrl}/api/users/profile`, {
          method: 'GET',
          credentials: 'include'
        });
        const data = await res.json();
        if (res.ok) {
          setUser(data);
        } else {
          console.error("Failed to fetch user profile:", data.message);
          setShowModal({
            message: "Session expired. Please log in again.",
            onConfirm: () => navigate('/')
          });
        }
      } catch (err) {
        console.error("Failed to fetch user profile:", err);
        setShowModal({
          message: "Network error. Please check your connection.",
          onConfirm: () => navigate('/')
        });
      }
    };
    if (apiBaseUrl) {
      fetchUserProfile();
    }
  }, [apiBaseUrl, navigate]);

  const handleLogout = async () => {
    setShowModal({
      message: 'Are you sure you want to log out?',
      onConfirm: async () => {
        try {
          const res = await fetch(`${apiBaseUrl}/auth/logout`, {
            method: 'POST',
            credentials: 'include'
          });
          if (res.ok) {
            navigate('/');
          } else {
            setShowModal({
              message: 'Logout failed. Please try again.',
              onConfirm: () => setShowModal(false)
            });
          }
        } catch {
          setShowModal({
            message: 'Network error. Please try again.',
            onConfirm: () => setShowModal(false)
          });
        }
      },
      onCancel: () => setShowModal(false)
    });
  };

  const renderSection = () => {
    if (!user) return <p className={styles.loading}>Loading...</p>;

    switch (currentSection) {
      case 'dashboard':
        return <DashboardSection user={user} />;
      case 'profile':
        return <ProfileSection user={user} />;
      case 'achievements':
        return <AchievementsSection user={user} />;
      case 'attendance':
        return <AttendanceSection user={user} />;
      case 'events':
        return <EventsSection user={user} />;
      case 'fallin':
        return <FallinDetailsSection user={user} />;
      case 'changePassword':
        return <ChangePasswordSection user={user} />;
      case 'notifications':
        return <NotificationsSection user={user} />;
      case 'contactUs':
        return <ContactUsSection user={user} />;
      default:
        return <p>This section is under construction.</p>;
    }
  };

  return (
    <div className={`${styles.dashboard} ${sidebarOpen ? styles.sidebarOpen : ''}`}>
      <header className={styles.header}>
        <div className={styles.headerLeft}>
          <button onClick={() => setSidebarOpen(o => !o)} className={styles.toggleBtn}>☰</button>
          <img src="/logo.png" alt="NCC" className={styles.logo} />
        </div>
        <h1 className={styles.headerTitle}>NCC Cadet Dashboard</h1>
        <button className={styles.logoutBtn} onClick={handleLogout}>
          <FaSignOutAlt size={20} />
        </button>
      </header>
      <div className={styles.mainContainer}>
        {sidebarOpen && (
          <aside className={styles.sidebar}>
            <h2>Welcome,<br />{user?.name}</h2>
            <button onClick={() => setCurrentSection('dashboard')}>Dashboard</button>
            <button onClick={() => setCurrentSection('profile')}>Profile</button>
            <button onClick={() => setCurrentSection('achievements')}>Achievements</button>
            <button onClick={() => setCurrentSection('attendance')}>Attendance</button>
            <button onClick={() => setCurrentSection('events')}>Events</button>
            <button onClick={() => setCurrentSection('fallin')}>Fallin Details</button>
            <button onClick={() => setCurrentSection('changePassword')}>Change Password</button>
            <button onClick={() => setCurrentSection('notifications')}>Notifications</button>
            <button onClick={() => setCurrentSection('contactUs')}>Contact Support</button>
          </aside>
        )}
        <main className={styles.content}>
          {renderSection()}
        </main>
      </div>
      {showModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <p>{showModal.message}</p>
            <div className={styles.modalActions}>
              {showModal.onCancel && <button onClick={showModal.onCancel}>Cancel</button>}
              <button onClick={showModal.onConfirm}>OK</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserDashboard;
