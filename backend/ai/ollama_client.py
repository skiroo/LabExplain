"""
Fichier : ollama_client.py
Dossier : backend/ai/
Description :
    Client HTTP bas-niveau vers le service Ollama local.
    Ce module est le seul point de contact avec l'API Ollama.
    Il gère :
      - Les appels synchrones (send_prompt)
      - Les appels en streaming SSE (stream_prompt)
      - Le health check (ping)
    Il lève des exceptions typées pour que les handlers métier
    puissent les intercepter proprement.
"""

import json
import logging
from typing import Generator

import requests

from config import Config

# Configuration du logger pour ce module
logger = logging.getLogger("backend.ai.ollama_client")


# ── Exceptions personnalisées ─────────────────────────────────────────────────

class OllamaUnavailableError(Exception):
    """
    Levée quand Ollama n'est pas joignable (service arrêté, réseau, timeout).
    → Traduite en HTTP 503 par les routes Flask.
    """


class OllamaModelError(Exception):
    """
    Levée quand Ollama répond mais retourne une erreur de modèle
    (modèle inexistant, requête malformée, etc.).
    → Traduite en HTTP 500 par les routes Flask.
    """


# ── Helpers internes ──────────────────────────────────────────────────────────

def _get_model() -> str:
    """Retourne le nom du modèle configuré."""
    return Config.OLLAMA_MODEL


def _build_messages(system: str, user: str) -> list:
    """Construit la liste de messages au format Ollama Chat API."""
    return [
        {"role": "system", "content": system},
        {"role": "user",   "content": user},
    ]


# ── Appel synchrone ───────────────────────────────────────────────────────────

def send_prompt(system: str = None, user: str = None, messages: list = None, model: str = None) -> str:
    """
    Envoie un prompt ou une liste de messages structurée à Ollama et attend la réponse complète.

    Args:
        system   : Prompt système (si messages n'est pas fourni).
        user     : Message utilisateur (si messages n'est pas fourni).
        messages : Liste de messages déjà structurés au format Chat API d'Ollama.
                   Exemple : [{"role": "system", "content": "..."}, {"role": "user", ...}]
        model    : Modèle à utiliser (par défaut : Config.OLLAMA_MODEL).

    Returns:
        Le texte généré par l'IA (chaîne brute).

    Raises:
        ValueError             : Si ni messages ni le couple system/user n'est fourni.
        OllamaUnavailableError : Si Ollama n'est pas joignable.
        OllamaModelError       : Si Ollama retourne une erreur.
    """
    url = f"{Config.OLLAMA_BASE_URL}/api/chat"

    if messages is not None:
        chat_messages = messages
    else:
        if system is None or user is None:
            logger.error("send_prompt appelé sans system/user et sans messages.")
            raise ValueError("Vous devez fournir 'system' et 'user' ou passer une liste de 'messages'.")
        chat_messages = _build_messages(system, user)

    selected_model = model or _get_model()
    payload = {
        "model": selected_model,
        "messages": chat_messages,
        "stream": False,
    }

    logger.info(f"Envoi d'une requête de chat synchrone à Ollama (Modèle: {selected_model})")
    logger.debug(f"Payload de chat envoyé : {payload}")

    try:
        response = requests.post(
            url,
            json=payload,
            timeout=Config.OLLAMA_TIMEOUT,
        )
    except requests.exceptions.ConnectionError as exc:
        logger.error(f"Impossible de se connecter à Ollama sur {Config.OLLAMA_BASE_URL} : {str(exc)}")
        raise OllamaUnavailableError(
            "Impossible de se connecter à Ollama. "
            "Vérifiez qu'Ollama est bien lancé sur "
            f"{Config.OLLAMA_BASE_URL}."
        ) from exc
    except requests.exceptions.Timeout as exc:
        logger.error(f"Timeout lors de l'appel Ollama après {Config.OLLAMA_TIMEOUT}s : {str(exc)}")
        raise OllamaUnavailableError(
            f"Ollama n'a pas répondu dans les {Config.OLLAMA_TIMEOUT}s imparties."
        ) from exc

    if not response.ok:
        logger.error(f"Erreur d'Ollama (HTTP {response.status_code}) : {response.text[:500]}")
        raise OllamaModelError(
            f"Ollama a retourné une erreur {response.status_code} : "
            f"{response.text[:200]}"
        )

    try:
        data = response.json()
        content = data["message"]["content"]
        logger.info("Réponse synchrone d'Ollama reçue avec succès.")
        return content
    except (KeyError, ValueError) as exc:
        logger.error(f"Format de réponse Ollama inattendu : {response.text[:500]}")
        raise OllamaModelError(
            f"Réponse Ollama inattendue : {response.text[:200]}"
        ) from exc


# ── Appel en streaming SSE ────────────────────────────────────────────────────

def stream_prompt(system: str = None, user: str = None, messages: list = None, model: str = None) -> Generator[str, None, None]:
    """
    Envoie un prompt ou une liste de messages structurée à Ollama et génère les chunks de texte au fur et à mesure.

    Args:
        system   : Prompt système (si messages n'est pas fourni).
        user     : Message utilisateur (si messages n'est pas fourni).
        messages : Liste de messages déjà structurés au format Chat API d'Ollama.
        model    : Modèle à utiliser (par défaut : Config.OLLAMA_MODEL).

    Yields:
        Fragments de texte SSE au format "data: {\"token\": \"...\"}\n\n".

    Raises:
        ValueError             : Si ni messages ni le couple system/user n'est fourni.
        OllamaUnavailableError : Si Ollama n'est pas joignable.
        OllamaModelError       : Si Ollama retourne une erreur.
    """
    url = f"{Config.OLLAMA_BASE_URL}/api/chat"

    if messages is not None:
        chat_messages = messages
    else:
        if system is None or user is None:
            logger.error("stream_prompt appelé sans system/user et sans messages.")
            raise ValueError("Vous devez fournir 'system' et 'user' ou passer une liste de 'messages'.")
        chat_messages = _build_messages(system, user)

    selected_model = model or _get_model()
    payload = {
        "model": selected_model,
        "messages": chat_messages,
        "stream": True,
    }

    logger.info(f"Début du streaming de chat avec Ollama (Modèle: {selected_model})")
    logger.debug(f"Payload de streaming envoyé : {payload}")

    try:
        with requests.post(
            url,
            json=payload,
            stream=True,
            timeout=Config.OLLAMA_TIMEOUT,
        ) as response:
            if not response.ok:
                logger.error(f"Erreur d'Ollama en streaming (HTTP {response.status_code}) : {response.text[:500]}")
                raise OllamaModelError(
                    f"Ollama a retourné une erreur {response.status_code} : "
                    f"{response.text[:200]}"
                )

            for raw_line in response.iter_lines():
                if not raw_line:
                    continue
                try:
                    chunk_data = json.loads(raw_line)
                    token = chunk_data.get("message", {}).get("content", "")
                    if token:
                        # Format SSE : "data: <payload>\n\n"
                        yield f"data: {json.dumps({'token': token})}\n\n"
                    # Dernier chunk : Ollama envoie done=true
                    if chunk_data.get("done"):
                        logger.info("Streaming d'Ollama complété.")
                        yield "data: [DONE]\n\n"
                except (json.JSONDecodeError, KeyError) as exc:
                    logger.debug(f"Ligne de streaming ignorée ou invalide : {raw_line} (Erreur : {str(exc)})")
                    continue

    except requests.exceptions.ConnectionError as exc:
        logger.error(f"Connexion perdue avec Ollama pendant le streaming : {str(exc)}")
        raise OllamaUnavailableError(
            "Impossible de se connecter à Ollama pour le streaming. "
            f"Vérifiez qu'Ollama est bien lancé sur {Config.OLLAMA_BASE_URL}."
        ) from exc
    except requests.exceptions.Timeout as exc:
        logger.error(f"Timeout rencontré lors du streaming Ollama : {str(exc)}")
        raise OllamaUnavailableError(
            f"Ollama n'a pas répondu dans les {Config.OLLAMA_TIMEOUT}s imparties (streaming)."
        ) from exc


# ── Health check ──────────────────────────────────────────────────────────────

def ping() -> dict:
    """
    Vérifie qu'Ollama est bien joignable et que le modèle configuré est disponible.

    Returns:
        dict avec les clés :
          - "ollama" (bool) : True si le service répond.
          - "model"  (str)  : Nom du modèle configuré.
          - "models_available" (list) : Liste des modèles installés sur ce Ollama.

    Raises:
        OllamaUnavailableError : Si Ollama n'est pas joignable.
    """
    url = f"{Config.OLLAMA_BASE_URL}/api/tags"
    logger.info(f"Health check : vérification d'Ollama sur {url}")

    try:
        response = requests.get(url, timeout=5)
    except (requests.exceptions.ConnectionError, requests.exceptions.Timeout) as exc:
        logger.error(f"Ollama injoignable lors du health check : {str(exc)}")
        raise OllamaUnavailableError(
            f"Ollama n'est pas joignable sur {Config.OLLAMA_BASE_URL}."
        ) from exc

    if not response.ok:
        logger.error(f"Ollama répond avec une erreur lors du health check : HTTP {response.status_code}")
        raise OllamaUnavailableError(
            f"Ollama a répondu avec le statut {response.status_code}."
        )

    try:
        data = response.json()
        models = [m["name"] for m in data.get("models", [])]
        logger.info(f"Health check réussi. Modèle configuré : {_get_model()}. Modèles présents : {models}")
    except (ValueError, KeyError) as exc:
        logger.warning(f"Impossible de décoder la réponse de health check d'Ollama : {str(exc)}")
        models = []

    return {
        "ollama": True,
        "model": _get_model(),
        "models_available": models,
    }
