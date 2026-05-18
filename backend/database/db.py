"""
Fichier : db.py
Dossier : backend/database/
Description :
    Initialise la connexion entre le backend Flask et la base de données MySQL.
    Ce fichier centralise l'objet MySQL utilisé par les services pour exécuter
    les requêtes vers la base de données LabExplain.
"""

from flask_mysqldb import MySQL

mysql = MySQL()

def init_db(app):
    """
    Initialise la connexion MySQL avec l'application Flask.
    """
    mysql.init_app(app)