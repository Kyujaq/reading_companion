# Vosk WebSocket Server — Setup Guide

This server provides offline speech recognition (STT) for the Reading Companion app.
The app works perfectly without it, but when the server is running the Instruction Mode
gains voice input support so children can speak letters/words as well as pressing buttons.

## Requirements

- Python 3.8 or newer
- A Vosk acoustic model for the desired language(s)

## Step-by-step Setup

### 1. Download a Vosk model

**French (recommended — ~40 MB):**
```
https://alphacephei.com/vosk/models/vosk-model-small-fr-0.22.zip
```
Extract and rename the folder to: `vosk-server/models/fr/`

**English (recommended — ~40 MB):**
```
https://alphacephei.com/vosk/models/vosk-model-small-en-us-0.15.zip
```
Extract and rename the folder to: `vosk-server/models/en/`

The expected directory structure is:
```
vosk-server/
├── models/
│   ├── fr/          ← French model contents here
│   │   ├── am/
│   │   ├── conf/
│   │   └── ...
│   └── en/          ← English model contents here
│       ├── am/
│       ├── conf/
│       └── ...
├── server.py
├── requirements.txt
└── README.md
```

### 2. Install Python dependencies

```bash
cd vosk-server
pip install -r requirements.txt
```

### 3. Start the server

```bash
python server.py
```

The server listens on `ws://localhost:2700`.

### 4. Open the app

Open `index.html` in your browser.  The app will automatically detect the Vosk server
and show a 🎤 microphone indicator in the Instruction Mode panel when a session is active.

## Protocol

The browser sends:

| Message type | Contents | Purpose |
|---|---|---|
| Binary frame | PCM 16-bit LE, 16 kHz mono | Audio data |
| JSON string | `{"grammar": ["v", "é", "[unk]"]}` | Set recognition grammar |
| JSON string | `{"lang": "en"}` | Switch language model |

The server replies:

| JSON | Meaning |
|---|---|
| `{"text": "vé"}` | Final recognition result |
| `{"partial": "v"}` | Partial (interim) result |

## Troubleshooting

- **"Model not found"** — make sure the model folder is in the correct path (see above).
- **Port already in use** — change `PORT` at the top of `server.py`.
- **No audio detected** — check browser microphone permissions.
- **Low accuracy** — try a larger Vosk model (see https://alphacephei.com/vosk/models).
