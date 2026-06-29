"""
Fichier : rendezvous_routes.py
Dossier : backend/routes/
Description :
    Routes liées aux rendez-vous déclarés par le patient.
    Le compte_id (id_compte) est extrait du header X-User-Id (en attendant JWT).

    POST   /api/rendezvous/             — créer un rendez-vous
    GET    /api/rendezvous/             — lister tous les rendez-vous du patient
    GET    /api/rendezvous/upcoming     — lister les rendez-vous à venir
    DELETE /api/rendezvous/<id>         — supprimer un rendez-vous
"""

from flask import Blueprint, request
from services.rendezvous_service import (
    create_rendezvous,
    get_upcoming_rendezvous,
    get_all_rendezvous,
    delete_rendezvous,
)
from utils.response import success_response, error_response

rendezvous_bp = Blueprint("rendezvous", __name__)


def get_compte_id():
    """
    Récupère l'identifiant de compte (id_compte) depuis le header X-User-Id.
    À remplacer plus tard par un vrai décodage de token JWT.
    """
    raw = request.headers.get("X-User-Id")
    return int(raw) if raw else None


@rendezvous_bp.route("/", methods=["POST"])
def create():
    """
    Déclare un nouveau rendez-vous pour le patient connecté.
    """
    compte_id = get_compte_id()

    if not compte_id:
        return error_response("Utilisateur non identifié", 401)

    data = request.get_json()

    if data is None:
        return error_response("Aucune donnée envoyée", 400)

    rendezvous, error = create_rendezvous(data, compte_id)

    if error:
        return error_response(error, 400)

    return success_response(rendezvous, "Rendez-vous créé avec succès")


@rendezvous_bp.route("/", methods=["GET"])
def get_all():
    """
    Retourne tous les rendez-vous (passés et à venir) du patient connecté.
    """
    compte_id = get_compte_id()

    if not compte_id:
        return error_response("Utilisateur non identifié", 401)

    rendezvous = get_all_rendezvous(compte_id)
    return success_response(rendezvous)


@rendezvous_bp.route("/upcoming", methods=["GET"])
def get_upcoming():
    """
    Retourne les rendez-vous à venir du patient connecté, utilisé pour la
    liste déroulante affichée avant de démarrer l'entretien de préparation.
    """
    compte_id = get_compte_id()

    if not compte_id:
        return error_response("Utilisateur non identifié", 401)

    rendezvous = get_upcoming_rendezvous(compte_id)
    return success_response(rendezvous)


@rendezvous_bp.route("/<int:rendezvous_id>", methods=["DELETE"])
def delete(rendezvous_id):
    """
    Supprime un rendez-vous appartenant au patient connecté.
    """
    compte_id = get_compte_id()

    if not compte_id:
        return error_response("Utilisateur non identifié", 401)

    success, error = delete_rendezvous(rendezvous_id, compte_id)

    if error:
        return error_response(error, 400 if not success else 200)

    return success_response(None, "Rendez-vous supprimé avec succès")
