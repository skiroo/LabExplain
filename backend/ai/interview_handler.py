"""
Fichier : interview_handler.py
Dossier : backend/ai/
Description :
    Handler métier pour l'entretien dynamique de préparation de consultation.
    Contrairement à summary_handler (qui génère un résumé à partir de données
    déjà collectées), ce module pilote la conversation elle-même : l'IA choisit
    la prochaine question à poser en fonction des réponses précédentes du
    patient, jusqu'à avoir recueilli assez d'informations.

    Le backend est stateless : c'est le frontend qui maintient l'historique
    de l'entretien (liste de tours) et le renvoie à chaque appel.

    Garde-fous appliqués ici (et non laissés à la seule discrétion de l'IA) :
      - Nombre maximum de questions avant arrêt forcé (MAX_INTERVIEW_TURNS)
      - Validation du format de réponse (status, collectedData toujours présents)
      - Les signaux d'alarme ne stoppent jamais l'entretien : ils sont
        accumulés dans redFlags pour la synthèse finale

    Fonctions exposées :
      - interview_turn(history, doctor_name) → dict
"""

import logging

from .ollama_client import send_prompt
from .prompts import build_interview_messages
from .utils import extract_json

logger = logging.getLogger("backend.ai.interview_handler")

# Nombre maximum de questions posées avant de forcer la fin de l'entretien.
# Choisi comme garde-fou indépendant du jugement de l'IA pour éviter
# qu'un entretien ne boucle indéfiniment.
MAX_INTERVIEW_TURNS = 15


def _count_assistant_turns(history: list) -> int:
    """Compte le nombre de questions déjà posées par l'IA dans l'historique."""
    return sum(1 for turn in history if turn.get("role") == "assistant")


def _extract_user_answers(history: list) -> str:
    """
    Reconstruit un résumé brut des réponses patient depuis l'historique,
    utilisé en fallback si collectedData.symptoms est vide au moment
    où l'IA déclare status=done — ce qui arrive quand Gemma oublie
    d'accumuler correctement collectedData au fil des tours.
    """
    answers = [
        turn.get("content", "")
        for turn in history
        if turn.get("role") == "user" and turn.get("content", "").strip()
    ]
    return " — ".join(answers) if answers else ""


def _validate_and_enrich(parsed: dict, forced_done: bool, history: list) -> dict:
    """
    Valide et complète le JSON renvoyé par l'IA avec des valeurs par défaut
    sûres, pour ne jamais transmettre une structure incomplète au frontend.
    """
    collected = parsed.get("collectedData") or {}

    result = {
        "status": "done" if forced_done else parsed.get("status", "question"),
        "question": "" if forced_done else (parsed.get("question") or "").strip(),
        "options": [] if forced_done else (parsed.get("options") or []),
        "redFlags": parsed.get("redFlags") or [],
        "collectedData": {
            "symptoms": collected.get("symptoms", "") or "",
            "medicalHistory": collected.get("medicalHistory", "") or "",
            "currentTreatments": collected.get("currentTreatments", "") or "",
            "painLevel": collected.get("painLevel"),
            "additionalNotes": collected.get("additionalNotes", "") or "",
        },
    }

    # Garde-fou : on ne déclare jamais "done" sans avoir au moins un motif
    # de consultation. Si symptoms est vide, on reconstruit depuis l'historique
    # plutôt que de forcer une nouvelle question (meilleure UX).
    if result["status"] == "done" and len(result["collectedData"]["symptoms"].strip()) < 10:
        fallback_symptoms = _extract_user_answers(history)
        if fallback_symptoms:
            result["collectedData"]["symptoms"] = fallback_symptoms
            logger.warning(
                "collectedData.symptoms vide au moment du status=done — "
                "reconstruction depuis l'historique des réponses."
            )
        else:
            # Pas d'historique non plus : on repose une question
            result["status"] = "question"
            result["question"] = (
                result["question"]
                or "Pouvez-vous décrire le motif principal de votre consultation ?"
            )

    return result


def interview_turn(history: list, doctor_name: str = "") -> dict:
    """
    Effectue un tour de l'entretien dynamique de préparation de consultation.

    Args:
        history     : Liste des tours précédents [{role, content}].
                      Le contenu "assistant" peut être soit du texte brut,
                      soit le dict déjà parsé du tour précédent.
        doctor_name : Nom du médecin sélectionné (optionnel, pour contexte).

    Returns:
        Dictionnaire structuré :
        {
            "status": "question" | "done",
            "question": str,
            "options": [str],
            "redFlags": [str],
            "collectedData": {
                "symptoms": str, "medicalHistory": str,
                "currentTreatments": str, "painLevel": int|None,
                "additionalNotes": str
            }
        }

    Raises:
        OllamaUnavailableError : Propagée depuis ollama_client.
        OllamaModelError       : Propagée depuis ollama_client.
        ValueError              : Si la réponse IA ne contient pas de JSON exploitable.
    """
    logger.info("Début d'un tour de l'entretien dynamique de préparation.")

    turns_so_far = _count_assistant_turns(history)
    forced_done = turns_so_far >= MAX_INTERVIEW_TURNS

    if forced_done:
        logger.warning(
            f"Garde-fou atteint ({MAX_INTERVIEW_TURNS} questions) — "
            f"arrêt forcé de l'entretien."
        )

    messages = build_interview_messages(history, doctor_name)
    raw_response = send_prompt(messages=messages)

    try:
        parsed = extract_json(raw_response)
    except ValueError as exc:
        logger.error(f"Échec de l'extraction du JSON d'entretien : {str(exc)}")
        logger.debug(f"Réponse brute de l'IA à analyser : {raw_response}")
        raise

    enriched = _validate_and_enrich(parsed, forced_done, history)
    logger.info(f"Tour d'entretien traité — statut : {enriched['status']}.")
    return enriched
