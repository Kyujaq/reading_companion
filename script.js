// Reading Companion - Main Script

// Configuration constants
const LEARNING_SPEECH_RATE = 0.8;
const GUIDED_EXAMPLE_ROTATION_MS = 6000;
const CELEBRATION_EMOJI_COUNT = 8;

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
        
        // Uppercase/lowercase state
        this.useUppercase = false;
        
        // Word builder state
        this.wordBuilderSyllables = [];
        
        // Guided example rotation
        this.guidedExampleIndex = 0;
        this.guidedExampleTimer = null;
        
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
        
        // Phonetic sound hints for letter keys
        this.phoneticHints = {
            en: {
                'a': 'ah', 'b': 'buh', 'c': 'kuh', 'd': 'duh', 'e': 'eh',
                'f': 'fuh', 'g': 'guh', 'h': 'huh', 'i': 'ih', 'j': 'juh',
                'k': 'kuh', 'l': 'luh', 'm': 'muh', 'n': 'nuh', 'o': 'oh',
                'p': 'puh', 'q': 'kwuh', 'r': 'ruh', 's': 'sss', 't': 'tuh',
                'u': 'uh', 'v': 'vuh', 'w': 'wuh', 'x': 'ks', 'y': 'yuh', 'z': 'zzz',
                'ch': 'chuh', 'sh': 'shh', 'th': 'thh', 'ph': 'fuh', 'wh': 'wuh',
                'ou': 'ow', 'au': 'aw', 'ai': 'ay', 'ei': 'ee', 'oi': 'oy',
                'oo': 'ooh', 'ee': 'eeh', 'ea': 'eeh'
            },
            fr: {
                'a': 'ah', 'b': 'be', 'c': 'ke', 'd': 'de', 'e': 'eu',
                'f': 'fe', 'g': 'gue', 'h': '...', 'i': 'ee', 'j': 'je',
                'k': 'ke', 'l': 'le', 'm': 'me', 'n': 'ne', 'o': 'oh',
                'p': 'pe', 'q': 'ke', 'r': 're', 's': 'se', 't': 'te',
                'u': 'uu', 'v': 've', 'w': 've', 'x': 'ks', 'y': 'ee', 'z': 'ze',
                'é': 'ay', 'è': 'eh', 'ê': 'eh', 'ç': 'se',
                'ch': 'che', 'gn': 'nye',
                'ou': 'oo', 'au': 'oh', 'ai': 'eh', 'oi': 'wa',
                'an': 'ã', 'en': 'ã', 'in': 'ẽ', 'ain': 'ẽ', 'un': 'œ̃', 'on': 'õ',
                'io': 'yo', 'ien': 'yẽ', 'ienne': 'yen', 'er': 'ay', 'et': 'ay', 'ez': 'ay'
            }
        };
        
        // Guided examples for each language
        this.guidedExamples = {
            en: [
                '💡 Try: B + A = BA', '💡 Try: M + A = MA', '💡 Try: D + O = DO',
                '💡 Try: S + I = SI', '💡 Try: C + A = CA', '💡 Try: P + A = PA'
            ],
            fr: [
                '💡 Essaie : B + A = BA', '💡 Essaie : M + A = MA', '💡 Essaie : F + A = FA',
                '💡 Essaie : P + I = PI', '💡 Essaie : L + U = LU', '💡 Essaie : S + O = SO'
            ]
        };
        
        // Syllable breakdowns for words (improvement #7)
        this.wordSyllables = {
            en: {
                'cat': ['cat'], 'dog': ['dog'], 'hat': ['hat'], 'bat': ['bat'],
                'sun': ['sun'], 'moon': ['moon'], 'star': ['star'], 'tree': ['tree'],
                'book': ['book'], 'pen': ['pen'], 'cup': ['cup'], 'ball': ['ball'],
                'fish': ['fish'], 'bird': ['bird'], 'hand': ['hand'], 'foot': ['foot'],
                'head': ['head'], 'nose': ['nose'], 'eyes': ['eyes'], 'ears': ['ears'],
                'baby': ['ba', 'by'], 'mama': ['ma', 'ma'], 'papa': ['pa', 'pa'], 'home': ['home'],
                'bike': ['bike'], 'cake': ['cake'], 'game': ['game'], 'name': ['name'],
                'rose': ['rose'], 'lake': ['lake'], 'duck': ['duck'], 'frog': ['frog'],
                'milk': ['milk'], 'rice': ['rice'], 'soup': ['soup'], 'rain': ['rain']
            },
            fr: {
                'chat': ['chat'], 'chien': ['chien'], 'maison': ['mai', 'son'],
                'soleil': ['so', 'leil'], 'lune': ['lu', 'ne'], 'étoile': ['é', 'toi', 'le'],
                'arbre': ['ar', 'bre'], 'livre': ['li', 'vre'], 'stylo': ['sty', 'lo'],
                'tasse': ['ta', 'sse'], 'balle': ['ba', 'lle'], 'poisson': ['poi', 'sson'],
                'oiseau': ['oi', 'seau'], 'main': ['main'], 'pied': ['pied'],
                'tête': ['tê', 'te'], 'nez': ['nez'], 'yeux': ['yeux'],
                'oreille': ['o', 'rei', 'lle'], 'bébé': ['bé', 'bé'],
                'maman': ['ma', 'man'], 'papa': ['pa', 'pa'], 'école': ['é', 'co', 'le'],
                'vélo': ['vé', 'lo'], 'jupe': ['ju', 'pe'], 'robe': ['ro', 'be'],
                'fête': ['fê', 'te'], 'lait': ['lait'], 'eau': ['eau'],
                'pain': ['pain'], 'riz': ['riz'], 'soupe': ['sou', 'pe'],
                'pluie': ['pluie'], 'vent': ['vent'], 'ciel': ['ciel'],
                'fleur': ['fleur'], 'jour': ['jour'], 'nuit': ['nuit']
            }
        };
        
        // Word builder guided words (syllable combos that make words)
        this.wordBuilderGuides = {
            en: [
                { syllables: ['ma', 'ma'], word: 'mama' },
                { syllables: ['pa', 'pa'], word: 'papa' },
                { syllables: ['ba', 'by'], word: 'baby' }
            ],
            fr: [
                { syllables: ['ma', 'ma'], word: 'mama' },
                { syllables: ['pa', 'pa'], word: 'papa' },
                { syllables: ['bé', 'bé'], word: 'bébé' },
                { syllables: ['vé', 'lo'], word: 'vélo' },
                { syllables: ['ju', 'pe'], word: 'jupe' },
                { syllables: ['ro', 'be'], word: 'robe' },
                { syllables: ['é', 'co', 'le'], word: 'école' }
            ]
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
                       'head', 'nose', 'eyes', 'ears', 'baby', 'mama', 'papa', 'home',
                       'bike', 'cake', 'game', 'name', 'rose', 'lake', 'duck', 'frog',
                       'milk', 'rice', 'soup', 'rain'],
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
                       'pied', 'tête', 'nez', 'yeux', 'oreille', 'bébé', 'maman', 'papa', 'école',
                       'vélo', 'jupe', 'robe', 'fête', 'lait', 'eau',
                       'pain', 'riz', 'soupe', 'pluie', 'vent', 'ciel',
                       'fleur', 'jour', 'nuit'],
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
        this.renderAlphabetStrip();
        this.renderSyllableBuilder();
        this.renderSyllables();
        this.renderWordBuilder();
        this.renderWordBank();
        this.renderStorySelect();
        
        // Start guided examples
        this.startGuidedExamples();
        
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
        
        // Uppercase/lowercase toggle
        document.getElementById('caseToggleBtn').addEventListener('click', () => {
            this.toggleCase();
        });
        
        // Word builder controls
        document.getElementById('wordBuilderPlayBtn').addEventListener('click', () => {
            this.playWordBuilder();
        });
        document.getElementById('wordBuilderClearBtn').addEventListener('click', () => {
            this.clearWordBuilder();
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
        this.renderAlphabetStrip();
        this.renderSyllableBuilder();
        this.renderSyllables();
        this.renderWordBuilder();
        this.renderWordBank();
        this.renderStorySelect();
        this.clearSyllableBuilder();
        this.startGuidedExamples();
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
        const hints = this.phoneticHints[this.currentLanguage] || {};
        
        // Render consonants (including digraphs)
        [...consonantsList, ...consonantDigraphsList].forEach(consonant => {
            const key = document.createElement('button');
            key.className = 'key consonant';
            const displayText = this.applyCase(consonant);
            const hint = hints[consonant] || '';
            key.innerHTML = `<span>${displayText}</span>${hint ? `<span class="phonetic-hint">${hint}</span>` : ''}`;
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
            const displayText = this.applyCase(vowel);
            const hint = hints[vowel] || '';
            key.innerHTML = `<span>${displayText}</span>${hint ? `<span class="phonetic-hint">${hint}</span>` : ''}`;
            key.setAttribute('data-letter', vowel);
            
            key.addEventListener('click', () => {
                this.handleVowelClick(vowel);
            });
            
            vowelKeyboard.appendChild(key);
        });
    }
    
    handleConsonantClick(consonant) {
        // Notify instruction mode manager first
        if (window.instructionModeManager && window.instructionModeManager.active) {
            window.instructionModeManager.handleLetterInput(consonant);
        }
        // Special case: Q writes "Qu" in the box but still shows Q on button
        const boxText = (consonant.toLowerCase() === 'q') ? 'Qu' : consonant;
        
        // Put in first empty box
        if (!this.firstBox) {
            this.firstBox = boxText;
        } else if (!this.secondBox) {
            this.secondBox = boxText;
        } else {
            return;
        }
        
        this.updateBuilderBoxes();
        // Play the consonant sound, then check if syllable is complete
        const soundPromise = this.playSound(consonant);
        this.checkAndCompleteSyllable(soundPromise);
    }
    
    handleVowelClick(vowel) {
        // Notify instruction mode manager first
        if (window.instructionModeManager && window.instructionModeManager.active) {
            window.instructionModeManager.handleLetterInput(vowel);
        }
        
        // Put in first empty box
        if (!this.firstBox) {
            this.firstBox = vowel;
        } else if (!this.secondBox) {
            this.secondBox = vowel;
        } else {
            return;
        }
        
        this.updateBuilderBoxes();
        // Play the vowel sound, then check if syllable is complete
        const soundPromise = this.playSound(vowel);
        this.checkAndCompleteSyllable(soundPromise);
    }
    
    updateBuilderBoxes() {
        const firstBoxEl = document.getElementById('consonantBox');
        const secondBoxEl = document.getElementById('vowelBox');
        const resultBoxEl = document.getElementById('resultBox');
        
        firstBoxEl.textContent = this.applyCase(this.firstBox);
        secondBoxEl.textContent = this.applyCase(this.secondBox);
        
        // Show result when both boxes are filled
        if (this.firstBox && this.secondBox) {
            resultBoxEl.textContent = this.applyCase(this.firstBox + this.secondBox);
        } else {
            resultBoxEl.textContent = '';
        }
        
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
            
            // Wait for the letter sound to complete before playing the syllable
            if (letterSoundPromise && typeof letterSoundPromise.then === 'function') {
                letterSoundPromise.then(() => {
                    // Small delay to create clear separation between letter sound and syllable sound
                    setTimeout(() => {
                        // Fallback timeout in case audio takes too long
                        const timeoutId = setTimeout(() => {
                            this.syllableHistory.push(syllable);
                            this.firstBox = '';
                            this.secondBox = '';
                            this.updateBuilderBoxes();
                            this.updateHistoryDisplay();
                            this.triggerCelebration();
                            this.checkAutoWordDetection();
                        }, 2000);
                        
                        this.playSound(syllable, () => {
                            clearTimeout(timeoutId);
                            this.syllableHistory.push(syllable);
                            this.firstBox = '';
                            this.secondBox = '';
                            this.updateBuilderBoxes();
                            this.updateHistoryDisplay();
                            this.triggerCelebration();
                            this.checkAutoWordDetection();
                        });
                    }, 300);
                });
            }
        }
    }
    
    updateHistoryDisplay() {
        const historyDisplay = document.getElementById('historyDisplay');
        historyDisplay.innerHTML = '';
        
        this.syllableHistory.forEach((syllable, index) => {
            if (index > 0) {
                const plus = document.createElement('span');
                plus.className = 'history-plus';
                plus.textContent = '+';
                historyDisplay.appendChild(plus);
            }
            
            const span = document.createElement('span');
            span.className = 'history-item';
            span.textContent = this.applyCase(syllable);
            
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
            btn.textContent = this.applyCase(syllable);
            
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
        const syllableMap = this.wordSyllables[this.currentLanguage] || {};
        
        words.forEach(word => {
            const btn = document.createElement('button');
            btn.className = 'word-btn';
            
            const syllables = syllableMap[word];
            const displayWord = this.applyCase(word);
            
            if (syllables && syllables.length > 1) {
                const breakdown = syllables.map(s => this.applyCase(s)).join('·');
                btn.innerHTML = `<span>${displayWord}</span><span class="syllable-breakdown">${breakdown}</span>`;
            } else {
                btn.textContent = displayWord;
            }
            
            btn.addEventListener('click', () => {
                this.playSound(word);
            });
            
            wordBank.appendChild(btn);
        });
    }

    // === NEW METHODS FOR IMPROVEMENTS ===
    
    // Improvement #2: Uppercase/lowercase toggle
    toggleCase() {
        this.useUppercase = !this.useUppercase;
        const btn = document.getElementById('caseToggleBtn');
        btn.classList.toggle('uppercase', this.useUppercase);
        btn.textContent = this.useUppercase ? 'AA' : 'Aa';
        
        // Re-render affected components
        this.renderAlphabetStrip();
        this.renderSyllableBuilder();
        this.renderSyllables();
        this.renderWordBuilder();
        this.renderWordBank();
        this.updateBuilderBoxes();
        this.updateHistoryDisplay();
    }
    
    applyCase(text) {
        if (!text) return text;
        return this.useUppercase ? text.toUpperCase() : text;
    }
    
    // Improvement #10: Alphabet reference strip
    renderAlphabetStrip() {
        const strip = document.getElementById('alphabetStrip');
        strip.innerHTML = '';
        
        const vowelsList = this.vowels[this.currentLanguage];
        const consonantsList = this.consonants[this.currentLanguage];
        const hints = this.phoneticHints[this.currentLanguage] || {};
        const allLetters = this.languageData[this.currentLanguage].letters;
        
        allLetters.forEach(letter => {
            const el = document.createElement('div');
            const isVowel = vowelsList.includes(letter);
            el.className = `alphabet-letter ${isVowel ? 'vowel-letter' : 'consonant-letter'}`;
            
            const charSpan = document.createElement('span');
            charSpan.className = 'letter-char';
            charSpan.textContent = this.applyCase(letter);
            
            const soundSpan = document.createElement('span');
            soundSpan.className = 'letter-sound';
            soundSpan.textContent = hints[letter] || '';
            
            el.appendChild(charSpan);
            el.appendChild(soundSpan);
            
            el.addEventListener('click', () => {
                // Notify instruction mode manager
                if (window.instructionModeManager && window.instructionModeManager.active) {
                    window.instructionModeManager.handleLetterInput(letter);
                }
                el.classList.add('playing');
                this.playSound(letter, () => {
                    el.classList.remove('playing');
                });
            });
            
            strip.appendChild(el);
        });
    }
    
    // Improvement #4: Guided example prompts
    startGuidedExamples() {
        if (this.guidedExampleTimer) {
            clearInterval(this.guidedExampleTimer);
        }
        
        this.guidedExampleIndex = 0;
        this.showGuidedExample();
        
        this.guidedExampleTimer = setInterval(() => {
            this.guidedExampleIndex++;
            this.showGuidedExample();
        }, GUIDED_EXAMPLE_ROTATION_MS);
    }
    
    showGuidedExample() {
        const el = document.getElementById('guidedExample');
        const examples = this.guidedExamples[this.currentLanguage];
        const index = this.guidedExampleIndex % examples.length;
        el.textContent = examples[index];
        el.style.animation = 'none';
        // Force reflow
        void el.offsetHeight;
        el.style.animation = 'fadeInExample 0.5s ease-in';
    }
    
    // Improvement #5: Celebration animations
    triggerCelebration() {
        const overlay = document.getElementById('celebrationOverlay');
        const emojis = ['⭐', '🌟', '✨', '🎉', '👏', '🏆'];
        const count = CELEBRATION_EMOJI_COUNT;
        
        for (let i = 0; i < count; i++) {
            const star = document.createElement('span');
            star.className = 'celebration-star';
            star.textContent = emojis[Math.floor(Math.random() * emojis.length)];
            star.style.left = `${15 + Math.random() * 70}%`;
            star.style.top = `${20 + Math.random() * 40}%`;
            star.style.animationDelay = `${Math.random() * 0.3}s`;
            overlay.appendChild(star);
        }
        
        // Clean up after animation
        setTimeout(() => {
            overlay.innerHTML = '';
        }, 1600);
    }
    
    // Improvement #6: Word Builder from syllables
    renderWordBuilder() {
        const syllablesContainer = document.getElementById('wordBuilderSyllables');
        const exampleEl = document.getElementById('wordBuilderExample');
        syllablesContainer.innerHTML = '';
        
        // Show an example
        const guides = this.wordBuilderGuides[this.currentLanguage];
        if (guides.length > 0) {
            const guide = guides[Math.floor(Math.random() * guides.length)];
            const parts = guide.syllables.map(s => this.applyCase(s)).join(' + ');
            exampleEl.textContent = `💡 ${parts} = ${this.applyCase(guide.word)}`;
        }
        
        // Get unique syllables from all guided words
        const syllableSet = new Set();
        guides.forEach(g => g.syllables.forEach(s => syllableSet.add(s)));
        
        // Also add common syllables from the language data
        const commonSyllables = this.languageData[this.currentLanguage].syllables.slice(0, 20);
        commonSyllables.forEach(s => syllableSet.add(s));
        
        syllableSet.forEach(syllable => {
            const btn = document.createElement('button');
            btn.className = 'syllable-btn';
            btn.textContent = this.applyCase(syllable);
            
            btn.addEventListener('click', () => {
                this.addToWordBuilder(syllable);
                this.playSound(syllable);
            });
            
            syllablesContainer.appendChild(btn);
        });
        
        this.updateWordBuilderDisplay();
    }
    
    addToWordBuilder(syllable) {
        this.wordBuilderSyllables.push(syllable);
        this.updateWordBuilderDisplay();
        this.checkWordBuilderMatch();
    }
    
    updateWordBuilderDisplay() {
        const slotsEl = document.getElementById('wordBuilderSlots');
        slotsEl.innerHTML = '';
        
        if (this.wordBuilderSyllables.length === 0) {
            slotsEl.innerHTML = `<span class="wb-placeholder">${this.currentLanguage === 'fr' ? 'Clique sur les syllabes pour construire un mot' : 'Click syllables to build a word'}</span>`;
            return;
        }
        
        this.wordBuilderSyllables.forEach((syllable, index) => {
            if (index > 0) {
                const plus = document.createElement('span');
                plus.className = 'wb-plus';
                plus.textContent = '+';
                slotsEl.appendChild(plus);
            }
            
            const span = document.createElement('span');
            span.className = 'wb-syllable';
            span.textContent = this.applyCase(syllable);
            span.title = this.currentLanguage === 'fr' ? 'Clique pour retirer' : 'Click to remove';
            span.addEventListener('click', () => {
                this.wordBuilderSyllables.splice(index, 1);
                this.updateWordBuilderDisplay();
                this.checkWordBuilderMatch();
            });
            slotsEl.appendChild(span);
        });
    }
    
    checkWordBuilderMatch() {
        const resultEl = document.getElementById('wordBuilderResult');
        const combined = this.wordBuilderSyllables.join('').toLowerCase();
        const words = this.languageData[this.currentLanguage].words;
        
        const match = words.find(w => w.toLowerCase() === combined);
        if (match) {
            resultEl.textContent = `🎉 ${this.applyCase(match)} !`;
            this.triggerCelebration();
            this.playSound(match);
        } else {
            resultEl.textContent = '';
        }
    }
    
    playWordBuilder() {
        if (this.wordBuilderSyllables.length === 0) return;
        const combined = this.wordBuilderSyllables.join('');
        this.playSound(combined);
    }
    
    clearWordBuilder() {
        this.wordBuilderSyllables = [];
        this.updateWordBuilderDisplay();
        document.getElementById('wordBuilderResult').textContent = '';
    }
    
    // Improvement #8: Auto word detection in history
    checkAutoWordDetection() {
        if (this.syllableHistory.length === 0) return;
        
        const historyText = this.syllableHistory.join('').toLowerCase();
        const words = this.languageData[this.currentLanguage].words;
        
        const match = words.find(w => w.toLowerCase() === historyText);
        if (match) {
            // Highlight all history items
            const historyItems = document.querySelectorAll('.history-item');
            historyItems.forEach(item => item.classList.add('word-detected'));
            
            // Announce the detected word after a short delay
            setTimeout(() => {
                this.triggerCelebration();
                this.playSound(match);
            }, 500);
        }
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

// Initialize the app — DOM elements are available since this script is at the end of body
window.readingCompanionApp = new ReadingCompanion();
