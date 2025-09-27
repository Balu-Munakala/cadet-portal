import React, { useState, useEffect, useRef } from 'react';
import styles from './ProfileSection.module.css';

export default function ProfileSection({ apiBaseUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000'}) {
  const [profile, setProfile] = useState({});
  const [picUrl, setPicUrl] = useState('/default.jpg');
  const fileInput = useRef(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    const fetchProfileData = async () => {
      setLoading(true);
      try {
        const [profileRes, picRes] = await Promise.all([
          fetch(`${apiBaseUrl}/api/admin/profile`, { credentials: 'include' }),
          fetch(`${apiBaseUrl}/api/admin/profile-pic`, { credentials: 'include' })
        ]);

        if (!profileRes.ok) throw new Error('Unauthorized');
        const profileData = await profileRes.json();
        setProfile({
          name: profileData.name || '',
          dob: profileData.dob ? profileData.dob.slice(0, 10) : '',
          contact: profileData.contact || '',
          email: profileData.email || '',
          address: profileData.address || '',
          ano_id: profileData.ano_id || '',
          role: profileData.role || 'ANO',
          unit_name: profileData.unit_name || '',
          institution_name: profileData.institution_name || '',
          type: profileData.type || 'FSFS'
        });

        if (picRes.ok) {
          const picData = await picRes.json();
          if (picData.success && picData.profile_pic_base64) {
            setPicUrl(picData.profile_pic_base64);
          } else {
            setPicUrl('/default.jpg');
          }
        } else {
          setPicUrl('/default.jpg');
        }
      } catch (err) {
        console.error('[Admin Profile Fetch Error]', err);
        setMessage({ type: 'error', text: 'Failed to fetch profile data.' });
      } finally {
        setLoading(false);
      }
    };

    fetchProfileData();
  }, [apiBaseUrl]);

  const handleChange = e => {
    const { name, value } = e.target;
    setProfile(prev => ({ ...prev, [name]: value }));
  };

  const handleFileUpload = async e => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file size (2MB limit)
    if (file.size > 2 * 1024 * 1024) {
      setMessage({ type: 'error', text: 'Profile picture must be less than 2MB' });
      return;
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setMessage({ type: 'error', text: 'Please select a valid image file' });
      return;
    }

    setLoading(true);
    setMessage({ type: '', text: '' });

    // Convert to Base64
    const reader = new FileReader();
    reader.onload = async (event) => {
      const base64String = event.target.result;
      
      try {
        const res = await fetch(`${apiBaseUrl}/api/admin/upload-profile-pic`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            profilePicBase64: base64String
          }),
          credentials: 'include'
        });
        const data = await res.json();
        if (res.ok && data.success) {
          setPicUrl(base64String);
          setMessage({ type: 'success', text: 'Picture uploaded successfully!' });
        } else {
          setMessage({ type: 'error', text: data.msg || 'Upload failed.' });
        }
      } catch (err) {
        console.error('[Upload Profile Pic Error]', err);
        setMessage({ type: 'error', text: 'Error uploading picture.' });
      } finally {
        setLoading(false);
      }
    };
    
    reader.onerror = () => {
      setMessage({ type: 'error', text: 'Error reading file' });
      setLoading(false);
    };
    
    reader.readAsDataURL(file);
  };

  const handleSubmit = e => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: '', text: '' });

    const payload = {
      dob: profile.dob,
      address: profile.address,
      role: profile.role,
      unit_name: profile.unit_name,
      institution_name: profile.institution_name,
      type: profile.type
    };

    fetch(`${apiBaseUrl}/api/admin/update-admin-profile`, {
      method: 'PUT',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })
      .then(r => r.json())
      .then(data => {
        if (data.success) {
          setMessage({ type: 'success', text: 'Profile updated successfully!' });
        } else {
          setMessage({ type: 'error', text: data.msg || 'Update failed.' });
        }
      })
      .catch(err => {
        console.error('[Update Profile Error]', err);
        setMessage({ type: 'error', text: 'Error updating profile.' });
      })
      .finally(() => {
        setLoading(false);
      });
  };

  const calculateAge = (dob) => {
    if (!dob) return '';
    const birthDate = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  return (
    <div className={styles.container}>
      <h2>Admin Profile Settings</h2>
      <div className={styles.profileCard}>
        <img
          src={picUrl}
          alt="Profile"
          onClick={() => fileInput.current.click()}
          className={styles.profilePic}
          onError={(e) => { e.target.onerror = null; e.target.src = '/default.jpg'; }}
        />
        <input
          ref={fileInput}
          type="file"
          accept="image/*"
          className={styles.hiddenInput}
          onChange={handleFileUpload}
          disabled={loading}
        />
        <button
          type="button"
          onClick={() => fileInput.current.click()}
          className={styles.uploadBtn}
          disabled={loading}
        >
          {loading ? 'Uploading…' : 'Upload New Picture'}
        </button>
      </div>

      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.grid}>
          <div className={styles.formGroup}>
            <label className={styles.label}>Full Name</label>
            <input name="name" value={profile.name} readOnly className={styles.input} />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>Date of Birth</label>
            <input
              type="date"
              name="dob"
              value={profile.dob}
              onChange={handleChange}
              className={styles.input}
            />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>Phone Number</label>
            <input name="contact" value={profile.contact} readOnly className={styles.input} />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>Email Address</label>
            <input name="email" value={profile.email} readOnly className={styles.input} />
          </div>

          <div className={`${styles.formGroup} ${styles['md:col-span-2']}`}>
            <label className={styles.label}>Address</label>
            <textarea
              name="address"
              rows="3"
              value={profile.address}
              onChange={handleChange}
              className={styles.textarea}
            />
          </div>
        </div>

        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>Service Information</h2>
          <div className={styles.grid}>
            <div className={styles.formGroup}>
              <label className={styles.label}>ANO ID</label>
              <input name="ano_id" value={profile.ano_id} readOnly className={styles.input} />
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>Role</label>
              <select name="role" value={profile.role} onChange={handleChange} className={styles.select}>
                <option value="ANO">ANO</option>
                <option value="GCI">GCI</option>
                <option value="CTO">CTO</option>
              </select>
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>Type</label>
              <input name="type" value={profile.type} readOnly className={styles.input} />
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>Unit Name</label>
              <input name="unit_name" value={profile.unit_name} onChange={handleChange} className={styles.input} />
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>Institution Name</label>
              <input name="institution_name" value={profile.institution_name} onChange={handleChange} className={styles.input} />
            </div>
          </div>
        </div>

        <button type="submit" className={styles.submitButton}>
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
