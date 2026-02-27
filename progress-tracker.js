// ── Progress Tracker — persists lesson history, streaks & stars ──────────────

class ProgressTracker {
    constructor() {
        this.storageKey = 'readingCompanion_progress';
    }

    saveSession(report, lesson) {
        var history = this.getHistory();
        var entry = {
            lessonId: lesson.id,
            lessonTitle: lesson.title,
            language: lesson.language,
            timestamp: Date.now(),
            totalAttempts: report.totalAttempts,
            correctAttempts: report.correctAttempts,
            duration: report.duration
        };
        history.push(entry);
        try {
            localStorage.setItem(this.storageKey, JSON.stringify(history));
        } catch (e) {
            console.warn('[ProgressTracker] Could not save to localStorage', e);
        }
        this.updateDisplay();
    }

    getHistory() {
        try {
            var data = localStorage.getItem(this.storageKey);
            return data ? JSON.parse(data) : [];
        } catch (e) {
            return [];
        }
    }

    getStars() {
        var history = this.getHistory();
        var stars = 0;
        for (var i = 0; i < history.length; i++) {
            stars += 1; // 1 star per completion
            if (history[i].totalAttempts > 0 &&
                history[i].correctAttempts === history[i].totalAttempts) {
                stars += 1; // bonus star for perfect accuracy
            }
        }
        return stars;
    }

    getStreak() {
        var history = this.getHistory();
        if (history.length === 0) return 0;

        // Collect unique dates (YYYY-MM-DD in local timezone)
        var dateSet = {};
        for (var i = 0; i < history.length; i++) {
            var d = new Date(history[i].timestamp);
            var key = d.getFullYear() + '-' +
                String(d.getMonth() + 1).padStart(2, '0') + '-' +
                String(d.getDate()).padStart(2, '0');
            dateSet[key] = true;
        }

        var dates = Object.keys(dateSet).sort().reverse();

        // Check if today or yesterday is included (streak must be current)
        var today = new Date();
        var todayKey = today.getFullYear() + '-' +
            String(today.getMonth() + 1).padStart(2, '0') + '-' +
            String(today.getDate()).padStart(2, '0');
        var yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        var yesterdayKey = yesterday.getFullYear() + '-' +
            String(yesterday.getMonth() + 1).padStart(2, '0') + '-' +
            String(yesterday.getDate()).padStart(2, '0');

        if (dates[0] !== todayKey && dates[0] !== yesterdayKey) return 0;

        // Count consecutive days backwards from most recent
        var streak = 1;
        for (var j = 1; j < dates.length; j++) {
            var prev = new Date(dates[j - 1] + 'T00:00:00');
            var curr = new Date(dates[j] + 'T00:00:00');
            var diff = (prev - curr) / (1000 * 60 * 60 * 24);
            if (diff === 1) {
                streak++;
            } else {
                break;
            }
        }
        return streak;
    }

    clearHistory() {
        try {
            localStorage.removeItem(this.storageKey);
        } catch (e) {
            // ignore
        }
        this.updateDisplay();
    }

    // ── UI updates ───────────────────────────────────────────────────────────

    updateDisplay() {
        this._updateHeaderBadge();
        this._updateProgressPanel();
    }

    _updateHeaderBadge() {
        var el = document.getElementById('progressBadge');
        if (!el) return;
        var stars = this.getStars();
        var streak = this.getStreak();
        var parts = [];
        parts.push('\u2B50 ' + stars);
        if (streak > 0) {
            parts.push('\uD83D\uDD25 ' + streak + '-day streak');
        }
        el.textContent = parts.join('  ');
        el.style.display = (stars > 0 || streak > 0) ? '' : 'none';
    }

    _updateProgressPanel() {
        var listEl = document.getElementById('progressHistoryList');
        var starsEl = document.getElementById('progressStarsCount');
        var streakEl = document.getElementById('progressStreakCount');
        if (!listEl) return;

        var stars = this.getStars();
        var streak = this.getStreak();

        if (starsEl) starsEl.textContent = stars;
        if (streakEl) streakEl.textContent = streak > 0 ? streak + '-day streak' : 'No streak yet';

        var history = this.getHistory();
        var recent = history.slice(-10).reverse();

        if (recent.length === 0) {
            listEl.innerHTML = '<p class="progress-empty">No lessons completed yet. Start a lesson to earn stars!</p>';
            return;
        }

        var html = '<table class="progress-history-table"><thead><tr>' +
            '<th>Lesson</th><th>Score</th><th>Date</th>' +
            '</tr></thead><tbody>';

        for (var i = 0; i < recent.length; i++) {
            var entry = recent[i];
            var pct = entry.totalAttempts > 0
                ? Math.round((entry.correctAttempts / entry.totalAttempts) * 100)
                : 100;
            var perfect = entry.totalAttempts > 0 &&
                entry.correctAttempts === entry.totalAttempts;
            var d = new Date(entry.timestamp);
            var dateStr = d.toLocaleDateString(undefined, {
                month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
            });
            html += '<tr>' +
                '<td>' + this._escapeHtml(entry.lessonTitle) + '</td>' +
                '<td>' + pct + '%' + (perfect ? ' \u2B50' : '') + '</td>' +
                '<td>' + dateStr + '</td>' +
                '</tr>';
        }
        html += '</tbody></table>';
        listEl.innerHTML = html;
    }

    _escapeHtml(str) {
        var div = document.createElement('div');
        div.appendChild(document.createTextNode(str));
        return div.innerHTML;
    }
}
