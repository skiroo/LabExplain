"""
Fichier : consultation_routes.py
Dossier : backend/routes/
Description :
    Définit les routes liées aux consultations.
    Ces routes permettent au frontend web et au frontend mobile de créer,
    récupérer et supprimer les consultations préparées par les patients.
"""

from flask import Blueprint, request
from services.consultation_service import (
    create_consultation,
    get_all_consultations,
    get_consultation_by_id,
    delete_consultation_by_id
)
from utils.response import success_response, error_response

consultation_bp = Blueprint("consultations", __name__)


@consultation_bp.route("/", methods=["POST"])
def create():
    """
    Crée une nouvelle consultation.
    """
    data = request.get_json()

    consultation, error = create_consultation(data)

    if error:
        return error_response(error, 400)

    return success_response(consultation, "Consultation créée avec succès")


@consultation_bp.route("/", methods=["GET"])
def get_consultations():
    """
    Retourne toutes les consultations créées.
    """
    consultations = get_all_consultations()
    return success_response(consultations)


@consultation_bp.route("/<int:consultation_id>", methods=["GET"])
def get_consultation(consultation_id):
    """
    Retourne une consultation précise à partir de son identifiant.
    """
    consultation = get_consultation_by_id(consultation_id)

    if not consultation:
        return error_response("Consultation non trouvée", 404)

    return success_response(consultation)


@consultation_bp.route("/<int:consultation_id>", methods=["DELETE"])
def delete_consultation(consultation_id):
    """
    Supprime une consultation précise à partir de son identifiant.
    """
    deleted = delete_consultation_by_id(consultation_id)

    if not deleted:
        return error_response("Consultation non trouvée", 404)

    return success_response(None, "Consultation supprimée avec succès")