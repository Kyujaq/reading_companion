// Phase 5 — YOLO Camera Mode

const YOLO_ENDPOINT = 'http://localhost:8501/infer/image/objv1';
const YOLO_CHECK_TIMEOUT_MS = 2000;

class YoloCameraManager {
    constructor(app) {
        this.app = app;
        this.available = false;
        this.stream = null;
    }

    async checkAvailability() {
        try {
            const controller = new AbortController();
            const timer = setTimeout(() => controller.abort(), YOLO_CHECK_TIMEOUT_MS);
            // Use HEAD if supported, else try OPTIONS; fall back to a small GET
            const resp = await fetch(YOLO_ENDPOINT, { method: 'HEAD', signal: controller.signal });
            clearTimeout(timer);
            this.available = resp.ok || resp.status === 405; // 405 Method Not Allowed still means server is up
            return this.available;
        } catch (e) {
            this.available = false;
            return false;
        }
    }

    init() {
        // Buttons
        const snapBtn = document.getElementById('cameraSnapBtn');
        const switchBtn = document.getElementById('cameraSwitchBtn');
        const uploadInput = document.getElementById('cameraUploadInput');
        const uploadBtn = document.getElementById('cameraUploadBtn');

        if (snapBtn) snapBtn.addEventListener('click', () => this.snap());
        if (switchBtn) switchBtn.addEventListener('click', () => this.startCamera());
        if (uploadBtn) uploadBtn.addEventListener('click', () => uploadInput && uploadInput.click());
        if (uploadInput) uploadInput.addEventListener('change', (e) => {
            if (e.target.files && e.target.files[0]) this.processFile(e.target.files[0]);
        });
    }

    async startCamera() {
        const video = document.getElementById('cameraVideo');
        if (!video) return;
        try {
            if (this.stream) this.stream.getTracks().forEach(t => t.stop());
            this.stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
            video.srcObject = this.stream;
            video.style.display = '';
            video.play();
            document.getElementById('cameraSnapBtn').disabled = false;
        } catch (e) {
            console.warn('[YoloCameraManager] Camera access failed:', e);
            this._showError(this.app.currentLanguage === 'fr'
                ? 'Impossible d\'accéder à la caméra.'
                : 'Could not access the camera.');
        }
    }

    snap() {
        const video = document.getElementById('cameraVideo');
        const canvas = document.getElementById('cameraCanvas');
        if (!video || !canvas) return;
        const ctx = canvas.getContext('2d');
        canvas.width = video.videoWidth || 640;
        canvas.height = video.videoHeight || 480;
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        canvas.toBlob(blob => this.processFile(blob, 'snap.jpg'), 'image/jpeg', 0.9);
    }

    async processFile(file, filename) {
        const preview = document.getElementById('cameraPreview');
        if (preview) {
            preview.src = URL.createObjectURL(file);
            preview.style.display = '';
        }

        this._showStatus(this.app.currentLanguage === 'fr' ? '🔍 Analyse en cours...' : '🔍 Analyzing...');

        try {
            const formData = new FormData();
            formData.append('file', file, filename || file.name || 'image.jpg');

            const controller = new AbortController();
            const timer = setTimeout(() => controller.abort(), 10000);
            const resp = await fetch(YOLO_ENDPOINT, {
                method: 'POST',
                body: formData,
                signal: controller.signal
            });
            clearTimeout(timer);

            if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
            const data = await resp.json();
            this._handleDetections(data);
        } catch (e) {
            console.warn('[YoloCameraManager] Detection error:', e);
            this._onNoDetections();
        }
    }

    _handleDetections(data) {
        // Normalize response: support { detections: [...] } or flat array
        let detections = [];
        if (Array.isArray(data)) {
            detections = data;
        } else if (data.detections && Array.isArray(data.detections)) {
            detections = data.detections;
        } else if (data.predictions && Array.isArray(data.predictions)) {
            detections = data.predictions;
        }

        if (detections.length === 0) {
            this._onNoDetections();
            return;
        }

        // Deduplicate by label and take top-5 by confidence
        const seen = new Set();
        const top5 = detections
            .filter(d => d.label || d.class || d.name)
            .map(d => ({ label: (d.label || d.class || d.name).toLowerCase(), confidence: d.confidence || d.score || 0 }))
            .sort((a, b) => b.confidence - a.confidence)
            .filter(d => { if (seen.has(d.label)) return false; seen.add(d.label); return true; })
            .slice(0, 5);

        if (top5.length === 0) {
            this._onNoDetections();
            return;
        }

        this._clearStatus();
        this._showDetections(top5);
        this._narrateDetections(top5);
    }

    _showDetections(detections) {
        const container = document.getElementById('yoloResults');
        if (!container) return;
        container.innerHTML = '';
        const lang = this.app.currentLanguage;

        detections.forEach(det => {
            const card = document.createElement('div');
            card.className = 'yolo-card';

            const label = document.createElement('div');
            label.className = 'yolo-label';
            label.textContent = det.label;

            const conf = document.createElement('div');
            conf.className = 'yolo-conf';
            conf.textContent = `${Math.round(det.confidence * 100)}%`;

            const btnRow = document.createElement('div');
            btnRow.className = 'yolo-btn-row';

            const hearBtn = document.createElement('button');
            hearBtn.className = 'btn-gallery-action';
            hearBtn.textContent = lang === 'fr' ? '🔊 Écouter' : '🔊 Hear it';
            hearBtn.addEventListener('click', () => this._speakWord(det.label));

            const spellBtn = document.createElement('button');
            spellBtn.className = 'btn-gallery-action btn-spell';
            spellBtn.textContent = lang === 'fr' ? '✏️ Écrire !' : '✏️ Spell it!';
            spellBtn.addEventListener('click', () => {
                if (window.instructionModeManager) {
                    window.instructionModeManager.startWordLesson(det.label);
                }
            });

            const firstBtn = document.createElement('button');
            firstBtn.className = 'btn-gallery-action';
            firstBtn.textContent = lang === 'fr' ? '🔤 Première lettre ?' : '🔤 First letter?';
            firstBtn.addEventListener('click', () => this._firstLetterChallenge(det.label));

            btnRow.appendChild(hearBtn);
            btnRow.appendChild(spellBtn);
            btnRow.appendChild(firstBtn);

            card.appendChild(label);
            card.appendChild(conf);
            card.appendChild(btnRow);
            container.appendChild(card);
        });
    }

    _narrateDetections(detections) {
        const lang = this.app.currentLanguage;
        const count = detections.length;
        const first = detections[0].label;
        const second = detections.length > 1 ? detections[1].label : null;

        let text;
        if (lang === 'fr') {
            text = `Super ! Je vois ${count} chose${count > 1 ? 's' : ''} ! J'aperçois ${first}${second ? ` et ${second}` : ''} ! Tu veux apprendre à écrire ${first} ?`;
        } else {
            text = `Wow! I can see ${count} thing${count > 1 ? 's' : ''}! I spy a ${first}${second ? ` and a ${second}` : ''}! Do you want to learn how to spell ${first}?`;
        }
        this._speakWord(text);
    }

    _onNoDetections() {
        const lang = this.app.currentLanguage;
        const msg = lang === 'fr'
            ? 'Hmm, je ne vois pas bien. Essaie de te rapprocher ou d\'utiliser une image plus lumineuse !'
            : 'Hmm, I couldn\'t quite see that. Try moving closer or using a brighter picture!';
        this._showStatus(msg);
        this._speakWord(msg);
    }

    _firstLetterChallenge(word) {
        const lang = this.app.currentLanguage;
        const firstLetter = word[0].toUpperCase();
        const msg = lang === 'fr'
            ? `Quelle est la première lettre dans ${word.toUpperCase()} ?`
            : `What's the first letter in ${word.toUpperCase()}?`;
        this._speakWord(msg);
        if (window.instructionModeManager) {
            const lesson = {
                id: `first-letter-${word}`,
                language: lang,
                title: lang === 'fr' ? `Première lettre de ${word.toUpperCase()}` : `First letter of ${word.toUpperCase()}`,
                steps: [
                    { id: 'intro', type: 'narrate', tts: msg, next: 'step-letter' },
                    {
                        id: 'step-letter',
                        type: 'prompt',
                        tts: lang === 'fr' ? `Appuie sur le ${firstLetter} !` : `Press the ${firstLetter}!`,
                        expected: firstLetter.toLowerCase(),
                        successTts: lang === 'fr' ? `Bravo ! ${firstLetter} comme dans ${word.toUpperCase()} !` : `Great! ${firstLetter} as in ${word.toUpperCase()}!`,
                        failTts: lang === 'fr' ? `Essaie encore !` : `Try again!`,
                        next: 'complete'
                    },
                    { id: 'complete', type: 'complete', tts: lang === 'fr' ? 'Bravo !' : 'Well done!' }
                ]
            };
            window.instructionModeManager.startLesson(lesson);
        }
    }

    _speakWord(text) {
        const lang = this.app.currentLanguage;
        const voiceLang = this.app.languageData[lang].voiceLang;
        window.speechSynthesis.cancel();
        const utt = new SpeechSynthesisUtterance(text);
        utt.lang = voiceLang;
        utt.rate = 0.85;
        window.speechSynthesis.speak(utt);
    }

    _showStatus(msg) {
        const el = document.getElementById('yoloStatus');
        if (el) { el.textContent = msg; el.style.display = ''; }
    }

    _clearStatus() {
        const el = document.getElementById('yoloStatus');
        if (el) el.style.display = 'none';
    }

    _showError(msg) {
        this._showStatus(msg);
    }

    stopCamera() {
        if (this.stream) {
            this.stream.getTracks().forEach(t => t.stop());
            this.stream = null;
        }
    }
}
