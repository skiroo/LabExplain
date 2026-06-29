"""
Fichier : consultation_routes.py
Dossier : backend/routes/
Description :
    Définit les routes liées aux consultations.
    Le compte_id (id_compte) est extrait du header X-User-Id (en attendant JWT).
    Le service consultation_service se charge de résoudre l'id_patient
    correspondant, Compte et Patient étant deux tables distinctes.
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


def get_user_id_from_request():
    """
    Récupère l'identifiant de compte (id_compte) depuis le header X-User-Id.
    À remplacer plus tard par un vrai décodage de token JWT.
    """
    return request.headers.get("X-User-Id")


@consultation_bp.route("/", methods=["POST"])
def create():
    """
    Crée une nouvelle consultation liée au patient connecté.
    """
    compte_id = get_user_id_from_request()

    if not compte_id:
        return error_response("Utilisateur non identifié", 401)

    data = request.get_json()

    consultation, error = create_consultation(data, compte_id)

    if error:
        return error_response(error, 400)

    return success_response(consultation, "Consultation créée avec succès")


@consultation_bp.route("/", methods=["GET"])
def get_consultations():
    """
    Retourne les consultations.
    Si le header X-User-Id est présent, retourne uniquement celles du patient connecté.
    """
    compte_id = get_user_id_from_request()

    consultations = get_all_consultations(compte_id)
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