import { useState, useEffect, useCallback, useMemo } from 'react';
import { TodoParser } from '../utils/todo-parser';

const STORAGE_KEY = 'venture-todos-sync';

export function useTodoSync() {
  const [todos, setTodos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastSync, setLastSync] = useState(null);
  const parser = useMemo(() => new TodoParser(), []);

  // Load todos from storage and parse on mount
  useEffect(() => {
    loadTodos();
  }, []);

  /**
   * Load todos from localStorage
   */
  const loadTodos = useCallback(() => {
    try {
      setLoading(true);
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        setTodos(parsed.todos || []);
        setLastSync(parsed.lastSync || null);
      }
    } catch (err) {
      setError(err.message);
      console.error('Failed to load todos:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Save todos to localStorage
   */
  const saveTodos = useCallback((newTodos) => {
    const data = {
      todos: newTodos,
      lastSync: new Date().toISOString(),
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    setTodos(newTodos);
    setLastSync(data.lastSync);
  }, []);

  /**
   * Sync todos from memory files and TODOS.md
   */
  const syncTodos = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const allTodos = [];

      // Generate dates for last 30 days
      const dates = [];
      for (let i = 0; i < 30; i++) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        dates.push(date.toISOString().split('T')[0]);
      }

      // Try to load and parse each memory file
      for (const date of dates) {
        try {
          const response = await fetch(`/data/.openclaw/workspace/memory/${date}.md`);
          if (response.ok) {
            const content = await response.text();
            const dailyTodos = parser.parseDailyLog(content, date);
            allTodos.push(...dailyTodos);
          }
        } catch (e) {
          // File doesn't exist, skip silently
        }
      }

      // Try to load TODOS.md
      try {
        const response = await fetch('/data/.openclaw/workspace/TODOS.md');
        if (response.ok) {
          const content = await response.text();
          const persistentTodos = parser.parsePersistentTodos(content);
          allTodos.push(...persistentTodos);
        }
      } catch (e) {
        console.log('TODOS.md not found or not accessible');
      }

      // Merge with existing todos, preserving completion status
      const existingTodos = [...todos];
      const mergedTodos = mergeTodos(existingTodos, allTodos);

      // Save to localStorage
      saveTodos(mergedTodos);

      setLastSync(new Date().toISOString());
      return mergedTodos.length;
    } catch (err) {
      setError(err.message);
      console.error('Failed to sync todos:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [todos, parser, saveTodos]);

  /**
   * Add a new todo
   */
  const addTodo = useCallback((todo) => {
    const newTodo = {
      id: `todo-${Date.now()}`,
      ...todo,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    const newTodos = [newTodo, ...todos];
    saveTodos(newTodos);
    return newTodo;
  }, [todos, saveTodos]);

  /**
   * Update an existing todo
   */
  const updateTodo = useCallback((id, updates) => {
    const newTodos = todos.map(t =>
      t.id === id
        ? { ...t, ...updates, updatedAt: new Date().toISOString() }
        : t
    );
    saveTodos(newTodos);
  }, [todos, saveTodos]);

  /**
   * Toggle todo completion
   */
  const toggleTodo = useCallback((id) => {
    const newTodos = todos.map(t =>
      t.id === id
        ? {
            ...t,
            completed: !t.completed,
            completedAt: !t.completed ? new Date().toISOString() : null,
            status: !t.completed ? '✅ Fertig' : '⏳ Offen',
            updatedAt: new Date().toISOString(),
          }
        : t
    );
    saveTodos(newTodos);
  }, [todos, saveTodos]);

  /**
   * Delete a todo
   */
  const deleteTodo = useCallback((id) => {
    const newTodos = todos.filter(t => t.id !== id);
    saveTodos(newTodos);
  }, [todos, saveTodos]);

  /**
   * Get filtered todos based on criteria
   */
  const getFilteredTodos = useCallback((filter) => {
    const today = new Date().toISOString().split('T')[0];
    const todayDate = new Date();

    switch (filter) {
      case 'today':
        return todos.filter(t =>
          !t.completed &&
          (t.deadline === today || !t.deadline)
        );

      case 'week': {
        const weekEnd = new Date(todayDate);
        weekEnd.setDate(todayDate.getDate() + 7);
        return todos.filter(t =>
          !t.completed &&
          t.deadline &&
          new Date(t.deadline) <= weekEnd &&
          new Date(t.deadline) >= todayDate
        );
      }

      case 'overdue':
        return todos.filter(t =>
          !t.completed &&
          t.deadline &&
          new Date(t.deadline) < todayDate
        );

      case 'completed':
        return todos.filter(t => t.completed);

      default:
        return todos.filter(t => !t.completed);
    }
  }, [todos]);

  /**
   * Get todos grouped by project
   */
  const getTodosByProject = useCallback(() => {
    const grouped = {};
    todos.forEach(t => {
      const project = t.project || 'unassigned';
      if (!grouped[project]) {
        grouped[project] = [];
      }
      grouped[project].push(t);
    });
    return grouped;
  }, [todos]);

  /**
   * Get todo statistics
   */
  const getStats = useCallback(() => {
    const today = new Date().toISOString().split('T')[0];
    const overdue = todos.filter(t =>
      !t.completed && t.deadline && new Date(t.deadline) < new Date(today)
    ).length;
    const todayDue = todos.filter(t =>
      !t.completed && t.deadline === today
    ).length;
    const totalOpen = todos.filter(t => !t.completed).length;
    const completed = todos.filter(t => t.completed).length;

    return {
      total: todos.length,
      open: totalOpen,
      completed,
      overdue,
      todayDue,
    };
  }, [todos]);

  return {
    todos,
    loading,
    error,
    lastSync,
    syncTodos,
    addTodo,
    updateTodo,
    toggleTodo,
    deleteTodo,
    getFilteredTodos,
    getTodosByProject,
    getStats,
  };
}

/**
 * Merge existing todos with newly parsed ones
 * Preserves completion status and custom data
 */
function mergeTodos(existing, fresh) {
  const merged = new Map();

  // Add existing todos first
  existing.forEach(t => {
    merged.set(t.text, t);
  });

  // Merge in fresh todos, preserving completion status
  fresh.forEach(t => {
    const existingTodo = merged.get(t.text);
    if (existingTodo) {
      // Preserve completion status
      merged.set(t.text, {
        ...t,
        id: existingTodo.id,
        completed: existingTodo.completed,
        completedAt: existingTodo.completedAt,
        status: existingTodo.completed ? '✅ Fertig' : t.status,
      });
    } else {
      merged.set(t.text, t);
    }
  });

  return Array.from(merged.values());
}

export default useTodoSync;
