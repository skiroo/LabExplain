"""
Fichier : consultation_service.py
Dossier : backend/services/
Description :
    Contient la logique métier liée aux consultations.
    Ce fichier exécute les requêtes MySQL sur la table Consultation.
"""

from database.db import mysql


def _resolve_patient_id(cursor, compte_id):
    """
    Résout l'id_patient à partir de l'id_compte connecté.
    Le header X-User-Id transporte un id_compte (pas un id_patient) :
    Compte et Patient sont deux tables distinctes (séparation RGPD).
    Retourne l'id_patient ou None si introuvable.
    """
    cursor.execute(
        "SELECT id_patient FROM Patient WHERE id_compte = %s",
        (compte_id,)
    )
    row = cursor.fetchone()
    return row["id_patient"] if row else None


def create_consultation(data, compte_id):
    """
    Crée une nouvelle consultation en base de données.
    compte_id est l'id_compte du patient connecté (extrait du header X-User-Id).
    """
    doctor_id = data.get("doctorId")
    language = data.get("language", "fr")
    symptoms = data.get("symptoms")
    medical_history = data.get("medicalHistory", "")
    current_treatments = data.get("currentTreatments", "")
    pain_level = data.get("painLevel")
    additional_notes  = data.get("additionalNotes", "")

    if not symptoms:
        return None, "Les symptômes sont obligatoires"

    cursor = mysql.connection.cursor()

    try:
        patient_id = _resolve_patient_id(cursor, compte_id)
        if not patient_id:
            return None, "Patient introuvable pour ce compte"

        cursor.execute(
            """
            INSERT INTO Consultation (
                langue,
                symptomes,
                historique_medical,
                traitements_actuels,
                niveau_douleur,
                notes_complementaires,
                id_medecin,
                id_patient,
                statut
            )
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
            """,
            (
                language,
                symptoms,
                medical_history,
                current_treatments,
                pain_level,
                additional_notes,
                doctor_id,
                patient_id,
                "draft"
            )
        )

        mysql.connection.commit()
        consultation_id = cursor.lastrowid

        cursor.execute(
            "SELECT * FROM Consultation WHERE id_consultation = %s",
            (consultation_id,)
        )
        new_consultation = cursor.fetchone()
        return new_consultation, None

    except Exception as error:
        mysql.connection.rollback()
        return None, f"Erreur lors de la création de la consultation : {str(error)}"

    finally:
        cursor.close()


def get_all_consultations(compte_id=None):
    """
    Retourne toutes les consultations.
    Si compte_id est fourni, retourne uniquement les consultations
    du patient lié à ce compte.
    """
    cursor = mysql.connection.cursor()

    try:
        if compte_id:
            patient_id = _resolve_patient_id(cursor, compte_id)
            if not patient_id:
                return []

            cursor.execute(
                """
                SELECT
                    c.*,
                    m.nom AS medecin_nom,
                    m.prenom AS medecin_prenom,
                    s.libelle AS medecin_specialite
                FROM Consultation c
                LEFT JOIN Medecin m ON c.id_medecin = m.id_medecin
                LEFT JOIN Specialite s ON s.id_specialite = m.id_specialite
                WHERE c.id_patient = %s
                ORDER BY c.date_heure DESC
                """,
                (patient_id,)
            )
        else:
            cursor.execute(
                """
                SELECT
                    c.*,
                    m.nom AS medecin_nom,
                    m.prenom AS medecin_prenom,
                    s.libelle AS medecin_specialite
                FROM Consultation c
                LEFT JOIN Medecin m ON c.id_medecin = m.id_medecin
                LEFT JOIN Specialite s ON s.id_specialite = m.id_specialite
                ORDER BY c.date_heure DESC
                """
            )

        consultations = cursor.fetchall()
        return consultations

    except Exception:
        return []

    finally:
        cursor.close()


def get_consultation_by_id(consultation_id):
    """
    Retourne une consultation précise avec les infos du médecin associé.
    """
    cursor = mysql.connection.cursor()

    try:
        cursor.execute(
            """
            SELECT
                c.*,
                m.nom AS medecin_nom,
                m.prenom AS medecin_prenom,
                s.libelle AS medecin_specialite
            FROM Consultation c
            LEFT JOIN Medecin m ON c.id_medecin = m.id_medecin
            LEFT JOIN Specialite s ON s.id_specialite = m.id_specialite
            WHERE c.id_consultation = %s
            """,
            (consultation_id,)
        )
        consultation = cursor.fetchone()
        return consultation

    except Exception:
        return None

    finally:
        cursor.close()


def delete_consultation_by_id(consultation_id):
    """
    Supprime une consultation à partir de son identifiant.
    """
    cursor = mysql.connection.cursor()

    try:
        cursor.execute(
            "DELETE FROM Consultation WHERE id_consultation = %s",
            (consultation_id,)
        )
        mysql.connection.commit()
        return cursor.rowcount > 0

    except Exception:
        mysql.connection.rollback()
        return False

    finally:
        cursor.close()