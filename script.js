// Reading Companion - Main Script

// Configuration constants
const MAX_DISPLAYED_SYLLABLES = 30;
const LEARNING_SPEECH_RATE = 0.8;

class ReadingCompanion {
    constructor() {
        this.currentLanguage = 'en';
        this.assemblyText = [];
        this.synth = window.speechSynthesis;
        this.voices = [];
        
        // Language-specific data
        this.languageData = {
            en: {
                letters: 'abcdefghijklmnopqrstuvwxyz'.split(''),
                syllables: ['ba', 'be', 'bi', 'bo', 'bu', 'ca', 'ce', 'ci', 'co', 'cu', 
                           'da', 'de', 'di', 'do', 'du', 'fa', 'fe', 'fi', 'fo', 'fu',
                           'ga', 'ge', 'gi', 'go', 'gu', 'ha', 'he', 'hi', 'ho', 'hu',
                           'la', 'le', 'li', 'lo', 'lu', 'ma', 'me', 'mi', 'mo', 'mu',
                           'na', 'ne', 'ni', 'no', 'nu', 'pa', 'pe', 'pi', 'po', 'pu',
                           'ra', 're', 'ri', 'ro', 'ru', 'sa', 'se', 'si', 'so', 'su',
                           'ta', 'te', 'ti', 'to', 'tu', 'va', 've', 'vi', 'vo', 'vu',
                           'wa', 'we', 'wi', 'wo', 'wu', 'ya', 'ye', 'yi', 'yo', 'yu',
                           'za', 'ze', 'zi', 'zo', 'zu'],
                words: ['cat', 'dog', 'hat', 'bat', 'sun', 'moon', 'star', 'tree', 
                       'book', 'pen', 'cup', 'ball', 'fish', 'bird', 'hand', 'foot',
                       'head', 'nose', 'eyes', 'ears', 'baby', 'mama', 'papa', 'home'],
                stories: [
                    {
                        title: 'The Cat',
                        text: 'The cat is big. The cat is red. The cat can run. The cat can jump.'
                    },
                    {
                        title: 'My Family',
                        text: 'I love my mama. I love my papa. We play together. We are happy.'
                    },
                    {
                        title: 'In the Sky',
                        text: 'Look at the sun. Look at the moon. Look at the stars. The sky is beautiful.'
                    }
                ],
                voiceLang: 'en-US'
            },
            fr: {
                letters: 'abcdefghijklmnopqrstuvwxyzàâäéèêëïîôùûüÿæœç'.split(''),
                syllables: ['ba', 'be', 'bi', 'bo', 'bu', 'ca', 'ce', 'ci', 'co', 'cu',
                           'da', 'de', 'di', 'do', 'du', 'fa', 'fe', 'fi', 'fo', 'fu',
                           'ga', 'ge', 'gi', 'go', 'gu', 'ha', 'he', 'hi', 'ho', 'hu',
                           'ja', 'je', 'ji', 'jo', 'ju', 'la', 'le', 'li', 'lo', 'lu',
                           'ma', 'me', 'mi', 'mo', 'mu', 'na', 'ne', 'ni', 'no', 'nu',
                           'pa', 'pe', 'pi', 'po', 'pu', 'ra', 're', 'ri', 'ro', 'ru',
                           'sa', 'se', 'si', 'so', 'su', 'ta', 'te', 'ti', 'to', 'tu',
                           'va', 've', 'vi', 'vo', 'vu', 'wa', 'we', 'wi', 'wo', 'wu',
                           'za', 'ze', 'zi', 'zo', 'zu', 'cha', 'che', 'chi', 'cho', 'chu',
                           'on', 'an', 'en', 'in', 'un', 'ou', 'au', 'eau', 'eu', 'oi'],
                words: ['chat', 'chien', 'maison', 'soleil', 'lune', 'étoile', 'arbre',
                       'livre', 'stylo', 'tasse', 'balle', 'poisson', 'oiseau', 'main',
                       'pied', 'tête', 'nez', 'yeux', 'oreille', 'bébé', 'maman', 'papa', 'école'],
                stories: [
                    {
                        title: 'Le Chat',
                        text: 'Le chat est grand. Le chat est roux. Le chat peut courir. Le chat peut sauter.'
                    },
                    {
                        title: 'Ma Famille',
                        text: 'J\'aime ma maman. J\'aime mon papa. Nous jouons ensemble. Nous sommes heureux.'
                    },
                    {
                        title: 'Dans le Ciel',
                        text: 'Regarde le soleil. Regarde la lune. Regarde les étoiles. Le ciel est magnifique.'
                    }
                ],
                voiceLang: 'fr-FR'
            }
        };

        this.init();
    }

    init() {
        // Wait for voices to load
        if (this.synth.onvoiceschanged !== undefined) {
            this.synth.onvoiceschanged = () => this.loadVoices();
        }
        this.loadVoices();

        // Setup event listeners
        this.setupEventListeners();
        
        // Render initial UI
        this.renderKeyboard();
        this.renderSyllables();
        this.renderWordBank();
        this.renderStorySelect();
        
        // Add keyboard support for physical keyboard
        this.setupKeyboardInput();
    }

    loadVoices() {
        this.voices = this.synth.getVoices();
    }

    setupEventListeners() {
        // Language toggle
        document.getElementById('langBtn').addEventListener('click', () => {
            this.toggleLanguage();
        });

        // Clear button
        document.getElementById('clearBtn').addEventListener('click', () => {
            this.clearAssembly();
        });

        // Story select
        document.getElementById('storySelect').addEventListener('change', (e) => {
            this.displayStory(e.target.value);
        });
    }

    setupKeyboardInput() {
        document.addEventListener('keydown', (e) => {
            const key = e.key.toLowerCase();
            const letters = this.languageData[this.currentLanguage].letters;
            
            if (letters.includes(key)) {
                e.preventDefault();
                this.addToAssembly(key);
                this.playSound(key);
            } else if (e.key === 'Backspace') {
                e.preventDefault();
                this.removeLastLetter();
            } else if (e.key === 'Enter') {
                e.preventDefault();
                this.playAssembledText();
            } else if (e.key === 'Escape') {
                e.preventDefault();
                this.clearAssembly();
            } else if (e.key === ' ') {
                e.preventDefault();
                this.addSpace();
            }
        });
    }

    toggleLanguage() {
        this.currentLanguage = this.currentLanguage === 'en' ? 'fr' : 'en';
        const langBtn = document.getElementById('langBtn');
        
        if (this.currentLanguage === 'fr') {
            langBtn.innerHTML = '<span class="flag">🇫🇷</span> Français';
        } else {
            langBtn.innerHTML = '<span class="flag">🇬🇧</span> English';
        }
        
        langBtn.classList.add('active');
        
        // Re-render UI for new language
        this.renderKeyboard();
        this.renderSyllables();
        this.renderWordBank();
        this.renderStorySelect();
        this.clearAssembly();
    }

    renderKeyboard() {
        const keyboard = document.getElementById('letterKeyboard');
        keyboard.innerHTML = '';
        
        const letters = this.languageData[this.currentLanguage].letters;
        
        letters.forEach(letter => {
            const key = document.createElement('button');
            key.className = 'key';
            key.textContent = letter;
            key.setAttribute('data-letter', letter);
            
            key.addEventListener('click', () => {
                this.addToAssembly(letter);
                this.playSound(letter);
            });
            
            keyboard.appendChild(key);
        });
    }

    renderSyllables() {
        const syllableContainer = document.getElementById('syllableButtons');
        syllableContainer.innerHTML = '';
        
        const syllables = this.languageData[this.currentLanguage].syllables.slice(0, MAX_DISPLAYED_SYLLABLES);
        
        syllables.forEach(syllable => {
            const btn = document.createElement('button');
            btn.className = 'syllable-btn';
            btn.textContent = syllable;
            
            btn.addEventListener('click', () => {
                this.addToAssembly(syllable);
                this.playSound(syllable);
            });
            
            syllableContainer.appendChild(btn);
        });
    }

    renderWordBank() {
        const wordBank = document.getElementById('wordBank');
        wordBank.innerHTML = '';
        
        const words = this.languageData[this.currentLanguage].words;
        
        words.forEach(word => {
            const btn = document.createElement('button');
            btn.className = 'word-btn';
            btn.textContent = word;
            
            btn.addEventListener('click', () => {
                this.playSound(word);
            });
            
            wordBank.appendChild(btn);
        });
    }

    renderStorySelect() {
        const select = document.getElementById('storySelect');
        const stories = this.languageData[this.currentLanguage].stories;
        
        // Clear existing options except the first one
        select.innerHTML = '<option value="">Select a story...</option>';
        
        stories.forEach((story, index) => {
            const option = document.createElement('option');
            option.value = index;
            option.textContent = story.title;
            select.appendChild(option);
        });
        
        // Clear story display
        document.getElementById('storyDisplay').innerHTML = '';
    }

    displayStory(storyIndex) {
        if (storyIndex === '') {
            document.getElementById('storyDisplay').innerHTML = '';
            return;
        }
        
        const story = this.languageData[this.currentLanguage].stories[storyIndex];
        const storyDisplay = document.getElementById('storyDisplay');
        
        // Split text into words and create clickable elements
        const words = story.text.split(/(\s+)/);
        storyDisplay.innerHTML = '';
        
        words.forEach(word => {
            if (word.trim()) {
                const span = document.createElement('span');
                span.className = 'story-word';
                span.textContent = word;
                
                span.addEventListener('click', () => {
                    this.playStoryWord(span, word);
                });
                
                storyDisplay.appendChild(span);
            } else {
                storyDisplay.appendChild(document.createTextNode(word));
            }
        });
    }

    playStoryWord(element, word) {
        element.classList.add('playing');
        this.playSound(word, () => {
            element.classList.remove('playing');
        });
    }

    addToAssembly(text) {
        this.assemblyText.push(text);
        this.updateDisplay();
    }

    addSpace() {
        this.assemblyText.push(' ');
        this.updateDisplay();
    }

    removeLastLetter() {
        if (this.assemblyText.length > 0) {
            this.assemblyText.pop();
            this.updateDisplay();
        }
    }

    clearAssembly() {
        this.assemblyText = [];
        this.updateDisplay();
    }

    updateDisplay() {
        const display = document.getElementById('assemblyDisplay');
        display.innerHTML = '';
        
        this.assemblyText.forEach((item, index) => {
            if (item === ' ') {
                display.appendChild(document.createTextNode(' '));
            } else {
                const span = document.createElement('span');
                span.className = 'letter-item';
                span.textContent = item;
                
                span.addEventListener('click', () => {
                    this.playSound(item);
                });
                
                display.appendChild(span);
            }
        });
    }

    playAssembledText() {
        if (this.assemblyText.length > 0) {
            const text = this.assemblyText.join('');
            this.playSound(text);
        }
    }

    playSound(text, callback) {
        // Cancel any ongoing speech
        this.synth.cancel();
        
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = this.languageData[this.currentLanguage].voiceLang;
        utterance.rate = LEARNING_SPEECH_RATE;
        utterance.pitch = 1.0;
        
        // Try to find a voice for the current language
        const voices = this.voices.filter(voice => 
            voice.lang.startsWith(this.currentLanguage)
        );
        
        if (voices.length > 0) {
            utterance.voice = voices[0];
        }
        
        if (callback) {
            utterance.onend = callback;
        }
        
        this.synth.speak(utterance);
    }
}

// Initialize the app when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        new ReadingCompanion();
    });
} else {
    new ReadingCompanion();
}
