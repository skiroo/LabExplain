"""
Fichier : ollama_client.py
Dossier : backend/ai/
Description :
    Client HTTP bas-niveau vers le service Ollama local.
    Ce module est le seul point de contact avec l'API Ollama.
    Compatible Gemma 4 (modèle multimodal — API /api/chat standard).
"""

import json
import logging
from typing import Generator

import requests

from config import Config

logger = logging.getLogger("backend.ai.ollama_client")


# ── Exceptions ────────────────────────────────────────────────────────────────

class OllamaUnavailableError(Exception):
    """Ollama non joignable — HTTP 503."""


class OllamaModelError(Exception):
    """Ollama répond mais retourne une erreur de modèle — HTTP 500."""


# ── Helpers ───────────────────────────────────────────────────────────────────

def _get_model() -> str:
    return Config.OLLAMA_MODEL


def _build_messages(system: str, user: str) -> list:
    return [
        {"role": "system", "content": system},
        {"role": "user",   "content": user},
    ]


def _build_payload(messages: list, model: str, stream: bool) -> dict:
    """
    Construit le payload Ollama.
    Gemma 4 supporte l'API /api/chat standard sans options spéciales.
    On désactive num_ctx élevé pour éviter les OOM sur petites configs.
    """
    return {
        "model":    model,
        "messages": messages,
        "stream":   stream,
        "options": {
            # Limite le contexte à 4096 tokens — suffisant pour les résumés médicaux
            # et évite les erreurs mémoire sur les machines avec peu de VRAM
            "num_ctx": 4096,
        },
    }


# ── Appel synchrone ───────────────────────────────────────────────────────────

def send_prompt(
    system: str = None,
    user: str = None,
    messages: list = None,
    model: str = None,
) -> str:
    """
    Envoie un prompt à Ollama et attend la réponse complète.
    Compatible avec Gemma 4 (gemma3:4b).
    """
    url = f"{Config.OLLAMA_BASE_URL}/api/chat"

    if messages is not None:
        chat_messages = messages
    else:
        if system is None or user is None:
            raise ValueError("Fournir 'system' et 'user', ou une liste 'messages'.")
        chat_messages = _build_messages(system, user)

    selected_model = model or _get_model()
    payload = _build_payload(chat_messages, selected_model, stream=False)

    logger.info(f"Appel Ollama synchrone — modèle : {selected_model}")

    try:
        response = requests.post(url, json=payload, timeout=Config.OLLAMA_TIMEOUT)
    except requests.exceptions.ConnectionError as exc:
        raise OllamaUnavailableError(
            f"Ollama est introuvable sur {Config.OLLAMA_BASE_URL}. "
            "Vérifiez qu'Ollama est lancé (ollama serve)."
        ) from exc
    except requests.exceptions.Timeout as exc:
        raise OllamaUnavailableError(
            f"Ollama n'a pas répondu en {Config.OLLAMA_TIMEOUT}s. "
            "Gemma 4 est un gros modèle — augmentez OLLAMA_TIMEOUT si nécessaire."
        ) from exc

    if not response.ok:
        error_text = response.text[:400]
        logger.error(f"Erreur Ollama HTTP {response.status_code} : {error_text}")

        # Message d'erreur lisible si le modèle n'existe pas
        if "model" in error_text.lower() and "not found" in error_text.lower():
            raise OllamaModelError(
                f"Le modèle '{selected_model}' n'est pas installé. "
                f"Lancez : ollama pull {selected_model}"
            )

        raise OllamaModelError(
            f"Ollama a retourné HTTP {response.status_code} : {error_text}"
        )

    try:
        data    = response.json()
        content = data["message"]["content"]
        logger.info("Réponse Ollama reçue avec succès.")
        return content
    except (KeyError, ValueError) as exc:
        raise OllamaModelError(
            f"Format de réponse Ollama inattendu : {response.text[:200]}"
        ) from exc


# ── Appel streaming SSE ───────────────────────────────────────────────────────

def stream_prompt(
    system: str = None,
    user: str = None,
    messages: list = None,
    model: str = None,
) -> Generator[str, None, None]:
    """
    Envoie un prompt à Ollama et génère les tokens au fur et à mesure (SSE).
    """
    url = f"{Config.OLLAMA_BASE_URL}/api/chat"

    if messages is not None:
        chat_messages = messages
    else:
        if system is None or user is None:
            raise ValueError("Fournir 'system' et 'user', ou une liste 'messages'.")
        chat_messages = _build_messages(system, user)

    selected_model = model or _get_model()
    payload = _build_payload(chat_messages, selected_model, stream=True)

    logger.info(f"Appel Ollama streaming — modèle : {selected_model}")

    try:
        with requests.post(
            url, json=payload, stream=True, timeout=Config.OLLAMA_TIMEOUT
        ) as response:
            if not response.ok:
                raise OllamaModelError(
                    f"Ollama HTTP {response.status_code} : {response.text[:200]}"
                )

            for raw_line in response.iter_lines():
                if not raw_line:
                    continue
                try:
                    chunk = json.loads(raw_line)
                    token = chunk.get("message", {}).get("content", "")
                    if token:
                        yield f"data: {json.dumps({'token': token})}\n\n"
                    if chunk.get("done"):
                        logger.info("Streaming Ollama terminé.")
                        yield "data: [DONE]\n\n"
                except (json.JSONDecodeError, KeyError):
                    continue

    except requests.exceptions.ConnectionError as exc:
        raise OllamaUnavailableError(
            f"Ollama introuvable sur {Config.OLLAMA_BASE_URL}."
        ) from exc
    except requests.exceptions.Timeout as exc:
        raise OllamaUnavailableError(
            f"Timeout Ollama ({Config.OLLAMA_TIMEOUT}s) en streaming."
        ) from exc


# ── Health check ──────────────────────────────────────────────────────────────

def ping() -> dict:
    """
    Vérifie qu'Ollama est joignable et que le modèle configuré est bien installé.
    """
    url = f"{Config.OLLAMA_BASE_URL}/api/tags"

    try:
        response = requests.get(url, timeout=5)
    except (requests.exceptions.ConnectionError, requests.exceptions.Timeout) as exc:
        raise OllamaUnavailableError(
            f"Ollama introuvable sur {Config.OLLAMA_BASE_URL}. "
            "Lancez Ollama avec : ollama serve"
        ) from exc

    if not response.ok:
        raise OllamaUnavailableError(
            f"Ollama a répondu avec HTTP {response.status_code}."
        )

    try:
        data   = response.json()
        models = [m["name"] for m in data.get("models", [])]
    except (ValueError, KeyError):
        models = []

    configured_model = _get_model()

    # Avertit si le modèle configuré n'est pas dans la liste
    if models and configured_model not in models:
        logger.warning(
            f"Le modèle '{configured_model}' n'est pas dans la liste Ollama : {models}. "
            f"Lancez : ollama pull {configured_model}"
        )

    return {
        "ollama":            True,
        "model":             configured_model,
        "model_installed":   configured_model in models,
        "models_available":  models,
    }