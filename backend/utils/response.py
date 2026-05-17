"""
Fichier : response.py
Dossier : backend/utils/
Description :
    Contient des fonctions utilitaires pour standardiser les réponses JSON du backend LabExplain.
    Ces fonctions permettent de garder le même format de réponse pour toutes les routes Flask.
"""


def success_response(data=None, message="Success"):
    """
    Retourne une réponse JSON standard en cas de succès.
    """
    return {
        "success": True,
        "message": message,
        "data": data
    }


def error_response(message="Erreur", status_code=400):
    """
    Retourne une réponse JSON standard en cas d'erreur.
    """
    return {
        "success": False,
        "message": message
    }, status_code