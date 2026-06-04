"""
Fichier : crypto_utils.py
Dossier : backend/utils/
Description :
    Fonctions cryptographiques de LabExplain.
    - Hashage des mots de passe avec bcrypt
    - Dérivation de clé de chiffrement via PBKDF2-SHA256
    - Chiffrement / déchiffrement AES-256-GCM des données médicales
    - Génération de tokens sécurisés (vérification email)

    Format des données chiffrées stockées en base :
    base64( IV[12 bytes] + TAG[16 bytes] + CIPHERTEXT )
"""

import os
import base64
import secrets
import hashlib
import bcrypt
from cryptography.hazmat.primitives.ciphers.aead import AESGCM
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC
from cryptography.hazmat.primitives import hashes


# ============================================================
# BCRYPT — Mots de passe
# ============================================================

def hash_password(plain_password: str) -> str:
    """
    Hashe un mot de passe en clair avec bcrypt (12 rounds).
    Retourne le hash sous forme de string.
    """
    return bcrypt.hashpw(
        plain_password.encode("utf-8"),
        bcrypt.gensalt(rounds=12)
    ).decode("utf-8")


def verify_password(plain_password: str, hashed: str) -> bool:
    """
    Vérifie qu'un mot de passe correspond à son hash bcrypt.
    """
    try:
        return bcrypt.checkpw(
            plain_password.encode("utf-8"),
            hashed.encode("utf-8")
        )
    except Exception:
        return False


# ============================================================
# PBKDF2 — Dérivation de clé de chiffrement
# ============================================================

def generate_encryption_salt() -> str:
    """
    Génère un sel aléatoire 32 bytes pour PBKDF2.
    Retourne le sel encodé en hex (64 caractères).
    Stocké dans Compte.encryption_salt.
    """
    return secrets.token_hex(32)


def derive_encryption_key(password: str, salt_hex: str) -> bytes:
    """
    Dérive une clé AES-256 (32 bytes) depuis le mot de passe et le sel.
    Utilise PBKDF2-SHA256 avec 260 000 itérations (recommandation OWASP 2024).
    La clé n'est jamais stockée — elle est recalculée à chaque déchiffrement.
    """
    kdf = PBKDF2HMAC(
        algorithm=hashes.SHA256(),
        length=32,
        salt=bytes.fromhex(salt_hex),
        iterations=260000,
    )
    return kdf.derive(password.encode("utf-8"))


# ============================================================
# AES-256-GCM — Chiffrement des données médicales
# ============================================================

def encrypt_field(plaintext: str, key: bytes) -> str:
    """
    Chiffre une valeur texte avec AES-256-GCM.
    Retourne une chaîne base64 au format : IV(12) + TAG(16) + CIPHERTEXT.
    Retourne None si plaintext est None ou vide.
    """
    if not plaintext:
        return None

    aesgcm = AESGCM(key)
    iv = os.urandom(12)  # 96 bits — taille standard pour GCM
    ciphertext_with_tag = aesgcm.encrypt(iv, plaintext.encode("utf-8"), None)

    # GCM ajoute le tag de 16 bytes en fin de ciphertext
    combined = iv + ciphertext_with_tag
    return base64.b64encode(combined).decode("utf-8")


def decrypt_field(encrypted_b64: str, key: bytes) -> str:
    """
    Déchiffre une valeur chiffrée avec AES-256-GCM.
    Retourne le texte clair, ou None si la valeur est absente ou invalide.
    """
    if not encrypted_b64:
        return None

    # Ignore les données legacy non chiffrées (migration)
    if encrypted_b64.startswith("DEMO_ENCRYPTED_") or encrypted_b64.startswith("LEGACY:"):
        return None

    try:
        combined = base64.b64decode(encrypted_b64.encode("utf-8"))
        iv = combined[:12]
        ciphertext_with_tag = combined[12:]

        aesgcm = AESGCM(key)
        plaintext = aesgcm.decrypt(iv, ciphertext_with_tag, None)
        return plaintext.decode("utf-8")

    except Exception:
        return None


def encrypt_medical_data(data: dict, key: bytes) -> dict:
    """
    Chiffre tous les champs médicaux d'un dict.
    Retourne un dict avec les clés suffixées _enc.
    """
    fields = ["antecedents", "traitements", "allergies", "poids", "taille"]
    encrypted = {}

    for field in fields:
        value = data.get(field)
        encrypted[f"{field}_enc"] = encrypt_field(str(value) if value else None, key)

    return encrypted


def decrypt_medical_data(encrypted_data: dict, key: bytes) -> dict:
    """
    Déchiffre tous les champs médicaux d'un dict.
    Retourne un dict avec les valeurs en clair.
    """
    fields = ["antecedents", "traitements", "allergies", "poids", "taille"]
    decrypted = {}

    for field in fields:
        enc_value = encrypted_data.get(f"{field}_enc")
        decrypted[field] = decrypt_field(enc_value, key)

    return decrypted


# ============================================================
# TOKENS — Vérification email
# ============================================================

def generate_verification_token() -> str:
    """
    Génère un token URL-safe de 32 bytes pour la vérification email.
    """
    return secrets.token_urlsafe(32)
