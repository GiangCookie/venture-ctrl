import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, Area, AreaChart } from 'recharts';

// Project configuration
const PROJECTS = [
  { id: 'tough-cookie', name: 'Tough Cookie', color: '#FF6B35', emoji: '🍪' },
  { id: 'nomu', name: 'NOMU', color: '#4ECDC4', emoji: '📱' },
  { id: 'kyberg', name: 'Kyberg Export', color: '#95E881', emoji: '💊' },
  { id: 'freelance', name: 'Freelance', color: '#A855F7', emoji: '🎬' },
];

const PRIORITIES = ['🔴 Urgent', '🟡 High', '🟢 Normal', '⚪ Low'];
const MOOD_EMOJIS = ['😴', '😐', '🙂', '😊', '🔥'];
const DEAL_STAGES = ['Lead', 'Pitch', 'Negotiation', 'Closed Won', 'Closed Lost'];

// Initial state
const getInitialData = () => ({
  timeSessions: [],
  income: [],
  todos: [],
  pipeline: [],
  activeSession: null,
});

export default function VentureDashboard() {
  const [data, setData] = useState(getInitialData);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [showAddIncome, setShowAddIncome] = useState(false);
  const [showAddTodo, setShowAddTodo] = useState(false);
  const [showAddDeal, setShowAddDeal] = useState(false);
  const [selectedProject, setSelectedProject] = useState(PROJECTS[0].id);
  
  // Load data from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('venture-dashboard-data');
    if (saved) {
      try {
        setData(JSON.parse(saved));
      } catch (e) {
        console.error('Failed to load data:', e);
      }
    }
  }, []);
  
  // Save data to localStorage on change
  useEffect(() => {
    localStorage.setItem('venture-dashboard-data', JSON.stringify(data));
  }, [data]);
  
  // Time tracking functions
  const startSession = (projectId, mood) => {
    setData(prev => ({
      ...prev,
      activeSession: {
        projectId,
        mood,
        startTime: new Date().toISOString(),
      }
    }));
  };
  
  const endSession = (notes = '') => {
    if (!data.activeSession) return;
    
    const endTime = new Date().toISOString();
    const duration = (new Date(endTime) - new Date(data.activeSession.startTime)) / 1000 / 60; // minutes
    
    setData(prev => ({
      ...prev,
      timeSessions: [...prev.timeSessions, {
        ...prev.activeSession,
        endTime,
        duration,
        notes,
        id: Date.now(),
      }],
      activeSession: null,
    }));
  };
  
  // Income functions
  const addIncome = (income) => {
    setData(prev => ({
      ...prev,
      income: [...prev.income, { ...income, id: Date.now(), date: new Date().toISOString() }],
    }));
  };
  
  const deleteIncome = (id) => {
    setData(prev => ({
      ...prev,
      income: prev.income.filter(i => i.id !== id),
    }));
  };
  
  // Todo functions
  const addTodo = (todo) => {
    setData(prev => ({
      ...prev,
      todos: [...prev.todos, { ...todo, id: Date.now(), completed: false, createdAt: new Date().toISOString() }],
    }));
  };
  
  const toggleTodo = (id) => {
    setData(prev => ({
      ...prev,
      todos: prev.todos.map(t => t.id === id ? { ...t, completed: !t.completed } : t),
    }));
  };
  
  const deleteTodo = (id) => {
    setData(prev => ({
      ...prev,
      todos: prev.todos.filter(t => t.id !== id),
    }));
  };
  
  // Pipeline functions
  const addDeal = (deal) => {
    setData(prev => ({
      ...prev,
      pipeline: [...prev.pipeline, { ...deal, id: Date.now(), createdAt: new Date().toISOString() }],
    }));
  };
  
  const updateDealStage = (id, stage) => {
    setData(prev => ({
      ...prev,
      pipeline: prev.pipeline.map(d => d.id === id ? { ...d, stage } : d),
    }));
  };
  
  const deleteDeal = (id) => {
    setData(prev => ({
      ...prev,
      pipeline: prev.pipeline.filter(d => d.id !== id),
    }));
  };
  
  // Export/Import functions
  const exportData = () => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `venture-data-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
  };
  
  const importData = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const imported = JSON.parse(event.target.result);
        setData(imported);
      } catch (err) {
        alert('Fehler beim Import: ' + err.message);
      }
    };
    reader.readAsText(file);
  };
  
  // Calculate metrics
  const getProjectMetrics = () => {
    return PROJECTS.map(project => {
      const sessions = data.timeSessions.filter(s => s.projectId === project.id);
      const totalMinutes = sessions.reduce((acc, s) => acc + s.duration, 0);
      const projectEntries = data.income.filter(i => i.projectId === project.id);
      const totalIncome = projectEntries.filter(i => i.type !== 'investment').reduce((acc, i) => acc + i.amount, 0);
      const totalInvestment = projectEntries.filter(i => i.type === 'investment').reduce((acc, i) => acc + i.amount, 0);
      const netIncome = totalIncome - totalInvestment;
      const avgMood = sessions.length > 0 ? sessions.reduce((acc, s) => acc + s.mood, 0) / sessions.length : 0;
      const hourlyRate = totalMinutes > 0 ? (netIncome / (totalMinutes / 60)).toFixed(2) : 0;
      
      return {
        ...project,
        totalHours: (totalMinutes / 60).toFixed(1),
        totalMinutes,
        totalIncome,
        totalInvestment,
        netIncome,
        avgMood: avgMood.toFixed(1),
        hourlyRate,
        sessions: sessions.length,
      };
    });
  };
  
  const metrics = getProjectMetrics();
  const totalHours = metrics.reduce((acc, m) => acc + parseFloat(m.totalHours), 0).toFixed(1);
  const totalIncome = metrics.reduce((acc, m) => acc + m.totalIncome, 0);
  const totalInvestment = metrics.reduce((acc, m) => acc + m.totalInvestment, 0);
  const netIncome = totalIncome - totalInvestment;
  const pipelineValue = data.pipeline.filter(d => !['Closed Won', 'Closed Lost'].includes(d.stage)).reduce((acc, d) => acc + d.value, 0);
  
  // Get weekly data for chart
  const getWeeklyData = () => {
    const days = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'];
    const today = new Date();
    const weekData = [];
    
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      
      const daySessions = data.timeSessions.filter(s => s.startTime.split('T')[0] === dateStr);
      const dayMinutes = daySessions.reduce((acc, s) => acc + s.duration, 0);
      
      weekData.push({
        day: days[date.getDay() === 0 ? 6 : date.getDay() - 1],
        hours: (dayMinutes / 60).toFixed(1),
        mood: daySessions.length > 0 ? (daySessions.reduce((acc, s) => acc + s.mood, 0) / daySessions.length).toFixed(1) : 0,
      });
    }
    
    return weekData;
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0a0a0f 0%, #1a1a2e 50%, #0f0f1a 100%)',
      color: '#e0e0e0',
      fontFamily: "'JetBrains Mono', 'SF Mono', monospace",
    }}>
      {/* Header */}
      <header style={{
        padding: '20px',
        borderBottom: '1px solid rgba(255,255,255,0.1)',
        background: 'rgba(0,0,0,0.3)',
        backdropFilter: 'blur(10px)',
        position: 'sticky',
        top: 0,
        zIndex: 100,
      }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
          <h1 style={{ 
            fontSize: '1.5rem', 
            fontWeight: 800, 
            background: 'linear-gradient(135deg, #FF6B35, #4ECDC4)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            margin: 0,
          }}>
            VENTURE CTRL
          </h1>
          
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <button onClick={exportData} style={buttonStyle}>📤 Export</button>
            <label style={{...buttonStyle, cursor: 'pointer'}}>
              📥 Import
              <input type="file" accept=".json" onChange={importData} style={{ display: 'none' }} />
            </label>
          </div>
        </div>
      </header>
      
      {/* Navigation */}
      <nav style={{
        display: 'flex',
        justifyContent: 'center',
        gap: '4px',
        padding: '12px',
        background: 'rgba(0,0,0,0.2)',
        flexWrap: 'wrap',
      }}>
        {['dashboard', 'time', 'money', 'todos', 'pipeline'].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              padding: '10px 20px',
              background: activeTab === tab ? 'rgba(255,107,53,0.3)' : 'transparent',
              border: activeTab === tab ? '1px solid #FF6B35' : '1px solid transparent',
              borderRadius: '8px',
              color: activeTab === tab ? '#FF6B35' : '#888',
              cursor: 'pointer',
              fontFamily: 'inherit',
              fontSize: '0.85rem',
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              transition: 'all 0.2s',
            }}
          >
            {tab === 'dashboard' && '📊'} {tab === 'time' && '⏱️'} {tab === 'money' && '💰'} {tab === 'todos' && '✅'} {tab === 'pipeline' && '🎯'}
            {' '}{tab}
          </button>
        ))}
      </nav>
      
      <main style={{ maxWidth: '1200px', margin: '0 auto', padding: '20px' }}>
        
        {/* DASHBOARD TAB */}
        {activeTab === 'dashboard' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            
            {/* Active Session Banner */}
            {data.activeSession && (
              <div style={{
                background: 'linear-gradient(135deg, rgba(255,107,53,0.2), rgba(78,205,196,0.2))',
                border: '2px solid #FF6B35',
                borderRadius: '16px',
                padding: '20px',
                animation: 'pulse 2s infinite',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
                  <div>
                    <p style={{ margin: 0, color: '#FF6B35', fontWeight: 600 }}>🔴 AKTIVE SESSION</p>
                    <p style={{ margin: '5px 0 0', fontSize: '1.2rem' }}>
                      {PROJECTS.find(p => p.id === data.activeSession.projectId)?.emoji}{' '}
                      {PROJECTS.find(p => p.id === data.activeSession.projectId)?.name}
                    </p>
                    <p style={{ margin: '5px 0 0', color: '#888', fontSize: '0.85rem' }}>
                      Gestartet: {new Date(data.activeSession.startTime).toLocaleTimeString('de-DE')}
                      {' · '}Mood: {MOOD_EMOJIS[data.activeSession.mood - 1]}
                    </p>
                  </div>
                  <button
                    onClick={() => endSession()}
                    style={{
                      ...buttonStyle,
                      background: '#FF6B35',
                      color: '#000',
                      fontWeight: 700,
                    }}
                  >
                    ⏹️ Session beenden
                  </button>
                </div>
              </div>
            )}
            
            {/* Quick Stats */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '12px' }}>
              <StatCard label="Gesamt Stunden" value={totalHours} suffix="h" color="#4ECDC4" />
              <StatCard label="Netto Einnahmen" value={netIncome.toLocaleString('de-DE')} suffix="€" color={netIncome >= 0 ? '#95E881' : '#FF6B6B'} />
              <StatCard label="Ø Stundenlohn" value={totalHours > 0 ? (netIncome / totalHours).toFixed(0) : 0} suffix="€/h" color="#FF6B35" />
              <StatCard label="Pipeline Wert" value={pipelineValue.toLocaleString('de-DE')} suffix="€" color="#A855F7" />
            </div>
            
            {/* Project Overview */}
            <div style={cardStyle}>
              <h3 style={{ margin: '0 0 15px', color: '#fff', fontSize: '1rem' }}>📊 Projekt-Übersicht</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
                {metrics.map(m => (
                  <div key={m.id} style={{
                    background: 'rgba(255,255,255,0.03)',
                    border: `1px solid ${m.color}40`,
                    borderRadius: '12px',
                    padding: '15px',
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                      <span style={{ fontSize: '1.2rem' }}>{m.emoji}</span>
                      <span style={{ 
                        background: `${m.color}30`,
                        color: m.color,
                        padding: '2px 8px',
                        borderRadius: '4px',
                        fontSize: '0.7rem',
                        fontWeight: 600,
                      }}>{m.hourlyRate}€/h</span>
                    </div>
                    <h4 style={{ margin: '0 0 8px', color: m.color, fontSize: '0.9rem' }}>{m.name}</h4>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: '#888' }}>
                      <span>{m.totalHours}h</span>
                      <span>{m.totalIncome.toLocaleString('de-DE')}€</span>
                      <span>{m.avgMood > 0 ? MOOD_EMOJIS[Math.round(m.avgMood) - 1] : '—'}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Weekly Chart */}
            <div style={cardStyle}>
              <h3 style={{ margin: '0 0 15px', color: '#fff', fontSize: '1rem' }}>📈 Letzte 7 Tage</h3>
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={getWeeklyData()}>
                  <defs>
                    <linearGradient id="colorHours" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#4ECDC4" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="#4ECDC4" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="day" stroke="#555" fontSize={12} />
                  <YAxis stroke="#555" fontSize={12} />
                  <Tooltip 
                    contentStyle={{ background: '#1a1a2e', border: '1px solid #333', borderRadius: '8px' }}
                    labelStyle={{ color: '#fff' }}
                  />
                  <Area type="monotone" dataKey="hours" stroke="#4ECDC4" fill="url(#colorHours)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            
            {/* Time Distribution Pie */}
            <div style={cardStyle}>
              <h3 style={{ margin: '0 0 15px', color: '#fff', fontSize: '1rem' }}>⏰ Zeit-Verteilung</h3>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={metrics.filter(m => m.totalMinutes > 0)}
                    dataKey="totalMinutes"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    labelLine={false}
                  >
                    {metrics.map((m, i) => (
                      <Cell key={m.id} fill={m.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ background: '#1a1a2e', border: '1px solid #333', borderRadius: '8px' }}
                    formatter={(value) => [`${(value / 60).toFixed(1)}h`, 'Zeit']}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
        
        {/* TIME TRACKING TAB */}
        {activeTab === 'time' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            
            {/* Check-in Section */}
            {!data.activeSession ? (
              <div style={cardStyle}>
                <h3 style={{ margin: '0 0 15px', color: '#fff', fontSize: '1rem' }}>⏱️ Neue Session starten</h3>
                <CheckInForm onStart={startSession} />
              </div>
            ) : (
              <div style={{
                ...cardStyle,
                border: '2px solid #FF6B35',
                background: 'rgba(255,107,53,0.1)',
              }}>
                <h3 style={{ margin: '0 0 15px', color: '#FF6B35', fontSize: '1rem' }}>🔴 Aktive Session</h3>
                <p style={{ margin: '0 0 10px' }}>
                  {PROJECTS.find(p => p.id === data.activeSession.projectId)?.emoji}{' '}
                  {PROJECTS.find(p => p.id === data.activeSession.projectId)?.name}
                </p>
                <p style={{ color: '#888', fontSize: '0.85rem', margin: '0 0 15px' }}>
                  Gestartet: {new Date(data.activeSession.startTime).toLocaleString('de-DE')}
                </p>
                <button onClick={() => endSession()} style={{ ...buttonStyle, background: '#FF6B35', color: '#000' }}>
                  ⏹️ Beenden
                </button>
              </div>
            )}
            
            {/* Recent Sessions */}
            <div style={cardStyle}>
              <h3 style={{ margin: '0 0 15px', color: '#fff', fontSize: '1rem' }}>📜 Letzte Sessions</h3>
              {data.timeSessions.length === 0 ? (
                <p style={{ color: '#666', textAlign: 'center', padding: '20px' }}>Noch keine Sessions</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {[...data.timeSessions].reverse().slice(0, 10).map(session => {
                    const project = PROJECTS.find(p => p.id === session.projectId);
                    return (
                      <div key={session.id} style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '12px',
                        background: 'rgba(255,255,255,0.03)',
                        borderRadius: '8px',
                        borderLeft: `3px solid ${project?.color}`,
                        flexWrap: 'wrap',
                        gap: '8px',
                      }}>
                        <div>
                          <span style={{ marginRight: '8px' }}>{project?.emoji}</span>
                          <span style={{ color: project?.color, fontWeight: 600 }}>{project?.name}</span>
                          <span style={{ color: '#666', fontSize: '0.8rem', marginLeft: '10px' }}>
                            {new Date(session.startTime).toLocaleDateString('de-DE')}
                          </span>
                        </div>
                        <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
                          <span>{MOOD_EMOJIS[session.mood - 1]}</span>
                          <span style={{ color: '#4ECDC4', fontWeight: 600 }}>{(session.duration / 60).toFixed(1)}h</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}
        
        {/* MONEY TAB */}
        {activeTab === 'money' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <button onClick={() => setShowAddIncome(true)} style={{ ...buttonStyle, alignSelf: 'flex-start' }}>
              ➕ Eintrag hinzufügen
            </button>
            
            {showAddIncome && (
              <div style={cardStyle}>
                <h3 style={{ margin: '0 0 15px', color: '#fff', fontSize: '1rem' }}>💰 Neuer Eintrag</h3>
                <IncomeForm onAdd={(income) => { addIncome(income); setShowAddIncome(false); }} onCancel={() => setShowAddIncome(false)} />
              </div>
            )}
            
            {/* Quick Stats */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '12px' }}>
              <StatCard label="Einnahmen" value={totalIncome.toLocaleString('de-DE')} suffix="€" color="#95E881" />
              <StatCard label="Investments" value={totalInvestment.toLocaleString('de-DE')} suffix="€" color="#FF6B6B" />
              <StatCard label="Netto" value={netIncome.toLocaleString('de-DE')} suffix="€" color={netIncome >= 0 ? '#4ECDC4' : '#FF6B6B'} />
            </div>
            
            {/* Income by Project Chart */}
            <div style={cardStyle}>
              <h3 style={{ margin: '0 0 15px', color: '#fff', fontSize: '1rem' }}>💵 Einnahmen pro Projekt</h3>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={metrics}>
                  <XAxis dataKey="emoji" stroke="#555" />
                  <YAxis stroke="#555" />
                  <Tooltip 
                    contentStyle={{ background: '#1a1a2e', border: '1px solid #333', borderRadius: '8px' }}
                    formatter={(value) => [`${value.toLocaleString('de-DE')}€`, 'Einnahmen']}
                    labelFormatter={(label) => metrics.find(m => m.emoji === label)?.name}
                  />
                  <Bar dataKey="totalIncome" radius={[8, 8, 0, 0]}>
                    {metrics.map((m, i) => (
                      <Cell key={m.id} fill={m.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            
            {/* Hourly Rate Comparison */}
            <div style={cardStyle}>
              <h3 style={{ margin: '0 0 15px', color: '#fff', fontSize: '1rem' }}>⚡ Effektiver Stundenlohn</h3>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={metrics.filter(m => m.totalMinutes > 0)} layout="vertical">
                  <XAxis type="number" stroke="#555" />
                  <YAxis type="category" dataKey="name" stroke="#555" width={100} fontSize={12} />
                  <Tooltip 
                    contentStyle={{ background: '#1a1a2e', border: '1px solid #333', borderRadius: '8px' }}
                    formatter={(value) => [`${value}€/h`, 'Stundenlohn']}
                  />
                  <Bar dataKey="hourlyRate" radius={[0, 8, 8, 0]}>
                    {metrics.map((m, i) => (
                      <Cell key={m.id} fill={m.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            
            {/* Income History */}
            <div style={cardStyle}>
              <h3 style={{ margin: '0 0 15px', color: '#fff', fontSize: '1rem' }}>📜 Einträge-Historie</h3>
              {data.income.length === 0 ? (
                <p style={{ color: '#666', textAlign: 'center', padding: '20px' }}>Noch keine Einträge</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {[...data.income].reverse().map(inc => {
                    const project = PROJECTS.find(p => p.id === inc.projectId);
                    const isInvestment = inc.type === 'investment';
                    return (
                      <div key={inc.id} style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '12px',
                        background: isInvestment ? 'rgba(255,107,107,0.1)' : 'rgba(255,255,255,0.03)',
                        borderRadius: '8px',
                        borderLeft: `3px solid ${isInvestment ? '#FF6B6B' : project?.color}`,
                        flexWrap: 'wrap',
                        gap: '8px',
                      }}>
                        <div>
                          <span style={{ marginRight: '8px' }}>{isInvestment ? '📤' : project?.emoji}</span>
                          <span style={{ fontWeight: 600 }}>{inc.description}</span>
                          <span style={{ color: '#666', fontSize: '0.8rem', marginLeft: '10px' }}>
                            {new Date(inc.date).toLocaleDateString('de-DE')}
                          </span>
                          {isInvestment && (
                            <span style={{ 
                              marginLeft: '8px', 
                              background: 'rgba(255,107,107,0.2)', 
                              color: '#FF6B6B', 
                              padding: '2px 6px', 
                              borderRadius: '4px', 
                              fontSize: '0.7rem' 
                            }}>
                              Investment
                            </span>
                          )}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <span style={{ color: isInvestment ? '#FF6B6B' : '#95E881', fontWeight: 700, fontSize: '1.1rem' }}>
                            {isInvestment ? '-' : '+'}{inc.amount.toLocaleString('de-DE')}€
                          </span>
                          <button 
                            onClick={() => deleteIncome(inc.id)} 
                            style={{ 
                              background: 'none', 
                              border: 'none', 
                              color: '#666', 
                              cursor: 'pointer', 
                              fontSize: '1rem',
                              padding: '4px',
                            }}
                          >
                            🗑️
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}
        
        {/* TODOS TAB */}
        {activeTab === 'todos' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <button onClick={() => setShowAddTodo(true)} style={{ ...buttonStyle, alignSelf: 'flex-start' }}>
              ➕ Todo hinzufügen
            </button>
            
            {showAddTodo && (
              <div style={cardStyle}>
                <h3 style={{ margin: '0 0 15px', color: '#fff', fontSize: '1rem' }}>✅ Neues Todo</h3>
                <TodoForm onAdd={(todo) => { addTodo(todo); setShowAddTodo(false); }} onCancel={() => setShowAddTodo(false)} />
              </div>
            )}
            
            {/* Grouped Todos by Project */}
            {PROJECTS.map(project => {
              const projectTodos = data.todos
                .filter(t => t.projectId === project.id)
                .sort((a, b) => {
                  if (a.completed !== b.completed) return a.completed ? 1 : -1;
                  return PRIORITIES.indexOf(a.priority) - PRIORITIES.indexOf(b.priority);
                });
              
              if (projectTodos.length === 0) return null;
              
              return (
                <div key={project.id} style={cardStyle}>
                  <h3 style={{ margin: '0 0 15px', color: project.color, fontSize: '1rem' }}>
                    {project.emoji} {project.name}
                    <span style={{ color: '#666', fontWeight: 400, marginLeft: '10px', fontSize: '0.85rem' }}>
                      ({projectTodos.filter(t => !t.completed).length} offen)
                    </span>
                  </h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {projectTodos.map(todo => (
                      <div key={todo.id} style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        padding: '12px',
                        background: todo.completed ? 'rgba(255,255,255,0.02)' : 'rgba(255,255,255,0.05)',
                        borderRadius: '8px',
                        opacity: todo.completed ? 0.5 : 1,
                      }}>
                        <input
                          type="checkbox"
                          checked={todo.completed}
                          onChange={() => toggleTodo(todo.id)}
                          style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                        />
                        <span style={{ flex: 1, textDecoration: todo.completed ? 'line-through' : 'none' }}>
                          {todo.title}
                        </span>
                        <span style={{ fontSize: '0.8rem' }}>{todo.priority.split(' ')[0]}</span>
                        <button onClick={() => deleteTodo(todo.id)} style={{ background: 'none', border: 'none', color: '#666', cursor: 'pointer', fontSize: '1rem' }}>🗑️</button>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
            
            {data.todos.length === 0 && (
              <p style={{ color: '#666', textAlign: 'center', padding: '40px' }}>Noch keine Todos</p>
            )}
          </div>
        )}
        
        {/* PIPELINE TAB */}
        {activeTab === 'pipeline' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <button onClick={() => setShowAddDeal(true)} style={{ ...buttonStyle, alignSelf: 'flex-start' }}>
              ➕ Deal hinzufügen
            </button>
            
            {showAddDeal && (
              <div style={cardStyle}>
                <h3 style={{ margin: '0 0 15px', color: '#fff', fontSize: '1rem' }}>🎯 Neuer Deal</h3>
                <DealForm onAdd={(deal) => { addDeal(deal); setShowAddDeal(false); }} onCancel={() => setShowAddDeal(false)} />
              </div>
            )}
            
            {/* Pipeline Value */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '12px' }}>
              <StatCard 
                label="Offene Pipeline" 
                value={data.pipeline.filter(d => !['Closed Won', 'Closed Lost'].includes(d.stage)).reduce((acc, d) => acc + d.value, 0).toLocaleString('de-DE')} 
                suffix="€" 
                color="#A855F7" 
              />
              <StatCard 
                label="Gewonnen" 
                value={data.pipeline.filter(d => d.stage === 'Closed Won').reduce((acc, d) => acc + d.value, 0).toLocaleString('de-DE')} 
                suffix="€" 
                color="#95E881" 
              />
              <StatCard 
                label="Aktive Deals" 
                value={data.pipeline.filter(d => !['Closed Won', 'Closed Lost'].includes(d.stage)).length} 
                suffix="" 
                color="#4ECDC4" 
              />
            </div>
            
            {/* Pipeline Stages */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '12px' }}>
              {['Lead', 'Pitch', 'Negotiation'].map(stage => {
                const stageDeals = data.pipeline.filter(d => d.stage === stage);
                return (
                  <div key={stage} style={cardStyle}>
                    <h4 style={{ margin: '0 0 12px', color: '#888', fontSize: '0.85rem', textTransform: 'uppercase' }}>
                      {stage} ({stageDeals.length})
                    </h4>
                    {stageDeals.length === 0 ? (
                      <p style={{ color: '#444', fontSize: '0.8rem', textAlign: 'center', padding: '10px' }}>—</p>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {stageDeals.map(deal => {
                          const project = PROJECTS.find(p => p.id === deal.projectId);
                          return (
                            <div key={deal.id} style={{
                              padding: '10px',
                              background: 'rgba(255,255,255,0.03)',
                              borderRadius: '8px',
                              borderLeft: `3px solid ${project?.color}`,
                            }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                                <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>{deal.name}</span>
                                <span style={{ color: '#95E881', fontWeight: 600 }}>{deal.value.toLocaleString('de-DE')}€</span>
                              </div>
                              <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                                {DEAL_STAGES.slice(0, 4).map(s => (
                                  <button
                                    key={s}
                                    onClick={() => updateDealStage(deal.id, s)}
                                    style={{
                                      padding: '4px 8px',
                                      fontSize: '0.7rem',
                                      background: deal.stage === s ? '#4ECDC4' : 'rgba(255,255,255,0.1)',
                                      color: deal.stage === s ? '#000' : '#888',
                                      border: 'none',
                                      borderRadius: '4px',
                                      cursor: 'pointer',
                                    }}
                                  >
                                    {s}
                                  </button>
                                ))}
                                <button
                                  onClick={() => deleteDeal(deal.id)}
                                  style={{
                                    padding: '4px 8px',
                                    fontSize: '0.7rem',
                                    background: 'rgba(255,0,0,0.2)',
                                    color: '#f66',
                                    border: 'none',
                                    borderRadius: '4px',
                                    cursor: 'pointer',
                                    marginLeft: 'auto',
                                  }}
                                >
                                  🗑️
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            
            {/* Closed Deals */}
            <div style={cardStyle}>
              <h4 style={{ margin: '0 0 12px', color: '#888', fontSize: '0.85rem', textTransform: 'uppercase' }}>
                Abgeschlossen
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {data.pipeline.filter(d => ['Closed Won', 'Closed Lost'].includes(d.stage)).map(deal => {
                  const project = PROJECTS.find(p => p.id === deal.projectId);
                  const won = deal.stage === 'Closed Won';
                  return (
                    <div key={deal.id} style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '10px',
                      background: won ? 'rgba(149,232,129,0.1)' : 'rgba(255,100,100,0.1)',
                      borderRadius: '8px',
                      opacity: 0.8,
                    }}>
                      <span>
                        {won ? '✅' : '❌'} {deal.name}
                        <span style={{ color: '#666', fontSize: '0.8rem', marginLeft: '8px' }}>{project?.emoji}</span>
                      </span>
                      <span style={{ color: won ? '#95E881' : '#f66', fontWeight: 600 }}>
                        {deal.value.toLocaleString('de-DE')}€
                      </span>
                    </div>
                  );
                })}
                {data.pipeline.filter(d => ['Closed Won', 'Closed Lost'].includes(d.stage)).length === 0 && (
                  <p style={{ color: '#444', fontSize: '0.8rem', textAlign: 'center' }}>Noch keine abgeschlossenen Deals</p>
                )}
              </div>
            </div>
          </div>
        )}
        
      </main>
      
      {/* Footer */}
      <footer style={{ textAlign: 'center', padding: '40px 20px', color: '#444', fontSize: '0.8rem' }}>
        VENTURE CTRL · Built for multi-venture operators 🚀
      </footer>
      
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.8; }
        }
        input, select, textarea {
          font-family: inherit;
        }
      `}</style>
    </div>
  );
}

// Styles
const buttonStyle = {
  padding: '10px 16px',
  background: 'rgba(255,255,255,0.1)',
  border: '1px solid rgba(255,255,255,0.2)',
  borderRadius: '8px',
  color: '#fff',
  cursor: 'pointer',
  fontFamily: 'inherit',
  fontSize: '0.85rem',
  fontWeight: 500,
  transition: 'all 0.2s',
};

const cardStyle = {
  background: 'rgba(255,255,255,0.03)',
  border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: '16px',
  padding: '20px',
};

const inputStyle = {
  width: '100%',
  padding: '12px',
  background: 'rgba(0,0,0,0.3)',
  border: '1px solid rgba(255,255,255,0.15)',
  borderRadius: '8px',
  color: '#fff',
  fontSize: '0.9rem',
  fontFamily: 'inherit',
  boxSizing: 'border-box',
};

// Components
function StatCard({ label, value, suffix, color }) {
  return (
    <div style={{
      background: `linear-gradient(135deg, ${color}15, ${color}05)`,
      border: `1px solid ${color}30`,
      borderRadius: '12px',
      padding: '16px',
    }}>
      <p style={{ margin: 0, color: '#888', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</p>
      <p style={{ margin: '8px 0 0', fontSize: '1.5rem', fontWeight: 700, color }}>
        {value}<span style={{ fontSize: '0.9rem', opacity: 0.7 }}>{suffix}</span>
      </p>
    </div>
  );
}

function CheckInForm({ onStart }) {
  const [project, setProject] = useState(PROJECTS[0].id);
  const [mood, setMood] = useState(3);
  
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
      <div>
        <label style={{ display: 'block', marginBottom: '6px', color: '#888', fontSize: '0.85rem' }}>Projekt</label>
        <select value={project} onChange={e => setProject(e.target.value)} style={inputStyle}>
          {PROJECTS.map(p => (
            <option key={p.id} value={p.id}>{p.emoji} {p.name}</option>
          ))}
        </select>
      </div>
      <div>
        <label style={{ display: 'block', marginBottom: '6px', color: '#888', fontSize: '0.85rem' }}>Energie-Level</label>
        <div style={{ display: 'flex', gap: '10px' }}>
          {MOOD_EMOJIS.map((emoji, i) => (
            <button
              key={i}
              onClick={() => setMood(i + 1)}
              style={{
                width: '50px',
                height: '50px',
                fontSize: '1.5rem',
                background: mood === i + 1 ? 'rgba(78,205,196,0.3)' : 'rgba(255,255,255,0.05)',
                border: mood === i + 1 ? '2px solid #4ECDC4' : '1px solid rgba(255,255,255,0.1)',
                borderRadius: '12px',
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
            >
              {emoji}
            </button>
          ))}
        </div>
      </div>
      <button onClick={() => onStart(project, mood)} style={{ ...buttonStyle, background: '#4ECDC4', color: '#000', fontWeight: 700 }}>
        ▶️ Session starten
      </button>
    </div>
  );
}

function IncomeForm({ onAdd, onCancel }) {
  const [projectId, setProjectId] = useState(PROJECTS[0].id);
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState('income');
  
  const handleSubmit = () => {
    if (!amount || !description) return;
    onAdd({ projectId, amount: parseFloat(amount), description, type });
  };
  
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      <div style={{ display: 'flex', gap: '8px' }}>
        <button
          onClick={() => setType('income')}
          style={{
            flex: 1,
            padding: '12px',
            background: type === 'income' ? 'rgba(149,232,129,0.3)' : 'rgba(255,255,255,0.05)',
            border: type === 'income' ? '2px solid #95E881' : '1px solid rgba(255,255,255,0.1)',
            borderRadius: '8px',
            color: type === 'income' ? '#95E881' : '#888',
            cursor: 'pointer',
            fontFamily: 'inherit',
            fontWeight: 600,
          }}
        >
          💰 Einnahme
        </button>
        <button
          onClick={() => setType('investment')}
          style={{
            flex: 1,
            padding: '12px',
            background: type === 'investment' ? 'rgba(255,107,107,0.3)' : 'rgba(255,255,255,0.05)',
            border: type === 'investment' ? '2px solid #FF6B6B' : '1px solid rgba(255,255,255,0.1)',
            borderRadius: '8px',
            color: type === 'investment' ? '#FF6B6B' : '#888',
            cursor: 'pointer',
            fontFamily: 'inherit',
            fontWeight: 600,
          }}
        >
          📤 Investment
        </button>
      </div>
      <select value={projectId} onChange={e => setProjectId(e.target.value)} style={inputStyle}>
        {PROJECTS.map(p => (
          <option key={p.id} value={p.id}>{p.emoji} {p.name}</option>
        ))}
      </select>
      <input type="number" placeholder="Betrag (€)" value={amount} onChange={e => setAmount(e.target.value)} style={inputStyle} />
      <input type="text" placeholder="Beschreibung" value={description} onChange={e => setDescription(e.target.value)} style={inputStyle} />
      <div style={{ display: 'flex', gap: '10px' }}>
        <button onClick={handleSubmit} style={{ ...buttonStyle, background: type === 'income' ? '#95E881' : '#FF6B6B', color: '#000', flex: 1 }}>Speichern</button>
        <button onClick={onCancel} style={{ ...buttonStyle, flex: 1 }}>Abbrechen</button>
      </div>
    </div>
  );
}

function TodoForm({ onAdd, onCancel }) {
  const [projectId, setProjectId] = useState(PROJECTS[0].id);
  const [title, setTitle] = useState('');
  const [priority, setPriority] = useState(PRIORITIES[2]);
  
  const handleSubmit = () => {
    if (!title) return;
    onAdd({ projectId, title, priority });
  };
  
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      <select value={projectId} onChange={e => setProjectId(e.target.value)} style={inputStyle}>
        {PROJECTS.map(p => (
          <option key={p.id} value={p.id}>{p.emoji} {p.name}</option>
        ))}
      </select>
      <input type="text" placeholder="Todo Titel" value={title} onChange={e => setTitle(e.target.value)} style={inputStyle} />
      <select value={priority} onChange={e => setPriority(e.target.value)} style={inputStyle}>
        {PRIORITIES.map(p => (
          <option key={p} value={p}>{p}</option>
        ))}
      </select>
      <div style={{ display: 'flex', gap: '10px' }}>
        <button onClick={handleSubmit} style={{ ...buttonStyle, background: '#4ECDC4', color: '#000', flex: 1 }}>Speichern</button>
        <button onClick={onCancel} style={{ ...buttonStyle, flex: 1 }}>Abbrechen</button>
      </div>
    </div>
  );
}

function DealForm({ onAdd, onCancel }) {
  const [projectId, setProjectId] = useState(PROJECTS[0].id);
  const [name, setName] = useState('');
  const [value, setValue] = useState('');
  const [stage, setStage] = useState('Lead');
  
  const handleSubmit = () => {
    if (!name || !value) return;
    onAdd({ projectId, name, value: parseFloat(value), stage });
  };
  
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      <select value={projectId} onChange={e => setProjectId(e.target.value)} style={inputStyle}>
        {PROJECTS.map(p => (
          <option key={p.id} value={p.id}>{p.emoji} {p.name}</option>
        ))}
      </select>
      <input type="text" placeholder="Deal Name (z.B. Hotel Wittmann)" value={name} onChange={e => setName(e.target.value)} style={inputStyle} />
      <input type="number" placeholder="Wert (€)" value={value} onChange={e => setValue(e.target.value)} style={inputStyle} />
      <select value={stage} onChange={e => setStage(e.target.value)} style={inputStyle}>
        {DEAL_STAGES.slice(0, 3).map(s => (
          <option key={s} value={s}>{s}</option>
        ))}
      </select>
      <div style={{ display: 'flex', gap: '10px' }}>
        <button onClick={handleSubmit} style={{ ...buttonStyle, background: '#A855F7', color: '#fff', flex: 1 }}>Speichern</button>
        <button onClick={onCancel} style={{ ...buttonStyle, flex: 1 }}>Abbrechen</button>
      </div>
    </div>
  );
}
