"""
Fichier : ai_service.py
Dossier : backend/services/
Description :
    Contient les fonctions liées au traitement IA de LabExplain.
    Pour l'instant, ce fichier retourne une réponse temporaire afin de tester l'API.

À compléter plus tard :
    Maxime devra remplacer la réponse temporaire par un vrai module IA capable
    de générer un résumé structuré et des questions pertinentes sans diagnostic médical.
"""


def generate_summary(data):
    """
    Génère temporairement un résumé à partir des informations patient.
    """
    # TODO Maxime : remplacer cette logique temporaire par le vrai traitement IA
    symptoms = data.get("symptoms")
    language = data.get("language", "fr")

    return {
        "language": language,
        "summary": f"Résumé temporaire des symptômes : {symptoms}",
        "questions": [
            "Depuis quand les symptômes ont-ils commencé ?",
            "Les symptômes sont-ils constants ou ponctuels ?",
            "Avez-vous pris un traitement récemment ?"
        ],
        "warning": "Ce résumé ne constitue pas un diagnostic médical."
    }