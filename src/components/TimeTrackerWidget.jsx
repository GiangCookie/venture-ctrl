import React, { useState, useEffect } from 'react';
import { useTimeTracker } from '../hooks/useTimeTracker';
import ManualTimeModal from './ManualTimeModal';
import EditSessionModal from './EditSessionModal';

const PROJECTS = [
  { id: 'tough-cookie', name: 'Tough Cookie', color: '#FF6B35', emoji: '🍪' },
  { id: 'nomu', name: 'NOMU', color: '#4ECDC4', emoji: '📱' },
  { id: 'kyberg', name: 'Kyberg Export', color: '#95E881', emoji: '💊' },
  { id: 'freelance', name: 'Freelance', color: '#A855F7', emoji: '🎬' },
  { id: 'export', name: 'Export', color: '#FFD93D', emoji: '📦' },
];

const MOOD_EMOJIS = ['😴', '😐', '🙂', '😊', '🔥'];

export default function TimeTrackerWidget({ position = 'floating' }) {
  const {
    activeSession,
    runningTime,
    todaySessions,
    todaySummary,
    startSession,
    stopSession,
    createManualSession,
    editSession,
    deleteSession,
    formattedRunningTime,
    todayTotal,
    formatDuration,
    tracker,
  } = useTimeTracker();

  const [showStartModal, setShowStartModal] = useState(false);
  const [showManualModal, setShowManualModal] = useState(false);
  const [showStopConfirm, setShowStopConfirm] = useState(false);
  const [selectedProject, setSelectedProject] = useState(PROJECTS[0].id);
  const [selectedMood, setSelectedMood] = useState(3);
  const [sessionNotes, setSessionNotes] = useState('');
  const [editingSession, setEditingSession] = useState(null);
  const [expandedSummary, setExpandedSummary] = useState(false);

  const total = todayTotal();

  const handleStartSession = () => {
    const result = startSession(selectedProject, selectedMood);
    if (result.success) {
      setShowStartModal(false);
      setSessionNotes('');
    } else {
      alert(result.error);
    }
  };

  const handleStopSession = () => {
    const result = stopSession(sessionNotes);
    if (result.success) {
      setShowStopConfirm(false);
      setSessionNotes('');
    } else {
      alert(result.error);
    }
  };

  const getProjectInfo = (projectId) => {
    return PROJECTS.find(p => p.id === projectId) || {
      id: projectId,
      name: projectId,
      color: '#888',
      emoji: '📁',
    };
  };

  const formatTime = (seconds) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Floating widget style
  if (position === 'floating') {
    return (
      <>
        <div
          style={{
            position: 'fixed',
            top: '20px',
            right: '20px',
            zIndex: 1000,
            ...floatingContainerStyle,
          }}
        >
          {activeSession ? (
            <div
              style={{
                ...activeSessionStyle,
                borderColor: getProjectInfo(activeSession.projectId).color,
              }}
            >
              <div style={activeSessionHeaderStyle}>
                <span style={{ color: '#f66', fontWeight: 700 }}>🔴 LIVE</span>
                <span style={{ color: '#888', fontSize: '0.75rem' }}>
                  {getProjectInfo(activeSession.projectId).emoji} {getProjectInfo(activeSession.projectId).name}
                </span>
              </div>

              <div style={timerStyle}>
                {formattedRunningTime()}
              </div>

              <div style={moodStyle}>
                Mood: {MOOD_EMOJIS[activeSession.mood - 1]}
              </div>

              <button
                onClick={() => setShowStopConfirm(true)}
                style={{
                  ...stopButtonStyle,
                  background: '#f66',
                }}
              >
                ⏹️ Session beenden
              </button>
            </div>
          ) : (
            <div style={inactiveSessionStyle}>
              <div style={{ marginBottom: '10px', color: '#666' }}>
                ⏱️ Keine aktive Session
              </div>
              <button
                onClick={() => setShowStartModal(true)}
                style={startButtonStyle}
              >
                ▶️ Session starten
              </button>
            </div>
          )}

          {/* Today's Summary */}
          <div style={summaryStyle}>
            <div
              style={summaryHeaderStyle}
              onClick={() => setExpandedSummary(!expandedSummary)}
            >
              <span>📊 Heute: {total.formatted}</span>
              <span style={{ color: '#666' }}>{expandedSummary ? '▼' : '▶'}</span>
            </div>

            {expandedSummary && (
              <div style={summaryDetailsStyle}>
                {todaySummary.length === 0 ? (
                  <div style={{ color: '#666', fontSize: '0.85rem', textAlign: 'center', padding: '10px' }}>
                    Noch keine Sessions heute
                  </div>
                ) : (
                  todaySummary.map((item) => {
                    const project = getProjectInfo(item.projectId);
                    return (
                      <div key={item.projectId} style={summaryItemStyle}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span>{project.emoji}</span>
                          <span style={{ color: project.color, fontSize: '0.85rem' }}>
                            {project.name}
                          </span>
                        </div>
                        <span style={{ color: '#fff', fontWeight: 600 }}>
                          {item.hours}h
                        </span>
                      </div>
                    );
                  })
                )}

                {todaySessions.length > 0 && (
                  <div style={{ marginTop: '10px', paddingTop: '10px', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                    <p style={{ color: '#888', fontSize: '0.75rem', margin: '0 0 8px' }}>
                      Letzte Sessions:
                    </p>
                    {todaySessions.slice(-3).map(session => (
                      <div key={session.id} style={miniSessionStyle}>
                        <span style={{ fontSize: '0.8rem' }}>
                          {getProjectInfo(session.projectId).emoji} {formatDuration(session.duration)}
                        </span>
                        <button
                          onClick={() => setEditingSession(session)}
                          style={miniEditButtonStyle}
                        >
                          ✏️
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Quick Actions */}
          <div style={quickActionsStyle}>
            <button
              onClick={() => setShowManualModal(true)}
              style={quickActionButtonStyle}
            >
              ➕ Manuelle Zeit
            </button>
          </div>
        </div>

        {/* Start Session Modal */}
        {showStartModal && (
          <div style={modalOverlayStyle}>
            <div style={modalContentStyle}>
              <h3 style={{ margin: '0 0 20px', color: '#fff' }}>
                ▶️ Neue Session starten
              </h3>

              <div style={formGroupStyle}>
                <label style={labelStyle}>Projekt:</label>
                <select
                  value={selectedProject}
                  onChange={(e) => setSelectedProject(e.target.value)}
                  style={selectStyle}
                >
                  {PROJECTS.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.emoji} {p.name}
                    </option>
                  ))}
                </select>
              </div>

              <div style={formGroupStyle}>
                <label style={labelStyle}>Energie-Level:</label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  {MOOD_EMOJIS.map((emoji, i) => (
                    <button
                      key={i}
                      onClick={() => setSelectedMood(i + 1)}
                      style={{
                        ...moodButtonStyle,
                        background: selectedMood === i + 1 ? 'rgba(78,205,196,0.3)' : 'rgba(255,255,255,0.05)',
                        borderColor: selectedMood === i + 1 ? '#4ECDC4' : 'transparent',
                      }}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>

              <div style={modalActionsStyle}>
                <button
                  onClick={handleStartSession}
                  style={{
                    ...modalButtonStyle,
                    background: '#4ECDC4',
                    color: '#000',
                  }}
                >
                  Session starten
                </button>
                <button
                  onClick={() => setShowStartModal(false)}
                  style={modalButtonStyle}
                >
                  Abbrechen
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Stop Session Modal */}
        {showStopConfirm && (
          <div style={modalOverlayStyle}>
            <div style={modalContentStyle}>
              <h3 style={{ margin: '0 0 20px', color: '#fff' }}>
                ⏹️ Session beenden
              </h3>

              <p style={{ color: '#888', marginBottom: '15px' }}>
                Laufzeit: <strong>{formattedRunningTime()}</strong>
              </p>

              <div style={formGroupStyle}>
                <label style={labelStyle}>Notizen (optional):</label>
                <textarea
                  value={sessionNotes}
                  onChange={(e) => setSessionNotes(e.target.value)}
                  placeholder="Was hast du gemacht?"
                  style={{
                    ...inputStyle,
                    minHeight: '80px',
                    resize: 'vertical',
                  }}
                />
              </div>

              <div style={modalActionsStyle}>
                <button
                  onClick={handleStopSession}
                  style={{
                    ...modalButtonStyle,
                    background: '#f66',
                    color: '#fff',
                  }}
                >
                  Session beenden
                </button>
                <button
                  onClick={() => setShowStopConfirm(false)}
                  style={modalButtonStyle}
                >
                  Abbrechen
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Manual Time Modal */}
        {showManualModal && (
          <ManualTimeModal
            projects={PROJECTS}
            moodEmojis={MOOD_EMOJIS}
            onClose={() => setShowManualModal(false)}
            onSave={(data) => {
              const result = createManualSession(
                data.projectId,
                data.startTime,
                data.endTime,
                data.mood,
                data.description,
                data.notes
              );
              if (result.success) {
                setShowManualModal(false);
              } else {
                alert(result.error);
              }
            }}
          />
        )}

        {/* Edit Session Modal */}
        {editingSession && (
          <EditSessionModal
            session={editingSession}
            projects={PROJECTS}
            moodEmojis={MOOD_EMOJIS}
            onClose={() => setEditingSession(null)}
            onSave={(id, updates) => {
              const result = editSession(id, updates);
              if (result.success) {
                setEditingSession(null);
              } else {
                alert(result.error);
              }
            }}
            onDelete={(id) => {
              deleteSession(id);
              setEditingSession(null);
            }}
          />
        )}
      </>
    );
  }

  // Inline widget style
  return (
    <div style={inlineWidgetStyle}>
      {/* Same content as floating but in inline layout */}
    </div>
  );
}

// Styles
const floatingContainerStyle = {
  width: '280px',
  background: 'rgba(10,10,15,0.95)',
  border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: '16px',
  padding: '15px',
  backdropFilter: 'blur(10px)',
  boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
};

const activeSessionStyle = {
  padding: '15px',
  background: 'rgba(255,107,53,0.1)',
  border: '2px solid',
  borderRadius: '12px',
  marginBottom: '15px',
};

const activeSessionHeaderStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: '10px',
};

const timerStyle = {
  fontSize: '2rem',
  fontWeight: 700,
  color: '#fff',
  fontFamily: 'monospace',
  textAlign: 'center',
  marginBottom: '5px',
};

const moodStyle = {
  textAlign: 'center',
  color: '#888',
  fontSize: '0.85rem',
  marginBottom: '15px',
};

const stopButtonStyle = {
  width: '100%',
  padding: '12px',
  border: 'none',
  borderRadius: '8px',
  color: '#fff',
  fontSize: '0.9rem',
  fontWeight: 600,
  cursor: 'pointer',
  fontFamily: 'inherit',
};

const inactiveSessionStyle = {
  padding: '15px',
  background: 'rgba(255,255,255,0.03)',
  border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: '12px',
  marginBottom: '15px',
  textAlign: 'center',
};

const startButtonStyle = {
  width: '100%',
  padding: '12px',
  background: '#4ECDC4',
  border: 'none',
  borderRadius: '8px',
  color: '#000',
  fontSize: '0.9rem',
  fontWeight: 600,
  cursor: 'pointer',
  fontFamily: 'inherit',
};

const summaryStyle = {
  background: 'rgba(255,255,255,0.03)',
  borderRadius: '8px',
  overflow: 'hidden',
};

const summaryHeaderStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: '10px 12px',
  background: 'rgba(255,255,255,0.05)',
  cursor: 'pointer',
  color: '#fff',
  fontSize: '0.85rem',
  fontWeight: 500,
};

const summaryDetailsStyle = {
  padding: '10px 12px',
};

const summaryItemStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: '6px 0',
  borderBottom: '1px solid rgba(255,255,255,0.05)',
};

const miniSessionStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: '4px 0',
};

const miniEditButtonStyle = {
  background: 'none',
  border: 'none',
  color: '#666',
  cursor: 'pointer',
  fontSize: '0.7rem',
  padding: '2px',
};

const quickActionsStyle = {
  marginTop: '15px',
  display: 'flex',
  gap: '8px',
};

const quickActionButtonStyle = {
  flex: 1,
  padding: '8px',
  background: 'rgba(255,255,255,0.05)',
  border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: '6px',
  color: '#888',
  fontSize: '0.75rem',
  cursor: 'pointer',
  fontFamily: 'inherit',
};

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

const inlineWidgetStyle = {
  background: 'rgba(255,255,255,0.03)',
  border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: '16px',
  padding: '20px',
};
