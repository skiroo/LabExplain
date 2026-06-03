"""
Fichier : utils.py
Dossier : backend/ai/
Description :
    Fonctions utilitaires partagées pour le module IA de LabExplain.
    Contient notamment des outils de parsing de réponses de modèles de langage.
"""

import json
import re


def extract_json(raw_text: str) -> dict:
    """
    Extrait et parse un objet JSON depuis le texte brut retourné par l'IA.

    L'IA respecte généralement le format JSON demandé, mais peut parfois
    ajouter du texte autour (ex: ```json ... ```). Cette fonction gère
    ces différents cas de figure de manière robuste.

    Args:
        raw_text : Texte brut retourné par Ollama.

    Returns:
        Dictionnaire Python parsé.

    Raises:
        ValueError : Si aucun JSON valide n'est trouvé dans la réponse.
    """
    # Cas 1 : la réponse est directement du JSON propre
    try:
        return json.loads(raw_text.strip())
    except json.JSONDecodeError:
        pass

    # Cas 2 : l'IA a encapsulé le JSON dans un bloc ```json ... ```
    match = re.search(r"```(?:json)?\s*(\{.*?\})\s*```", raw_text, re.DOTALL)
    if match:
        try:
            return json.loads(match.group(1))
        except json.JSONDecodeError:
            pass

    # Cas 3 : tenter d'extraire le premier { ... } trouvé
    match = re.search(r"(\{.*\})", raw_text, re.DOTALL)
    if match:
        try:
            return json.loads(match.group(1))
        except json.JSONDecodeError:
            pass

    raise ValueError(
        f"Impossible d'extraire un JSON valide depuis la réponse IA : "
        f"{raw_text[:300]}"
    )
