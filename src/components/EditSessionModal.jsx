import React, { useState, useEffect } from 'react';

export default function EditSessionModal({ session, projects, moodEmojis, onClose, onSave, onDelete }) {
  const [projectId, setProjectId] = useState(session?.projectId || projects[0]?.id || '');
  const [startDate, setStartDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endDate, setEndDate] = useState('');
  const [endTime, setEndTime] = useState('');
  const [mood, setMood] = useState(session?.mood || 3);
  const [description, setDescription] = useState(session?.description || '');
  const [notes, setNotes] = useState(session?.notes || '');
  const [error, setError] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    if (session) {
      const start = new Date(session.startTime);
      const end = new Date(session.endTime);
      
      setStartDate(start.toISOString().split('T')[0]);
      setStartTime(start.toTimeString().slice(0, 5));
      setEndDate(end.toISOString().split('T')[0]);
      setEndTime(end.toTimeString().slice(0, 5));
    }
  }, [session]);

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

    onSave(session.id, {
      projectId,
      startTime: startDateTime.toISOString(),
      endTime: endDateTime.toISOString(),
      mood,
      description,
      notes,
    });
  };

  const handleDelete = () => {
    onDelete(session.id);
  };

  const calculateDuration = () => {
    const start = new Date(`${startDate}T${startTime}`);
    const end = new Date(`${endDate}T${endTime}`);
    if (end <= start) return 0;
    return Math.floor((end - start) / 1000 / 60);
  };

  const duration = calculateDuration();
  const durationHours = (duration / 60).toFixed(1);

  const getProjectInfo = (id) => projects.find(p => p.id === id) || { name: id, color: '#888', emoji: '📁' };

  return (
    <div style={modalOverlayStyle}>
      <div style={modalContentStyle}>
        <h3 style={{ margin: '0 0 20px', color: '#fff' }}>
          ✏️ Session bearbeiten
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

          {duration > 0 && (
            <div style={durationPreviewStyle}>
              <span style={{ color: '#888' }}>Dauer:</span>
              <span style={{ color: '#4ECDC4', fontWeight: 600 }}>
                {durationHours}h ({duration} Min)
              </span>
            </div>
          )}

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
              placeholder="Was hast du gemacht?"
              style={inputStyle}
            />
          </div>

          <div style={formGroupStyle}>
            <label style={labelStyle}>Notizen:</label>
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
                ⚠️ Session wirklich löschen?
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
  maxWidth: '400px',
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

const durationPreviewStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: '10px 15px',
  background: 'rgba(78,205,196,0.1)',
  borderRadius: '8px',
  marginBottom: '15px',
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
