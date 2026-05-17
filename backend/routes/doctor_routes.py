"""
Fichier : doctor_routes.py
Dossier : backend/routes/
Description :
    Définit les routes liées aux médecins.
    Ces routes permettent au frontend web et au frontend mobile de récupérer
    la liste des médecins disponibles ou le détail d'un médecin précis.
"""

from flask import Blueprint
from services.doctor_service import get_all_doctors, get_doctor_by_id
from utils.response import success_response, error_response

doctor_bp = Blueprint("doctors", __name__)


@doctor_bp.route("/", methods=["GET"])
def get_doctors():
    """
    Retourne tous les médecins disponibles.
    """
    doctors = get_all_doctors()
    return success_response(doctors)


@doctor_bp.route("/<int:doctor_id>", methods=["GET"])
def get_doctor(doctor_id):
    """
    Retourne les informations d'un médecin à partir de son identifiant.
    """
    doctor = get_doctor_by_id(doctor_id)

    if not doctor:
        return error_response("Médecin non trouvé", 404)

    return success_response(doctor)