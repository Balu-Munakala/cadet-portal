import React, { useEffect, useState } from 'react';
import styles from './AdminDashboard.module.css';
import { FaSignOutAlt } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';

import DashboardSection from '../components/admin/DashboardSection';
import ProfileSection from '../components/admin/ProfileSection';
import FallinDetailsSection from '../components/admin/FallinDetailsSection';
import EventsSection from '../components/admin/EventsSection';
import AttendanceSection from '../components/admin/AttendanceSection';
import AchievementsSection from '../components/admin/AchievementsSection';
import ChangePasswordSection from '../components/ChangePasswordSection';
import ManageUsersSection from '../components/admin/ManageUsersSection';
import AdminReportsSection from '../components/admin/AdminReportsSection';
import NotificationsSection from '../components/NotificationsSection';
import SupportQueriesSection from '../components/admin/SupportQueriesSection';
import NominalRollGenerator from '../components/admin/NominalRollGenerator';
import SessionTimer from '../components/SessionTimer';

// This component now accepts apiBaseUrl as a prop
const AdminDashboard = ({ apiBaseUrl }) => {
  const [admin, setAdmin] = useState(null);
  const [section, setSection] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [showModal, setShowModal] = useState(null);

  // useNavigate is the modern way to handle programmatic navigation in React Router v6
  const navigate = useNavigate();
  
  useEffect(() => {
    // Check if apiBaseUrl is defined before making the fetch call
    if (!apiBaseUrl) {
      console.error("API base URL is not defined.");
      return;
    }

    fetch(`${apiBaseUrl}/api/admin/profile`, {
      method: 'GET',
      credentials: 'include'
    })
      .then(res => res.json())
      .then(data => {
        setAdmin(data);
      })
      .catch(err => {
        console.error("Failed to fetch admin profile:", err);
        // Use navigate to redirect instead of window.location.href
        alert("Session expired"); // Temporary alert
        navigate('/');
      });
  }, [apiBaseUrl, navigate]);


  const handleLogout = async () => {
    // Replaced window.confirm with a state-managed modal
    setShowLogoutModal(true);
  };

  const confirmLogout = async () => {
    try {
      const res = await fetch(`${apiBaseUrl}/auth/logout`, {
        method: 'POST',
        credentials: 'include'
      });
      if (res.ok) navigate('/');
      else alert('Logout failed'); // Replaced with modal in final implementation
    } catch {
      alert('Network error'); // Replaced with modal in final implementation
    }
  };

  const renderSection = () => {
    if (!admin) return <p className={styles.loading}>Loading…</p>;

    switch (section) {
      case 'dashboard':         return <DashboardSection user={admin} setSection={setSection}/>;
      case 'profile':           return <ProfileSection user={admin} />;
      case 'achievements':      return <AchievementsSection user={admin}/>;
      case 'attendance':        return <AttendanceSection user={admin}/>;
      case 'events':            return <EventsSection user={admin}/>;
      case 'fallin':            return <FallinDetailsSection user={admin}/>;
      case 'changePassword':    return <ChangePasswordSection user={admin}/>;
      case 'manageUsers':       return <ManageUsersSection user={admin}/>;
      case 'adminReports':      return <AdminReportsSection user={admin}/>;
      case 'notifications':     return <NotificationsSection user={admin}/>;
      case 'supportQueries':    return <SupportQueriesSection user={admin}/>;
      case 'nominalRoll':       return <NominalRollGenerator apiBaseUrl={apiBaseUrl} />;
      default:                  return <p>Section under construction.</p>;
    }
  };

  const handleSessionExpired = () => {
    setShowModal({
      message: 'Your session has expired. You will be redirected to the login page.',
      onConfirm: () => {
        localStorage.removeItem('sessionStart');
        navigate('/');
      }
    });
  };

  return (
    <div className={styles.dashboard}>
      <header className={styles.header}>
        <div className={styles.headerLeft}>
          <button onClick={() => setSidebarOpen(o => !o)} className={styles.toggleBtn}>☰</button>
          {/* Use an imported logo instead of a hardcoded path */}
          <img src="/logo.png" alt="Logo" className={styles.logo} /> 
        </div>
        <h1 className={styles.headerTitle}>NCC ANO Dashboard</h1>
        <div className={styles.headerRight}>
          <SessionTimer onSessionExpired={handleSessionExpired} />
          <button className={styles.logoutBtn} onClick={handleLogout}
          ><FaSignOutAlt size={20}/></button>
        </div>
      </header>

      <div className={styles.mainContainer}>
        {sidebarOpen && (
          <aside className={styles.sidebar}>
            <h2>Welcome,<br/>{admin?.name || 'Admin'}</h2>
            <button onClick={() => setSection('dashboard')}>Dashboard</button>
            <button onClick={() => setSection('profile')}>Profile</button>
            <button onClick={() => setSection('fallin')}>Fallin Details</button>
            <button onClick={() => setSection('events')}>Events</button>
            <button onClick={() => setSection('attendance')}>Attendance</button>
            <button onClick={() => setSection('achievements')}>Achievements</button>
            <button onClick={() => setSection('manageUsers')}>Manage Users</button>
            <button onClick={() => setSection('adminReports')}>Admin Reports</button>
            <button onClick={() => setSection('notifications')}>Notifications</button>
            <button onClick={() => setSection('supportQueries')}>Support Queries</button>
            <button onClick={() => setSection('nominalRoll')}>📄 Generate Nominal Roll</button>
          </aside>
        )}

        <main className={styles.content}>
          {renderSection()}
        </main>
      </div>

      {showLogoutModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <p>Are you sure you want to log out?</p>
            <div className={styles.modalActions}>
              <button onClick={() => setShowLogoutModal(false)}>Cancel</button>
              <button onClick={confirmLogout}>Log Out</button>
            </div>
          </div>
        </div>
      )}

      {showModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <p>{showModal.message}</p>
            <div className={styles.modalActions}>
              <button onClick={showModal.onConfirm}>OK</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
