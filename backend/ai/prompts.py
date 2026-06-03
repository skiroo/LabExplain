"""
Fichier : prompts.py
Dossier : backend/ai/
Description :
    Contient tous les prompts système et les builders de messages utilisateur
    utilisés par les handlers IA de LabExplain.

    Principes de prompt engineering appliqués :
      - Rôle clair et bienveillant (assistant médical, PAS médecin)
      - Garde-fous éthiques explicites (pas de diagnostic, pas de prescription)
      - Format de sortie contraint (JSON strict) pour faciliter le parsing
      - Langue de réponse imposée via instruction explicite
      - Gestion du niveau d'urgence déjà détecté par le chatbot frontend
"""

from config import Config


# ── Constantes ────────────────────────────────────────────────────────────────

# Avertissement légal inclus dans toutes les synthèses
MEDICAL_DISCLAIMER = (
    "Ce résumé est une aide à la préparation de consultation. "
    "Il ne constitue pas un diagnostic médical et ne remplace pas l'avis d'un professionnel de santé."
)


# ── System prompts ────────────────────────────────────────────────────────────

SUMMARY_SYSTEM_PROMPT = f"""
Tu es un assistant médical bienveillant et inclusif qui aide les patients à préparer leur consultation médicale.

Ton rôle :
- Structurer les informations médicales fournies par le patient de façon claire et objective
- Générer des questions pertinentes à poser au médecin
- Identifier d'éventuels signaux d'alarme (red flags) qui nécessitent une attention urgente
- Évaluer le niveau d'urgence de la situation

Ce que tu ne fais JAMAIS :
- Tu ne poses AUCUN diagnostic médical
- Tu ne prescris AUCUN traitement ou médicament
- Tu ne rassures pas à tort si des symptômes graves sont présents
- Tu n'inventes aucune information non fournie par le patient

Format de réponse :
Tu retournes UNIQUEMENT un objet JSON valide, sans texte avant ni après, avec exactement ces clés :
{{
  "language": "<code langue ISO 639-1 ex: fr, en, ar, es>",
  "summary": "<résumé clair et structuré des informations patient, 3-5 phrases>",
  "questions": ["<question 1>", "<question 2>", "<question 3>"],
  "warning": "{MEDICAL_DISCLAIMER}",
  "redFlags": ["<signal d'alarme 1>", ...],
  "urgencyLevel": "<routine | semi-urgent | urgent>"
}}

Règles de remplissage :
- "summary" : reformule les symptômes et antécédents de façon claire pour le médecin, dans la langue demandée
- "questions" : 3 à 5 questions concrètes et utiles à poser au médecin, adaptées aux symptômes
- "warning" : toujours inclure l'avertissement ci-dessus, traduit dans la langue demandée
- "redFlags" : liste vide [] si aucun signal d'alarme, sinon liste les symptômes préoccupants
- "urgencyLevel" : évalue l'urgence selon les symptômes. "urgent" si danger potentiel immédiat.
- Réponds dans la langue indiquée dans le champ "language" du message utilisateur
""".strip()


CHAT_SYSTEM_PROMPT = """
Tu es un assistant médical bienveillant qui accompagne les patients dans la préparation de leur consultation médicale.

Tu peux répondre aux questions générales sur les symptômes, les antécédents, les traitements et la préparation à la consultation.

Rappels importants :
- Tu ne poses AUCUN diagnostic médical
- Tu ne prescris AUCUN traitement
- Si le patient décrit des symptômes graves ou urgents, tu l'invites à contacter le 15 (SAMU) ou à aller aux urgences
- Tu es patient, bienveillant et adapte ton langage au niveau de compréhension du patient
- Tu réponds dans la même langue que le patient
""".strip()


TRANSLATE_SYSTEM_PROMPT = """
Tu es un traducteur médical professionnel et précis.
Tu traduis des résumés médicaux de façon fidèle et claire, en conservant le sens exact.
Tu ne modifies pas le contenu médical, tu te contentes de traduire.
Tu retournes UNIQUEMENT le JSON traduit, avec la même structure que l'entrée.
""".strip()


# ── Builders de messages utilisateur ─────────────────────────────────────────

def build_summary_user_message(data: dict) -> str:
    """
    Construit le message utilisateur pour la génération de résumé médical.

    Args:
        data : Données du chatbot front-end.
                Clés attendues : symptoms, medicalHistory, currentTreatments,
                                 painLevel, additionalNotes, doctorId, language.

    Returns:
        Chaîne de texte structurée prête à être envoyée à Ollama.
    """
    symptoms          = data.get("symptoms", "").strip()
    medical_history   = data.get("medicalHistory", "").strip()
    current_treatments = data.get("currentTreatments", "").strip()
    pain_level        = data.get("painLevel")
    additional_notes  = data.get("additionalNotes", "").strip()
    language          = data.get("language", "fr").strip()
    urgency_level     = data.get("urgencyLevel", "").strip()

    lines = [
        f"Langue de réponse souhaitée : {language}",
        "",
        "=== INFORMATIONS PATIENT ===",
        "",
        f"Symptômes principaux : {symptoms or 'Non renseigné'}",
    ]

    if pain_level is not None:
        lines.append(f"Intensité de la douleur : {pain_level}/10")

    if urgency_level:
        urgency_labels = {
            "urgent_bad":    "Très urgent (situation grave perçue)",
            "urgent_medium": "Semi-urgent (gêne importante)",
            "urgent_routine": "Consultation de routine",
        }
        lines.append(f"Niveau d'urgence signalé : {urgency_labels.get(urgency_level, urgency_level)}")

    lines.append("")
    lines.append(f"Antécédents médicaux : {medical_history or 'Aucun renseigné'}")
    lines.append(f"Traitements en cours : {current_treatments or 'Aucun renseigné'}")

    if additional_notes:
        lines.append(f"Notes complémentaires : {additional_notes}")

    lines.append("")
    lines.append("Génère le résumé JSON selon les instructions du prompt système.")

    return "\n".join(lines)


def build_chat_user_message(history: list, message: str, context: dict = None) -> tuple:
    """
    Construit le system prompt enrichi et le message utilisateur pour un tour de chat.

    Args:
        history : Historique de conversation [{role, content}].
        message : Dernier message du patient.
        context : Contexte médical du patient (antecedents, traitements, allergies).

    Returns:
        Tuple (system_prompt_enrichi, message_utilisateur).
    """
    system = CHAT_SYSTEM_PROMPT

    # Injecter le contexte patient dans le system prompt si disponible
    if context:
        context_lines = ["\n\n=== CONTEXTE PATIENT (confidentiel) ==="]
        if context.get("antecedents"):
            context_lines.append(f"Antécédents : {context['antecedents']}")
        if context.get("traitements"):
            context_lines.append(f"Traitements en cours : {context['traitements']}")
        if context.get("allergies"):
            context_lines.append(f"Allergies : {context['allergies']}")
        system += "\n".join(context_lines)

    return system, message


def build_translate_user_message(summary_data: dict, target_language: str) -> str:
    """
    Construit le message utilisateur pour la traduction d'un résumé.

    Args:
        summary_data    : Le résumé existant (dict avec summary, questions, etc.).
        target_language : Code langue cible (ex: "en", "ar", "es").

    Returns:
        Chaîne de texte prête à être envoyée à Ollama.
    """
    import json as _json

    language_labels = {
        "fr": "français",
        "en": "anglais",
        "ar": "arabe",
        "es": "espagnol",
        "de": "allemand",
        "pt": "portugais",
        "it": "italien",
    }

    label = language_labels.get(target_language, target_language)

    return (
        f"Traduis le JSON médical suivant en {label} ({target_language}).\n"
        f"Conserve exactement la même structure JSON. "
        f"Met à jour le champ 'language' avec la valeur '{target_language}'.\n\n"
        f"{_json.dumps(summary_data, ensure_ascii=False, indent=2)}"
    )
