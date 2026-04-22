import React, { useState, useEffect } from 'react';
import { useTodoSync } from '../hooks/useTodoSync';
import { TodoParser } from '../utils/todo-parser';
import EditTodoModal from './EditTodoModal';

const PRIORITY_COLORS = {
  '🔴 Urgent': '#f66',
  '🟡 High': '#FFD93D',
  '🟢 Normal': '#95E881',
  '⚪ Low': '#888',
};

const STATUS_ICONS = {
  '⏳ Offen': '⏳',
  '✅ Fertig': '✅',
  '🔄 In Progress': '🔄',
  '❌ Blocked': '⛔',
};

const PROJECTS = [
  { id: 'tough-cookie', name: 'Tough Cookie', color: '#FF6B35', emoji: '🍪' },
  { id: 'nomu', name: 'NOMU', color: '#4ECDC4', emoji: '📱' },
  { id: 'kyberg', name: 'Kyberg Export', color: '#95E881', emoji: '💊' },
  { id: 'lubu', name: 'LuBu', color: '#E74C3C', emoji: '🍜' },
  { id: 'freelance', name: 'Freelance', color: '#A855F7', emoji: '🎬' },
  { id: 'export', name: 'Export', color: '#FFD93D', emoji: '📦' },
];

export default function TodoSyncWidget() {
  const {
    todos,
    loading,
    error,
    lastSync,
    syncTodos,
    toggleTodo,
    deleteTodo,
    updateTodo,
    getFilteredTodos,
    getTodosByProject,
    getStats,
  } = useTodoSync();

  const [filter, setFilter] = useState('all');
  const [projectFilter, setProjectFilter] = useState('all');
  const [editingTodo, setEditingTodo] = useState(null);
  const [stats, setStats] = useState({ total: 0, open: 0, completed: 0, overdue: 0, todayDue: 0 });

  useEffect(() => {
    setStats(getStats());
  }, [todos, getStats]);

  const filteredTodos = getFilteredTodos(filter);
  const todosByProject = getTodosByProject();

  const getProjectInfo = (projectId) => {
    return PROJECTS.find(p => p.id === projectId) || {
      id: projectId,
      name: projectId,
      color: '#888',
      emoji: '📁',
    };
  };

  const formatDeadline = (deadline) => {
    if (!deadline) return null;
    const today = new Date().toISOString().split('T')[0];
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split('T')[0];

    if (deadline === today) return { text: 'Heute', color: '#FFD93D' };
    if (deadline === tomorrowStr) return { text: 'Morgen', color: '#4ECDC4' };
    
    const date = new Date(deadline);
    const isOverdue = date < new Date(today);
    return {
      text: date.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' }),
      color: isOverdue ? '#f66' : '#888',
    };
  };

  const renderFilterButtons = () => (
    <div style={filterContainerStyle}>
      {[
        { id: 'today', label: 'Heute', count: stats.todayDue },
        { id: 'week', label: 'Diese Woche', count: 0 },
        { id: 'overdue', label: 'Überfällig', count: stats.overdue },
        { id: 'all', label: 'Alle', count: stats.open },
      ].map(f => (
        <button
          key={f.id}
          onClick={() => setFilter(f.id)}
          style={{
            ...filterButtonStyle,
            background: filter === f.id ? 'rgba(78,205,196,0.3)' : 'rgba(255,255,255,0.05)',
            borderColor: filter === f.id ? '#4ECDC4' : 'transparent',
            color: filter === f.id ? '#4ECDC4' : '#888',
          }}
        >
          {f.label}
          {f.count > 0 && (
            <span style={filterCountStyle}>{f.count}</span>
          )}
        </button>
      ))}
    </div>
  );

  const renderTodoItem = (todo) => {
    const project = getProjectInfo(todo.project);
    const deadline = formatDeadline(todo.deadline);
    const isOverdue = todo.deadline && new Date(todo.deadline) < new Date() && !todo.completed;

    return (
      <div
        key={todo.id}
        style={{
          ...todoItemStyle,
          opacity: todo.completed ? 0.5 : 1,
          borderLeft: `3px solid ${isOverdue ? '#f66' : project.color}`,
        }}
      >
        <input
          type="checkbox"
          checked={todo.completed}
          onChange={() => toggleTodo(todo.id)}
          style={{ ...checkboxStyle, cursor: 'pointer' }}
        />
        
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={todoTextStyle}>
            <span style={{ textDecoration: todo.completed ? 'line-through' : 'none' }}>
              {todo.text}
            </span>
          </div>
          
          <div style={todoMetaStyle}>
            <span style={{ color: project.color, fontSize: '0.8rem' }}>
              {project.emoji} {project.name}
            </span>
            {deadline && (
              <span style={{ color: deadline.color, fontSize: '0.8rem' }}>
                📅 {deadline.text}
              </span>
            )}
            {todo.tags?.length > 0 && todo.tags.map(tag => (
              <span key={tag} style={tagStyle}>
                #{tag}
              </span>
            ))}
          </div>
        </div>

        <div style={todoActionsStyle}>
          <span style={{ color: PRIORITY_COLORS[todo.priority] || '#888', fontSize: '0.9rem' }}>
            {todo.priority?.split(' ')[0]}
          </span>
          <button
            onClick={() => setEditingTodo(todo)}
            style={actionButtonStyle}
            title="Bearbeiten"
          >
            ✏️
          </button>
          <button
            onClick={() => deleteTodo(todo.id)}
            style={actionButtonStyle}
            title="Löschen"
          >
            🗑️
          </button>
        </div>
      </div>
    );
  };

  const renderProjectView = () => {
    const grouped = getTodosByProject();
    
    return (
      <div>
        {PROJECTS.map(project => {
          const projectTodos = grouped[project.id]?.filter(t => !t.completed) || [];
          if (projectTodos.length === 0) return null;

          return (
            <div key={project.id} style={projectSectionStyle}>
              <div style={{ ...projectHeaderStyle, borderColor: project.color }}>
                <span>{project.emoji} {project.name}</span>
                <span style={{ color: '#666', fontSize: '0.85rem' }}>
                  ({projectTodos.length} offen)
                </span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {projectTodos.map(renderTodoItem)}
              </div>
            </div>
          );
        })}

        {/* Unassigned todos */}
        {grouped['unassigned']?.filter(t => !t.completed)?.length > 0 && (
          <div style={projectSectionStyle}>
            <div style={{ ...projectHeaderStyle, borderColor: '#666' }}>
              <span>📁 Ohne Projekt</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {grouped['unassigned'].filter(t => !t.completed).map(renderTodoItem)}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div style={widgetStyle}>
      <div style={headerStyle}>
        <div>
          <h2 style={{ margin: 0, color: '#fff', fontSize: '1.2rem' }}>
            ✅ To-Do Sync
          </h2>
          {lastSync && (
            <p style={{ margin: '4px 0 0', color: '#666', fontSize: '0.75rem' }}>
              Zuletzt synchronisiert: {new Date(lastSync).toLocaleTimeString('de-DE')}
            </p>
          )}
        </div>
        <div style={statsContainerStyle}>
          <div style={statItemStyle}>
            <span style={{ color: '#95E881', fontSize: '1.2rem', fontWeight: 700 }}>
              {stats.open}
            </span>
            <span style={{ color: '#666', fontSize: '0.75rem' }}>Offen</span>
          </div>
          {stats.overdue > 0 && (
            <div style={statItemStyle}>
              <span style={{ color: '#f66', fontSize: '1.2rem', fontWeight: 700 }}>
                {stats.overdue}
              </span>
              <span style={{ color: '#666', fontSize: '0.75rem' }}>Überfällig</span>
            </div>
          )}
        </div>
      </div>

      {renderFilterButtons()}

      <div style={actionsStyle}>
        <button
          onClick={syncTodos}
          disabled={loading}
          style={syncButtonStyle}
        >
          {loading ? '🔄 Synchronisiere...' : '🔄 Jetzt synchronisieren'}
        </button>
        
        <div style={viewToggleStyle}>
          <button
            onClick={() => setProjectFilter('all')}
            style={{
              ...viewButtonStyle,
              background: projectFilter === 'all' ? 'rgba(78,205,196,0.2)' : 'transparent',
            }}
          >
            Liste
          </button>
          <button
            onClick={() => setProjectFilter('by-project')}
            style={{
              ...viewButtonStyle,
              background: projectFilter === 'by-project' ? 'rgba(78,205,196,0.2)' : 'transparent',
            }}
          >
            Nach Projekt
          </button>
        </div>
      </div>

      {error && (
        <div style={errorStyle}>
          ⚠️ {error}
        </div>
      )}

      <div style={todosContainerStyle}>
        {loading && todos.length === 0 ? (
          <div style={emptyStyle}>
            ⏳ Lade To-Dos...
          </div>
        ) : todos.length === 0 ? (
          <div style={emptyStyle}>
            <div style={{ fontSize: '2rem', marginBottom: '10px' }}>📝</div>
            <p>Keine To-Dos gefunden</p>
            <p style={{ fontSize: '0.85rem', color: '#666', marginTop: '5px' }}>
              Synchronisiere mit memory/ und TODOS.md
            </p>
          </div>
        ) : projectFilter === 'by-project' ? (
          renderProjectView()
        ) : filteredTodos.length === 0 ? (
          <div style={emptyStyle}>
            Keine To-Dos für diesen Filter
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {filteredTodos.map(renderTodoItem)}
          </div>
        )}
      </div>

      {editingTodo && (
        <EditTodoModal
          todo={editingTodo}
          onClose={() => setEditingTodo(null)}
          onSave={(updates) => {
            updateTodo(editingTodo.id, updates);
            setEditingTodo(null);
          }}
          onDelete={() => {
            deleteTodo(editingTodo.id);
            setEditingTodo(null);
          }}
        />
      )}
    </div>
  );
}

// Styles
const widgetStyle = {
  background: 'rgba(255,255,255,0.03)',
  border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: '16px',
  padding: '20px',
};

const headerStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'flex-start',
  marginBottom: '15px',
};

const statsContainerStyle = {
  display: 'flex',
  gap: '15px',
};

const statItemStyle = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: '2px',
};

const filterContainerStyle = {
  display: 'flex',
  gap: '8px',
  flexWrap: 'wrap',
  marginBottom: '15px',
};

const filterButtonStyle = {
  padding: '6px 12px',
  border: '1px solid transparent',
  borderRadius: '6px',
  background: 'rgba(255,255,255,0.05)',
  color: '#888',
  cursor: 'pointer',
  fontSize: '0.8rem',
  fontFamily: 'inherit',
  display: 'flex',
  alignItems: 'center',
  gap: '6px',
};

const filterCountStyle = {
  background: 'rgba(255,255,255,0.1)',
  borderRadius: '10px',
  padding: '2px 6px',
  fontSize: '0.7rem',
};

const actionsStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: '15px',
  flexWrap: 'wrap',
  gap: '10px',
};

const syncButtonStyle = {
  padding: '8px 16px',
  background: 'rgba(78,205,196,0.2)',
  border: '1px solid rgba(78,205,196,0.3)',
  borderRadius: '8px',
  color: '#4ECDC4',
  cursor: 'pointer',
  fontSize: '0.85rem',
  fontFamily: 'inherit',
};

const viewToggleStyle = {
  display: 'flex',
  gap: '4px',
  padding: '4px',
  background: 'rgba(0,0,0,0.3)',
  borderRadius: '8px',
};

const viewButtonStyle = {
  padding: '6px 12px',
  border: 'none',
  borderRadius: '6px',
  color: '#888',
  cursor: 'pointer',
  fontSize: '0.8rem',
  fontFamily: 'inherit',
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

const todosContainerStyle = {
  maxHeight: '500px',
  overflowY: 'auto',
};

const emptyStyle = {
  textAlign: 'center',
  padding: '40px 20px',
  color: '#666',
};

const todoItemStyle = {
  display: 'flex',
  alignItems: 'flex-start',
  gap: '12px',
  padding: '12px',
  background: 'rgba(255,255,255,0.03)',
  borderRadius: '8px',
  transition: 'all 0.2s',
};

const checkboxStyle = {
  width: '18px',
  height: '18px',
  marginTop: '2px',
};

const todoTextStyle = {
  color: '#fff',
  fontSize: '0.9rem',
  lineHeight: '1.4',
  marginBottom: '4px',
};

const todoMetaStyle = {
  display: 'flex',
  gap: '10px',
  flexWrap: 'wrap',
  alignItems: 'center',
};

const tagStyle = {
  padding: '2px 6px',
  background: 'rgba(255,107,53,0.15)',
  borderRadius: '4px',
  fontSize: '0.7rem',
  color: '#FF6B35',
};

const todoActionsStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
};

const actionButtonStyle = {
  background: 'none',
  border: 'none',
  color: '#666',
  cursor: 'pointer',
  fontSize: '0.9rem',
  padding: '4px',
  opacity: 0.7,
  transition: 'opacity 0.2s',
};

const projectSectionStyle = {
  marginBottom: '20px',
};

const projectHeaderStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  paddingBottom: '10px',
  borderBottom: '2px solid',
  marginBottom: '12px',
  color: '#fff',
  fontWeight: 600,
};
