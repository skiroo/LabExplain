"""
Fichier : ai_routes.py
Dossier : backend/routes/
Description :
    Définit toutes les routes du module IA de LabExplain.
    Ces routes permettent au frontend web et au frontend mobile
    de générer des résumés médicaux, de dialoguer avec l'IA
    et de traduire des résumés dans d'autres langues.

Endpoints :
    POST   /api/ai/summary         → Résumé médical synchrone
    POST   /api/ai/summary/stream  → Résumé médical en streaming SSE
    POST   /api/ai/chat            → Conversation libre multi-tour
    POST   /api/ai/translate       → Traduction d'un résumé existant
    GET    /api/ai/health          → Vérification de la disponibilité d'Ollama
"""

import json
import logging
from functools import wraps

from flask import Blueprint, Response, request, stream_with_context

from ai import (
    generate_summary,
    stream_summary,
    chat_turn,
    interview_turn,
    translate_summary,
    ollama_ping,
)
from ai.ollama_client import OllamaUnavailableError, OllamaModelError
from ai.pdf_export import build_summary_pdf
from utils.response import success_response, error_response

# Configuration du logger pour le module des routes IA
logger = logging.getLogger("backend.routes.ai_routes")

ai_bp = Blueprint("ai", __name__)


# ── Helpers ───────────────────────────────────────────────────────────────────

def _handle_ollama_errors(func):
    """
    Décorateur interne qui intercepte les exceptions Ollama
    et les convertit en réponses HTTP appropriées.

    - OllamaUnavailableError → 503 Service Unavailable
    - OllamaModelError       → 500 Internal Server Error
    - ValueError             → 422 Unprocessable Entity (parsing IA)
    """
    @wraps(func)
    def wrapper(*args, **kwargs):
        try:
            return func(*args, **kwargs)
        except OllamaUnavailableError as exc:
            logger.error(f"Ollama indisponible intercepté par la route : {str(exc)}")
            return error_response(str(exc), 503)
        except OllamaModelError as exc:
            logger.error(f"Erreur de modèle Ollama interceptée par la route : {str(exc)}")
            return error_response(str(exc), 500)
        except ValueError as exc:
            logger.error(f"Erreur de validation/parsing interceptée par la route : {str(exc)}")
            return error_response(str(exc), 422)
    return wrapper


# ── POST /api/ai/summary ─────────────────────────────────────────────────────

@ai_bp.route("/summary", methods=["POST"])
@_handle_ollama_errors
def summary():
    """
    Génère un résumé médical structuré à partir des informations patient.

    Body JSON attendu :
    {
        "symptoms"          : str  (obligatoire),
        "medicalHistory"    : str  (optionnel),
        "currentTreatments" : str  (optionnel),
        "painLevel"         : int  (optionnel, 1-10),
        "additionalNotes"   : str  (optionnel),
        "doctorId"          : str  (optionnel),
        "language"          : str  (optionnel, défaut: "fr"),
        "urgencyLevel"      : str  (optionnel, ex: "urgent_bad")
    }

    Response :
    {
        "success": true,
        "message": "Résumé généré avec succès",
        "data": {
            "language"     : str,
            "summary"      : str,
            "questions"    : [str],
            "warning"      : str,
            "redFlags"     : [str],
            "urgencyLevel" : str
        }
    }
    """
    data = request.get_json()

    if data is None:
        return error_response("Aucune donnée envoyée", 400)

    if not data.get("symptoms", "").strip():
        return error_response("Le champ 'symptoms' est obligatoire et ne peut pas être vide", 400)

    result = generate_summary(data)
    return success_response(result, "Résumé généré avec succès")


# ── POST /api/ai/summary/stream ───────────────────────────────────────────────

@ai_bp.route("/summary/stream", methods=["POST"])
@_handle_ollama_errors
def summary_stream():
    """
    Génère un résumé médical en streaming SSE (Server-Sent Events).

    Même body JSON que /api/ai/summary.

    Réponse : text/event-stream
    Chaque chunk : "data: {\"token\": \"...\"}\n\n"
    Dernier chunk : "data: [DONE]\n\n"
    """
    data = request.get_json()

    if data is None:
        return error_response("Aucune donnée envoyée", 400)

    if not data.get("symptoms", "").strip():
        return error_response("Le champ 'symptoms' est obligatoire et ne peut pas être vide", 400)

    def generate():
        try:
            yield from stream_summary(data)
        except OllamaUnavailableError as exc:
            logger.error(f"Erreur de connexion Ollama en cours de streaming : {str(exc)}")
            error_payload = json.dumps({"error": str(exc), "code": 503})
            yield f"data: {error_payload}\n\n"
        except OllamaModelError as exc:
            logger.error(f"Erreur de modèle Ollama en cours de streaming : {str(exc)}")
            error_payload = json.dumps({"error": str(exc), "code": 500})
            yield f"data: {error_payload}\n\n"

    return Response(
        stream_with_context(generate()),
        mimetype="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",
        },
    )


# ── POST /api/ai/chat ─────────────────────────────────────────────────────────

@ai_bp.route("/chat", methods=["POST"])
@_handle_ollama_errors
def chat():
    """
    Effectue un tour de conversation libre avec l'assistant médical.

    Body JSON attendu :
    {
        "history" : [{"role": "user"|"assistant", "content": "..."}],
        "message" : str  (obligatoire, dernier message du patient),
        "context" : {
            "antecedents" : str (optionnel),
            "traitements" : str (optionnel),
            "allergies"   : str (optionnel)
        }
    }

    Response :
    {
        "success": true,
        "data": { "response": str }
    }
    """
    data = request.get_json()

    if data is None:
        return error_response("Aucune donnée envoyée", 400)

    message = data.get("message", "").strip()
    if not message:
        return error_response("Le champ 'message' est obligatoire et ne peut pas être vide", 400)

    history = data.get("history", [])
    context = data.get("context")

    # Validation légère de l'historique
    if not isinstance(history, list):
        return error_response("Le champ 'history' doit être une liste", 400)

    response_text = chat_turn(history, message, context)
    return success_response({"response": response_text}, "Réponse générée avec succès")


# ── POST /api/ai/interview ────────────────────────────────────────────────────

@ai_bp.route("/interview", methods=["POST"])
@_handle_ollama_errors
def interview():
    """
    Effectue un tour de l'entretien dynamique de préparation de consultation.
    L'IA choisit la prochaine question à poser en fonction des réponses
    précédentes du patient, jusqu'à avoir recueilli assez d'informations
    (status passe alors à "done" avec collectedData prêt pour /api/ai/summary).

    Body JSON attendu :
    {
        "history" : [
            {"role": "assistant", "content": {...dernier tour structuré...}},
            {"role": "user", "content": "réponse libre du patient"}
        ],
        "doctorName" : str (optionnel, nom du médecin sélectionné)
    }
    Pour le premier appel, "history" peut être une liste vide ou absente.

    Response :
    {
        "success": true,
        "data": {
            "status"        : "question" | "done",
            "question"      : str,
            "options"       : [str],
            "redFlags"      : [str],
            "collectedData" : {
                "symptoms": str, "medicalHistory": str,
                "currentTreatments": str, "painLevel": int|None,
                "additionalNotes": str
            }
        }
    }
    """
    data = request.get_json()

    if data is None:
        return error_response("Aucune donnée envoyée", 400)

    history = data.get("history", [])
    doctor_name = data.get("doctorName", "")

    if not isinstance(history, list):
        return error_response("Le champ 'history' doit être une liste", 400)

    result = interview_turn(history, doctor_name)
    return success_response(result, "Tour d'entretien généré avec succès")


# ── POST /api/ai/translate ────────────────────────────────────────────────────

@ai_bp.route("/translate", methods=["POST"])
@_handle_ollama_errors
def translate():
    """
    Traduit un résumé médical existant vers une autre langue.

    Body JSON attendu :
    {
        "summary_data"    : dict (résumé existant avec summary, questions, warning, ...),
        "target_language" : str  (code ISO 639-1, ex: "en", "ar", "es")
    }

    Response :
    {
        "success": true,
        "data": { ...résumé traduit... }
    }
    """
    data = request.get_json()

    if data is None:
        return error_response("Aucune donnée envoyée", 400)

    summary_data = data.get("summary_data")
    target_language = data.get("target_language", "").strip()

    if not summary_data or not isinstance(summary_data, dict):
        return error_response("Le champ 'summary_data' est obligatoire et doit être un objet", 400)

    if not target_language:
        return error_response("Le champ 'target_language' est obligatoire", 400)

    if not summary_data.get("summary"):
        return error_response("Le résumé à traduire ne contient pas de champ 'summary'", 400)

    translated = translate_summary(summary_data, target_language)
    return success_response(translated, f"Résumé traduit en '{target_language}' avec succès")


# ── POST /api/ai/summary/pdf ──────────────────────────────────────────────────

@ai_bp.route("/summary/pdf", methods=["POST"])
def summary_pdf():
    """
    Génère et retourne en téléchargement le PDF de synthèse de consultation
    à partir d'un résumé déjà généré (par /api/ai/summary).

    Body JSON attendu :
    {
        "summary_data" : dict (résumé avec summary, questions, warning, redFlags),
        "patientName"  : str (optionnel),
        "doctorName"   : str (optionnel)
    }

    Response : application/pdf (téléchargement direct)
    """
    data = request.get_json()

    if data is None:
        return error_response("Aucune donnée envoyée", 400)

    summary_data = data.get("summary_data")
    if not summary_data or not isinstance(summary_data, dict):
        return error_response("Le champ 'summary_data' est obligatoire et doit être un objet", 400)

    if not summary_data.get("summary"):
        return error_response("Le résumé ne contient pas de champ 'summary'", 400)

    patient_name = data.get("patientName", "")
    doctor_name = data.get("doctorName", "")

    try:
        pdf_bytes = build_summary_pdf(summary_data, patient_name, doctor_name)
    except Exception as exc:
        logger.error(f"Erreur lors de la génération du PDF de synthèse : {str(exc)}")
        return error_response("Erreur lors de la génération du PDF", 500)

    return Response(
        pdf_bytes,
        mimetype="application/pdf",
        headers={
            "Content-Disposition": "attachment; filename=synthese-labexplain.pdf",
        },
    )


# ── GET /api/ai/health ────────────────────────────────────────────────────────

@ai_bp.route("/health", methods=["GET"])
def health():
    """
    Vérifie que le service Ollama est opérationnel.

    Response (Ollama disponible) :
    {
        "success": true,
        "data": {
            "ollama"           : true,
            "model"            : "llama3.2",
            "models_available" : ["llama3.2", ...]
        }
    }

    Response (Ollama indisponible) :
    HTTP 503 :
    {
        "success": false,
        "message": "Ollama n'est pas joignable sur http://localhost:11434."
    }
    """
    try:
        status = ollama_ping()
        return success_response(status, "Ollama est opérationnel")
    except OllamaUnavailableError as exc:
        return error_response(str(exc), 503)