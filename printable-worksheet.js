// ── Printable Worksheet — generate a print-ready HTML page of the day's lesson ──

class WorksheetGenerator {
    constructor() {
        this.app = window.readingCompanionApp;
    }

    // ── Main entry point ─────────────────────────────────────────────────────

    generateWorksheet(options) {
        options = options || {};
        var app = this.app;
        var lang = (options.language || app.currentLanguage || 'en');
        var isFr = lang === 'fr';

        var childName = this._getChildName();
        var dateStr = new Date().toLocaleDateString(isFr ? 'fr-FR' : 'en-US', {
            weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
        });

        var letters = this._getRecentLetters(lang);
        var words = this._getRecentWords(lang);
        var weakSpots = this._getWeakSpots();
        var tracingLetters = this._getTracingLetters(lang, weakSpots);

        var html = this._buildPage({
            childName: childName,
            dateStr: dateStr,
            letters: letters,
            words: words,
            weakSpots: weakSpots,
            tracingLetters: tracingLetters,
            isFr: isFr,
            lang: lang
        });

        var win = window.open('', '_blank');
        if (!win) {
            alert(isFr
                ? 'Veuillez autoriser les pop-ups pour imprimer la feuille.'
                : 'Please allow pop-ups to print the worksheet.');
            return;
        }
        win.document.write(html);
        win.document.close();
    }

    // ── Data helpers ─────────────────────────────────────────────────────────

    _getChildName() {
        var input = document.getElementById('childNameInput');
        return (input && input.value.trim()) || '';
    }

    _getRecentLetters(lang) {
        var app = this.app;
        if (!app || !app.phoneticHints || !app.phoneticHints[lang]) return [];
        var hints = app.phoneticHints[lang];
        var letters = app.languageData && app.languageData[lang]
            ? app.languageData[lang].letters : [];
        var result = [];
        for (var i = 0; i < letters.length; i++) {
            var l = letters[i].toLowerCase();
            if (hints[l]) {
                result.push({ letter: letters[i], hint: hints[l] });
            }
        }
        return result;
    }

    _getRecentWords(lang) {
        var app = this.app;
        if (!app || !app.languageData || !app.languageData[lang]) return [];
        var wordBank = app.languageData[lang].words;
        var syllables = app.wordSyllables ? app.wordSyllables[lang] : {};

        // Pull words from recent lesson history when possible
        var history = window.progressTracker ? window.progressTracker.getHistory() : [];
        var todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);
        var recentLessons = [];
        for (var i = 0; i < history.length; i++) {
            if (history[i].timestamp >= todayStart.getTime()) {
                recentLessons.push(history[i]);
            }
        }

        var MAX_WORDS = 12;
        var words = wordBank.slice(0, MAX_WORDS);
        var result = [];
        for (var w = 0; w < words.length; w++) {
            var word = words[w];
            var breakdown = syllables[word.toLowerCase()]
                ? syllables[word.toLowerCase()].join(' · ')
                : word;
            result.push({ word: word, syllables: breakdown });
        }
        return result;
    }

    _getWeakSpots() {
        if (!window.spacedRepetition) return [];
        var spots = window.spacedRepetition.getStrugglingLetters(8);
        var result = [];
        for (var i = 0; i < spots.length; i++) {
            var s = spots[i];
            var pct = s.totalAttempts > 0
                ? Math.round((s.mistakes / s.totalAttempts) * 100) : 0;
            result.push({
                letter: s.letter.toUpperCase(),
                errorPct: pct,
                mistakes: s.mistakes,
                total: s.totalAttempts
            });
        }
        return result;
    }

    _getTracingLetters(lang, weakSpots) {
        // Prioritize weak-spot letters, then fill with common letters
        var letters = [];
        for (var i = 0; i < weakSpots.length && letters.length < 8; i++) {
            letters.push(weakSpots[i].letter.toUpperCase());
        }
        var alphabet = (this.app && this.app.languageData && this.app.languageData[lang])
            ? this.app.languageData[lang].letters : 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
        for (var j = 0; j < alphabet.length && letters.length < 8; j++) {
            var ch = alphabet[j].toUpperCase();
            if (letters.indexOf(ch) === -1) letters.push(ch);
        }
        return letters;
    }

    // ── HTML builder ─────────────────────────────────────────────────────────

    _buildPage(data) {
        var title = data.isFr ? 'Feuille d\'exercices' : 'Practice Worksheet';
        var heading = data.childName
            ? (data.isFr ? 'Feuille de ' + this._esc(data.childName) : this._esc(data.childName) + '\'s Worksheet')
            : title;

        var sections = '';
        sections += this._buildLettersSection(data);
        sections += this._buildWordsSection(data);
        sections += this._buildTracingSection(data);
        sections += this._buildWeakSpotsSection(data);

        return '<!DOCTYPE html><html lang="' + data.lang + '"><head>' +
            '<meta charset="UTF-8">' +
            '<title>' + this._esc(title) + '</title>' +
            this._buildStyles() +
            '</head><body>' +
            '<div class="ws-page">' +
            '<header class="ws-header">' +
            '<h1>' + heading + '</h1>' +
            '<p class="ws-date">' + this._esc(data.dateStr) + '</p>' +
            '</header>' +
            sections +
            '<div class="ws-print-btn-row">' +
            '<button onclick="window.print()" class="ws-print-btn">' +
            (data.isFr ? '🖨️ Imprimer' : '🖨️ Print') +
            '</button>' +
            '</div>' +
            '</div></body></html>';
    }

    _buildLettersSection(data) {
        if (data.letters.length === 0) return '';
        var title = data.isFr ? 'Lettres pratiquées' : 'Letters Practiced';
        var html = '<section class="ws-section"><h2>🔤 ' + title + '</h2>' +
            '<div class="ws-letter-grid">';
        for (var i = 0; i < data.letters.length; i++) {
            var l = data.letters[i];
            html += '<div class="ws-letter-card">' +
                '<span class="ws-letter">' + this._esc(l.letter) + '</span>' +
                '<span class="ws-hint">' + this._esc(l.hint) + '</span>' +
                '</div>';
        }
        html += '</div></section>';
        return html;
    }

    _buildWordsSection(data) {
        if (data.words.length === 0) return '';
        var title = data.isFr ? 'Mots appris' : 'Words Learned';
        var html = '<section class="ws-section"><h2>📖 ' + title + '</h2>' +
            '<div class="ws-word-list">';
        for (var i = 0; i < data.words.length; i++) {
            var w = data.words[i];
            html += '<div class="ws-word-item">' +
                '<strong>' + this._esc(w.word) + '</strong> ' +
                '<span class="ws-syllable-break">(' + this._esc(w.syllables) + ')</span>' +
                '</div>';
        }
        html += '</div></section>';
        return html;
    }

    _buildTracingSection(data) {
        if (data.tracingLetters.length === 0) return '';
        var title = data.isFr ? 'Traçage des lettres' : 'Practice Tracing';
        var html = '<section class="ws-section"><h2>✏️ ' + title + '</h2>' +
            '<p class="ws-trace-hint">' +
            (data.isFr ? 'Trace chaque lettre en suivant les pointillés :' : 'Trace each letter along the dotted lines:') +
            '</p><div class="ws-tracing-grid">';
        for (var i = 0; i < data.tracingLetters.length; i++) {
            html += '<div class="ws-trace-cell">' +
                '<span class="ws-trace-letter">' + this._esc(data.tracingLetters[i]) + '</span>' +
                '<div class="ws-trace-line"></div>' +
                '<div class="ws-trace-line"></div>' +
                '</div>';
        }
        html += '</div></section>';
        return html;
    }

    _buildWeakSpotsSection(data) {
        if (data.weakSpots.length === 0) return '';
        var title = data.isFr ? 'Points faibles à revoir' : 'Weak Spots to Practice';
        var html = '<section class="ws-section ws-weak-section"><h2>🔄 ' + title + '</h2>' +
            '<div class="ws-weak-grid">';
        for (var i = 0; i < data.weakSpots.length; i++) {
            var s = data.weakSpots[i];
            html += '<div class="ws-weak-card">' +
                '<span class="ws-weak-letter">' + this._esc(s.letter) + '</span>' +
                '<span class="ws-weak-stat">' + s.errorPct + '% ' +
                (data.isFr ? 'erreurs' : 'errors') + '</span>' +
                '<span class="ws-weak-detail">' + s.mistakes + '/' + s.total + '</span>' +
                '</div>';
        }
        html += '</div></section>';
        return html;
    }

    // ── Styles ───────────────────────────────────────────────────────────────

    _buildStyles() {
        return '<style>' +
        '*, *::before, *::after { box-sizing: border-box; }' +
        'body { font-family: "Segoe UI", Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 20px; background: #f5f5f5; color: #333; }' +
        '.ws-page { max-width: 800px; margin: 0 auto; background: #fff; padding: 40px; border-radius: 12px; box-shadow: 0 2px 12px rgba(0,0,0,0.08); }' +
        '.ws-header { text-align: center; margin-bottom: 30px; border-bottom: 3px solid #667eea; padding-bottom: 20px; }' +
        '.ws-header h1 { font-size: 2em; color: #667eea; margin: 0 0 8px 0; }' +
        '.ws-date { color: #888; font-size: 1em; margin: 0; }' +
        '.ws-section { margin-bottom: 30px; }' +
        '.ws-section h2 { font-size: 1.3em; color: #444; border-bottom: 2px solid #eee; padding-bottom: 8px; margin-bottom: 16px; }' +

        /* Letters grid */
        '.ws-letter-grid { display: flex; flex-wrap: wrap; gap: 10px; }' +
        '.ws-letter-card { display: flex; flex-direction: column; align-items: center; width: 60px; padding: 8px 4px; border: 2px solid #667eea; border-radius: 8px; background: #f0f3ff; }' +
        '.ws-letter { font-size: 1.5em; font-weight: bold; color: #667eea; }' +
        '.ws-hint { font-size: 0.75em; color: #888; margin-top: 2px; font-style: italic; }' +

        /* Words list */
        '.ws-word-list { display: flex; flex-wrap: wrap; gap: 10px; }' +
        '.ws-word-item { background: #f9f0ff; border: 1px solid #d4b8e8; border-radius: 8px; padding: 8px 14px; }' +
        '.ws-word-item strong { color: #764ba2; }' +
        '.ws-syllable-break { color: #999; font-size: 0.85em; }' +

        /* Tracing */
        '.ws-trace-hint { color: #666; font-size: 0.95em; margin-bottom: 12px; }' +
        '.ws-tracing-grid { display: flex; flex-wrap: wrap; gap: 20px; }' +
        '.ws-trace-cell { text-align: center; width: 80px; }' +
        '.ws-trace-letter {' +
            'display: block; font-size: 3em; font-weight: bold;' +
            'color: transparent;' +
            '-webkit-text-stroke: 2px #ccc;' +
            'letter-spacing: 2px;' +
            'line-height: 1.2;' +
        '}' +
        '.ws-trace-line { border-bottom: 2px dashed #ddd; margin: 8px 0; height: 28px; }' +

        /* Weak spots */
        '.ws-weak-grid { display: flex; flex-wrap: wrap; gap: 12px; }' +
        '.ws-weak-card { display: flex; flex-direction: column; align-items: center; padding: 10px 16px; border: 2px solid #e74c3c; border-radius: 8px; background: #fff5f5; min-width: 70px; }' +
        '.ws-weak-letter { font-size: 1.6em; font-weight: bold; color: #e74c3c; }' +
        '.ws-weak-stat { font-size: 0.8em; color: #c0392b; margin-top: 2px; }' +
        '.ws-weak-detail { font-size: 0.7em; color: #aaa; }' +

        /* Print button */
        '.ws-print-btn-row { text-align: center; margin-top: 30px; }' +
        '.ws-print-btn { font-size: 1.1em; padding: 10px 30px; border: none; border-radius: 8px; background: linear-gradient(135deg, #667eea, #764ba2); color: #fff; cursor: pointer; }' +
        '.ws-print-btn:hover { opacity: 0.9; }' +

        /* Print media */
        '@media print {' +
            'body { background: #fff; padding: 0; }' +
            '.ws-page { box-shadow: none; padding: 20px; }' +
            '.ws-print-btn-row { display: none; }' +
            '.ws-trace-letter { -webkit-text-stroke: 2px #bbb; }' +
        '}' +
        '</style>';
    }

    // ── Utility ──────────────────────────────────────────────────────────────

    _esc(str) {
        var div = document.createElement('div');
        div.appendChild(document.createTextNode(str));
        return div.innerHTML;
    }
}
