"""
Fichier : config.py
Dossier : backend/
Description :
    Contient la configuration principale du backend Flask.
    Ce fichier récupère les variables d'environnement nécessaires à la connexion
    avec la base de données MySQL de LabExplain.
"""

import os
from dotenv import load_dotenv

load_dotenv()

class Config:
    """
    Classe de configuration utilisée par Flask.
    """
    MYSQL_HOST = os.getenv("MYSQL_HOST", "localhost")
    MYSQL_PORT = int(os.getenv("MYSQL_PORT", 3306))
    MYSQL_USER = os.getenv("MYSQL_USER", "root")
    MYSQL_PASSWORD = os.getenv("MYSQL_PASSWORD", "")
    MYSQL_DB = os.getenv("MYSQL_DB", "defaultdb")
    MYSQL_CURSORCLASS = os.getenv("MYSQL_CURSORCLASS", "DictCursor")

    # SSL obligatoire pour Aiven
    MYSQL_SSL = {"ssl": {}}

    # ── Configuration Ollama ─────────────────────────────────────────────────
    # URL de base d'Ollama (local par défaut, modifiable via .env pour Docker ou remote)
    OLLAMA_BASE_URL = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")
    # Modèle utilisé pour la génération IA (ex: llama3.2, mistral, gemma3)
    OLLAMA_MODEL = os.getenv("OLLAMA_MODEL", "llama3.2")
    # Timeout en secondes pour les appels synchrones à Ollama
    OLLAMA_TIMEOUT = int(os.getenv("OLLAMA_TIMEOUT", "60"))