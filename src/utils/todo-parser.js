/**
 * Todo Parser - Extracts todos from memory files and TODOS.md
 * Parses structured todo data from daily logs and persistent todo files
 */

export class TodoParser {
  constructor() {
    // Priority patterns
    this.priorityPatterns = {
      '🔴 Urgent': /🔴\s*(.+)/i,
      '🟡 High': /🟡\s*(.+)/i,
      '🟢 Normal': /🟢\s*(.+)/i,
      '⚪ Low': /⚪\s*(.+)/i,
    };
    
    // Status patterns
    this.statusPatterns = {
      '⏳ Offen': /[⏳📋✅]\s*(?:Offen|WARTET|TODO|IN PROGRESS)/i,
      '✅ Fertig': /✅\s*(?:Fertig|Done|Completed)/i,
      '🔄 In Progress': /⏳\s*In Progress/i,
      '❌ Blocked': /(?:Blocker|❌|BLOCKED)/i,
    };

    // Project map
    this.projectMap = {
      'tough-cookie': { id: 'tough-cookie', name: 'Tough Cookie', color: '#FF6B35', emoji: '🍪' },
      'nomu': { id: 'nomu', name: 'NOMU', color: '#4ECDC4', emoji: '📱' },
      'kyberg': { id: 'kyberg', name: 'Kyberg Export', color: '#95E881', emoji: '💊' },
      'freelance': { id: 'freelance', name: 'Freelance', color: '#A855F7', emoji: '🎬' },
      'export': { id: 'export', name: 'Export', color: '#FFD93D', emoji: '📦' },
      'hotel-wittmann': { id: 'tough-cookie', name: 'Tough Cookie', color: '#FF6B35', emoji: '🍪' },
      'kono': { id: 'tough-cookie', name: 'Tough Cookie', color: '#FF6B35', emoji: '🍪' },
      'monkey-post': { id: 'tough-cookie', name: 'Tough Cookie', color: '#FF6B35', emoji: '🍪' },
      'lu-bu': { id: 'freelance', name: 'Freelance', color: '#A855F7', emoji: '🎬' },
      'myhao': { id: 'freelance', name: 'Freelance', color: '#A855F7', emoji: '🎬' },
    };
  }

  /**
   * Parse daily log file for todos
   * @param {string} content - Full markdown content
   * @param {string} date - ISO date string (YYYY-MM-DD)
   * @returns {Array} Array of parsed todos
   */
  parseDailyLog(content, date) {
    const todos = [];
    const lines = content.split('\n');
    let currentSection = null;
    let currentProject = null;
    let currentPriority = '🟢 Normal';

    for (const line of lines) {
      const trimmedLine = line.trim();
      if (!trimmedLine) continue;

      // Detect section headers (KRITISCH, WICHTIG, ROUTINE)
      if (trimmedLine.includes('🔴 KRITISCH')) {
        currentPriority = '🔴 Urgent';
        continue;
      }
      if (trimmedLine.includes('🟡 WICHTIG') || trimmedLine.includes('🟡 HEUTE')) {
        currentPriority = '🟡 High';
        continue;
      }
      if (trimmedLine.includes('🟢 ROUTINE') || trimmedLine.includes('🟢 DIESE WOCHE')) {
        currentPriority = '🟢 Normal';
        continue;
      }

      // Detect project from task description
      const detectedProject = this.detectProject(trimmedLine);
      if (detectedProject) {
        currentProject = detectedProject;
      }

      // Parse table rows with todos
      const tableMatch = trimmedLine.match(/^\|?\s*\*\*(.+?)\*\*\s*\|/);
      if (tableMatch || (trimmedLine.includes('Task') && trimmedLine.includes('|'))) {
        const taskText = tableMatch ? tableMatch[1] : this.extractTaskText(trimmedLine);
        if (taskText && taskText.length > 3) {
          const status = this.detectStatus(trimmedLine);
          const deadline = this.extractDeadline(trimmedLine, date);
          
          todos.push({
            id: `daily-${date}-${todos.length}`,
            text: taskText.replace(/\*\*/g, '').trim(),
            priority: currentPriority,
            status: status,
            deadline: deadline,
            project: currentProject || this.detectProject(taskText),
            source: `memory/${date}.md`,
            createdAt: `${date}T08:00:00`,
            updatedAt: new Date().toISOString(),
            tags: this.extractTags(taskText),
            completed: status === '✅ Fertig',
            completedAt: status === '✅ Fertig' ? new Date().toISOString() : null,
          });
        }
      }

      // Parse checkbox-style todos
      const checkboxMatch = trimmedLine.match(/^\s*[-*]?\s*\[([ xX])\]\s*(.+)/);
      if (checkboxMatch) {
        const isCompleted = checkboxMatch[1].toLowerCase() === 'x';
        const taskText = checkboxMatch[2].trim();
        
        todos.push({
          id: `daily-${date}-${todos.length}`,
          text: taskText.replace(/\*\*/g, '').trim(),
          priority: currentPriority,
          status: isCompleted ? '✅ Fertig' : '⏳ Offen',
          deadline: null,
          project: currentProject || this.detectProject(taskText),
          source: `memory/${date}.md`,
          createdAt: `${date}T08:00:00`,
          updatedAt: new Date().toISOString(),
          tags: this.extractTags(taskText),
          completed: isCompleted,
          completedAt: isCompleted ? new Date().toISOString() : null,
        });
      }
    }

    return todos;
  }

  /**
   * Parse TODOS.md for persistent todos
   * @param {string} content - Full TODOS.md content
   * @returns {Array} Array of parsed todos
   */
  parsePersistentTodos(content) {
    const todos = [];
    const lines = content.split('\n');
    let currentPriority = '🟢 Normal';

    for (const line of lines) {
      const trimmedLine = line.trim();
      if (!trimmedLine) continue;

      // Detect priority sections
      if (trimmedLine.startsWith('### 🔴')) {
        currentPriority = '🔴 Urgent';
        continue;
      }
      if (trimmedLine.startsWith('### 🟡')) {
        currentPriority = '🟡 High';
        continue;
      }
      if (trimmedLine.startsWith('### 🟢')) {
        currentPriority = '🟢 Normal';
        continue;
      }

      // Parse table rows
      if (trimmedLine.startsWith('|') && trimmedLine.includes('|') && !trimmedLine.includes('---')) {
        const cells = trimmedLine.split('|').map(c => c.trim()).filter(c => c);
        if (cells.length >= 4) {
          const taskText = cells[1];
          const deadline = cells[2] !== '?' && cells[2] !== 'Deadline' ? cells[2] : null;
          const status = this.parseStatusText(cells[3]);
          
          todos.push({
            id: `persistent-${todos.length}`,
            text: taskText,
            priority: currentPriority,
            status: status,
            deadline: deadline ? this.parseDeadlineDate(deadline) : null,
            project: this.detectProject(taskText),
            source: 'TODOS.md',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            tags: this.extractTags(taskText),
            completed: status === '✅ Fertig',
            completedAt: status === '✅ Fertig' ? new Date().toISOString() : null,
          });
        }
      }

      // Parse standalone todos
      const todoMatch = trimmedLine.match(/^-?\s*(.+)$/);
      if (todoMatch && !trimmedLine.includes('---') && !trimmedLine.startsWith('#') && !trimmedLine.startsWith('**')) {
        const taskText = todoMatch[1].replace(/[\[\]xX]/g, '').trim();
        if (taskText.length > 5 && !taskText.includes('|')) {
          todos.push({
            id: `persistent-${todos.length}`,
            text: taskText,
            priority: currentPriority,
            status: '⏳ Offen',
            deadline: null,
            project: this.detectProject(taskText),
            source: 'TODOS.md',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            tags: this.extractTags(taskText),
            completed: false,
            completedAt: null,
          });
        }
      }
    }

    return todos;
  }

  /**
   * Detect project from text
   */
  detectProject(text) {
    const lowerText = text.toLowerCase();
    
    // Direct matches
    if (lowerText.includes('kono') || lowerText.includes('hotel wittmann') || lowerText.includes('monkey post')) {
      return 'tough-cookie';
    }
    if (lowerText.includes('nomu')) {
      return 'nomu';
    }
    if (lowerText.includes('kyberg')) {
      return 'kyberg';
    }
    if (lowerText.includes('lu-bu') || lowerText.includes('myhao') || lowerText.includes('little hiro')) {
      return 'freelance';
    }
    if (lowerText.includes('export') || lowerText.includes('olivenöl')) {
      return 'export';
    }

    // Default to freelance for unspecified work tasks
    if (lowerText.includes('video') || lowerText.includes('schnitt') || lowerText.includes('post-production') || lowerText.includes('b-roll')) {
      return 'freelance';
    }

    return null;
  }

  /**
   * Detect status from line
   */
  detectStatus(line) {
    if (line.includes('✅') || line.includes('Fertig') || line.includes('Done')) {
      return '✅ Fertig';
    }
    if (line.includes('🔄') || line.includes('In Progress')) {
      return '🔄 In Progress';
    }
    if (line.includes('❌') || line.includes('Blocker')) {
      return '❌ Blocked';
    }
    return '⏳ Offen';
  }

  /**
   * Parse status text
   */
  parseStatusText(text) {
    if (text.includes('✅') || text.includes('Fertig') || text.includes('Done') || text.includes('BEREIT')) {
      return '✅ Fertig';
    }
    if (text.includes('⏳') || text.includes('Offen') || text.includes('WARTET')) {
      return '⏳ Offen';
    }
    if (text.includes('IN PROGRESS')) {
      return '🔄 In Progress';
    }
    return '⏳ Offen';
  }

  /**
   * Extract deadline from text
   */
  extractDeadline(line, defaultDate) {
    // Match date patterns like "12.04.", "heute", "morgen", "ende april"
    const datePatterns = [
      { pattern: /(\d{1,2})\.\s*(\d{1,2})\.?\s*(\d{4})?/, type: 'german' },
      { pattern: /heute/i, type: 'today' },
      { pattern: /morgen/i, type: 'tomorrow' },
      { pattern: /(\d{1,2})\s*-\s*(\d{1,2})\.\s*(\w+)/i, type: 'range' },
    ];

    for (const { pattern, type } of datePatterns) {
      const match = line.match(pattern);
      if (match) {
        if (type === 'today') {
          return defaultDate;
        }
        if (type === 'tomorrow') {
          const date = new Date(defaultDate);
          date.setDate(date.getDate() + 1);
          return date.toISOString().split('T')[0];
        }
        if (type === 'german') {
          const day = match[1].padStart(2, '0');
          const month = match[2].padStart(2, '0');
          const year = match[3] || new Date().getFullYear();
          return `${year}-${month}-${day}`;
        }
      }
    }

    return null;
  }

  /**
   * Parse deadline date string
   */
  parseDeadlineDate(text) {
    const patterns = [
      { pattern: /(\d{1,2})\.\s*(\d{1,2})\.?/, type: 'german' },
    ];

    for (const { pattern, type } of patterns) {
      const match = text.match(pattern);
      if (match) {
        const day = match[1].padStart(2, '0');
        const month = match[2].padStart(2, '0');
        const year = new Date().getFullYear();
        return `${year}-${month}-${day}`;
      }
    }

    return null;
  }

  /**
   * Extract tags from text
   */
  extractTags(text) {
    const tags = [];
    const lowerText = text.toLowerCase();
    
    const tagPatterns = [
      { pattern: /(video|schnitt|post-production|footage|b-roll)/i, tag: 'video' },
      { pattern: /(meeting|call|gespräch)/i, tag: 'meeting' },
      { pattern: /(e-mail|mail|nachricht)/i, tag: 'communication' },
      { pattern: /(rechnung|finanz|bezahl)/i, tag: 'finance' },
      { pattern: /(dringend|kritisch|wichtig)/i, tag: 'urgent' },
      { pattern: /(prep|vorbereitung|planung)/i, tag: 'planning' },
    ];

    for (const { pattern, tag } of tagPatterns) {
      if (pattern.test(lowerText)) {
        tags.push(tag);
      }
    }

    return tags;
  }

  /**
   * Extract task text from various formats
   */
  extractTaskText(line) {
    // Remove table borders
    const cleanLine = line.replace(/\|/g, '').trim();
    // Remove status emojis
    return cleanLine.replace(/[⏳✅🔄❌⚠️]/g, '').trim();
  }

  /**
   * Get project details by ID
   */
  getProjectDetails(projectId) {
    return this.projectMap[projectId] || {
      id: projectId,
      name: projectId,
      color: '#888',
      emoji: '📁'
    };
  }
}

export default TodoParser;
