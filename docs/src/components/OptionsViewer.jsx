import React, { useState, useMemo } from 'react';

function CopyButton({ text, label = 'Copy' }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = (e) => {
    e.stopPropagation();
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    }
  };

  return (
    <button
      type="button"
      className={`doc-copy-btn ${copied ? 'doc-copy-btn-success' : ''}`}
      onClick={handleCopy}
      title={copied ? 'Copied to clipboard!' : `Copy ${label}`}
    >
      {copied ? (
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <polyline points="20 6 9 17 4 12" />
        </svg>
      ) : (
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
          <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
        </svg>
      )}
      <span>{copied ? 'Copied' : label}</span>
    </button>
  );
}

function TypeBadge({ type, value }) {
  const resolvedType = type || (value !== undefined ? (Array.isArray(value) ? 'array' : typeof value) : 'string');
  return (
    <span className={`doc-type-badge doc-type-${resolvedType}`}>
      {resolvedType}
    </span>
  );
}

export default function OptionsViewer({ options = [], isBackend = true }) {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedType, setSelectedType] = useState('all');

  // Extract namespaces (e.g., 'system' from 'system.app-name')
  const categories = useMemo(() => {
    const counts = {};
    options.forEach((opt) => {
      const parts = opt.name.split('.');
      const cat = parts.length > 1 ? parts[0] : 'general';
      counts[cat] = (counts[cat] || 0) + 1;
    });
    return Object.entries(counts)
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([name, count]) => ({ name, count }));
  }, [options]);

  // Extract available types
  const types = useMemo(() => {
    const typeSet = new Set();
    options.forEach((opt) => {
      const t = opt.type || (opt.default !== undefined ? (Array.isArray(opt.default) ? 'array' : typeof opt.default) : 'string');
      if (t) typeSet.add(t);
    });
    return Array.from(typeSet).sort();
  }, [options]);

  // Filtered list
  const filteredOptions = useMemo(() => {
    const q = search.toLowerCase().trim();
    return options.filter((opt) => {
      // Category filter
      if (selectedCategory !== 'all') {
        const parts = opt.name.split('.');
        const cat = parts.length > 1 ? parts[0] : 'general';
        if (cat !== selectedCategory) return false;
      }

      // Type filter
      if (selectedType !== 'all') {
        const t = opt.type || (opt.default !== undefined ? (Array.isArray(opt.default) ? 'array' : typeof opt.default) : 'string');
        if (t !== selectedType) return false;
      }

      // Search filter
      if (!q) return true;
      return (
        opt.name.toLowerCase().includes(q) ||
        (opt.displayName && opt.displayName.toLowerCase().includes(q)) ||
        (opt.envName && opt.envName.toLowerCase().includes(q)) ||
        (opt.description && opt.description.toLowerCase().includes(q))
      );
    });
  }, [options, search, selectedCategory, selectedType]);

  const hasFilters = search || selectedCategory !== 'all' || selectedType !== 'all';

  const resetFilters = () => {
    setSearch('');
    setSelectedCategory('all');
    setSelectedType('all');
  };

  return (
    <div className="doc-options-viewer">
      {/* Search & Filter Toolbar */}
      <div className="doc-toolbar">
        <div className="doc-search-box">
          <svg className="doc-search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="text"
            className="doc-input"
            placeholder={
              isBackend
                ? "Search by option name, ENV_VAR, or description..."
                : "Search by option name or description..."
            }
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {search && (
            <button type="button" className="doc-clear-btn" onClick={() => setSearch('')}>
              ×
            </button>
          )}
        </div>

        <div className="doc-filters">
          <select
            className="doc-select"
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
          >
            <option value="all">All Namespaces ({options.length})</option>
            {categories.map(({ name, count }) => (
              <option key={name} value={name}>
                {name} ({count})
              </option>
            ))}
          </select>

          <select
            className="doc-select"
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
          >
            <option value="all">All Types</option>
            {types.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Results Header */}
      <div className="doc-stats-bar">
        <span>
          Showing <strong>{filteredOptions.length}</strong> of <strong>{options.length}</strong> options
        </span>
        {hasFilters && (
          <button type="button" className="doc-reset-link" onClick={resetFilters}>
            Reset filters
          </button>
        )}
      </div>

      {/* Options Table */}
      {filteredOptions.length > 0 ? (
        <div className="doc-table-wrapper">
          <table className="doc-options-table">
            <thead>
              <tr>
                <th style={{ minWidth: '220px' }}>Option Name</th>
                {isBackend && <th style={{ minWidth: '220px' }}>Environment Variable</th>}
                <th style={{ width: '90px' }}>Type</th>
                <th style={{ minWidth: '130px' }}>Default</th>
                <th>Description</th>
              </tr>
            </thead>
            <tbody>
              {filteredOptions.map((opt) => (
                <tr key={opt.name} id={`option-${opt.name}`}>
                  {/* Option Name */}
                  <td className="doc-col-name">
                    <div className="doc-name-cell">
                      <code className="doc-code-primary">{opt.name}</code>
                      <CopyButton text={opt.name} label="Name" />
                    </div>
                    {opt.displayName && opt.displayName !== opt.name && (
                      <div className="doc-sub-text">{opt.displayName}</div>
                    )}
                  </td>

                  {/* Environment Variable (Backend only) */}
                  {isBackend && (
                    <td className="doc-col-env">
                      {opt.envName ? (
                        <div className="doc-name-cell">
                          <code className="doc-code-env">{opt.envName}</code>
                          <CopyButton text={opt.envName} label="ENV" />
                        </div>
                      ) : (
                        <span className="doc-muted">—</span>
                      )}
                    </td>
                  )}

                  {/* Type */}
                  <td className="doc-col-type">
                    <TypeBadge type={opt.type} value={opt.default} />
                  </td>

                  {/* Default */}
                  <td className="doc-col-default">
                    {opt.default !== undefined ? (
                      <code className="doc-code-default">
                        {typeof opt.default === 'object'
                          ? JSON.stringify(opt.default)
                          : String(opt.default)}
                      </code>
                    ) : (
                      <span className="doc-muted">—</span>
                    )}
                  </td>

                  {/* Description */}
                  <td className="doc-col-desc">
                    <div className="doc-desc-text">{opt.description || 'No description provided.'}</div>
                    {opt.relatedOptions && opt.relatedOptions.length > 0 && (
                      <div className="doc-related-options">
                        <span className="doc-related-label">Related:</span>
                        {opt.relatedOptions.map((rel) => (
                          <code key={rel} className="doc-related-badge">
                            {rel}
                          </code>
                        ))}
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="doc-empty-state">
          <div className="doc-empty-icon">🔍</div>
          <h3>No matching options found</h3>
          <p>Try adjusting your search query or clear the filters.</p>
          <button type="button" className="doc-btn-primary" onClick={resetFilters}>
            Clear Filters
          </button>
        </div>
      )}
    </div>
  );
}
