import React, { useMemo } from 'react';

export default function DeadlinesWidget({ todos }) {
  const deadlineInfo = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const upcoming = [];
    const overdue = [];
    const todayDue = [];
    
    todos.forEach(todo => {
      if (todo.completed) return;
      
      const deadlineStr = todo.deadline;
      if (!deadlineStr) return;
      
      const deadline = new Date(deadlineStr);
      deadline.setHours(0, 0, 0, 0);
      
      const diffDays = Math.ceil((deadline - today) / (1000 * 60 * 60 * 24));
      
      const info = {
        ...todo,
        deadline,
        daysUntil: diffDays,
      };
      
      if (diffDays < 0) {
        overdue.push(info);
      } else if (diffDays === 0) {
        todayDue.push(info);
      } else if (diffDays <= 7) {
        upcoming.push(info);
      }
    });
    
    // Sort by deadline
    overdue.sort((a, b) => a.deadline - b.deadline);
    todayDue.sort((a, b) => a.deadline - b.deadline);
    upcoming.sort((a, b) => a.deadline - b.deadline);
    
    return { overdue, todayDue, upcoming };
  }, [todos]);
  
  const formatDeadline = (daysUntil) => {
    if (daysUntil === 0) return 'Heute';
    if (daysUntil === 1) return 'Morgen';
    if (daysUntil < 0) return `Vor ${Math.abs(daysUntil)} Tagen`;
    return `In ${daysUntil} Tagen`;
  };
  
  const totalAlerts = deadlineInfo.overdue.length + deadlineInfo.todayDue.length + deadlineInfo.upcoming.length;
  
  if (totalAlerts === 0) {
    return null;
  }
  
  return (
    <div style={{
      background: 'linear-gradient(135deg, rgba(255,107,53,0.15), rgba(255,0,0,0.1))',
      border: '1px solid rgba(255,107,53,0.3)',
      borderRadius: '16px',
      padding: '20px',
      marginBottom: '20px',
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        marginBottom: '15px',
      }}>
        <span style={{ fontSize: '1.5rem' }}>⏰</span>
        <h3 style={{ margin: 0, color: '#FF6B35', fontSize: '1.1rem' }}>
          Deadline Alerts
        </h3>
        <span style={{
          background: '#FF6B35',
          color: '#000',
          padding: '2px 8px',
          borderRadius: '12px',
          fontSize: '0.8rem',
          fontWeight: 600,
        }}>
          {totalAlerts}
        </span>
      </div>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {/* Overdue */}
        {deadlineInfo.overdue.map(todo => (
          <div key={todo.id} style={alertItemStyle('overdue')}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>🔴</span>
              <span style={{ fontWeight: 500 }}>{todo.title}</span>
            </div>
            <span style={badgeStyle('overdue')}>
              {formatDeadline(todo.daysUntil)}
            </span>
          </div>
        ))}
        
        {/* Due today */}
        {deadlineInfo.todayDue.map(todo => (
          <div key={todo.id} style={alertItemStyle('today')}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>🟡</span>
              <span style={{ fontWeight: 500 }}>{todo.title}</span>
            </div>
            <span style={badgeStyle('today')}>
              HEUTE
            </span>
          </div>
        ))}
        
        {/* Upcoming */}
        {deadlineInfo.upcoming.slice(0, 3).map(todo => (
          <div key={todo.id} style={alertItemStyle('upcoming')}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>🟢</span>
              <span style={{ fontWeight: 500 }}>{todo.title}</span>
            </div>
            <span style={badgeStyle('upcoming')}>
              {formatDeadline(todo.daysUntil)}
            </span>
          </div>
        ))}
        
        {deadlineInfo.upcoming.length > 3 && (
          <div style={{ textAlign: 'center', color: '#888', fontSize: '0.8rem', marginTop: '5px' }}>
            +{deadlineInfo.upcoming.length - 3} weitere Deadlines
          </div>
        )}
      </div>
    </div>
  );
}

const alertItemStyle = (type) => ({
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: '10px 12px',
  background: type === 'overdue' ? 'rgba(255,0,0,0.1)' : 
               type === 'today' ? 'rgba(255,193,7,0.1)' : 
               'rgba(255,255,255,0.05)',
  borderRadius: '8px',
  borderLeft: `3px solid ${
    type === 'overdue' ? '#f66' : 
    type === 'today' ? '#FFD93D' : 
    '#4ECDC4'
  }`,
});

const badgeStyle = (type) => ({
  padding: '3px 8px',
  borderRadius: '4px',
  fontSize: '0.75rem',
  fontWeight: 600,
  background: type === 'overdue' ? '#f66' : 
               type === 'today' ? '#FFD93D' : 
               '#4ECDC4',
  color: type === 'today' ? '#000' : '#fff',
});
