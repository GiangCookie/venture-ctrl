import React, { useState, useMemo, useEffect } from 'react';

const MOOD_EMOJIS = ['😴', '😐', '🙂', '😊', '🔥'];

export default function GlobalSearch({ data, journalEntries, onNavigate }) {
  const [query, setQuery] = useState('');
  const [activeFilters, setActiveFilters] = useState({
    todos: true,
    sessions: true,
    income: true,
    pipeline: true,
    journal: true,
  });
  const [filterProject, setFilterProject] = useState('all');
  const [filterDateRange, setFilterDateRange] = useState('all');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedResult, setSelectedResult] = useState(null);

  // Get unique projects from all data
  const projects = useMemo(() => {
    const projectSet = new Set();
    data.timeSessions.forEach(s => s.projectId && projectSet.add(s.projectId));
    data.todos.forEach(t => t.projectId && projectSet.add(t.projectId));
    data.income.forEach(i => i.projectId && projectSet.add(i.projectId));
    data.pipeline.forEach(p => p.projectId && projectSet.add(p.projectId));
    journalEntries.forEach(j => j.projects?.forEach(p => projectSet.add(p)));
    return Array.from(projectSet);
  }, [data, journalEntries]);

  // Build search index
  const searchResults = useMemo(() => {
    if (!query.trim() && filterProject === 'all' && filterDateRange === 'all') {
      return [];
    }

    const results = [];
    const searchTerm = query.toLowerCase().trim();

    // Filter by date range
    const isInDateRange = (dateStr) => {
      if (filterDateRange === 'all') return true;
      const itemDate = new Date(dateStr);
      const today = new Date();
      const days = parseInt(filterDateRange);
      const cutoff = new Date(today.setDate(today.getDate() - days));
      return itemDate >= cutoff;
    };

    // Filter by project
    const isProjectMatch = (itemProject) => {
      if (filterProject === 'all') return true;
      return itemProject === filterProject;
    };

    // Search Todos
    if (activeFilters.todos) {
      data.todos.forEach(todo => {
        const matchesSearch = !searchTerm || 
          todo.title?.toLowerCase().includes(searchTerm) ||
          todo.priority?.toLowerCase().includes(searchTerm);
        
        if (matchesSearch && isProjectMatch(todo.projectId) && isInDateRange(todo.createdAt)) {
          results.push({
            type: 'todo',
            id: todo.id,
            title: todo.title,
            subtitle: `${todo.priority} · ${todo.projectId}`,
            projectId: todo.projectId,
            date: todo.createdAt,
            completed: todo.completed,
            data: todo,
          });
        }
      });
    }

    // Search Sessions
    if (activeFilters.sessions) {
      data.timeSessions.forEach(session => {
        const matchesSearch = !searchTerm ||
          session.notes?.toLowerCase().includes(searchTerm) ||
          session.projectId?.toLowerCase().includes(searchTerm);
        
        if (matchesSearch && isProjectMatch(session.projectId) && isInDateRange(session.startTime)) {
          results.push({
            type: 'session',
            id: session.id,
            title: `${(session.duration / 60).toFixed(1)}h Session`,
            subtitle: `${session.projectId} · ${MOOD_EMOJIS[session.mood - 1]}`,
            projectId: session.projectId,
            date: session.startTime,
            data: session,
          });
        }
      });
    }

    // Search Income
    if (activeFilters.income) {
      data.income.forEach(inc => {
        const matchesSearch = !searchTerm ||
          inc.description?.toLowerCase().includes(searchTerm) ||
          inc.amount?.toString().includes(searchTerm);
        
        if (matchesSearch && isProjectMatch(inc.projectId) && isInDateRange(inc.date)) {
          results.push({
            type: 'income',
            id: inc.id,
            title: `${inc.amount > 0 ? '+' : ''}${inc.amount.toLocaleString('de-DE')}€`,
            subtitle: `${inc.description} · ${inc.projectId}`,
            projectId: inc.projectId,
            date: inc.date,
            data: inc,
          });
        }
      });
    }

    // Search Pipeline
    if (activeFilters.pipeline) {
      data.pipeline.forEach(deal => {
        const matchesSearch = !searchTerm ||
          deal.name?.toLowerCase().includes(searchTerm) ||
          deal.stage?.toLowerCase().includes(searchTerm);
        
        if (matchesSearch && isProjectMatch(deal.projectId) && isInDateRange(deal.createdAt)) {
          results.push({
            type: 'pipeline',
            id: deal.id,
            title: deal.name,
            subtitle: `${deal.stage} · ${deal.value.toLocaleString('de-DE')}€`,
            projectId: deal.projectId,
            date: deal.createdAt,
            data: deal,
          });
        }
      });
    }

    // Search Journal
    if (activeFilters.journal) {
      journalEntries.forEach(entry => {
        const matchesSearch = !searchTerm ||
          entry.summary?.text?.toLowerCase().includes(searchTerm) ||
          entry.content?.toLowerCase().includes(searchTerm) ||
          entry.highlights?.some(h => h.text?.toLowerCase().includes(searchTerm)) ||
          entry.tags?.some(t => t.toLowerCase().includes(searchTerm));
        
        if (matchesSearch && (filterProject === 'all' || entry.projects?.includes(filterProject))) {
          results.push({
            type: 'journal',
            id: entry.id,
            title: `Journal · ${new Date(entry.date).toLocaleDateString('de-DE')}`,
            subtitle: entry.summary?.text?.substring(0, 60) + '...' || 'Keine Zusammenfassung',
            projectId: entry.projects?.[0] || 'unknown',
            date: entry.date,
            data: entry,
          });
        }
      });
    }

    // Sort by date descending
    return results.sort((a, b) => new Date(b.date) - new Date(a.date));
  }, [query, activeFilters, filterProject, filterDateRange, data, journalEntries]);

  const getTypeIcon = (type) => {
    const icons = {
      todo: '✅',
      session: '⏱️',
      income: '💰',
      pipeline: '🎯',
      journal: '📓',
    };
    return icons[type] || '•';
  };

  const getTypeColor = (type) => {
    const colors = {
      todo: '#4ECDC4',
      session: '#95E881',
      income: '#FF6B35',
      pipeline: '#A855F7',
      journal: '#FFD93D',
    };
    return colors[type] || '#fff';
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header */}
      <h2 style={{ margin: 0, color: '#fff', fontSize: '1.3rem' }}>
        🔍 Globale Suche
      </h2>

      {/* Search Input */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <div style={{ display: 'flex', gap: '10px' }}>
          <input
            type="text"
            placeholder="Suche in Todos, Sessions, Einnahmen, Pipeline, Journal..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            style={{
              flex: 1,
              padding: '14px 18px',
              background: 'rgba(0,0,0,0.3)',
              border: '1px solid rgba(255,255,255,0.15)',
              borderRadius: '10px',
              color: '#fff',
              fontSize: '1rem',
              fontFamily: 'inherit',
            }}
            autoFocus
          />
          <button
            onClick={() => setShowFilters(!showFilters)}
            style={{
              padding: '14px 18px',
              background: showFilters ? 'rgba(78,205,196,0.3)' : 'rgba(255,255,255,0.1)',
              border: `1px solid ${showFilters ? '#4ECDC4' : 'rgba(255,255,255,0.2)'}`,
              borderRadius: '10px',
              color: showFilters ? '#4ECDC4' : '#fff',
              cursor: 'pointer',
              fontSize: '0.9rem',
            }}
          >
            ⚙️ Filter
          </button>
        </div>

        {/* Type Filters */}
        <div style={{
          display: 'flex',
          gap: '8px',
          flexWrap: 'wrap',
        }}>
          {Object.entries(activeFilters).map(([type, active]) => (
            <button
              key={type}
              onClick={() => setActiveFilters(prev => ({ ...prev, [type]: !prev[type] }))}
              style={{
                padding: '8px 14px',
                background: active ? `${getTypeColor(type)}20` : 'rgba(255,255,255,0.05)',
                border: `1px solid ${active ? getTypeColor(type) : 'rgba(255,255,255,0.1)'}`,
                borderRadius: '20px',
                color: active ? getTypeColor(type) : '#888',
                cursor: 'pointer',
                fontSize: '0.85rem',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <span>{active ? '✓' : '○'}</span>
              <span>{getTypeIcon(type)}</span>
              <span style={{ textTransform: 'capitalize' }}>{type}</span>
            </button>
          ))}
        </div>

        {/* Advanced Filters */}
        {showFilters && (
          <div style={{
            padding: '15px',
            background: 'rgba(255,255,255,0.03)',
            borderRadius: '12px',
            display: 'flex',
            gap: '10px',
            flexWrap: 'wrap',
          }}>
            <select
              value={filterProject}
              onChange={(e) => setFilterProject(e.target.value)}
              style={{
                padding: '10px 14px',
                background: 'rgba(0,0,0,0.3)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '8px',
                color: '#fff',
                fontSize: '0.9rem',
                fontFamily: 'inherit',
              }}
            >
              <option value="all">Alle Projekte</option>
              {projects.map(p => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>

            <select
              value={filterDateRange}
              onChange={(e) => setFilterDateRange(e.target.value)}
              style={{
                padding: '10px 14px',
                background: 'rgba(0,0,0,0.3)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '8px',
                color: '#fff',
                fontSize: '0.9rem',
                fontFamily: 'inherit',
              }}
            >
              <option value="all">Alle Zeit</option>
              <option value="7">Letzte 7 Tage</option>
              <option value="30">Letzte 30 Tage</option>
              <option value="90">Letzte 90 Tage</option>
              <option value="365">Letzte 365 Tage</option>
            </select>

            <button
              onClick={() => {
                setFilterProject('all');
                setFilterDateRange('all');
                setQuery('');
              }}
              style={{
                padding: '10px 16px',
                background: 'rgba(255,100,100,0.2)',
                border: '1px solid rgba(255,100,100,0.3)',
                borderRadius: '8px',
                color: '#f88',
                cursor: 'pointer',
                fontSize: '0.9rem',
              }}
            >
              Zurücksetzen
            </button>
          </div>
        )}
      </div>

      {/* Results Stats */}
      {(query || filterProject !== 'all' || filterDateRange !== 'all') && (
        <div style={{
          padding: '12px 15px',
          background: 'rgba(78,205,196,0.1)',
          borderRadius: '8px',
          color: '#4ECDC4',
          fontSize: '0.9rem',
        }}>
          {searchResults.length} Ergebnisse gefunden
          {query && ` für "${query}"`}
        </div>
      )}

      {/* Results */}
      {searchResults.length === 0 ? (
        <div style={{
          textAlign: 'center',
          padding: '60px 20px',
          color: '#666',
        }}>
          <p style={{ fontSize: '3rem', margin: '0 0 10px' }}>🔍</p>
          <p>{query ? 'Keine Ergebnisse gefunden' : 'Gib einen Suchbegriff ein oder wähle Filter'}</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {searchResults.map((result) => (
            <div
              key={`${result.type}-${result.id}`}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '15px',
                padding: '15px',
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: '12px',
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
              onClick={() => setSelectedResult(selectedResult === result.id ? null : result.id)}
            >
              {/* Icon */}
              <div style={{
                width: '40px',
                height: '40px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: `${getTypeColor(result.type)}20`,
                borderRadius: '10px',
                fontSize: '1.3rem',
              }}>
                {getTypeIcon(result.type)}
              </div>

              {/* Content */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  marginBottom: '4px',
                }}>
                  <span style={{
                    color: '#fff',
                    fontWeight: 600,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}>
                    {result.title}
                  </span>
                  {result.completed !== undefined && (
                    <span style={{
                      padding: '2px 8px',
                      background: result.completed ? 'rgba(149,232,129,0.2)' : 'rgba(255,255,255,0.1)',
                      borderRadius: '4px',
                      color: result.completed ? '#95E881' : '#888',
                      fontSize: '0.75rem',
                    }}>
                      {result.completed ? '✓ Erledigt' : '○ Offen'}
                    </span>
                  )}
                </div>
                <div style={{
                  color: '#888',
                  fontSize: '0.85rem',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}>
                  {result.subtitle}
                </div>
              </div>

              {/* Date */}
              <div style={{
                color: '#666',
                fontSize: '0.8rem',
                whiteSpace: 'nowrap',
              }}>
                {formatDate(result.date)}
              </div>

              {/* Expand indicator */}
              <div style={{ color: '#666' }}>
                {selectedResult === result.id ? '▲' : '▼'}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
