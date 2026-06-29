"""
Fichier : doctor_routes.py
Dossier : backend/routes/
Description :
    Définit les routes liées aux médecins.
    Ces routes permettent au frontend web et au frontend mobile de récupérer
    la liste des médecins disponibles ou le détail d'un médecin précis.
"""

from flask import Blueprint, request
from services.doctor_service import (
    get_all_doctors,
    get_doctor_by_id,
    search_cabinets_near,
    get_cabinet_by_id,
)
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


@doctor_bp.route("/map", methods=["GET"])
def get_doctors_map():
    """
    Retourne les cabinets médicaux géolocalisés autour d'un point donné,
    pour affichage sur la carte Leaflet de choix de médecin.

    Query params :
      lat   (obligatoire) — latitude du centre de recherche
      lng   (obligatoire) — longitude du centre de recherche
      q     (optionnel)   — filtre texte sur le nom du médecin
      limit (optionnel)   — nombre maximum de résultats (défaut 200)
    """
    lat_raw = request.args.get("lat")
    lng_raw = request.args.get("lng")

    if not lat_raw or not lng_raw:
        return error_response("Les paramètres 'lat' et 'lng' sont obligatoires", 400)

    try:
        latitude = float(lat_raw)
        longitude = float(lng_raw)
    except ValueError:
        return error_response("Les paramètres 'lat' et 'lng' doivent être numériques", 400)

    query = request.args.get("q", "")
    limit = request.args.get("limit", 200, type=int)

    cabinets = search_cabinets_near(latitude, longitude, query, limit)
    return success_response(cabinets)


@doctor_bp.route("/map/<int:cabinet_id>", methods=["GET"])
def get_doctor_cabinet(cabinet_id):
    """
    Retourne le détail d'un cabinet précis (après sélection d'un marqueur
    sur la carte), pour pré-remplir la création d'un rendez-vous.
    """
    cabinet = get_cabinet_by_id(cabinet_id)

    if not cabinet:
        return error_response("Cabinet non trouvé", 404)

    return success_response(cabinet)