"""
Fichier : seed.py
Dossier : backend/database/
Description :
    Peuple la base de données LabExplain avec les comptes de test.
    Les hashes bcrypt et les données médicales chiffrées sont générés
    directement par ce script via les mêmes fonctions que le backend
    (crypto_utils.py) — aucune valeur codée en dur.

    Comptes créés :
      patient@test.com  — mot de passe : 1235
      medecin@test.com  — mot de passe : 1234

    Usage :
      python seed.py
      python seed.py --reset   # supprime et recrée les données de test
"""

import os
import sys
import argparse
import secrets
from datetime import datetime
from pathlib import Path

# ── Dépendances ──────────────────────────────────────────────────────────────
try:
    import bcrypt
except ImportError:
    sys.exit("Erreur : bcrypt manquant. Lancez : pip install bcrypt")

try:
    import mysql.connector
except ImportError:
    sys.exit("Erreur : mysql-connector-python manquant. Lancez : pip install mysql-connector-python")

try:
    from dotenv import load_dotenv
except ImportError:
    sys.exit("Erreur : python-dotenv manquant. Lancez : pip install python-dotenv")

try:
    from cryptography.hazmat.primitives.ciphers.aead import AESGCM
    from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC
    from cryptography.hazmat.primitives import hashes
    import base64
except ImportError:
    sys.exit("Erreur : cryptography manquant. Lancez : pip install cryptography")


# ── Chargement du .env ───────────────────────────────────────────────────────
# Cherche le .env dans le dossier backend/ (parent du dossier database/)
env_path = Path(__file__).resolve().parent.parent / ".env"
load_dotenv(dotenv_path=env_path)


# ============================================================
# CRYPTO — Fonctions identiques à crypto_utils.py
# ============================================================

def hash_password(plain_password: str) -> str:
    """Hash un mot de passe avec bcrypt 12 rounds."""
    return bcrypt.hashpw(
        plain_password.encode("utf-8"),
        bcrypt.gensalt(rounds=12)
    ).decode("utf-8")


def generate_encryption_salt() -> str:
    """Génère un sel hex 32 bytes pour PBKDF2."""
    return secrets.token_hex(32)


def derive_encryption_key(password: str, salt_hex: str) -> bytes:
    """Dérive une clé AES-256 depuis le mot de passe et le sel (PBKDF2-SHA256)."""
    kdf = PBKDF2HMAC(
        algorithm=hashes.SHA256(),
        length=32,
        salt=bytes.fromhex(salt_hex),
        iterations=260000,
    )
    return kdf.derive(password.encode("utf-8"))


def encrypt_field(plaintext: str, key: bytes) -> str:
    """Chiffre un champ texte avec AES-256-GCM. Retourne base64(IV + TAG + CIPHERTEXT)."""
    if not plaintext:
        return None
    aesgcm = AESGCM(key)
    iv = os.urandom(12)
    ciphertext_with_tag = aesgcm.encrypt(iv, plaintext.encode("utf-8"), None)
    return base64.b64encode(iv + ciphertext_with_tag).decode("utf-8")


# ============================================================
# CONNEXION DB
# ============================================================

def get_connection():
    """Ouvre une connexion MySQL depuis les variables d'environnement."""
    return mysql.connector.connect(
        host=os.getenv("MYSQL_HOST", "localhost"),
        port=int(os.getenv("MYSQL_PORT", 3306)),
        user=os.getenv("MYSQL_USER", "root"),
        password=os.getenv("MYSQL_PASSWORD", ""),
        database=os.getenv("MYSQL_DB", "defaultdb"),
        ssl_disabled=False,
    )


# ============================================================
# RESET — Supprime les données de test existantes
# ============================================================

def reset(cursor):
    """Supprime les comptes de test s'ils existent déjà."""
    print("  Suppression des données de test existantes...")
    # La suppression en cascade sur Compte suffit pour tout nettoyer
    cursor.execute(
        "DELETE FROM Compte WHERE email IN ('patient@test.com', 'medecin@test.com')"
    )
    # La spécialité de test n'est supprimée que si aucun autre médecin ne l'utilise
    cursor.execute(
        """
        DELETE FROM Specialite
        WHERE code_sm = 'SM26'
          AND NOT EXISTS (
              SELECT 1 FROM Medecin m
              JOIN Specialite s ON s.id_specialite = m.id_specialite
              WHERE s.code_sm = 'SM26'
          )
        """
    )


# ============================================================
# SEED
# ============================================================

def seed(cursor, now: datetime):
    """Insère toutes les données de test."""

    # ── Spécialité ────────────────────────────────────────────────────────────
    print("  Insertion de la spécialité...")
    cursor.execute(
        """
        INSERT INTO Specialite (code_sm, libelle)
        VALUES ('SM26', 'Médecin généraliste')
        ON DUPLICATE KEY UPDATE libelle = libelle
        """
    )
    cursor.execute("SELECT id_specialite FROM Specialite WHERE code_sm = 'SM26'")
    id_specialite = cursor.fetchone()[0]

    # ── Compte patient ────────────────────────────────────────────────────────
    print("  Génération du hash bcrypt pour patient@test.com (mot de passe : 1235)...")
    hash_patient = hash_password("1235")
    salt_patient = generate_encryption_salt()

    cursor.execute(
        """
        INSERT INTO Compte (
            email, password_hash, role,
            email_verifie, consent, consent_date, encryption_salt
        )
        VALUES (%s, %s, 'patient', TRUE, TRUE, %s, %s)
        """,
        ("patient@test.com", hash_patient, now, salt_patient)
    )
    id_compte_patient = cursor.lastrowid
    print(f"    Compte patient créé (id_compte={id_compte_patient})")

    # ── Compte médecin ────────────────────────────────────────────────────────
    print("  Génération du hash bcrypt pour medecin@test.com (mot de passe : 1234)...")
    hash_medecin = hash_password("1234")

    cursor.execute(
        """
        INSERT INTO Compte (
            email, password_hash, role,
            email_verifie, consent, consent_date, encryption_salt
        )
        VALUES (%s, %s, 'medecin', TRUE, TRUE, %s, NULL)
        """,
        ("medecin@test.com", hash_medecin, now)
    )
    id_compte_medecin = cursor.lastrowid
    print(f"    Compte médecin créé (id_compte={id_compte_medecin})")

    # ── Profil patient ────────────────────────────────────────────────────────
    print("  Insertion du profil patient...")
    cursor.execute(
        """
        INSERT INTO Patient (nom, prenom, date_naissance, gender, id_compte)
        VALUES ('Dupont', 'Jean', '1990-05-12', 'M', %s)
        """,
        (id_compte_patient,)
    )
    id_patient = cursor.lastrowid

    # ── Données médicales chiffrées ───────────────────────────────────────────
    print("  Chiffrement des données médicales avec AES-256-GCM...")
    key = derive_encryption_key("1235", salt_patient)

    antecedents_enc = encrypt_field("Asthme",    key)
    traitements_enc = encrypt_field("Ventoline", key)
    allergies_enc   = encrypt_field("Pollen",    key)
    poids_enc       = encrypt_field("70",        key)
    taille_enc      = encrypt_field("175",       key)

    cursor.execute(
        """
        INSERT INTO DonneesPatient (
            id_patient,
            antecedents_enc, traitements_enc, allergies_enc,
            poids_enc, taille_enc
        )
        VALUES (%s, %s, %s, %s, %s, %s)
        """,
        (id_patient, antecedents_enc, traitements_enc, allergies_enc, poids_enc, taille_enc)
    )
    print("    Données médicales chiffrées insérées")

    # ── Profil médecin ────────────────────────────────────────────────────────
    print("  Insertion du profil médecin...")
    cursor.execute(
        """
        INSERT INTO Medecin (nom, prenom, id_specialite, rpps_verifie, id_compte)
        VALUES ('Bernard', 'Pierre', %s, FALSE, %s)
        """,
        (id_specialite, id_compte_medecin)
    )
    id_medecin = cursor.lastrowid
    print(f"    Médecin créé (id_medecin={id_medecin})")


# ============================================================
# MAIN
# ============================================================

def main():
    parser = argparse.ArgumentParser(description="Peuple la base LabExplain avec les comptes de test.")
    parser.add_argument(
        "--reset",
        action="store_true",
        help="Supprime les données de test existantes avant l'insertion"
    )
    args = parser.parse_args()

    print("\n=== LabExplain — Seed ===\n")

    # Connexion
    print("Connexion à la base de données...")
    try:
        conn = get_connection()
    except Exception as e:
        sys.exit(f"Impossible de se connecter à la base : {e}")

    cursor = conn.cursor()
    now = datetime.now()

    try:
        if args.reset:
            reset(cursor)

        # Vérifie que les comptes n'existent pas déjà (sans --reset)
        if not args.reset:
            cursor.execute(
                "SELECT email FROM Compte WHERE email IN ('patient@test.com', 'medecin@test.com')"
            )
            existing = [row[0] for row in cursor.fetchall()]
            if existing:
                print(f"Comptes déjà existants : {', '.join(existing)}")
                print("Utilisez --reset pour les supprimer et les recréer.")
                sys.exit(0)

        seed(cursor, now)
        conn.commit()

        print("\nBase peuplée avec succès.")
        print("  patient@test.com  — mot de passe : 1235")
        print("  medecin@test.com  — mot de passe : 1234\n")

    except Exception as e:
        conn.rollback()
        sys.exit(f"\nErreur — rollback effectué : {e}")

    finally:
        cursor.close()
        conn.close()


if __name__ == "__main__":
    main()