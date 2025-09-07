class AudioKanban {
    constructor() {
        this.tasks = [];
        this.lastTasksState = null;
        this.recognition = null;
        this.isRecording = false;
        
        this.init();
    }

    getApiKey() {
        // Versuche API Key aus localStorage zu holen
        let apiKey = localStorage.getItem('openrouter_api_key');
        
        if (!apiKey) {
            // Popup für API Key Eingabe
            apiKey = prompt('🔑 OpenRouter API Key eingeben:\n(wird sicher lokal gespeichert, nicht auf Server)');
            if (apiKey && apiKey.trim()) {
                localStorage.setItem('openrouter_api_key', apiKey.trim());
            } else {
                throw new Error('API Key erforderlich für Sprachverarbeitung');
            }
        }
        
        return apiKey;
    }

    init() {
        this.checkAuth();
        this.initElements();
        this.initSpeechRecognition();
        this.bindEvents();
        this.loadTasks();
    }

    checkAuth() {
        const loginData = localStorage.getItem('audioKanbanLogin');
        if (!loginData) {
            window.location.href = 'index.html';
            return;
        }
        
        try {
            const data = JSON.parse(loginData);
            const now = Date.now();
            const twentyFourHours = 24 * 60 * 60 * 1000;
            
            if (now - data.timestamp >= twentyFourHours) {
                localStorage.removeItem('audioKanbanLogin');
                window.location.href = 'index.html';
                return;
            }
        } catch (e) {
            localStorage.removeItem('audioKanbanLogin');
            window.location.href = 'index.html';
            return;
        }
    }

    initElements() {
        this.recordBtn = document.getElementById('recordBtn');
        this.undoBtn = document.getElementById('undoBtn');
        this.exportBtn = document.getElementById('exportBtn');
        this.importBtn = document.getElementById('importBtn');
        this.csvFileInput = document.getElementById('csvFileInput');
        this.logoutBtn = document.getElementById('logoutBtn');
        this.voiceStatus = document.getElementById('voiceStatus');
        
        this.offenList = document.getElementById('offenList');
        this.inArbeitList = document.getElementById('inArbeitList');
        this.fertigList = document.getElementById('fertigList');
    }

    initSpeechRecognition() {
        if ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window) {
            this.recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
            this.recognition.lang = 'de-DE';
            this.recognition.continuous = false;
            this.recognition.interimResults = false;
            this.recognition.maxAlternatives = 1;

            this.recognition.onstart = () => {
                this.isRecording = true;
                this.updateRecordButton();
                this.voiceStatus.textContent = '🎤 Sprechen Sie Ihre Aufgabe...';
                this.voiceStatus.className = 'voice-status recording';
            };

            this.recognition.onresult = (event) => {
                const text = event.results[0][0].transcript;
                this.voiceStatus.textContent = `Verstanden: "${text}" - KI verarbeitet...`;
                this.voiceStatus.className = 'voice-status processing';
                this.processSpokenTask(text);
            };

            this.recognition.onerror = (event) => {
                this.voiceStatus.textContent = `Fehler: ${event.error}`;
                this.voiceStatus.className = 'voice-status error';
                this.isRecording = false;
                this.updateRecordButton();
            };

            this.recognition.onend = () => {
                this.isRecording = false;
                this.updateRecordButton();
            };
        } else {
            this.voiceStatus.textContent = 'Spracherkennung wird von diesem Browser nicht unterstützt';
            this.voiceStatus.className = 'voice-status error';
            this.recordBtn.disabled = true;
        }
    }

    bindEvents() {
        this.recordBtn.addEventListener('click', () => this.toggleRecording());
        this.undoBtn.addEventListener('click', () => this.undoLastAction());
        this.exportBtn.addEventListener('click', () => this.exportCSV());
        this.importBtn.addEventListener('click', () => this.csvFileInput.click());
        this.csvFileInput.addEventListener('change', (e) => this.importCSV(e));
        this.logoutBtn.addEventListener('click', () => this.logout());
    }

    toggleRecording() {
        if (this.isRecording) {
            this.recognition.stop();
        } else {
            this.recognition.start();
        }
    }

    updateRecordButton() {
        this.recordBtn.textContent = this.isRecording ? '🛑 Stop' : '🎤 Aufgabe sprechen';
        this.recordBtn.classList.toggle('recording', this.isRecording);
    }

    async processSpokenTask(text) {
        try {
            console.log('Sende Anfrage an Proxy...');
            const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.getApiKey()}`,
                    'Content-Type': 'application/json',
                    'HTTP-Referer': window.location.origin,
                },
                body: JSON.stringify({
                    model: 'openai/gpt-5-mini',
                    messages: [{
                        role: 'system',
                        content: 'Du bist ein Assistent der Aufgaben kategorisiert. Antworte IMMER nur mit einem gültigen JSON-Objekt, ohne jegliche Markdown-Formatierung oder zusätzlichen Text.'
                    }, {
                        role: 'user',
                        content: `Analysiere diese Spracheingabe: "${text}". 

Vorhandene Aufgaben: ${this.tasks.map(t => `#${t.number || t.id}: ${t.title}`).join(', ')}

WICHTIG: Prüfe zuerst diese Aktionen in genau dieser Reihenfolge:

1. BEARBEITEN: Wenn die Spracheingabe "ändere", "bearbeite", "umbenennen", "Titel" oder "heißt jetzt" enthält UND eine Aufgabennummer erwähnt (z.B. "ändere Aufgabe 6 zu Optiker Termin", "ändere den Titel für Aufgabe 6 in Optiker Termin"), antworte mit:
{"action": "editTask", "taskNumber": 6, "newTitle": "Optiker Termin"}

2. PRIORITÄT: Wenn es sich um das Ändern der Priorität handelt (z.B. "setze die Priorität auf hoch für Aufgabe 5", "Priorität hoch für Task 3"), antworte mit:
{"action": "setPriority", "taskNumber": 5, "priority": "High"} 
Verwende "High" für hoch/wichtig, "Medium" für mittel/normal, "Low" für niedrig/gering.

Wenn es sich um das Hinzufügen eines Kommentars handelt (z.B. "füge der aufgabe 1 den kommentar xyz hinzu"), antworte mit:
{"action": "addComment", "taskNumber": 1, "comment": "Der Kommentartext"}

Wenn es sich um das Verschieben per Nummer handelt (z.B. "verschiebe aufgabe 2 in fertig"), antworte mit:
{"action": "moveByNumber", "taskNumber": 2, "newColumn": "Fertig"}

Wenn es sich um das Verschieben per Titel handelt, antworte mit:
{"action": "move", "taskTitle": "Exakter Titel der vorhandenen Aufgabe", "newColumn": "Offen|In Arbeit|Fertig"}

Wenn die Spracheingabe ähnlich zu einer vorhandenen Aufgabe ist (z.B. "Guitar" statt "GitHub"), antworte mit:
{"action": "clarify", "spokenText": "Was verstanden wurde", "suggestions": ["Vorhandene ähnliche Aufgabe 1", "Vorhandene ähnliche Aufgabe 2"]}

Ansonsten für eindeutig neue Aufgaben:
{"action": "create", "title": "Aufgabentitel", "column": "Offen", "priority": "Medium", "project": "Allgemein"}`
                    }],
                    temperature: 0.1
                })
            });

            if (!response.ok) {
                throw new Error(`API Fehler: ${response.status}`);
            }

            const data = await response.json();
            let content = data.choices[0].message.content.trim();
            
            // Robuste JSON-Extraktion
            if (content.includes('```')) {
                const jsonMatch = content.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/);
                if (jsonMatch) {
                    content = jsonMatch[1];
                }
            }
            
            // Finde JSON-Objekt im Text
            const jsonMatch = content.match(/\{[^}]*\}/);
            if (jsonMatch) {
                content = jsonMatch[0];
            }
            
            console.log('Extracted JSON:', content);
            const taskData = JSON.parse(content);
            
            if (taskData.action === 'setPriority') {
                this.setTaskPriority(taskData.taskNumber, taskData.priority);
                if (!this.isShowingClarification) {
                    setTimeout(() => {
                        if (!this.isShowingClarification) {
                            this.voiceStatus.textContent = '';
                            this.voiceStatus.className = 'voice-status';
                        }
                    }, 3000);
                }
            } else if (taskData.action === 'editTask') {
                this.editTaskByNumber(taskData.taskNumber, taskData.newTitle);
                if (!this.isShowingClarification) {
                    setTimeout(() => {
                        if (!this.isShowingClarification) {
                            this.voiceStatus.textContent = '';
                            this.voiceStatus.className = 'voice-status';
                        }
                    }, 3000);
                }
            } else if (taskData.action === 'move') {
                this.moveTask(taskData.taskTitle, taskData.newColumn);
                // Auto-hide für move actions - nur wenn nicht clarifying
                if (!this.isShowingClarification) {
                    setTimeout(() => {
                        if (!this.isShowingClarification) {
                            this.voiceStatus.textContent = '';
                            this.voiceStatus.className = 'voice-status';
                        }
                    }, 3000);
                }
            } else if (taskData.action === 'moveByNumber') {
                this.moveTaskByNumber(taskData.taskNumber, taskData.newColumn);
                // Auto-hide für moveByNumber actions - nur wenn nicht clarifying
                if (!this.isShowingClarification) {
                    setTimeout(() => {
                        if (!this.isShowingClarification) {
                            this.voiceStatus.textContent = '';
                            this.voiceStatus.className = 'voice-status';
                        }
                    }, 3000);
                }
            } else if (taskData.action === 'addComment') {
                this.addCommentToTask(taskData.taskNumber, taskData.comment);
                // Auto-hide für comment actions - nur wenn nicht clarifying
                if (!this.isShowingClarification) {
                    setTimeout(() => {
                        if (!this.isShowingClarification) {
                            this.voiceStatus.textContent = '';
                            this.voiceStatus.className = 'voice-status';
                        }
                    }, 3000);
                }
            } else if (taskData.action === 'clarify') {
                // KEIN Timeout für clarify - Dialog bleibt stehen!
                this.showClarificationDialog(taskData.spokenText, taskData.suggestions);
            } else {
                this.addTask(taskData);
                this.voiceStatus.textContent = `✅ Aufgabe hinzugefügt: "${taskData.title}"`;
                this.voiceStatus.className = 'voice-status success';
                // Auto-hide für create actions - nur wenn nicht clarifying
                if (!this.isShowingClarification) {
                    setTimeout(() => {
                        if (!this.isShowingClarification) {
                            this.voiceStatus.textContent = '';
                            this.voiceStatus.className = 'voice-status';
                        }
                    }, 3000);
                }
            }

        } catch (error) {
            console.error('Fehler beim Verarbeiten der Aufgabe:', error);
            console.error('Full error details:', {
                message: error.message,
                stack: error.stack,
                name: error.name
            });
            this.voiceStatus.textContent = `❌ Fehler: ${error.message}`;
            this.voiceStatus.className = 'voice-status error';
            
            // Auto-hide error messages
            setTimeout(() => {
                this.voiceStatus.textContent = '';
                this.voiceStatus.className = 'voice-status';
            }, 5000);
        }
    }

    saveStateForUndo() {
        this.lastTasksState = JSON.parse(JSON.stringify(this.tasks));
        this.undoBtn.disabled = false;
    }

    undoLastAction() {
        if (this.lastTasksState) {
            this.tasks = JSON.parse(JSON.stringify(this.lastTasksState));
            this.lastTasksState = null;
            this.undoBtn.disabled = true;
            this.saveTasks();
            this.renderTasks();
            this.voiceStatus.textContent = '↶ Letzte Änderung rückgängig gemacht';
            this.voiceStatus.className = 'voice-status success';
            
            setTimeout(() => {
                this.voiceStatus.textContent = '';
                this.voiceStatus.className = 'voice-status';
            }, 3000);
        }
    }

    addTask(taskData) {
        this.saveStateForUndo();
        
        const task = {
            id: Date.now(),
            number: this.getNextTaskNumber(),
            title: taskData.title || 'Unbenannte Aufgabe',
            column: taskData.column || 'Offen',
            priority: taskData.priority || 'Medium',
            project: taskData.project || 'Allgemein',
            created: new Date().toISOString(),
            status: 'active',
            comments: []
        };

        this.tasks.push(task);
        this.saveTasks();
        this.renderTasks();
    }

    getNextTaskNumber() {
        const maxNumber = this.tasks.reduce((max, task) => {
            return Math.max(max, task.number || 0);
        }, 0);
        return maxNumber + 1;
    }

    moveTask(taskTitle, newColumn) {
        console.log('Suche nach Task:', taskTitle);
        console.log('Vorhandene Tasks:', this.tasks.map(t => t.title));
        
        // Erweiterte Fuzzy-Suche
        const task = this.findTaskByFuzzyMatch(taskTitle);

        if (task) {
            task.column = newColumn;
            this.saveTasks();
            this.renderTasks();
            this.voiceStatus.textContent = `✅ Aufgabe "${task.title}" nach "${newColumn}" verschoben`;
            this.voiceStatus.className = 'voice-status success';
        } else {
            // Zeige alle verfügbaren Tasks zur Debug-Hilfe
            const availableTasks = this.tasks.map(t => t.title).join(', ');
            this.voiceStatus.textContent = `❌ Task "${taskTitle}" nicht gefunden. Verfügbar: ${availableTasks}`;
            this.voiceStatus.className = 'voice-status error';
        }
    }

    moveTaskByNumber(taskNumber, newColumn) {
        const task = this.tasks.find(t => (t.number || t.id) == taskNumber);
        
        if (task) {
            this.saveStateForUndo();
            task.column = newColumn;
            this.saveTasks();
            this.renderTasks();
            this.voiceStatus.textContent = `✅ Aufgabe #${taskNumber} "${task.title}" nach "${newColumn}" verschoben`;
            this.voiceStatus.className = 'voice-status success';
        } else {
            this.voiceStatus.textContent = `❌ Aufgabe #${taskNumber} nicht gefunden`;
            this.voiceStatus.className = 'voice-status error';
        }
    }

    setTaskPriority(taskNumber, priority) {
        const task = this.tasks.find(t => (t.number || t.id) == taskNumber);
        
        if (task) {
            this.saveStateForUndo();
            task.priority = priority;
            this.saveTasks();
            this.renderTasks();
            this.voiceStatus.textContent = `✅ Priorität von Aufgabe #${taskNumber} auf "${priority}" gesetzt`;
            this.voiceStatus.className = 'voice-status success';
        } else {
            this.voiceStatus.textContent = `❌ Aufgabe #${taskNumber} nicht gefunden`;
            this.voiceStatus.className = 'voice-status error';
        }
    }

    editTaskByNumber(taskNumber, newTitle) {
        const task = this.tasks.find(t => (t.number || t.id) == taskNumber);
        
        if (task && newTitle && newTitle.trim()) {
            this.saveStateForUndo();
            const oldTitle = task.title;
            task.title = newTitle.trim();
            this.saveTasks();
            this.renderTasks();
            this.voiceStatus.textContent = `✅ Aufgabe #${taskNumber} geändert von "${oldTitle}" zu "${newTitle}"`;
            this.voiceStatus.className = 'voice-status success';
        } else if (!task) {
            this.voiceStatus.textContent = `❌ Aufgabe #${taskNumber} nicht gefunden`;
            this.voiceStatus.className = 'voice-status error';
        } else {
            this.voiceStatus.textContent = `❌ Neuer Titel darf nicht leer sein`;
            this.voiceStatus.className = 'voice-status error';
        }
    }

    addCommentToTask(taskNumber, comment) {
        const task = this.tasks.find(t => (t.number || t.id) == taskNumber);
        
        if (task) {
            this.saveStateForUndo();
            
            if (!task.comments) {
                task.comments = [];
            }
            
            task.comments.push({
                text: comment,
                timestamp: new Date().toISOString()
            });
            
            this.saveTasks();
            this.renderTasks();
            this.voiceStatus.textContent = `✅ Kommentar zu Aufgabe #${taskNumber} hinzugefügt`;
            this.voiceStatus.className = 'voice-status success';
        } else {
            this.voiceStatus.textContent = `❌ Aufgabe #${taskNumber} nicht gefunden`;
            this.voiceStatus.className = 'voice-status error';
        }
    }

    findTaskByFuzzyMatch(searchTitle) {
        const search = searchTitle.toLowerCase();
        
        // Filter nur gültige Tasks (nicht undefined/null)
        const validTasks = this.tasks.filter(t => t && t.title);
        
        // 1. Exakte Übereinstimmung
        let task = validTasks.find(t => t.title.toLowerCase() === search);
        if (task) return task;
        
        // 2. Enthält den Suchbegriff
        task = validTasks.find(t => t.title.toLowerCase().includes(search));
        if (task) return task;
        
        // 3. Suchbegriff enthält Task-Titel
        task = validTasks.find(t => search.includes(t.title.toLowerCase()));
        if (task) return task;
        
        // 4. Wort-für-Wort Matching (für Spracherkennungsfehler)
        const searchWords = search.split(' ');
        task = validTasks.find(t => {
            const taskWords = t.title.toLowerCase().split(' ');
            return taskWords.some(taskWord => 
                searchWords.some(searchWord => 
                    this.isSimilar(taskWord, searchWord)
                )
            );
        });
        if (task) return task;
        
        return null;
    }

    isSimilar(word1, word2) {
        // Einfache Ähnlichkeitsprüfung
        if (word1 === word2) return true;
        if (Math.abs(word1.length - word2.length) > 2) return false;
        
        // Häufige Spracherkennungsfehler
        const replacements = {
            'github': ['gitter', 'git', 'gitter'],
            'projekte': ['projekten', 'projekt', 'projects'],
            'aufräumen': ['aufraumen', 'räumen', 'raumen']
        };
        
        for (const [correct, variants] of Object.entries(replacements)) {
            if (word1 === correct && variants.includes(word2)) return true;
            if (word2 === correct && variants.includes(word1)) return true;
        }
        
        return false;
    }

    showClarificationDialog(spokenText, suggestions) {
        console.log('🤔 Showing clarification dialog for:', spokenText);
        
        // Verhindere alle anderen Timeouts
        this.isShowingClarification = true;
        
        // Container erstellen
        const container = document.createElement('div');
        container.style.textAlign = 'left';
        
        // Überschrift
        const title = document.createElement('p');
        title.innerHTML = `<strong>🤔 Verstanden: "${spokenText}"</strong>`;
        container.appendChild(title);
        
        const subtitle = document.createElement('p');
        subtitle.textContent = 'Meinten Sie eine dieser Aufgaben?';
        container.appendChild(subtitle);
        
        // Suggestion Buttons
        const buttonContainer = document.createElement('div');
        buttonContainer.style.margin = '10px 0';
        
        suggestions.forEach(suggestion => {
            const btn = document.createElement('button');
            btn.textContent = suggestion;
            btn.className = 'clarify-btn';
            btn.style.cssText = 'margin: 5px; padding: 8px 12px; background: #3498db; color: white; border: none; border-radius: 4px; cursor: pointer;';
            btn.addEventListener('click', () => this.selectSuggestion(suggestion));
            buttonContainer.appendChild(btn);
        });
        
        container.appendChild(buttonContainer);
        
        // Neue Aufgabe Button
        const newTaskBtn = document.createElement('button');
        newTaskBtn.textContent = `Neue Aufgabe: "${spokenText}"`;
        newTaskBtn.className = 'clarify-btn';
        newTaskBtn.style.cssText = 'margin: 5px; padding: 8px 12px; background: #27ae60; color: white; border: none; border-radius: 4px; cursor: pointer;';
        newTaskBtn.addEventListener('click', () => this.createNewTask(spokenText));
        container.appendChild(newTaskBtn);
        
        // Schließen Button
        const closeContainer = document.createElement('div');
        closeContainer.style.marginTop = '10px';
        
        const closeBtn = document.createElement('button');
        closeBtn.textContent = '❌ Schließen';
        closeBtn.className = 'clarify-btn';
        closeBtn.style.cssText = 'margin: 5px; padding: 8px 12px; background: #95a5a6; color: white; border: none; border-radius: 4px; cursor: pointer;';
        closeBtn.addEventListener('click', () => this.cancelClarification());
        closeContainer.appendChild(closeBtn);
        
        container.appendChild(closeContainer);
        
        // Container einsetzen
        this.voiceStatus.innerHTML = '';
        this.voiceStatus.appendChild(container);
        this.voiceStatus.className = 'voice-status clarifying';
        
        console.log('✅ Clarification dialog set with event listeners');
    }

    selectSuggestion(taskTitle) {
        // Standardmäßig nach "In Arbeit" verschieben bei Auswahl
        this.moveTask(taskTitle, 'In Arbeit');
        this.cancelClarification();
    }

    createNewTask(spokenText) {
        const taskData = {
            title: spokenText,
            column: 'Offen',
            priority: 'Medium',
            project: 'Allgemein'
        };
        this.addTask(taskData);
        this.voiceStatus.textContent = `✅ Neue Aufgabe erstellt: "${spokenText}"`;
        this.voiceStatus.className = 'voice-status success';
        this.cancelClarification();
    }

    cancelClarification() {
        console.log('❌ Canceling clarification dialog');
        this.isShowingClarification = false;
        this.voiceStatus.textContent = '';
        this.voiceStatus.className = 'voice-status';
    }

    renderTasks() {
        this.offenList.innerHTML = '';
        this.inArbeitList.innerHTML = '';
        this.fertigList.innerHTML = '';

        this.tasks.forEach(task => {
            const taskElement = this.createTaskElement(task);
            
            switch (task.column) {
                case 'Offen':
                case 'Todo':  // Backwards compatibility
                    this.offenList.appendChild(taskElement);
                    break;
                case 'In Arbeit':
                case 'In Progress':  // Backwards compatibility
                    this.inArbeitList.appendChild(taskElement);
                    break;
                case 'Fertig':
                case 'Done':  // Backwards compatibility
                    this.fertigList.appendChild(taskElement);
                    break;
            }
        });
    }

    createTaskElement(task) {
        const div = document.createElement('div');
        // Sichere Priorität mit Fallback
        const priority = (task.priority || 'medium').toLowerCase();
        div.className = `task-card priority-${priority}`;
        div.draggable = true;
        div.dataset.taskId = task.id;

        const commentsHtml = task.comments && task.comments.length > 0 
            ? `<div class="task-comments">
                ${task.comments.map(comment => 
                    `<div class="task-comment">
                        <div class="comment-text">${comment.text}</div>
                        <div class="comment-timestamp">${new Date(comment.timestamp).toLocaleDateString('de-DE', {day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit'})}</div>
                    </div>`
                ).join('')}
               </div>`
            : '';

        div.innerHTML = `
            <div class="task-header">
                <span class="task-number">#${task.number || task.id}</span>
                <span class="task-priority ${priority}">${task.priority || 'Medium'}</span>
                <button class="task-delete" onclick="app.deleteTask(${task.id})">×</button>
            </div>
            <div class="task-title" onclick="app.editTaskTitle(${task.id}, this)" title="Klicken zum Bearbeiten">${task.title}</div>
            <div class="task-project">${task.project}</div>
            ${commentsHtml}
            <div class="task-created">${new Date(task.created).toLocaleDateString('de-DE')}</div>
        `;

        div.addEventListener('dragstart', (e) => {
            e.dataTransfer.setData('text/plain', task.id);
        });

        return div;
    }

    deleteTask(taskId) {
        this.saveStateForUndo();
        this.tasks = this.tasks.filter(task => task.id !== taskId);
        this.saveTasks();
        this.renderTasks();
    }

    editTaskTitle(taskId, titleElement) {
        const task = this.tasks.find(t => t.id === taskId);
        if (!task) return;

        this.saveStateForUndo();
        
        // Erstelle Input-Field
        const input = document.createElement('input');
        input.type = 'text';
        input.value = task.title;
        input.style.cssText = 'width: 100%; padding: 4px; border: 2px solid #3498db; border-radius: 4px; font-size: inherit; font-family: inherit;';
        
        // Ersetze Text temporär
        const originalText = titleElement.textContent;
        titleElement.innerHTML = '';
        titleElement.appendChild(input);
        titleElement.onclick = null;
        
        // Fokus und Select
        input.focus();
        input.select();
        
        const saveEdit = () => {
            const newTitle = input.value.trim();
            if (newTitle && newTitle !== task.title) {
                task.title = newTitle;
                this.saveTasks();
                this.renderTasks();
                this.voiceStatus.textContent = `✅ Aufgabe #${task.number || task.id} geändert zu: "${newTitle}"`;
                this.voiceStatus.className = 'voice-status success';
                setTimeout(() => {
                    this.voiceStatus.textContent = '';
                    this.voiceStatus.className = 'voice-status';
                }, 3000);
            } else {
                this.renderTasks(); // Undo changes
            }
        };
        
        const cancelEdit = () => {
            this.renderTasks(); // Undo changes
        };
        
        // Event Listeners
        input.addEventListener('blur', saveEdit);
        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                saveEdit();
            } else if (e.key === 'Escape') {
                e.preventDefault();
                cancelEdit();
            }
        });
    }

    exportCSV() {
        const headers = ['title', 'column', 'priority', 'project', 'created', 'status'];
        const csvContent = [
            headers.join(','),
            ...this.tasks.map(task => headers.map(header => `"${task[header]}"`).join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `kanban-tasks-${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        window.URL.revokeObjectURL(url);
    }

    importCSV(event) {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const csv = e.target.result;
                const lines = csv.split('\n');
                const headers = lines[0].split(',').map(h => h.replace(/"/g, ''));
                
                const newTasks = lines.slice(1)
                    .filter(line => line.trim())
                    .map((line, index) => {
                        const values = line.split(',').map(v => v.replace(/"/g, ''));
                        const task = {};
                        headers.forEach((header, i) => {
                            task[header] = values[i] || '';
                        });
                        task.id = task.id || Date.now() + index;
                        return task;
                    });

                this.tasks = newTasks;
                this.saveTasks();
                this.renderTasks();
                
                this.voiceStatus.textContent = `✅ ${newTasks.length} Aufgaben importiert`;
                this.voiceStatus.className = 'voice-status success';
                
                setTimeout(() => {
                    this.voiceStatus.textContent = '';
                    this.voiceStatus.className = 'voice-status';
                }, 3000);

            } catch (error) {
                this.voiceStatus.textContent = `❌ Import-Fehler: ${error.message}`;
                this.voiceStatus.className = 'voice-status error';
            }
        };
        reader.readAsText(file);
    }

    saveTasks() {
        localStorage.setItem('audioKanbanTasks', JSON.stringify(this.tasks));
    }

    loadTasks() {
        const saved = localStorage.getItem('audioKanbanTasks');
        this.tasks = saved ? JSON.parse(saved) : [];
        
        // Weise bestehenden Tasks ohne Nummer eine zu
        this.tasks.forEach(task => {
            if (!task.number) {
                task.number = task.id;
            }
        });
        
        this.renderTasks();
    }

    logout() {
        localStorage.removeItem('audioKanbanLogin');
        localStorage.removeItem('audioKanbanTasks');
        window.location.href = 'index.html';
    }
}

// App initialisieren
const app = new AudioKanban();