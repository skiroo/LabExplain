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
    MYSQL_USER = os.getenv("MYSQL_USER", "root")
    MYSQL_PASSWORD = os.getenv("MYSQL_PASSWORD", "")        # Mot de passe à ajouter après avoir créer la connexion MySQL
    MYSQL_DB = os.getenv("MYSQL_DB", "labexplain_db")
    MYSQL_CURSORCLASS = os.getenv("MYSQL_CURSORCLASS", "DictCursor")