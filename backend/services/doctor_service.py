"""
Fichier : doctor_service.py
Dossier : backend/services/
Description :
    Logique métier liée aux médecins — nouveau schéma.
    La table Medecin n'a plus d'email directement : on joint avec Compte.
"""

from database.db import mysql


def get_all_doctors():
    """
    Retourne la liste de tous les médecins avec leur email depuis Compte
    et leur spécialité depuis Specialite.
    """
    cursor = mysql.connection.cursor()
    try:
        cursor.execute(
            """
            SELECT m.id_medecin, m.nom, m.prenom, s.libelle AS specialite, c.email
            FROM Medecin m
            JOIN Compte c ON c.id_compte = m.id_compte
            LEFT JOIN Specialite s ON s.id_specialite = m.id_specialite
            ORDER BY m.nom, m.prenom
            """
        )
        return cursor.fetchall()
    except Exception:
        return []
    finally:
        cursor.close()


def get_doctor_by_id(doctor_id: int):
    """
    Retourne un médecin précis avec son email et sa spécialité.
    """
    cursor = mysql.connection.cursor()
    try:
        cursor.execute(
            """
            SELECT m.id_medecin, m.nom, m.prenom, s.libelle AS specialite, c.email
            FROM Medecin m
            JOIN Compte c ON c.id_compte = m.id_compte
            LEFT JOIN Specialite s ON s.id_specialite = m.id_specialite
            WHERE m.id_medecin = %s
            """,
            (doctor_id,)
        )
        return cursor.fetchone()
    except Exception:
        return None
    finally:
        cursor.close()


# ── Annuaire ANS — pour la carte interactive de choix de médecin ────────────
#
# Ces fonctions interrogent MedecinAnnuaire/CabinetMedecin (les ~130 000
# médecins importés depuis l'annuaire ANS), et non Medecin (les rares
# comptes LabExplain). C'est cette base qui alimente la carte : le patient
# choisit un médecin qu'il a réellement comme praticien, qu'il ait ou non
# un compte sur l'application.

# Rayon maximal accepté pour la recherche par zone (en degrés, approximation
# simple sans calcul de distance sphérique — suffisant pour une carte locale,
# évite de charger inutilement des cabinets à l'autre bout de la France).
MAX_SEARCH_DELTA_DEGREES = 0.5


def search_cabinets_near(latitude: float, longitude: float, query: str = "", limit: int = 200):
    """
    Retourne les cabinets géolocalisés autour d'un point donné, avec le nom,
    la spécialité et les coordonnées du médecin associé, pour affichage sur
    la carte Leaflet.

    Args:
        latitude  : Latitude du centre de recherche (position de l'utilisateur
                    ou centre de la carte actuellement affichée).
        longitude : Longitude du centre de recherche.
        query     : Filtre textuel optionnel sur le nom du médecin.
        limit     : Nombre maximum de résultats (évite de surcharger la carte).

    Returns:
        Liste de dicts avec id_cabinet, adresse, ville, code_postal,
        latitude, longitude, rpps, nom, prenom, specialite.
    """
    cursor = mysql.connection.cursor()
    try:
        sql = """
            SELECT
                cab.id_cabinet, cab.adresse, cab.ville, cab.code_postal,
                cab.latitude, cab.longitude, cab.telephone,
                ma.rpps, ma.nom, ma.prenom, ma.civilite,
                s.libelle AS specialite
            FROM CabinetMedecin cab
            JOIN MedecinAnnuaire ma ON ma.rpps = cab.rpps
            LEFT JOIN Specialite s ON s.id_specialite = ma.id_specialite_principale
            WHERE cab.latitude IS NOT NULL
              AND cab.longitude IS NOT NULL
              AND cab.latitude  BETWEEN %s AND %s
              AND cab.longitude BETWEEN %s AND %s
        """
        params = [
            latitude - MAX_SEARCH_DELTA_DEGREES, latitude + MAX_SEARCH_DELTA_DEGREES,
            longitude - MAX_SEARCH_DELTA_DEGREES, longitude + MAX_SEARCH_DELTA_DEGREES,
        ]

        clean_query = (query or "").strip()
        if clean_query:
            sql += " AND (ma.nom LIKE %s OR ma.prenom LIKE %s)"
            like_term = f"%{clean_query}%"
            params += [like_term, like_term]

        sql += " ORDER BY ma.nom, ma.prenom LIMIT %s"
        params.append(limit)

        cursor.execute(sql, tuple(params))
        return cursor.fetchall()
    except Exception:
        return []
    finally:
        cursor.close()


def get_cabinet_by_id(cabinet_id: int):
    """
    Retourne un cabinet précis avec les informations du médecin associé,
    utilisé pour pré-remplir la création d'un rendez-vous après sélection
    d'un marqueur sur la carte.
    """
    cursor = mysql.connection.cursor()
    try:
        cursor.execute(
            """
            SELECT
                cab.id_cabinet, cab.adresse, cab.ville, cab.code_postal,
                cab.latitude, cab.longitude, cab.telephone,
                ma.rpps, ma.nom, ma.prenom, ma.civilite,
                s.libelle AS specialite
            FROM CabinetMedecin cab
            JOIN MedecinAnnuaire ma ON ma.rpps = cab.rpps
            LEFT JOIN Specialite s ON s.id_specialite = ma.id_specialite_principale
            WHERE cab.id_cabinet = %s
            """,
            (cabinet_id,)
        )
        return cursor.fetchone()
    except Exception:
        return None
    finally:
        cursor.close()
