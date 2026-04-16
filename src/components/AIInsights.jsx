import React, { useMemo } from 'react';

export default function AIInsights({ data, journalEntries }) {
  const insights = useMemo(() => {
    const results = [];

    // 1. Time utilization patterns
    const hourlyDistribution = analyzeHourlyDistribution(data.timeSessions);
    if (hourlyDistribution.peakHour) {
      results.push({
        type: 'productivity',
        title: '🕐 Produktivste Zeit',
        description: `Deine produktivsten Stunden sind zwischen ${hourlyDistribution.peakHour}:00 und ${hourlyDistribution.peakHour + 1}:00 Uhr.`,
        action: 'Plane deine wichtigsten Aufgaben in diese Zeit.',
        confidence: 85,
      });
    }

    // 2. Project focus analysis
    const projectFocus = analyzeProjectFocus(data.timeSessions);
    if (projectFocus.mostTimeProject) {
      results.push({
        type: 'focus',
        title: '🎯 Fokusanalyse',
        description: `${projectFocus.mostTimeProject} nimmt ${projectFocus.percentage}% deiner Zeit ein.`,
        action: projectFocus.percentage > 70 
          ? 'Gute Balance erhalten oder andere Projekte priorisieren.'
          : 'Überlege, ob du mehr Zeit für dein Hauptprojekt investieren solltest.',
        confidence: 90,
      });
    }

    // 3. Mood correlation with productivity
    const moodCorrelation = analyzeMoodCorrelation(data.timeSessions);
    if (moodCorrelation.strongCorrelation) {
      results.push({
        type: 'wellbeing',
        title: '😊 Stimmung & Produktivität',
        description: `An Tagen mit guter Stimmung (${moodCorrelation.bestMoodEmoji}) warst du ${moodCorrelation.productivityDiff}% produktiver.`,
        action: 'Achte auf ausreichend Schlaf und Pausen, um deine Stimmung zu optimieren.',
        confidence: 75,
      });
    }

    // 4. Income trends
    const incomeTrend = analyzeIncomeTrend(data.income);
    if (incomeTrend.trend) {
      results.push({
        type: 'finance',
        title: incomeTrend.trend === 'up' ? '📈 Positive Einkommensentwicklung' : '📉 Einkommensabwärtstrend',
        description: incomeTrend.trend === 'up'
          ? `Dein Einkommen ist um ${incomeTrend.percentage}% gestiegen.`
          : `Dein Einkommen ist um ${Math.abs(incomeTrend.percentage)}% gesunken.`,
        action: incomeTrend.trend === 'up'
          ? 'Gute Arbeit! Analysiere, was funktioniert hat.'
          : 'Überprüfe deine Pipeline und aktive Deals.',
        confidence: 80,
      });
    }

    // 5. Todo completion rate
    const todoRate = analyzeTodoCompletion(data.todos);
    results.push({
      type: 'tasks',
      title: '✅ Todo-Erledigungsrate',
      description: `Du hast ${todoRate.completed} von ${todoRate.total} Todos erledigt (${todoRate.rate}%).`,
      action: todoRate.rate > 80
        ? 'Exzellente Erledigungsrate!'
        : todoRate.rate > 50
        ? 'Guter Fortschritt. Versuche, kleinere Aufgaben schneller abzuschließen.'
        : 'Überlege, ob du Prioritäten neu setzen oder Aufgaben delegieren solltest.',
      confidence: 95,
    });

    // 6. Deadline warnings
    const deadlineWarnings = analyzeDeadlines(data.todos);
    if (deadlineWarnings.overdue.length > 0) {
      results.push({
        type: 'urgent',
        title: '⏰ Überfällige Todos',
        description: `${deadlineWarnings.overdue.length} Todos sind überfällig.`,
        action: 'Kläre diese Todos heute oder verschiebe die Deadlines.',
        confidence: 100,
      });
    }

    // 7. Pipeline velocity
    const pipelineVelocity = analyzePipelineVelocity(data.pipeline);
    if (pipelineVelocity.avgDaysToClose) {
      results.push({
        type: 'sales',
        title: '💼 Pipeline-Geschwindigkeit',
        description: `Durchschnittlich ${pipelineVelocity.avgDaysToClose} Tage von Lead bis Abschluss.`,
        action: pipelineVelocity.avgDaysToClose > 30
          ? 'Deine Sales-Cycle ist lang. Überlege, wie du Beschlüsse beschleunigen kannst.'
          : 'Gute Pipeline-Geschwindigkeit!',
        confidence: 70,
      });
    }

    // 8. Journal sentiment (if available)
    if (journalEntries?.length > 0) {
      const sentiment = analyzeJournalSentiment(journalEntries);
      results.push({
        type: 'reflection',
        title: '📓 Reflexions-Trend',
        description: sentiment.trend === 'improving'
          ? 'Deine Abend-Reviews zeigen eine positive Entwicklung.'
          : sentiment.trend === 'declining'
          ? 'Deine Abend-Reviews zeigen Raum für Verbesserung.'
          : 'Deine Stimmung ist stabil.',
        action: sentiment.trend === 'declining'
          ? 'Nimm dir Zeit für Selbstfürsorge und Pausen.'
          : 'Nutze deine Reflexionen, um Muster zu erkennen.',
        confidence: 65,
      });
    }

    return results;
  }, [data, journalEntries]);

  const getInsightIcon = (type) => {
    const icons = {
      productivity: '⏱️',
      focus: '🎯',
      wellbeing: '😊',
      finance: '💰',
      tasks: '✅',
      urgent: '🔴',
      sales: '💼',
      reflection: '📓',
    };
    return icons[type] || '💡';
  };

  const getInsightColor = (type) => {
    const colors = {
      productivity: '#4ECDC4',
      focus: '#FF6B35',
      wellbeing: '#FFD93D',
      finance: '#95E881',
      tasks: '#4ECDC4',
      urgent: '#f66',
      sales: '#A855F7',
      reflection: '#4ECDC4',
    };
    return colors[type] || '#fff';
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '15px',
      }}>
        <h2 style={{ margin: 0, color: '#fff', fontSize: '1.3rem' }}>
          🤖 AI Insights
        </h2>
        <span style={{ color: '#666', fontSize: '0.85rem' }}>
          Automatisch generiert aus deinen Daten
        </span>
      </div>

      {insights.length === 0 ? (
        <div style={{
          textAlign: 'center',
          padding: '60px 20px',
          color: '#666',
        }}>
          <p style={{ fontSize: '3rem', margin: '0 0 10px' }}>🤖</p>
          <p>Noch nicht genug Daten für Insights</p>
          <p style={{ fontSize: '0.85rem', marginTop: '10px' }}>
            Tracke mehr Sessions, Todos und Einnahmen, um personalisierte Empfehlungen zu erhalten.
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {insights.map((insight, index) => (
            <div
              key={index}
              style={{
                background: 'rgba(255,255,255,0.03)',
                border: `1px solid ${getInsightColor(insight.type)}20`,
                borderRadius: '16px',
                padding: '20px',
                position: 'relative',
              }}
            >
              <div style={{
                display: 'flex',
                gap: '15px',
                alignItems: 'flex-start',
              }}>
                <div style={{
                  width: '44px',
                  height: '44px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: `${getInsightColor(insight.type)}20`,
                  borderRadius: '12px',
                  fontSize: '1.5rem',
                }}>
                  {getInsightIcon(insight.type)}
                </div>

                <div style={{ flex: 1 }}>
                  <h3 style={{
                    margin: '0 0 8px',
                    color: getInsightColor(insight.type),
                    fontSize: '1rem',
                  }}>
                    {insight.title}
                  </h3>

                  <p style={{
                    margin: '0 0 12px',
                    color: '#ccc',
                    lineHeight: '1.5',
                  }}>
                    {insight.description}
                  </p>

                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '10px 14px',
                    background: 'rgba(0,0,0,0.2)',
                    borderRadius: '8px',
                  }}>
                    <span style={{ fontSize: '1rem' }}>💡</span>
                    <span style={{ color: '#888', fontSize: '0.9rem' }}>
                      {insight.action}
                    </span>
                  </div>
                </div>

                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'flex-end',
                  gap: '4px',
                }}>
                  <span style={{
                    fontSize: '0.75rem',
                    color: '#666',
                  }}>
                    Konfidenz
                  </span>
                  <span style={{
                    padding: '4px 10px',
                    background: `${getInsightColor(insight.type)}20`,
                    borderRadius: '12px',
                    color: getInsightColor(insight.type),
                    fontSize: '0.85rem',
                    fontWeight: 600,
                  }}>
                    {insight.confidence}%
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// Analysis functions
function analyzeHourlyDistribution(sessions) {
  const hourlyTotals = {};
  
  sessions.forEach(session => {
    const hour = new Date(session.startTime).getHours();
    hourlyTotals[hour] = (hourlyTotals[hour] || 0) + (session.duration || 0);
  });

  const sorted = Object.entries(hourlyTotals)
    .sort((a, b) => b[1] - a[1]);

  return {
    peakHour: sorted.length > 0 ? parseInt(sorted[0][0]) : null,
    distribution: hourlyTotals,
  };
}

function analyzeProjectFocus(sessions) {
  const projectTime = {};
  let totalTime = 0;

  sessions.forEach(session => {
    projectTime[session.projectId] = (projectTime[session.projectId] || 0) + (session.duration || 0);
    totalTime += session.duration || 0;
  });

  const sorted = Object.entries(projectTime)
    .sort((a, b) => b[1] - a[1]);

  if (sorted.length === 0) return {};

  const mostTime = sorted[0];
  return {
    mostTimeProject: mostTime[0],
    percentage: totalTime > 0 ? Math.round((mostTime[1] / totalTime) * 100) : 0,
  };
}

function analyzeMoodCorrelation(sessions) {
  const moodGroups = {};

  sessions.forEach(session => {
    const mood = session.mood || 3;
    if (!moodGroups[mood]) {
      moodGroups[mood] = { totalTime: 0, count: 0 };
    }
    moodGroups[mood].totalTime += session.duration || 0;
    moodGroups[mood].count += 1;
  });

  const averages = Object.entries(moodGroups).map(([mood, data]) => ({
    mood: parseInt(mood),
    avgTime: data.totalTime / data.count,
  }));

  if (averages.length < 2) return {};

  const best = averages.reduce((max, curr) => curr.avgTime > max.avgTime ? curr : max);
  const worst = averages.reduce((min, curr) => curr.avgTime < min.avgTime ? curr : min);

  const MOOD_EMOJIS = ['😴', '😐', '🙂', '😊', '🔥'];
  
  return {
    strongCorrelation: best.avgTime > worst.avgTime * 1.2,
    bestMoodEmoji: MOOD_EMOJIS[best.mood - 1],
    productivityDiff: worst.avgTime > 0 
      ? Math.round(((best.avgTime - worst.avgTime) / worst.avgTime) * 100)
      : 0,
  };
}

function analyzeIncomeTrend(income) {
  if (income.length < 4) return null;

  const sorted = [...income].sort((a, b) => new Date(a.date) - new Date(b.date));
  const half = Math.floor(sorted.length / 2);
  const firstHalf = sorted.slice(0, half);
  const secondHalf = sorted.slice(half);

  const firstSum = firstHalf.reduce((acc, i) => acc + Math.max(0, i.amount), 0);
  const secondSum = secondHalf.reduce((acc, i) => acc + Math.max(0, i.amount), 0);

  if (firstSum === 0) return null;

  const percentage = Math.round(((secondSum - firstSum) / firstSum) * 100);

  return {
    trend: percentage > 0 ? 'up' : 'down',
    percentage: Math.abs(percentage),
  };
}

function analyzeTodoCompletion(todos) {
  const total = todos.length;
  const completed = todos.filter(t => t.completed).length;

  return {
    total,
    completed,
    rate: total > 0 ? Math.round((completed / total) * 100) : 0,
  };
}

function analyzeDeadlines(todos) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const overdue = todos.filter(t => {
    if (!t.deadline || t.completed) return false;
    return new Date(t.deadline) < today;
  });

  const upcoming = todos.filter(t => {
    if (!t.deadline || t.completed) return false;
    const diff = (new Date(t.deadline) - today) / (1000 * 60 * 60 * 24);
    return diff >= 0 && diff <= 7;
  });

  return { overdue, upcoming };
}

function analyzePipelineVelocity(pipeline) {
  const closedDeals = pipeline.filter(d => 
    d.stage === 'Closed Won' || d.stage === 'Closed Lost'
  );

  if (closedDeals.length === 0) return {};

  const days = closedDeals.map(d => {
    const created = new Date(d.createdAt);
    const closed = new Date(d.closedAt || d.createdAt);
    return (closed - created) / (1000 * 60 * 60 * 24);
  });

  const avgDays = days.reduce((a, b) => a + b, 0) / days.length;

  return {
    avgDaysToClose: Math.round(avgDays),
    closedCount: closedDeals.length,
    wonRate: Math.round(
      (closedDeals.filter(d => d.stage === 'Closed Won').length / closedDeals.length) * 100
    ),
  };
}

function analyzeJournalSentiment(entries) {
  if (entries.length < 3) return { trend: 'stable' };

  const sorted = [...entries].sort((a, b) => new Date(a.date) - new Date(b.date));
  const recent = sorted.slice(-5);
  const older = sorted.slice(0, -5);

  const recentAvg = recent.reduce((acc, e) => acc + (e.summary?.mood || 3), 0) / recent.length;
  const olderAvg = older.length > 0 
    ? older.reduce((acc, e) => acc + (e.summary?.mood || 3), 0) / older.length
    : recentAvg;

  const diff = recentAvg - olderAvg;

  if (diff > 0.5) return { trend: 'improving' };
  if (diff < -0.5) return { trend: 'declining' };
  return { trend: 'stable' };
}
