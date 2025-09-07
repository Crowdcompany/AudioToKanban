# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

AudioKanban is a Progressive Web App (PWA) that converts German speech input into organized Kanban tasks using AI categorization. Built with vanilla JavaScript/HTML/CSS, it's production-ready and deployed on GitHub Pages with full offline support.

## Development Commands

```bash
# Local development server
python3 -m http.server 8000

# Git workflow
git add .
git commit -m "Description"
git push origin main  # Auto-deploys to GitHub Pages

# Testing
# Open http://localhost:8000 in Chrome/Edge for full functionality
```

## Architecture

### Core Components
- **index.html**: PIN login (fixed: 1970) with 24h session
- **app.html**: Kanban board with 3 columns (Offen, In Arbeit, Fertig)
- **script.js**: AudioKanban class (~980 LOC) - complete functionality
- **style.css**: Responsive CSS Grid design with priority color coding
- **manifest.json**: PWA configuration for mobile installation
- **service-worker.js**: Offline support and caching
- **tasks.csv**: CSV template for import/export functionality

### Key Technical Details

**Authentication**: Fixed PIN (not visible in UI), 24h localStorage session

**Speech Recognition**: Web Speech API (German) - Chrome/Edge only
- `lang: 'de-DE'` configuration
- Real-time speech-to-text conversion
- Graceful fallback message for unsupported browsers

**AI Integration**: OpenRouter API with GPT-5-mini model
- Complex prompt engineering for 8 action types (create, edit, move, priority, etc.)
- User provides API key (stored locally, never committed)
- Robust JSON parsing with fallback handling

**Data Persistence**: localStorage + CSV Import/Export
```javascript
// Task structure
{
  id: timestamp,
  number: sequential,
  title: "Task title",
  column: "Offen|In Arbeit|Fertig", 
  priority: "High|Medium|Low",
  project: "Category",
  created: ISO-timestamp,
  status: "active",
  comments: [{text, timestamp}]
}
```

**UI Features**: Click-to-edit everything, fuzzy search, undo system, priority colors

## Sprachbefehle Referenz

### Task Management
- **Erstellen**: "GitHub Projekte aufräumen"
- **Verschieben**: "Verschiebe Aufgabe 2 in Fertig" 
- **Bearbeiten**: "Ändere Aufgabe 3 zu neuer Titel"
- **Projekt**: "Ändere das Projekt von Aufgabe 2 zu Arbeit"
- **Priorität**: "Setze die Priorität auf hoch für Aufgabe 5"
- **Kommentare**: "Füge der Aufgabe 1 den Kommentar xyz hinzu"

### Editing Shortcuts
- **Click-to-edit**: Titel, Projekt, Kommentare
- **Keyboard**: Enter (save), Escape (cancel), Ctrl+Enter (textarea save)
- **Add comments**: "+ Kommentar hinzufügen" Button

## Deployment

**Production**: https://crowdcompany.github.io/AudioToKanban
**Repository**: https://github.com/Crowdcompany/AudioToKanban

Auto-deployment on every `git push origin main`. Service worker handles caching and offline functionality. PWA installable on mobile devices.

## Important Notes
- PIN is hardcoded (check source code, not visible in UI for security)
- Requires HTTPS for Web Speech API
- Chrome/Edge recommended for full functionality  
- Tasks are stored locally (localStorage) per browser/device
- CSV export enables manual data transfer between devices