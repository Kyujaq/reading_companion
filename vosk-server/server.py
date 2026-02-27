#!/usr/bin/env python3
"""
Vosk WebSocket Speech Recognition Server
Receives PCM 16-bit 16kHz mono audio from the browser and returns Vosk results.
"""

import asyncio
import json
import logging
import os
import sys

import numpy as np
import websockets
from vosk import KaldiRecognizer, Model, SetLogLevel

# ── Configuration ─────────────────────────────────────────────────────────────
HOST = "localhost"
PORT = 2700
SAMPLE_RATE = 16000
MODELS_DIR = os.path.join(os.path.dirname(__file__), "models")

SetLogLevel(-1)
logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
log = logging.getLogger(__name__)


def load_model(lang: str = "fr") -> Model:
    """Load Vosk model from models/<lang>/."""
    model_path = os.path.join(MODELS_DIR, lang)
    if not os.path.isdir(model_path):
        log.error(
            "Model not found at %s. See README.md for download instructions.", model_path
        )
        sys.exit(1)
    log.info("Loading Vosk model from %s …", model_path)
    return Model(model_path)


async def recognize(websocket):
    """Handle one browser WebSocket connection."""
    remote = websocket.remote_address
    log.info("Client connected: %s", remote)

    # Default to French model; switch when client sends a config message
    lang = "fr"
    if not os.path.isdir(os.path.join(MODELS_DIR, lang)):
        lang = "en"
    try:
        model = load_model(lang)
    except SystemExit:
        await websocket.send(json.dumps({"error": "Model not found. See vosk-server/README.md."}))
        return

    rec = KaldiRecognizer(model, SAMPLE_RATE)
    rec.SetWords(True)

    phoneme_mode = False

    try:
        async for message in websocket:
            if isinstance(message, str):
                # Control / config message from browser
                try:
                    cfg = json.loads(message)
                except json.JSONDecodeError:
                    continue

                if "grammar" in cfg:
                    # Rebuild recognizer with constrained grammar
                    grammar_json = json.dumps(cfg["grammar"])
                    rec = KaldiRecognizer(model, SAMPLE_RATE, grammar_json)
                    log.debug("Grammar updated: %s", cfg["grammar"])

                if "config" in cfg:
                    config = cfg["config"]
                    if "phoneme_mode" in config:
                        new_phoneme_mode = bool(config["phoneme_mode"])
                        if new_phoneme_mode != phoneme_mode:
                            phoneme_mode = new_phoneme_mode
                            rec = KaldiRecognizer(model, SAMPLE_RATE)
                            rec.SetWords(True)
                            log.info("Phoneme mode: %s", phoneme_mode)

                if "lang" in cfg:
                    new_lang = cfg["lang"]
                    new_path = os.path.join(MODELS_DIR, new_lang)
                    if os.path.isdir(new_path):
                        model = Model(new_path)
                        rec = KaldiRecognizer(model, SAMPLE_RATE)
                        lang = new_lang
                        log.info("Switched to language model: %s", new_lang)
                    else:
                        log.warning("Model for lang '%s' not found, keeping current.", new_lang)

            elif isinstance(message, bytes):
                # Raw PCM 16-bit little-endian frames from the browser
                if rec.AcceptWaveform(message):
                    result = json.loads(rec.Result())
                    if phoneme_mode:
                        # Extract word-level results and send as phoneme data
                        words = result.get("result", [])
                        if words:
                            phoneme_text = words[0].get("word", "")
                            confidence = words[0].get("conf", 0.0)
                            await websocket.send(json.dumps({
                                "phoneme": phoneme_text,
                                "confidence": confidence,
                                "text": result.get("text", "")
                            }))
                        else:
                            await websocket.send(json.dumps({
                                "phoneme": result.get("text", ""),
                                "confidence": 1.0,
                                "text": result.get("text", "")
                            }))
                    else:
                        await websocket.send(json.dumps({"text": result.get("text", "")}))
                else:
                    partial = json.loads(rec.PartialResult())
                    await websocket.send(json.dumps({"partial": partial.get("partial", "")}))

    except websockets.exceptions.ConnectionClosedOK:
        pass
    except websockets.exceptions.ConnectionClosedError as exc:
        log.warning("Connection closed with error: %s", exc)
    finally:
        log.info("Client disconnected: %s", remote)


async def main():
    log.info("Starting Vosk WebSocket server on ws://%s:%d", HOST, PORT)
    async with websockets.serve(recognize, HOST, PORT):
        await asyncio.Future()  # run forever


if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        log.info("Server stopped.")
