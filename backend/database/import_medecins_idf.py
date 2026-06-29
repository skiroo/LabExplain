#!/usr/bin/env python3
# ============================================================
# import_medecins_idf.py
# Dossier : backend/database/
#
# Alimentation de MedecinAnnuaire, MedecinSpecialite, CabinetMedecin
# et Specialite à partir des fichiers open data ANS :
#   - ps-libreacces-personne-activite.txt  → médecins + cabinets
#   - ps-libreacces-savoirfaire.txt        → spécialités supplémentaires
#   - extraction-correspondance-mssante.txt → emails MSSanté
#
# Périmètre : médecins (code profession 10) en Île-de-France
#             (codes postaux 75, 77, 78, 91, 92, 93, 94, 95)
#
# Usage :
#   python import_medecins_idf.py             # lit backend/.env automatiquement
#   python import_medecins_idf.py --dry-run   # stats seulement, aucune écriture
#
#   Les arguments CLI écrasent le .env si besoin :
#   python import_medecins_idf.py --host X --port Y --user Z --password W
#
# Prérequis :
#   pip install mysql-connector-python python-dotenv
# ============================================================

import argparse
import csv
import os
import sys
import time
from pathlib import Path

# ── Constantes ──────────────────────────────────────────────

# Préfixes de codes postaux des 8 départements IDF
IDF_PREFIXES = frozenset(('75', '77', '78', '91', '92', '93', '94', '95'))

# Code ANS pour la profession "Médecin"
CODE_MEDECIN = '10'

# Types de savoir-faire — priorité décroissante pour la spécialité principale
PRIORITY_SF = ('S', 'CEX', 'PAC')

# Taille des lots pour les INSERT
BATCH_SIZE = 500

# Chemins des fichiers source — dans le même dossier que ce script (backend/database/)
DIR     = Path(__file__).parent
FILE_PA = DIR / 'ps-libreacces-personne-activite.txt'
FILE_SF = DIR / 'ps-libreacces-savoirfaire.txt'
FILE_MS = DIR / 'extraction-correspondance-mssante.txt'

# .env du backend : remonter d'un niveau (backend/database/ → backend/)
ENV_FILE = DIR.parent / '.env'


# ── Chargement de la configuration ──────────────────────────

def load_config(args: argparse.Namespace) -> dict:
    """
    Construit la config DB en fusionnant .env et arguments CLI.
    Les arguments CLI ont priorité sur le .env.
    """
    # Charger le .env manuellement (sans dépendance à dotenv si absent)
    env: dict[str, str] = {}
    if ENV_FILE.exists():
        with open(ENV_FILE, encoding='utf-8') as f:
            for line in f:
                line = line.strip()
                if not line or line.startswith('#') or '=' not in line:
                    continue
                key, _, val = line.partition('=')
                env[key.strip()] = val.strip()
        print(f"    .env chargé depuis {ENV_FILE}")
    else:
        print(f"    Avertissement : .env introuvable ({ENV_FILE}), "
              "utilisation des arguments CLI uniquement.")

    # Résolution : CLI > .env > défauts
    host     = args.host     or env.get('MYSQL_HOST',     'localhost')
    port     = args.port     or int(env.get('MYSQL_PORT', '3306'))
    user     = args.user     or env.get('MYSQL_USER',     '')
    password = args.password or env.get('MYSQL_PASSWORD', '')
    database = args.database or env.get('MYSQL_DB',       'defaultdb')

    if not user or not password:
        print("ERREUR : identifiants MySQL manquants (ni dans .env ni en argument).",
              file=sys.stderr)
        sys.exit(1)

    return {
        'host':     host,
        'port':     port,
        'user':     user,
        'password': password,
        'database': database,
        'charset':  'utf8mb4',
        # SSL requis pour Aiven — vide = SSL activé sans vérification de certificat client
        'ssl_disabled': False,
    }


# ── Helpers ─────────────────────────────────────────────────

def _strip(val: str) -> str | None:
    """Renvoie None si la chaîne est vide après strip, sinon la chaîne nettoyée."""
    v = val.strip()
    return v if v else None


def _is_idf(cp: str, code_commune: str) -> bool:
    """Retourne True si le code postal ou le code commune appartient à l'IDF."""
    return cp[:2] in IDF_PREFIXES or code_commune[:2] in IDF_PREFIXES


def _open(path: Path):
    """Ouvre un fichier ANS (UTF-8, séparateur |) et retourne (col_dict, reader, file)."""
    f = open(path, encoding='utf-8', newline='')
    reader = csv.reader(f, delimiter='|')
    header = next(reader)
    col = {name.strip(): i for i, name in enumerate(header)}
    return col, reader, f


# ── Étape 1 : ps-libreacces-personne-activite ───────────────

def load_personne_activite():
    """
    Parcourt le fichier principal en un seul passage.

    Retourne :
        specialites : dict  code_sm -> libelle
        medecins    : dict  rpps -> {nom, prenom, civilite, mode_exercice,
                                     telephone, specialites: [(code_sm, libelle, type_sf)],
                                     best_type_sf: str | None}
        cabinets    : list  [{rpps, adresse, code_postal, ville, telephone}]
        rpps_idf    : set   ensemble des RPPS IDF trouvés
    """
    print(f"[1/4] Lecture {FILE_PA.name} …", flush=True)
    t0 = time.time()

    col, reader, f = _open(FILE_PA)

    # Colonnes utilisées
    i_id    = col["Identifiant PP"]
    i_pro   = col["Code profession"]
    i_cp    = col["Code postal (coord. structure)"]
    i_com   = col["Code commune (coord. structure)"]
    i_nom   = col["Nom d'exercice"]
    i_prn   = col["Prénom d'exercice"]
    i_lciv  = col["Libellé civilité d'exercice"]
    i_lmode = col["Libellé mode exercice"]
    i_tel   = col["Téléphone (coord. structure)"]
    i_tsf   = col["Code type savoir-faire"]
    i_csf   = col["Code savoir-faire"]
    i_lsf   = col["Libellé savoir-faire"]
    i_num   = col["Numéro Voie (coord. structure)"]
    i_tvoi  = col["Libellé type de voie (coord. structure)"]
    i_lvoi  = col["Libellé Voie (coord. structure)"]
    i_vil   = col["Libellé commune (coord. structure)"]

    specialites: dict[str, str] = {}
    medecins: dict[str, dict]   = {}
    cabinets: list[dict]        = []
    rpps_idf: set[str]          = set()

    skipped = 0
    rows    = 0

    try:
        for row in reader:
            rows += 1
            if len(row) <= max(i_id, i_pro, i_cp, i_com):
                skipped += 1
                continue

            # Filtre profession médecin
            if row[i_pro].strip() != CODE_MEDECIN:
                continue

            # Filtre géographique IDF
            cp  = row[i_cp].strip()
            com = row[i_com].strip()
            if not _is_idf(cp, com):
                continue

            rpps = row[i_id].strip()
            if not rpps:
                continue
            rpps_idf.add(rpps)

            # ── Médecin (première occurrence = données de référence) ──
            if rpps not in medecins:
                medecins[rpps] = {
                    'nom':           _strip(row[i_nom])  or 'INCONNU',
                    'prenom':        _strip(row[i_prn])  or 'INCONNU',
                    'civilite':      _strip(row[i_lciv]),
                    'mode_exercice': _strip(row[i_lmode]),
                    'telephone':     _strip(row[i_tel]),
                    'specialites':   [],   # [(code_sm, libelle, type_sf)]
                    'best_type_sf':  None,
                }

            med = medecins[rpps]

            # ── Spécialité de cette ligne ──
            code_sm    = _strip(row[i_csf])
            libelle_sf = _strip(row[i_lsf])
            type_sf    = _strip(row[i_tsf])

            if code_sm and libelle_sf:
                specialites[code_sm] = libelle_sf
                med['specialites'].append((code_sm, libelle_sf, type_sf))

                # Mise à jour du meilleur type de savoir-faire par priorité
                current_best = med['best_type_sf']
                if type_sf in PRIORITY_SF:
                    if (current_best is None
                            or PRIORITY_SF.index(type_sf) < PRIORITY_SF.index(current_best)):
                        med['best_type_sf'] = type_sf

            # ── Cabinet (une ligne = une structure d'exercice potentielle) ──
            parts = [
                _strip(row[i_num]),
                _strip(row[i_tvoi]),
                _strip(row[i_lvoi]),
            ]
            adresse = ' '.join(p for p in parts if p) or None

            cab = {
                'rpps':        rpps,
                'adresse':     adresse,
                'code_postal': _strip(cp),
                'ville':       _strip(row[i_vil]),
                'telephone':   _strip(row[i_tel]),
            }
            # On n'insère pas les cabinets sans aucune donnée géographique
            if any([cab['adresse'], cab['code_postal'], cab['ville']]):
                cabinets.append(cab)

    finally:
        f.close()

    elapsed = time.time() - t0
    print(f"    {rows:,} lignes lues en {elapsed:.1f}s — "
          f"{len(medecins):,} médecins, {len(cabinets):,} cabinets, "
          f"{len(specialites):,} spécialités  ({skipped} ignorées)")

    return specialites, medecins, cabinets, rpps_idf


# ── Étape 2 : ps-libreacces-savoirfaire ─────────────────────

def load_savoirfaire(
    rpps_idf: set[str],
    specialites: dict[str, str],
    medecins: dict[str, dict],
):
    """
    Complète les spécialités depuis le fichier savoir-faire.
    Seuls les RPPS déjà présents dans rpps_idf sont traités.
    """
    print(f"[2/4] Lecture {FILE_SF.name} …", flush=True)
    t0 = time.time()

    col, reader, f = _open(FILE_SF)

    i_id  = col["Identifiant PP"]
    i_pro = col["Code profession"]
    i_tsf = col["Code type savoir-faire"]
    i_csf = col["Code savoir-faire"]
    i_lsf = col["Libellé savoir-faire"]

    added = 0
    try:
        for row in reader:
            if len(row) <= max(i_id, i_pro, i_csf):
                continue
            if row[i_pro].strip() != CODE_MEDECIN:
                continue
            rpps = row[i_id].strip()
            if rpps not in rpps_idf:
                continue

            code_sm    = _strip(row[i_csf])
            libelle_sf = _strip(row[i_lsf])
            type_sf    = _strip(row[i_tsf])

            if not code_sm or not libelle_sf:
                continue

            specialites.setdefault(code_sm, libelle_sf)

            med = medecins.get(rpps)
            if med is None:
                continue

            # Éviter les doublons de spécialité
            existing_codes = {s[0] for s in med['specialites']}
            if code_sm not in existing_codes:
                med['specialites'].append((code_sm, libelle_sf, type_sf))
                added += 1

                # Réévaluer best_type_sf
                current_best = med['best_type_sf']
                if type_sf in PRIORITY_SF:
                    if (current_best is None
                            or PRIORITY_SF.index(type_sf) < PRIORITY_SF.index(current_best)):
                        med['best_type_sf'] = type_sf
    finally:
        f.close()

    print(f"    {added:,} spécialités supplémentaires ajoutées ({time.time()-t0:.1f}s)")


# ── Étape 3 : extraction-correspondance-mssante ─────────────

def load_mssante(rpps_idf: set[str]) -> dict[str, str]:
    """
    Retourne un dict rpps -> email_mssante pour les médecins IDF.
    Seules les lignes PER (personnes physiques, pas les organisations) sont retenues.
    """
    print(f"[3/4] Lecture {FILE_MS.name} …", flush=True)
    t0 = time.time()

    col, reader, f = _open(FILE_MS)

    i_type  = 0   # colonne "Type de BAL"
    i_email = col["Adresse BAL"]
    i_id    = col["Identifiant PP"]
    i_pro   = col["Code Profession"]

    emails: dict[str, str] = {}
    try:
        for row in reader:
            if len(row) <= max(i_type, i_email, i_id, i_pro):
                continue
            if row[i_type].strip() != 'PER':
                continue
            if row[i_pro].strip() != CODE_MEDECIN:
                continue
            rpps = row[i_id].strip()
            if rpps not in rpps_idf:
                continue
            email = _strip(row[i_email])
            if email:
                emails[rpps] = email
    finally:
        f.close()

    print(f"    {len(emails):,} emails MSSanté trouvés ({time.time()-t0:.1f}s)")
    return emails


# ── Étape 4 : import en base ─────────────────────────────────

def import_to_db(
    specialites: dict[str, str],
    medecins: dict[str, dict],
    cabinets: list[dict],
    emails: dict[str, str],
    db_cfg: dict,
    dry_run: bool,
):
    """
    Insère dans l'ordre :
      1. Specialite
      2. MedecinAnnuaire
      3. MedecinSpecialite
      4. CabinetMedecin
    Utilise INSERT IGNORE pour l'idempotence (relance sans risque de doublons).
    """
    if dry_run:
        print("[4/4] Mode dry-run — aucune écriture en base.")
        print(f"    Specialites  : {len(specialites):,}")
        print(f"    Médecins     : {len(medecins):,}")
        print(f"    Cabinets     : {len(cabinets):,}")
        print(f"    Emails MS    : {len(emails):,}")
        return

    import mysql.connector

    print("[4/4] Connexion à la base …", flush=True)
    try:
        cnx = mysql.connector.connect(**db_cfg)
    except mysql.connector.Error as e:
        print(f"ERREUR de connexion : {e}", file=sys.stderr)
        sys.exit(1)

    cur = cnx.cursor()

    # Désactiver les FK pour l'import en masse (gain de perf significatif)
    cur.execute("SET FOREIGN_KEY_CHECKS = 0")

    # ── 4.1 Specialite ──────────────────────────────────────
    print("    Insertion Specialite …", flush=True)
    spec_list = list(specialites.items())   # [(code_sm, libelle)]
    for i in range(0, len(spec_list), BATCH_SIZE):
        batch = spec_list[i:i + BATCH_SIZE]
        cur.executemany(
            "INSERT IGNORE INTO Specialite (code_sm, libelle) VALUES (%s, %s)",
            batch,
        )
    cnx.commit()

    # Construire le mapping code_sm -> id_specialite pour les étapes suivantes
    cur.execute("SELECT id_specialite, code_sm FROM Specialite WHERE code_sm IS NOT NULL")
    sm_to_id: dict[str, int] = {row[1]: row[0] for row in cur.fetchall()}

    # ── 4.2 MedecinAnnuaire ─────────────────────────────────
    print("    Insertion MedecinAnnuaire …", flush=True)
    med_rows = []
    for rpps, m in medecins.items():
        # Spécialité principale : première spécialité du type le plus prioritaire
        best_tf = m['best_type_sf']
        id_spec_principale = None
        for code_sm, _, tf in m['specialites']:
            if tf == best_tf and code_sm in sm_to_id:
                id_spec_principale = sm_to_id[code_sm]
                break
        med_rows.append((
            rpps,
            m['nom'],
            m['prenom'],
            m['civilite'],
            id_spec_principale,
            m['telephone'],
            emails.get(rpps),
            m['mode_exercice'],
        ))

    for i in range(0, len(med_rows), BATCH_SIZE):
        batch = med_rows[i:i + BATCH_SIZE]
        cur.executemany(
            """INSERT IGNORE INTO MedecinAnnuaire
               (rpps, nom, prenom, civilite, id_specialite_principale,
                telephone, email_mssante, mode_exercice)
               VALUES (%s, %s, %s, %s, %s, %s, %s, %s)""",
            batch,
        )
    cnx.commit()
    print(f"      {len(med_rows):,} médecins insérés")

    # ── 4.3 MedecinSpecialite ───────────────────────────────
    print("    Insertion MedecinSpecialite …", flush=True)
    spec_rows = []
    for rpps, m in medecins.items():
        seen = set()
        for code_sm, _, type_sf in m['specialites']:
            if code_sm not in sm_to_id:
                continue
            key = (rpps, sm_to_id[code_sm])
            if key in seen:
                continue
            seen.add(key)
            spec_rows.append((rpps, sm_to_id[code_sm], type_sf))

    for i in range(0, len(spec_rows), BATCH_SIZE):
        batch = spec_rows[i:i + BATCH_SIZE]
        cur.executemany(
            """INSERT IGNORE INTO MedecinSpecialite
               (rpps, id_specialite, type_savoir_faire)
               VALUES (%s, %s, %s)""",
            batch,
        )
    cnx.commit()
    print(f"      {len(spec_rows):,} associations spécialité insérées")

    # ── 4.4 CabinetMedecin ──────────────────────────────────
    print("    Insertion CabinetMedecin …", flush=True)
    cab_rows = [
        (c['adresse'], c['code_postal'], c['ville'], c['telephone'], c['rpps'])
        for c in cabinets
    ]
    inserted_cabs = 0
    for i in range(0, len(cab_rows), BATCH_SIZE):
        batch = cab_rows[i:i + BATCH_SIZE]
        cur.executemany(
            """INSERT IGNORE INTO CabinetMedecin
               (adresse, code_postal, ville, telephone, rpps)
               VALUES (%s, %s, %s, %s, %s)""",
            batch,
        )
        inserted_cabs += cur.rowcount
    cnx.commit()
    print(f"      {inserted_cabs:,} cabinets insérés")

    # Réactiver les FK
    cur.execute("SET FOREIGN_KEY_CHECKS = 1")
    cnx.commit()

    cur.close()
    cnx.close()
    print("    Import terminé.")


# ── Point d'entrée ───────────────────────────────────────────

def main():
    parser = argparse.ArgumentParser(
        description="Import des médecins IDF (ANS) dans LabExplain.",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog=(
            "Exemples :\n"
            "  python import_medecins_idf.py               # lit backend/.env\n"
            "  python import_medecins_idf.py --dry-run     # stats seules\n"
            "  python import_medecins_idf.py --host X --user Y --password Z\n"
        ),
    )
    # Tous les arguments sont optionnels : le .env prend le relais si absent
    parser.add_argument('--host',     default=None, help="Hôte MySQL (défaut : .env)")
    parser.add_argument('--port',     default=None, type=int, help="Port MySQL (défaut : .env)")
    parser.add_argument('--user',     default=None, help="Utilisateur MySQL (défaut : .env)")
    parser.add_argument('--password', default=None, help="Mot de passe MySQL (défaut : .env)")
    parser.add_argument('--database', default=None, help="Nom de la base (défaut : .env)")
    parser.add_argument('--dry-run',  action='store_true',
                        help="Affiche les stats sans écrire en base")
    args = parser.parse_args()

    # Vérification des fichiers source
    for path in (FILE_PA, FILE_SF, FILE_MS):
        if not path.exists():
            print(f"ERREUR : fichier introuvable : {path}", file=sys.stderr)
            print("  Placez les fichiers ANS dans le même dossier que ce script.",
                  file=sys.stderr)
            sys.exit(1)

    # Chargement de la configuration DB
    db_cfg = load_config(args)

    t_total = time.time()

    # Étape 1 : fichier principal
    specialites, medecins, cabinets, rpps_idf = load_personne_activite()

    # Étape 2 : spécialités supplémentaires
    load_savoirfaire(rpps_idf, specialites, medecins)

    # Étape 3 : emails MSSanté
    emails = load_mssante(rpps_idf)

    # Étape 4 : écriture en base
    import_to_db(specialites, medecins, cabinets, emails, db_cfg, args.dry_run)

    print(f"\nTerminé en {time.time()-t_total:.1f}s total.")


if __name__ == '__main__':
    main()
