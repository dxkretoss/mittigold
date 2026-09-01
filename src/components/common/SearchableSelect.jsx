import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check, Plus, X } from 'lucide-react';

export const SearchableSelect = ({
  value = '',
  onChange,
  options = [],
  placeholder = 'Select or type...',
  disabled = false,
  required = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState(value || '');
  const containerRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    setSearchTerm(value || '');
  }, [value]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredOptions = options.filter((opt) =>
    opt.toLowerCase().includes(searchTerm.toLowerCase().trim())
  );

  const handleSelect = (item) => {
    setSearchTerm(item);
    onChange(item);
    setIsOpen(false);
  };

  const handleInputChange = (e) => {
    const val = e.target.value;
    setSearchTerm(val);
    onChange(val);
    setIsOpen(true);
  };

  const isExactMatch = options.some(
    (opt) => opt.toLowerCase().trim() === searchTerm.toLowerCase().trim()
  );

  return (
    <div ref={containerRef} style={{ position: 'relative', width: '100%' }}>
      <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
        <input
          ref={inputRef}
          type="text"
          value={searchTerm}
          onChange={handleInputChange}
          onFocus={() => setIsOpen(true)}
          placeholder={placeholder}
          disabled={disabled}
          required={required}
          autoComplete="off"
          style={{
            width: '100%',
            paddingRight: searchTerm ? '52px' : '32px',
            background: disabled ? '#F6F5F2' : '#FFFFFF',
            cursor: disabled ? 'not-allowed' : 'text',
          }}
        />

        <div
          style={{
            position: 'absolute',
            right: '8px',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
          }}
        >
          {searchTerm && !disabled && (
            <button
              type="button"
              onClick={() => {
                setSearchTerm('');
                onChange('');
                inputRef.current?.focus();
              }}
              style={{
                background: 'none',
                border: 'none',
                padding: '2px',
                color: 'var(--ink-soft)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
              }}
              title="Clear"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}

          <button
            type="button"
            onClick={() => !disabled && setIsOpen(!isOpen)}
            style={{
              background: 'none',
              border: 'none',
              padding: '2px',
              color: 'var(--ink-soft)',
              cursor: disabled ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
            }}
            tabIndex={-1}
          >
            <ChevronDown
              className="w-4 h-4"
              style={{
                transform: isOpen ? 'rotate(180deg)' : 'none',
                transition: 'transform 0.15s ease',
              }}
            />
          </button>
        </div>
      </div>

      {/* Custom Styled Dropdown Menu */}
      {isOpen && !disabled && (
        <div
          style={{
            position: 'absolute',
            top: 'calc(100% + 4px)',
            left: 0,
            right: 0,
            zIndex: 100,
            maxHeight: '190px',
            overflowY: 'auto',
            background: '#FFFFFF',
            border: '1px solid var(--line)',
            borderRadius: '8px',
            boxShadow: '0 10px 28px rgba(18, 32, 54, 0.14)',
            padding: '4px 0',
          }}
        >
          {/* If user typed custom text not in list */}
          {searchTerm.trim() && !isExactMatch && (
            <div
              onClick={() => handleSelect(searchTerm.trim())}
              style={{
                padding: '8px 12px',
                fontSize: '12px',
                fontWeight: 600,
                color: 'var(--wheat)',
                background: 'var(--amber-bg)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                borderBottom: filteredOptions.length > 0 ? '1px solid var(--line)' : 'none',
              }}
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Use custom "{searchTerm.trim()}"</span>
            </div>
          )}

          {filteredOptions.length > 0 ? (
            filteredOptions.map((opt) => {
              const isSelected =
                value && value.toLowerCase().trim() === opt.toLowerCase().trim();
              return (
                <div
                  key={opt}
                  onClick={() => handleSelect(opt)}
                  style={{
                    padding: '8px 12px',
                    fontSize: '12.5px',
                    color: isSelected ? 'var(--navy)' : 'var(--ink)',
                    background: isSelected ? '#F6F3EB' : 'transparent',
                    fontWeight: isSelected ? 700 : 400,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    transition: 'background 0.1s ease',
                  }}
                  onMouseEnter={(e) => {
                    if (!isSelected) e.currentTarget.style.background = '#F9F8F5';
                  }}
                  onMouseLeave={(e) => {
                    if (!isSelected) e.currentTarget.style.background = 'transparent';
                  }}
                >
                  <span>{opt}</span>
                  {isSelected && <Check className="w-3.5 h-3.5 text-wheat" />}
                </div>
              );
            })
          ) : !searchTerm.trim() ? (
            <div style={{ padding: '12px', textAlign: 'center', fontSize: '12px', color: 'var(--ink-soft)' }}>
              No options available
            </div>
          ) : isExactMatch ? null : null}
        </div>
      )}
    </div>
  );
};
