"""
Fichier : email_validator.py
Dossier : backend/utils/
Description :
    Validation d'email en deux couches :
    1. Abstract API (si clé configurée) — détecte les adresses jetables,
       vérifie la délivrabilité réelle et maintient une base à jour en temps réel.
    2. Fallback local — liste noire statique + vérification MX si l'API est
       indisponible ou non configurée.

    Abstract API — plan gratuit : 100 requêtes/mois
    https://www.abstractapi.com/email-verification-api
"""

import os
import requests
from utils.validators import validate_email, validate_email_domain
from utils.disposable_domains import is_disposable_domain


def validate_email_full(email: str) -> tuple[bool, str]:
    """
    Validation complète d'un email.
    Retourne (True, "") si l'email est acceptable,
    ou (False, message) si il est rejeté.

    Ordre de vérification :
    1. Format regex
    2. Abstract API (si clé présente)
    3. Fallback : liste noire locale + MX
    """
    email = (email or "").strip().lower()

    # Étape 1 — format
    if not validate_email(email):
        return False, "L'adresse email n'est pas valide"

    api_key = os.getenv("ABSTRACT_API_KEY", "").strip()

    if api_key:
        return _validate_with_abstract_api(email, api_key)
    else:
        return _validate_local_fallback(email)


def _validate_with_abstract_api(email: str, api_key: str) -> tuple[bool, str]:
    """
    Vérifie l'email via Abstract API.
    Retourne (False, message) si :
    - is_disposable_email = True  (adresse jetable)
    - is_valid_format = False     (format invalide)
    - deliverability = UNDELIVERABLE (boîte inexistante)

    En cas d'erreur réseau ou de quota dépassé, on bascule sur le fallback local.
    """
    try:
        response = requests.get(
            "https://emailvalidation.abstractapi.com/v1/",
            params={"api_key": api_key, "email": email},
            timeout=5,
        )

        if response.status_code == 429:
            # Quota dépassé — fallback local
            print("[EMAIL VALIDATOR] Quota Abstract API dépassé, fallback local")
            return _validate_local_fallback(email)

        if response.status_code != 200:
            # Erreur API — fallback local
            print(f"[EMAIL VALIDATOR] Abstract API erreur {response.status_code}, fallback local")
            return _validate_local_fallback(email)

        data = response.json()

        # Format invalide selon l'API
        if not data.get("is_valid_format", {}).get("value", True):
            return False, "L'adresse email n'est pas valide"

        # Adresse jetable / temporaire
        if data.get("is_disposable_email", {}).get("value", False):
            return False, "Les adresses email temporaires ou jetables ne sont pas acceptées"

        # Boîte mail non joignable
        deliverability = data.get("deliverability", "UNKNOWN")
        if deliverability == "UNDELIVERABLE":
            return False, "Cette adresse email n'existe pas ou ne peut pas recevoir d'emails"

        # DELIVERABLE ou UNKNOWN — on accepte
        return True, ""

    except requests.exceptions.Timeout:
        print("[EMAIL VALIDATOR] Timeout Abstract API, fallback local")
        return _validate_local_fallback(email)

    except requests.exceptions.ConnectionError:
        print("[EMAIL VALIDATOR] Connexion impossible à Abstract API, fallback local")
        return _validate_local_fallback(email)

    except Exception as error:
        print(f"[EMAIL VALIDATOR] Erreur inattendue : {error}, fallback local")
        return _validate_local_fallback(email)


def _validate_local_fallback(email: str) -> tuple[bool, str]:
    """
    Validation locale si Abstract API est indisponible.
    Vérifie la liste noire statique et les enregistrements MX.
    """
    if is_disposable_domain(email):
        return False, "Les adresses email temporaires ou jetables ne sont pas acceptées"

    domain_ok, domain_msg = validate_email_domain(email)
    if not domain_ok:
        return False, domain_msg if domain_msg else "Domaine invalide"

    return True, ""
