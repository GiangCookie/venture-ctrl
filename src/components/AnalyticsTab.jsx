import React, { useState, useMemo } from 'react';
import {
  LineChart, Line, BarChart, Bar, AreaChart, Area,
  XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell,
  Legend, CartesianGrid
} from 'recharts';

const MOOD_EMOJIS = ['😴', '😐', '🙂', '😊', '🔥'];

export default function AnalyticsTab({ data, journalEntries }) {
  const [viewRange, setViewRange] = useState(30); // 7, 30, 90 days
  const [activeMetric, setActiveMetric] = useState('overview');

  // Calculate date range
  const dateRange = useMemo(() => {
    const today = new Date();
    const dates = [];
    for (let i = viewRange - 1; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      dates.push(date.toISOString().split('T')[0]);
    }
    return dates;
  }, [viewRange]);

  // Time tracking analytics
  const timeAnalytics = useMemo(() => {
    const dailyData = dateRange.map(date => {
      const daySessions = data.timeSessions.filter(s =>
        s.startTime?.startsWith(date)
      );
      const totalMinutes = daySessions.reduce((acc, s) => acc + (s.duration || 0), 0);
      const avgMood = daySessions.length > 0
        ? daySessions.reduce((acc, s) => acc + (s.mood || 3), 0) / daySessions.length
        : 0;

      return {
        date,
        hours: +(totalMinutes / 60).toFixed(1),
        sessions: daySessions.length,
        mood: +avgMood.toFixed(1),
      };
    });

    const totalHours = dailyData.reduce((acc, d) => acc + d.hours, 0);
    const avgHoursPerDay = totalHours / viewRange;
    const totalSessions = dailyData.reduce((acc, d) => acc + d.sessions, 0);

    return {
      dailyData,
      totalHours,
      avgHoursPerDay,
      totalSessions,
    };
  }, [data.timeSessions, dateRange, viewRange]);

  // Financial analytics
  const financeAnalytics = useMemo(() => {
    const dailyData = dateRange.map(date => {
      const dayIncome = data.income.filter(i =>
        i.date?.startsWith(date)
      );
      const income = dayIncome.filter(i => i.amount > 0).reduce((acc, i) => acc + i.amount, 0);
      const expenses = dayIncome.filter(i => i.amount < 0).reduce((acc, i) => acc + Math.abs(i.amount), 0);

      return {
        date,
        income,
        expenses,
        net: income - expenses,
      };
    });

    const totalIncome = dailyData.reduce((acc, d) => acc + d.income, 0);
    const totalExpenses = dailyData.reduce((acc, d) => acc + d.expenses, 0);
    const avgIncomePerDay = totalIncome / viewRange;

    return {
      dailyData,
      totalIncome,
      totalExpenses,
      netProfit: totalIncome - totalExpenses,
      avgIncomePerDay,
    };
  }, [data.income, dateRange, viewRange]);

  // Project breakdown
  const projectBreakdown = useMemo(() => {
    const projects = {};

    // Aggregate time per project
    data.timeSessions.forEach(s => {
      if (!projects[s.projectId]) {
        projects[s.projectId] = { hours: 0, income: 0 };
      }
      projects[s.projectId].hours += (s.duration || 0) / 60;
    });

    // Aggregate income per project
    data.income.forEach(i => {
      if (!projects[i.projectId]) {
        projects[i.projectId] = { hours: 0, income: 0 };
      }
      if (i.amount > 0) {
        projects[i.projectId].income += i.amount;
      }
    });

    return Object.entries(projects).map(([id, stats]) => ({
      projectId: id,
      hours: +stats.hours.toFixed(1),
      income: stats.income,
      hourlyRate: stats.hours > 0 ? +(stats.income / stats.hours).toFixed(2) : 0,
    }));
  }, [data.timeSessions, data.income]);

  // Mood/Energy trends from journal
  const moodTrends = useMemo(() => {
    if (!journalEntries?.length) return null;

    const entries = journalEntries
      .filter(e => dateRange.includes(e.date) && e.summary)
      .map(e => ({
        date: e.date,
        mood: e.summary.mood || 3,
        energy: e.summary.energy || 3,
      }));

    const avgMood = entries.length > 0
      ? entries.reduce((acc, e) => acc + e.mood, 0) / entries.length
      : 0;
    const avgEnergy = entries.length > 0
      ? entries.reduce((acc, e) => acc + e.energy, 0) / entries.length
      : 0;

    return {
      entries,
      avgMood,
      avgEnergy,
    };
  }, [journalEntries, dateRange]);

  // Todo completion rate
  const todoStats = useMemo(() => {
    const allTodos = data.todos;
    const completed = allTodos.filter(t => t.completed).length;
    const total = allTodos.length;
    const rate = total > 0 ? (completed / total) * 100 : 0;

    // By priority
    const byPriority = {};
    allTodos.forEach(t => {
      const priority = t.priority || '🟢 Normal';
      if (!byPriority[priority]) {
        byPriority[priority] = { total: 0, completed: 0 };
      }
      byPriority[priority].total++;
      if (t.completed) {
        byPriority[priority].completed++;
      }
    });

    return {
      completed,
      total,
      rate: +rate.toFixed(1),
      byPriority,
    };
  }, [data.todos]);

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' });
  };

  const COLORS = ['#FF6B35', '#4ECDC4', '#95E881', '#A855F7', '#FFD93D'];

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
          📊 Analytics
        </h2>

        <div style={{ display: 'flex', gap: '10px' }}>
          {[7, 30, 90].map(days => (
            <button
              key={days}
              onClick={() => setViewRange(days)}
              style={{
                padding: '10px 18px',
                background: viewRange === days ? '#4ECDC4' : 'rgba(255,255,255,0.1)',
                border: 'none',
                borderRadius: '8px',
                color: viewRange === days ? '#000' : '#fff',
                cursor: 'pointer',
                fontWeight: 600,
              }}
            >
              {days} Tage
            </button>
          ))}
        </div>
      </div>

      {/* Stats Overview */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
        gap: '12px',
      }}>
        <StatCard
          label="Gesamtstunden"
          value={timeAnalytics.totalHours.toFixed(1)}
          suffix="h"
          color="#4ECDC4"
          sub={`Ø ${timeAnalytics.avgHoursPerDay.toFixed(1)}h/Tag`}
        />
        <StatCard
          label="Einnahmen"
          value={financeAnalytics.totalIncome.toLocaleString('de-DE')}
          suffix="€"
          color="#95E881"
          sub={`Ø ${financeAnalytics.avgIncomePerDay.toFixed(0)}€/Tag`}
        />
        <StatCard
          label="Todo-Erledigung"
          value={todoStats.rate}
          suffix="%"
          color="#FF6B35"
          sub={`${todoStats.completed}/${todoStats.total}`}
        />
        {moodTrends && (
          <StatCard
            label="Ø Stimmung"
            value={MOOD_EMOJIS[Math.round(moodTrends.avgMood) - 1]}
            suffix=""
            color="#FFD93D"
            sub={`Ø Energie: ${MOOD_EMOJIS[Math.round(moodTrends.avgEnergy) - 1]}`}
          />
        )}
      </div>

      {/* Time Tracking Chart */}
      <div style={cardStyle}>
        <h3 style={{ margin: '0 0 15px', color: '#fff', fontSize: '1rem' }}>
          ⏱️ Zeit-Tracking ({viewRange} Tage)
        </h3>
        <ResponsiveContainer width="100%" height={250}>
          <AreaChart data={timeAnalytics.dailyData}>
            <defs>
              <linearGradient id="colorHours" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#4ECDC4" stopOpacity={0.4}/>
                <stop offset="95%" stopColor="#4ECDC4" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#333" />
            <XAxis
              dataKey="date"
              tickFormatter={formatDate}
              stroke="#666"
              fontSize={12}
            />
            <YAxis stroke="#666" fontSize={12} />
            <Tooltip
              contentStyle={{
                background: '#1a1a2e',
                border: '1px solid #333',
                borderRadius: '8px',
              }}
            />
            <Area
              type="monotone"
              dataKey="hours"
              stroke="#4ECDC4"
              fill="url(#colorHours)"
              strokeWidth={2}
            />
            <Line
              type="monotone"
              dataKey="mood"
              stroke="#FFD93D"
              strokeWidth={2}
              dot={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Financial Chart */}
      <div style={cardStyle}>
        <h3 style={{ margin: '0 0 15px', color: '#fff', fontSize: '1rem' }}>
          💰 Finanzen ({viewRange} Tage)
        </h3>
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={financeAnalytics.dailyData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#333" />
            <XAxis
              dataKey="date"
              tickFormatter={formatDate}
              stroke="#666"
              fontSize={12}
            />
            <YAxis stroke="#666" fontSize={12} />
            <Tooltip
              contentStyle={{
                background: '#1a1a2e',
                border: '1px solid #333',
                borderRadius: '8px',
              }}
            />
            <Bar dataKey="income" fill="#95E881" radius={[4, 4, 0, 0]} />
            <Bar dataKey="expenses" fill="#f66" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
        <div style={{
          display: 'flex',
          justifyContent: 'space-around',
          marginTop: '15px',
          padding: '10px',
          background: 'rgba(255,255,255,0.02)',
          borderRadius: '8px',
        }}>
          <div>
            <span style={{ color: '#95E881' }}>● Einnahmen</span>
            <span style={{ color: '#fff', marginLeft: '10px', fontWeight: 600 }}>
              {financeAnalytics.totalIncome.toLocaleString('de-DE')}€
            </span>
          </div>
          <div>
            <span style={{ color: '#f66' }}>● Ausgaben</span>
            <span style={{ color: '#fff', marginLeft: '10px', fontWeight: 600 }}>
              {financeAnalytics.totalExpenses.toLocaleString('de-DE')}€
            </span>
          </div>
          <div>
            <span style={{ color: '#4ECDC4' }}>● Netto</span>
            <span style={{ color: '#fff', marginLeft: '10px', fontWeight: 600 }}>
              {financeAnalytics.netProfit.toLocaleString('de-DE')}€
            </span>
          </div>
        </div>
      </div>

      {/* Project Breakdown */}
      {projectBreakdown.length > 0 && (
        <div style={cardStyle}>
          <h3 style={{ margin: '0 0 15px', color: '#fff', fontSize: '1rem' }}>
            🎯 Projekte
          </h3>
          <div style={{ display: 'grid', gap: '10px' }}>
            {projectBreakdown.map((project, i) => (
              <div key={project.projectId} style={{
                display: 'flex',
                alignItems: 'center',
                gap: '15px',
                padding: '12px',
                background: 'rgba(255,255,255,0.03)',
                borderRadius: '8px',
              }}>
                <div style={{
                  width: '12px',
                  height: '12px',
                  borderRadius: '50%',
                  background: COLORS[i % COLORS.length],
                }} />
                <div style={{ flex: 1 }}>
                  <div style={{ color: '#fff', fontWeight: 500 }}>
                    {project.projectId}
                  </div>
                  <div style={{ color: '#888', fontSize: '0.85rem' }}>
                    {project.hours}h · {project.income.toLocaleString('de-DE')}€
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ color: '#4ECDC4', fontWeight: 600 }}>
                    {project.hourlyRate}€/h
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Mood Trends */}
      {moodTrends?.entries?.length > 0 && (
        <div style={cardStyle}>
          <h3 style={{ margin: '0 0 15px', color: '#fff', fontSize: '1rem' }}>
            😊 Stimmung & Energie ({viewRange} Tage)
          </h3>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={moodTrends.entries}>
              <CartesianGrid strokeDasharray="3 3" stroke="#333" />
              <XAxis
                dataKey="date"
                tickFormatter={formatDate}
                stroke="#666"
                fontSize={12}
              />
              <YAxis domain={[1, 5]} stroke="#666" fontSize={12} />
              <Tooltip
                contentStyle={{
                  background: '#1a1a2e',
                  border: '1px solid #333',
                  borderRadius: '8px',
                }}
              />
              <Line
                type="monotone"
                dataKey="mood"
                stroke="#FFD93D"
                strokeWidth={2}
                dot={{ fill: '#FFD93D' }}
              />
              <Line
                type="monotone"
                dataKey="energy"
                stroke="#4ECDC4"
                strokeWidth={2}
                dot={{ fill: '#4ECDC4' }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value, suffix, color, sub }) {
  return (
    <div style={{
      background: `linear-gradient(135deg, ${color}15, ${color}05)`,
      border: `1px solid ${color}30`,
      borderRadius: '12px',
      padding: '16px',
    }}>
      <p style={{
        margin: 0,
        color: '#888',
        fontSize: '0.75rem',
        textTransform: 'uppercase',
        letterSpacing: '0.05em',
      }}>
        {label}
      </p>
      <p style={{
        margin: '8px 0 4px',
        fontSize: '1.8rem',
        fontWeight: 700,
        color,
      }}>
        {value}
        <span style={{ fontSize: '1rem', opacity: 0.7 }}>{suffix}</span>
      </p>
      {sub && (
        <p style={{ margin: 0, color: '#666', fontSize: '0.8rem' }}>
          {sub}
        </p>
      )}
    </div>
  );
}

const cardStyle = {
  background: 'rgba(255,255,255,0.03)',
  border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: '16px',
  padding: '20px',
};
