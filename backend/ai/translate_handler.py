"""
Fichier : translate_handler.py
Dossier : backend/ai/
Description :
    Handler métier pour la traduction de résumés médicaux.
    Permet de traduire un résumé déjà généré vers une autre langue,
    en conservant la structure JSON et le sens médical exact.

    Fonctions exposées :
      - translate_summary(summary_data, target_language) → dict
"""

import logging

from .ollama_client import send_prompt
from .prompts import TRANSLATE_SYSTEM_PROMPT, build_translate_user_message, MEDICAL_DISCLAIMER
from .utils import extract_json

# Configuration du logger pour ce module
logger = logging.getLogger("backend.ai.translate_handler")

# Langues supportées (pour validation)
SUPPORTED_LANGUAGES = {"fr", "en", "ar", "es", "de", "pt", "it", "zh", "ru"}


def translate_summary(summary_data: dict, target_language: str) -> dict:
    """
    Traduit un résumé médical structuré vers une langue cible.

    Args:
        summary_data    : Dictionnaire résumé existant.
                          Doit contenir au minimum : summary, questions, warning.
        target_language : Code ISO 639-1 de la langue cible (ex: "en", "ar", "es").

    Returns:
        Dictionnaire traduit avec la même structure que summary_data,
        avec le champ "language" mis à jour.

    Raises:
        ValueError             : Si la langue cible n'est pas supportée ou
                                  si la réponse IA n'est pas du JSON valide.
        OllamaUnavailableError : Propagée depuis ollama_client.
        OllamaModelError       : Propagée depuis ollama_client.
    """
    target_language = target_language.strip().lower()

    if target_language not in SUPPORTED_LANGUAGES:
        logger.warning(f"Tentative de traduction vers une langue non supportée : {target_language}")
        raise ValueError(
            f"Langue '{target_language}' non supportée. "
            f"Langues disponibles : {', '.join(sorted(SUPPORTED_LANGUAGES))}"
        )

    # Si déjà dans la bonne langue, retourner tel quel
    if summary_data.get("language") == target_language:
        logger.info(f"Résumé déjà en langue '{target_language}'. Aucune action requise.")
        return summary_data

    logger.info(f"Lancement de la traduction vers '{target_language}'...")
    user_message = build_translate_user_message(summary_data, target_language)
    raw_response = send_prompt(TRANSLATE_SYSTEM_PROMPT, user_message)

    # Parser la réponse JSON de manière robuste via le module commun utils.py
    try:
        translated = extract_json(raw_response)
    except ValueError as exc:
        logger.error(f"Échec de l'extraction JSON pour la traduction : {str(exc)}")
        logger.debug(f"Réponse brute de l'IA à analyser : {raw_response}")
        raise

    # Garantir la cohérence des champs critiques
    translated["language"] = target_language
    if not translated.get("warning"):
        translated["warning"] = MEDICAL_DISCLAIMER

    logger.info("Traduction réalisée et formatée avec succès.")
    return translated
