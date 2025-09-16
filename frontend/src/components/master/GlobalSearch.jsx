import React, { useState } from 'react';
import styles from './GlobalSearch.module.css';

export default function GlobalSearch({ apiBaseUrl = process.env.REACT_APP_API_URL }) {
  const [query, setQuery] = useState('');
  const [admins, setAdmins] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${apiBaseUrl}/api/master/global-search?q=${encodeURIComponent(query)}`, {
        credentials: 'include',
      });
      
      if (!res.ok) {
        if (res.status === 403) {
          throw new Error('Access denied. Only master can perform global search.');
        } else if (res.status === 400) {
          throw new Error('Search query is required.');
        } else {
          throw new Error(`Search failed with status: ${res.status}`);
        }
      }
      
      const data = await res.json();
      setAdmins(data.admins || []);
      setUsers(data.users || []);
    } catch (err) {
      console.error('[GlobalSearch] ', err);
      setError(err.message || 'Search failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <h2>Global Search</h2>
      <form className={styles.form} onSubmit={handleSearch}>
        <input
          type="text"
          placeholder="Search admins or cadets by name, email, ID, contact..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className={styles.input}
        />
        <button type="submit" className={styles.button} disabled={loading}>
          {loading ? 'Searching…' : 'Search'}
        </button>
      </form>

      {error && <div className={styles.error}>{error}</div>}

      {!loading && (
        <>
          <div className={styles.section}>
            <h3>Admins ({admins.length})</h3>
            {admins.length === 0 ? (
              <p>No admins found.</p>
            ) : (
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>ANO ID</th>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Contact</th>
                    <th>Role</th>
                    <th>Approved</th>
                  </tr>
                </thead>
                <tbody>
                  {admins.map((admin) => (
                    <tr key={admin.id}>
                      <td>{admin.ano_id}</td>
                      <td>{admin.name}</td>
                      <td>{admin.email}</td>
                      <td>{admin.contact}</td>
                      <td>{admin.role || 'ANO'}</td>
                      <td>{admin.is_approved ? 'Yes' : 'No'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          <div className={styles.section}>
            <h3>Cadets ({users.length})</h3>
            {users.length === 0 ? (
              <p>No cadets found.</p>
            ) : (
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Regimental No.</th>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Contact</th>
                    <th>ANO ID</th>
                    <th>Approved</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr key={user.id}>
                      <td>{user.regimental_number}</td>
                      <td>{user.name}</td>
                      <td>{user.email}</td>
                      <td>{user.contact}</td>
                      <td>{user.ano_id || 'N/A'}</td>
                      <td>{user.is_approved ? 'Yes' : 'No'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </>
      )}
    </div>
  );
}