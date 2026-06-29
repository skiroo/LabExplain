"""
Fichier : app.py
Dossier : backend/
Description :
    Point d'entrée principal du backend Flask de LabExplain.
    Initialise l'application, configure la base de données MySQL,
    active le CORS et enregistre tous les blueprints de routes.
"""

from flask import Flask
from flask_cors import CORS

from config import Config
from database.db import init_db

from routes.health_routes import health_bp
from routes.auth_routes import auth_bp
from routes.user_routes import user_bp
from routes.doctor_routes import doctor_bp
from routes.consultation_routes import consultation_bp
from routes.rendezvous_routes import rendezvous_bp
from routes.ai_routes import ai_bp

app = Flask(__name__)

# Charge la configuration (variables d'environnement + MySQL)
app.config.from_object(Config)

# Initialise la connexion MySQL
init_db(app)

# Autorise les requêtes venant du frontend web et mobile
CORS(app)

# Enregistrement des blueprints
app.register_blueprint(health_bp, url_prefix="/api")
app.register_blueprint(auth_bp, url_prefix="/api/auth")
app.register_blueprint(user_bp, url_prefix="/api/users")
app.register_blueprint(doctor_bp, url_prefix="/api/doctors")
app.register_blueprint(consultation_bp, url_prefix="/api/consultations")
app.register_blueprint(rendezvous_bp, url_prefix="/api/rendezvous")
app.register_blueprint(ai_bp, url_prefix="/api/ai")

if __name__ == "__main__":
    app.run(debug=True)