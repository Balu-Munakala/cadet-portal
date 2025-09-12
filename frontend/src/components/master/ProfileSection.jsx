import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './ProfileSection.module.css';

const MasterProfileSettings = ({ apiBaseUrl }) => {
  const [profile, setProfile] = useState({
    name: '', phone: '', email: '', address: ''
  });
  const [picUrl, setPicUrl] = useState('/default.jpg');
  const fileInputRef = useRef();
  const [message, setMessage] = useState({ type: '', text: '' });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const fetchProfileData = async () => {
    setLoading(true);
    try {
      const [profileRes, picRes] = await Promise.all([
        fetch(`${apiBaseUrl}/api/master/profile`, { credentials: 'include' }),
        fetch(`${apiBaseUrl}/api/master/profile-pic`, { credentials: 'include' })
      ]);

      if (!profileRes.ok) throw new Error('Unauthorized');
      const profileData = await profileRes.json();
      setProfile({
        name: profileData.name || '',
        phone: profileData.phone || '',
        email: profileData.email || '',
        address: profileData.address || ''
      });

      if (picRes.ok) {
        const picBlob = await picRes.blob();
        setPicUrl(URL.createObjectURL(picBlob));
      }
    } catch (err) {
      console.error('[Master Profile Fetch Error]', err);
      setMessage({ type: 'error', text: 'Failed to fetch profile data.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfileData();
  }, [apiBaseUrl]);

  const handleChange = e => {
    setProfile(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handlePicUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setLoading(true);
    setMessage({ type: '', text: '' });

    const formData = new FormData();
    formData.append('profile_pic', file);

    try {
      const res = await fetch(`${apiBaseUrl}/api/master/upload-profile-pic`, {
        method: 'POST',
        credentials: 'include',
        body: formData
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setPicUrl(URL.createObjectURL(file));
        setMessage({ type: 'success', text: 'Picture uploaded successfully!' });
      } else {
        setMessage({ type: 'error', text: data.msg || 'Upload failed.' });
      }
    } catch (err) {
      console.error(err);
      setMessage({ type: 'error', text: 'Error uploading picture.' });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      const res = await fetch(`${apiBaseUrl}/api/master/update-master-profile`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ address: profile.address })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setMessage({ type: 'success', text: 'Profile updated successfully!' });
      } else {
        setMessage({ type: 'error', text: data.msg || 'Update failed.' });
      }
    } catch (err) {
      console.error('[Update Master Profile Error]', err);
      setMessage({ type: 'error', text: 'Error updating profile.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <h2>Master Profile Settings</h2>
      <div className={styles.profileCard}>
        <img
          src={picUrl}
          alt="Profile"
          onClick={() => fileInputRef.current.click()}
          className={styles.profilePic}
        />
        <input
          type="file"
          accept="image/*"
          id="profile_pic"
          ref={fileInputRef}
          className={styles.hiddenInput}
          onChange={handlePicUpload}
          disabled={loading}
        />
        <button
          onClick={() => fileInputRef.current.click()}
          className={styles.uploadBtn}
          disabled={loading}
        >
          {loading ? 'Uploading…' : 'Upload New Picture'}
        </button>
      </div>

      <form className={styles.form} onSubmit={handleSubmit}>
        <label>Name</label>
        <input name="name" value={profile.name} readOnly />

        <label>Phone</label>
        <input name="phone" value={profile.phone} readOnly />

        <label>Email</label>
        <input name="email" value={profile.email} readOnly />

        <label>Address</label>
        <textarea name="address" value={profile.address} onChange={handleChange} disabled={loading} />

        <button type="submit" className={styles.submitBtn} disabled={loading}>
          {loading ? 'Saving…' : 'Save Changes'}
        </button>
      </form>
      {message.text && (
        <div className={`${styles.message} ${message.type === 'error' ? styles.error : styles.success}`}>
          {message.text}
        </div>
      )}
    </div>
  );
};

export default MasterProfileSettings;
