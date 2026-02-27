// ── Custom Lesson Builder ─────────────────────────────────────────────────────

class LessonBuilder {
    constructor(app) {
        this.app = app;
        this.STORAGE_KEY = 'readingCompanion_customLessons';
    }

    init() {
        const openBtn = document.getElementById('lessonBuilderOpenBtn');
        if (openBtn) openBtn.addEventListener('click', () => this.open());

        const closeBtn = document.getElementById('lessonBuilderCloseBtn');
        if (closeBtn) closeBtn.addEventListener('click', () => this.close());

        const wordInput = document.getElementById('builderWordInput');
        if (wordInput) wordInput.addEventListener('input', () => this._generatePreview());

        const langSelect = document.getElementById('builderLangSelect');
        if (langSelect) langSelect.addEventListener('change', () => this._generatePreview());

        const introInput = document.getElementById('builderIntroInput');
        if (introInput) introInput.addEventListener('input', () => this._generatePreview());

        const saveBtn = document.getElementById('builderSaveBtn');
        if (saveBtn) saveBtn.addEventListener('click', () => this._saveLesson());

        const previewBtn = document.getElementById('builderPreviewBtn');
        if (previewBtn) previewBtn.addEventListener('click', () => this._previewLesson());

        this._renderSavedLessons();
    }

    open() {
        const overlay = document.getElementById('lessonBuilderOverlay');
        if (overlay) overlay.classList.add('visible');
        // Default language to current app language
        const langSelect = document.getElementById('builderLangSelect');
        if (langSelect) langSelect.value = this.app.currentLanguage;
        this._renderSavedLessons();
    }

    close() {
        const overlay = document.getElementById('lessonBuilderOverlay');
        if (overlay) overlay.classList.remove('visible');
    }

    _generatePreview() {
        const word = (document.getElementById('builderWordInput').value || '').trim();
        const lang = document.getElementById('builderLangSelect').value;
        const introTts = (document.getElementById('builderIntroInput').value || '').trim();
        const previewList = document.getElementById('builderPreviewSteps');
        const saveBtn = document.getElementById('builderSaveBtn');
        const previewBtn = document.getElementById('builderPreviewBtn');

        if (!word) {
            previewList.innerHTML = '<li class="builder-preview-empty">Enter a word above to see the lesson steps.</li>';
            if (saveBtn) saveBtn.disabled = true;
            if (previewBtn) previewBtn.disabled = true;
            return;
        }

        const lesson = this._buildLesson(word, lang, introTts);
        previewList.innerHTML = '';
        lesson.steps.forEach(step => {
            const li = document.createElement('li');
            if (step.type === 'narrate') {
                li.innerHTML = '<span class="builder-step-type narrate">📢</span> ' + this._escapeHtml(step.tts);
            } else if (step.type === 'prompt') {
                li.innerHTML = '<span class="builder-step-type prompt">⌨️</span> Press <strong>' +
                    this._escapeHtml(step.expected.toUpperCase()) + '</strong> — ' + this._escapeHtml(step.tts);
            } else if (step.type === 'complete') {
                li.innerHTML = '<span class="builder-step-type complete">🏆</span> ' + this._escapeHtml(step.tts);
            }
            previewList.appendChild(li);
        });

        if (saveBtn) saveBtn.disabled = false;
        if (previewBtn) previewBtn.disabled = false;
    }

    _buildLesson(word, lang, customIntro) {
        var lesson = makeLessonFromWord(word, lang);
        // Give it a unique custom ID
        lesson.id = 'custom-' + word.toLowerCase().replace(/[^a-z0-9]/g, '') + '-' + lang + '-' + Date.now() + '-' + Math.random().toString(36).slice(2, 6);
        // Override intro TTS if custom intro provided
        if (customIntro) {
            var introStep = lesson.steps.find(function(s) { return s.type === 'narrate' && s.id === 'intro'; });
            if (introStep) introStep.tts = customIntro;
        }
        return lesson;
    }

    _saveLesson() {
        const word = (document.getElementById('builderWordInput').value || '').trim();
        const lang = document.getElementById('builderLangSelect').value;
        const introTts = (document.getElementById('builderIntroInput').value || '').trim();

        if (!word) return;

        const lesson = this._buildLesson(word, lang, introTts);
        const lessons = this.loadCustomLessons();
        lessons.push(lesson);
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(lessons));

        // Clear inputs
        document.getElementById('builderWordInput').value = '';
        document.getElementById('builderIntroInput').value = '';
        this._generatePreview();
        this._renderSavedLessons();

        // Refresh the instruction mode dropdown if it's open
        if (window.instructionModeManager) {
            window.instructionModeManager._populateLessonSelect();
        }
    }

    _previewLesson() {
        const word = (document.getElementById('builderWordInput').value || '').trim();
        const lang = document.getElementById('builderLangSelect').value;
        const introTts = (document.getElementById('builderIntroInput').value || '').trim();

        if (!word) return;

        const lesson = this._buildLesson(word, lang, introTts);
        this.close();

        if (window.instructionModeManager) {
            if (!window.instructionModeManager.active) {
                window.instructionModeManager.activate();
            }
            window.instructionModeManager.startLesson(lesson);
        }
    }

    loadCustomLessons() {
        try {
            var data = localStorage.getItem(this.STORAGE_KEY);
            return data ? JSON.parse(data) : [];
        } catch (e) {
            return [];
        }
    }

    deleteLesson(id) {
        var lessons = this.loadCustomLessons().filter(function(l) { return l.id !== id; });
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(lessons));
        this._renderSavedLessons();
        if (window.instructionModeManager) {
            window.instructionModeManager._populateLessonSelect();
        }
    }

    _renderSavedLessons() {
        var container = document.getElementById('builderSavedList');
        if (!container) return;

        var lessons = this.loadCustomLessons();
        if (lessons.length === 0) {
            container.innerHTML = '<p class="builder-saved-empty">No custom lessons saved yet.</p>';
            return;
        }

        container.innerHTML = '';
        var self = this;
        lessons.forEach(function(lesson) {
            var row = document.createElement('div');
            row.className = 'builder-saved-row';

            var info = document.createElement('span');
            info.className = 'builder-saved-info';
            info.textContent = lesson.title + ' (' + (lesson.language === 'fr' ? '🇫🇷' : '🇬🇧') + ')';

            var btns = document.createElement('span');
            btns.className = 'builder-saved-btns';

            var playBtn = document.createElement('button');
            playBtn.className = 'builder-saved-play';
            playBtn.textContent = '▶';
            playBtn.title = 'Test this lesson';
            playBtn.addEventListener('click', function() {
                self.close();
                if (window.instructionModeManager) {
                    if (!window.instructionModeManager.active) {
                        window.instructionModeManager.activate();
                    }
                    window.instructionModeManager.startLesson(lesson);
                }
            });

            var delBtn = document.createElement('button');
            delBtn.className = 'builder-saved-delete';
            delBtn.textContent = '🗑️';
            delBtn.title = 'Delete this lesson';
            delBtn.addEventListener('click', function() { self.deleteLesson(lesson.id); });

            btns.appendChild(playBtn);
            btns.appendChild(delBtn);
            row.appendChild(info);
            row.appendChild(btns);
            container.appendChild(row);
        });
    }

    _escapeHtml(text) {
        var div = document.createElement('div');
        div.appendChild(document.createTextNode(text));
        return div.innerHTML;
    }
}
