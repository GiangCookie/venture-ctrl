import React, { useState, useMemo } from 'react';

const QUARTERS = ['Q1', 'Q2', 'Q3', 'Q4'];

export default function OKRTracking({ data, projectMetrics }) {
  const [selectedQuarter, setSelectedQuarter] = useState(getCurrentQuarter());
  const [showAddOKR, setShowAddOKR] = useState(false);
  const [okrs, setOkrs] = useState(() => {
    const saved = localStorage.getItem('venture-okrs');
    return saved ? JSON.parse(saved) : [];
  });

  // Save OKRs to localStorage
  React.useEffect(() => {
    localStorage.setItem('venture-okrs', JSON.stringify(okrs));
  }, [okrs]);

  const filteredOKRs = useMemo(() => {
    return okrs.filter(okr => okr.quarter === selectedQuarter);
  }, [okrs, selectedQuarter]);

  const addOKR = (okr) => {
    setOkrs(prev => [...prev, { ...okr, id: Date.now(), createdAt: new Date().toISOString() }]);
    setShowAddOKR(false);
  };

  const updateProgress = (id, progress) => {
    setOkrs(prev => prev.map(o => o.id === id ? { ...o, currentValue: progress } : o));
  };

  const deleteOKR = (id) => {
    setOkrs(prev => prev.filter(o => o.id !== id));
  };

  const calculateProgress = (okr) => {
    if (okr.targetValue === 0) return 0;
    const progress = (okr.currentValue / okr.targetValue) * 100;
    return Math.min(100, Math.max(0, progress));
  };

  const getStatusColor = (progress) => {
    if (progress >= 100) return '#95E881';
    if (progress >= 70) return '#4ECDC4';
    if (progress >= 40) return '#FFD93D';
    return '#f66';
  };

  const groupedByProject = useMemo(() => {
    const grouped = {};
    filteredOKRs.forEach(okr => {
      if (!grouped[okr.projectId]) {
        grouped[okr.projectId] = [];
      }
      grouped[okr.projectId].push(okr);
    });
    return grouped;
  }, [filteredOKRs]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '15px',
      }}>
        <h2 style={{ margin: 0, color: '#fff', fontSize: '1.3rem' }}>
          🎯 OKR Tracking
        </h2>

        <div style={{ display: 'flex', gap: '10px' }}>
          <select
            value={selectedQuarter}
            onChange={(e) => setSelectedQuarter(e.target.value)}
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
            {QUARTERS.map(q => (
              <option key={q} value={q}>{q} 2026</option>
            ))}
          </select>

          <button
            onClick={() => setShowAddOKR(true)}
            style={{
              padding: '10px 18px',
              background: '#4ECDC4',
              border: 'none',
              borderRadius: '8px',
              color: '#000',
              cursor: 'pointer',
              fontWeight: 600,
            }}
          >
            ➕ OKR hinzufügen
          </button>
        </div>
      </div>

      {/* Add OKR Form */}
      {showAddOKR && (
        <OKRForm
          quarter={selectedQuarter}
          projects={Object.keys(projectMetrics).map(k => projectMetrics[k]?.projectId || k)}
          onAdd={addOKR}
          onCancel={() => setShowAddOKR(false)}
        />
      )}

      {/* Summary Stats */}
      {filteredOKRs.length > 0 && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
          gap: '12px',
        }}>
          <div style={{
            background: 'rgba(255,255,255,0.03)',
            borderRadius: '12px',
            padding: '16px',
          }}>
            <p style={{ margin: 0, color: '#888', fontSize: '0.75rem', textTransform: 'uppercase' }}>Gesamt OKRs</p>
            <p style={{ margin: '8px 0 0', fontSize: '1.8rem', fontWeight: 700, color: '#4ECDC4' }}>
              {filteredOKRs.length}
            </p>
          </div>

          <div style={{
            background: 'rgba(255,255,255,0.03)',
            borderRadius: '12px',
            padding: '16px',
          }}>
            <p style={{ margin: 0, color: '#888', fontSize: '0.75rem', textTransform: 'uppercase' }}>Erledigt</p>
            <p style={{ margin: '8px 0 0', fontSize: '1.8rem', fontWeight: 700, color: '#95E881' }}>
              {filteredOKRs.filter(o => calculateProgress(o) >= 100).length}
            </p>
          </div>

          <div style={{
            background: 'rgba(255,255,255,0.03)',
            borderRadius: '12px',
            padding: '16px',
          }}>
            <p style={{ margin: 0, color: '#888', fontSize: '0.75rem', textTransform: 'uppercase' }}>Ø Fortschritt</p>
            <p style={{ margin: '8px 0 0', fontSize: '1.8rem', fontWeight: 700, color: '#FFD93D' }}>
              {Math.round(filteredOKRs.reduce((acc, o) => acc + calculateProgress(o), 0) / filteredOKRs.length)}%
            </p>
          </div>
        </div>
      )}

      {/* OKR List by Project */}
      {Object.entries(groupedByProject).length === 0 ? (
        <div style={{
          textAlign: 'center',
          padding: '60px 20px',
          color: '#666',
        }}>
          <p style={{ fontSize: '3rem', margin: '0 0 10px' }}>🎯</p>
          <p>Keine OKRs für {selectedQuarter} definiert</p>
          <button
            onClick={() => setShowAddOKR(true)}
            style={{
              marginTop: '15px',
              padding: '10px 20px',
              background: '#4ECDC4',
              border: 'none',
              borderRadius: '8px',
              color: '#000',
              cursor: 'pointer',
              fontWeight: 600,
            }}
          >
            Erstes OKR erstellen
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {Object.entries(groupedByProject).map(([projectId, projectOKRs]) => {
            const projectProgress = projectOKRs.reduce((acc, o) => acc + calculateProgress(o), 0) / projectOKRs.length;
            
            return (
              <div key={projectId} style={{
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: '16px',
                padding: '20px',
              }}>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '15px',
                }}>
                  <h3 style={{ margin: 0, color: '#fff', fontSize: '1.1rem' }}>
                    {projectId}
                  </h3>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                  }}>
                    <div style={{
                      width: '100px',
                      height: '8px',
                      background: 'rgba(255,255,255,0.1)',
                      borderRadius: '4px',
                      overflow: 'hidden',
                    }}>
                      <div style={{
                        width: `${projectProgress}%`,
                        height: '100%',
                        background: getStatusColor(projectProgress),
                        borderRadius: '4px',
                        transition: 'width 0.3s ease',
                      }} />
                    </div>
                    <span style={{
                      color: getStatusColor(projectProgress),
                      fontWeight: 600,
                      fontSize: '0.9rem',
                    }}>
                      {Math.round(projectProgress)}%
                    </span>
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {projectOKRs.map(okr => {
                    const progress = calculateProgress(okr);
                    return (
                      <div key={okr.id} style={{
                        padding: '15px',
                        background: 'rgba(0,0,0,0.2)',
                        borderRadius: '10px',
                        borderLeft: `3px solid ${getStatusColor(progress)}`,
                      }}>
                        <div style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'flex-start',
                          marginBottom: '10px',
                        }}>
                          <div style={{ flex: 1 }}>
                            <p style={{
                              margin: '0 0 5px',
                              color: '#fff',
                              fontWeight: 500,
                            }}>
                              {okr.title}
                            </p>
                            <p style={{
                              margin: 0,
                              color: '#888',
                              fontSize: '0.85rem',
                            }}>
                              {okr.description}
                            </p>
                          </div>

                          <button
                            onClick={() => deleteOKR(okr.id)}
                            style={{
                              background: 'none',
                              border: 'none',
                              color: '#666',
                              cursor: 'pointer',
                              fontSize: '1.2rem',
                            }}
                          >
                            🗑️
                          </button>
                        </div>

                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '15px',
                          flexWrap: 'wrap',
                        }}>
                          <div style={{
                            flex: 1,
                            minWidth: '150px',
                          }}>
                            <div style={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              fontSize: '0.8rem',
                              color: '#888',
                              marginBottom: '4px',
                            }}>
                              <span>{okr.currentValue} / {okr.targetValue} {okr.unit}</span>
                              <span style={{ color: getStatusColor(progress), fontWeight: 600 }}>
                                {Math.round(progress)}%
                              </span>
                            </div>

                            <div style={{
                              height: '6px',
                              background: 'rgba(255,255,255,0.1)',
                              borderRadius: '3px',
                              overflow: 'hidden',
                            }}>
                              <div style={{
                                width: `${progress}%`,
                                height: '100%',
                                background: getStatusColor(progress),
                                borderRadius: '3px',
                                transition: 'width 0.3s ease',
                              }} />
                            </div>
                          </div>

                          <div style={{ display: 'flex', gap: '5px' }}>
                            <button
                              onClick={() => updateProgress(okr.id, Math.max(0, okr.currentValue - getStep(okr)))}
                              style={{
                                padding: '5px 10px',
                                background: 'rgba(255,100,100,0.2)',
                                border: '1px solid rgba(255,100,100,0.3)',
                                borderRadius: '4px',
                                color: '#f88',
                                cursor: 'pointer',
                                fontSize: '0.8rem',
                              }}
                            >
                              -{getStep(okr)}
                            </button>
                            <button
                              onClick={() => updateProgress(okr.id, okr.currentValue + getStep(okr))}
                              style={{
                                padding: '5px 10px',
                                background: 'rgba(149,232,129,0.2)',
                                border: '1px solid rgba(149,232,129,0.3)',
                                borderRadius: '4px',
                                color: '#95E881',
                                cursor: 'pointer',
                                fontSize: '0.8rem',
                              }}
                            >
                              +{getStep(okr)}
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function OKRForm({ quarter, projects, onAdd, onCancel }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [projectId, setProjectId] = useState(projects[0] || '');
  const [targetValue, setTargetValue] = useState('');
  const [unit, setUnit] = useState('');
  const [type, setType] = useState('number');

  const handleSubmit = () => {
    if (!title || !targetValue) return;
    onAdd({
      quarter,
      projectId,
      title,
      description,
      targetValue: parseFloat(targetValue),
      currentValue: 0,
      unit: unit || (type === 'percentage' ? '%' : ''),
      type,
    });
  };

  return (
    <div style={{
      background: 'rgba(255,255,255,0.05)',
      borderRadius: '12px',
      padding: '20px',
      marginBottom: '20px',
    }}>
      <h3 style={{ margin: '0 0 15px', color: '#fff', fontSize: '1rem' }}>
        ➕ Neues OKR für {quarter}
      </h3>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <select
          value={projectId}
          onChange={(e) => setProjectId(e.target.value)}
          style={inputStyle}
        >
          {projects.map(p => (
            <option key={p} value={p}>{p}</option>
          ))}
        </select>

        <input
          type="text"
          placeholder="OKR Titel (z.B. 'Erhöhe Monthly Revenue')"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          style={inputStyle}
        />

        <input
          type="text"
          placeholder="Beschreibung (optional)"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          style={inputStyle}
        />

        <div style={{ display: 'flex', gap: '10px' }}>
          <select
            value={type}
            onChange={(e) => setType(e.target.value)}
            style={{ ...inputStyle, flex: 1 }}
          >
            <option value="number">Zahl</option>
            <option value="percentage">Prozent</option>
            <option value="currency">Währung (€)</option>
          </select>

          <input
            type="number"
            placeholder="Zielwert"
            value={targetValue}
            onChange={(e) => setTargetValue(e.target.value)}
            style={{ ...inputStyle, flex: 1 }}
          />

          {type !== 'percentage' && (
            <input
              type="text"
              placeholder="Einheit (z.B. €, h, Stk)"
              value={unit}
              onChange={(e) => setUnit(e.target.value)}
              style={{ ...inputStyle, flex: 1 }}
            />
          )}
        </div>

        <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
          <button
            onClick={handleSubmit}
            style={{
              flex: 1,
              padding: '12px',
              background: '#4ECDC4',
              border: 'none',
              borderRadius: '8px',
              color: '#000',
              cursor: 'pointer',
              fontWeight: 600,
            }}
          >
            Speichern
          </button>
          <button
            onClick={onCancel}
            style={{
              flex: 1,
              padding: '12px',
              background: 'rgba(255,255,255,0.1)',
              border: '1px solid rgba(255,255,255,0.2)',
              borderRadius: '8px',
              color: '#fff',
              cursor: 'pointer',
            }}
          >
            Abbrechen
          </button>
        </div>
      </div>
    </div>
  );
}

function getCurrentQuarter() {
  const month = new Date().getMonth();
  if (month < 3) return 'Q1';
  if (month < 6) return 'Q2';
  if (month < 9) return 'Q3';
  return 'Q4';
}

function getStep(okr) {
  if (okr.type === 'percentage') return 5;
  if (okr.targetValue >= 10000) return 1000;
  if (okr.targetValue >= 1000) return 100;
  if (okr.targetValue >= 100) return 10;
  return 1;
}

const inputStyle = {
  padding: '12px',
  background: 'rgba(0,0,0,0.3)',
  border: '1px solid rgba(255,255,255,0.15)',
  borderRadius: '8px',
  color: '#fff',
  fontSize: '0.9rem',
  fontFamily: 'inherit',
};
