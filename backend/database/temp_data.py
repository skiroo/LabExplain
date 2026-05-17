"""
Fichier : temp_data.py
Dossier : backend/database/
Description :
    Contient les données temporaires utilisées pendant le développement du backend LabExplain.
    Ces données permettent de tester les routes Flask avant l'intégration d'une vraie base de données.

À compléter plus tard :
    Maël devra remplacer ces listes temporaires par une vraie base de données.
"""

# TODO Maël : remplacer cette liste par une table users en base de données
users = [
    {
        "id": 1,
        "nom": "Dupont",
        "prenom": "Jean",
        "email": "patient@test.com",
        "password": "1235",
        "role": "patient",
        "antecedents": "Asthme",
        "traitements": "Ventoline",
        "allergies": "Pollen",
        "birthdate": "2015-05-12",
        "gender": "M",
        "weight": 35,
        "height": 140,
        "consent": True
    },
    {
        "id": 2,
        "nom": "Martin",
        "prenom": "Dr",
        "email": "medecin@test.com",
        "password": "1234",
        "role": "medecin",
        "antecedents": "",
        "traitements": "",
        "allergies": "",
        "birthdate": "",
        "gender": "",
        "weight": None,
        "height": None,
        "consent": True
    }
]

# TODO Maël : remplacer cette liste par une table doctors en base de données
doctors = [
    {
        "id": 1,
        "nom": "Martin",
        "prenom": "Dr",
        "email": "medecin@test.com",
        "specialty": "Médecin généraliste",
        "city": "Paris"
    }
]

# TODO Maël : remplacer cette liste par une table consultations en base de données
consultations = []