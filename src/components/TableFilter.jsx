import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, ChevronUp, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';

const TableFilter = ({ 
  column, 
  sortConfig, 
  onSort, 
  filterConfig, 
  onFilter,
  filterOptions = [],
  filterType = 'text' // 'text', 'select', 'multiselect'
}) => {
  const [showDropdown, setShowDropdown] = useState(false);
  const [textFilter, setTextFilter] = useState(filterConfig?.value || '');
  const [selectedOptions, setSelectedOptions] = useState(filterConfig?.selected || []);
  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };

    const handleResize = () => {
      if (showDropdown) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    window.addEventListener('resize', handleResize);
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('resize', handleResize);
    };
  }, [showDropdown]);

  const handleSort = (direction) => {
    onSort(column, direction);
    setShowDropdown(false);
  };

  const handleTextFilterChange = (value) => {
    setTextFilter(value);
    onFilter(column, { type: 'text', value });
  };

  const handleOptionToggle = (option) => {
    const newSelected = selectedOptions.includes(option)
      ? selectedOptions.filter(item => item !== option)
      : [...selectedOptions, option];
    
    setSelectedOptions(newSelected);
    onFilter(column, { type: 'multiselect', selected: newSelected });
  };

  const clearFilters = () => {
    setTextFilter('');
    setSelectedOptions([]);
    onFilter(column, { type: filterType, value: '', selected: [] });
  };

  const getSortIcon = () => {
    if (sortConfig?.column === column) {
      return sortConfig.direction === 'asc' ? <ArrowUp size={14} /> : <ArrowDown size={14} />;
    }
    return <ArrowUpDown size={14} />;
  };

  const hasActiveFilters = () => {
    return textFilter || selectedOptions.length > 0;
  };

  return (
    <div className="table-filter" ref={dropdownRef} style={{ position: 'relative', display: 'inline-block' }}>
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        style={{
          background: 'transparent',
          border: 'none',
          color: hasActiveFilters() ? '#3b82f6' : 'inherit',
          cursor: 'pointer',
          padding: '4px 8px',
          borderRadius: '4px',
          display: 'flex',
          alignItems: 'center',
          gap: '4px',
          fontSize: '12px',
          fontWeight: hasActiveFilters() ? '600' : '400',
          transition: 'all 0.2s'
        }}
        onMouseEnter={(e) => {
          e.target.style.background = 'rgba(255, 255, 255, 0.1)';
        }}
        onMouseLeave={(e) => {
          e.target.style.background = 'transparent';
        }}
      >
        {getSortIcon()}
        {showDropdown ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
      </button>

      {showDropdown && (
        <div
          style={{
            position: 'fixed',
            top: 'auto',
            left: 'auto',
            background: '#fff',
            border: '1px solid #e2e8f0',
            borderRadius: '8px',
            boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)',
            zIndex: 9999,
            minWidth: '200px',
            padding: '8px',
            marginTop: '4px',
            maxHeight: '400px',
            overflowY: 'auto'
          }}
          ref={(el) => {
            if (el) {
              const buttonRect = dropdownRef.current?.getBoundingClientRect();
              if (buttonRect) {
                const spaceBelow = window.innerHeight - buttonRect.bottom;
                const spaceAbove = buttonRect.top;
                const dropdownHeight = Math.min(el.scrollHeight, 400); // Cap at 400px
                
                // Ensure minimum space
                const minSpace = 20;
                
                // Position dropdown
                if (spaceBelow >= dropdownHeight + minSpace || spaceBelow > spaceAbove) {
                  // Show below
                  el.style.top = `${buttonRect.bottom + 4}px`;
                  el.style.left = `${buttonRect.left}px`;
                } else {
                  // Show above
                  el.style.top = `${buttonRect.top - dropdownHeight - 4}px`;
                  el.style.left = `${buttonRect.left}px`;
                }
                
                // Ensure dropdown doesn't go off-screen horizontally
                const dropdownWidth = el.offsetWidth;
                const rightEdge = buttonRect.left + dropdownWidth;
                if (rightEdge > window.innerWidth) {
                  el.style.left = `${window.innerWidth - dropdownWidth - 10}px`;
                }
              }
            }
          }}
        >
          {/* Sort Options */}
          <div style={{ borderBottom: '1px solid #e2e8f0', paddingBottom: '8px', marginBottom: '8px' }}>
            <div style={{ fontSize: '12px', fontWeight: '600', color: '#64748b', marginBottom: '4px' }}>
              Sort
            </div>
            <button
              onClick={() => handleSort('asc')}
              style={{
                width: '100%',
                textAlign: 'left',
                padding: '6px 8px',
                border: 'none',
                background: sortConfig?.column === column && sortConfig?.direction === 'asc' ? '#f1f5f9' : 'transparent',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '14px',
                marginBottom: '2px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
              onMouseEnter={(e) => {
                if (!(sortConfig?.column === column && sortConfig?.direction === 'asc')) {
                  e.target.style.background = '#f8fafc';
                }
              }}
              onMouseLeave={(e) => {
                if (!(sortConfig?.column === column && sortConfig?.direction === 'asc')) {
                  e.target.style.background = 'transparent';
                }
              }}
            >
              <ArrowUp size={14} />
              Ascending
            </button>
            <button
              onClick={() => handleSort('desc')}
              style={{
                width: '100%',
                textAlign: 'left',
                padding: '6px 8px',
                border: 'none',
                background: sortConfig?.column === column && sortConfig?.direction === 'desc' ? '#f1f5f9' : 'transparent',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '14px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
              onMouseEnter={(e) => {
                if (!(sortConfig?.column === column && sortConfig?.direction === 'desc')) {
                  e.target.style.background = '#f8fafc';
                }
              }}
              onMouseLeave={(e) => {
                if (!(sortConfig?.column === column && sortConfig?.direction === 'desc')) {
                  e.target.style.background = 'transparent';
                }
              }}
            >
              <ArrowDown size={14} />
              Descending
            </button>
          </div>

          {/* Filter Options */}
          <div>
            <div style={{ fontSize: '12px', fontWeight: '600', color: '#64748b', marginBottom: '4px' }}>
              Filter
            </div>
            
            {filterType === 'text' && (
              <input
                type="text"
                value={textFilter}
                onChange={(e) => handleTextFilterChange(e.target.value)}
                placeholder={`Filter by ${column}...`}
                style={{
                  width: '100%',
                  padding: '6px 8px',
                  border: '1px solid #e2e8f0',
                  borderRadius: '4px',
                  fontSize: '14px',
                  outline: 'none'
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = '#3b82f6';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = '#e2e8f0';
                }}
              />
            )}

            {filterType === 'multiselect' && (
              <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
                {filterOptions.map((option) => (
                  <label
                    key={option.value}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '6px 8px',
                      cursor: 'pointer',
                      borderRadius: '4px',
                      fontSize: '14px',
                      transition: 'background-color 0.2s'
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.background = '#f8fafc';
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.background = 'transparent';
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={selectedOptions.includes(option.value)}
                      onChange={() => handleOptionToggle(option.value)}
                      style={{
                        accentColor: '#3b82f6',
                        width: '16px',
                        height: '16px'
                      }}
                    />
                    <span style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '6px',
                      flex: 1 
                    }}>
                      {option.color && (
                        <div
                          style={{
                            width: '12px',
                            height: '12px',
                            borderRadius: '50%',
                            backgroundColor: option.color
                          }}
                        />
                      )}
                      {option.label}
                    </span>
                  </label>
                ))}
              </div>
            )}

            {hasActiveFilters() && (
              <button
                onClick={clearFilters}
                style={{
                  width: '100%',
                  padding: '6px 8px',
                  border: '1px solid #e2e8f0',
                  background: '#fff',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '12px',
                  color: '#64748b',
                  marginTop: '8px',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => {
                  e.target.style.background = '#f8fafc';
                  e.target.style.color = '#374151';
                }}
                onMouseLeave={(e) => {
                  e.target.style.background = '#fff';
                  e.target.style.color = '#64748b';
                }}
              >
                Clear Filter
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default TableFilter;
