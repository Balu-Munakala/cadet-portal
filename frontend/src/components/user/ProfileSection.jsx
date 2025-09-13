import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './ProfileSection.module.css';

const ProfileSection = ({ apiBaseUrl = process.env.REACT_APP_API_URL}) => {
  const [formData, setFormData] = useState({});
  const [profilePic, setProfilePic] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [message, setMessage] = useState({ type: '', text: '' });

  const navigate = useNavigate();

  const fetchProfileData = async () => {
    try {
      const res = await fetch(`${apiBaseUrl}/api/users/profile`, { 
        credentials: 'include' 
      });
      const data = await res.json();
      if (res.ok) {
        setFormData(data);
      } else {
        setMessage({ type: 'error', text: 'Failed to fetch profile data.' });
      }
    } catch (err) {
      console.error(err);
      setMessage({ type: 'error', text: 'Error fetching profile data.' });
    }
  };

  const fetchProfilePicture = async () => {
    try {
      const res = await fetch(`${apiBaseUrl}/api/users/profile-pic`, { 
        credentials: 'include' 
      });
      const blob = await res.blob();
      setProfilePic(URL.createObjectURL(blob));
    } catch (err) {
      console.error('Error fetching profile picture:', err);
      // Fallback to a local default image if the fetch fails
      setProfilePic('/default-photo.jpg');
    }
  };

  useEffect(() => {
    fetchProfileData();
    fetchProfilePicture();
  }, [apiBaseUrl]);

  const handleInputChange = e => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setMessage({ type: '', text: '' });
  };

  const handleProfilePicChange = e => {
    const file = e.target.files[0];
    setSelectedFile(file);
    if (file) {
      setProfilePic(URL.createObjectURL(file));
    }
  };

  const uploadProfilePic = async () => {
    if (!selectedFile) return;
    const picData = new FormData();
    picData.append('profile_pic', selectedFile);

    try {
      const res = await fetch(`${apiBaseUrl}/api/users/upload-profile-pic`, {
        method: 'POST',
        body: picData,
        credentials: 'include'
      });
      const result = await res.json();
      if (!result.success) {
        setMessage({ type: 'error', text: 'Failed to upload picture' });
        return false;
      }
      return true;
    } catch (err) {
      console.error(err);
      setMessage({ type: 'error', text: 'Error uploading picture' });
      return false;
    }
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setMessage({ type: '', text: '' });

    try {
      // First, upload the new profile picture if a file was selected
      let picUploadSuccess = true;
      if (selectedFile) {
        picUploadSuccess = await uploadProfilePic();
      }

      // Then, update the rest of the profile data
      if (picUploadSuccess) {
        const res = await fetch(`${apiBaseUrl}/api/users/update-profile`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify(formData)
        });
        const data = await res.json();
        if (data.success) {
          setMessage({ type: 'success', text: 'Profile updated successfully!' });
          // Refresh profile data after successful update
          fetchProfileData();
        } else {
          setMessage({ type: 'error', text: data.msg || 'Failed to update profile.' });
        }
      }
    } catch (err) {
      console.error(err);
      setMessage({ type: 'error', text: 'Error updating profile.' });
    }
  };

  const updateYearClassOptions = () => {
    const options = {
      school: ['8', '9', '10'],
      intermediate: ['11', '12'],
      ug: ['1', '2', '3', '4', '5'],
      pg: ['1', '2']
    };
    return options[formData.studying] || [];
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
      <h2>Cadet Profile</h2>
      <form onSubmit={handleSubmit}>
        <div className={styles.pictureSection}>
          <img src={profilePic || '/default-photo.jpg'} alt="Profile" />
          <label htmlFor="profile_pic">Change Profile Photo</label>
          <input
            type="file"
            accept="image/*"
            id="profile_pic"
            onChange={handleProfilePicChange}
          />
        </div>

        <div className={styles.section}>
          <h3>Personal Details</h3>
          <label>Name</label>
          <input name="name" value={formData.name || ''} readOnly />

          <label>Date of Birth</label>
          <input type="date" name="dob" value={formData.dob ? formData.dob.slice(0, 10) : ''} onChange={handleInputChange} />

          <label>Age</label>
          <input value={calculateAge(formData.dob)} readOnly />

          <label>Phone</label>
          <input name="contact" value={formData.contact || ''} readOnly />

          <label>Mother's Name</label>
          <input name="mother_name" value={formData.mother_name || ''} onChange={handleInputChange} />

          <label>Father's Name</label>
          <input name="father_name" value={formData.father_name || ''} onChange={handleInputChange} />

          <label>Parent Phone</label>
          <input name="parent_phone" value={formData.parent_phone || ''} onChange={handleInputChange} />

          <label>Parent Email</label>
          <input name="parent_email" value={formData.parent_email || ''} onChange={handleInputChange} />

          <label>Address</label>
          <input name="address" value={formData.address || ''} onChange={handleInputChange} />
        </div>

        <div className={styles.section}>
          <h3>Cadet Info</h3>
          <label>Regimental Number</label>
          <input name="regimental_number" value={formData.regimental_number || ''} readOnly />

          <label>Wing</label>
          <select name="wing" value={formData.wing || ''} onChange={handleInputChange}>
            <option value="army">Army</option>
            <option value="navy">Navy</option>
            <option value="air-force">Air Force</option>
          </select>

          <label>Category</label>
          <select name="category" value={formData.category || ''} onChange={handleInputChange}>
            <option value="SD">SD</option>
            <option value="SW">SW</option>
            <option value="JD">JD</option>
            <option value="JW">JW</option>
          </select>

          <label>ANO Name</label>
          <input name="ano_name" value={formData.ano_name || ''} readOnly />

          <label>Type</label>
          <input name="type" value={formData.type ? formData.type.toUpperCase() : ''} readOnly />

          <label>Current Year</label>
          <select name="current_year" value={formData.current_year || ''} onChange={handleInputChange}>
            <option value="A1">A1</option>
            <option value="A2">A2</option>
            <option value="B1">B1</option>
            <option value="B2">B2</option>
            <option value="C">C</option>
          </select>
        </div>

        <div className={styles.section}>
          <h3>Institution Info</h3>
          <label>Institution Name</label>
          <input name="institution_name" value={formData.institution_name || ''} onChange={handleInputChange} />

          <label>Studying</label>
          <select name="studying" value={formData.studying || ''} onChange={handleInputChange}>
            <option value="school">School</option>
            <option value="intermediate">Intermediate</option>
            <option value="ug">Undergraduate</option>
            <option value="pg">Postgraduate</option>
          </select>

          <label>Year/Class</label>
          <select name="year_class" value={formData.year_class || ''} onChange={handleInputChange}>
            {updateYearClassOptions().map(opt => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
        </div>

        <button type="submit" className={styles.submitBtn}>Update Profile</button>
      </form>
      {message.text && (
        <div className={`${styles.message} ${message.type === 'error' ? styles.error : styles.success}`}>
          {message.text}
        </div>
      )}
    </div>
  );
};

export default ProfileSection;
