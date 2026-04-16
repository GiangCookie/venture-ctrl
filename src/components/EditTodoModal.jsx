import React, { useState, useEffect } from 'react';

const PROJECTS = [
  { id: 'tough-cookie', name: 'Tough Cookie', color: '#FF6B35', emoji: '🍪' },
  { id: 'nomu', name: 'NOMU', color: '#4ECDC4', emoji: '📱' },
  { id: 'kyberg', name: 'Kyberg Export', color: '#95E881', emoji: '💊' },
  { id: 'freelance', name: 'Freelance', color: '#A855F7', emoji: '🎬' },
  { id: 'export', name: 'Export', color: '#FFD93D', emoji: '📦' },
];

const PRIORITIES = [
  { value: '🔴 Urgent', label: '🔴 Kritisch', color: '#f66' },
  { value: '🟡 High', label: '🟡 Hoch', color: '#FFD93D' },
  { value: '🟢 Normal', label: '🟢 Normal', color: '#95E881' },
  { value: '⚪ Low', label: '⚪ Niedrig', color: '#888' },
];

const STATUSES = [
  { value: '⏳ Offen', label: '⏳ Offen' },
  { value: '🔄 In Progress', label: '🔄 In Bearbeitung' },
  { value: '✅ Fertig', label: '✅ Fertig' },
  { value: '❌ Blocked', label: '⛔ Blockiert' },
];

export default function EditTodoModal({ todo, onClose, onSave, onDelete }) {
  const [text, setText] = useState('');
  const [projectId, setProjectId] = useState('');
  const [priority, setPriority] = useState('🟢 Normal');
  const [status, setStatus] = useState('⏳ Offen');
  const [deadline, setDeadline] = useState('');
  const [tags, setTags] = useState('');
  const [error, setError] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    if (todo) {
      setText(todo.text || '');
      setProjectId(todo.project || '');
      setPriority(todo.priority || '🟢 Normal');
      setStatus(todo.status || '⏳ Offen');
      setDeadline(todo.deadline || '');
      setTags(todo.tags?.join(', ') || '');
    }
  }, [todo]);

  const handleSubmit = (e) => {
    e.preventDefault();
    setError(null);

    if (!text.trim()) {
      setError('Bitte gib einen Text für das To-Do ein.');
      return;
    }

    const updates = {
      text: text.trim(),
      project: projectId || null,
      priority,
      status,
      deadline: deadline || null,
      tags: tags.split(',').map(t => t.trim()).filter(t => t),
      completed: status === '✅ Fertig',
    };

    if (status === '✅ Fertig' && !todo?.completed) {
      updates.completedAt = new Date().toISOString();
    } else if (status !== '✅ Fertig') {
      updates.completedAt = null;
    }

    onSave(updates);
  };

  const handleDelete = () => {
    onDelete();
  };

  const getProjectInfo = (id) => PROJECTS.find(p => p.id === id) || { name: id, color: '#888', emoji: '📁' };

  return (
    <div style={modalOverlayStyle}>
      <div style={modalContentStyle}>
        <h3 style={{ margin: '0 0 20px', color: '#fff' }}>
          ✏️ To-Do bearbeiten
        </h3>

        {error && (
          <div style={errorStyle}>
            ⚠️ {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={formGroupStyle}>
            <label style={labelStyle}>Aufgabe:</label>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Was muss erledigt werden?"
              style={{ ...inputStyle, minHeight: '60px', resize: 'vertical' }}
              required
            />
          </div>

          <div style={formGroupStyle}>
            <label style={labelStyle}>Projekt:</label>
            <select
              value={projectId}
              onChange={(e) => setProjectId(e.target.value)}
              style={selectStyle}
            >
              <option value="">Kein Projekt</option>
              {PROJECTS.map(p => (
                <option key={p.id} value={p.id}>
                  {p.emoji} {p.name}
                </option>
              ))}
            </select>
          </div>

          <div style={formGroupStyle}>
            <label style={labelStyle}>Priorität:</label>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {PRIORITIES.map(p => (
                <button
                  key={p.value}
                  type="button"
                  onClick={() => setPriority(p.value)}
                  style={{
                    ...priorityButtonStyle,
                    background: priority === p.value ? `${p.color}30` : 'rgba(255,255,255,0.05)',
                    borderColor: priority === p.value ? p.color : 'transparent',
                    color: priority === p.value ? p.color : '#888',
                  }}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          <div style={formGroupStyle}>
            <label style={labelStyle}>Status:</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              style={selectStyle}
            >
              {STATUSES.map(s => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>

          <div style={formGroupStyle}>
            <label style={labelStyle}>Deadline:</label>
            <input
              type="date"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
              style={inputStyle}
            />
          </div>

          <div style={formGroupStyle}>
            <label style={labelStyle}>Tags (kommagetrennt):</label>
            <input
              type="text"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="z.B. urgent, video, meeting"
              style={inputStyle}
            />
            <div style={{ marginTop: '8px', display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
              {['video', 'meeting', 'finance', 'urgent', 'planning'].map(tag => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => {
                    const currentTags = tags.split(',').map(t => t.trim()).filter(t => t);
                    if (!currentTags.includes(tag)) {
                      setTags([...currentTags, tag].join(', '));
                    }
                  }}
                  style={quickTagStyle}
                >
                  +{tag}
                </button>
              ))}
            </div>
          </div>

          <div style={modalActionsStyle}>
            <button
              type="submit"
              style={{
                ...modalButtonStyle,
                background: '#4ECDC4',
                color: '#000',
              }}
            >
              Speichern
            </button>
            <button
              type="button"
              onClick={() => setShowDeleteConfirm(true)}
              style={{
                ...modalButtonStyle,
                background: 'rgba(255,100,100,0.2)',
                color: '#f66',
              }}
            >
              Löschen
            </button>
            <button
              type="button"
              onClick={onClose}
              style={modalButtonStyle}
            >
              Abbrechen
            </button>
          </div>
        </form>

        {/* Delete Confirmation */}
        {showDeleteConfirm && (
          <div style={deleteConfirmOverlayStyle}>
            <div style={deleteConfirmStyle}>
              <p style={{ color: '#f66', fontWeight: 600, marginBottom: '10px' }}>
                ⚠️ To-Do wirklich löschen?
              </p>
              <p style={{ color: '#888', fontSize: '0.85rem', marginBottom: '15px' }}>
                Diese Aktion kann nicht rückgängig gemacht werden.
              </p>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  onClick={handleDelete}
                  style={{
                    ...modalButtonStyle,
                    background: '#f66',
                    color: '#fff',
                  }}
                >
                  Ja, löschen
                </button>
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  style={modalButtonStyle}
                >
                  Abbrechen
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

const modalOverlayStyle = {
  position: 'fixed',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  background: 'rgba(0,0,0,0.8)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 2000,
};

const modalContentStyle = {
  background: '#1a1a2e',
  border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: '16px',
  padding: '25px',
  width: '90%',
  maxWidth: '450px',
  maxHeight: '90vh',
  overflowY: 'auto',
  position: 'relative',
};

const errorStyle = {
  padding: '10px 15px',
  background: 'rgba(255,100,100,0.1)',
  border: '1px solid rgba(255,100,100,0.3)',
  borderRadius: '8px',
  color: '#f66',
  fontSize: '0.85rem',
  marginBottom: '15px',
};

const formGroupStyle = {
  marginBottom: '15px',
};

const labelStyle = {
  display: 'block',
  color: '#888',
  fontSize: '0.85rem',
  marginBottom: '8px',
};

const inputStyle = {
  width: '100%',
  padding: '10px',
  background: 'rgba(0,0,0,0.3)',
  border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: '8px',
  color: '#fff',
  fontSize: '0.9rem',
  fontFamily: 'inherit',
  boxSizing: 'border-box',
};

const selectStyle = {
  width: '100%',
  padding: '10px',
  background: 'rgba(0,0,0,0.3)',
  border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: '8px',
  color: '#fff',
  fontSize: '0.9rem',
  fontFamily: 'inherit',
};

const priorityButtonStyle = {
  padding: '8px 12px',
  border: '2px solid transparent',
  borderRadius: '6px',
  background: 'rgba(255,255,255,0.05)',
  fontSize: '0.8rem',
  cursor: 'pointer',
  transition: 'all 0.2s',
};

const quickTagStyle = {
  padding: '4px 8px',
  background: 'rgba(255,107,53,0.2)',
  border: '1px solid rgba(255,107,53,0.3)',
  borderRadius: '4px',
  color: '#FF6B35',
  fontSize: '0.75rem',
  cursor: 'pointer',
  fontFamily: 'inherit',
};

const modalActionsStyle = {
  display: 'flex',
  gap: '10px',
  marginTop: '20px',
};

const modalButtonStyle = {
  flex: 1,
  padding: '12px',
  border: 'none',
  borderRadius: '8px',
  fontSize: '0.9rem',
  fontWeight: 500,
  cursor: 'pointer',
  fontFamily: 'inherit',
};

const deleteConfirmOverlayStyle = {
  position: 'absolute',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  background: 'rgba(0,0,0,0.9)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  borderRadius: '16px',
};

const deleteConfirmStyle = {
  textAlign: 'center',
  padding: '20px',
};
