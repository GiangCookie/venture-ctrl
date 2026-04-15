# VENTURE CTRL 🚀

Personal multi-venture dashboard for tracking time, income, energy, deals, and todos across multiple projects.

![Dashboard Preview](preview.png)

## Features

- **⏱️ Zeit-Tracking** – Check-in/Check-out System mit Energie-Level Tracking
- **💰 Einnahmen-Tracking** – Verfolge Einnahmen pro Projekt
- **⚡ Effektiver Stundenlohn** – Automatische Berechnung: Einnahmen ÷ Zeit
- **🎯 Pipeline Management** – Deals durch Stages tracken (Lead → Pitch → Negotiation → Closed)
- **✅ To-Do Liste** – Sortiert nach Projekt und Priorität
- **📊 Visualisierungen** – Charts für Zeit-Verteilung, Wochen-Übersicht, Einnahmen
- **📤 JSON Export/Import** – Sync über GitHub oder zwischen Geräten

## Projekte (vorkonfiguriert)

- 🍪 **Tough Cookie** – Video/Social Media Agentur
- 📱 **NOMU** – SaaS digitale Speisekarte
- 💊 **Kyberg Export** – Nahrungsergänzungsmittel Export
- 🎬 **Freelance** – Persönliche Video/Content Projekte

## Setup

```bash
# Repository klonen
git clone https://github.com/YOUR_USERNAME/venture-ctrl.git
cd venture-ctrl

# Dependencies installieren
npm install

# Development Server starten
npm run dev
```

Öffne http://localhost:5173 im Browser.

## Deployment auf GitHub Pages

1. **Repository erstellen** auf GitHub (z.B. `venture-ctrl`)

2. **Base Path anpassen** in `vite.config.js`:
   ```js
   base: '/venture-ctrl/', // Dein Repo-Name
   ```

3. **GitHub Actions Workflow** erstellen (`.github/workflows/deploy.yml`):
   ```yaml
   name: Deploy to GitHub Pages

   on:
     push:
       branches: [main]

   jobs:
     deploy:
       runs-on: ubuntu-latest
       steps:
         - uses: actions/checkout@v4
         - uses: actions/setup-node@v4
           with:
             node-version: 20
         - run: npm ci
         - run: npm run build
         - uses: peaceiris/actions-gh-pages@v3
           with:
             github_token: ${{ secrets.GITHUB_TOKEN }}
             publish_dir: ./dist
   ```

4. **GitHub Pages aktivieren**:
   - Gehe zu Repository Settings → Pages
   - Source: "Deploy from a branch"
   - Branch: `gh-pages` / `root`

5. **Push und fertig!**
   ```bash
   git add .
   git commit -m "Initial commit"
   git push origin main
   ```

Dein Dashboard ist dann unter: `https://YOUR_USERNAME.github.io/venture-ctrl/`

## Daten synchronisieren (GitHub JSON Method)

Da wir kein Backend haben, funktioniert der Sync manuell:

1. **Exportiere** deine Daten über den "Export" Button
2. **Committe** die JSON-Datei ins Repository (z.B. `/data/backup.json`)
3. **Importiere** auf anderem Gerät über den "Import" Button

### Automatisierter Sync (optional)

Für echten Multi-Device Sync kannst du später Supabase integrieren:
- Free Tier: 500MB Datenbank, 2GB Bandwidth
- Perfekt für persönliche Dashboards

## Tech Stack

- **React 18** – UI Framework
- **Vite** – Build Tool
- **Recharts** – Charts/Visualisierungen
- **LocalStorage** – Persistente Datenspeicherung

## Anpassungen

### Projekte ändern

In `App.jsx`, ändere das `PROJECTS` Array:

```javascript
const PROJECTS = [
  { id: 'projekt-1', name: 'Mein Projekt', color: '#FF6B35', emoji: '🎯' },
  // ...
];
```

### Farben anpassen

Jedes Projekt hat seine eigene Farbe. Ändere die `color` Property im `PROJECTS` Array.

## Lizenz

MIT – Mach damit was du willst 🤘

---

Built for multi-venture operators who need clarity, not complexity.
