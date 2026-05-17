"""
Fichier : doctor_service.py
Dossier : backend/services/
Description :
    Contient la logique métier liée aux médecins.
    Ce fichier permet de récupérer la liste des médecins disponibles et les informations
    d'un médecin précis dans le backend LabExplain.
"""

from database.temp_data import doctors


def get_all_doctors():
    """
    Retourne la liste temporaire des médecins.
    """
    return doctors


def get_doctor_by_id(doctor_id):
    """
    Recherche un médecin à partir de son identifiant.
    """
    for doctor in doctors:
        if doctor["id"] == doctor_id:
            return doctor

    return None