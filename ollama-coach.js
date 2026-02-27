// Phase 4 — Ollama LLM Coach

const OLLAMA_DEFAULT_URL = 'http://192.168.2.205:11434';
const OLLAMA_TIMEOUT_MS = 3000;
const PREFERRED_MODELS = ['llama3', 'mistral', 'phi3'];

class OllamaCoach {
    constructor() {
        this.available = false;
        this.model = null;
        this.childName = '';
        this.baseUrl = localStorage.getItem('ollamaUrl') || OLLAMA_DEFAULT_URL;
    }

    get _base() { return this.baseUrl.replace(/\/$/, ''); }

    async checkAvailability() {
        try {
            const controller = new AbortController();
            const timer = setTimeout(() => controller.abort(), OLLAMA_TIMEOUT_MS);
            const resp = await fetch(`${this._base}/api/tags`, { signal: controller.signal });
            clearTimeout(timer);
            if (!resp.ok) return false;
            const data = await resp.json();
            this.model = this._pickModel(data.models || []);
            this.available = !!this.model;
            return this.available;
        } catch (e) {
            this.available = false;
            return false;
        }
    }

    _pickModel(models) {
        // Try preferred models first
        for (const preferred of PREFERRED_MODELS) {
            const found = models.find(m => m.name && m.name.toLowerCase().startsWith(preferred));
            if (found) return found.name;
        }
        // Fall back to first available
        return models.length > 0 ? models[0].name : null;
    }

    async _generate(prompt, systemPrompt, language) {
        if (!this.available || !this.model) return null;
        try {
            const controller = new AbortController();
            const timer = setTimeout(() => controller.abort(), OLLAMA_TIMEOUT_MS);
            const resp = await fetch(`${this._base}/api/generate`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                signal: controller.signal,
                body: JSON.stringify({
                    model: this.model,
                    prompt,
                    system: systemPrompt,
                    stream: false,
                    options: { temperature: 0.7, num_predict: 80 }
                })
            });
            clearTimeout(timer);
            if (!resp.ok) return null;
            const data = await resp.json();
            return (data.response || '').trim();
        } catch (e) {
            return null;
        }
    }

    async getEncouragement(context) {
        // context = { childName, word, step, attempts, correct, language }
        const lang = context.language === 'fr' ? 'French' : 'English';
        const name = context.childName || this.childName || '';
        const system = `You are a warm, encouraging reading tutor for young children (ages 4-8). Always respond in ${lang}. Keep responses under 2 sentences. Be enthusiastic and positive. Use simple words.`;
        const prompt = context.correct
            ? `The child${name ? ` named ${name}` : ''} just correctly pressed the letter for "${context.step}" while learning "${context.word}"${context.attempts > 1 ? ` (took ${context.attempts} tries)` : ''}. Give a short encouraging response.`
            : `The child${name ? ` named ${name}` : ''} pressed the wrong letter while learning "${context.word}" (step: "${context.step}", attempt ${context.attempts}). Give a gentle, encouraging hint to try again.`;
        return await this._generate(prompt, system, context.language);
    }

    async getSyllableExplanation(word, syllables, language) {
        const lang = language === 'fr' ? 'French' : 'English';
        const system = `You are a warm reading tutor for young children. Always respond in ${lang}. Keep responses under 2 sentences. Use simple words.`;
        const prompt = `Explain in a child-friendly way how the word "${word}" is broken into syllables: ${syllables.join(' - ')}. Be brief and fun.`;
        return await this._generate(prompt, system, language);
    }

    async getSessionSummary(report, language) {
        const lang = language === 'fr' ? 'French' : 'English';
        const system = `You are a warm reading tutor for children. Always respond in ${lang}. Keep it under 3 sentences. Be encouraging.`;
        const correct = report.correctAttempts;
        const total = report.totalAttempts;
        const prompt = `The child finished a reading lesson. They pressed ${total} key(s) total and got ${correct} correct. Write a short encouraging completion summary.`;
        return await this._generate(prompt, system, language);
    }
}

// ── Settings Panel Manager ────────────────────────────────────────────────────

class SettingsManager {
    constructor(ollamaCoach, voskIntegration, feedbackEngine, lettaAgent) {
        this.ollamaCoach = ollamaCoach;
        this.voskIntegration = voskIntegration;
        this.feedbackEngine = feedbackEngine;
        this.lettaAgent = lettaAgent || null;
    }

    init() {
        const gearBtn = document.getElementById('settingsBtn');
        if (gearBtn) gearBtn.addEventListener('click', () => this.showPinPrompt());

        const closeBtn = document.getElementById('settingsCloseBtn');
        if (closeBtn) closeBtn.addEventListener('click', () => this.closePanel());

        // PIN overlay
        const pinCloseBtn = document.getElementById('settingsPinCloseBtn');
        if (pinCloseBtn) pinCloseBtn.addEventListener('click', () => this.closePinPrompt());
        const pinSubmitBtn = document.getElementById('settingsPinSubmitBtn');
        if (pinSubmitBtn) pinSubmitBtn.addEventListener('click', () => this.verifyPin());
        const pinInput = document.getElementById('settingsPinInput');
        if (pinInput) pinInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') this.verifyPin();
        });

        // AI backend radio buttons (None / Ollama / Letta)
        const radios = document.querySelectorAll('input[name="aiBackend"]');
        radios.forEach(radio => {
            radio.addEventListener('change', () => this._onAiBackendChange(radio.value));
        });

        // Restore saved AI backend selection
        const savedBackend = localStorage.getItem('aiBackend') || 'none';
        const savedRadio = document.querySelector('input[name="aiBackend"][value="' + savedBackend + '"]');
        if (savedRadio) {
            savedRadio.checked = true;
            this._onAiBackendChange(savedBackend);
        }

        const urlInput = document.getElementById('ollamaUrlInput');
        if (urlInput) {
            urlInput.value = this.ollamaCoach.baseUrl;
            urlInput.addEventListener('change', () => {
                const url = urlInput.value.trim();
                if (url) {
                    this.ollamaCoach.baseUrl = url;
                    localStorage.setItem('ollamaUrl', url);
                }
            });
        }

        const lettaUrlInput = document.getElementById('lettaUrlInput');
        if (lettaUrlInput && this.lettaAgent) {
            lettaUrlInput.value = this.lettaAgent.baseUrl;
            lettaUrlInput.addEventListener('change', () => {
                const url = lettaUrlInput.value.trim();
                if (url) {
                    this.lettaAgent.baseUrl = url;
                    localStorage.setItem('lettaUrl', url);
                }
            });
        }

        const nameInput = document.getElementById('childNameInput');
        if (nameInput) {
            nameInput.addEventListener('input', () => {
                this.ollamaCoach.childName = nameInput.value.trim();
                if (this.lettaAgent) this.lettaAgent.childName = nameInput.value.trim();
            });
            // Restore saved name
            const saved = localStorage.getItem('childName');
            if (saved) {
                nameInput.value = saved;
                this.ollamaCoach.childName = saved;
                if (this.lettaAgent) this.lettaAgent.childName = saved;
            }
            nameInput.addEventListener('change', () => {
                localStorage.setItem('childName', nameInput.value.trim());
            });
        }
    }

    _onAiBackendChange(value) {
        localStorage.setItem('aiBackend', value);
        if (value === 'ollama') {
            this.feedbackEngine.useOllama = true;
            this.feedbackEngine.ollamaCoach = this.ollamaCoach.available ? this.ollamaCoach : null;
        } else if (value === 'letta' && this.lettaAgent) {
            // LettaAgent exposes the same getEncouragement/getSessionSummary API;
            // reuse useOllama/ollamaCoach fields to avoid changing FeedbackEngine
            this.feedbackEngine.useOllama = true;
            this.feedbackEngine.ollamaCoach = this.lettaAgent.available ? this.lettaAgent : null;
        } else {
            this.feedbackEngine.useOllama = false;
            this.feedbackEngine.ollamaCoach = null;
        }
    }

    updateServiceStatus() {
        const ollamaStatus = document.getElementById('ollamaStatus');
        const voskStatus = document.getElementById('voskStatus');
        const lettaStatus = document.getElementById('lettaStatus');

        if (ollamaStatus) {
            ollamaStatus.textContent = this.ollamaCoach.available
                ? `✅ Connected (${this.ollamaCoach.model})`
                : '❌ Not reachable';
            ollamaStatus.className = 'service-status ' + (this.ollamaCoach.available ? 'ok' : 'err');
        }
        if (lettaStatus && this.lettaAgent) {
            lettaStatus.textContent = this.lettaAgent.available
                ? '✅ Available'
                : '❌ Not reachable';
            lettaStatus.className = 'service-status ' + (this.lettaAgent.available ? 'ok' : 'err');
        }
        if (voskStatus) {
            voskStatus.textContent = this.voskIntegration.available ? '✅ Available' : '❌ Not reachable';
            voskStatus.className = 'service-status ' + (this.voskIntegration.available ? 'ok' : 'err');
        }

        // Show/hide AI tutor indicator
        const aiIndicator = document.getElementById('ollamaIndicator');
        if (aiIndicator) {
            var aiAvailable = this.ollamaCoach.available || (this.lettaAgent && this.lettaAgent.available);
            aiIndicator.style.display = aiAvailable ? '' : 'none';
        }
    }

    showPinPrompt() {
        const panel = document.getElementById('settingsPanel');
        if (panel && panel.classList.contains('visible')) {
            this.closePanel();
            return;
        }
        const overlay = document.getElementById('settingsPinOverlay');
        const pinInput = document.getElementById('settingsPinInput');
        const pinError = document.getElementById('settingsPinError');
        if (overlay) overlay.classList.add('visible');
        if (pinInput) { pinInput.value = ''; pinInput.focus(); }
        if (pinError) pinError.textContent = '';
    }

    closePinPrompt() {
        const overlay = document.getElementById('settingsPinOverlay');
        if (overlay) overlay.classList.remove('visible');
    }

    verifyPin() {
        const pinInput = document.getElementById('settingsPinInput');
        const pinError = document.getElementById('settingsPinError');
        if (!pinInput) return;
        if (pinInput.value === 'admin123') {
            this.closePinPrompt();
            this.openPanel();
        } else {
            if (pinError) pinError.textContent = '❌ Incorrect PIN';
            pinInput.value = '';
            pinInput.focus();
        }
    }

    openPanel() {
        const panel = document.getElementById('settingsPanel');
        if (panel) {
            panel.classList.add('visible');
            this.updateServiceStatus();
        }
    }

    togglePanel() {
        const panel = document.getElementById('settingsPanel');
        if (!panel) return;
        const isOpen = panel.classList.contains('visible');
        if (isOpen) {
            this.closePanel();
        } else {
            panel.classList.add('visible');
            this.updateServiceStatus();
        }
    }

    closePanel() {
        const panel = document.getElementById('settingsPanel');
        if (panel) panel.classList.remove('visible');
    }
}
