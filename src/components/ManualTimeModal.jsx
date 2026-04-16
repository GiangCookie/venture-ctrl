import React, { useState } from 'react';

export default function ManualTimeModal({ projects, moodEmojis, onClose, onSave }) {
  const [projectId, setProjectId] = useState(projects[0]?.id || '');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [startTime, setStartTime] = useState('09:00');
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [endTime, setEndTime] = useState('10:00');
  const [mood, setMood] = useState(3);
  const [description, setDescription] = useState('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState(null);

  const handleSubmit = (e) => {
    e.preventDefault();
    setError(null);

    const startDateTime = new Date(`${startDate}T${startTime}`);
    const endDateTime = new Date(`${endDate}T${endTime}`);

    if (endDateTime <= startDateTime) {
      setError('Endzeit muss nach der Startzeit liegen.');
      return;
    }

    if (endDateTime > new Date()) {
      setError('Endzeit kann nicht in der Zukunft liegen.');
      return;
    }

    onSave({
      projectId,
      startTime: startDateTime.toISOString(),
      endTime: endDateTime.toISOString(),
      mood,
      description,
      notes,
    });
  };

  const getProjectInfo = (id) => projects.find(p => p.id === id) || { name: id, color: '#888', emoji: '📁' };

  return (
    <div style={modalOverlayStyle}>
      <div style={modalContentStyle}>
        <h3 style={{ margin: '0 0 20px', color: '#fff' }}>
          ➕ Manuelle Zeiterfassung
        </h3>

        {error && (
          <div style={errorStyle}>
            ⚠️ {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={formGroupStyle}>
            <label style={labelStyle}>Projekt:</label>
            <select
              value={projectId}
              onChange={(e) => setProjectId(e.target.value)}
              style={selectStyle}
            >
              {projects.map(p => (
                <option key={p.id} value={p.id}>
                  {p.emoji} {p.name}
                </option>
              ))}
            </select>
          </div>

          <div style={formGroupStyle}>
            <label style={labelStyle}>Startzeit:</label>
            <div style={{ display: 'flex', gap: '10px' }}>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                style={{ ...inputStyle, flex: 1 }}
                required
              />
              <input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                style={{ ...inputStyle, width: '100px' }}
                required
              />
            </div>
          </div>

          <div style={formGroupStyle}>
            <label style={labelStyle}>Endzeit:</label>
            <div style={{ display: 'flex', gap: '10px' }}>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                style={{ ...inputStyle, flex: 1 }}
                required
              />
              <input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                style={{ ...inputStyle, width: '100px' }}
                required
              />
            </div>
          </div>

          <div style={formGroupStyle}>
            <label style={labelStyle}>Energie-Level:</label>
            <div style={{ display: 'flex', gap: '8px' }}>
              {moodEmojis.map((emoji, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setMood(i + 1)}
                  style={{
                    ...moodButtonStyle,
                    background: mood === i + 1 ? 'rgba(78,205,196,0.3)' : 'rgba(255,255,255,0.05)',
                    borderColor: mood === i + 1 ? '#4ECDC4' : 'transparent',
                  }}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>

          <div style={formGroupStyle}>
            <label style={labelStyle}>Beschreibung:</label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="z.B. 'Kono Video 2 schneiden'"
              style={inputStyle}
            />
          </div>

          <div style={formGroupStyle}>
            <label style={labelStyle}>Notizen (optional):</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Weitere Details..."
              style={{ ...inputStyle, minHeight: '60px', resize: 'vertical' }}
            />
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
              Zeit eintragen
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
  maxWidth: '400px',
  maxHeight: '90vh',
  overflowY: 'auto',
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

const inputStyle = {
  padding: '10px',
  background: 'rgba(0,0,0,0.3)',
  border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: '8px',
  color: '#fff',
  fontSize: '0.9rem',
  fontFamily: 'inherit',
  boxSizing: 'border-box',
};

const moodButtonStyle = {
  flex: 1,
  padding: '10px',
  border: '2px solid transparent',
  borderRadius: '8px',
  background: 'rgba(255,255,255,0.05)',
  fontSize: '1.2rem',
  cursor: 'pointer',
  transition: 'all 0.2s',
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
