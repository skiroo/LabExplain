"""
Fichier : user_routes.py
Dossier : backend/routes/
Description :
    Définit les routes liées aux utilisateurs.
    Ces routes permettent au frontend web et au frontend mobile de récupérer,
    modifier ou supprimer les informations des utilisateurs.
"""

from flask import Blueprint, request
from services.user_service import (
    get_all_users,
    get_user_profile,
    update_user_profile,
    delete_user_profile
)
from utils.response import success_response, error_response

user_bp = Blueprint("users", __name__)


@user_bp.route("/", methods=["GET"])
def get_users():
    """
    Retourne la liste des utilisateurs.
    """
    users = get_all_users()
    return success_response(users)


@user_bp.route("/me", methods=["GET"])
def get_me():
    """
    Retourne le profil de l'utilisateur courant.
    """
    user = get_user_profile()

    if not user:
        return error_response("Utilisateur non trouvé", 404)

    return success_response(user)


@user_bp.route("/me", methods=["PUT"])
def update_me():
    """
    Met à jour le profil de l'utilisateur courant.
    """
    data = request.get_json()

    if data is None:
        return error_response("Aucune donnée envoyée", 400)

    user = update_user_profile(data)

    if not user:
        return error_response("Utilisateur non trouvé", 404)

    return success_response(user, "Profil mis à jour avec succès")


@user_bp.route("/me", methods=["DELETE"])
def delete_me():
    """
    Supprime le compte de l'utilisateur courant.
    """
    deleted = delete_user_profile()

    if not deleted:
        return error_response("Utilisateur non trouvé", 404)

    return success_response(None, "Compte supprimé avec succès")