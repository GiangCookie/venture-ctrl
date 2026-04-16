import { useState, useEffect, useCallback, useRef } from 'react';
import { timeTracker } from '../utils/time-tracker';

export function useTimeTracker() {
  const [activeSession, setActiveSession] = useState(null);
  const [runningTime, setRunningTime] = useState(0);
  const [todaySessions, setTodaySessions] = useState([]);
  const [todaySummary, setTodaySummary] = useState([]);
  const intervalRef = useRef(null);

  // Load initial state
  useEffect(() => {
    const session = timeTracker.getActiveSession();
    setActiveSession(session);
    
    const sessions = timeTracker.getTodaySessions();
    setTodaySessions(sessions);
    
    const summary = timeTracker.getTodaySummaryByProject();
    setTodaySummary(summary);

    // Start timer if there's an active session
    if (session) {
      startTimer();
    }

    // Subscribe to events
    const unsubscribe = timeTracker.subscribe((event, data) => {
      switch (event) {
        case 'session:started':
          setActiveSession(data);
          startTimer();
          break;
        case 'session:ended':
          setActiveSession(null);
          setRunningTime(0);
          stopTimer();
          refreshSessions();
          break;
        case 'session:completed':
        case 'session:manual-created':
        case 'session:updated':
        case 'session:deleted':
          refreshSessions();
          break;
      }
    });

    return () => {
      unsubscribe();
      stopTimer();
    };
  }, []);

  /**
   * Start the running timer
   */
  const startTimer = useCallback(() => {
    if (intervalRef.current) return;
    
    intervalRef.current = setInterval(() => {
      setRunningTime(timeTracker.getRunningTime());
    }, 1000);
  }, []);

  /**
   * Stop the running timer
   */
  const stopTimer = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  /**
   * Refresh today's sessions
   */
  const refreshSessions = useCallback(() => {
    const sessions = timeTracker.getTodaySessions();
    setTodaySessions(sessions);
    
    const summary = timeTracker.getTodaySummaryByProject();
    setTodaySummary(summary);
  }, []);

  /**
   * Start a new session
   */
  const startSession = useCallback((projectId, mood, description = '') => {
    try {
      const session = timeTracker.startSession(projectId, mood, description);
      return { success: true, session };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }, []);

  /**
   * Stop the current session
   */
  const stopSession = useCallback((notes = '') => {
    try {
      const session = timeTracker.stopSession(notes);
      return { success: true, session };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }, []);

  /**
   * Create a manual session
   */
  const createManualSession = useCallback((projectId, startTime, endTime, mood, description, notes) => {
    try {
      const session = timeTracker.createManualSession(projectId, startTime, endTime, mood, description, notes);
      return { success: true, session };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }, []);

  /**
   * Edit a session
   */
  const editSession = useCallback((sessionId, updates) => {
    try {
      const session = timeTracker.editSession(sessionId, updates);
      return { success: true, session };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }, []);

  /**
   * Delete a session
   */
  const deleteSession = useCallback((sessionId) => {
    try {
      timeTracker.deleteSession(sessionId);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }, []);

  /**
   * Get formatted running time
   */
  const formattedRunningTime = useCallback(() => {
    return timeTracker.formatRunningTime(runningTime);
  }, [runningTime]);

  /**
   * Get today's total time
   */
  const todayTotal = useCallback(() => {
    return timeTracker.getTodayTotalTime();
  }, [todaySessions]);

  /**
   * Get all available projects
   */
  const projects = useCallback(() => {
    return timeTracker.projects;
  }, []);

  /**
   * Format duration
   */
  const formatDuration = useCallback((minutes) => {
    return timeTracker.formatDuration(minutes);
  }, []);

  return {
    // State
    activeSession,
    runningTime,
    todaySessions,
    todaySummary,
    
    // Actions
    startSession,
    stopSession,
    createManualSession,
    editSession,
    deleteSession,
    
    // Helpers
    formattedRunningTime,
    todayTotal,
    projects: projects(),
    formatDuration,
    refreshSessions,
    
    // Raw tracker for advanced use
    tracker: timeTracker,
  };
}

export default useTimeTracker;
