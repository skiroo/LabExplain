"""
Fichier : rendezvous_service.py
Dossier : backend/services/
Description :
    Logique métier pour la déclaration de rendez-vous par le patient.

    Un RendezVous est purement déclaratif : le patient indique lui-même
    qu'il a un rendez-vous à telle date avec tel médecin (choisi sur la
    carte des cabinets, issus de MedecinAnnuaire). Aucune validation ni
    notification du médecin n'est effectuée — voir le commentaire de la
    table RendezVous dans schema.sql pour la justification (éviter le
    spam vers des médecins qui ne gèrent pas d'agenda numérique, et
    respecter le principe de minimisation RGPD : rien n'est transmis au
    médecin sans action explicite et distincte du patient).
"""

from database.db import mysql


def _resolve_patient_id(cursor, compte_id):
    """
    Résout l'id_patient à partir de l'id_compte connecté.
    Le header X-User-Id transporte un id_compte (pas un id_patient).
    """
    cursor.execute(
        "SELECT id_patient FROM Patient WHERE id_compte = %s",
        (compte_id,)
    )
    row = cursor.fetchone()
    return row["id_patient"] if row else None


def create_rendezvous(data: dict, compte_id: int):
    """
    Crée un nouveau rendez-vous déclaré par le patient.

    Champs attendus dans data :
      date_heure         (str, format 'YYYY-MM-DD HH:MM:SS' ou 'YYYY-MM-DDTHH:MM')
      medecin_nom         (str, obligatoire)
      medecin_prenom      (str, obligatoire)
      medecin_specialite  (str, optionnel)
      lieu                (str, optionnel)
      rpps_medecin        (str, optionnel — si choisi depuis la carte)
      id_cabinet          (int, optionnel — si choisi depuis la carte)
    """
    date_heure = data.get("date_heure")
    medecin_nom = (data.get("medecin_nom") or "").strip()
    medecin_prenom = (data.get("medecin_prenom") or "").strip()

    if not date_heure:
        return None, "La date et l'heure du rendez-vous sont obligatoires"
    if not medecin_nom or not medecin_prenom:
        return None, "Le nom et le prénom du médecin sont obligatoires"

    cursor = mysql.connection.cursor()

    try:
        patient_id = _resolve_patient_id(cursor, compte_id)
        if not patient_id:
            return None, "Patient introuvable pour ce compte"

        cursor.execute(
            """
            INSERT INTO RendezVous (
                date_heure, medecin_nom, medecin_prenom, medecin_specialite,
                lieu, rpps_medecin, id_cabinet, id_patient, statut
            )
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, 'a_venir')
            """,
            (
                date_heure.replace("T", " "),
                medecin_nom,
                medecin_prenom,
                data.get("medecin_specialite"),
                data.get("lieu"),
                data.get("rpps_medecin"),
                data.get("id_cabinet"),
                patient_id,
            )
        )

        mysql.connection.commit()
        rendezvous_id = cursor.lastrowid

        cursor.execute(
            "SELECT * FROM RendezVous WHERE id_rendezvous = %s",
            (rendezvous_id,)
        )
        return cursor.fetchone(), None

    except Exception as error:
        mysql.connection.rollback()
        return None, f"Erreur lors de la création du rendez-vous : {str(error)}"

    finally:
        cursor.close()


def get_upcoming_rendezvous(compte_id: int):
    """
    Retourne les rendez-vous à venir du patient connecté, triés par date
    croissante (le plus proche en premier). Utilisé pour la liste déroulante
    affichée avant de démarrer l'entretien de préparation dans le chatbot.
    """
    cursor = mysql.connection.cursor()

    try:
        patient_id = _resolve_patient_id(cursor, compte_id)
        if not patient_id:
            return []

        cursor.execute(
            """
            SELECT *
            FROM RendezVous
            WHERE id_patient = %s
              AND statut = 'a_venir'
            ORDER BY date_heure ASC
            """,
            (patient_id,)
        )
        return cursor.fetchall()

    except Exception:
        return []

    finally:
        cursor.close()


def get_all_rendezvous(compte_id: int):
    """
    Retourne tous les rendez-vous du patient connecté (passés et à venir),
    triés du plus récent au plus ancien.
    """
    cursor = mysql.connection.cursor()

    try:
        patient_id = _resolve_patient_id(cursor, compte_id)
        if not patient_id:
            return []

        cursor.execute(
            """
            SELECT *
            FROM RendezVous
            WHERE id_patient = %s
            ORDER BY date_heure DESC
            """,
            (patient_id,)
        )
        return cursor.fetchall()

    except Exception:
        return []

    finally:
        cursor.close()


def delete_rendezvous(rendezvous_id: int, compte_id: int):
    """
    Supprime un rendez-vous, uniquement s'il appartient au patient connecté
    (vérification systématique pour éviter qu'un patient supprime le
    rendez-vous d'un autre en devinant un identifiant).
    """
    cursor = mysql.connection.cursor()

    try:
        patient_id = _resolve_patient_id(cursor, compte_id)
        if not patient_id:
            return False, "Patient introuvable pour ce compte"

        cursor.execute(
            "DELETE FROM RendezVous WHERE id_rendezvous = %s AND id_patient = %s",
            (rendezvous_id, patient_id)
        )
        mysql.connection.commit()

        if cursor.rowcount == 0:
            return False, "Rendez-vous introuvable ou non autorisé"

        return True, None

    except Exception as error:
        mysql.connection.rollback()
        return False, f"Erreur lors de la suppression : {str(error)}"

    finally:
        cursor.close()
