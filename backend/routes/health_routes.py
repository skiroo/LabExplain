"""
Fichier : health_routes.py
Dossier : backend/routes/
"""

from flask import Blueprint
from database.db import mysql
from utils.response import success_response, error_response

health_bp = Blueprint("health", __name__)


@health_bp.route("/health", methods=["GET"])
def health():
    return success_response({"status": "ok", "message": "Backend LabExplain is running"})


@health_bp.route("/health/db", methods=["GET"])
def health_db():
    try:
        cursor = mysql.connection.cursor()
        cursor.execute("SELECT DATABASE()")
        row = cursor.fetchone()
        cursor.close()
        db_name = list(row.values())[0] if row else "unknown"
        return success_response({"database": db_name, "status": "connected"})
    except Exception as error:
        return error_response(f"DB connection failed: {str(error)}", 500)


@health_bp.route("/health/ai", methods=["GET"])
def health_ai():
    """
    Vérifie Ollama + modèle configuré en une seule route.
    Plus rapide que /api/ai/health pour un check rapide au démarrage.
    """
    try:
        from ai.ollama_client import ping, OllamaUnavailableError
        status = ping()

        if not status.get("model_installed"):
            model = status.get("model", "?")
            available = status.get("models_available", [])
            return error_response(
                f"Le modèle '{model}' n'est pas installé. "
                f"Modèles disponibles : {available}. "
                f"Lancez : ollama pull {model}",
                503
            )

        return success_response(status, "Ollama opérationnel")

    except Exception as exc:
        return error_response(str(exc), 503)