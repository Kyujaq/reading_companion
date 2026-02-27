// Phase 4b — Letta Persistent Agent Integration

const LETTA_DEFAULT_URL = 'http://localhost:8283';
const LETTA_TIMEOUT_MS = 3000;

class LettaAgent {
    constructor() {
        this.available = false;
        this.agentId = null;
        this.childName = '';
        this.baseUrl = localStorage.getItem('lettaUrl') || LETTA_DEFAULT_URL;
    }

    get _base() { return this.baseUrl.replace(/\/$/, ''); }

    async checkAvailability() {
        try {
            const controller = new AbortController();
            const timer = setTimeout(() => controller.abort(), LETTA_TIMEOUT_MS);
            const resp = await fetch(`${this._base}/v1/agents`, {
                signal: controller.signal
            });
            clearTimeout(timer);
            this.available = resp.ok;
            return this.available;
        } catch (e) {
            this.available = false;
            return false;
        }
    }

    async ensureAgent() {
        if (!this.available) return null;
        var name = this.childName || 'default';
        var storageKey = 'lettaAgentId_' + name;
        var savedId = localStorage.getItem(storageKey);

        // Check if saved agent still exists
        if (savedId) {
            try {
                var existing = await this._getAgent(savedId);
                if (existing) {
                    this.agentId = savedId;
                    return this.agentId;
                }
            } catch (e) {
                // Agent no longer exists, create a new one
            }
        }

        // Search existing agents by name
        try {
            var agentName = 'reading-companion-' + name;
            var agents = await this._listAgents();
            if (agents) {
                var found = agents.find(function(a) { return a.name === agentName; });
                if (found) {
                    this.agentId = found.id;
                    localStorage.setItem(storageKey, this.agentId);
                    return this.agentId;
                }
            }
        } catch (e) {
            // Fall through to create
        }

        // Create new agent
        return await this._createAgent(name);
    }

    async _getAgent(agentId) {
        var controller = new AbortController();
        var timer = setTimeout(function() { controller.abort(); }, LETTA_TIMEOUT_MS);
        try {
            var resp = await fetch(this._base + '/v1/agents/' + agentId, {
                signal: controller.signal
            });
            if (!resp.ok) return null;
            return await resp.json();
        } finally {
            clearTimeout(timer);
        }
    }

    async _listAgents() {
        var controller = new AbortController();
        var timer = setTimeout(function() { controller.abort(); }, LETTA_TIMEOUT_MS);
        try {
            var resp = await fetch(this._base + '/v1/agents', {
                signal: controller.signal
            });
            if (!resp.ok) return null;
            return await resp.json();
        } finally {
            clearTimeout(timer);
        }
    }

    async _createAgent(childName) {
        var agentName = 'reading-companion-' + childName;
        var progressContext = this._gatherProgressContext();
        var systemPrompt = 'You are a warm, encouraging reading tutor for a young child (ages 4-8)' +
            (childName !== 'default' ? ' named ' + childName : '') + '. ' +
            'You remember the child\'s progress across sessions and adapt your teaching style. ' +
            'Keep responses under 2 sentences. Be enthusiastic, positive, and use simple words. ' +
            'The child is learning to read letters, syllables, and words.' +
            (progressContext ? ' ' + progressContext : '');

        try {
            var controller = new AbortController();
            var timer = setTimeout(function() { controller.abort(); }, LETTA_TIMEOUT_MS);
            var resp = await fetch(this._base + '/v1/agents', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                signal: controller.signal,
                body: JSON.stringify({
                    name: agentName,
                    system: systemPrompt,
                    llm_config: { model: 'letta-free', model_endpoint_type: 'openai', context_window: 8192 },
                    embedding_config: { embedding_endpoint_type: 'openai', embedding_model: 'letta-free' }
                })
            });
            clearTimeout(timer);
            if (!resp.ok) return null;
            var data = await resp.json();
            this.agentId = data.id;
            var storageKey = 'lettaAgentId_' + childName;
            localStorage.setItem(storageKey, this.agentId);
            return this.agentId;
        } catch (e) {
            return null;
        }
    }

    _gatherProgressContext() {
        var parts = [];
        if (window.progressTracker) {
            var stars = window.progressTracker.getStars();
            var streak = window.progressTracker.getStreak();
            if (stars > 0) parts.push('The child has earned ' + stars + ' stars so far.');
            if (streak > 0) parts.push('They have a ' + streak + '-day streak.');
        }
        if (window.spacedRepetition) {
            var struggling = window.spacedRepetition.getStrugglingLetters(5);
            if (struggling.length > 0) {
                var letters = struggling.map(function(s) { return s.letter.toUpperCase(); });
                parts.push('They struggle with the letters: ' + letters.join(', ') + '.');
            }
        }
        return parts.join(' ');
    }

    async sendMessage(text) {
        if (!this.available || !this.agentId) return null;
        try {
            var controller = new AbortController();
            var timer = setTimeout(function() { controller.abort(); }, LETTA_TIMEOUT_MS);
            var resp = await fetch(this._base + '/v1/agents/' + this.agentId + '/messages', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                signal: controller.signal,
                body: JSON.stringify({
                    messages: [{ role: 'user', text: text }]
                })
            });
            clearTimeout(timer);
            if (!resp.ok) return null;
            var data = await resp.json();
            if (data.messages && data.messages.length > 0) {
                // Find the last assistant message
                for (var i = data.messages.length - 1; i >= 0; i--) {
                    if (data.messages[i].role === 'assistant' && data.messages[i].text) {
                        return data.messages[i].text.trim();
                    }
                }
            }
            return null;
        } catch (e) {
            return null;
        }
    }

    async getEncouragement(context) {
        var progressContext = this._gatherProgressContext();
        var lang = context.language === 'fr' ? 'French' : 'English';
        var name = context.childName || this.childName || '';
        var prompt;

        if (context.correct) {
            prompt = 'Respond in ' + lang + '. The child' +
                (name ? ' named ' + name : '') +
                ' just correctly pressed the letter for "' + context.step +
                '" while learning "' + context.word + '"' +
                (context.attempts > 1 ? ' (took ' + context.attempts + ' tries)' : '') +
                '. ' + progressContext +
                ' Give a short encouraging response.';
        } else {
            prompt = 'Respond in ' + lang + '. The child' +
                (name ? ' named ' + name : '') +
                ' pressed the wrong letter while learning "' + context.word +
                '" (step: "' + context.step + '", attempt ' + context.attempts + '). ' +
                progressContext +
                ' Give a gentle, encouraging hint to try again.';
        }

        await this.ensureAgent();
        return await this.sendMessage(prompt);
    }

    async getSessionSummary(report, language) {
        var progressContext = this._gatherProgressContext();
        var lang = language === 'fr' ? 'French' : 'English';
        var correct = report.correctAttempts;
        var total = report.totalAttempts;

        var prompt = 'Respond in ' + lang + '. The child finished a reading lesson. ' +
            'They pressed ' + total + ' key(s) total and got ' + correct + ' correct. ' +
            progressContext +
            ' Write a short encouraging completion summary (under 3 sentences).';

        await this.ensureAgent();
        return await this.sendMessage(prompt);
    }
}
