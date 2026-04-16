#!/usr/bin/env node
/**
 * Daily Todo Generator
 * Generates tomorrow's todo list based on:
 * - Open tasks from today
 * - Deadlines for tomorrow
 * - Regular routine tasks
 * 
 * Runs at 20:00 to prepare for next day
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const MEMORY_DIR = process.env.MEMORY_DIR || '/data/.openclaw/workspace/memory';
const DATA_FILE = process.env.DATA_FILE || '/data/.openclaw/workspace/venture-ctrl/data/daily-data.json';

const PROJECTS = {
  'tough-cookie': { name: 'Tough Cookie', emoji: '🍪', color: '#FF6B35' },
  'nomu': { name: 'NOMU', emoji: '📱', color: '#4ECDC4' },
  'kyberg': { name: 'Kyberg Export', emoji: '💊', color: '#95E881' },
  'freelance': { name: 'Freelance', emoji: '🎬', color: '#A855F7' },
  'personal': { name: 'Personal', emoji: '🏠', color: '#888' },
};

const PRIORITIES = {
  '🔴 Urgent': { weight: 4, color: '#ff4444' },
  '🟡 High': { weight: 3, color: '#ffaa00' },
  '🟢 Normal': { weight: 2, color: '#44ff44' },
  '⚪ Low': { weight: 1, color: '#888' },
};

// Get tomorrow's date in YYYY-MM-DD format
function getTomorrow() {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  return tomorrow.toISOString().split('T')[0];
}

// Get today's date in YYYY-MM-DD format
function getToday() {
  return new Date().toISOString().split('T')[0];
}

// Format date in German
function formatGermanDate(dateStr) {
  const date = new Date(dateStr);
  const days = ['Sonntag', 'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag'];
  return `${days[date.getDay()]}, ${date.getDate()}.${date.getMonth() + 1}.${date.getFullYear()}`;
}

// Read and parse memory file
function parseMemoryFile(dateStr) {
  const filePath = path.join(MEMORY_DIR, `${dateStr}.md`);
  
  if (!fs.existsSync(filePath)) {
    return null;
  }
  
  const content = fs.readFileSync(filePath, 'utf-8');
  return parseDailyLog(content);
}

// Parse daily log content
function parseDailyLog(content) {
  const result = {
    openTodos: [],
    completedTodos: [],
    deadlines: [],
    notes: '',
  };
  
  // Split by lines
  const lines = content.split('\n');
  
  let currentSection = null;
  let inOpenSection = false;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    // Detect sections
    if (line.includes('🔴 KRITISCH') || line.includes('🟡 WICHTIG') || line.includes('🟢 ROUTINE')) {
      currentSection = line.trim();
      inOpenSection = true;
      continue;
    }
    
    // Skip table header lines
    if (line.includes('| Task |') || line.includes('|---')) {
      continue;
    }
    
    // Parse todo rows in tables
    if (line.startsWith('|') && inOpenSection && currentSection) {
      const parts = line.split('|').filter(p => p.trim() !== '');
      if (parts.length >= 2) {
        const task = parts[0].trim();
        const status = parts.length > 3 ? parts[3].trim() : '';
        const deadline = parts.length > 2 ? parts[2].trim() : '';
        
        // Skip empty tasks
        if (!task || task === 'Task') continue;
        
        // Determine priority
        let priority = '🟢 Normal';
        if (currentSection.includes('🔴')) priority = '🔴 Urgent';
        else if (currentSection.includes('🟡')) priority = '🟡 High';
        
        // Check if task has a status
        if (status.includes('✅') || status.includes('Fertig') || status.includes('Erledigt')) {
          result.completedTodos.push({
            task,
            priority,
            deadline: deadline || null,
          });
        } else if (status.includes('⏳') || status.includes('Offen') || status.includes('-')) {
          result.openTodos.push({
            task,
            priority,
            deadline: deadline || null,
          });
          
          // Check if deadline is tomorrow
          if (deadline && deadline.includes('(morgen)')) {
            result.deadlines.push({
              task,
              priority: '🔴 Urgent',
              isTomorrow: true,
            });
          }
        }
      }
    }
    
    // End of todo section
    if (line.startsWith('##') && !line.includes('## TO-DOS') && inOpenSection) {
      inOpenSection = false;
    }
  }
  
  return result;
}

// Detect project from task text
function detectProject(task) {
  const lowerTask = task.toLowerCase();
  
  if (lowerTask.includes('kono') || lowerTask.includes('tough cookie') || 
      lowerTask.includes('monkey') || lowerTask.includes('wittmann')) {
    return 'tough-cookie';
  }
  if (lowerTask.includes('nomu')) {
    return 'nomu';
  }
  if (lowerTask.includes('export') || lowerTask.includes('kyberg') || 
      lowerTask.includes('oliven') || lowerTask.includes('heras') || 
      lowerTask.includes('renieres')) {
    return 'kyberg';
  }
  if (lowerTask.includes('lu-bu') || lowerTask.includes('freelance') || 
      lowerTask.includes('grafikerin') || lowerTask.includes('fotoshoot')) {
    return 'freelance';
  }
  if (lowerTask.includes('golf')) {
    return 'personal';
  }
  
  return 'tough-cookie'; // Default
}

// Generate todo items from parsed data
function generateTodos(parsedData, tomorrow) {
  const todos = [];
  const seen = new Set();
  
  // Add deadlines for tomorrow (highest priority)
  parsedData.deadlines.forEach(item => {
    const key = item.task.toLowerCase().substring(0, 30);
    if (!seen.has(key)) {
      seen.add(key);
      todos.push({
        id: Date.now() + Math.random(),
        projectId: detectProject(item.task),
        text: item.task.replace(/\*\*/g, ''),
        priority: '🔴 Urgent',
        completed: false,
        createdAt: new Date().toISOString(),
        deadline: tomorrow,
      });
    }
  });
  
  // Add open todos (carry over to tomorrow)
  parsedData.openTodos.forEach(item => {
    const key = item.task.toLowerCase().substring(0, 30);
    if (!seen.has(key) && !item.task.includes('Heute')) {
      seen.add(key);
      todos.push({
        id: Date.now() + Math.random(),
        projectId: detectProject(item.task),
        text: item.task.replace(/\*\*/g, ''),
        priority: item.priority,
        completed: false,
        createdAt: new Date().toISOString(),
        deadline: tomorrow,
      });
    }
  });
  
  // Add routine tasks
  const routineTasks = [
    { text: 'Morning Dashboard Check', priority: '🟢 Normal', project: 'personal' },
    { text: 'Review open todos from yesterday', priority: '🟢 Normal', project: 'personal' },
    { text: 'Email & Communication check', priority: '🟢 Normal', project: 'freelance' },
  ];
  
  routineTasks.forEach(item => {
    if (!seen.has(item.text.toLowerCase())) {
      seen.add(item.text.toLowerCase());
      todos.push({
        id: Date.now() + Math.random(),
        projectId: item.project,
        text: item.text,
        priority: item.priority,
        completed: false,
        createdAt: new Date().toISOString(),
        deadline: tomorrow,
      });
    }
  });
  
  return todos;
}

// Main function
async function generateDailyTodos() {
  console.log('🔄 Generating daily todos...');
  console.log(`Memory dir: ${MEMORY_DIR}`);
  console.log(`Data file: ${DATA_FILE}`);
  
  const today = getToday();
  const tomorrow = getTomorrow();
  
  console.log(`Today: ${today}`);
  console.log(`Tomorrow: ${tomorrow}`);
  
  // Parse today's memory file
  const parsedData = parseMemoryFile(today);
  
  if (!parsedData) {
    console.log(`❌ No memory file found for ${today}`);
    console.log(`   Expected: ${path.join(MEMORY_DIR, `${today}.md`)}`);
    
    // Create basic todos anyway
    const todos = [
      {
        id: Date.now(),
        projectId: 'tough-cookie',
        text: `Daily planning for ${formatGermanDate(tomorrow)}`,
        priority: '🟢 Normal',
        completed: false,
        createdAt: new Date().toISOString(),
        deadline: tomorrow,
      }
    ];
    
    await updateDailyData(tomorrow, todos);
    return;
  }
  
  console.log(`✅ Found memory file for ${today}`);
  console.log(`   Open todos: ${parsedData.openTodos.length}`);
  console.log(`   Completed todos: ${parsedData.completedTodos.length}`);
  console.log(`   Tomorrow deadlines: ${parsedData.deadlines.length}`);
  
  // Generate todos
  const todos = generateTodos(parsedData, tomorrow);
  
  console.log(`\n📋 Generated ${todos.length} todos for ${tomorrow}:`);
  todos.forEach((todo, i) => {
    console.log(`  ${i + 1}. ${todo.priority} ${todo.text} (${PROJECTS[todo.projectId]?.name || todo.projectId})`);
  });
  
  // Update daily-data.json
  await updateDailyData(tomorrow, todos);
  
  console.log('\n✅ Daily todos generated successfully!');
}

// Update daily-data.json
async function updateDailyData(date, todos) {
  // Read existing data
  let data = {
    date: date,
    lastUpdated: new Date().toISOString(),
    timeSessions: [],
    income: [],
    todos: todos,
    pipeline: [],
    activeSession: null,
  };
  
  if (fs.existsSync(DATA_FILE)) {
    try {
      const existing = JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));
      // Keep existing data except date, todos, timeSessions, income, activeSession
      // Preserve: pipeline, journalEntry
      data = {
        ...existing,
        date: date,
        lastUpdated: new Date().toISOString(),
        todos: todos,
        timeSessions: [],
        income: [],
        activeSession: null,
      };
    } catch (e) {
      console.log('⚠️ Could not read existing data, creating new file');
    }
  }
  
  // Write updated data
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf-8');
  console.log(`\n💾 Data written to ${DATA_FILE}`);
}

// Run if called directly
if (process.argv[1] === __filename || process.argv[1].endsWith('generate-daily-todos.js')) {
  generateDailyTodos().catch(err => {
    console.error('❌ Error generating todos:', err);
    process.exit(1);
  });
}

export { generateDailyTodos, parseDailyLog, generateTodos };
