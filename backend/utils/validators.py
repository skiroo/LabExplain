"""
Fichier : validators.py
Dossier : backend/utils/
Description :
    Fonctions de validation des données d'entrée.
    Centralise les règles de validation pour éviter la duplication dans les routes.
"""

import re
import socket


def validate_password(password: str) -> tuple[bool, str]:
    """
    Vérifie que le mot de passe respecte les règles de sécurité.
    Retourne (True, "") si valide, (False, message) sinon.

    Règles :
    - 8 caractères minimum
    - Au moins une majuscule
    - Au moins une minuscule
    - Au moins un chiffre
    - Au moins un caractère spécial
    """
    if not password or len(password) < 8:
        return False, "Le mot de passe doit contenir au moins 8 caractères"

    if not re.search(r"[A-Z]", password):
        return False, "Le mot de passe doit contenir au moins une majuscule"

    if not re.search(r"[a-z]", password):
        return False, "Le mot de passe doit contenir au moins une minuscule"

    if not re.search(r"\d", password):
        return False, "Le mot de passe doit contenir au moins un chiffre"

    if not re.search(r"[!@#$%^&*(),.?\":{}|<>_\-\+=\[\]\\/]", password):
        return False, "Le mot de passe doit contenir au moins un caractère spécial"

    return True, ""


def validate_email(email: str) -> bool:
    """
    Vérifie que l'email a un format valide.
    """
    pattern = r"^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$"
    return bool(re.match(pattern, email or ""))


def validate_email_domain(email: str) -> tuple[bool, str]:
    """
    Vérifie que le domaine de l'email a des enregistrements MX valides.
    Utilise dnspython si disponible, sinon socket en fallback.
    Retourne (True, "") si ok, (False, message) sinon.
    """
    if not validate_email(email):
        return False, "L'adresse email n'est pas valide"

    domain = email.split("@")[1].lower()

    # Essaie d'abord avec dnspython (plus précis)
    try:
        import dns.resolver

        try:
            dns.resolver.resolve(domain, "MX", lifetime=5)
            return True, ""
        except dns.resolver.NXDOMAIN:
            return False, f"Le domaine '{domain}' n'existe pas"
        except dns.resolver.NoAnswer:
            # Pas de MX — vérifie au moins un enregistrement A
            try:
                dns.resolver.resolve(domain, "A", lifetime=3)
                return True, ""
            except Exception:
                return False, f"Le domaine '{domain}' ne possède pas de serveur mail"
        except dns.resolver.Timeout:
            # Timeout — fallback socket
            pass
        except Exception:
            # Autre erreur dns — fallback socket
            pass

    except ImportError:
        pass  # dnspython non disponible — fallback socket

    # Fallback : résolution DNS via socket (stdlib)
    # Si le domaine n'existe pas, getaddrinfo lève socket.gaierror
    try:
        socket.setdefaulttimeout(5)
        socket.getaddrinfo(domain, None)
        return True, ""
    except socket.gaierror:
        return False, f"Le domaine '{domain}' n'existe pas"
    except Exception:
        # En cas d'erreur inattendue, on laisse passer
        return True, ""


def validate_register_data(data: dict) -> tuple[bool, str]:
    """
    Valide l'ensemble des données d'inscription.
    Retourne (True, "") si tout est valide, (False, message) sinon.
    """
    nom      = (data.get("nom") or "").strip()
    prenom   = (data.get("prenom") or "").strip()
    email    = (data.get("email") or "").strip().lower()
    password = data.get("password") or ""
    consent  = data.get("consent", False)

    if not nom or not prenom:
        return False, "Le nom et le prénom sont obligatoires"

    if not email or not validate_email(email):
        return False, "L'adresse email n'est pas valide"

    pwd_valid, pwd_msg = validate_password(password)
    if not pwd_valid:
        return False, pwd_msg

    if consent is not True:
        return False, "Le consentement est obligatoire"

    return True, ""
