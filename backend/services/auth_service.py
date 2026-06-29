"""
Fichier : auth_service.py
Dossier : backend/services/
Description :
    Logique métier d'authentification — nouveau schéma RGPD Option B.
    - Inscription : crée un Compte + Patient/Medecin + DonneesPatient vide
    - Login : vérifie bcrypt, vérifie email_verifie
    - Confirmation email : valide le token de vérification
    - Logout : envoie l'email de notification
"""

from datetime import datetime, timedelta

from database.db import mysql
from utils.auth_utils import remove_sensitive_fields
from utils.crypto_utils import (
    hash_password,
    verify_password,
    generate_encryption_salt,
    generate_verification_token,
)
from utils.validators import validate_register_data
from utils.email_service import send_confirmation_email, send_logout_email


# ============================================================
# INSCRIPTION
# ============================================================

def register_user(data: dict):
    """
    Crée un nouveau compte utilisateur.
    Flux :
      1. Validation des données
      2. Vérification unicité email dans Compte
      3. Hash du mot de passe (bcrypt)
      4. Génération du sel de chiffrement et du token de vérification
      5. INSERT dans Compte
      6. INSERT dans Patient ou Medecin
      7. INSERT dans DonneesPatient (vide) si patient
      8. Envoi de l'email de confirmation
    Retourne (user_clean, None) ou (None, message_erreur).
    """
    valid, error_msg = validate_register_data(data)
    if not valid:
        return None, error_msg

    nom       = data.get("nom", "").strip()
    prenom    = data.get("prenom", "").strip()
    email     = data.get("email", "").strip().lower()
    password  = data.get("password", "")
    role      = data.get("role", "patient")
    consent   = data.get("consent", False)

    cursor = mysql.connection.cursor()

    try:
        # Vérification unicité email
        cursor.execute("SELECT id_compte FROM Compte WHERE email = %s", (email,))
        if cursor.fetchone():
            return None, "Un compte existe déjà avec cet email"

        # Préparation des credentials
        password_hash      = hash_password(password)
        encryption_salt    = generate_encryption_salt() if role == "patient" else None
        token_verification = generate_verification_token()
        token_expiration   = datetime.now() + timedelta(hours=24)

        # INSERT Compte
        cursor.execute(
            """
            INSERT INTO Compte (
                email, password_hash, role,
                email_verifie, token_verification, token_expiration,
                consent, consent_date, encryption_salt
            )
            VALUES (%s, %s, %s, FALSE, %s, %s, %s, %s, %s)
            """,
            (
                email, password_hash, role,
                token_verification, token_expiration,
                consent, datetime.now() if consent else None,
                encryption_salt
            )
        )
        id_compte = cursor.lastrowid

        # INSERT Patient ou Medecin
        if role == "patient":
            date_naissance = data.get("birthdate") or None
            gender         = data.get("gender") or None

            cursor.execute(
                """
                INSERT INTO Patient (nom, prenom, date_naissance, gender, id_compte)
                VALUES (%s, %s, %s, %s, %s)
                """,
                (nom, prenom, date_naissance, gender, id_compte)
            )
            id_patient = cursor.lastrowid

            # Crée l'entrée DonneesPatient vide — sera remplie après confirmation email
            cursor.execute(
                "INSERT INTO DonneesPatient (id_patient) VALUES (%s)",
                (id_patient,)
            )

        else:
            # La spécialité officielle vient de l'annuaire ANS (MedecinAnnuaire/Specialite),
            # pas d'une saisie libre. Tant que le RPPS n'est pas vérifié, id_specialite
            # reste NULL — on essaie juste de résoudre un libellé saisi pour ne pas le perdre.
            specialite_libelle = (data.get("specialite") or "").strip()
            id_specialite = None
            if specialite_libelle:
                cursor.execute(
                    "SELECT id_specialite FROM Specialite WHERE libelle = %s",
                    (specialite_libelle,)
                )
                row_specialite = cursor.fetchone()
                if row_specialite:
                    id_specialite = row_specialite["id_specialite"]

            rpps_saisi = (data.get("rpps") or "").strip() or None

            cursor.execute(
                """
                INSERT INTO Medecin (nom, prenom, id_specialite, rpps_saisi, id_compte)
                VALUES (%s, %s, %s, %s, %s)
                """,
                (nom, prenom, id_specialite, rpps_saisi, id_compte)
            )

        mysql.connection.commit()

        # Envoi de l'email de confirmation (non bloquant)
        send_confirmation_email(email, prenom, token_verification)

        return {
            "email": email,
            "role":  role,
            "prenom": prenom,
            "email_verifie": False,
        }, None

    except Exception as error:
        mysql.connection.rollback()
        return None, f"Erreur lors de la création du compte : {str(error)}"

    finally:
        cursor.close()


# ============================================================
# CONFIRMATION EMAIL
# ============================================================

def confirm_email(token: str):
    """
    Valide le token de vérification email.
    - Vérifie que le token existe et n'est pas expiré
    - Met email_verifie = TRUE
    - Supprime le token
    Retourne (compte_clean, None) ou (None, message_erreur).
    """
    if not token:
        return None, "Token manquant"

    cursor = mysql.connection.cursor()

    try:
        cursor.execute(
            """
            SELECT * FROM Compte
            WHERE token_verification = %s
              AND token_expiration > %s
            """,
            (token, datetime.now())
        )
        compte = cursor.fetchone()

        if not compte:
            return None, "Lien de confirmation invalide ou expiré"

        cursor.execute(
            """
            UPDATE Compte
            SET email_verifie = TRUE,
                token_verification = NULL,
                token_expiration = NULL
            WHERE id_compte = %s
            """,
            (compte["id_compte"],)
        )
        mysql.connection.commit()

        return remove_sensitive_fields(dict(compte)), None

    except Exception as error:
        mysql.connection.rollback()
        return None, f"Erreur lors de la confirmation : {str(error)}"

    finally:
        cursor.close()


# ============================================================
# CONNEXION
# ============================================================

def login_user(data: dict):
    """
    Vérifie les identifiants et retourne token + profil utilisateur.
    - Vérifie bcrypt
    - Vérifie que l'email est confirmé
    - Joint les données Patient ou Medecin
    Retourne (résultat, None) ou (None, message_erreur).
    """
    email    = (data.get("email") or "").strip().lower()
    password = data.get("password") or ""

    if not email or not password:
        return None, "Email et mot de passe obligatoires"

    cursor = mysql.connection.cursor()

    try:
        cursor.execute(
            "SELECT * FROM Compte WHERE email = %s",
            (email,)
        )
        compte = cursor.fetchone()

        if not compte:
            return None, "Email ou mot de passe incorrect"

        # Vérification bcrypt
        if not verify_password(password, compte["password_hash"]):
            return None, "Email ou mot de passe incorrect"

        # Email non confirmé
        if not compte["email_verifie"]:
            return None, "Veuillez confirmer votre adresse email avant de vous connecter"

        # Construit le profil utilisateur selon le rôle
        user = _build_user_profile(cursor, compte)

        return {
            "token": "fake-token-for-now",
            "user":  user
        }, None

    except Exception as error:
        return None, f"Erreur lors de la connexion : {str(error)}"

    finally:
        cursor.close()


# ============================================================
# DÉCONNEXION
# ============================================================

def logout_user(user_id: int):
    """
    Effectue la déconnexion :
    - Récupère l'email et le prénom depuis la base
    - Envoie l'email de notification de déconnexion
    Retourne True si ok, False sinon.
    """
    if not user_id:
        return False

    cursor = mysql.connection.cursor()

    try:
        # Récupère le prénom depuis Patient ou Medecin
        cursor.execute(
            """
            SELECT c.email, COALESCE(p.prenom, m.prenom) AS prenom
            FROM Compte c
            LEFT JOIN Patient  p ON p.id_compte = c.id_compte
            LEFT JOIN Medecin  m ON m.id_compte = c.id_compte
            WHERE c.id_compte = %s
            """,
            (user_id,)
        )
        row = cursor.fetchone()

        if row:
            send_logout_email(row["email"], row["prenom"])

        return True

    except Exception:
        return False

    finally:
        cursor.close()


# ============================================================
# UTILISATEUR COURANT
# ============================================================

def get_current_user(compte_id: int):
    """
    Retourne le profil complet de l'utilisateur connecté.
    """
    if not compte_id:
        return None

    cursor = mysql.connection.cursor()

    try:
        cursor.execute(
            "SELECT * FROM Compte WHERE id_compte = %s",
            (compte_id,)
        )
        compte = cursor.fetchone()

        if not compte:
            return None

        return _build_user_profile(cursor, compte)

    except Exception:
        return None

    finally:
        cursor.close()


# ============================================================
# HELPER PRIVÉ
# ============================================================

def _build_user_profile(cursor, compte: dict) -> dict:
    """
    Construit le profil utilisateur complet à partir du compte.
    Joint les données Patient (avec DonneesPatient chiffré) ou Medecin.
    Ne retourne JAMAIS password_hash, token, encryption_salt.
    """
    role      = compte["role"]
    id_compte = compte["id_compte"]

    user = {
        "id_compte":     id_compte,
        "email":         compte["email"],
        "role":          role,
        "email_verifie": bool(compte["email_verifie"]),
        "consent":       bool(compte["consent"]),
        "consent_date":  str(compte["consent_date"]) if compte["consent_date"] else None,
        "created_at":    str(compte["created_at"]) if compte["created_at"] else None,
    }

    if role == "patient":
        cursor.execute(
            "SELECT * FROM Patient WHERE id_compte = %s",
            (id_compte,)
        )
        patient = cursor.fetchone()

        if patient:
            user["id_patient"]     = patient["id_patient"]
            user["nom"]            = patient["nom"]
            user["prenom"]         = patient["prenom"]
            user["date_naissance"] = str(patient["date_naissance"]) if patient["date_naissance"] else None
            user["gender"]         = patient["gender"]

            # Les données médicales restent chiffrées côté serveur.
            # Le frontend peut les demander séparément avec sa clé dérivée.
            # Ici on indique juste si elles existent.
            cursor.execute(
                "SELECT id_donnees FROM DonneesPatient WHERE id_patient = %s",
                (patient["id_patient"],)
            )
            user["has_medical_data"] = cursor.fetchone() is not None

    elif role == "medecin":
        cursor.execute(
            """
            SELECT m.*, s.libelle AS specialite
            FROM Medecin m
            LEFT JOIN Specialite s ON s.id_specialite = m.id_specialite
            WHERE m.id_compte = %s
            """,
            (id_compte,)
        )
        medecin = cursor.fetchone()

        if medecin:
            user["id_medecin"]   = medecin["id_medecin"]
            user["nom"]          = medecin["nom"]
            user["prenom"]       = medecin["prenom"]
            user["specialite"]   = medecin["specialite"]
            user["rpps_saisi"]   = medecin["rpps_saisi"]
            user["rpps_verifie"] = bool(medecin["rpps_verifie"])

    return user


# ============================================================
# RENVOI EMAIL DE CONFIRMATION
# ============================================================

def resend_confirmation_email(email: str):
    """
    Génère un nouveau token de vérification et renvoie l'email de confirmation.
    Vérifie que le compte existe et n'est pas déjà vérifié.
    Retourne (True, None) ou (False, message_erreur).
    """
    cursor = mysql.connection.cursor()

    try:
        cursor.execute(
            "SELECT * FROM Compte WHERE email = %s",
            (email,)
        )
        compte = cursor.fetchone()

        if not compte:
            # On ne révèle pas si l'email existe ou non (sécurité)
            return True, None

        if compte["email_verifie"]:
            return False, "Ce compte est déjà vérifié"

        # Récupère le prénom depuis Patient ou Medecin
        cursor.execute(
            """
            SELECT COALESCE(p.prenom, m.prenom) AS prenom
            FROM Compte c
            LEFT JOIN Patient p ON p.id_compte = c.id_compte
            LEFT JOIN Medecin m ON m.id_compte = c.id_compte
            WHERE c.id_compte = %s
            """,
            (compte["id_compte"],)
        )
        row = cursor.fetchone()
        prenom = row["prenom"] if row else ""

        # Génère un nouveau token
        new_token      = generate_verification_token()
        new_expiration = datetime.now() + timedelta(hours=24)

        cursor.execute(
            """
            UPDATE Compte
            SET token_verification = %s,
                token_expiration   = %s
            WHERE id_compte = %s
            """,
            (new_token, new_expiration, compte["id_compte"])
        )
        mysql.connection.commit()

        send_confirmation_email(email, prenom, new_token)
        return True, None

    except Exception as error:
        mysql.connection.rollback()
        return False, f"Erreur lors du renvoi : {str(error)}"

    finally:
        cursor.close()
