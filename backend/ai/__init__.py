"""
Fichier : __init__.py
Dossier : backend/ai/
Description :
    Point d'entrée public du module IA de LabExplain.
    Ce fichier expose les fonctions utilisées par les routes Flask,
    en important depuis les handlers spécialisés.
"""

from .summary_handler import generate_summary, stream_summary
from .chat_handler import chat_turn
from .interview_handler import interview_turn
from .translate_handler import translate_summary
from .ollama_client import ping as ollama_ping

__all__ = [
    "generate_summary",
    "stream_summary",
    "chat_turn",
    "interview_turn",
    "translate_summary",
    "ollama_ping",
]
