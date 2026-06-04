"""
Fichier : email_service.py
Dossier : backend/utils/
Description :
    Service d'envoi d'emails transactionnels pour LabExplain.
    Utilise SMTP (configurable via .env).
    Gère :
    - Email de confirmation d'inscription avec CGU / charte
    - Email de notification de déconnexion avec rappel RGPD
"""

import os
import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from datetime import datetime


def _get_smtp_config():
    """
    Retourne la configuration SMTP depuis les variables d'environnement.
    """
    return {
        "host":     os.getenv("SMTP_HOST", "smtp.gmail.com"),
        "port":     int(os.getenv("SMTP_PORT", 587)),
        "user":     os.getenv("SMTP_USER", ""),
        "password": os.getenv("SMTP_PASSWORD", ""),
        "from":     os.getenv("SMTP_FROM", "noreply@labexplain.fr"),
    }


def _send_email(to: str, subject: str, html_body: str) -> bool:
    """
    Envoie un email HTML via SMTP.
    Retourne True si l'envoi a réussi, False sinon.
    """
    config = _get_smtp_config()

    if not config["user"] or not config["password"]:
        # En développement sans SMTP configuré — affiche dans la console
        print(f"\n[EMAIL SIMULÉ] À : {to}")
        print(f"Sujet : {subject}")
        print("(Configurez SMTP_USER et SMTP_PASSWORD dans .env pour l'envoi réel)\n")
        return True

    try:
        msg = MIMEMultipart("alternative")
        msg["Subject"] = subject
        msg["From"]    = config["from"]
        msg["To"]      = to
        msg.attach(MIMEText(html_body, "html", "utf-8"))

        with smtplib.SMTP(config["host"], config["port"]) as server:
            server.ehlo()
            server.starttls()
            server.login(config["user"], config["password"])
            server.sendmail(config["from"], to, msg.as_string())

        return True

    except Exception as error:
        print(f"[EMAIL ERROR] Impossible d'envoyer à {to} : {error}")
        return False


# ============================================================
# EMAIL 1 — Confirmation d'inscription
# ============================================================

def send_confirmation_email(to: str, prenom: str, token: str) -> bool:
    """
    Envoie l'email de confirmation d'inscription.
    Contient :
    - Lien de validation (token)
    - Conditions Générales d'Utilisation
    - Charte de traitement des données médicales
    - Rappel RGPD
    """
    base_url  = os.getenv("FRONTEND_URL", "http://localhost:5173")
    confirm_url = f"{base_url}/confirmer-email?token={token}"
    year = datetime.now().year

    subject = "LabExplain — Confirmez votre inscription"

    html = f"""
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body {{ font-family: Arial, sans-serif; background: #f4f6f9; margin: 0; padding: 0; color: #222; }}
    .container {{ max-width: 600px; margin: 40px auto; background: #fff; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.08); }}
    .header {{ background: #1a56db; padding: 32px; text-align: center; }}
    .header h1 {{ color: #fff; margin: 0; font-size: 1.6rem; }}
    .header p {{ color: #c7d9ff; margin: 8px 0 0; font-size: 0.95rem; }}
    .body {{ padding: 32px; }}
    .cta {{ display: block; margin: 24px auto; background: #1a56db; color: #fff !important; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-size: 1rem; font-weight: bold; text-align: center; max-width: 300px; }}
    .warning {{ background: #fff8e1; border-left: 4px solid #f59e0b; padding: 14px 18px; border-radius: 0 8px 8px 0; margin: 24px 0; font-size: 0.9rem; }}
    .section {{ border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px; margin: 20px 0; }}
    .section h3 {{ margin: 0 0 12px; font-size: 1rem; color: #1a56db; }}
    .section ul {{ margin: 0; padding-left: 20px; line-height: 1.7; font-size: 0.9rem; }}
    .footer {{ background: #f4f6f9; padding: 20px 32px; font-size: 0.8rem; color: #666; text-align: center; }}
    .token-note {{ font-size: 0.8rem; color: #999; text-align: center; margin-top: 8px; }}
  </style>
</head>
<body>
<div class="container">

  <div class="header">
    <h1>LabExplain</h1>
    <p>Préparez vos questions. Optimisez votre consultation.</p>
  </div>

  <div class="body">
    <p>Bonjour <strong>{prenom}</strong>,</p>
    <p>
      Merci de vous être inscrit sur <strong>LabExplain</strong>, votre assistant intelligent
      de préparation à la consultation médicale.
    </p>
    <p>
      Pour activer votre compte et accéder à l'application, veuillez confirmer votre
      adresse email en cliquant sur le bouton ci-dessous.
    </p>

    <a href="{confirm_url}" class="cta">Confirmer mon inscription</a>
    <p class="token-note">Ce lien est valable 24 heures.</p>

    <div class="warning">
      <strong>Avant de continuer, veuillez lire et accepter les documents ci-dessous.</strong>
      En cliquant sur le lien de confirmation, vous reconnaissez avoir pris connaissance
      et accepté l'ensemble de ces conditions.
    </div>

    <!-- CONDITIONS GÉNÉRALES D'UTILISATION -->
    <div class="section">
      <h3>Conditions Générales d'Utilisation (CGU)</h3>
      <ul>
        <li>LabExplain est un outil d'aide à la <strong>préparation</strong> de la consultation médicale.</li>
        <li>Il ne fournit <strong>aucun diagnostic médical</strong> et ne remplace pas un professionnel de santé.</li>
        <li>Les résumés et questions générés sont des suggestions — ils ne constituent pas un avis médical.</li>
        <li>En cas d'urgence médicale, appelez immédiatement le <strong>15 (SAMU)</strong> ou le <strong>112</strong>.</li>
        <li>L'application est destinée aux personnes de 13 ans et plus. Les mineurs doivent avoir l'accord d'un parent.</li>
        <li>Toute utilisation abusive, commerciale ou non conforme est interdite.</li>
        <li>LabExplain se réserve le droit de suspendre un compte en cas d'utilisation frauduleuse.</li>
      </ul>
    </div>

    <!-- CHARTE DE TRAITEMENT DES DONNÉES MÉDICALES -->
    <div class="section">
      <h3>Charte de traitement des données médicales</h3>
      <ul>
        <li>Vos données médicales (antécédents, traitements, allergies, etc.) sont
            <strong>chiffrées avec AES-256-GCM</strong> avant d'être stockées.</li>
        <li>La clé de chiffrement est dérivée de votre mot de passe via PBKDF2-SHA256.
            <strong>Nous n'avons jamais accès à vos données médicales en clair.</strong></li>
        <li>Vos données ne sont <strong>jamais vendues, partagées ou transmises</strong>
            à des tiers sans votre consentement explicite.</li>
        <li>Le partage de votre résumé avec un médecin est toujours <strong>volontaire</strong>
            et décidé par vous seul.</li>
        <li>Le module IA ne produit aucun diagnostic. Il structure et reformule uniquement.</li>
        <li>Les données transmises au module IA sont anonymisées avant traitement.</li>
      </ul>
    </div>

    <!-- DROITS RGPD -->
    <div class="section">
      <h3>Vos droits RGPD</h3>
      <ul>
        <li><strong>Droit d'accès</strong> : vous pouvez télécharger toutes vos données depuis les Paramètres.</li>
        <li><strong>Droit de rectification</strong> : vous pouvez modifier vos informations à tout moment.</li>
        <li><strong>Droit à l'effacement</strong> : la suppression de votre compte entraîne la suppression
            immédiate et définitive de toutes vos données, y compris médicales.</li>
        <li><strong>Droit à la portabilité</strong> : vos données sont exportables au format JSON.</li>
        <li><strong>Droit d'opposition</strong> : vous pouvez retirer votre consentement à tout moment.</li>
        <li>Pour exercer vos droits : <a href="mailto:privacy@labexplain.fr">privacy@labexplain.fr</a></li>
      </ul>
    </div>

    <p>
      Si vous n'êtes pas à l'origine de cette inscription, ignorez cet email.
      Aucun compte ne sera créé sans confirmation.
    </p>
  </div>

  <div class="footer">
    <p>&copy; {year} LabExplain — Projet académique EFREI Paris Panthéon-Assas Université</p>
    <p>Ce message est automatique, merci de ne pas y répondre.</p>
  </div>

</div>
</body>
</html>
"""
    return _send_email(to, subject, html)


# ============================================================
# EMAIL 2 — Notification de déconnexion
# ============================================================

def send_logout_email(to: str, prenom: str) -> bool:
    """
    Envoie un email de notification lors de la déconnexion.
    Rappelle à l'utilisateur que ses données sont protégées
    et lui explique la politique de rétention.
    """
    year = datetime.now().year
    date_now = datetime.now().strftime("%d/%m/%Y à %H:%M")

    subject = "LabExplain — Déconnexion confirmée"

    html = f"""
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body {{ font-family: Arial, sans-serif; background: #f4f6f9; margin: 0; padding: 0; color: #222; }}
    .container {{ max-width: 600px; margin: 40px auto; background: #fff; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.08); }}
    .header {{ background: #1a56db; padding: 32px; text-align: center; }}
    .header h1 {{ color: #fff; margin: 0; font-size: 1.6rem; }}
    .header p {{ color: #c7d9ff; margin: 8px 0 0; font-size: 0.95rem; }}
    .body {{ padding: 32px; }}
    .info-box {{ background: #e8f4fd; border-left: 4px solid #1a56db; padding: 14px 18px; border-radius: 0 8px 8px 0; margin: 20px 0; font-size: 0.9rem; }}
    .warning {{ background: #fef2f2; border-left: 4px solid #ef4444; padding: 14px 18px; border-radius: 0 8px 8px 0; margin: 20px 0; font-size: 0.9rem; }}
    .section {{ border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px; margin: 20px 0; }}
    .section h3 {{ margin: 0 0 12px; font-size: 1rem; color: #1a56db; }}
    .section ul {{ margin: 0; padding-left: 20px; line-height: 1.7; font-size: 0.9rem; }}
    .footer {{ background: #f4f6f9; padding: 20px 32px; font-size: 0.8rem; color: #666; text-align: center; }}
  </style>
</head>
<body>
<div class="container">

  <div class="header">
    <h1>LabExplain</h1>
    <p>Préparez vos questions. Optimisez votre consultation.</p>
  </div>

  <div class="body">
    <p>Bonjour <strong>{prenom}</strong>,</p>

    <div class="info-box">
      Vous avez été déconnecté de LabExplain le <strong>{date_now}</strong>.
    </div>

    <p>
      Votre session est maintenant fermée. Vos données restent protégées sur nos serveurs
      tant que vous conservez votre compte.
    </p>

    <!-- CE QUI ARRIVE À VOS DONNÉES -->
    <div class="section">
      <h3>Que deviennent vos données ?</h3>
      <ul>
        <li>Vos données médicales restent <strong>chiffrées en base</strong> et sont inaccessibles
            sans votre mot de passe.</li>
        <li>Aucune donnée n'est transmise à des tiers suite à votre déconnexion.</li>
        <li>Vos informations sont conservées jusqu'à la <strong>suppression de votre compte</strong>,
            que vous pouvez effectuer à tout moment depuis les Paramètres.</li>
        <li>En cas d'inactivité de plus de <strong>2 ans</strong>, votre compte pourra être
            anonymisé conformément à notre politique de rétention.</li>
      </ul>
    </div>

    <div class="warning">
      <strong>Ce n'était pas vous ?</strong> Si vous n'êtes pas à l'origine de cette déconnexion,
      connectez-vous immédiatement et changez votre mot de passe.
      Contactez-nous à <a href="mailto:security@labexplain.fr">security@labexplain.fr</a>
    </div>

    <!-- RAPPEL SUPPRESSION -->
    <div class="section">
      <h3>Supprimer définitivement vos données</h3>
      <ul>
        <li>Depuis <strong>Paramètres &gt; Compte &gt; Supprimer mon compte</strong></li>
        <li>La suppression entraîne l'effacement immédiat et <strong>irréversible</strong>
            de toutes vos données personnelles et médicales.</li>
        <li>Conformément au RGPD, aucune donnée résiduelle n'est conservée après suppression.</li>
      </ul>
    </div>

    <p>À bientôt sur LabExplain.</p>
  </div>

  <div class="footer">
    <p>&copy; {year} LabExplain — Projet académique EFREI Paris Panthéon-Assas Université</p>
    <p>Ce message est automatique, merci de ne pas y répondre.</p>
  </div>

</div>
</body>
</html>
"""
    return _send_email(to, subject, html)
