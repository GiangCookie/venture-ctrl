/**
 * Journal Parser - Parses memory/YYYY-MM-DD.md files for evening recaps
 * Extracts the ## 🌙 Abend-Review section and related metadata
 */

export class JournalParser {
  constructor() {
    this.emojiPatterns = {
      achievement: /✅\s*(.+)/g,
      blocker: /🔴\s*(.+)/g,
      warning: /🟡\s*(.+)/g,
      next: /⏳\s*(.+)/g,
      goal: /🎯\s*(.+)/g,
      idea: /💡\s*(.+)/g,
      note: /📝\s*(.+)/g,
    };
    
    this.moodPatterns = [
      { pattern: /(müde|erschöpft|burnout|kaputt)/i, mood: 1, energy: 1 },
      { pattern: /(anstrengend|schwierig|frust)/i, mood: 2, energy: 2 },
      { pattern: /(ok|geht|normal)/i, mood: 3, energy: 3 },
      { pattern: /(gut|produktiv|positiv)/i, mood: 4, energy: 4 },
      { pattern: /(super|hervorragend|genial|🔥)/i, mood: 5, energy: 5 },
    ];
  }

  /**
   * Parse a daily memory file
   * @param {string} content - Full markdown content
   * @param {string} date - ISO date string (YYYY-MM-DD)
   * @returns {Object|null} Parsed journal entry or null if no evening review
   */
  parseDailyLog(content, date) {
    const eveningReview = this.extractEveningReview(content);
    if (!eveningReview) {
      return null;
    }

    const highlights = this.extractHighlights(content);
    const projects = this.detectProjects(content);
    const finances = this.extractFinances(content);
    const { mood, energy } = this.detectMoodAndEnergy(content);
    const todos = this.extractTodos(content);
    const summary = this.extractSummary(eveningReview);

    return {
      id: `${date}-20-00`,
      date,
      time: '20:00',
      source: `memory/${date}.md`,
      summary: {
        text: summary,
        mood,
        energy,
      },
      highlights,
      todos: {
        completed: todos.completed,
        created: todos.created,
        mentioned: todos.mentioned,
      },
      finances,
      projects,
      content: eveningReview,
      createdAt: new Date(`${date}T20:00:00`).toISOString(),
      updatedAt: new Date().toISOString(),
      tags: this.autoGenerateTags(content, highlights, projects),
    };
  }

  /**
   * Extract the ## 🌙 Abend-Review section
   */
  extractEveningReview(content) {
    // Match the Abend-Review section
    const patterns = [
      /##\s*🌙\s*Abend-Review\s*\n+([\s\S]*?)(?=\n##|\n---|$)/i,
      /##\s*Abend-Review\s*\n+([\s\S]*?)(?=\n##|\n---|$)/i,
      /🌙\s*Abend-Review\s*\n+([\s\S]*?)(?=\n##|\n---|$)/i,
    ];

    for (const pattern of patterns) {
      const match = content.match(pattern);
      if (match && match[1].trim()) {
        return match[1].trim();
      }
    }

    return null;
  }

  /**
   * Extract summary text from evening review
   */
  extractSummary(eveningReview) {
    // Get first paragraph or first 200 chars
    const lines = eveningReview.split('\n').filter(line => line.trim());
    const firstParagraph = lines[0] || '';
    return firstParagraph.length > 200 
      ? firstParagraph.substring(0, 200) + '...'
      : firstParagraph;
  }

  /**
   * Extract highlights with emojis from content
   */
  extractHighlights(content) {
    const highlights = [];
    
    for (const [type, pattern] of Object.entries(this.emojiPatterns)) {
      const matches = [...content.matchAll(pattern)];
      for (const match of matches) {
        highlights.push({
          type,
          text: match[1].trim(),
        });
      }
    }

    return highlights;
  }

  /**
   * Detect projects mentioned in content
   */
  detectProjects(content) {
    const projectMap = {
      'tough-cookie': /(tough cookie|kono|wittmann|monkey post|nomu|kyberg|freelance)/i,
      'nomu': /nomu/i,
      'kyberg': /kyberg/i,
      'freelance': /freelance/i,
    };

    const projects = [];
    for (const [id, pattern] of Object.entries(projectMap)) {
      if (pattern.test(content)) {
        projects.push(id);
      }
    }

    return [...new Set(projects)];
  }

  /**
   * Extract financial mentions
   */
  extractFinances(content) {
    const amounts = [];
    
    // Match various formats: 9.000€, 9000€, 9k€, 9.000,00 €
    const patterns = [
      /(\d{1,3}(?:[.,]\d{3})*(?:,\d{2})?)\s*[€$]/g,
      /(\d+)\s*k\s*[€$]/gi,
    ];

    for (const pattern of patterns) {
      const matches = [...content.matchAll(pattern)];
      for (const match of matches) {
        let value = match[1].replace(/\./g, '').replace(',', '.');
        if (match[0].toLowerCase().includes('k')) {
          value = parseFloat(value) * 1000;
        }
        amounts.push(parseFloat(value));
      }
    }

    // Categorize
    const income = content.match(/(einnahme|verdient|eingegangen|bezahlt)/i) ? amounts : [];
    const expenses = content.match(/(ausgabe|kosten|gezahlt|investment)/i) ? amounts : [];
    const openInvoices = content.match(/(offen|offene rechnung|ausstehend)/i) 
      ? amounts.reduce((a, b) => a + b, 0) 
      : 0;

    return {
      income: income.reduce((a, b) => a + b, 0),
      expenses: expenses.reduce((a, b) => a + b, 0),
      openInvoices,
      rawAmounts: amounts,
    };
  }

  /**
   * Detect mood and energy from content
   */
  detectMoodAndEnergy(content) {
    let mood = 3;
    let energy = 3;
    let matches = 0;

    for (const { pattern, mood: m, energy: e } of this.moodPatterns) {
      if (pattern.test(content)) {
        mood += m;
        energy += e;
        matches++;
      }
    }

    if (matches > 0) {
      mood = Math.round(mood / (matches + 1));
      energy = Math.round(energy / (matches + 1));
    }

    return {
      mood: Math.min(5, Math.max(1, mood)),
      energy: Math.min(5, Math.max(1, energy)),
    };
  }

  /**
   * Extract todos mentioned in content
   */
  extractTodos(content) {
    const completed = [];
    const created = [];
    const mentioned = [];

    // Match checkbox patterns
    const checkboxPattern = /-?\s*\[([ xX])\]\s*(.+)/g;
    const matches = [...content.matchAll(checkboxPattern)];
    
    for (const match of matches) {
      const isCompleted = match[1].toLowerCase() === 'x';
      const text = match[2].trim();
      
      if (isCompleted) {
        completed.push(text);
      } else {
        created.push(text);
      }
      mentioned.push(text);
    }

    return { completed, created, mentioned };
  }

  /**
   * Auto-generate tags based on content analysis
   */
  autoGenerateTags(content, highlights, projects) {
    const tags = [];
    
    // Add project tags
    projects.forEach(p => tags.push(`#${p}`));
    
    // Content-based tags
    const tagPatterns = [
      { pattern: /(video|schnitt|post-production|footage)/i, tag: '#video-production' },
      { pattern: /(meeting|call|gespräch)/i, tag: '#meeting' },
      { pattern: /(e-mail|mail|nachricht)/i, tag: '#communication' },
      { pattern: /(design|creative|kreativ)/i, tag: '#creative' },
      { pattern: /(buchhaltung|rechnung|finanzen)/i, tag: '#finance' },
      { pattern: /(produktiv|fokus|deep work)/i, tag: '#productive' },
      { pattern: /(stress|anstrengend|viel)/i, tag: '#intense' },
      { pattern: /(entspannt|ruhig|ausgeglichen)/i, tag: '#balanced' },
    ];

    for (const { pattern, tag } of tagPatterns) {
      if (pattern.test(content) && !tags.includes(tag)) {
        tags.push(tag);
      }
    }

    // Highlight-based tags
    if (highlights.some(h => h.type === 'achievement')) tags.push('#wins');
    if (highlights.some(h => h.type === 'blocker')) tags.push('#blockers');
    if (highlights.some(h => h.type === 'next')) tags.push('#planning');

    return [...new Set(tags)];
  }

  /**
   * Parse multiple memory files
   * @param {Array<{date: string, content: string}>} files
   * @returns {Array} Array of parsed entries
   */
  parseMultipleFiles(files) {
    const entries = [];
    
    for (const { date, content } of files) {
      const entry = this.parseDailyLog(content, date);
      if (entry) {
        entries.push(entry);
      }
    }

    // Sort by date descending
    return entries.sort((a, b) => new Date(b.date) - new Date(a.date));
  }
}

export default JournalParser;
