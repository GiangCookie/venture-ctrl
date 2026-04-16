import React, { useState, useEffect, useMemo } from 'react';

const MOOD_EMOJIS = ['😴', '😐', '🙂', '😊', '🔥'];

export default function JournalTab({ entries, timeSessions, onSearch }) {
  const [filterDateRange, setFilterDateRange] = useState('all');
  const [filterProject, setFilterProject] = useState('all');
  const [filterMood, setFilterMood] = useState('all');
  const [filterTag, setFilterTag] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedEntry, setSelectedEntry] = useState(null);

  const projects = useMemo(() => {
    const unique = new Set();
    entries.forEach(e => e.projects?.forEach(p => unique.add(p)));
    return Array.from(unique);
  }, [entries]);

  const tags = useMemo(() => {
    const unique = new Set();
    entries.forEach(e => e.tags?.forEach(t => unique.add(t)));
    return Array.from(unique);
  }, [entries]);

  const filteredEntries = useMemo(() => {
    return entries.filter(entry => {
      // Date range filter
      if (filterDateRange !== 'all') {
        const entryDate = new Date(entry.date);
        const today = new Date();
        const days = parseInt(filterDateRange);
        const cutoff = new Date(today.setDate(today.getDate() - days));
        if (entryDate < cutoff) return false;
      }

      // Project filter
      if (filterProject !== 'all' && !entry.projects?.includes(filterProject)) {
        return false;
      }

      // Mood filter
      if (filterMood !== 'all' && entry.summary?.mood !== parseInt(filterMood)) {
        return false;
      }

      // Tag filter
      if (filterTag !== 'all' && !entry.tags?.includes(filterTag)) {
        return false;
      }

      // Search query
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const searchableText = [
          entry.summary?.text || '',
          entry.content || '',
          ...(entry.highlights?.map(h => h.text) || []),
          ...(entry.todos?.mentioned || []),
        ].join(' ').toLowerCase();
        
        if (!searchableText.includes(query)) return false;
      }

      return true;
    });
  }, [entries, filterDateRange, filterProject, filterMood, filterTag, searchQuery]);

  const getLinkedSessions = (entry) => {
    const entryDate = entry.date;
    return timeSessions.filter(s => s.startTime?.startsWith(entryDate));
  };

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('de-DE', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  const getHighlightIcon = (type) => {
    const icons = {
      achievement: '✅',
      blocker: '🔴',
      warning: '🟡',
      next: '⏳',
      goal: '🎯',
      idea: '💡',
      note: '📝',
    };
    return icons[type] || '•';
  };

  const getHighlightLabel = (type) => {
    const labels = {
      achievement: 'Erfolge',
      blocker: 'Blocker',
      warning: 'Warnungen',
      next: 'Nächste Schritte',
      goal: 'Ziele',
      idea: 'Ideen',
      note: 'Notizen',
    };
    return labels[type] || type;
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '10px',
      }}>
        <h2 style={{ margin: 0, color: '#fff', fontSize: '1.3rem' }}>
          📓 Journal
          <span style={{ color: '#666', fontSize: '0.9rem', marginLeft: '10px' }}>
            ({filteredEntries.length} Einträge)
          </span>
        </h2>
        
        {/* Search */}
        <div style={{ display: 'flex', gap: '8px', flex: 1, maxWidth: '400px' }}>
          <input
            type="text"
            placeholder="🔍 Suchen..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              flex: 1,
              padding: '10px 14px',
              background: 'rgba(0,0,0,0.3)',
              border: '1px solid rgba(255,255,255,0.15)',
              borderRadius: '8px',
              color: '#fff',
              fontSize: '0.9rem',
              fontFamily: 'inherit',
            }}
          />
        </div>
      </div>

      {/* Filters */}
      <div style={{
        display: 'flex',
        gap: '10px',
        flexWrap: 'wrap',
        padding: '15px',
        background: 'rgba(255,255,255,0.03)',
        borderRadius: '12px',
      }}>
        {/* Date Range */}
        <select
          value={filterDateRange}
          onChange={(e) => setFilterDateRange(e.target.value)}
          style={filterSelectStyle}
        >
          <option value="all">Alle Zeit</option>
          <option value="7">Letzte 7 Tage</option>
          <option value="30">Letzte 30 Tage</option>
          <option value="90">Letzte 90 Tage</option>
        </select>

        {/* Project */}
        <select
          value={filterProject}
          onChange={(e) => setFilterProject(e.target.value)}
          style={filterSelectStyle}
        >
          <option value="all">Alle Projekte</option>
          {projects.map(p => (
            <option key={p} value={p}>{p}</option>
          ))}
        </select>

        {/* Mood */}
        <select
          value={filterMood}
          onChange={(e) => setFilterMood(e.target.value)}
          style={filterSelectStyle}
        >
          <option value="all">Alle Stimmungen</option>
          <option value="5">🔥 Hervorragend</option>
          <option value="4">😊 Gut</option>
          <option value="3">🙂 Normal</option>
          <option value="2">😐 Geht so</option>
          <option value="1">😴 Müde</option>
        </select>

        {/* Tag */}
        <select
          value={filterTag}
          onChange={(e) => setFilterTag(e.target.value)}
          style={filterSelectStyle}
        >
          <option value="all">Alle Tags</option>
          {tags.map(t => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>

        {/* Reset */}
        <button
          onClick={() => {
            setFilterDateRange('all');
            setFilterProject('all');
            setFilterMood('all');
            setFilterTag('all');
            setSearchQuery('');
          }}
          style={{
            padding: '8px 12px',
            background: 'rgba(255,100,100,0.2)',
            border: '1px solid rgba(255,100,100,0.3)',
            borderRadius: '6px',
            color: '#f88',
            cursor: 'pointer',
            fontSize: '0.8rem',
          }}
        >
          Zurücksetzen
        </button>
      </div>

      {/* Entries */}
      {filteredEntries.length === 0 ? (
        <div style={{
          textAlign: 'center',
          padding: '60px 20px',
          color: '#666',
        }}>
          <p style={{ fontSize: '3rem', margin: '0 0 10px' }}>📝</p>
          <p>Keine Journal-Einträge gefunden</p>
          <p style={{ fontSize: '0.85rem', marginTop: '10px' }}>
            Importiere deine Abend-Reviews aus den Memory-Dateien
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {filteredEntries.map((entry) => {
            const linkedSessions = getLinkedSessions(entry);
            const achievements = entry.highlights?.filter(h => h.type === 'achievement') || [];
            const blockers = entry.highlights?.filter(h => h.type === 'blocker') || [];
            const nextSteps = entry.highlights?.filter(h => h.type === 'next') || [];

            return (
              <div
                key={entry.id}
                style={{
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: '16px',
                  padding: '20px',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
                onClick={() => setSelectedEntry(selectedEntry === entry.id ? null : entry.id)}
              >
                {/* Header */}
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  marginBottom: '12px',
                }}>
                  <div>
                    <h3 style={{ margin: '0 0 5px', color: '#fff', fontSize: '1rem' }}>
                      📅 {formatDate(entry.date)}
                    </h3>
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                      {entry.projects?.map(p => (
                        <span key={p} style={projectBadgeStyle}>
                          {p}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <span style={{ fontSize: '1.5rem' }}>
                      {MOOD_EMOJIS[entry.summary?.mood - 1] || '😐'}
                    </span>
                    <span style={{ fontSize: '1.2rem', marginLeft: '5px', opacity: 0.7 }}>
                      {MOOD_EMOJIS[entry.summary?.energy - 1] || '😐'}
                    </span>
                  </div>
                </div>

                {/* Summary */}
                <p style={{ margin: '0 0 15px', color: '#ccc', lineHeight: '1.5' }}>
                  {entry.summary?.text || entry.content?.substring(0, 200) + '...'}
                </p>

                {/* Tags */}
                {entry.tags?.length > 0 && (
                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '12px' }}>
                    {entry.tags.slice(0, 8).map(tag => (
                      <span key={tag} style={tagStyle}>
                        {tag}
                      </span>
                    ))}
                  </div>
                )}

                {/* Quick Stats */}
                <div style={{
                  display: 'flex',
                  gap: '15px',
                  flexWrap: 'wrap',
                  fontSize: '0.8rem',
                  color: '#888',
                  marginBottom: selectedEntry === entry.id ? '15px' : '0',
                }}>
                  {linkedSessions.length > 0 && (
                    <span>⏱️ {linkedSessions.reduce((a, s) => a + (s.duration || 0), 0) / 60}h gearbeitet</span>
                  )}
                  {achievements.length > 0 && <span style={{ color: '#95E881' }}>✅ {achievements.length} Erfolge</span>}
                  {blockers.length > 0 && <span style={{ color: '#f66' }}>🔴 {blockers.length} Blocker</span>}
                  {entry.finances?.openInvoices > 0 && (
                    <span style={{ color: '#FF6B35' }}>💰 {entry.finances.openInvoices.toLocaleString('de-DE')}€ offen</span>
                  )}
                </div>

                {/* Expanded Details */}
                {selectedEntry === entry.id && (
                  <div style={{ marginTop: '15px', paddingTop: '15px', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                    {/* Highlights */}
                    {entry.highlights?.length > 0 && (
                      <div style={{ marginBottom: '15px' }}>
                        <h4 style={{ margin: '0 0 10px', color: '#888', fontSize: '0.85rem' }}>Highlights</h4>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                          {entry.highlights.map((h, i) => (
                            <div key={i} style={{
                              display: 'flex',
                              alignItems: 'flex-start',
                              gap: '8px',
                              padding: '8px',
                              background: 'rgba(255,255,255,0.02)',
                              borderRadius: '6px',
                            }}>
                              <span>{getHighlightIcon(h.type)}</span>
                              <span style={{ color: '#ccc', fontSize: '0.9rem' }}>{h.text}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Linked Sessions */}
                    {linkedSessions.length > 0 && (
                      <div style={{ marginBottom: '15px' }}>
                        <h4 style={{ margin: '0 0 10px', color: '#888', fontSize: '0.85rem' }}>Verknüpfte Sessions</h4>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                          {linkedSessions.map(s => (
                            <div key={s.id} style={{
                              padding: '8px 12px',
                              background: 'rgba(78,205,196,0.1)',
                              borderRadius: '6px',
                              fontSize: '0.85rem',
                              color: '#4ECDC4',
                            }}>
                              {s.projectId} · {(s.duration / 60).toFixed(1)}h · {MOOD_EMOJIS[s.mood - 1]}
                              {s.notes && <span style={{ color: '#666', marginLeft: '8px' }}>📝</span>}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Todos */}
                    {(entry.todos?.completed?.length > 0 || entry.todos?.created?.length > 0) && (
                      <div>
                        <h4 style={{ margin: '0 0 10px', color: '#888', fontSize: '0.85rem' }}>Todos</h4>
                        {entry.todos.completed.length > 0 && (
                          <div style={{ marginBottom: '8px' }}>
                            <span style={{ color: '#666', fontSize: '0.8rem' }}>✅ Erledigt:</span>
                            <div style={{ marginLeft: '10px', color: '#95E881', fontSize: '0.85rem' }}>
                              {entry.todos.completed.slice(0, 5).join(', ')}
                              {entry.todos.completed.length > 5 && ` +${entry.todos.completed.length - 5} weitere`}
                            </div>
                          </div>
                        )}
                        {entry.todos.created.length > 0 && (
                          <div>
                            <span style={{ color: '#666', fontSize: '0.8rem' }}>📋 Neu:</span>
                            <div style={{ marginLeft: '10px', color: '#4ECDC4', fontSize: '0.85rem' }}>
                              {entry.todos.created.slice(0, 5).join(', ')}
                              {entry.todos.created.length > 5 && ` +${entry.todos.created.length - 5} weitere`}
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Full Content */}
                    <details style={{ marginTop: '15px' }}>
                      <summary style={{ color: '#888', cursor: 'pointer', fontSize: '0.85rem' }}>
                        Vollständiger Eintrag anzeigen
                      </summary>
                      <pre style={{
                        marginTop: '10px',
                        padding: '15px',
                        background: 'rgba(0,0,0,0.3)',
                        borderRadius: '8px',
                        color: '#888',
                        fontSize: '0.85rem',
                        whiteSpace: 'pre-wrap',
                        wordBreak: 'break-word',
                      }}>
                        {entry.content}
                      </pre>
                    </details>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

const filterSelectStyle = {
  padding: '8px 12px',
  background: 'rgba(0,0,0,0.3)',
  border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: '6px',
  color: '#fff',
  fontSize: '0.85rem',
  fontFamily: 'inherit',
  cursor: 'pointer',
};

const projectBadgeStyle = {
  padding: '4px 10px',
  background: 'rgba(78,205,196,0.2)',
  borderRadius: '4px',
  color: '#4ECDC4',
  fontSize: '0.75rem',
  fontWeight: 500,
};

const tagStyle = {
  padding: '3px 8px',
  background: 'rgba(255,107,53,0.15)',
  borderRadius: '4px',
  color: '#FF6B35',
  fontSize: '0.75rem',
};
