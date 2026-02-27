// Phase 2 — Clipart Gallery

const GALLERY_DATA = {
    en: [
        // Fruits
        { word: 'apple',  syllables: ['ap', 'ple'],   emoji: '🍎', category: 'fruits' },
        { word: 'banana', syllables: ['ba', 'na', 'na'], emoji: '🍌', category: 'fruits' },
        { word: 'orange', syllables: ['or', 'ange'],  emoji: '🍊', category: 'fruits' },
        { word: 'grape',  syllables: ['grape'],        emoji: '🍇', category: 'fruits' },
        { word: 'lemon',  syllables: ['lem', 'on'],   emoji: '🍋', category: 'fruits' },
        // Animals
        { word: 'cat',    syllables: ['cat'],          emoji: '🐱', category: 'animals' },
        { word: 'dog',    syllables: ['dog'],          emoji: '🐶', category: 'animals' },
        { word: 'bird',   syllables: ['bird'],         emoji: '🐦', category: 'animals' },
        { word: 'fish',   syllables: ['fish'],         emoji: '🐟', category: 'animals' },
        { word: 'rabbit', syllables: ['rab', 'bit'],  emoji: '🐰', category: 'animals' },
        { word: 'horse',  syllables: ['horse'],        emoji: '🐴', category: 'animals' },
        // Vehicles
        { word: 'car',    syllables: ['car'],          emoji: '🚗', category: 'vehicles' },
        { word: 'bike',   syllables: ['bike'],         emoji: '🚲', category: 'vehicles' },
        { word: 'bus',    syllables: ['bus'],          emoji: '🚌', category: 'vehicles' },
        { word: 'train',  syllables: ['train'],        emoji: '🚂', category: 'vehicles' },
        { word: 'plane',  syllables: ['plane'],        emoji: '✈️',  category: 'vehicles' },
        // Home
        { word: 'book',   syllables: ['book'],         emoji: '📚', category: 'home' },
        { word: 'chair',  syllables: ['chair'],        emoji: '🪑', category: 'home' },
        { word: 'bed',    syllables: ['bed'],          emoji: '🛏️',  category: 'home' },
        { word: 'lamp',   syllables: ['lamp'],         emoji: '💡', category: 'home' },
        { word: 'door',   syllables: ['door'],         emoji: '🚪', category: 'home' }
    ],
    fr: [
        // Fruits
        { word: 'pomme',   syllables: ['pom', 'me'],    emoji: '🍎', category: 'fruits' },
        { word: 'banane',  syllables: ['ba', 'na', 'ne'], emoji: '🍌', category: 'fruits' },
        { word: 'orange',  syllables: ['o', 'ran', 'ge'], emoji: '🍊', category: 'fruits' },
        { word: 'raisin',  syllables: ['rai', 'sin'],   emoji: '🍇', category: 'fruits' },
        { word: 'citron',  syllables: ['ci', 'tron'],   emoji: '🍋', category: 'fruits' },
        // Animals
        { word: 'chat',    syllables: ['chat'],         emoji: '🐱', category: 'animals' },
        { word: 'chien',   syllables: ['chien'],        emoji: '🐶', category: 'animals' },
        { word: 'oiseau',  syllables: ['oi', 'seau'],   emoji: '🐦', category: 'animals' },
        { word: 'poisson', syllables: ['poi', 'sson'],  emoji: '🐟', category: 'animals' },
        { word: 'lapin',   syllables: ['la', 'pin'],    emoji: '🐰', category: 'animals' },
        { word: 'cheval',  syllables: ['che', 'val'],   emoji: '🐴', category: 'animals' },
        // Vehicles
        { word: 'voiture', syllables: ['voi', 'tu', 're'], emoji: '🚗', category: 'vehicles' },
        { word: 'vélo',    syllables: ['vé', 'lo'],     emoji: '🚲', category: 'vehicles' },
        { word: 'bus',     syllables: ['bus'],          emoji: '🚌', category: 'vehicles' },
        { word: 'train',   syllables: ['train'],        emoji: '🚂', category: 'vehicles' },
        { word: 'avion',   syllables: ['a', 'vion'],    emoji: '✈️',  category: 'vehicles' },
        // Home
        { word: 'livre',   syllables: ['li', 'vre'],    emoji: '📚', category: 'home' },
        { word: 'chaise',  syllables: ['chai', 'se'],   emoji: '🪑', category: 'home' },
        { word: 'lit',     syllables: ['lit'],          emoji: '🛏️',  category: 'home' },
        { word: 'lampe',   syllables: ['lam', 'pe'],    emoji: '💡', category: 'home' },
        { word: 'porte',   syllables: ['por', 'te'],    emoji: '🚪', category: 'home' }
    ]
};

const CATEGORY_LABELS = {
    en: { fruits: '🍎 Fruits', animals: '🐱 Animals', vehicles: '🚗 Vehicles', home: '🏠 Home', all: '🌟 All' },
    fr: { fruits: '🍎 Fruits', animals: '🐱 Animaux', vehicles: '🚗 Véhicules', home: '🏠 Maison', all: '🌟 Tous' }
};

class GalleryManager {
    constructor(app) {
        this.app = app;
        this.activeCategory = 'all';
        this.syllableTimers = [];
    }

    init() {
        this.renderCategoryFilters();
        this.renderGallery();
    }

    renderCategoryFilters() {
        const container = document.getElementById('galleryCategoryFilters');
        if (!container) return;
        const lang = this.app.currentLanguage;
        const labels = CATEGORY_LABELS[lang] || CATEGORY_LABELS.en;
        container.innerHTML = '';
        ['all', 'fruits', 'animals', 'vehicles', 'home'].forEach(cat => {
            const btn = document.createElement('button');
            btn.className = 'gallery-filter-btn' + (cat === this.activeCategory ? ' active' : '');
            btn.textContent = labels[cat] || cat;
            btn.addEventListener('click', () => {
                this.activeCategory = cat;
                container.querySelectorAll('.gallery-filter-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.renderGallery();
            });
            container.appendChild(btn);
        });
    }

    renderGallery() {
        const grid = document.getElementById('galleryGrid');
        if (!grid) return;
        const lang = this.app.currentLanguage;
        const items = (GALLERY_DATA[lang] || []).filter(
            item => this.activeCategory === 'all' || item.category === this.activeCategory
        );
        grid.innerHTML = '';
        items.forEach(item => {
            const card = this._makeCard(item, lang);
            grid.appendChild(card);
        });
    }

    _makeCard(item, lang) {
        const card = document.createElement('div');
        card.className = 'gallery-card';

        const emoji = document.createElement('div');
        emoji.className = 'gallery-emoji';
        emoji.textContent = item.emoji;

        const wordLabel = document.createElement('div');
        wordLabel.className = 'gallery-word';
        wordLabel.textContent = item.word;

        const syllableRow = document.createElement('div');
        syllableRow.className = 'gallery-syllables';
        syllableRow.innerHTML = item.syllables.map(s => `<span class="gallery-syllable">${s.toUpperCase()}</span>`).join('<span class="gallery-syllable-sep">·</span>');

        const btnRow = document.createElement('div');
        btnRow.className = 'gallery-btn-row';

        const hearBtn = document.createElement('button');
        hearBtn.className = 'btn-gallery-action';
        hearBtn.textContent = lang === 'fr' ? '🔊 Écouter' : '🔊 Hear it';
        hearBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this._playSyllableAnimation(item, syllableRow);
        });

        const spellBtn = document.createElement('button');
        spellBtn.className = 'btn-gallery-action btn-spell';
        spellBtn.textContent = lang === 'fr' ? '✏️ Écrire !' : '✏️ Spell it!';
        spellBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            if (window.instructionModeManager) {
                window.instructionModeManager.startWordLesson(item.word);
            }
        });

        btnRow.appendChild(hearBtn);
        btnRow.appendChild(spellBtn);

        // Clicking the card plays TTS
        card.addEventListener('click', () => this._playSyllableAnimation(item, syllableRow));

        card.appendChild(emoji);
        card.appendChild(wordLabel);
        card.appendChild(syllableRow);
        card.appendChild(btnRow);

        return card;
    }

    _playSyllableAnimation(item, syllableRow) {
        // Clear previous timers
        this.syllableTimers.forEach(t => clearTimeout(t));
        this.syllableTimers = [];

        // Reset highlights
        syllableRow.querySelectorAll('.gallery-syllable').forEach(el => el.classList.remove('active'));

        // Play TTS of the full word
        const lang = this.app.currentLanguage;
        const voiceLang = this.app.languageData[lang].voiceLang;
        const utterance = new SpeechSynthesisUtterance(item.word);
        utterance.lang = voiceLang;
        utterance.rate = 0.8;
        window.speechSynthesis.cancel();
        window.speechSynthesis.speak(utterance);

        // Animate syllables in sequence
        const syllableEls = syllableRow.querySelectorAll('.gallery-syllable');
        const delay = 400;
        syllableEls.forEach((el, i) => {
            const t = setTimeout(() => {
                syllableRow.querySelectorAll('.gallery-syllable').forEach(s => s.classList.remove('active'));
                el.classList.add('active');
                if (i === syllableEls.length - 1) {
                    const t2 = setTimeout(() => el.classList.remove('active'), 600);
                    this.syllableTimers.push(t2);
                }
            }, i * delay);
            this.syllableTimers.push(t);
        });
    }

    onLanguageChange() {
        this.activeCategory = 'all';
        this.renderCategoryFilters();
        this.renderGallery();
    }
}
