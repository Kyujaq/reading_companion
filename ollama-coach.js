// Phase 4 — Ollama LLM Coach

const OLLAMA_BASE = 'http://192.168.2.205:11434';
const OLLAMA_TIMEOUT_MS = 3000;
const PREFERRED_MODELS = ['llama3', 'mistral', 'phi3'];

class OllamaCoach {
    constructor() {
        this.available = false;
        this.model = null;
        this.childName = '';
    }

    async checkAvailability() {
        try {
            const controller = new AbortController();
            const timer = setTimeout(() => controller.abort(), OLLAMA_TIMEOUT_MS);
            const resp = await fetch(`${OLLAMA_BASE}/api/tags`, { signal: controller.signal });
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
            const resp = await fetch(`${OLLAMA_BASE}/api/generate`, {
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
    constructor(ollamaCoach, voskIntegration, feedbackEngine) {
        this.ollamaCoach = ollamaCoach;
        this.voskIntegration = voskIntegration;
        this.feedbackEngine = feedbackEngine;
    }

    init() {
        const gearBtn = document.getElementById('settingsBtn');
        if (gearBtn) gearBtn.addEventListener('click', () => this.togglePanel());

        const closeBtn = document.getElementById('settingsCloseBtn');
        if (closeBtn) closeBtn.addEventListener('click', () => this.closePanel());

        const ollamaToggle = document.getElementById('ollamaToggle');
        if (ollamaToggle) {
            ollamaToggle.addEventListener('change', () => {
                this.feedbackEngine.useOllama = ollamaToggle.checked;
                if (ollamaToggle.checked && this.ollamaCoach.available) {
                    this.feedbackEngine.ollamaCoach = this.ollamaCoach;
                } else {
                    this.feedbackEngine.ollamaCoach = null;
                }
            });
        }

        const nameInput = document.getElementById('childNameInput');
        if (nameInput) {
            nameInput.addEventListener('input', () => {
                this.ollamaCoach.childName = nameInput.value.trim();
            });
            // Restore saved name
            const saved = localStorage.getItem('childName');
            if (saved) {
                nameInput.value = saved;
                this.ollamaCoach.childName = saved;
            }
            nameInput.addEventListener('change', () => {
                localStorage.setItem('childName', nameInput.value.trim());
            });
        }
    }

    updateServiceStatus() {
        const ollamaStatus = document.getElementById('ollamaStatus');
        const voskStatus = document.getElementById('voskStatus');

        if (ollamaStatus) {
            ollamaStatus.textContent = this.ollamaCoach.available
                ? `✅ Connected (${this.ollamaCoach.model})`
                : '❌ Not reachable';
            ollamaStatus.className = 'service-status ' + (this.ollamaCoach.available ? 'ok' : 'err');
        }
        if (voskStatus) {
            voskStatus.textContent = this.voskIntegration.available ? '✅ Available' : '❌ Not reachable';
            voskStatus.className = 'service-status ' + (this.voskIntegration.available ? 'ok' : 'err');
        }

        // Show/hide AI tutor indicator
        const aiIndicator = document.getElementById('ollamaIndicator');
        if (aiIndicator) {
            aiIndicator.style.display = this.ollamaCoach.available ? '' : 'none';
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
