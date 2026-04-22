#!/bin/bash
# Dashboard Update Script - runs every 4 hours via cron

echo "[$(date)] Starting dashboard update..."

# Update data from memory logs
python3 /data/.openclaw/workspace/venture-ctrl/scripts/update-dashboard-data.py

# Rebuild dashboard
cd /data/.openclaw/workspace/venture-ctrl
npm run build

# Deploy to GitHub Pages (if configured)
# cd /data/.openclaw/workspace/venture-ctrl && npm run deploy

echo "[$(date)] Dashboard update complete!"
