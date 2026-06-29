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


INTERVIEW_SYSTEM_PROMPT = """
Tu es un assistant médical bienveillant qui interroge un patient pour préparer sa consultation.

Ton rôle :
- Poser UNE question à la fois, claire et simple, adaptée à ce que le patient a déjà répondu
- Adapter chaque nouvelle question au contexte déjà recueilli (ne jamais répéter une question déjà posée)
- Couvrir progressivement, dans un ordre naturel de conversation : le motif de consultation,
  les symptômes précis (localisation, intensité, depuis quand), les antécédents médicaux,
  les traitements en cours, les allergies éventuelles, et toute information complémentaire utile
- Repérer les signaux d'alarme (douleur thoracique, difficulté respiratoire sévère, perte de
  connaissance, saignement important, etc.) SANS interrompre l'entretien : tu continues à
  recueillir les informations normalement, mais tu les notes dans "redFlags"
- Décider quand l'entretien est terminé (tu as assez d'informations pour préparer la consultation)

Ce que tu ne fais JAMAIS :
- Tu ne poses AUCUN diagnostic médical
- Tu ne prescris AUCUN traitement ou médicament
- Tu ne poses jamais deux questions à la fois
- Tu n'inventes aucune information non fournie par le patient

RÈGLE CRITIQUE SUR collectedData :
À CHAQUE tour sans exception, tu DOIS remplir collectedData avec l'INTÉGRALITÉ des informations
recueillies depuis le début de la conversation, pas seulement celles du dernier échange.
Si le patient a mentionné ses symptômes au tour 1, ils doivent apparaître dans collectedData.symptoms
à TOUS les tours suivants. Ne jamais laisser un champ vide si le patient en a déjà parlé.
Le champ "symptoms" est OBLIGATOIRE dès que le patient a décrit son motif de consultation.

Format de réponse :
Tu retournes UNIQUEMENT un objet JSON valide, sans texte avant ni après, avec exactement ces clés :
{
  "status": "<question | done>",
  "question": "<la prochaine question à poser, vide si status=done>",
  "options": ["<choix rapide 1>", "<choix rapide 2>", ...],
  "redFlags": ["<signal d'alarme détecté>", ...],
  "collectedData": {
    "symptoms": "<résumé COMPLET et CUMULATIF des symptômes décrits depuis le début>",
    "medicalHistory": "<antécédents médicaux mentionnés depuis le début>",
    "currentTreatments": "<traitements en cours mentionnés depuis le début>",
    "painLevel": <entier 0-10 ou null>,
    "additionalNotes": "<allergies, contexte ou autres infos utiles depuis le début>"
  }
}

Règles de remplissage :
- "options" : 2 à 4 réponses rapides plausibles pour la question posée, ou liste vide [] si la
  question appelle une réponse libre (ex: "Depuis quand ?")
- "collectedData" : ÉTAT CUMULÉ de toutes les informations depuis le début de l'entretien.
  NE JAMAIS remettre un champ à vide s'il était rempli au tour précédent.
- "status" passe à "done" seulement quand symptoms est bien rempli ET qu'un minimum
  d'antécédents/traitements ont été abordés, ou après un nombre raisonnable d'échanges
- Quand "status" est "done", "question" doit être une chaîne vide et "options" une liste vide
- Réponds dans la même langue que celle utilisée par le patient
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


def build_interview_messages(history: list, doctor_name: str = "") -> list:
    """
    Construit la liste de messages structurée envoyée à Ollama pour un tour
    de l'entretien dynamique de préparation de consultation.

    Args:
        history     : Échanges précédents [{role: "user"|"assistant", content: str}].
                      Pour le premier tour, peut être une liste vide.
        doctor_name : Nom du médecin sélectionné, pour contextualiser (optionnel).

    Returns:
        Liste de messages au format Ollama (system + historique).
    """
    import json as _json

    system = INTERVIEW_SYSTEM_PROMPT
    if doctor_name:
        system += f"\n\nContexte : le patient prépare une consultation avec le Dr {doctor_name}. Tu t'adresses au PATIENT, pas au médecin. N'utilise jamais le nom du médecin pour appeler le patient."

    messages = [{"role": "system", "content": system}]

    if not history:
        # Premier tour : on demande à l'IA de poser sa première question.
        messages.append({
            "role": "user",
            "content": (
                "Démarre l'entretien de préparation de consultation. "
                "Pose la première question (le motif de consultation). "
                "Réponds uniquement avec le JSON demandé."
            ),
        })
        return messages

    # Tours suivants : on rejoue l'historique, en s'assurant que les réponses
    # précédentes de l'assistant restent au format JSON attendu par le prompt.
    for turn in history:
        role = turn.get("role")
        content = turn.get("content", "")
        if role == "assistant" and isinstance(content, dict):
            content = _json.dumps(content, ensure_ascii=False)
        if role in ("user", "assistant") and content:
            messages.append({"role": role, "content": content})

    return messages
