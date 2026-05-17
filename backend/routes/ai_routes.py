"""
Fichier : ai_routes.py
Dossier : backend/routes/
Description :
    Définit les routes liées au module IA.
    Ces routes permettent au frontend web et au frontend mobile de demander
    la génération d'un résumé médical structuré.

À compléter plus tard :
    Maxime devra connecter cette route au vrai service IA.
"""

from flask import Blueprint, request
from services.ai_service import generate_summary
from utils.response import success_response, error_response

ai_bp = Blueprint("ai", __name__)


@ai_bp.route("/summary", methods=["POST"])
def summary():
    """
    Génère un résumé structuré à partir des informations patient.
    """
    data = request.get_json()

    if data is None:
        return error_response("Aucune donnée envoyée", 400)

    if not data.get("symptoms"):
        return error_response("Les symptômes sont obligatoires", 400)

    result = generate_summary(data)

    return success_response(result, "Résumé généré avec succès")