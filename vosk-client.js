// Phase 3 — Vosk Speech Recognition Client

const VOSK_WS_URL = 'ws://localhost:2700';
const VOSK_SAMPLE_RATE = 16000;

class VoskClient {
    constructor() {
        this.ws = null;
        this.audioContext = null;
        this.mediaStream = null;
        this.scriptProcessor = null;
        this.available = false;
        this.onResult = null;   // (text) => void
        this.onPartial = null;  // (text) => void
        this.connected = false;
    }

    async checkAvailability() {
        return new Promise((resolve) => {
            try {
                const testWs = new WebSocket(VOSK_WS_URL);
                const timer = setTimeout(() => {
                    testWs.close();
                    resolve(false);
                }, 2000);
                testWs.onopen = () => {
                    clearTimeout(timer);
                    testWs.close();
                    resolve(true);
                };
                testWs.onerror = () => {
                    clearTimeout(timer);
                    resolve(false);
                };
            } catch (e) {
                resolve(false);
            }
        });
    }

    async connect() {
        if (this.connected) return true;
        return new Promise((resolve) => {
            try {
                this.ws = new WebSocket(VOSK_WS_URL);
                const timer = setTimeout(() => {
                    resolve(false);
                }, 3000);
                this.ws.onopen = () => {
                    clearTimeout(timer);
                    this.connected = true;
                    resolve(true);
                };
                this.ws.onerror = () => {
                    clearTimeout(timer);
                    this.connected = false;
                    resolve(false);
                };
                this.ws.onclose = () => {
                    this.connected = false;
                };
                this.ws.onmessage = (event) => {
                    try {
                        const data = JSON.parse(event.data);
                        if (data.text !== undefined && this.onResult) {
                            this.onResult(data.text);
                        } else if (data.partial !== undefined && this.onPartial) {
                            this.onPartial(data.partial);
                        }
                    } catch (e) {}
                };
            } catch (e) {
                resolve(false);
            }
        });
    }

    setGrammar(words) {
        if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;
        const grammar = { grammar: [...words, '[unk]'] };
        this.ws.send(JSON.stringify(grammar));
    }

    async startMic() {
        if (!this.connected) return false;
        try {
            this.mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)({ sampleRate: VOSK_SAMPLE_RATE });

            const source = this.audioContext.createMediaStreamSource(this.mediaStream);

            // Use ScriptProcessorNode to capture PCM frames
            this.scriptProcessor = this.audioContext.createScriptProcessor(4096, 1, 1);
            this.scriptProcessor.onaudioprocess = (event) => {
                if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;
                const float32 = event.inputBuffer.getChannelData(0);
                const int16 = this._float32ToInt16(float32);
                this.ws.send(int16.buffer);
            };

            source.connect(this.scriptProcessor);
            this.scriptProcessor.connect(this.audioContext.destination);
            return true;
        } catch (e) {
            console.warn('[VoskClient] Mic access failed:', e);
            return false;
        }
    }

    stopMic() {
        if (this.scriptProcessor) {
            this.scriptProcessor.disconnect();
            this.scriptProcessor = null;
        }
        if (this.audioContext) {
            this.audioContext.close().catch(() => {});
            this.audioContext = null;
        }
        if (this.mediaStream) {
            this.mediaStream.getTracks().forEach(t => t.stop());
            this.mediaStream = null;
        }
    }

    disconnect() {
        this.stopMic();
        if (this.ws) {
            this.ws.close();
            this.ws = null;
        }
        this.connected = false;
    }

    _float32ToInt16(float32Array) {
        const int16 = new Int16Array(float32Array.length);
        for (let i = 0; i < float32Array.length; i++) {
            const s = Math.max(-1, Math.min(1, float32Array[i]));
            int16[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
        }
        return int16;
    }
}

// ── VoskIntegration — connects Vosk to Instruction Mode ───────────────────────

class VoskIntegration {
    constructor() {
        this.client = new VoskClient();
        this.available = false;
        this.active = false;
        this.instructionManager = null;
    }

    async init(instructionManager) {
        this.instructionManager = instructionManager;
        this.available = await this.client.checkAvailability();
        this._updateIndicator();
        return this.available;
    }

    _updateIndicator() {
        const indicator = document.getElementById('voskIndicator');
        if (!indicator) return;
        if (this.available) {
            indicator.style.display = '';
            indicator.title = 'Vosk speech recognition: available';
        } else {
            indicator.style.display = 'none';
        }
    }

    async startListening(expectedWord) {
        if (!this.available) return;
        const connected = await this.client.connect();
        if (!connected) return;

        if (expectedWord) {
            this.client.setGrammar([expectedWord.toLowerCase()]);
        }

        this.client.onResult = (text) => {
            const trimmed = text.trim().toLowerCase();
            if (trimmed && trimmed !== '[unk]' && this.instructionManager) {
                this.instructionManager.handleLetterInput(trimmed);
            }
        };

        await this.client.startMic();
        this.active = true;
    }

    stopListening() {
        this.client.stopMic();
        this.active = false;
    }
}
