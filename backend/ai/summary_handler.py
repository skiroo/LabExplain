"""
Fichier : summary_handler.py
Dossier : backend/ai/
Description :
    Handler métier pour la génération de résumés médicaux structurés.
    Ce module orchestre l'appel à Ollama et garantit que la réponse
    respecte le format JSON attendu par le frontend LabExplain.

    Fonctions exposées :
      - generate_summary(data) → dict       : appel synchrone
      - stream_summary(data)   → Generator  : appel SSE streaming
"""

import logging
from typing import Generator

from .ollama_client import send_prompt, stream_prompt
from .prompts import (
    SUMMARY_SYSTEM_PROMPT,
    MEDICAL_DISCLAIMER,
    build_summary_user_message,
)
from .utils import extract_json

# Configuration du logger pour ce module
logger = logging.getLogger("backend.ai.summary_handler")


# ── Helpers ───────────────────────────────────────────────────────────────────

def _validate_and_enrich(parsed: dict, data: dict) -> dict:
    """
    Valide et enrichit le JSON parsé avec les valeurs par défaut manquantes.

    Args:
        parsed : Dictionnaire parsé depuis la réponse IA.
        data   : Données originales du patient (pour fallback).

    Returns:
        Dictionnaire validé et prêt à être retourné au frontend.
    """
    language = parsed.get("language") or data.get("language", "fr")

    return {
        "language":     language,
        "summary":      parsed.get("summary", "").strip(),
        "questions":    parsed.get("questions") or [],
        "warning":      parsed.get("warning") or MEDICAL_DISCLAIMER,
        "redFlags":     parsed.get("redFlags") or [],
        "urgencyLevel": parsed.get("urgencyLevel", "routine"),
    }


# ── Appel synchrone ───────────────────────────────────────────────────────────

def generate_summary(data: dict) -> dict:
    """
    Génère un résumé médical structuré à partir des données patient.

    Orchestre :
      1. La construction du prompt utilisateur depuis les données du chatbot
      2. L'appel synchrone à Ollama via ollama_client
      3. L'extraction et la validation du JSON retourné

    Args:
        data : Données du chatbot front-end.
               Clés obligatoires : symptoms
               Clés optionnelles : medicalHistory, currentTreatments, painLevel,
                                   additionalNotes, doctorId, language, urgencyLevel

    Returns:
        Dictionnaire structuré.

    Raises:
        OllamaUnavailableError : Propagée depuis ollama_client si Ollama est KO.
        OllamaModelError       : Propagée depuis ollama_client si le modèle échoue.
        ValueError             : Si la réponse IA ne contient pas de JSON exploitable.
    """
    logger.info("Début de la génération de résumé médical...")
    user_message = build_summary_user_message(data)
    raw_response = send_prompt(SUMMARY_SYSTEM_PROMPT, user_message)

    try:
        parsed = extract_json(raw_response)
    except ValueError as exc:
        logger.error(f"Échec de l'extraction du JSON de résumé : {str(exc)}")
        logger.debug(f"Réponse brute de l'IA à analyser : {raw_response}")
        raise

    enriched = _validate_and_enrich(parsed, data)
    logger.info("Résumé médical généré et validé avec succès.")
    return enriched


# ── Appel en streaming SSE ────────────────────────────────────────────────────

def stream_summary(data: dict) -> Generator[str, None, None]:
    """
    Génère un résumé médical en streaming SSE.

    Les chunks de texte brut sont streamés token par token.
    Le frontend est responsable d'assembler les tokens et de parser le JSON final.

    Le dernier événement SSE envoyé est "data: [DONE]\\n\\n".

    Args:
        data : Mêmes données que generate_summary().

    Yields:
        Chaînes SSE au format "data: {json}\\n\\n" ou "data: [DONE]\\n\\n".

    Raises:
        OllamaUnavailableError : Propagée depuis ollama_client.
        OllamaModelError       : Propagée depuis ollama_client.
    """
    logger.info("Début du streaming de résumé médical...")
    user_message = build_summary_user_message(data)
    yield from stream_prompt(SUMMARY_SYSTEM_PROMPT, user_message)
