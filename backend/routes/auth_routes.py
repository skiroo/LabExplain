"""
Fichier : auth_routes.py
Dossier : backend/routes/
Description :
    Routes d'authentification — nouveau schéma RGPD Option B.
    POST /api/auth/check-email     — vérifie format + domaine MX + unicité
    POST /api/auth/register        — inscription
    POST /api/auth/login           — connexion
    POST /api/auth/logout          — déconnexion (envoie email)
    GET  /api/auth/confirm-email   — confirmation email via token
    GET  /api/auth/me              — profil utilisateur courant
"""

from flask import Blueprint, request
from services.auth_service import (
    register_user,
    login_user,
    logout_user,
    confirm_email,
    get_current_user,
)
from utils.response import success_response, error_response
from utils.email_validator import validate_email_full
from database.db import mysql

auth_bp = Blueprint("auth", __name__)


@auth_bp.route("/check-email", methods=["POST"])
def check_email():
    """
    Vérifie qu'un email est utilisable pour l'inscription :
    1. Format + détection jetables via Abstract API (fallback local si indisponible)
    2. Non déjà utilisé en base
    """
    data  = request.get_json()
    email = (data.get("email") or "").strip().lower()

    if not email:
        return error_response("Email manquant", 400)

    # Validation complète — Abstract API + fallback local
    valid, msg = validate_email_full(email)
    if not valid:
        return error_response(msg, 400)

    # Unicité en base
    try:
        cursor = mysql.connection.cursor()
        cursor.execute("SELECT id_compte FROM Compte WHERE email = %s", (email,))
        existing = cursor.fetchone()
        cursor.close()

        if existing:
            return error_response("Un compte existe déjà avec cet email", 400)

    except Exception as error:
        return error_response(f"Erreur de vérification : {str(error)}", 500)

    return success_response({"email": email}, "Email disponible")


@auth_bp.route("/register", methods=["POST"])
def register():
    """
    Crée un nouveau compte.
    Envoie un email de confirmation avec CGU et charte RGPD.
    Le compte est actif uniquement après confirmation email.
    """
    data = request.get_json()

    if not data:
        return error_response("Aucune donnée reçue", 400)

    user, error = register_user(data)

    if error:
        return error_response(error, 400)

    return success_response(
        user,
        "Compte créé. Vérifiez votre email pour activer votre compte."
    )


@auth_bp.route("/login", methods=["POST"])
def login():
    """
    Connecte un utilisateur après vérification bcrypt et confirmation email.
    """
    data = request.get_json()

    if not data:
        return error_response("Aucune donnée reçue", 400)

    result, error = login_user(data)

    if error:
        return error_response(error, 401)

    return success_response(result, "Connexion réussie")


@auth_bp.route("/logout", methods=["POST"])
def logout():
    """
    Déconnecte l'utilisateur et envoie un email de notification RGPD.
    """
    compte_id = request.headers.get("X-User-Id")

    if not compte_id:
        return error_response("Utilisateur non identifié", 401)

    logout_user(int(compte_id))

    return success_response(None, "Déconnexion effectuée")


@auth_bp.route("/confirm-email", methods=["GET"])
def confirm_email_route():
    """
    Valide le token de confirmation email.
    Appelé depuis le lien dans l'email d'inscription.
    Redirige vers la page de connexion après validation.
    """
    token = request.args.get("token")

    if not token:
        return error_response("Token manquant", 400)

    compte, error = confirm_email(token)

    if error:
        return error_response(error, 400)

    # Retourne un JSON — le frontend gère la redirection
    return success_response(
        {"email": compte.get("email"), "role": compte.get("role")},
        "Email confirmé. Vous pouvez maintenant vous connecter."
    )


@auth_bp.route("/me", methods=["GET"])
def me():
    """
    Retourne le profil de l'utilisateur courant via X-User-Id.
    """
    compte_id = request.headers.get("X-User-Id")

    if not compte_id:
        return error_response("Utilisateur non identifié", 401)

    user = get_current_user(int(compte_id))

    if not user:
        return error_response("Utilisateur non trouvé", 404)

    return success_response(user)


@auth_bp.route("/resend-confirmation", methods=["POST"])
def resend_confirmation():
    """
    Renvoie l'email de confirmation si le compte existe et n'est pas encore vérifié.
    Génère un nouveau token avec une nouvelle expiration de 24h.
    Limité à un renvoi toutes les 60 secondes côté frontend (le backend ne rate-limite pas ici).
    """
    data  = request.get_json()
    email = (data.get("email") or "").strip().lower()

    if not email:
        return error_response("Email manquant", 400)

    from services.auth_service import resend_confirmation_email
    ok, error = resend_confirmation_email(email)

    if not ok:
        return error_response(error, 400)

    return success_response(None, "Email de confirmation renvoyé")
