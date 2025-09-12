import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './MasterDashboard.module.css';
import { FaSignOutAlt } from 'react-icons/fa';
import DashboardSection from '../components/master/DashboardSection';
import BackupRestore from '../components/master/BackupRestore';
import GlobalSearch from '../components/master/GlobalSearch';
import ManageAdmins from '../components/master/ManageAdmins';
import ManageUsers from '../components/master/ManageUsers';
import ProfileSection from '../components/master/ProfileSection';
import NotificationManager from '../components/master/master/NotificationManager';
import PlatformConfig from '../components/master/PlatformConfig';
import SupportQueries from '../components/master/SupportQueries';
import SystemLogs from '../components/master/SystemLogs';
import SystemReports from '../components/master/SystemReports';

const MasterDashboard = ({ apiBaseUrl }) => {
  const [master, setMaster] = useState(null);
  const [section, setSection] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [showModal, setShowModal] = useState(false);
  
  const navigate = useNavigate();

  useEffect(() => {
    const fetchMasterProfile = async () => {
      try {
        const res = await fetch(`${apiBaseUrl}/api/master/profile`, {
          method: 'GET',
          credentials: 'include'
        });
        const data = await res.json();
        if (res.ok) {
          setMaster(data);
        } else {
          console.error("Failed to fetch master profile:", data.message);
          setShowModal({
            message: "Session expired. Please log in again.",
            onConfirm: () => navigate('/')
          });
        }
      } catch (err) {
        console.error("Failed to fetch master profile:", err);
        setShowModal({
          message: "Network error. Please check your connection.",
          onConfirm: () => navigate('/')
        });
      }
    };
    if (apiBaseUrl) {
      fetchMasterProfile();
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
    if (!master) return <div className={styles.loading}>Loading…</div>;

    switch (section) {
      case 'dashboard':
        return <DashboardSection user={master} />;
      case 'ProfileSection':
        return <ProfileSection user={master} />;
      case 'GlobalSearch':
        return <GlobalSearch user={master} />;
      case 'ManageAdmins':
        return <ManageAdmins user={master} />;
      case 'ManageUsers':
        return <ManageUsers user={master} />;
      case 'NotificationManager':
        return <NotificationManager user={master} />;
      case 'BackupRestore':
        return <BackupRestore user={master} />;
      case 'PlatformConfig':
        return <PlatformConfig user={master} />;
      case 'SupportQueries':
        return <SupportQueries user={master} />;
      case 'SystemLogs':
        return <SystemLogs user={master} />;
      case 'SystemReports':
        return <SystemReports user={master} />;
      default:
        return <div className={styles.loading}>Section under construction.</div>;
    }
  };

  return (
    <div className={styles.dashboard}>
      <header className={styles.header}>
        <div className={styles.headerLeft}>
          <button onClick={() => setSidebarOpen(o => !o)} className={styles.toggleBtn}>☰</button>
          <img src="/logo.png" alt="Logo" className={styles.logo} />
        </div>
        <h1 className={styles.headerTitle}>Master Control Panel</h1>
        <button className={styles.logoutBtn} onClick={handleLogout}><FaSignOutAlt size={20} /></button>
      </header>

      <div className={styles.mainContainer}>
        {sidebarOpen && (
          <aside className={styles.sidebar}>
            <div className={styles.sidebarHeader}>
              <h2>Welcome,</h2>
              <p>{master?.name || 'Master'}</p>
            </div>
            <button onClick={() => setSection('dashboard')}>Dashboard</button>
            <button onClick={() => setSection('ProfileSection')}>Profile</button>
            <button onClick={() => setSection('GlobalSearch')}>Global Search</button>
            <button onClick={() => setSection('ManageAdmins')}>Manage Admins</button>
            <button onClick={() => setSection('ManageUsers')}>Manage Users</button>
            <button onClick={() => setSection('NotificationManager')}>Notifications</button>
            <button onClick={() => setSection('BackupRestore')}>Backup & Restore</button>
            <button onClick={() => setSection('PlatformConfig')}>Platform Config</button>
            <button onClick={() => setSection('SupportQueries')}>Support Queries</button>
            <button onClick={() => setSection('SystemLogs')}>System Logs</button>
            <button onClick={() => setSection('SystemReports')}>System Reports</button>
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

export default MasterDashboard;
