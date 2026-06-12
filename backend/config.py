"""
Fichier : config.py
Dossier : backend/
Description :
    Contient la configuration principale du backend Flask.
    Charge les variables d'environnement depuis .env au démarrage.
"""

import os
from dotenv import load_dotenv

# Charge explicitement le .env depuis le dossier du fichier config.py
# Évite les problèmes de chemin si le backend est lancé depuis un dossier différent
load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), ".env"), override=True)


class Config:
    """
    Classe de configuration utilisée par Flask.
    override=True garantit que les valeurs du .env écrasent
    toujours les éventuelles variables d'environnement système.
    """

    # ── MySQL / Aiven ────────────────────────────────────────────────────────
    MYSQL_HOST        = os.getenv("MYSQL_HOST",        "localhost")
    MYSQL_PORT        = int(os.getenv("MYSQL_PORT",    "3306"))
    MYSQL_USER        = os.getenv("MYSQL_USER",        "root")
    MYSQL_PASSWORD    = os.getenv("MYSQL_PASSWORD",    "")
    MYSQL_DB          = os.getenv("MYSQL_DB",          "defaultdb")
    MYSQL_CURSORCLASS = os.getenv("MYSQL_CURSORCLASS", "DictCursor")

    # SSL obligatoire pour Aiven
    MYSQL_SSL = {"ssl": {}}

    # ── Ollama ───────────────────────────────────────────────────────────────
    OLLAMA_BASE_URL = os.getenv("OLLAMA_BASE_URL", "http://127.0.0.1:11434")
    OLLAMA_MODEL    = os.getenv("OLLAMA_MODEL",    "gemma3:4b")
    OLLAMA_TIMEOUT  = int(os.getenv("OLLAMA_TIMEOUT", "120"))