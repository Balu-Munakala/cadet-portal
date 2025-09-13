import React, { useEffect, useState } from 'react';
import styles from './PlatformConfig.module.css';

export default function PlatformConfig({ apiBaseUrl = process.env.REACT_APP_API_URL}) {
  const [config, setConfig] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [updates, setUpdates] = useState([]);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  const fetchConfig = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${apiBaseUrl}/api/master/config`, { 
        credentials: 'include' 
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setConfig(data);
      // Initialize `updates` with the same shape
      setUpdates(data.map(({ config_key, config_value }) => ({
        key: config_key,
        value: config_value
      })));
    } catch (err) {
      console.error('[PlatformConfig] ', err);
      setError('Failed to load config.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConfig();
  }, [apiBaseUrl]);

  const handleChange = (index, newValue) => {
    setUpdates((prev) => {
      const copy = [...prev];
      copy[index].value = newValue;
      return copy;
    });
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage('');
    try {
      const res = await fetch(`${apiBaseUrl}/api/master/config`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(updates),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.msg || `HTTP ${res.status}`);
      setMessage('Configuration saved.');
      fetchConfig();
    } catch (err) {
      console.error('[PlatformConfig Save] ', err);
      setMessage('Save failed.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className={styles.loading}>Loading…</div>;
  if (error) return <div className={styles.error}>{error}</div>;

  return (
    <div className={styles.container}>
      <h2>Platform Configuration</h2>
      <table className={styles.table}>
        <thead>
          <tr>
            <th>Key</th>
            <th>Value</th>
          </tr>
        </thead>
        <tbody>
          {config.map((c, idx) => (
            <tr key={c.config_key}>
              <td>{c.config_key}</td>
              <td>
                <input
                  type="text"
                  value={updates[idx]?.value || ''}
                  onChange={(e) => handleChange(idx, e.target.value)}
                  className={styles.input}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <button onClick={handleSave} disabled={saving} className={styles.saveBtn}>
        {saving ? 'Saving…' : 'Save Changes'}
      </button>
      {message && <p className={styles.message}>{message}</p>}
    </div>
  );
}
