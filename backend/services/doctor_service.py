"""
Fichier : doctor_service.py
Dossier : backend/services/
Description :
    Logique métier liée aux médecins — nouveau schéma.
    La table Medecin n'a plus d'email directement : on joint avec Compte.
"""

from database.db import mysql


def get_all_doctors():
    """
    Retourne la liste de tous les médecins avec leur email depuis Compte.
    """
    cursor = mysql.connection.cursor()
    try:
        cursor.execute(
            """
            SELECT m.id_medecin, m.nom, m.prenom, m.specialite, c.email
            FROM Medecin m
            JOIN Compte c ON c.id_compte = m.id_compte
            ORDER BY m.nom, m.prenom
            """
        )
        return cursor.fetchall()
    except Exception:
        return []
    finally:
        cursor.close()


def get_doctor_by_id(doctor_id: int):
    """
    Retourne un médecin précis avec son email.
    """
    cursor = mysql.connection.cursor()
    try:
        cursor.execute(
            """
            SELECT m.id_medecin, m.nom, m.prenom, m.specialite, c.email
            FROM Medecin m
            JOIN Compte c ON c.id_compte = m.id_compte
            WHERE m.id_medecin = %s
            """,
            (doctor_id,)
        )
        return cursor.fetchone()
    except Exception:
        return None
    finally:
        cursor.close()
