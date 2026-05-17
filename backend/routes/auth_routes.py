"""
Fichier : auth_routes.py
Dossier : backend/routes/
Description :
    Définit les routes liées à l'authentification des utilisateurs.
    Ces routes permettent au frontend web et au frontend mobile de créer un compte,
    se connecter et récupérer les informations de l'utilisateur courant.
"""

from flask import Blueprint, request
from services.auth_service import register_user, login_user, get_current_user
from utils.response import success_response, error_response

auth_bp = Blueprint("auth", __name__)


@auth_bp.route("/register", methods=["POST"])
def register():
    """
    Crée un nouveau compte utilisateur.
    """
    data = request.get_json()

    user, error = register_user(data)

    if error:
        return error_response(error, 400)

    return success_response(user, "Compte créé avec succès")


@auth_bp.route("/login", methods=["POST"])
def login():
    """
    Connecte un utilisateur avec son email et son mot de passe.
    """
    data = request.get_json()

    result, error = login_user(data)

    if error:
        return error_response(error, 401)

    return success_response(result, "Connexion réussie")


@auth_bp.route("/me", methods=["GET"])
def me():
    """
    Retourne les informations de l'utilisateur courant.
    """
    user = get_current_user()

    if not user:
        return error_response("Utilisateur non trouvé", 404)

    return success_response(user)