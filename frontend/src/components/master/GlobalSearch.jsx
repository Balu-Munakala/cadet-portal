import React, { useState } from 'react';
import styles from './GlobalSearch.module.css';

export default function GlobalSearch({ apiBaseUrl }) {
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
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setAdmins(data.admins);
      setUsers(data.users);
    } catch (err) {
      console.error('[GlobalSearch] ', err);
      setError('Search failed.');
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
          placeholder="Search admins or cadets by name, email, ID..."
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
            <h3>Admins</h3>
            {admins.length === 0 ? (
              <p>No admins found.</p>
            ) : (
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>ANO ID</th>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Role</th>
                    <th>Approved</th>
                  </tr>
                </thead>
                <tbody>
                  {admins.map((a) => (
                    <tr key={a.id}>
                      <td>{a.ano_id}</td>
                      <td>{a.name}</td>
                      <td>{a.email}</td>
                      <td>{a.role}</td>
                      <td>{a.is_approved ? 'Yes' : 'No'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          <div className={styles.section}>
            <h3>Cadets</h3>
            {users.length === 0 ? (
              <p>No cadets found.</p>
            ) : (
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Regimental No.</th>
                    <th>Name</th>
                    <th>Email</th>
                    <th>ANO ID</th>
                    <th>Approved</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => (
                    <tr key={u.id}>
                      <td>{u.regimental_number}</td>
                      <td>{u.name}</td>
                      <td>{u.email}</td>
                      <td>{u.ano_id}</td>
                      <td>{u.is_approved ? 'Yes' : 'No'}</td>
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
