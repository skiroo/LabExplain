"""
Fichier : user_routes.py
Dossier : backend/routes/
Description :
    Routes liées aux profils utilisateurs — nouveau schéma.
    GET    /api/users/me                 — profil identité
    PUT    /api/users/me                 — modifier identité
    DELETE /api/users/me                 — supprimer compte
    GET    /api/users/me/medical         — données médicales déchiffrées
    PUT    /api/users/me/medical         — enregistrer données médicales chiffrées
    PUT    /api/users/me/password        — changer le mot de passe
"""

from flask import Blueprint, request
from services.user_service import (
    get_all_users,
    get_user_profile,
    update_user_profile,
    update_medical_data,
    get_medical_data,
    update_password,
    delete_user_profile,
)
from utils.response import success_response, error_response

user_bp = Blueprint("users", __name__)


def get_compte_id():
    """
    Récupère l'id_compte depuis le header X-User-Id.
    À remplacer par JWT plus tard.
    """
    raw = request.headers.get("X-User-Id")
    return int(raw) if raw else None


@user_bp.route("/", methods=["GET"])
def get_users():
    return success_response(get_all_users())


@user_bp.route("/me", methods=["GET"])
def get_me():
    compte_id = get_compte_id()
    if not compte_id:
        return error_response("Utilisateur non identifié", 401)

    user = get_user_profile(compte_id)
    if not user:
        return error_response("Utilisateur non trouvé", 404)

    return success_response(user)


@user_bp.route("/me", methods=["PUT"])
def update_me():
    """
    Met à jour les données d'identité (nom, prénom, date_naissance, gender).
    Ne touche pas aux données médicales chiffrées.
    """
    compte_id = get_compte_id()
    if not compte_id:
        return error_response("Utilisateur non identifié", 401)

    data = request.get_json()
    if not data:
        return error_response("Aucune donnée envoyée", 400)

    user, error = update_user_profile(compte_id, data)
    if error:
        return error_response(error, 400)

    return success_response(user, "Profil mis à jour")


@user_bp.route("/me/medical", methods=["GET"])
def get_medical():
    """
    Retourne les données médicales déchiffrées.
    Requiert le mot de passe dans le header X-User-Password.
    """
    compte_id = get_compte_id()
    if not compte_id:
        return error_response("Utilisateur non identifié", 401)

    password = request.headers.get("X-User-Password")
    if not password:
        return error_response("Mot de passe requis pour accéder aux données médicales", 403)

    data, error = get_medical_data(compte_id, password)
    if error:
        return error_response(error, 400)

    return success_response(data)


@user_bp.route("/me/medical", methods=["PUT"])
def update_medical():
    """
    Chiffre et enregistre les données médicales.
    Requiert le mot de passe dans le header X-User-Password.
    Body : { antecedents, traitements, allergies, poids, taille }
    """
    compte_id = get_compte_id()
    if not compte_id:
        return error_response("Utilisateur non identifié", 401)

    password = request.headers.get("X-User-Password")
    if not password:
        return error_response("Mot de passe requis pour chiffrer les données médicales", 403)

    data = request.get_json()
    if not data:
        return error_response("Aucune donnée envoyée", 400)

    result, error = update_medical_data(compte_id, data, password)
    if error:
        return error_response(error, 400)

    return success_response(None, "Données médicales enregistrées")


@user_bp.route("/me/password", methods=["PUT"])
def change_password():
    """
    Change le mot de passe après vérification de l'ancien.
    Body : { current_password, new_password }
    """
    compte_id = get_compte_id()
    if not compte_id:
        return error_response("Utilisateur non identifié", 401)

    data = request.get_json()
    current = data.get("current_password", "")
    new     = data.get("new_password", "")

    if not current or not new:
        return error_response("Les deux mots de passe sont obligatoires", 400)

    ok, error = update_password(compte_id, current, new)
    if not ok:
        return error_response(error, 400)

    return success_response(None, "Mot de passe mis à jour")


@user_bp.route("/me", methods=["DELETE"])
def delete_me():
    compte_id = get_compte_id()
    if not compte_id:
        return error_response("Utilisateur non identifié", 401)

    deleted = delete_user_profile(compte_id)
    if not deleted:
        return error_response("Utilisateur non trouvé", 404)

    return success_response(None, "Compte supprimé définitivement")
