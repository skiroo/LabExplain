"""
Fichier : user_service.py
Dossier : backend/services/
Description :
    Logique métier liée aux profils utilisateurs — nouveau schéma RGPD Option B.
    Les données médicales sont lues/écrites chiffrées via crypto_utils.
    Le frontend fournit la clé de déchiffrement dérivée du mot de passe (PBKDF2).
"""

from database.db import mysql
from utils.auth_utils import remove_sensitive_fields
from utils.crypto_utils import (
    derive_encryption_key,
    encrypt_medical_data,
    decrypt_medical_data,
    hash_password,
)


def get_all_users():
    """
    Retourne la liste des comptes (sans données sensibles).
    """
    cursor = mysql.connection.cursor()
    try:
        cursor.execute(
            """
            SELECT c.id_compte, c.email, c.role, c.email_verifie, c.created_at,
                   COALESCE(p.nom, m.nom)     AS nom,
                   COALESCE(p.prenom, m.prenom) AS prenom
            FROM Compte c
            LEFT JOIN Patient p ON p.id_compte = c.id_compte
            LEFT JOIN Medecin m ON m.id_compte = c.id_compte
            """
        )
        return cursor.fetchall()
    except Exception:
        return []
    finally:
        cursor.close()


def get_user_profile(compte_id: int):
    """
    Retourne le profil identité d'un utilisateur (sans données médicales déchiffrées).
    """
    cursor = mysql.connection.cursor()
    try:
        cursor.execute(
            """
            SELECT c.id_compte, c.email, c.role, c.email_verifie,
                   c.consent, c.consent_date, c.created_at,
                   p.id_patient, p.nom, p.prenom, p.date_naissance, p.gender,
                   m.id_medecin, m.rpps_saisi, m.rpps_verifie, s.libelle AS specialite
            FROM Compte c
            LEFT JOIN Patient p ON p.id_compte = c.id_compte
            LEFT JOIN Medecin m ON m.id_compte = c.id_compte
            LEFT JOIN Specialite s ON s.id_specialite = m.id_specialite
            WHERE c.id_compte = %s
            """,
            (compte_id,)
        )
        row = cursor.fetchone()
        return dict(row) if row else None
    except Exception:
        return None
    finally:
        cursor.close()


def get_medical_data(compte_id: int, password: str):
    """
    Retourne les données médicales déchiffrées du patient.
    Nécessite le mot de passe pour dériver la clé PBKDF2.
    Retourne (données_claires, None) ou (None, message_erreur).
    """
    cursor = mysql.connection.cursor()
    try:
        # Récupère le sel de chiffrement depuis Compte
        cursor.execute(
            """
            SELECT c.encryption_salt, p.id_patient
            FROM Compte c
            JOIN Patient p ON p.id_compte = c.id_compte
            WHERE c.id_compte = %s
            """,
            (compte_id,)
        )
        row = cursor.fetchone()

        if not row or not row["encryption_salt"]:
            return None, "Données de chiffrement introuvables"

        key = derive_encryption_key(password, row["encryption_salt"])

        cursor.execute(
            "SELECT * FROM DonneesPatient WHERE id_patient = %s",
            (row["id_patient"],)
        )
        enc_data = cursor.fetchone()

        if not enc_data:
            return {}, None

        return decrypt_medical_data(dict(enc_data), key), None

    except Exception as error:
        return None, f"Erreur lors du déchiffrement : {str(error)}"
    finally:
        cursor.close()


def update_user_profile(compte_id: int, data: dict):
    """
    Met à jour les données d'identité du patient (nom, prénom, date_naissance, gender).
    Ne touche pas aux données médicales chiffrées.
    """
    cursor = mysql.connection.cursor()
    try:
        cursor.execute(
            "SELECT * FROM Patient WHERE id_compte = %s",
            (compte_id,)
        )
        patient = cursor.fetchone()

        if not patient:
            return None, "Patient introuvable"

        nom            = data.get("nom",            patient["nom"])
        prenom         = data.get("prenom",         patient["prenom"])
        date_naissance = data.get("birthdate",      patient["date_naissance"])
        gender         = data.get("gender",         patient["gender"])

        cursor.execute(
            """
            UPDATE Patient
            SET nom = %s, prenom = %s, date_naissance = %s, gender = %s
            WHERE id_compte = %s
            """,
            (nom, prenom, date_naissance, gender, compte_id)
        )
        mysql.connection.commit()

        return get_user_profile(compte_id), None

    except Exception as error:
        mysql.connection.rollback()
        return None, f"Erreur lors de la mise à jour : {str(error)}"
    finally:
        cursor.close()


def update_medical_data(compte_id: int, data: dict, password: str):
    """
    Met à jour les données médicales chiffrées du patient.
    data doit contenir les champs en clair : antecedents, traitements, allergies, poids, taille.
    password est le mot de passe actuel pour dériver la clé.
    """
    cursor = mysql.connection.cursor()
    try:
        cursor.execute(
            """
            SELECT c.encryption_salt, p.id_patient
            FROM Compte c
            JOIN Patient p ON p.id_compte = c.id_compte
            WHERE c.id_compte = %s
            """,
            (compte_id,)
        )
        row = cursor.fetchone()

        if not row or not row["encryption_salt"]:
            return None, "Données de chiffrement introuvables"

        key = derive_encryption_key(password, row["encryption_salt"])
        encrypted = encrypt_medical_data(data, key)

        cursor.execute(
            """
            UPDATE DonneesPatient
            SET antecedents_enc = %s,
                traitements_enc = %s,
                allergies_enc   = %s,
                poids_enc       = %s,
                taille_enc      = %s
            WHERE id_patient = %s
            """,
            (
                encrypted.get("antecedents_enc"),
                encrypted.get("traitements_enc"),
                encrypted.get("allergies_enc"),
                encrypted.get("poids_enc"),
                encrypted.get("taille_enc"),
                row["id_patient"]
            )
        )
        mysql.connection.commit()
        return True, None

    except Exception as error:
        mysql.connection.rollback()
        return None, f"Erreur lors du chiffrement : {str(error)}"
    finally:
        cursor.close()


def update_password(compte_id: int, current_password: str, new_password: str):
    """
    Change le mot de passe d'un utilisateur.
    Vérifie l'ancien mot de passe avant de mettre à jour.
    """
    from utils.crypto_utils import verify_password
    from utils.validators import validate_password

    cursor = mysql.connection.cursor()
    try:
        cursor.execute(
            "SELECT password_hash FROM Compte WHERE id_compte = %s",
            (compte_id,)
        )
        compte = cursor.fetchone()

        if not compte:
            return False, "Compte introuvable"

        if not verify_password(current_password, compte["password_hash"]):
            return False, "Mot de passe actuel incorrect"

        valid, msg = validate_password(new_password)
        if not valid:
            return False, msg

        new_hash = hash_password(new_password)
        cursor.execute(
            "UPDATE Compte SET password_hash = %s WHERE id_compte = %s",
            (new_hash, compte_id)
        )
        mysql.connection.commit()
        return True, None

    except Exception as error:
        mysql.connection.rollback()
        return False, f"Erreur : {str(error)}"
    finally:
        cursor.close()


def delete_user_profile(compte_id: int):
    """
    Supprime le compte et toutes ses données.
    Utilise la procédure stockée sp_supprimer_compte qui anonymise
    d'abord l'identité et les données médicales avant de supprimer
    le compte, conformément au flux RGPD défini dans le schéma.
    """
    cursor = mysql.connection.cursor()
    try:
        cursor.execute("CALL sp_supprimer_compte(%s)", (compte_id,))
        mysql.connection.commit()
        return True
    except Exception:
        mysql.connection.rollback()
        return False
    finally:
        cursor.close()
