import React, { useState, useEffect, useCallback } from 'react';
import styles from './MasterNominalRollGenerator.module.css';

const MasterNominalRollGenerator = ({ apiBaseUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000' }) => {
  const [users, setUsers] = useState([]);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [selectAll, setSelectAll] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [nominalHeading, setNominalHeading] = useState('MASTER NOMINAL ROLL');
  const [filters, setFilters] = useState({
    wing: '',
    category: '',
    currentYear: '',
    role: '',
    adminFilter: ''
  });
  const [searchTerm, setSearchTerm] = useState('');

  // Fetch all users from users table
  const fetchUsers = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`${apiBaseUrl}/api/master/all-users`, {
        credentials: 'include'
      });
      const data = await response.json();
      
      if (data.success) {
        setUsers(data.users);
        setMessage({ type: 'success', text: `Found ${data.total} users in the system` });
      } else {
        setMessage({ type: 'error', text: data.msg || 'Failed to fetch users' });
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      setMessage({ type: 'error', text: 'Error fetching users data' });
    } finally {
      setIsLoading(false);
    }
  }, [apiBaseUrl]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // Handle individual user selection
  const handleUserSelection = (userId) => {
    setSelectedUsers(prev => {
      if (prev.includes(userId)) {
        return prev.filter(id => id !== userId);
      } else {
        return [...prev, userId];
      }
    });
  };

  // Handle select all toggle
  const handleSelectAll = () => {
    const filteredUsers = getFilteredUsers();
    if (selectAll) {
      setSelectedUsers([]);
      setSelectAll(false);
    } else {
      setSelectedUsers(filteredUsers.map(user => user.id));
      setSelectAll(true);
    }
  };

  // Filter users based on current filters and search term
  const getFilteredUsers = useCallback(() => {
    return users.filter(user => {
      if (filters.wing && user.wing !== filters.wing) return false;
      if (filters.category && user.category !== filters.category) return false;
      if (filters.currentYear && user.current_year !== filters.currentYear) return false;
      if (filters.role && user.role !== filters.role) return false;
      if (filters.adminFilter && user.ano_id !== filters.adminFilter) return false;
      
      // Search functionality - search in name, regimental_number, email, and ano_id
      const searchMatch = !searchTerm || 
        user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.regimental_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.ano_id?.toLowerCase().includes(searchTerm.toLowerCase());
      
      return searchMatch;
    });
  }, [users, filters, searchTerm]);

  // Update select all state when filtered users change
  useEffect(() => {
    const filteredUsers = getFilteredUsers();
    const allSelected = filteredUsers.length > 0 && filteredUsers.every(user => selectedUsers.includes(user.id));
    setSelectAll(allSelected);
  }, [selectedUsers, getFilteredUsers]);

  // Generate nominal roll
  const generateNominalRoll = async () => {
    if (selectedUsers.length === 0) {
      setMessage({ type: 'error', text: 'Please select at least one user' });
      return;
    }

    if (!nominalHeading.trim()) {
      setMessage({ type: 'error', text: 'Please enter a heading for the nominal roll' });
      return;
    }

    setIsGenerating(true);
    try {
      const response = await fetch(`${apiBaseUrl}/api/master/generate-nominal-roll`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({
          selectedUsers: selectedUsers,
          heading: nominalHeading.trim()
        })
      });

      if (response.ok) {
        // Handle file download
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        
        // Extract filename from response headers
        const contentDisposition = response.headers.get('Content-Disposition');
        const filename = contentDisposition 
          ? contentDisposition.split('filename=')[1]?.replace(/"/g, '')
          : `Master_Nominal_Roll_${new Date().toISOString().split('T')[0]}.xlsx`;
        
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
        
        setMessage({ type: 'success', text: 'Nominal roll generated successfully!' });
      } else {
        const errorData = await response.json();
        setMessage({ type: 'error', text: errorData.msg || 'Failed to generate nominal roll' });
      }
    } catch (error) {
      console.error('Error generating nominal roll:', error);
      setMessage({ type: 'error', text: 'Error generating nominal roll' });
    } finally {
      setIsGenerating(false);
    }
  };

  const filteredUsers = getFilteredUsers();

  // Get unique admin IDs for admin filter
  const uniqueAdmins = [...new Set(users.map(user => user.ano_id).filter(Boolean))];

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2>🎖️ Master Nominal Roll Generator</h2>
        <p>Generate nominal rolls for all users in the system</p>
      </div>

      {/* Search Bar */}
      <div className={styles.searchSection}>
        <h3>Search Users</h3>
        <div className={styles.searchContainer}>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Escape') {
                setSearchTerm('');
              }
            }}
            placeholder="Search by name, regimental number, email, or admin ID..."
            className={styles.searchInput}
          />
          {searchTerm && (
            <button
              type="button"
              onClick={() => setSearchTerm('')}
              className={styles.clearSearchBtn}
              title="Clear search"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className={styles.filters}>
        <h3>Filter Users</h3>
        <div className={styles.filterRow}>
          <select 
            value={filters.wing} 
            onChange={(e) => setFilters(prev => ({ ...prev, wing: e.target.value }))}
          >
            <option value="">All Wings</option>
            <option value="army">Army</option>
            <option value="navy">Navy</option>
            <option value="air-force">Air Force</option>
          </select>

          <select 
            value={filters.category} 
            onChange={(e) => setFilters(prev => ({ ...prev, category: e.target.value }))}
          >
            <option value="">All Categories</option>
            <option value="SD">SD</option>
            <option value="SW">SW</option>
            <option value="JD">JD</option>
            <option value="JW">JW</option>
          </select>

          <select 
            value={filters.currentYear} 
            onChange={(e) => setFilters(prev => ({ ...prev, currentYear: e.target.value }))}
          >
            <option value="">All Years</option>
            <option value="A1">A1</option>
            <option value="A2">A2</option>
            <option value="B1">B1</option>
            <option value="B2">B2</option>
            <option value="C">C</option>
          </select>

          <select 
            value={filters.role} 
            onChange={(e) => setFilters(prev => ({ ...prev, role: e.target.value }))}
          >
            <option value="">All Roles</option>
            <option value="user">Cadet</option>
            <option value="admin">Admin</option>
            <option value="master">Master</option>
          </select>

          <select 
            value={filters.adminFilter} 
            onChange={(e) => setFilters(prev => ({ ...prev, adminFilter: e.target.value }))}
          >
            <option value="">All Admins</option>
            {uniqueAdmins.map(adminId => (
              <option key={adminId} value={adminId}>{adminId}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Nominal Roll Heading */}
      <div className={styles.headingSection}>
        <h3>Nominal Roll Heading</h3>
        <input
          type="text"
          value={nominalHeading}
          onChange={(e) => setNominalHeading(e.target.value)}
          placeholder="Enter heading for the nominal roll (e.g., 'MASTER NOMINAL ROLL - ALL CADETS 2025')"
          className={styles.headingInput}
          maxLength={100}
        />
        <small className={styles.headingHint}>
          This heading will appear at the top of the Excel file above all column headers
        </small>
      </div>

      {/* Selection Controls */}
      <div className={styles.controls}>
        <div className={styles.selectionInfo}>
          <span>{selectedUsers.length} of {filteredUsers.length} users selected</span>
          {searchTerm && (
            <span className={styles.searchStatus}>
              📝 Search: "{searchTerm}" ({filteredUsers.length} results)
            </span>
          )}
        </div>
        
        <div className={styles.actionButtons}>
          <label className={styles.selectAllLabel}>
            <input
              type="checkbox"
              checked={selectAll}
              onChange={handleSelectAll}
              disabled={isLoading || filteredUsers.length === 0}
            />
            Select All Filtered
          </label>
          
          <button
            className={styles.generateBtn}
            onClick={generateNominalRoll}
            disabled={isLoading || isGenerating || selectedUsers.length === 0}
          >
            {isGenerating ? '📄 Generating...' : '📄 Generate Excel'}
          </button>
        </div>
      </div>

      {/* Message Display */}
      {message.text && (
        <div className={`${styles.message} ${styles[message.type]}`}>
          {message.text}
        </div>
      )}

      {/* Users List */}
      <div className={styles.usersList}>
        <div className={styles.usersHeader}>
          <h3>Users ({filteredUsers.length})</h3>
          {selectedUsers.length > 0 && (
            <span className={styles.selectedCount}>
              {selectedUsers.length} selected
            </span>
          )}
        </div>

        {isLoading ? (
          <div className={styles.loading}>Loading users...</div>
        ) : filteredUsers.length === 0 ? (
          <div className={styles.noUsers}>No users found matching the current filters</div>
        ) : (
          <div className={styles.usersGrid}>
            {filteredUsers.map(user => (
              <div 
                key={user.id} 
                className={`${styles.userCard} ${selectedUsers.includes(user.id) ? styles.selected : ''}`}
                onClick={() => handleUserSelection(user.id)}
              >
                <div className={styles.userInfo}>
                  <div className={styles.userName}>{user.name || 'N/A'}</div>
                  <div className={styles.userDetails}>
                    <div className={styles.userDetail}>
                      <strong>Role:</strong>
                      <span className={`${styles.roleBadge} ${styles[user.role]}`}>
                        {user.role?.toUpperCase() || 'N/A'}
                      </span>
                    </div>
                    <div className={styles.userDetail}>
                      <strong>Reg:</strong>
                      <span>{user.regimental_number || 'N/A'}</span>
                    </div>
                    <div className={styles.userDetail}>
                      <strong>Admin:</strong>
                      <span>{user.ano_id || 'N/A'}</span>
                    </div>
                    <div className={styles.userDetail}>
                      <strong>Email:</strong>
                      <span>{user.email || 'N/A'}</span>
                    </div>
                    <div className={styles.userDetail}>
                      <strong>Mobile:</strong>
                      <span>{user.contact || 'N/A'}</span>
                    </div>
                  </div>
                  <div className={styles.userMeta}>
                    {user.wing && (
                      <span className={styles.wingBadge}>
                        {user.wing.toUpperCase()}
                      </span>
                    )}
                    {user.category && (
                      <span className={styles.categoryBadge}>
                        {user.category}
                      </span>
                    )}
                    {user.current_year && (
                      <span className={styles.yearBadge}>
                        {user.current_year}
                      </span>
                    )}
                  </div>
                </div>
                <div className={styles.checkbox}>
                  <input
                    type="checkbox"
                    checked={selectedUsers.includes(user.id)}
                    onChange={() => handleUserSelection(user.id)}
                    onClick={(e) => e.stopPropagation()}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default MasterNominalRollGenerator;