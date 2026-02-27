// Reading Companion - Main Script

// Configuration constants
const LEARNING_SPEECH_RATE = 0.8;

class ReadingCompanion {
    constructor() {
        this.currentLanguage = 'fr';
        this.assemblyText = [];
        this.synth = window.speechSynthesis;
        this.voices = [];
        this.audioContext = null;
        
        // New state for syllable builder
        this.firstBox = '';
        this.secondBox = '';
        this.syllableHistory = [];
        
        // Track currently playing sounds to prevent overlap
        this.currentSoundPromise = Promise.resolve();
        
        // Define vowels for both languages
        this.vowels = {
            en: ['a', 'e', 'i', 'o', 'u'],
            fr: ['a', 'e', 'i', 'o', 'u', 'y', 'é', 'è', 'ê']
        };
        
        // Define complex vowel sounds (digraphs and special combinations)
        this.complexVowels = {
            fr: ['ou', 'au', 'ai', 'oi', 'an', 'en', 'in', 'ain', 'un', 'on', 'io', 'ien', 'ienne', 'er', 'et', 'ez'],
            en: ['ou', 'au', 'ai', 'ei', 'oi', 'oo', 'ee', 'ea']
        };
        
        // Define consonants (letters that are not vowels)
        this.consonants = {
            en: ['b', 'c', 'd', 'f', 'g', 'h', 'j', 'k', 'l', 'm', 'n', 'p', 'q', 'r', 's', 't', 'v', 'w', 'x', 'y', 'z'],
            fr: ['b', 'c', 'd', 'f', 'g', 'h', 'j', 'k', 'l', 'm', 'n', 'p', 'q', 'r', 's', 't', 'v', 'w', 'x', 'z', 'ç']
        };
        
        // Define consonant digraphs
        this.consonantDigraphs = {
            fr: ['ch', 'gn'],
            en: ['ch', 'sh', 'th', 'ph', 'wh']
        };
        
        // Map French letters/sounds to audio files
        this.frenchAudioMap = {
            // Single letters with single sounds
            'a': ['a.wav'],
            'b': ['b.wav'],
            'd': ['d sound.wav'],
            'e': ['e.wav'],
            'f': ['f sound second version.wav'],
            'g': ['g sound.wav'],
            'h': [], // h is silent
            'i': ['i.wav'],
            'j': ['j sound.wav'],
            'l': ['l sound.wav'],
            'm': ['m.wav'],
            'n': ['n.wav'],
            'o': ['o.wav'],
            'p': ['p sound.wav'],
            'r': ['r sound.wav'],
            't': ['t sound.wav'],
            'u': ['u.wav'],
            'v': ['v sound.mp3'],
            'w': ['w sound.mp3'],
            'y': ['y.wav'],
            'z': ['z sound 1.mp3'],
            // Letters with multiple sounds - play both with delay
            'c': ['s sound.wav', 'c sound.wav'],
            // Letters that use c sound
            'k': ['c sound.wav'],
            'q': ['c sound.wav'],
            // Letters that use s sound
            's': ['s sound.wav'],
            'x': ['s sound.wav'],
            // Special characters
            'ç': ['s sound.wav'], // c with cedilla sounds like s
            // Accented vowels (only é, è, ê kept)
            'é': ['é.wav'],
            'è': ['è.wav'],
            'ê': ['ê.wav'],
            // Digraphs and syllables
            'ch': ['ch.wav'],
            'gn': ['gn.wav'],
            'ai': ['ai.wav'],
            'au': ['au.wav'],
            'oi': ['oi.wav'],
            'ou': ['ou.wav'],
            'er': ['er.wav'],
            'et': ['et.wav'],
            'ez': ['ez.wav'],
            // Nasal vowels - combine similar ones
            'an': ['an.wav'],
            'am': ['an.wav'], // same sound as an
            'en': ['en.wav'],
            'em': ['en.wav'], // same sound as en
            'in': ['in.wav'],
            'im': ['in.wav'], // same sound as in
            'ain': ['ain.wav'],
            'ein': ['ain.wav'], // same sound as ain
            'eau': ['au.wav'], // same sound as au
            'un': ['un.wav'],
            'on': ['on.wav'],
            'yn': ['in.wav'], // same as in
            'ym': ['in.wav'], // same as in
            'io': ['io.wav'],
            'ien': ['ien.wav'],
            'ienne': ['ienne.wav']
        };
        
        // Phonics pronunciation maps for French
        this.frenchPhonics = {
            // Single letters - use phonic sounds (not letter names) for reading instruction
            'a': 'ah',
            'b': 'be',
            'c': 'ke',
            'd': 'de',
            'e': 'eu',
            'f': 'fe',
            'g': 'gue',
            'h': ' ',  // h is silent in French, use space
            'i': 'i',
            'j': 'je',
            'k': 'ke',
            'l': 'le',
            'm': 'me',
            'n': 'ne',
            'o': 'o',
            'p': 'pe',
            'q': 'ke',
            'r': 're',
            's': 'se',
            't': 'te',
            'u': 'u',
            'v': 've',
            'w': 've',
            'x': 'xe',
            'y': 'i',
            'z': 'ze',
            // Syllables - phonic spellings to avoid abbreviation pronunciation
            'ba': 'ba',
            'be': 'bé',
            'bi': 'bi',
            'bo': 'bo',
            'bu': 'bu',
            'ca': 'ka',
            'ce': 'se',
            'ci': 'si',
            'co': 'ko',
            'cu': 'ku',
            'da': 'da',
            'de': 'de',
            'di': 'di',
            'do': 'do',
            'du': 'du',
            'fa': 'fa',
            'fe': 'fé',
            'fi': 'fi',
            'fo': 'fo',
            'fu': 'fu',
            'ga': 'ga',
            'ge': 'je',
            'gi': 'ji',
            'go': 'go',
            'gu': 'gu',
            'ha': 'a',
            'he': 'e',
            'hi': 'i',
            'ho': 'o',
            'hu': 'u',
            'ja': 'ja',
            'je': 'je',
            'ji': 'ji',
            'jo': 'jo',
            'ju': 'ju',
            'la': 'la',
            'le': 'le',
            'li': 'li',
            'lo': 'lo',
            'lu': 'lu',
            'ma': 'ma',
            'me': 'me',
            'mi': 'mi',
            'mo': 'mo',
            'mu': 'mu',
            'na': 'na',
            'ne': 'ne',
            'ni': 'ni',
            'no': 'no',
            'nu': 'nu',
            'pa': 'pa',
            'pe': 'pé',
            'pi': 'pi',
            'po': 'po',
            'pu': 'pu',
            'ra': 'ra',
            're': 're',
            'ri': 'ri',
            'ro': 'ro',
            'ru': 'ru',
            'sa': 'sa',
            'se': 'se',
            'si': 'si',
            'so': 'so',
            'su': 'su',
            'ta': 'ta',
            'te': 'te',
            'ti': 'ti',
            'to': 'to',
            'tu': 'tu',
            'va': 'va',
            've': 'vé',
            'vi': 'vi',
            'vo': 'vo',
            'vu': 'vu',
            'wa': 'oua',
            'we': 'oué',
            'wi': 'oui',
            'wo': 'ouo',
            'wu': 'ouu',
            'za': 'za',
            'ze': 'ze',
            'zi': 'zi',
            'zo': 'zo',
            'zu': 'zu',
            'cha': 'cha',
            'che': 'che',
            'chi': 'chi',
            'cho': 'cho',
            'chu': 'chu',
            'on': 'on',
            'an': 'an',
            'en': 'en',
            'in': 'in',
            'un': 'un',
            'ou': 'ou',
            'au': 'o',
            'eau': 'o',
            'eu': 'eu',
            'oi': 'oua'
        };
        
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
                letters: 'abcdefghijklmnopqrstuvwxyzéèêç'.split(''),
                syllables: [
                    // Common consonant-vowel syllables only (no complex sounds/digraphs)
                    'ba', 'be', 'bi', 'bo', 'bu', 'ca', 'ce', 'ci', 'co', 'cu',
                    'da', 'de', 'di', 'do', 'du', 'fa', 'fe', 'fi', 'fo', 'fu',
                    'ga', 'ge', 'gi', 'go', 'gu', 'ha', 'he', 'hi', 'ho', 'hu',
                    'ja', 'je', 'ji', 'jo', 'ju', 'la', 'le', 'li', 'lo', 'lu',
                    'ma', 'me', 'mi', 'mo', 'mu', 'na', 'ne', 'ni', 'no', 'nu',
                    'pa', 'pe', 'pi', 'po', 'pu', 'ra', 're', 'ri', 'ro', 'ru',
                    'sa', 'se', 'si', 'so', 'su', 'ta', 'te', 'ti', 'to', 'tu',
                    'va', 've', 'vi', 'vo', 'vu', 'wa', 'we', 'wi', 'wo', 'wu',
                    'za', 'ze', 'zi', 'zo', 'zu'
                ],
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
        this.renderSyllableBuilder();
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
            this.clearSyllableBuilder();
        });

        // Play button
        document.getElementById('playBtn').addEventListener('click', () => {
            this.playDetectedWords();
        });

        // Story select
        document.getElementById('storySelect').addEventListener('change', (e) => {
            this.displayStory(e.target.value);
        });
    }

    setupKeyboardInput() {
        document.addEventListener('keydown', (e) => {
            const key = e.key.toLowerCase();
            const consonantsList = this.consonants[this.currentLanguage];
            const vowelsList = this.vowels[this.currentLanguage];
            
            if (consonantsList.includes(key)) {
                e.preventDefault();
                this.handleConsonantClick(key);
            } else if (vowelsList.includes(key)) {
                e.preventDefault();
                this.handleVowelClick(key);
            } else if (e.key === 'Escape') {
                e.preventDefault();
                this.clearSyllableBuilder();
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
        this.renderSyllableBuilder();
        this.renderSyllables();
        this.renderWordBank();
        this.renderStorySelect();
        this.clearSyllableBuilder();
    }

    renderSyllableBuilder() {
        const consonantKeyboard = document.getElementById('consonantKeyboard');
        const vowelKeyboard = document.getElementById('vowelKeyboard');
        
        consonantKeyboard.innerHTML = '';
        vowelKeyboard.innerHTML = '';
        
        const consonantsList = this.consonants[this.currentLanguage];
        const consonantDigraphsList = this.consonantDigraphs[this.currentLanguage] || [];
        const vowelsList = this.vowels[this.currentLanguage];
        const complexVowelsList = this.complexVowels[this.currentLanguage] || [];
        
        // Render consonants (including digraphs)
        [...consonantsList, ...consonantDigraphsList].forEach(consonant => {
            const key = document.createElement('button');
            key.className = 'key consonant';
            key.textContent = consonant;
            key.setAttribute('data-letter', consonant);
            
            key.addEventListener('click', () => {
                this.handleConsonantClick(consonant);
            });
            
            consonantKeyboard.appendChild(key);
        });
        
        // Render vowels (simple vowels first, then complex vowels)
        [...vowelsList, ...complexVowelsList].forEach(vowel => {
            const key = document.createElement('button');
            key.className = 'key vowel';
            key.textContent = vowel;
            key.setAttribute('data-letter', vowel);
            
            key.addEventListener('click', () => {
                this.handleVowelClick(vowel);
            });
            
            vowelKeyboard.appendChild(key);
        });
    }
    
    handleConsonantClick(consonant) {
        // Special case: Q writes "Qu" in the box but still shows Q on button
        const boxText = (consonant.toLowerCase() === 'q') ? 'Qu' : consonant;
        this.consonantBox = boxText;
        this.updateBuilderBoxes();
        // Wait for the consonant sound to finish before checking for complete syllable
        this.playSound(consonant, () => {
            this.checkAndCompleteSyllable();
        });
        this.handleLetterClick(boxText);
    }
    
    handleVowelClick(vowel) {
        this.handleLetterClick(vowel);
    }
    
    handleLetterClick(letter) {
        // Put letter in first empty box
        if (!this.firstBox) {
            this.firstBox = letter;
        } else if (!this.secondBox) {
            this.secondBox = letter;
        } else {
            // Both boxes are full, do nothing (or could auto-clear and start over)
            return;
        }
        
        this.updateBuilderBoxes();
        // Wait for the vowel sound to finish before checking for complete syllable
        this.playSound(vowel, () => {
            this.checkAndCompleteSyllable();
        });
        // Capture the promise returned by playSound
        const soundPromise = this.playSound(letter);
        this.checkAndCompleteSyllable(soundPromise);
    }
    
    updateBuilderBoxes() {
        const firstBoxEl = document.getElementById('consonantBox');
        const secondBoxEl = document.getElementById('vowelBox');
        
        firstBoxEl.textContent = this.firstBox;
        secondBoxEl.textContent = this.secondBox;
        
        // Add filled class for animation
        if (this.firstBox) {
            firstBoxEl.classList.add('filled');
            setTimeout(() => firstBoxEl.classList.remove('filled'), 300);
        }
        if (this.secondBox) {
            secondBoxEl.classList.add('filled');
            setTimeout(() => secondBoxEl.classList.remove('filled'), 300);
        }
    }
    
    checkAndCompleteSyllable(letterSoundPromise) {
        // If both boxes are filled, read the syllable and move to history
        if (this.firstBox && this.secondBox) {
            const syllable = this.firstBox + this.secondBox;
            

            // Read the syllable (not spell it) - with a short timeout
            // If audio takes too long, we'll move to history anyway
            const timeoutId = setTimeout(() => {
                // Fallback: if audio hasn't completed in 2 seconds, proceed anyway
                this.syllableHistory.push(syllable);
                this.consonantBox = '';
                this.vowelBox = '';
                this.updateBuilderBoxes();
                this.updateHistoryDisplay();
            }, 2000);
            
            this.playSound(syllable, () => {
                // Clear the fallback timeout since audio completed
                clearTimeout(timeoutId);
                // After reading, move to history and clear boxes
                this.syllableHistory.push(syllable);
                this.consonantBox = '';
                this.vowelBox = '';
                this.updateBuilderBoxes();
                this.updateHistoryDisplay();

            });
        }
    }
    
    updateHistoryDisplay() {
        const historyDisplay = document.getElementById('historyDisplay');
        historyDisplay.innerHTML = '';
        
        this.syllableHistory.forEach((syllable, index) => {
            const span = document.createElement('span');
            span.className = 'history-item';
            span.textContent = syllable;
            
            span.addEventListener('click', () => {
                this.playSound(syllable);
            });
            
            historyDisplay.appendChild(span);
        });
    }
    
    clearSyllableBuilder() {
        this.firstBox = '';
        this.secondBox = '';
        this.syllableHistory = [];
        this.updateBuilderBoxes();
        this.updateHistoryDisplay();
    }

    renderSyllables() {
        const syllableContainer = document.getElementById('syllableButtons');
        syllableContainer.innerHTML = '';
        
        const syllables = this.languageData[this.currentLanguage].syllables;
        
        syllables.forEach(syllable => {
            const btn = document.createElement('button');
            btn.className = 'syllable-btn';
            btn.textContent = syllable;
            
            btn.addEventListener('click', () => {
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

    playDetectedWords() {
        // Check if there's anything in the history
        if (this.syllableHistory.length === 0) {
            return;
        }
        
        // Concatenate all syllables in history to form potential words
        const historyText = this.syllableHistory.join('').toLowerCase();
        
        // Get the word bank for the current language
        const wordBank = this.languageData[this.currentLanguage].words;
        
        // Find matching words
        const detectedWords = [];
        
        // Try to detect words by checking if the history text matches or contains words from the word bank
        // We'll check for exact matches and partial matches
        for (const word of wordBank) {
            if (historyText === word.toLowerCase()) {
                // Exact match
                detectedWords.push({
                    word: word,
                    startIndex: 0,
                    endIndex: this.syllableHistory.length
                });
                break; // If we found an exact match, no need to check further
            }
        }
        
        // If no exact match, try to find words within the history
        if (detectedWords.length === 0) {
            for (const word of wordBank) {
                if (historyText.includes(word.toLowerCase())) {
                    detectedWords.push({
                        word: word,
                        partial: true
                    });
                }
            }
        }
        
        // Play the detected words
        if (detectedWords.length > 0) {
            this.playDetectedWordSequence(detectedWords);
        } else {
            // No words detected, just play the history as is
            this.playSound(historyText);
        }
    }
    
    async playDetectedWordSequence(detectedWords) {
        // Visual feedback - highlight the history items
        const historyItems = document.querySelectorAll('.history-item');
        historyItems.forEach(item => item.classList.add('playing'));
        
        for (let i = 0; i < detectedWords.length; i++) {
            const wordInfo = detectedWords[i];
            await new Promise(resolve => {
                // Ensure resolve is called even if playSound doesn't execute callback
                const timeout = setTimeout(resolve, 5000);
                this.playSound(wordInfo.word, () => {
                    clearTimeout(timeout);
                    resolve();
                });
            });
            
            // Small delay between words
            if (i < detectedWords.length - 1) {
                await this.sleep(500);
            }
        }
        
        // Remove visual feedback
        historyItems.forEach(item => item.classList.remove('playing'));
    }

    playSound(text, callback) {
        // Create a new promise that wraps the audio playback with timeout
        const soundPromise = new Promise((resolve, reject) => {
            let completed = false;
            
            const wrappedCallback = () => {
                if (!completed) {
                    completed = true;
                    if (callback) callback();
                    resolve();
                }
            };
            
            // Timeout fallback to prevent hanging (5 seconds should be enough for any sound)
            const timeoutId = setTimeout(() => {
                if (!completed) {
                    console.warn('Sound playback timed out for:', text);
                    wrappedCallback();
                }
            }, 5000);
            
            // For French, use audio files instead of TTS
            if (this.currentLanguage === 'fr') {
                this.playFrenchAudio(text, () => {
                    clearTimeout(timeoutId);
                    wrappedCallback();
                });
            } else {
                // Use TTS for English
                this.playTTS(text, () => {
                    clearTimeout(timeoutId);
                    wrappedCallback();
                });
            }
        }).catch((error) => {
            // Ensure we don't hang on errors
            console.error('Error playing sound:', error);
            if (callback) callback();
        });
        
        // Chain the promise to ensure sounds play in sequence, not simultaneously
        this.currentSoundPromise = this.currentSoundPromise.then(() => soundPromise).catch(() => soundPromise);
        
        return this.currentSoundPromise;
    }

    async playFrenchAudio(text, callback) {
        const lowerText = text.toLowerCase().trim();
        
        // Check if we have audio files for this text
        if (lowerText in this.frenchAudioMap) {
            const audioFiles = this.frenchAudioMap[lowerText];
            
            // Handle silent letters (empty array)
            if (audioFiles.length === 0) {
                if (callback) callback();
                return;
            }
            
            // Play audio files with delay for multiple sounds
            try {
                await this.playAudioSequence(audioFiles, callback);
            } catch (error) {
                // If audio fails, fallback to TTS or just execute callback
                console.log('Audio playback failed, falling back to TTS');
                this.playTTS(text, callback);
            }
        } else {
            // Fallback to TTS if no audio file available
            this.playTTS(text, callback);
        }
    }

    async playAudioSequence(audioFiles, callback) {
        try {
            for (let i = 0; i < audioFiles.length; i++) {
                await this.playAudioFile(audioFiles[i]);
                
                // Wait 1 second between sounds for multi-sound letters
                if (i < audioFiles.length - 1) {
                    await this.sleep(1000);
                }
            }
            
            if (callback) callback();
        } catch (error) {
            // Ensure callback is called even if audio fails
            console.error('Error in audio sequence:', error);
            if (callback) callback();
        }
    }

    playAudioFile(filename) {
        return new Promise((resolve, reject) => {
            const audioPath = `phonetic/${filename}`;
            const audio = new Audio(audioPath);
            
            audio.onended = () => resolve();
            audio.onerror = (e) => {
                console.error(`Error loading audio file: ${audioPath}. Please check if the file exists in the phonetic directory.`, e);
                reject(e);
            };
            
            audio.play().catch(e => {
                console.error(`Failed to play audio file: ${audioPath}. This may be due to browser autoplay policies or missing file.`, e);
                reject(e);
            });
        });
    }

    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    playTTS(text, callback) {
        // Cancel any ongoing speech
        this.synth.cancel();
        
        // Apply French phonics mapping if in French mode
        let speechText = text;
        if (this.currentLanguage === 'fr') {
            const lowerText = text.toLowerCase().trim();
            // Check if we have a phonic mapping for this text
            if (lowerText in this.frenchPhonics) {
                speechText = this.frenchPhonics[lowerText];
            }
        }
        
        const utterance = new SpeechSynthesisUtterance(speechText);
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
            utterance.onerror = callback; // Ensure callback is called even on error
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
