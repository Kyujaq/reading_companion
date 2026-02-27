// Phase 1 — Scripted Instruction Mode

// ── Lesson Scripts ────────────────────────────────────────────────────────────

const LESSONS = {
    fr: [
        {
            id: 'lesson-velo-fr',
            language: 'fr',
            title: 'Apprenons VÉLO',
            steps: [
                { id: 'intro', type: 'narrate', tts: 'Bonjour ! Aujourd\'hui, nous allons apprendre le mot VÉLO. Il a deux syllabes : VÉ et LO.', next: 'step-ve-v' },
                { id: 'step-ve-v', type: 'prompt', tts: 'Commençons par la première syllabe. Appuie sur la lettre V !', expected: 'v', successTts: 'Bravo ! Tu as trouvé le V !', failTts: 'Essaie encore ! Cherche la lettre V sur le clavier.', next: 'step-ve-e' },
                { id: 'step-ve-e', type: 'prompt', tts: 'Maintenant, appuie sur É !', expected: 'é', successTts: 'Super ! VÉ ! C\'est la première syllabe !', failTts: 'Pas tout à fait... cherche le É avec l\'accent.', next: 'step-lo-l' },
                { id: 'step-lo-l', type: 'prompt', tts: 'Deuxième syllabe : LO. Appuie sur L !', expected: 'l', successTts: 'Excellent !', failTts: 'Cherche le L !', next: 'step-lo-o' },
                { id: 'step-lo-o', type: 'prompt', tts: 'Et maintenant le O !', expected: 'o', successTts: 'Fantastique ! Tu as écrit VÉLO ! Bravo !', failTts: 'Presque ! Le O est juste là.', next: 'complete' },
                { id: 'complete', type: 'complete', tts: 'Félicitations ! Tu sais maintenant écrire VÉLO !' }
            ]
        },
        {
            id: 'lesson-chat-fr',
            language: 'fr',
            title: 'Apprenons CHAT',
            steps: [
                { id: 'intro', type: 'narrate', tts: 'Aujourd\'hui on apprend le mot CHAT. Un chat fait miaou !', next: 'step-c' },
                { id: 'step-c', type: 'prompt', tts: 'Appuie sur la lettre C !', expected: 'c', successTts: 'Bien ! Le C !', failTts: 'Cherche le C !', next: 'step-h' },
                { id: 'step-h', type: 'prompt', tts: 'Maintenant le H ! Ensemble, C et H font le son CH.', expected: 'h', successTts: 'CH ! Comme dans CHAT !', failTts: 'Trouve le H !', next: 'step-a' },
                { id: 'step-a', type: 'prompt', tts: 'Appuie sur le A !', expected: 'a', successTts: 'Bravo ! CHA !', failTts: 'Le A est là !', next: 'step-t' },
                { id: 'step-t', type: 'prompt', tts: 'Et pour finir, le T !', expected: 't', successTts: 'CHAT ! Tu as réussi !', failTts: 'Cherche le T !', next: 'complete' },
                { id: 'complete', type: 'complete', tts: 'Bravo ! Tu sais écrire CHAT ! Miaou !' }
            ]
        },
        {
            id: 'lesson-abc-fr',
            language: 'fr',
            title: 'L\'alphabet : A B C',
            steps: [
                { id: 'intro', type: 'narrate', tts: 'Apprenons les premières lettres de l\'alphabet ! A, B, C !', next: 'step-a' },
                { id: 'step-a', type: 'prompt', tts: 'La première lettre est A. Appuie sur le A !', expected: 'a', successTts: 'A ! Comme dans ARBRE !', failTts: 'Cherche le A !', next: 'step-b' },
                { id: 'step-b', type: 'prompt', tts: 'La deuxième lettre est B. Appuie sur le B !', expected: 'b', successTts: 'B ! Comme dans BALLE !', failTts: 'Cherche le B !', next: 'step-c' },
                { id: 'step-c', type: 'prompt', tts: 'La troisième lettre est C. Appuie sur le C !', expected: 'c', successTts: 'C ! Comme dans CHAT !', failTts: 'Cherche le C !', next: 'complete' },
                { id: 'complete', type: 'complete', tts: 'Bravo ! Tu connais A, B et C ! Continue comme ça !' }
            ]
        }
    ],
    en: [
        {
            id: 'lesson-cat-en',
            language: 'en',
            title: 'Learn CAT',
            steps: [
                { id: 'intro', type: 'narrate', tts: 'Today we are going to learn the word CAT! A cat says meow!', next: 'step-c' },
                { id: 'step-c', type: 'prompt', tts: 'Let\'s start! Press the letter C!', expected: 'c', successTts: 'Great job! That\'s the letter C!', failTts: 'Try again! Find the letter C on the keyboard.', next: 'step-a' },
                { id: 'step-a', type: 'prompt', tts: 'Now press the letter A!', expected: 'a', successTts: 'CA! Wonderful!', failTts: 'Look for the letter A!', next: 'step-t' },
                { id: 'step-t', type: 'prompt', tts: 'Almost done! Press the letter T!', expected: 't', successTts: 'CAT! You spelled CAT! Amazing!', failTts: 'Find the T!', next: 'complete' },
                { id: 'complete', type: 'complete', tts: 'Congratulations! You can spell CAT! Meow!' }
            ]
        },
        {
            id: 'lesson-dog-en',
            language: 'en',
            title: 'Learn DOG',
            steps: [
                { id: 'intro', type: 'narrate', tts: 'Let\'s learn the word DOG! A dog says woof!', next: 'step-d' },
                { id: 'step-d', type: 'prompt', tts: 'Press the letter D!', expected: 'd', successTts: 'D! Great!', failTts: 'Find the D!', next: 'step-o' },
                { id: 'step-o', type: 'prompt', tts: 'Now press O!', expected: 'o', successTts: 'DO! Excellent!', failTts: 'Look for the O!', next: 'step-g' },
                { id: 'step-g', type: 'prompt', tts: 'Last letter! Press G!', expected: 'g', successTts: 'DOG! You did it! Woof woof!', failTts: 'Find the G!', next: 'complete' },
                { id: 'complete', type: 'complete', tts: 'Fantastic! You spelled DOG! Woof!' }
            ]
        },
        {
            id: 'lesson-abc-en',
            language: 'en',
            title: 'The alphabet: A B C',
            steps: [
                { id: 'intro', type: 'narrate', tts: 'Let\'s learn the first letters of the alphabet! A, B, C!', next: 'step-a' },
                { id: 'step-a', type: 'prompt', tts: 'The first letter is A. Press A!', expected: 'a', successTts: 'A! Like in APPLE!', failTts: 'Find the A!', next: 'step-b' },
                { id: 'step-b', type: 'prompt', tts: 'The second letter is B. Press B!', expected: 'b', successTts: 'B! Like in BALL!', failTts: 'Find the B!', next: 'step-c' },
                { id: 'step-c', type: 'prompt', tts: 'The third letter is C. Press C!', expected: 'c', successTts: 'C! Like in CAT!', failTts: 'Find the C!', next: 'complete' },
                { id: 'complete', type: 'complete', tts: 'Amazing! You know A, B and C! Keep going!' }
            ]
        }
    ]
};

// ── SessionLogger ─────────────────────────────────────────────────────────────

class SessionLogger {
    constructor() {
        this.entries = [];
        this.startTime = Date.now();
    }

    log(step, input, correct, attemptNumber) {
        const entry = { step, input, correct, timestamp: Date.now(), attemptNumber };
        this.entries.push(entry);
        console.log('[SessionLogger]', entry);
    }

    getReport() {
        return {
            duration: Date.now() - this.startTime,
            totalAttempts: this.entries.length,
            correctAttempts: this.entries.filter(e => e.correct).length,
            entries: this.entries
        };
    }
}

// ── FeedbackEngine ────────────────────────────────────────────────────────────

class FeedbackEngine {
    constructor(voiceLang = 'fr-FR') {
        this.voiceLang = voiceLang;
        this.synth = window.speechSynthesis;
        this.queue = [];
        this.speaking = false;
        this.ollamaCoach = null;
        this.useOllama = false;
    }

    setVoiceLang(lang) {
        this.voiceLang = lang;
    }

    speak(text, onEnd) {
        this.queue.push({ text, onEnd });
        if (!this.speaking) this._processQueue();
    }

    _processQueue() {
        if (this.queue.length === 0) {
            this.speaking = false;
            return;
        }
        this.speaking = true;
        const { text, onEnd } = this.queue.shift();

        this.synth.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = this.voiceLang;
        utterance.rate = 0.85;
        utterance.pitch = 1.1;

        // Try to pick a voice that matches the language
        const voices = this.synth.getVoices().filter(v => v.lang.startsWith(this.voiceLang.split('-')[0]));
        if (voices.length > 0) utterance.voice = voices[0];

        utterance.onend = () => {
            if (onEnd) onEnd();
            this._processQueue();
        };
        utterance.onerror = () => {
            if (onEnd) onEnd();
            this._processQueue();
        };

        this.synth.speak(utterance);
    }

    cancel() {
        this.queue = [];
        this.speaking = false;
        this.synth.cancel();
    }

    async speakWithOllama(cannedText, context, onEnd) {
        if (this.useOllama && this.ollamaCoach) {
            try {
                const dynamic = await this.ollamaCoach.getEncouragement(context);
                if (dynamic) {
                    this.speak(dynamic, onEnd);
                    return;
                }
            } catch (e) {
                // fall through to canned text
            }
        }
        this.speak(cannedText, onEnd);
    }
}

// ── InstructionSession ────────────────────────────────────────────────────────

class InstructionSession {
    constructor(lesson, feedbackEngine, logger, onComplete) {
        this.lesson = lesson;
        this.feedback = feedbackEngine;
        this.logger = logger;
        this.onComplete = onComplete;

        this.stepMap = {};
        lesson.steps.forEach(s => { this.stepMap[s.id] = s; });

        this.currentStepId = lesson.steps[0].id;
        this.attemptCount = 0;

        // Build ordered step ids for progress tracking
        this.stepIds = lesson.steps.map(s => s.id);
    }

    get currentStep() { return this.stepMap[this.currentStepId]; }

    get progressFraction() {
        const idx = this.stepIds.indexOf(this.currentStepId);
        return idx / Math.max(this.stepIds.length - 1, 1);
    }

    start() {
        this._runStep();
    }

    _runStep() {
        const step = this.currentStep;
        if (!step) return;

        updateInstructionProgress(this.stepIds.indexOf(this.currentStepId), this.stepIds.length);
        highlightExpectedKey(step.expected || null);

        if (step.type === 'narrate') {
            this.feedback.speak(step.tts, () => {
                if (step.next) this._goTo(step.next);
            });
        } else if (step.type === 'prompt') {
            this.attemptCount = 0;
            this.feedback.speak(step.tts);
        } else if (step.type === 'complete') {
            highlightExpectedKey(null);
            this.feedback.speak(step.tts, () => {
                const report = this.logger.getReport();
                if (this.onComplete) this.onComplete(report);
            });
        }
    }

    _goTo(stepId) {
        if (stepId === 'complete') {
            this.currentStepId = this.lesson.steps[this.lesson.steps.length - 1].id;
        } else {
            this.currentStepId = stepId;
        }
        this._runStep();
    }

    handleInput(input) {
        const step = this.currentStep;
        if (!step || step.type !== 'prompt') return;

        const expected = (step.expected || '').toLowerCase();
        const received = input.toLowerCase();
        const correct = received === expected;

        this.attemptCount++;
        this.logger.log(step.id, received, correct, this.attemptCount);

        const context = {
            word: this.lesson.title,
            step: step.id,
            attempts: this.attemptCount,
            correct,
            language: this.lesson.language
        };

        if (correct) {
            this.feedback.speakWithOllama(step.successTts, { ...context, correct: true }, () => {
                if (step.next) this._goTo(step.next);
            });
        } else {
            this.feedback.speakWithOllama(step.failTts, { ...context, correct: false }, null);
        }
    }
}

// ── Lesson from word letters (for "Spell it!" buttons) ───────────────────────

function makeLessonFromWord(word, language) {
    const lang = language || 'en';
    const letters = word.toLowerCase().split('');
    const steps = [];
    const isFr = lang === 'fr';

    steps.push({
        id: 'intro',
        type: 'narrate',
        tts: isFr
            ? `Épelle le mot ${word.toUpperCase()} ! Il a ${letters.length} lettre${letters.length > 1 ? 's' : ''}.`
            : `Let's spell the word ${word.toUpperCase()}! It has ${letters.length} letter${letters.length > 1 ? 's' : ''}.`,
        next: `step-0`
    });

    letters.forEach((letter, i) => {
        const isLast = i === letters.length - 1;
        const nextId = isLast ? 'complete' : `step-${i + 1}`;
        steps.push({
            id: `step-${i}`,
            type: 'prompt',
            tts: isFr
                ? `Appuie sur la lettre ${letter.toUpperCase()} !`
                : `Press the letter ${letter.toUpperCase()}!`,
            expected: letter,
            successTts: isFr ? `Bien ! ${letter.toUpperCase()} !` : `Great! ${letter.toUpperCase()}!`,
            failTts: isFr ? `Essaie encore ! Cherche le ${letter.toUpperCase()}.` : `Try again! Find the ${letter.toUpperCase()}.`,
            next: nextId
        });
    });

    steps.push({
        id: 'complete',
        type: 'complete',
        tts: isFr
            ? `Bravo ! Tu sais écrire ${word.toUpperCase()} !`
            : `Fantastic! You can spell ${word.toUpperCase()}!`
    });

    return {
        id: `auto-${word}-${lang}`,
        language: lang,
        title: isFr ? `Épelle ${word.toUpperCase()}` : `Spell ${word.toUpperCase()}`,
        steps
    };
}

// ── UI helpers ────────────────────────────────────────────────────────────────

function highlightExpectedKey(letter) {
    // Remove existing highlight
    document.querySelectorAll('.key.expected-key').forEach(el => el.classList.remove('expected-key'));
    if (!letter) return;
    document.querySelectorAll('.key').forEach(el => {
        if (el.getAttribute('data-letter') === letter.toLowerCase()) {
            el.classList.add('expected-key');
        }
    });
    // Also check alphabet strip
    document.querySelectorAll('.alphabet-letter').forEach(el => {
        const char = el.querySelector('.letter-char');
        if (char && char.textContent.toLowerCase() === letter.toLowerCase()) {
            el.classList.add('expected-key');
        }
    });
}

function updateInstructionProgress(currentIndex, totalSteps) {
    const bar = document.getElementById('instructionProgressBar');
    const label = document.getElementById('instructionProgressLabel');
    if (!bar) return;
    const pct = totalSteps > 1 ? Math.round((currentIndex / (totalSteps - 1)) * 100) : 0;
    bar.style.width = `${pct}%`;
    if (label) label.textContent = `${currentIndex + 1} / ${totalSteps}`;
}

// ── InstructionModeManager — wires into the main app ─────────────────────────

class InstructionModeManager {
    constructor(app) {
        this.app = app;
        this.active = false;
        this.session = null;
        this.feedback = new FeedbackEngine();
        this.logger = null;
    }

    init() {
        // Toggle button
        const btn = document.getElementById('instructionModeBtn');
        if (btn) btn.addEventListener('click', () => this.toggleMode());

        // Lesson selector
        const startBtn = document.getElementById('instructionStartBtn');
        if (startBtn) startBtn.addEventListener('click', () => this.startSelectedLesson());

        // Close button
        const closeBtn = document.getElementById('instructionCloseBtn');
        if (closeBtn) closeBtn.addEventListener('click', () => this.deactivate());

        // Populate lesson selectors for both languages
        this._populateLessonSelect();
    }

    _populateLessonSelect() {
        const select = document.getElementById('lessonSelect');
        if (!select) return;
        this._fillSelect(select);
    }

    _fillSelect(select) {
        const lang = this.app.currentLanguage;
        const lessonList = LESSONS[lang] || [];
        select.innerHTML = '';
        lessonList.forEach(lesson => {
            const opt = document.createElement('option');
            opt.value = lesson.id;
            opt.textContent = lesson.title;
            select.appendChild(opt);
        });
    }

    toggleMode() {
        if (this.active) {
            this.deactivate();
        } else {
            this.activate();
        }
    }

    activate() {
        this.active = true;
        const btn = document.getElementById('instructionModeBtn');
        if (btn) btn.classList.add('active');

        const overlay = document.getElementById('instructionOverlay');
        if (overlay) {
            overlay.classList.add('visible');
            // Refresh lesson list for current language
            this._fillSelect(document.getElementById('lessonSelect'));
        }

        // Update voice language
        this.feedback.setVoiceLang(this.app.languageData[this.app.currentLanguage].voiceLang);
    }

    deactivate() {
        this.active = false;
        if (this.session) {
            this.feedback.cancel();
            this.session = null;
        }
        highlightExpectedKey(null);

        const btn = document.getElementById('instructionModeBtn');
        if (btn) btn.classList.remove('active');

        const overlay = document.getElementById('instructionOverlay');
        if (overlay) overlay.classList.remove('visible');

        const sessionPanel = document.getElementById('instructionSessionPanel');
        if (sessionPanel) sessionPanel.style.display = 'none';

        const selectorPanel = document.getElementById('instructionSelectorPanel');
        if (selectorPanel) selectorPanel.style.display = '';
    }

    startSelectedLesson() {
        const select = document.getElementById('lessonSelect');
        if (!select) return;
        const lessonId = select.value;
        const lang = this.app.currentLanguage;
        const lesson = (LESSONS[lang] || []).find(l => l.id === lessonId);
        if (!lesson) return;
        this.startLesson(lesson);
    }

    startLesson(lesson) {
        this.feedback.setVoiceLang(this.app.languageData[this.app.currentLanguage].voiceLang);
        this.logger = new SessionLogger();

        this.session = new InstructionSession(lesson, this.feedback, this.logger, (report) => {
            this._onLessonComplete(report);
        });

        // Show session panel
        const selectorPanel = document.getElementById('instructionSelectorPanel');
        const sessionPanel = document.getElementById('instructionSessionPanel');
        if (selectorPanel) selectorPanel.style.display = 'none';
        if (sessionPanel) {
            sessionPanel.style.display = '';
            const title = sessionPanel.querySelector('#instructionLessonTitle');
            if (title) title.textContent = lesson.title;
        }

        this.session.start();
    }

    startWordLesson(word) {
        const lesson = makeLessonFromWord(word, this.app.currentLanguage);
        if (!this.active) this.activate();
        this.startLesson(lesson);
    }

    handleLetterInput(letter) {
        if (this.session && this.active) {
            this.session.handleInput(letter);
        }
    }

    _onLessonComplete(report) {
        this.session = null;
        highlightExpectedKey(null);

        const sessionPanel = document.getElementById('instructionSessionPanel');
        const completePanel = document.getElementById('instructionCompletePanel');

        if (sessionPanel) sessionPanel.style.display = 'none';
        if (completePanel) {
            completePanel.style.display = '';
            const summary = completePanel.querySelector('#instructionSummary');
            if (summary) {
                const correctPct = report.totalAttempts > 0
                    ? Math.round((report.correctAttempts / report.totalAttempts) * 100)
                    : 100;
                summary.textContent = this.app.currentLanguage === 'fr'
                    ? `Tu as appuyé sur ${report.totalAttempts} touche(s). ${report.correctAttempts} bonnes réponses (${correctPct}%) !`
                    : `You pressed ${report.totalAttempts} key(s). ${report.correctAttempts} correct (${correctPct}%) !`;
            }

            // Send to Ollama for a dynamic summary if available
            if (this.feedback.useOllama && this.feedback.ollamaCoach) {
                this.feedback.ollamaCoach.getSessionSummary(report, this.app.currentLanguage).then(text => {
                    if (text && summary) summary.textContent = text;
                }).catch(() => {});
            }

            const againBtn = completePanel.querySelector('#instructionAgainBtn');
            const doneBtn = completePanel.querySelector('#instructionDoneBtn');
            if (againBtn) againBtn.onclick = () => {
                completePanel.style.display = 'none';
                const selectorPanel = document.getElementById('instructionSelectorPanel');
                if (selectorPanel) selectorPanel.style.display = '';
            };
            if (doneBtn) doneBtn.onclick = () => this.deactivate();
        }
    }

    onLanguageChange() {
        if (this.active) {
            this._fillSelect(document.getElementById('lessonSelect'));
            this.feedback.setVoiceLang(this.app.languageData[this.app.currentLanguage].voiceLang);
        }
    }
}
