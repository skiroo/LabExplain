"""
Fichier : ai_service.py
Dossier : backend/services/
Description :
    Point de compatibilité ascendante pour les anciens imports du module IA.
    La logique réelle est désormais dans le package backend/ai/.

    Ce fichier délègue directement aux handlers du module ai/,
    permettant aux éventuels imports existants de continuer à fonctionner
    sans modification.
"""

from ai.summary_handler import generate_summary
from ai.chat_handler import chat_turn
from ai.translate_handler import translate_summary

__all__ = [
    "generate_summary",
    "chat_turn",
    "translate_summary",
]