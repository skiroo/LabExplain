"""
Fichier : consultation_service.py
Dossier : backend/services/
Description :
    Contient la logique métier liée aux consultations.
    Ce fichier permet de créer, récupérer et supprimer temporairement les consultations
    préparées par les patients dans le backend LabExplain.
"""

from database.temp_data import consultations


def create_consultation(data):
    """
    Crée une nouvelle consultation à partir des données envoyées par l'utilisateur.
    """
    doctor_id = data.get("doctorId")
    language = data.get("language", "fr")
    symptoms = data.get("symptoms")
    medical_history = data.get("medicalHistory", "")
    current_treatments = data.get("currentTreatments", "")
    pain_level = data.get("painLevel")
    additional_notes = data.get("additionalNotes", "")

    if not symptoms:
        return None, "Les symptômes sont obligatoires"

    new_consultation = {
        "id": len(consultations) + 1,
        "doctorId": doctor_id,
        "language": language,
        "symptoms": symptoms,
        "medicalHistory": medical_history,
        "currentTreatments": current_treatments,
        "painLevel": pain_level,
        "additionalNotes": additional_notes,
        "status": "draft"
    }

    # Ajoute la consultation dans la liste temporaire
    consultations.append(new_consultation)

    return new_consultation, None


def get_all_consultations():
    """
    Retourne toutes les consultations temporaires.
    """
    return consultations


def get_consultation_by_id(consultation_id):
    """
    Recherche une consultation à partir de son identifiant.
    """
    for consultation in consultations:
        if consultation["id"] == consultation_id:
            return consultation

    return None


def delete_consultation_by_id(consultation_id):
    """
    Supprime une consultation à partir de son identifiant.
    """
    for consultation in consultations:
        if consultation["id"] == consultation_id:
            consultations.remove(consultation)
            return True

    return False