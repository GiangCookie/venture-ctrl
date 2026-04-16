/**
 * Time Tracker Utility - Manages time tracking sessions
 * Handles start/stop, persistence, and validation
 */

const STORAGE_KEYS = {
  ACTIVE_SESSION: 'venture-time-active-session',
  SESSIONS: 'venture-time-sessions',
  SESSION_HISTORY: 'venture-time-history',
};

export class TimeTracker {
  constructor() {
    this.listeners = [];
    this.projects = [
      { id: 'tough-cookie', name: 'Tough Cookie', color: '#FF6B35', emoji: '🍪' },
      { id: 'nomu', name: 'NOMU', color: '#4ECDC4', emoji: '📱' },
      { id: 'kyberg', name: 'Kyberg Export', color: '#95E881', emoji: '💊' },
      { id: 'freelance', name: 'Freelance', color: '#A855F7', emoji: '🎬' },
      { id: 'export', name: 'Export', color: '#FFD93D', emoji: '📦' },
    ];
    this.moodEmojis = ['😴', '😐', '🙂', '😊', '🔥'];
  }

  /**
   * Get active session from localStorage
   */
  getActiveSession() {
    if (typeof window === 'undefined') return null;
    const saved = localStorage.getItem(STORAGE_KEYS.ACTIVE_SESSION);
    return saved ? JSON.parse(saved) : null;
  }

  /**
   * Save active session to localStorage
   */
  saveActiveSession(session) {
    if (typeof window === 'undefined') return;
    localStorage.setItem(STORAGE_KEYS.ACTIVE_SESSION, JSON.stringify(session));
    this.notifyListeners('session:started', session);
  }

  /**
   * Clear active session from localStorage
   */
  clearActiveSession() {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(STORAGE_KEYS.ACTIVE_SESSION);
    this.notifyListeners('session:ended', null);
  }

  /**
   * Start a new time tracking session
   */
  startSession(projectId, mood = 3, description = '') {
    const existingSession = this.getActiveSession();
    if (existingSession) {
      throw new Error('Es läuft bereits eine aktive Session. Bitte zuerst beenden.');
    }

    const session = {
      id: `session-${Date.now()}`,
      projectId,
      mood,
      description,
      startTime: new Date().toISOString(),
      status: 'running',
    };

    this.saveActiveSession(session);
    return session;
  }

  /**
   * Stop the current session
   */
  stopSession(notes = '') {
    const session = this.getActiveSession();
    if (!session) {
      throw new Error('Keine aktive Session gefunden.');
    }

    const endTime = new Date().toISOString();
    const duration = Math.floor((new Date(endTime) - new Date(session.startTime)) / 1000 / 60); // in minutes

    const completedSession = {
      ...session,
      endTime,
      duration,
      notes,
      status: 'completed',
      completedAt: endTime,
    };

    // Save to history
    this.saveSessionToHistory(completedSession);
    
    // Clear active session
    this.clearActiveSession();

    // Update daily-data.json equivalent (through callback)
    this.notifyListeners('session:completed', completedSession);

    return completedSession;
  }

  /**
   * Get current running time of active session
   */
  getRunningTime() {
    const session = this.getActiveSession();
    if (!session) return 0;

    return Math.floor((Date.now() - new Date(session.startTime).getTime()) / 1000);
  }

  /**
   * Format running time as HH:MM:SS
   */
  formatRunningTime(seconds) {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }

  /**
   * Format duration in minutes to hours and minutes
   */
  formatDuration(minutes) {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours === 0) return `${mins}m`;
    return `${hours}h ${mins}m`;
  }

  /**
   * Save completed session to history
   */
  saveSessionToHistory(session) {
    if (typeof window === 'undefined') return;
    
    const history = this.getSessionHistory();
    history.push(session);
    localStorage.setItem(STORAGE_KEYS.SESSION_HISTORY, JSON.stringify(history));
  }

  /**
   * Get all session history
   */
  getSessionHistory() {
    if (typeof window === 'undefined') return [];
    const saved = localStorage.getItem(STORAGE_KEYS.SESSION_HISTORY);
    return saved ? JSON.parse(saved) : [];
  }

  /**
   * Get today's sessions
   */
  getTodaySessions() {
    const today = new Date().toISOString().split('T')[0];
    const history = this.getSessionHistory();
    return history.filter(s => s.startTime?.startsWith(today));
  }

  /**
   * Get sessions for a specific date
   */
  getSessionsForDate(date) {
    const history = this.getSessionHistory();
    return history.filter(s => s.startTime?.startsWith(date));
  }

  /**
   * Get sessions for current week
   */
  getWeekSessions() {
    const today = new Date();
    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - today.getDay() + 1); // Monday
    
    const history = this.getSessionHistory();
    return history.filter(s => {
      const sessionDate = new Date(s.startTime);
      return sessionDate >= weekStart && sessionDate <= today;
    });
  }

  /**
   * Get time summary by project for today
   */
  getTodaySummaryByProject() {
    const sessions = this.getTodaySessions();
    const summary = {};

    sessions.forEach(s => {
      if (!summary[s.projectId]) {
        summary[s.projectId] = {
          projectId: s.projectId,
          totalMinutes: 0,
          sessions: 0,
          lastSession: null,
        };
      }
      summary[s.projectId].totalMinutes += s.duration || 0;
      summary[s.projectId].sessions += 1;
      if (!summary[s.projectId].lastSession || new Date(s.endTime) > new Date(summary[s.projectId].lastSession.endTime)) {
        summary[s.projectId].lastSession = s;
      }
    });

    return Object.values(summary).map(s => ({
      ...s,
      hours: (s.totalMinutes / 60).toFixed(1),
    }));
  }

  /**
   * Create a manual time entry (for retroactive logging)
   */
  createManualSession(projectId, startTime, endTime, mood = 3, description = '', notes = '') {
    // Validate times
    if (new Date(endTime) <= new Date(startTime)) {
      throw new Error('Endzeit muss nach der Startzeit liegen.');
    }

    // Check for overlaps with existing sessions
    const history = this.getSessionHistory();
    const newStart = new Date(startTime);
    const newEnd = new Date(endTime);

    const overlapping = history.filter(s => {
      const sStart = new Date(s.startTime);
      const sEnd = new Date(s.endTime);
      return (newStart < sEnd && newEnd > sStart);
    });

    if (overlapping.length > 0) {
      const overlapDetails = overlapping.map(s => 
        `${s.projectId} (${new Date(s.startTime).toLocaleTimeString('de-DE')} - ${new Date(s.endTime).toLocaleTimeString('de-DE')})`
      ).join(', ');
      throw new Error(`Zeitüberschneidung mit bestehenden Sessions: ${overlapDetails}`);
    }

    const duration = Math.floor((newEnd - newStart) / 1000 / 60);

    const session = {
      id: `session-${Date.now()}`,
      projectId,
      mood,
      description,
      startTime,
      endTime,
      duration,
      notes,
      status: 'completed',
      manual: true,
      completedAt: endTime,
    };

    this.saveSessionToHistory(session);
    this.notifyListeners('session:manual-created', session);

    return session;
  }

  /**
   * Edit an existing session
   */
  editSession(sessionId, updates) {
    const history = this.getSessionHistory();
    const sessionIndex = history.findIndex(s => s.id === sessionId);

    if (sessionIndex === -1) {
      throw new Error('Session nicht gefunden.');
    }

    const session = history[sessionIndex];
    const updatedSession = { ...session, ...updates, updatedAt: new Date().toISOString() };

    // Validate new times if provided
    if (updates.startTime || updates.endTime) {
      const newStart = new Date(updatedSession.startTime);
      const newEnd = new Date(updatedSession.endTime);

      if (newEnd <= newStart) {
        throw new Error('Endzeit muss nach der Startzeit liegen.');
      }

      // Check for overlaps (excluding the session being edited)
      const overlapping = history.filter((s, i) => 
        i !== sessionIndex && 
        newStart < new Date(s.endTime) && 
        newEnd > new Date(s.startTime)
      );

      if (overlapping.length > 0) {
        throw new Error('Neue Zeit überschneidet sich mit anderen Sessions.');
      }

      // Recalculate duration
      updatedSession.duration = Math.floor((newEnd - newStart) / 1000 / 60);
    }

    // Validate mood if provided
    if (updates.mood !== undefined && (updates.mood < 1 || updates.mood > 5)) {
      throw new Error('Mood muss zwischen 1 und 5 liegen.');
    }

    history[sessionIndex] = updatedSession;
    localStorage.setItem(STORAGE_KEYS.SESSION_HISTORY, JSON.stringify(history));
    
    this.notifyListeners('session:updated', updatedSession);

    return updatedSession;
  }

  /**
   * Delete a session
   */
  deleteSession(sessionId) {
    const history = this.getSessionHistory();
    const filtered = history.filter(s => s.id !== sessionId);
    localStorage.setItem(STORAGE_KEYS.SESSION_HISTORY, JSON.stringify(filtered));
    this.notifyListeners('session:deleted', { id: sessionId });
  }

  /**
   * Get total time for today
   */
  getTodayTotalTime() {
    const sessions = this.getTodaySessions();
    const totalMinutes = sessions.reduce((acc, s) => acc + (s.duration || 0), 0);
    return {
      minutes: totalMinutes,
      hours: (totalMinutes / 60).toFixed(1),
      formatted: this.formatDuration(totalMinutes),
    };
  }

  /**
   * Subscribe to time tracker events
   */
  subscribe(callback) {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter(cb => cb !== callback);
    };
  }

  /**
   * Notify all listeners of an event
   */
  notifyListeners(event, data) {
    this.listeners.forEach(callback => {
      try {
        callback(event, data);
      } catch (e) {
        console.error('TimeTracker listener error:', e);
      }
    });
  }

  /**
   * Get project by ID
   */
  getProject(projectId) {
    return this.projects.find(p => p.id === projectId) || {
      id: projectId,
      name: projectId,
      color: '#888',
      emoji: '📁',
    };
  }

  /**
   * Clear all session history (use with caution!)
   */
  clearHistory() {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(STORAGE_KEYS.SESSION_HISTORY);
    this.notifyListeners('history:cleared', null);
  }

  /**
   * Export session data
   */
  exportData() {
    return {
      activeSession: this.getActiveSession(),
      sessions: this.getSessionHistory(),
      exportedAt: new Date().toISOString(),
    };
  }

  /**
   * Import session data
   */
  importData(data) {
    if (data.sessions) {
      localStorage.setItem(STORAGE_KEYS.SESSION_HISTORY, JSON.stringify(data.sessions));
    }
    if (data.activeSession) {
      this.saveActiveSession(data.activeSession);
    }
    this.notifyListeners('history:imported', data);
  }
}

// Create singleton instance
export const timeTracker = new TimeTracker();

export default TimeTracker;
