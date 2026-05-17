"""
Fichier : user_service.py
Dossier : backend/services/
Description :
    Contient la logique métier liée aux utilisateurs.
    Ce fichier sert d'intermédiaire entre les routes Flask et les données utilisateurs.

À compléter plus tard :
    Maël pourra remplacer l'utilisation de temp_data.py par de vraies requêtes en base de données.
"""

from database.temp_data import users


def remove_password(user):
    """
    Retourne une copie de l'utilisateur sans son mot de passe.
    """
    user_without_password = user.copy()
    user_without_password.pop("password", None)
    return user_without_password


def get_all_users():
    """
    Retourne tous les utilisateurs sans leurs mots de passe.
    """
    # TODO Maël : remplacer cette lecture temporaire par une requête en base de données
    return [remove_password(user) for user in users]


def get_user_profile():
    """
    Retourne temporairement le profil du premier utilisateur.
    """
    # TODO Maël : récupérer le vrai utilisateur connecté avec son identifiant
    if len(users) == 0:
        return None

    return remove_password(users[0])


def update_user_profile(data):
    """
    Met à jour les informations du profil utilisateur.
    """
    # TODO Maël : remplacer cette modification temporaire par une mise à jour en base de données
    if len(users) == 0:
        return None

    user = users[0]

    user["nom"] = data.get("nom", user["nom"])
    user["prenom"] = data.get("prenom", user["prenom"])
    user["email"] = data.get("email", user["email"])
    user["antecedents"] = data.get("antecedents", user.get("antecedents", ""))
    user["traitements"] = data.get("traitements", user.get("traitements", ""))
    user["allergies"] = data.get("allergies", user.get("allergies", ""))
    user["birthdate"] = data.get("birthdate", user.get("birthdate", ""))
    user["gender"] = data.get("gender", user.get("gender", ""))
    user["weight"] = data.get("weight", user.get("weight"))
    user["height"] = data.get("height", user.get("height"))
    user["consent"] = data.get("consent", user.get("consent", False))

    return remove_password(user)


def delete_user_profile():
    """
    Supprime temporairement le premier utilisateur de la liste.
    """
    # TODO Maël : remplacer cette suppression temporaire par une suppression en base de données
    if len(users) == 0:
        return False

    users.pop(0)
    return True