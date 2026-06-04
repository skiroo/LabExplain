"""
Fichier : health_routes.py
Dossier : backend/routes/
"""

from flask import Blueprint
from database.db import mysql
from utils.response import success_response, error_response

health_bp = Blueprint("health", __name__)


@health_bp.route("/health", methods=["GET"])
def health():
    return success_response({"status": "ok", "message": "Backend LabExplain is running"})


@health_bp.route("/health/db", methods=["GET"])
def health_db():
    try:
        cursor = mysql.connection.cursor()
        cursor.execute("SELECT DATABASE()")
        row = cursor.fetchone()
        cursor.close()
        return success_response({"database": list(row.values())[0]})
    except Exception as error:
        return error_response(f"DB connection failed: {str(error)}", 500)
