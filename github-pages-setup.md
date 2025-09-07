# GitHub Pages Setup - Schritt für Schritt

## 🚀 Schritt 1: GitHub Repository erstellen

1. **GitHub.com** aufrufen und anmelden
2. **"New repository"** klicken (grüner Button)
3. **Repository Name:** `AudioToKanban`
4. **Description:** `Sprach-gesteuerte Kanban-Board PWA`
5. **Public** auswählen (für GitHub Pages kostenlos)
6. **"Create repository"** klicken

## 📁 Schritt 2: Dateien hochladen

### Option A: Web-Interface (einfach)
1. **"uploading an existing file"** klicken
2. **Alle diese Dateien** per Drag & Drop hochladen:
   - `index.html`
   - `app.html`
   - `script.js`
   - `style.css`
   - `manifest.json`
   - `service-worker.js`
   - `tasks.csv`
   - `README.md`
   - `config.xml`
   - `package.json`

3. **Commit message:** `Initial PWA version`
4. **"Commit changes"** klicken

### Option B: Git Clone (fortgeschritten)
```bash
git clone https://github.com/IHR-USERNAME/AudioToKanban.git
cd AudioToKanban
# Alle Dateien kopieren
git add .
git commit -m "Initial PWA version"
git push origin main
```

## ⚙️ Schritt 3: GitHub Pages aktivieren

1. **Repository** → **Settings** Tab
2. **"Pages"** in der linken Sidebar
3. **Source:** `Deploy from a branch`
4. **Branch:** `main` auswählen
5. **Folder:** `/ (root)` auswählen
6. **"Save"** klicken

⏰ **Warten:** 5-10 Minuten für Deployment

## 🔗 Schritt 4: URL testen

Ihre App ist verfügbar unter:
**https://IHR-USERNAME.github.io/AudioToKanban**

## 📱 Schritt 5: PWA auf Android installieren

1. **Chrome Browser** öffnen
2. **URL besuchen:** https://IHR-USERNAME.github.io/AudioToKanban
3. **Chrome Menü** (⋮) → **"App installieren"** oder **"Zur Startseite hinzufügen"**
4. **"Installieren"** bestätigen

🎉 **Fertig!** App erscheint auf Homescreen wie native App

## 🔧 Troubleshooting

### PWA Installation wird nicht angeboten?
- **HTTPS prüfen:** URL muss mit `https://` beginnen
- **Manifest prüfen:** Developer Tools → Application → Manifest
- **Service Worker prüfen:** Developer Tools → Application → Service Workers

### Spracherkennung funktioniert nicht?
- **Mikrofon-Berechtigung** erteilen
- **HTTPS erforderlich** für Web Speech API
- **Chrome Browser** nutzen (beste Unterstützung)

### API-Fehler?
- **OpenRouter Key** in `script.js` konfigurieren
- **CORS-Probleme** mit anderem Proxy lösen

## 🔄 Updates deployen

Einfach Dateien im GitHub Repository ändern:
1. **Datei bearbeiten** (Stift-Icon)
2. **Änderungen committen**
3. **Automatisches Deployment** (5-10 Min)

## 📊 Statistiken anzeigen

**Repository** → **Insights** → **Traffic**
- Besucher-Zahlen
- Page Views
- Beliebte Referrer