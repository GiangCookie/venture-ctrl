import React, { useState, useEffect, lazy, Suspense, memo } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area } from 'recharts';

// Eagerly loaded components (critical path)
import DeadlinesWidget from './components/DeadlinesWidget';
import { JournalParser } from './utils/journal-parser';
import ErrorBoundary from './components/ErrorBoundary';
import LoadingSpinner from './components/LoadingSpinner';

// Task 4: Time Tracking & Todo Sync Components
import TimeTrackerWidget from './components/TimeTrackerWidget';
import TodoSyncWidget from './components/TodoSyncWidget';
import ManualTimeModal from './components/ManualTimeModal';
import EditSessionModal from './components/EditSessionModal';
import EditTodoModal from './components/EditTodoModal';

// Lazy loaded tab components
const JournalTab = lazy(() => import('./components/JournalTab'));
const GlobalSearch = lazy(() => import('./components/GlobalSearch'));
const AnalyticsTab = lazy(() => import('./components/AnalyticsTab'));
const OKRTracking = lazy(() => import('./components/OKRTracking'));
const AIInsights = lazy(() => import('./components/AIInsights'));

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
  tags: [],
});

// Memoized child components to prevent unnecessary re-renders
const StatCard = memo(function StatCard({ label, value, suffix, color }) {
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
});

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
  const [tags, setTags] = useState('');
  
  const handleSubmit = () => {
    if (!amount || !description) return;
    const finalAmount = type === 'expense' ? -Math.abs(parseFloat(amount)) : parseFloat(amount);
    const tagList = tags.split(',').map(t => t.trim()).filter(t => t);
    onAdd({ projectId, amount: finalAmount, description, type, tags: tagList });
  };
  
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      <div style={{ display: 'flex', gap: '8px' }}>
        {[
          { id: 'income', label: '💰 Einnahme', color: '#95E881' },
          { id: 'expense', label: '💸 Ausgabe', color: '#f66' },
          { id: 'investment', label: '📈 Investment', color: '#A855F7' },
        ].map(t => (
          <button
            key={t.id}
            onClick={() => setType(t.id)}
            style={{
              flex: 1,
              padding: '10px',
              background: type === t.id ? t.color + '40' : 'rgba(255,255,255,0.05)',
              border: type === t.id ? `2px solid ${t.color}` : '1px solid rgba(255,255,255,0.1)',
              borderRadius: '8px',
              color: type === t.id ? t.color : '#888',
              cursor: 'pointer',
              fontSize: '0.8rem',
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      <select value={projectId} onChange={e => setProjectId(e.target.value)} style={inputStyle}>
        {PROJECTS.map(p => (
          <option key={p.id} value={p.id}>{p.emoji} {p.name}</option>
        ))}
      </select>
      <input type="number" placeholder="Betrag (€)" value={amount} onChange={e => setAmount(e.target.value)} style={inputStyle} />
      <input type="text" placeholder="Beschreibung" value={description} onChange={e => setDescription(e.target.value)} style={inputStyle} />
      <input 
        type="text" 
        placeholder="Tags (kommagetrennt)" 
        value={tags} 
        onChange={e => setTags(e.target.value)} 
        style={inputStyle} 
      />
      <div style={{ display: 'flex', gap: '10px' }}>
        <button onClick={handleSubmit} style={{ ...buttonStyle, background: type === 'expense' ? '#f66' : type === 'investment' ? '#A855F7' : '#95E881', color: '#000', flex: 1 }}>Speichern</button>
        <button onClick={onCancel} style={{ ...buttonStyle, flex: 1 }}>Abbrechen</button>
      </div>
    </div>
  );
}

function TodoForm({ onAdd, onCancel }) {
  const [projectId, setProjectId] = useState(PROJECTS[0].id);
  const [title, setTitle] = useState('');
  const [priority, setPriority] = useState(PRIORITIES[2]);
  const [deadline, setDeadline] = useState('');
  const [tags, setTags] = useState('');
  
  const handleSubmit = () => {
    if (!title) return;
    const tagList = tags.split(',').map(t => t.trim()).filter(t => t);
    onAdd({ projectId, title, priority, deadline: deadline || null, tags: tagList });
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
      <input 
        type="date" 
        placeholder="Deadline (optional)" 
        value={deadline} 
        onChange={e => setDeadline(e.target.value)} 
        style={inputStyle} 
      />
      <input 
        type="text" 
        placeholder="Tags (kommagetrennt, z.B. urgent, client)" 
        value={tags} 
        onChange={e => setTags(e.target.value)} 
        style={inputStyle} 
      />
      
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
  const [tags, setTags] = useState('');
  
  const handleSubmit = () => {
    if (!name || !value) return;
    const tagList = tags.split(',').map(t => t.trim()).filter(t => t);
    onAdd({ projectId, name, value: parseFloat(value), stage, tags: tagList });
  };
  
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      <select value={projectId} onChange={e => setProjectId(e.target.value)} style={inputStyle}>
        {PROJECTS.map(p => (
          <option key={p.id} value={p.id}>{p.emoji} {p.name}</option>
        ))}
      </select>
      <input type="text" placeholder="Deal Name" value={name} onChange={e => setName(e.target.value)} style={inputStyle} />
      <input type="number" placeholder="Wert (€)" value={value} onChange={e => setValue(e.target.value)} style={inputStyle} />
      <select value={stage} onChange={e => setStage(e.target.value)} style={inputStyle}>
        {DEAL_STAGES.map(s => (
          <option key={s} value={s}>{s}</option>
        ))}
      </select>
      <input 
        type="text" 
        placeholder="Tags (kommagetrennt)" 
        value={tags} 
        onChange={e => setTags(e.target.value)} 
        style={inputStyle} 
      />
      
      <div style={{ display: 'flex', gap: '10px' }}>
        <button onClick={handleSubmit} style={{ ...buttonStyle, background: '#A855F7', color: '#fff', flex: 1 }}>Speichern</button>
        <button onClick={onCancel} style={{ ...buttonStyle, flex: 1 }}>Abbrechen</button>
      </div>
    </div>
  );
}

export default function VentureDashboard() {
  const [data, setData] = useState(getInitialData);
  const [journalEntries, setJournalEntries] = useState([]);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [showAddIncome, setShowAddIncome] = useState(false);
  const [showAddTodo, setShowAddTodo] = useState(false);
  const [showAddDeal, setShowAddDeal] = useState(false);
  const [selectedProject, setSelectedProject] = useState(PROJECTS[0].id);
  const [lastSync, setLastSync] = useState(null);
  const [exportFormat, setExportFormat] = useState('json');
  
  // Task 4: Modal state
  const [showManualTime, setShowManualTime] = useState(false);
  const [showEditSession, setShowEditSession] = useState(false);
  const [showEditTodo, setShowEditTodo] = useState(false);
  const [editingSession, setEditingSession] = useState(null);
  const [editingTodo, setEditingTodo] = useState(null);
  
  // Load data on mount
  useEffect(() => {
    const loadData = async () => {
      try {
        // Try loading from GitHub
        const response = await fetch('https://raw.githubusercontent.com/GiangCookie/venture-ctrl/main/data/daily-data.json');
        if (response.ok) {
          const remoteData = await response.json();
          if (remoteData && remoteData.timeSessions) {
            setData(remoteData);
            localStorage.setItem('venture-dashboard-data', JSON.stringify(remoteData));
            console.log('✅ Loaded from GitHub');
          }
        }
      } catch (e) {
        console.log('GitHub load failed, using localStorage');
      }
      
      // Fallback to localStorage
      const saved = localStorage.getItem('venture-dashboard-data');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          setData(prev => ({ ...getInitialData(), ...parsed }));
        } catch (e) {
          console.error('Failed to load data:', e);
        }
      }

      // Load journal entries
      const savedJournal = localStorage.getItem('venture-journal-entries');
      if (savedJournal) {
        try {
          const parsed = JSON.parse(savedJournal);
          setJournalEntries(parsed.entries || []);
        } catch (e) {
          console.error('Failed to load journal:', e);
        }
      }
    };
    
    loadData();
  }, []);
  
  // Save data to localStorage on change
  useEffect(() => {
    localStorage.setItem('venture-dashboard-data', JSON.stringify(data));
  }, [data]);

  // Save journal entries
  useEffect(() => {
    localStorage.setItem('venture-journal-entries', JSON.stringify({
      entries: journalEntries,
      lastUpdated: new Date().toISOString(),
    }));
  }, [journalEntries]);
  
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
    const duration = (new Date(endTime) - new Date(data.activeSession.startTime)) / 1000 / 60;
    
    setData(prev => ({
      ...prev,
      timeSessions: [...prev.timeSessions, {
        ...prev.activeSession,
        endTime,
        duration,
        notes,
        id: Date.now(),
        tags: [],
      }],
      activeSession: null,
    }));
  };
  
  // Income functions
  const addIncome = (income) => {
    setData(prev => ({
      ...prev,
      income: [...prev.income, { ...income, id: Date.now(), date: new Date().toISOString(), tags: [] }],
    }));
  };
  
  // Todo functions
  const addTodo = (todo) => {
    setData(prev => ({
      ...prev,
      todos: [...prev.todos, { 
        ...todo, 
        id: Date.now(), 
        completed: false, 
        createdAt: new Date().toISOString(),
        tags: todo.tags || [],
      }],
    }));
  };
  
  const toggleTodo = (id) => {
    setData(prev => ({
      ...prev,
      todos: prev.todos.map(t => t.id === id ? { 
        ...t, 
        completed: !t.completed,
        completedAt: !t.completed ? new Date().toISOString() : null,
      } : t),
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
      pipeline: [...prev.pipeline, { ...deal, id: Date.now(), createdAt: new Date().toISOString(), tags: [] }],
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

  // Import journal from memory files
  const importJournalFromMemory = async () => {
    const parser = new JournalParser();
    const entries = [];
    
    // Get list of memory files from the last 90 days
    const dates = [];
    for (let i = 0; i < 90; i++) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      dates.push(date.toISOString().split('T')[0]);
    }
    
    // Try to load each memory file
    for (const date of dates) {
      try {
        const response = await fetch(`/data/.openclaw/workspace/memory/${date}.md`);
        if (response.ok) {
          const content = await response.text();
          const entry = parser.parseDailyLog(content, date);
          if (entry) {
            entries.push(entry);
          }
        }
      } catch (e) {
        // File doesn't exist, skip
      }
    }
    
    setJournalEntries(prev => {
      const existingIds = new Set(prev.map(e => e.id));
      const newEntries = entries.filter(e => !existingIds.has(e.id));
      return [...newEntries, ...prev].sort((a, b) => new Date(b.date) - new Date(a.date));
    });
  };
  
  // Export functions
  const exportData = (format = 'json') => {
    if (format === 'json') {
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `venture-data-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
    } else if (format === 'markdown') {
      const markdown = generateMarkdownReport();
      const blob = new Blob([markdown], { type: 'text/markdown' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `venture-report-${new Date().toISOString().split('T')[0]}.md`;
      a.click();
    }
  };

  const generateMarkdownReport = () => {
    const today = new Date().toISOString().split('T')[0];
    const metrics = getProjectMetrics();
    
    let md = `# Venture Report · ${today}\n\n`;
    md += `## 📊 Übersicht\n\n`;
    md += `- **Gesamtstunden:** ${totalHours}h\n`;
    md += `- **Gesamteinnahmen:** ${totalIncome.toLocaleString('de-DE')}€\n`;
    md += `- **Ø Stundenlohn:** ${totalHours > 0 ? (totalIncome / totalHours).toFixed(0) : 0}€/h\n`;
    md += `- **Pipeline:** ${pipelineValue.toLocaleString('de-DE')}€\n\n`;
    
    md += `## 🎯 Projekte\n\n`;
    metrics.forEach(m => {
      md += `### ${m.emoji} ${m.name}\n`;
      md += `- Stunden: ${m.totalHours}h\n`;
      md += `- Einnahmen: ${m.totalIncome.toLocaleString('de-DE')}€\n`;
      md += `- Ø Stimmung: ${m.avgMood > 0 ? MOOD_EMOJIS[Math.round(m.avgMood) - 1] : '—'}\n`;
      md += `- Stundenlohn: ${m.hourlyRate}€/h\n\n`;
    });
    
    md += `## ✅ Todos\n\n`;
    const openTodos = data.todos.filter(t => !t.completed);
    md += `**Offen:** ${openTodos.length}/${data.todos.length}\n\n`;
    openTodos.slice(0, 10).forEach(t => {
      md += `- [ ] ${t.priority.split(' ')[0]} ${t.title} (${t.projectId})\n`;
    });
    
    md += `\n---\n*Generated by Venture Ctrl*\n`;
    
    return md;
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
  
  // Calculate metrics - memoized to prevent recalculation on every render
  const metrics = React.useMemo(() => {
    return PROJECTS.map(project => {
      const sessions = data.timeSessions.filter(s => s.projectId === project.id);
      const totalMinutes = sessions.reduce((acc, s) => acc + s.duration, 0);
      const totalIncome = data.income.filter(i => i.projectId === project.id).reduce((acc, i) => acc + i.amount, 0);
      const avgMood = sessions.length > 0 ? sessions.reduce((acc, s) => acc + s.mood, 0) / sessions.length : 0;
      const hourlyRate = totalMinutes > 0 ? (totalIncome / (totalMinutes / 60)).toFixed(2) : 0;
      
      return {
        ...project,
        totalHours: (totalMinutes / 60).toFixed(1),
        totalMinutes,
        totalIncome,
        avgMood: avgMood.toFixed(1),
        hourlyRate,
        sessions: sessions.length,
      };
    });
  }, [data.timeSessions, data.income]);
  
  const totalHours = React.useMemo(() => 
    metrics.reduce((acc, m) => acc + parseFloat(m.totalHours), 0).toFixed(1),
    [metrics]
  );
  
  const totalIncome = React.useMemo(() => 
    metrics.reduce((acc, m) => acc + m.totalIncome, 0),
    [metrics]
  );
  
  const pipelineValue = React.useMemo(() => 
    data.pipeline.filter(d => !['Closed Won', 'Closed Lost'].includes(d.stage)).reduce((acc, d) => acc + d.value, 0),
    [data.pipeline]
  );
  
  // Get weekly data for chart - memoized
  const weekData = React.useMemo(() => {
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
  }, [data.timeSessions]);

  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: '📊' },
    { id: 'time', label: 'Time', icon: '⏱️' },
    { id: 'money', label: 'Money', icon: '💰' },
    { id: 'todos', label: 'Todos', icon: '✅' },
    { id: 'pipeline', label: 'Pipeline', icon: '🎯' },
    { id: 'journal', label: 'Journal', icon: '📓' },
    { id: 'analytics', label: 'Analytics', icon: '📈' },
    { id: 'okr', label: 'OKR', icon: '🎯' },
    { id: 'insights', label: 'AI', icon: '🤖' },
    { id: 'search', label: 'Search', icon: '🔍' },
  ];

  // Tab content renderers
  const renderDashboardTab = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      
      {/* Task 4: Time Tracker Widget */}
      <TimeTrackerWidget 
        activeSession={data.activeSession}
        projects={PROJECTS}
        onStartSession={startSession}
        onEndSession={endSession}
        timeSessions={data.timeSessions}
        onManualTime={() => setShowManualTime(true)}
        onEditSession={(session) => {
          setEditingSession(session);
          setShowEditSession(true);
        }}
      />
      
      {/* Task 4: Todo Sync Widget */}
      <TodoSyncWidget 
        todos={data.todos}
        timeSessions={data.timeSessions}
        onToggleTodo={toggleTodo}
        onDeleteTodo={deleteTodo}
        onEditTodo={(todo) => {
          setEditingTodo(todo);
          setShowEditTodo(true);
        }}
      />
      
      <DeadlinesWidget todos={data.todos} />
      
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
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '12px' }}>
        <StatCard label="Gesamt Stunden" value={totalHours} suffix="h" color="#4ECDC4" />
        <StatCard label="Gesamt Einnahmen" value={totalIncome.toLocaleString('de-DE')} suffix="€" color="#95E881" />
        <StatCard label="Ø Stundenlohn" value={totalHours > 0 ? (totalIncome / totalHours).toFixed(0) : 0} suffix="€/h" color="#FF6B35" />
        <StatCard label="Pipeline Wert" value={pipelineValue.toLocaleString('de-DE')} suffix="€" color="#A855F7" />
      </div>
      
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
      
      <div style={cardStyle}>
        <h3 style={{ margin: '0 0 15px', color: '#fff', fontSize: '1rem' }}>📈 Letzte 7 Tage</h3>
        <ResponsiveContainer width="100%" height={200}>
          <AreaChart data={weekData}>
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
  );

  const renderTimeTab = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      
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
                    {session.notes && <span style={{ color: '#888', fontSize: '0.75rem', marginLeft: '8px' }}>📝</span>}
                  </div>
                  <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
                    <span>{MOOD_EMOJIS[session.mood - 1]}</span>
                    <span style={{ color: '#4ECDC4', fontWeight: 600 }}>{(session.duration / 60).toFixed(1)}h</span>
                    <button
                      onClick={() => setData(prev => ({ ...prev, timeSessions: prev.timeSessions.filter(s => s.id !== session.id) }))}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#666',
                        cursor: 'pointer',
                        fontSize: '1rem',
                        padding: '4px',
                      }}
                      title="Löschen"
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
  );

  const renderMoneyTab = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <button onClick={() => setShowAddIncome(true)} style={{ ...buttonStyle, alignSelf: 'flex-start' }}>
        ➕ Einnahme hinzufügen
      </button>
      
      {showAddIncome && (
        <div style={cardStyle}>
          <h3 style={{ margin: '0 0 15px', color: '#fff', fontSize: '1rem' }}>💰 Neue Einnahme</h3>
          <IncomeForm onAdd={(income) => { addIncome(income); setShowAddIncome(false); }} onCancel={() => setShowAddIncome(false)} />
        </div>
      )}
      
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
      
      <div style={cardStyle}>
        <h3 style={{ margin: '0 0 15px', color: '#fff', fontSize: '1rem' }}>📜 Finanz-Historie</h3>
        {data.income.length === 0 ? (
          <p style={{ color: '#666', textAlign: 'center', padding: '20px' }}>Noch keine Einträge</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {[...data.income].reverse().map(inc => {
              const project = PROJECTS.find(p => p.id === inc.projectId);
              const isExpense = inc.amount < 0 || inc.type === 'expense';
              const isInvestment = inc.type === 'investment';
              const color = isExpense ? '#f66' : isInvestment ? '#A855F7' : '#95E881';
              const sign = isExpense ? '−' : '+';
              return (
                <div key={inc.id} style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '12px',
                  background: 'rgba(255,255,255,0.03)',
                  borderRadius: '8px',
                  borderLeft: `3px solid ${isExpense ? '#f66' : isInvestment ? '#A855F7' : project?.color}`,
                  flexWrap: 'wrap',
                  gap: '8px',
                }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span>{project?.emoji}</span>
                      <span style={{ fontSize: '0.75rem', color: isExpense ? '#f66' : isInvestment ? '#A855F7' : '#95E881' }}>
                        {isExpense ? '💸' : isInvestment ? '📈' : '💰'}
                      </span>
                      <span style={{ fontWeight: 600 }}>{inc.description}</span>
                    </div>
                    <span style={{ color: '#666', fontSize: '0.8rem' }}>
                      {new Date(inc.date).toLocaleDateString('de-DE')}
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span style={{ color, fontWeight: 700, fontSize: '1.1rem' }}>
                      {sign}{Math.abs(inc.amount).toLocaleString('de-DE')}€
                    </span>
                    <button
                      onClick={() => setData(prev => ({ ...prev, income: prev.income.filter(i => i.id !== inc.id) }))}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#666',
                        cursor: 'pointer',
                        fontSize: '1rem',
                        padding: '4px',
                      }}
                      title="Löschen"
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
  );

  const renderTodosTab = () => (
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
                  borderLeft: todo.deadline && new Date(todo.deadline) < new Date() && !todo.completed 
                    ? '3px solid #f66' 
                    : '3px solid transparent',
                }}>
                  <input
                    type="checkbox"
                    checked={todo.completed}
                    onChange={() => toggleTodo(todo.id)}
                    style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                  />
                  <div style={{ flex: 1 }}>
                    <span style={{ textDecoration: todo.completed ? 'line-through' : 'none' }}>
                      {todo.title}
                    </span>
                    {todo.tags?.length > 0 && (
                      <div style={{ display: 'flex', gap: '4px', marginTop: '4px' }}>
                        {todo.tags.map(tag => (
                          <span key={tag} style={{
                            padding: '2px 6px',
                            background: 'rgba(255,107,53,0.2)',
                            borderRadius: '4px',
                            fontSize: '0.7rem',
                            color: '#FF6B35',
                          }}>
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                    {todo.deadline && (
                      <div style={{
                        fontSize: '0.75rem',
                        color: new Date(todo.deadline) < new Date() && !todo.completed ? '#f66' : '#888',
                        marginTop: '4px',
                      }}>
                        📅 Fällig: {new Date(todo.deadline).toLocaleDateString('de-DE')}
                      </div>
                    )}
                  </div>
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
  );

  const renderPipelineTab = () => (
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
  );

  const renderLazyTab = (component, fallbackMessage) => (
    <ErrorBoundary showDetails={process.env.NODE_ENV === 'development'}>
      <Suspense fallback={<LoadingSpinner message={fallbackMessage} />}>
        {component}
      </Suspense>
    </ErrorBoundary>
  );

  const getProjectMetrics = () => metrics;

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
            <select
              value={exportFormat}
              onChange={(e) => setExportFormat(e.target.value)}
              style={{
                padding: '8px 12px',
                background: 'rgba(255,255,255,0.1)',
                border: '1px solid rgba(255,255,255,0.2)',
                borderRadius: '8px',
                color: '#fff',
                fontFamily: 'inherit',
                fontSize: '0.85rem',
              }}
            >
              <option value="json">JSON</option>
              <option value="markdown">Markdown</option>
            </select>
            <button onClick={() => exportData(exportFormat)} style={buttonStyle}>📤 Export</button>
            <label style={{...buttonStyle, cursor: 'pointer'}}>
              📥 Import
              <input type="file" accept=".json" onChange={importData} style={{ display: 'none' }} />
            </label>
            <button onClick={importJournalFromMemory} style={buttonStyle}>📓 Import Journal</button>
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
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              padding: '10px 16px',
              background: activeTab === tab.id ? 'rgba(255,107,53,0.3)' : 'transparent',
              border: activeTab === tab.id ? '1px solid #FF6B35' : '1px solid transparent',
              borderRadius: '8px',
              color: activeTab === tab.id ? '#FF6B35' : '#888',
              cursor: 'pointer',
              fontFamily: 'inherit',
              fontSize: '0.8rem',
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              transition: 'all 0.2s',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <span>{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </nav>
      
      <main style={{ maxWidth: '1200px', margin: '0 auto', padding: '20px' }}>
        
        {/* DASHBOARD TAB */}
        {activeTab === 'dashboard' && renderDashboardTab()}
        
        {/* TIME TRACKING TAB */}
        {activeTab === 'time' && renderTimeTab()}
        
        {/* MONEY TAB */}
        {activeTab === 'money' && renderMoneyTab()}
        
        {/* TODOS TAB */}
        {activeTab === 'todos' && renderTodosTab()}
        
        {/* PIPELINE TAB */}
        {activeTab === 'pipeline' && renderPipelineTab()}
        
        {/* JOURNAL TAB - Lazy Loaded */}
        {activeTab === 'journal' && renderLazyTab(
          <JournalTab 
            entries={journalEntries}
            timeSessions={data.timeSessions}
            onSearch={(query) => console.log('Search:', query)}
          />,
          'Loading Journal...'
        )}
        
        {/* ANALYTICS TAB - Lazy Loaded */}
        {activeTab === 'analytics' && renderLazyTab(
          <AnalyticsTab 
            data={data}
            journalEntries={journalEntries}
          />,
          'Loading Analytics...'
        )}
        
        {/* OKR TAB - Lazy Loaded */}
        {activeTab === 'okr' && renderLazyTab(
          <OKRTracking 
            data={data}
            projectMetrics={metrics}
          />,
          'Loading OKR Tracking...'
        )}

        {/* AI INSIGHTS TAB - Lazy Loaded */}
        {activeTab === 'insights' && renderLazyTab(
          <AIInsights 
            data={data}
            journalEntries={journalEntries}
          />,
          'Loading AI Insights...'
        )}
        
        {/* SEARCH TAB - Lazy Loaded */}
        {activeTab === 'search' && renderLazyTab(
          <GlobalSearch 
            data={data}
            journalEntries={journalEntries}
            onNavigate={(type, id) => {
              console.log('Navigate to:', type, id);
            }}
          />,
          'Loading Search...'
        )}
        
      </main>
      
      {/* Task 4: Modals */}
      {showManualTime && (
        <ManualTimeModal
          projects={PROJECTS}
          onClose={() => setShowManualTime(false)}
          onSave={(session) => {
            setData(prev => ({
              ...prev,
              timeSessions: [...prev.timeSessions, { ...session, id: Date.now() }],
            }));
            setShowManualTime(false);
          }}
        />
      )}
      
      {showEditSession && editingSession && (
        <EditSessionModal
          session={editingSession}
          projects={PROJECTS}
          onClose={() => {
            setShowEditSession(false);
            setEditingSession(null);
          }}
          onSave={(updated) => {
            setData(prev => ({
              ...prev,
              timeSessions: prev.timeSessions.map(s => s.id === updated.id ? updated : s),
            }));
            setShowEditSession(false);
            setEditingSession(null);
          }}
          onDelete={(id) => {
            setData(prev => ({
              ...prev,
              timeSessions: prev.timeSessions.filter(s => s.id !== id),
            }));
            setShowEditSession(false);
            setEditingSession(null);
          }}
        />
      )}
      
      {showEditTodo && editingTodo && (
        <EditTodoModal
          todo={editingTodo}
          onClose={() => {
            setShowEditTodo(false);
            setEditingTodo(null);
          }}
          onSave={(updated) => {
            setData(prev => ({
              ...prev,
              todos: prev.todos.map(t => t.id === updated.id ? updated : t),
            }));
            setShowEditTodo(false);
            setEditingTodo(null);
          }}
          onDelete={(id) => {
            setData(prev => ({
              ...prev,
              todos: prev.todos.filter(t => t.id !== id),
            }));
            setShowEditTodo(false);
            setEditingTodo(null);
          }}
        />
      )}
      
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
