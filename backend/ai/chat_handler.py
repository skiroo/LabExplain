"""
Fichier : chat_handler.py
Dossier : backend/ai/
Description :
    Handler métier pour la conversation libre multi-tour avec le patient.
    Ce module permet au chatbot frontend d'envoyer des messages libres
    à l'IA en lui transmettant le contexte médical du patient.

    L'historique de conversation est géré côté frontend et renvoyé
    à chaque appel (stateless backend).

    Fonctions exposées :
      - chat_turn(history, message, context) → str
"""

import logging

from .ollama_client import send_prompt
from .prompts import build_chat_user_message

# Configuration du logger pour ce module
logger = logging.getLogger("backend.ai.chat_handler")

# Constante limitant la taille de l'historique conversationnel envoyé à l'IA
MAX_HISTORY_TURNS = 10


def chat_turn(history: list, message: str, context: dict = None) -> str:
    """
    Effectue un tour de conversation libre avec l'IA.

    Le backend est stateless : c'est le frontend qui maintient l'historique
    et le renvoie à chaque requête.

    Args:
        history : Liste des échanges précédents.
                  Format : [{"role": "user"|"assistant", "content": "..."}]
        message : Dernier message envoyé par le patient.
        context : Contexte médical du patient (optionnel).
                  Clés possibles : antecedents, traitements, allergies.

    Returns:
        Réponse textuelle de l'IA (chaîne brute, pas de JSON).

    Raises:
        OllamaUnavailableError : Propagée depuis ollama_client.
        OllamaModelError       : Propagée depuis ollama_client.
    """
    logger.info("Début d'un nouveau tour de conversation libre.")

    # Construction du prompt système enrichi du contexte
    system_prompt, _ = build_chat_user_message(history, message, context)

    # Construction de la liste des messages structurée pour l'API Chat d'Ollama
    chat_messages = []

    # 1. Message système avec le rôle et les garde-fous
    chat_messages.append({"role": "system", "content": system_prompt})

    # 2. Historique des échanges précédents (tronqué à MAX_HISTORY_TURNS)
    if history:
        turns_to_include = history[-MAX_HISTORY_TURNS:]
        logger.info(f"Intégration de {len(turns_to_include)} tour(s) d'historique de conversation.")
        for turn in turns_to_include:
            role = turn.get("role")
            content = turn.get("content", "").strip()
            # On ne garde que les messages valides de l'utilisateur ou de l'assistant
            if role in ("user", "assistant") and content:
                chat_messages.append({"role": role, "content": content})

    # 3. Nouveau message de l'utilisateur
    chat_messages.append({"role": "user", "content": message.strip()})

    logger.debug(f"Structure finale des messages de chat envoyée à l'IA : {chat_messages}")

    # Appel d'Ollama avec la liste de messages structurée
    response_text = send_prompt(messages=chat_messages)

    logger.info("Réponse de chat générée avec succès par l'IA.")
    return response_text
