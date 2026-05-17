"""
Fichier : app.py
Dossier : backend/
Description :
    Point d'entrée principal du backend Flask de LabExplain.
    Ce fichier initialise l'application, active le CORS et enregistre les routes de l'API partagée
    entre le frontend web et le frontend mobile.
"""

from flask import Flask
from flask_cors import CORS

from routes.health_routes import health_bp
from routes.auth_routes import auth_bp
from routes.user_routes import user_bp
from routes.doctor_routes import doctor_bp
from routes.consultation_routes import consultation_bp
from routes.ai_routes import ai_bp

app = Flask(__name__)

# Autorise les requêtes venant du frontend web et mobile
CORS(app)

# Enregistrement des différents modules de routes de l'API
app.register_blueprint(health_bp, url_prefix="/api")
app.register_blueprint(auth_bp, url_prefix="/api/auth")
app.register_blueprint(user_bp, url_prefix="/api/users")
app.register_blueprint(doctor_bp, url_prefix="/api/doctors")
app.register_blueprint(consultation_bp, url_prefix="/api/consultations")
app.register_blueprint(ai_bp, url_prefix="/api/ai")

if __name__ == "__main__":
    app.run(debug=True)