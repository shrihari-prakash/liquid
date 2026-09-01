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

export default function ScopesViewer({ scopes = [] }) {
  const [search, setSearch] = useState('');
  const [viewMode, setViewMode] = useState('tree'); // 'tree' | 'table'
  const [expandedScopes, setExpandedScopes] = useState({});
  const [selectedNamespace, setSelectedNamespace] = useState('all');

  // Map of scopes by name
  const scopesMap = useMemo(() => {
    return scopes.reduce((acc, scope) => {
      acc[scope.name] = scope;
      return acc;
    }, {});
  }, [scopes]);

  // Namespaces (e.g., 'delegated', 'admin', 'client', 'user')
  const namespaces = useMemo(() => {
    const counts = {};
    scopes.forEach((s) => {
      if (s.name === '*') {
        counts['*'] = (counts['*'] || 0) + 1;
        return;
      }
      const prefix = s.name.split(':')[0];
      counts[prefix] = (counts[prefix] || 0) + 1;
    });
    return Object.entries(counts)
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([name, count]) => ({ name, count }));
  }, [scopes]);

  // Parent scopes with children
  const allParentNames = useMemo(() => {
    const parentSet = new Set();
    scopes.forEach((s) => {
      if (s.parent) parentSet.add(s.parent);
    });
    return Array.from(parentSet);
  }, [scopes]);

  const toggleExpand = (name) => {
    setExpandedScopes((prev) => ({
      ...prev,
      [name]: prev[name] === undefined ? false : !prev[name],
    }));
  };

  const expandAll = () => {
    const all = {};
    scopes.forEach((s) => {
      all[s.name] = true;
    });
    setExpandedScopes(all);
  };

  const collapseAll = () => {
    setExpandedScopes({});
  };

  // Check if item or any descendant matches search
  const matchesSearchOrDescendant = (scopeName, q) => {
    const scope = scopesMap[scopeName];
    if (!scope) return false;
    const nameMatches = scope.name.toLowerCase().includes(q);
    const descMatches = scope.description && scope.description.toLowerCase().includes(q);
    const adminDescMatches = scope.adminDescription && scope.adminDescription.toLowerCase().includes(q);

    if (nameMatches || descMatches || adminDescMatches) return true;

    // Check children
    const children = scopes.filter((s) => s.parent === scopeName);
    return children.some((c) => matchesSearchOrDescendant(c.name, q));
  };

  // Filtered list for table view
  const filteredFlatScopes = useMemo(() => {
    const q = search.toLowerCase().trim();
    return scopes.filter((s) => {
      if (selectedNamespace !== 'all') {
        if (selectedNamespace === '*' && s.name !== '*') return false;
        if (selectedNamespace !== '*' && !s.name.startsWith(`${selectedNamespace}:`)) return false;
      }
      if (!q) return true;
      return (
        s.name.toLowerCase().includes(q) ||
        (s.description && s.description.toLowerCase().includes(q)) ||
        (s.adminDescription && s.adminDescription.toLowerCase().includes(q))
      );
    });
  }, [scopes, search, selectedNamespace]);

  // Render recursive tree node
  const renderTreeNode = (scope, level = 0) => {
    const children = scopes.filter((s) => s.parent === scope.name);
    const hasChildren = children.length > 0;
    const q = search.toLowerCase().trim();

    if (q && !matchesSearchOrDescendant(scope.name, q)) {
      return null;
    }

    if (selectedNamespace !== 'all') {
      if (scope.name !== '*' && selectedNamespace !== '*' && !scope.name.startsWith(`${selectedNamespace}:`)) {
        // If it has children that match namespace, show it
        const hasMatchingChild = children.some(
          (c) => c.name.startsWith(`${selectedNamespace}:`) || matchesSearchOrDescendant(c.name, q)
        );
        if (!hasMatchingChild) return null;
      }
    }

    // Default expanded when searching or top levels
    const isExpanded = q ? true : expandedScopes[scope.name] ?? (level < 2);
    const isWildcard = scope.name === '*' || scope.name.endsWith(':all') || scope.name.endsWith(':*');

    return (
      <div key={scope.name} className="doc-tree-node">
        <div className={`doc-tree-item ${isWildcard ? 'doc-tree-item-wildcard' : ''}`}>
          {/* Expand/Collapse or Bullet */}
          {hasChildren ? (
            <button
              type="button"
              className="doc-tree-toggle"
              onClick={() => toggleExpand(scope.name)}
              title={isExpanded ? 'Collapse' : 'Expand'}
            >
              {isExpanded ? (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              ) : (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              )}
            </button>
          ) : (
            <div className="doc-tree-bullet" />
          )}

          {/* Scope Content */}
          <div className="doc-tree-content">
            <div className="doc-tree-header">
              <code className="doc-code-primary">{scope.name}</code>
              <CopyButton text={scope.name} label="Scope" />
              {isWildcard && <span className="doc-badge doc-badge-wildcard">Wildcard</span>}
              {scope.parent && level > 0 && (
                <span className="doc-parent-ref">
                  parent: <code>{scope.parent}</code>
                </span>
              )}
            </div>

            {scope.description && (
              <p className="doc-tree-desc">{scope.description}</p>
            )}

            {scope.adminDescription && scope.adminDescription !== scope.description && (
              <div className="doc-admin-desc">
                <span className="doc-admin-tag">Delegated Admin:</span>
                <span>{scope.adminDescription}</span>
              </div>
            )}
          </div>
        </div>

        {/* Children Subtree */}
        {hasChildren && isExpanded && (
          <div className="doc-tree-children">
            {children.map((child) => renderTreeNode(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  // Find root scopes (parent undefined or not in list or '*')
  const rootScopes = useMemo(() => {
    const explicitRoot = scopes.filter((s) => s.name === '*');
    if (explicitRoot.length > 0) return explicitRoot;
    return scopes.filter((s) => !s.parent || !scopesMap[s.parent]);
  }, [scopes, scopesMap]);

  return (
    <div className="doc-scopes-viewer">
      {/* Toolbar */}
      <div className="doc-toolbar">
        <div className="doc-search-box">
          <svg className="doc-search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="text"
            className="doc-input"
            placeholder="Search scopes by name, description, or namespace..."
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
            value={selectedNamespace}
            onChange={(e) => setSelectedNamespace(e.target.value)}
          >
            <option value="all">All Namespaces ({scopes.length})</option>
            {namespaces.map(({ name, count }) => (
              <option key={name} value={name}>
                {name} ({count})
              </option>
            ))}
          </select>

          {/* View Toggle */}
          <div className="doc-view-toggle">
            <button
              type="button"
              className={`doc-view-btn ${viewMode === 'tree' ? 'doc-view-btn-active' : ''}`}
              onClick={() => setViewMode('tree')}
              title="Tree View"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M17 10H3" />
                <path d="M21 6H3" />
                <path d="M21 14H3" />
                <path d="M17 18H3" />
              </svg>
              <span>Tree</span>
            </button>
            <button
              type="button"
              className={`doc-view-btn ${viewMode === 'table' ? 'doc-view-btn-active' : ''}`}
              onClick={() => setViewMode('table')}
              title="Table View"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="3" width="18" height="18" rx="2" />
                <path d="M3 9h18" />
                <path d="M9 21V9" />
              </svg>
              <span>Table</span>
            </button>
          </div>
        </div>
      </div>

      {/* Tree Controls & Stats Bar */}
      <div className="doc-stats-bar">
        <span>
          Showing <strong>{filteredFlatScopes.length}</strong> of <strong>{scopes.length}</strong> total scopes
        </span>

        {viewMode === 'tree' && (
          <div className="doc-tree-controls">
            <button type="button" className="doc-link-btn" onClick={expandAll}>
              Expand All
            </button>
            <span className="doc-separator">•</span>
            <button type="button" className="doc-link-btn" onClick={collapseAll}>
              Collapse All
            </button>
          </div>
        )}
      </div>

      {/* Content Container */}
      {viewMode === 'tree' ? (
        <div className="doc-tree-container">
          {rootScopes.length > 0 ? (
            rootScopes.map((root) => renderTreeNode(root, 0))
          ) : (
            <div className="doc-empty-state">
              <div className="doc-empty-icon">🔍</div>
              <h3>No scopes found</h3>
              <p>Try adjusting your search query.</p>
            </div>
          )}
        </div>
      ) : (
        /* Flat Table View */
        filteredFlatScopes.length > 0 ? (
          <div className="doc-table-wrapper">
            <table className="doc-options-table">
              <thead>
                <tr>
                  <th style={{ minWidth: '220px' }}>Scope Name</th>
                  <th style={{ minWidth: '140px' }}>Parent Scope</th>
                  <th>Description</th>
                  <th>Delegated Admin Description</th>
                </tr>
              </thead>
              <tbody>
                {filteredFlatScopes.map((scope) => (
                  <tr key={scope.name} id={`scope-${scope.name}`}>
                    <td className="doc-col-name">
                      <div className="doc-name-cell">
                        <code className="doc-code-primary">{scope.name}</code>
                        <CopyButton text={scope.name} label="Scope" />
                      </div>
                    </td>
                    <td>
                      {scope.parent ? (
                        <code className="doc-code-secondary">{scope.parent}</code>
                      ) : (
                        <span className="doc-badge doc-badge-root">Root</span>
                      )}
                    </td>
                    <td className="doc-col-desc">
                      <div className="doc-desc-text">{scope.description || '—'}</div>
                    </td>
                    <td className="doc-col-desc">
                      {scope.adminDescription ? (
                        <div className="doc-admin-desc-text">{scope.adminDescription}</div>
                      ) : (
                        <span className="doc-muted">—</span>
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
            <h3>No matching scopes found</h3>
            <p>Try adjusting your search query or clear the filters.</p>
          </div>
        )
      )}
    </div>
  );
}
