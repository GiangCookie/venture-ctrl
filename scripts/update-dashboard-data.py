#!/usr/bin/env python3
"""
Dashboard Data Updater
Reads from memory logs and updates the dashboard JSON data file.
"""

import json
import os
from datetime import datetime

MEMORY_DIR = "/data/.openclaw/workspace/memory"
DATA_FILE = "/data/.openclaw/workspace/venture-ctrl/data/initial-data.json"

def load_memory_data():
    """Load latest data from memory files."""
    data = {
        "timeSessions": [],
        "income": [],
        "todos": [],
        "pipeline": [],
        "activeSession": None,
        "tags": []
    }
    
    # Read latest daily log
    today = datetime.now().strftime("%Y-%m-%d")
    log_file = os.path.join(MEMORY_DIR, f"{today}.md")
    
    if os.path.exists(log_file):
        with open(log_file, 'r') as f:
            content = f.read()
            # Parse todos, income, etc. from markdown
            # This is simplified - actual parsing would be more robust
            print(f"[INFO] Read log file: {log_file}")
    
    return data

def save_dashboard_data(data):
    """Save updated data to dashboard JSON."""
    os.makedirs(os.path.dirname(DATA_FILE), exist_ok=True)
    with open(DATA_FILE, 'w') as f:
        json.dump(data, f, indent=2)
    print(f"[INFO] Dashboard data saved to: {DATA_FILE}")

def main():
    print("[INFO] Starting dashboard data update...")
    data = load_memory_data()
    save_dashboard_data(data)
    print("[INFO] Update complete!")

if __name__ == "__main__":
    main()
