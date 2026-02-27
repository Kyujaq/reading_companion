// ── Spaced Repetition — track struggled letters, surface them more often ──────

class SpacedRepetitionTracker {
    constructor() {
        this.storageKey = 'readingCompanion_struggles';
    }

    // ── Persistence ──────────────────────────────────────────────────────────

    _load() {
        try {
            var data = localStorage.getItem(this.storageKey);
            return data ? JSON.parse(data) : {};
        } catch (e) {
            return {};
        }
    }

    _save(map) {
        try {
            localStorage.setItem(this.storageKey, JSON.stringify(map));
        } catch (e) {
            console.warn('[SpacedRepetition] Could not save to localStorage', e);
        }
    }

    // ── Core tracking ────────────────────────────────────────────────────────

    recordAttempt(letter, correct) {
        if (!letter) return;
        var key = letter.toLowerCase();
        var map = this._load();
        if (!map[key]) {
            map[key] = { letter: key, totalAttempts: 0, mistakes: 0, lastSeen: 0, weight: 0 };
        }
        var entry = map[key];
        entry.totalAttempts++;
        if (!correct) entry.mistakes++;
        entry.lastSeen = Date.now();
        // Weight: ratio of mistakes, boosted by recency of errors
        entry.weight = entry.totalAttempts > 0
            ? (entry.mistakes / entry.totalAttempts) + (entry.mistakes * 0.1)
            : 0;
        map[key] = entry;
        this._save(map);
    }

    // ── Queries ──────────────────────────────────────────────────────────────

    getStrugglingLetters(n) {
        var map = this._load();
        var entries = [];
        for (var k in map) {
            if (map.hasOwnProperty(k) && map[k].mistakes > 0) {
                entries.push(map[k]);
            }
        }
        entries.sort(function(a, b) { return b.weight - a.weight; });
        return entries.slice(0, n || 5);
    }

    getWeightedSuggestion() {
        var struggling = this.getStrugglingLetters(10);
        if (struggling.length === 0) return null;

        // Build a weighted pool
        var pool = [];
        for (var i = 0; i < struggling.length; i++) {
            var count = Math.max(1, Math.ceil(struggling[i].weight * 10));
            for (var j = 0; j < count; j++) {
                pool.push(struggling[i].letter);
            }
        }
        return pool[Math.floor(Math.random() * pool.length)];
    }

    getSuggestedPracticeWords(lang, n) {
        var app = window.readingCompanionApp;
        if (!app || !app.languageData || !app.languageData[lang]) return [];
        var wordBank = app.languageData[lang].words;
        var struggling = this.getStrugglingLetters(10);
        if (struggling.length === 0) return [];

        var letterWeights = {};
        for (var i = 0; i < struggling.length; i++) {
            letterWeights[struggling[i].letter] = struggling[i].weight;
        }

        // Score each word by how many struggled letters it contains
        var scored = [];
        for (var w = 0; w < wordBank.length; w++) {
            var word = wordBank[w];
            var score = 0;
            var letters = word.toLowerCase().split('');
            for (var l = 0; l < letters.length; l++) {
                if (letterWeights[letters[l]]) {
                    score += letterWeights[letters[l]];
                }
            }
            if (score > 0) {
                scored.push({ word: word, score: score });
            }
        }
        scored.sort(function(a, b) { return b.score - a.score; });
        var result = [];
        for (var r = 0; r < Math.min(scored.length, n || 5); r++) {
            result.push(scored[r].word);
        }
        return result;
    }

    // ── Guided example integration ───────────────────────────────────────────

    getSuggestedSyllable(lang) {
        var letter = this.getWeightedSuggestion();
        if (!letter) return null;
        var app = window.readingCompanionApp;
        if (!app) return null;

        var vowels = app.vowels[lang] || app.vowels['en'];
        var consonants = app.consonants[lang] || app.consonants['en'];
        // If the struggled letter is a consonant, pair with a random vowel
        if (consonants.indexOf(letter) !== -1) {
            var v = vowels[Math.floor(Math.random() * vowels.length)];
            return { consonant: letter.toUpperCase(), vowel: v.toUpperCase(), syllable: (letter + v).toUpperCase() };
        }
        // If it's a vowel, pair with a random consonant
        if (vowels.indexOf(letter) !== -1) {
            var c = consonants[Math.floor(Math.random() * consonants.length)];
            return { consonant: c.toUpperCase(), vowel: letter.toUpperCase(), syllable: (c + letter).toUpperCase() };
        }
        return null;
    }

    // ── Build a practice lesson from struggled letters ────────────────────────

    buildPracticeLesson(lang) {
        var isFr = lang === 'fr';
        var words = this.getSuggestedPracticeWords(lang, 3);
        var struggling = this.getStrugglingLetters(5);

        // Fall back to raw letters if no words contain struggled letters
        var steps = [];
        steps.push({
            id: 'intro',
            type: 'narrate',
            tts: isFr
                ? 'C\'est l\'heure de réviser les lettres difficiles ! Allons-y !'
                : 'Time to practice your tricky letters! Let\'s go!',
            next: 'step-0'
        });

        var items = [];
        // Add struggled letters
        for (var i = 0; i < struggling.length; i++) {
            items.push(struggling[i].letter);
        }
        // Add letters from practice words
        for (var w = 0; w < words.length; w++) {
            var letters = words[w].toLowerCase().split('');
            for (var l = 0; l < letters.length; l++) {
                items.push(letters[l]);
            }
        }

        // Cap at 10 steps for a focused session
        if (items.length > 10) items = items.slice(0, 10);
        if (items.length === 0) return null;

        for (var s = 0; s < items.length; s++) {
            var letter = items[s];
            var isLast = s === items.length - 1;
            var nextId = isLast ? 'complete' : 'step-' + (s + 1);
            steps.push({
                id: 'step-' + s,
                type: 'prompt',
                tts: isFr
                    ? 'Appuie sur la lettre ' + letter.toUpperCase() + ' !'
                    : 'Press the letter ' + letter.toUpperCase() + '!',
                expected: letter,
                successTts: isFr ? 'Bravo ! ' + letter.toUpperCase() + ' !' : 'Great! ' + letter.toUpperCase() + '!',
                failTts: isFr ? 'Essaie encore ! Cherche le ' + letter.toUpperCase() + '.' : 'Try again! Find the ' + letter.toUpperCase() + '.',
                next: nextId
            });
        }

        steps.push({
            id: 'complete',
            type: 'complete',
            tts: isFr
                ? 'Super travail ! Tu t\'améliores !'
                : 'Great work! You are getting better!'
        });

        return {
            id: 'practice-weak-' + Date.now(),
            language: lang,
            title: isFr ? '🔄 Révision des points faibles' : '🔄 Practice Weak Spots',
            steps: steps
        };
    }

    // ── UI: render weak-spots display in settings ────────────────────────────

    updateWeakSpotsDisplay() {
        var container = document.getElementById('weakSpotsDisplay');
        if (!container) return;
        var struggling = this.getStrugglingLetters(8);
        var isFr = (window.readingCompanionApp && window.readingCompanionApp.currentLanguage === 'fr');
        if (struggling.length === 0) {
            container.innerHTML = '<span class="weak-spots-empty">' +
                (isFr ? 'Pas de points faibles — continue à pratiquer !' : 'No weak spots yet — keep practicing!') +
                '</span>';
            return;
        }
        var html = '';
        for (var i = 0; i < struggling.length; i++) {
            var s = struggling[i];
            var pct = s.totalAttempts > 0 ? Math.round((s.mistakes / s.totalAttempts) * 100) : 0;
            html += '<span class="weak-spot-badge" title="' + s.mistakes + '/' + s.totalAttempts + ' mistakes">' +
                s.letter.toUpperCase() + ' <small>' + pct + '%</small></span>';
        }
        container.innerHTML = html;
    }

    clearData() {
        try {
            localStorage.removeItem(this.storageKey);
        } catch (e) {
            // ignore
        }
        this.updateWeakSpotsDisplay();
    }
}
