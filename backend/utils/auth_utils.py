"""
Fichier : auth_utils.py
Dossier : backend/utils/
Description :
    Fonctions utilitaires liées à l'authentification et aux données utilisateur.
"""


def remove_sensitive_fields(user: dict) -> dict:
    """
    Retourne une copie du dict utilisateur sans les champs sensibles.
    Supprime password_hash, token_verification, token_expiration, encryption_salt.
    """
    if not user:
        return None

    user_copy = dict(user)
    for field in ("password_hash", "token_verification", "token_expiration", "encryption_salt"):
        user_copy.pop(field, None)

    return user_copy


# Alias pour la compatibilité avec l'ancien code
def remove_password(user: dict) -> dict:
    return remove_sensitive_fields(user)
