"""
Fichier : auth_service.py
Dossier : backend/services/
Description :
    Contient la logique métier liée à l'authentification des utilisateurs.
    Ce fichier gère l'inscription, la connexion et la récupération temporaire de l'utilisateur courant
    pour l'API Flask partagée entre le frontend web et le frontend mobile.
"""

from database.temp_data import users


def remove_password(user):
    """
    Retourne une copie de l'utilisateur sans son mot de passe.
    """
    user_without_password = user.copy()
    user_without_password.pop("password", None)
    return user_without_password


def register_user(data):
    """
    Crée un nouvel utilisateur à partir des données reçues.
    """
    nom = data.get("nom")
    prenom = data.get("prenom")
    email = data.get("email")
    password = data.get("password")
    role = data.get("role", "patient")
    consent = data.get("consent", False)

    # Vérifie les champs obligatoires
    if not nom or not prenom or not email or not password:
        return None, "Tous les champs obligatoires doivent être remplis"

    # Le consentement est obligatoire car le projet manipule des données sensibles
    if consent is not True:
        return None, "Le consentement est obligatoire"

    # Vérifie si un compte existe déjà avec cet email
    for user in users:
        if user["email"] == email:
            return None, "Un compte existe déjà avec cet email"

    new_user = {
        "id": len(users) + 1,
        "nom": nom,
        "prenom": prenom,
        "email": email,
        "password": password,
        "role": role,
        "antecedents": data.get("antecedents", ""),
        "traitements": data.get("traitements", ""),
        "allergies": data.get("allergies", ""),
        "birthdate": data.get("birthdate", ""),
        "gender": data.get("gender", ""),
        "weight": data.get("weight"),
        "height": data.get("height"),
        "consent": consent
    }

    users.append(new_user)

    return remove_password(new_user), None


def login_user(data):
    """
    Vérifie les identifiants et retourne un utilisateur connecté.
    """
    email = data.get("email")
    password = data.get("password")

    if not email or not password:
        return None, "Email et mot de passe obligatoires"

    # Recherche un utilisateur avec les identifiants donnés
    for user in users:
        if user["email"] == email and user["password"] == password:
            return {
                "token": "fake-token-for-now",
                "user": remove_password(user)
            }, None

    return None, "Email ou mot de passe incorrect"


def get_current_user():
    """
    Retourne temporairement le premier utilisateur de la liste.
    """
    if len(users) == 0:
        return None

    return remove_password(users[0])