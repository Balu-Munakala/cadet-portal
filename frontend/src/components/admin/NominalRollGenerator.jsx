import React, { useState, useEffect, useCallback } from 'react';
import styles from './NominalRollGenerator.module.css';

const NominalRollGenerator = ({ apiBaseUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000' }) => {
  const [cadets, setCadets] = useState([]);
  const [selectedCadets, setSelectedCadets] = useState([]);
  const [selectAll, setSelectAll] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [nominalHeading, setNominalHeading] = useState('NOMINAL ROLL');
  const [filters, setFilters] = useState({
    wing: '',
    category: '',
    currentYear: ''
  });
  const [searchTerm, setSearchTerm] = useState('');

  // Fetch cadets under admin
  const fetchCadets = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`${apiBaseUrl}/api/admin/cadets`, {
        credentials: 'include'
      });
      const data = await response.json();
      
      if (data.success) {
        setCadets(data.cadets);
        setMessage({ type: 'success', text: `Found ${data.total} cadets under your command` });
      } else {
        setMessage({ type: 'error', text: data.msg || 'Failed to fetch cadets' });
      }
    } catch (error) {
      console.error('Error fetching cadets:', error);
      setMessage({ type: 'error', text: 'Error fetching cadets data' });
    } finally {
      setIsLoading(false);
    }
  }, [apiBaseUrl]);

  useEffect(() => {
    fetchCadets();
  }, [fetchCadets]);

  // Handle individual cadet selection
  const handleCadetSelection = (cadetId) => {
    setSelectedCadets(prev => {
      if (prev.includes(cadetId)) {
        return prev.filter(id => id !== cadetId);
      } else {
        return [...prev, cadetId];
      }
    });
  };

  // Handle select all toggle
  const handleSelectAll = () => {
    if (selectAll) {
      setSelectedCadets([]);
    } else {
      const filteredCadets = getFilteredCadets();
      setSelectedCadets(filteredCadets.map(cadet => cadet.id));
    }
    setSelectAll(!selectAll);
  };

  // Filter cadets based on criteria and search term
  const getFilteredCadets = () => {
    return cadets.filter(cadet => {
      const wingMatch = !filters.wing || cadet.wing === filters.wing;
      const categoryMatch = !filters.category || cadet.category === filters.category;
      const yearMatch = !filters.currentYear || cadet.current_year === filters.currentYear;
      
      // Search functionality - search in name, regimental_number, and email
      const searchMatch = !searchTerm || 
        cadet.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        cadet.regimental_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        cadet.email?.toLowerCase().includes(searchTerm.toLowerCase());
      
      return wingMatch && categoryMatch && yearMatch && searchMatch;
    });
  };

  // Generate nominal roll
  const generateNominalRoll = async () => {
    if (selectedCadets.length === 0) {
      setMessage({ type: 'error', text: 'Please select at least one cadet' });
      return;
    }

    if (!nominalHeading.trim()) {
      setMessage({ type: 'error', text: 'Please enter a heading for the nominal roll' });
      return;
    }

    setIsGenerating(true);
    try {
      const response = await fetch(`${apiBaseUrl}/api/admin/generate-nominal-roll`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({
          selectedCadets: selectedCadets,
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
          ? contentDisposition.split('filename=')[1].replace(/"/g, '')
          : `Nominal_Roll_${new Date().toISOString().split('T')[0]}.xlsx`;
        
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);

        setMessage({ type: 'success', text: `Nominal roll generated successfully for ${selectedCadets.length} cadets` });
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

  const filteredCadets = getFilteredCadets();

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2>🎖️ Generate Nominal Roll</h2>
        <p>Select cadets to include in the nominal roll Excel file</p>
      </div>

      {/* Search Bar */}
      <div className={styles.searchSection}>
        <h3>Search Cadets</h3>
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
            placeholder="Search by name, regimental number, or email..."
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
        <h3>Filter Cadets</h3>
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
        </div>
      </div>

      {/* Nominal Roll Heading */}
      <div className={styles.headingSection}>
        <h3>Nominal Roll Heading</h3>
        <input
          type="text"
          value={nominalHeading}
          onChange={(e) => setNominalHeading(e.target.value)}
          placeholder="Enter heading for the nominal roll (e.g., '1st KARNATAKA BATTALION NCC NOMINAL ROLL')"
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
          <span>{selectedCadets.length} of {filteredCadets.length} cadets selected</span>
          {searchTerm && (
            <span className={styles.searchStatus}>
              📝 Search: "{searchTerm}" ({filteredCadets.length} results)
            </span>
          )}
        </div>
        
        <div className={styles.actionButtons}>
          <label className={styles.selectAllLabel}>
            <input
              type="checkbox"
              checked={selectAll}
              onChange={handleSelectAll}
              disabled={isLoading || filteredCadets.length === 0}
            />
            Select All Filtered
          </label>
          
          <button
            onClick={generateNominalRoll}
            disabled={selectedCadets.length === 0 || isGenerating}
            className={styles.generateBtn}
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

      {/* Cadets List */}
      <div className={styles.cadetsList}>
        <div className={styles.cadetsHeader}>
          <h3>Cadets ({filteredCadets.length})</h3>
          {selectedCadets.length > 0 && (
            <span className={styles.selectedCount}>
              {selectedCadets.length} selected
            </span>
          )}
        </div>

        {isLoading ? (
          <div className={styles.loading}>Loading cadets...</div>
        ) : filteredCadets.length === 0 ? (
          <div className={styles.noCadets}>No cadets found matching the current filters</div>
        ) : (
          <div className={styles.cadetsGrid}>
            {filteredCadets.map(cadet => (
              <div 
                key={cadet.id} 
                className={`${styles.cadetCard} ${selectedCadets.includes(cadet.id) ? styles.selected : ''}`}
                onClick={() => handleCadetSelection(cadet.id)}
              >
                <div className={styles.cadetInfo}>
                  <div className={styles.cadetName}>{cadet.name || 'N/A'}</div>
                  <div className={styles.cadetDetails}>
                    <div className={styles.cadetDetail}>
                      <strong>Reg:</strong>
                      <span>{cadet.regimental_number || 'N/A'}</span>
                    </div>
                    <div className={styles.cadetDetail}>
                      <strong>Father:</strong>
                      <span>{cadet.father_name || 'N/A'}</span>
                    </div>
                    <div className={styles.cadetDetail}>
                      <strong>Mobile:</strong>
                      <span>{cadet.contact || 'N/A'}</span>
                    </div>
                    <div className={styles.cadetDetail}>
                      <strong>DOB:</strong>
                      <span>{cadet.dob ? new Date(cadet.dob).toLocaleDateString() : 'N/A'}</span>
                    </div>
                  </div>
                  <div className={styles.cadetMeta}>
                    <span className={styles.dietary}>
                      {cadet.dietary_preference === 'Vegetarian' ? '🥗 VEG' : '🍖 NON-VEG'}
                    </span>
                    <span className={styles.feeCategory}>
                      {cadet.fee_category || 'N/A'}
                    </span>
                  </div>
                </div>
                <div className={styles.checkbox}>
                  <input
                    type="checkbox"
                    checked={selectedCadets.includes(cadet.id)}
                    onChange={() => handleCadetSelection(cadet.id)}
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

export default NominalRollGenerator;