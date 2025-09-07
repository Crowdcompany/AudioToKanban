# AudioKanban - Sprach-gesteuerte Kanban-Board App

Eine Progressive Web App (PWA) zur Verwaltung von Aufgaben per Sprachsteuerung.

## 🚀 Features

- **Spracherkennung** - Aufgaben per Sprache erstellen
- **KI-Kategorisierung** - Automatische Zuordnung zu Spalten und Prioritäten
- **Kanban-Board** - Offen, In Arbeit, Fertig
- **Kommentar-System** - Notizen zu Aufgaben hinzufügen
- **Undo-Funktion** - Letzte Änderung rückgängig machen
- **CSV Import/Export** - Datenaustausch
- **PWA-Installation** - Installierbar auf Android/iOS

## 📱 Installation auf Android

1. **App öffnen:** https://IHR-USERNAME.github.io/AudioToKanban
2. **Chrome Menü:** ⋮ → "App installieren" oder "Zur Startseite hinzufügen"
3. **Fertig:** App erscheint auf Startbildschirm wie native App

## 🛠️ Lokale Entwicklung

```bash
# Repository klonen
git clone https://github.com/IHR-USERNAME/AudioToKanban.git
cd AudioToKanban

# Lokalen Server starten
python3 -m http.server 8000

# App öffnen
open http://localhost:8000
```

## 🔧 Konfiguration

- **OpenRouter API Key** in `script.js` anpassen
- **PIN-System** für Zugriffskontrolle
- **24h Auto-Login** nach erstem PIN-Eingabe

## 📋 Sprachbefehle

### Aufgaben erstellen:
- "Neue Aufgabe: GitHub Projekte aufräumen"
- "E-Mails beantworten"

### Aufgaben verschieben:
- "Verschiebe Aufgabe 2 in Fertig"
- "Aufgabe 1 nach In Arbeit"

### Kommentare hinzufügen:
- "Füge der Aufgabe 1 den Kommentar 'Tests schreiben' hinzu"
- "Kommentar zu Task 3: Deployment am Freitag"

## 🏗️ Architektur

- **Frontend:** Vanilla JavaScript, HTML5, CSS Grid
- **Spracherkennung:** Web Speech API
- **KI:** OpenRouter API (GPT-5-mini)
- **Storage:** localStorage + CSV Export
- **Hosting:** GitHub Pages (PWA-ready)

## 📱 PWA Features

- **Offline-fähig** mit Service Worker
- **Installierbar** auf Homescreen
- **App-ähnlich** ohne Browser-UI
- **Push-Notifications** (optional)
- **Automatische Updates**

## 🔐 Sicherheit

- **Client-side PIN** (keine Server-Datenbank)
- **API-Keys** sicher konfigurierbar
- **HTTPS** über GitHub Pages
- **Keine sensiblen Daten** im Repository

## 📄 Lizenz

MIT License - Siehe [LICENSE](LICENSE) für Details.