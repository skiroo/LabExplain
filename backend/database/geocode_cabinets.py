"""
Fichier : geocode_cabinets.py
Dossier : backend/database/
Description :
    Géocode les adresses des cabinets médicaux déjà importés dans
    CabinetMedecin (issus de l'annuaire ANS), pour alimenter la carte
    interactive Leaflet du choix de médecin.

    Utilise l'API Base Adresse Nationale (BAN), gouv.fr — gratuite,
    sans clé API, sans quota documenté pour un usage raisonnable, et
    adaptée aux adresses françaises (cohérent avec le reste du projet
    qui s'appuie déjà sur l'annuaire ANS).
    Documentation : https://adresse.data.gouv.fr/api-doc/adresse

    L'API BAN propose un endpoint batch CSV (/search/csv/) qui géocode
    plusieurs adresses en un seul appel HTTP — utilisé ici par lots de
    BATCH_SIZE lignes pour rester raisonnable en mémoire et en latence
    par requête, tout en limitant le nombre total d'appels réseau.

    Ce script est idempotent : il ne retraite que les cabinets dont
    latitude/longitude sont encore NULL, donc peut être interrompu et
    relancé sans tout refaire depuis le début.

    Usage :
      python geocode_cabinets.py                   # géocode tout ce qui manque
      python geocode_cabinets.py --limit 5000       # limite le nombre de lignes traitées
      python geocode_cabinets.py --batch-size 200   # taille de lot envoyée à l'API BAN
      python geocode_cabinets.py --score-min 0.5    # seuil de confiance BAN (défaut : 0.4)
"""

import argparse
import csv
import io
import sys
import time
from pathlib import Path

try:
    import requests
except ImportError:
    sys.exit("Erreur : requests manquant. Lancez : pip install requests")

try:
    import mysql.connector
except ImportError:
    sys.exit("Erreur : mysql-connector-python manquant. Lancez : pip install mysql-connector-python")

try:
    from dotenv import load_dotenv
    import os
except ImportError:
    sys.exit("Erreur : python-dotenv manquant. Lancez : pip install python-dotenv")


BAN_BATCH_URL = "https://api-adresse.data.gouv.fr/search/csv/"

# Seuil de confiance minimum retourné par l'API BAN (result_score, entre 0 et 1).
# En dessous, on considère que l'adresse n'a pas été résolue de façon fiable.
# 0.4 est un seuil raisonnable pour des adresses issues de l'annuaire ANS.
DEFAULT_SCORE_MIN = 0.4

# Pause entre deux lots pour rester un utilisateur respectueux du service
# public gratuit (pas de clé API = pas de garantie de quota).
PAUSE_BETWEEN_BATCHES_SECONDS = 1.0


def get_connection():
    env_path = Path(__file__).resolve().parent.parent / ".env"
    load_dotenv(dotenv_path=env_path)

    return mysql.connector.connect(
        host=os.getenv("MYSQL_HOST"),
        port=int(os.getenv("MYSQL_PORT", "3306")),
        user=os.getenv("MYSQL_USER"),
        password=os.getenv("MYSQL_PASSWORD"),
        database=os.getenv("MYSQL_DB"),
        # SSL requis pour Aiven
        ssl_disabled=False,
    )


def fetch_cabinets_to_geocode(conn, limit: int | None) -> list:
    """Récupère les cabinets sans coordonnées GPS, avec une adresse exploitable."""
    cursor = conn.cursor(dictionary=True)

    query = """
        SELECT id_cabinet, adresse, code_postal, ville
        FROM CabinetMedecin
        WHERE latitude IS NULL
          AND longitude IS NULL
          AND adresse IS NOT NULL
          AND adresse != ''
    """
    if limit:
        query += " LIMIT %s"
        cursor.execute(query, (limit,))
    else:
        cursor.execute(query)

    rows = cursor.fetchall()
    cursor.close()
    return rows


def geocode_batch(rows: list, score_min: float) -> dict:
    """
    Envoie un lot de cabinets à l'API BAN batch CSV et retourne un dict
    {id_cabinet: (latitude, longitude)} pour les adresses résolues.

    L'API BAN retourne result_score (float 0-1) comme indicateur de confiance —
    il n'existe pas de colonne result_status dans sa réponse. On filtre sur
    result_score >= score_min pour ne garder que les géocodages fiables.

    Les adresses non résolues resteront NULL en base et pourront être
    retentées plus tard (script idempotent).
    """
    # Construction du CSV d'entrée
    buffer = io.StringIO()
    writer = csv.writer(buffer)
    writer.writerow(["id_cabinet", "adresse", "code_postal", "ville"])
    for row in rows:
        writer.writerow([
            row["id_cabinet"],
            row["adresse"] or "",
            row["code_postal"] or "",
            row["ville"] or "",
        ])

    csv_bytes = buffer.getvalue().encode("utf-8")

    # Appel API BAN — on ne restreint pas result_columns pour recevoir
    # toutes les colonnes par défaut, dont result_score, latitude, longitude.
    response = requests.post(
        BAN_BATCH_URL,
        files={"data": ("cabinets.csv", csv_bytes, "text/csv")},
        data={
            "columns": "adresse",
            "postcode": "code_postal",
        },
        timeout=60,
    )
    response.raise_for_status()

    results = {}
    reader = csv.DictReader(io.StringIO(response.text))
    for line in reader:
        # Filtre sur le score de confiance (remplace l'inexistant result_status)
        try:
            score = float(line.get("result_score") or 0)
        except ValueError:
            continue
        if score < score_min:
            continue

        lat = line.get("latitude")
        lon = line.get("longitude")
        if not lat or not lon:
            continue

        try:
            results[int(line["id_cabinet"])] = (float(lat), float(lon))
        except (ValueError, KeyError):
            continue

    return results


def update_coordinates(conn, coordinates: dict):
    """Met à jour latitude/longitude pour les cabinets géocodés avec succès."""
    if not coordinates:
        return

    cursor = conn.cursor()
    cursor.executemany(
        "UPDATE CabinetMedecin SET latitude = %s, longitude = %s WHERE id_cabinet = %s",
        [(lat, lon, id_cabinet) for id_cabinet, (lat, lon) in coordinates.items()],
    )
    conn.commit()
    cursor.close()


def main():
    parser = argparse.ArgumentParser(
        description="Géocode les cabinets médicaux via l'API BAN."
    )
    parser.add_argument("--limit", type=int, default=None,
                        help="Nombre maximum de cabinets à traiter (défaut : tous).")
    parser.add_argument("--batch-size", type=int, default=300,
                        help="Nombre d'adresses par appel à l'API BAN (défaut : 300).")
    parser.add_argument("--score-min", type=float, default=DEFAULT_SCORE_MIN,
                        help=f"Seuil de confiance BAN, entre 0 et 1 (défaut : {DEFAULT_SCORE_MIN}).")
    args = parser.parse_args()

    conn = get_connection()
    cabinets = fetch_cabinets_to_geocode(conn, args.limit)
    total = len(cabinets)

    if total == 0:
        print("Aucun cabinet à géocoder — tout est déjà à jour.")
        conn.close()
        return

    print(f"{total} cabinet(s) à géocoder, par lots de {args.batch_size} "
          f"(seuil score BAN : {args.score_min}).")

    geocoded_count = 0
    failed_count   = 0

    for start in range(0, total, args.batch_size):
        batch        = cabinets[start:start + args.batch_size]
        batch_number = (start // args.batch_size) + 1

        try:
            coordinates = geocode_batch(batch, args.score_min)
        except requests.RequestException as exc:
            print(f"Lot {batch_number} : erreur réseau ({exc}) — lot ignoré, relancer le script plus tard.")
            failed_count += len(batch)
            time.sleep(PAUSE_BETWEEN_BATCHES_SECONDS)
            continue

        update_coordinates(conn, coordinates)

        geocoded_count += len(coordinates)
        failed_count   += len(batch) - len(coordinates)

        print(
            f"Lot {batch_number} : {len(coordinates)}/{len(batch)} adresses géocodées "
            f"({start + len(batch)}/{total} traitées au total)."
        )

        time.sleep(PAUSE_BETWEEN_BATCHES_SECONDS)

    conn.close()

    print(
        f"\nTerminé : {geocoded_count} cabinet(s) géocodé(s) avec succès, "
        f"{failed_count} non résolu(s) (score insuffisant ou adresse incomplète)."
    )


if __name__ == "__main__":
    main()
