# Reading Companion

An interactive web-based tool designed to help children learn to read in both English and French. The application provides audio feedback for letters, syllables, words, and stories, supporting both keyboard and touch screen input.

## Features

### 🔤 Letter Sound Playback
- Interactive keyboard with all letters
- Click or tap any letter to hear its pronunciation
- Physical keyboard support - type letters directly
- French mode includes accented characters (à, é, è, ê, ë, ï, î, ô, ù, û, ü, ÿ, æ, œ, ç)

### 🔊 Syllable Assembly
- Pre-built common syllables for quick access
- Click syllables to hear their pronunciation
- Build words by combining syllables and letters

### 📝 Word Assembly
- Assemble letters and syllables into words
- Visual display of assembled text
- Click assembled letters to replay their sounds
- Clear button to start over
- Backspace support for corrections

### 📚 Word Bank
- Curated collection of common words
- Click any word to hear it pronounced
- Different vocabulary for English and French modes

### 📖 Story Bank
- Interactive stories with clickable words
- Click any word in the story to hear it
- Visual feedback when a word is playing
- Multiple stories in each language

### 🌍 Bilingual Support
- Switch between English and French with one click
- Language-specific phonetics and pronunciation
- Separate content for each language

### 📱 Touch & Keyboard Friendly
- Responsive design works on all screen sizes
- Large, touch-friendly buttons
- Full keyboard navigation support
- Optimized for tablets and touchscreens

## How to Use

1. **Open** `index.html` in a modern web browser
2. **Select** your language (English/French) using the toggle button
3. **Click** letters to build words and hear sounds
4. **Use** the syllable buttons for quick word building
5. **Try** words from the word bank
6. **Explore** stories by selecting from the dropdown

### Keyboard Shortcuts
- **Letter keys (a-z)**: Add letter to assembly
- **Spacebar**: Add space
- **Enter**: Play assembled text
- **Backspace**: Remove last letter
- **Escape**: Clear all

## Technical Details

### Technology Stack
- **HTML5**: Semantic markup
- **CSS3**: Modern responsive design with gradients and animations
- **JavaScript (ES6+)**: Object-oriented programming with classes
- **Web Speech API**: Text-to-speech functionality

### Browser Requirements
- Modern browser with Web Speech API support
  - Chrome 33+
  - Edge 14+
  - Safari 7+
  - Firefox 49+

### Features
- No external dependencies
- Works offline once loaded
- No server required
- Pure client-side application

## Running the Application

### Option 1: Direct File Open
Simply open `index.html` in your web browser.

### Option 2: Local Server
For the best experience, use a local web server:

```bash
# Using Python 3
python3 -m http.server 8000

# Using Node.js (with http-server)
npx http-server

# Using PHP
php -S localhost:8000
```

Then navigate to `http://localhost:8000` in your browser.

## Customization

### Adding More Words
Edit `script.js` and modify the `languageData` object:

```javascript
words: ['word1', 'word2', 'word3', ...]
```

### Adding More Stories
Add stories to the `stories` array in `languageData`:

```javascript
stories: [
    {
        title: 'Story Title',
        text: 'Story content here. Each word can be clicked.'
    }
]
```

### Modifying Syllables
Update the `syllables` array for each language in `script.js`.

## Accessibility

- Keyboard navigation throughout
- Clear visual feedback
- Large, easy-to-click targets
- High contrast color scheme
- Touch-friendly interface

## License

Open source - free to use and modify.

## Contributing

Feel free to submit issues and enhancement requests!