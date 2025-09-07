# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Audio-to-Kanban is a static web application that converts speech input into a Kanban board. The project uses vanilla JavaScript/HTML/CSS without frameworks and is designed to be hosted on AWS S3 as a static website.

## Development Commands

Since this is a static web application, there are no build commands. Development is done locally using:
- Visual Studio Code with Live Server extension for local testing
- Direct file editing without compilation steps

## Architecture

### Core Components
- **index.html**: Main entry point with PIN-based authentication
- **app.html**: Kanban board application interface (loaded after authentication)
- **script.js**: Main application logic including audio recording, API calls, and Kanban management
- **style.css**: Minimal CSS styling using CSS Grid for Kanban layout
- **tasks.csv**: Template/example for CSV data format

### Key Technical Details

**Authentication**: Simple 4-digit PIN stored in localStorage (client-side only)

**Audio Processing**: Uses Web Speech API (`SpeechRecognition`) for direct speech-to-text conversion
- Configure with `lang: 'de-DE'` for German language support
- No audio recording needed - direct speech recognition

**API Integration**: OpenRouter API (not OpenAI) for:
- AI categorization using prompt: "Kategorisiere diese Aufgabe: [TEXT]. Return JSON: {title, column, priority, project}"
- API Key stored in `.env` file as `OPENROUTER_API_KEY`

**Data Storage**: CSV format for import/export functionality with columns:
```
title,column,priority,project,created,status
```

**Kanban Structure**: Three columns - "Todo", "In Progress", "Done" with priority levels: High, Medium, Low

### Development Environment Setup

1. Aktiviere Python virtuelle Umgebung falls Python-Entwicklung erforderlich
2. Use VS Code with Live Server extension
3. Test locally before S3 deployment
4. OpenRouter API Key is configured in `.env` file

### CSV Handling
Consider Papa Parse library or simple string-splitting for CSV operations. Data persistence through client-side download/upload of CSV files.

### Mobile Considerations
Design is mobile-friendly with appropriate button sizing and monospace font for clarity.