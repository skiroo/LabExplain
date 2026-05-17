"""
Fichier : health_routes.py
Dossier : backend/routes/
Description :
    Définit la route de vérification du backend LabExplain.
    Cette route permet au frontend web et au frontend mobile de vérifier que l'API Flask est bien lancée.
"""

from flask import Blueprint
from utils.response import success_response

health_bp = Blueprint("health", __name__)


@health_bp.route("/health", methods=["GET"])
def health():
    """
    Vérifie que le backend fonctionne correctement.
    """
    return success_response({
        "status": "ok",
        "message": "Backend LabExplain is running"
    })