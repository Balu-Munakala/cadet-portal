import React, { useEffect, useState } from 'react';
import styles from './FallinDetailsSection.module.css';

const UserFallinDetailsSection = ({ apiBaseUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000'}) => {
  const [fallinDetails, setFallinDetails] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const fetchFallinDetails = async () => {
    setLoading(true);
    setMessage('');
    try {
      const response = await fetch(`${apiBaseUrl}/api/fallin/userfallin`, {
        credentials: 'include'
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setFallinDetails(data);
    } catch (error) {
      console.error('[Fetch User Fallin Error]', error);
      setMessage('An error occurred while fetching fallin details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFallinDetails();
  }, [apiBaseUrl]);

  return (
    <div className={styles.container}>
      <h2>Fallin Details (Cadet View)</h2>
      {message && <div className={styles.message}>{message}</div>}

      {loading ? (
        <p>Loading...</p>
      ) : (
        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Date</th>
                <th>Time</th>
                <th>Location</th>
                <th>Dress Code</th>
                <th>Instructions</th>
                <th>Activity Details</th>
              </tr>
            </thead>
            <tbody>
              {fallinDetails.length > 0 ? (
                fallinDetails.map((fallin, idx) => (
                  <tr key={idx}>
                    <td>{new Date(fallin.date).toLocaleDateString()}</td>
                    <td>{fallin.time}</td>
                    <td>{fallin.location}</td>
                    <td>{fallin.dress_code}</td>
                    <td>{fallin.instructions}</td>
                    <td>{fallin.activity_details}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className={styles.noData}>
                    No fallins available.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      <button className={styles.refreshBtn} onClick={fetchFallinDetails} disabled={loading}>
        Refresh
      </button>
    </div>
  );
};

export default UserFallinDetailsSection;