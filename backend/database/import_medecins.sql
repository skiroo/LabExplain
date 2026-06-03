-- ============================================================
-- Fichier : import_medecins.sql
-- Généré automatiquement depuis le répertoire AMELI (data.gouv.fr)
-- ============================================================
--
-- INSTRUCTIONS — IMPORT DU RÉPERTOIRE DES MÉDECINS
--
-- 1. TÉLÉCHARGER LE CSV
--    Récupère le fichier sur data.gouv.fr :
--    https://www.data.gouv.fr/fr/datasets/liste-des-professionnels-de-sante/
--
-- 2. AJOUTER MYSQL AU PATH (PowerShell)
--    $env:PATH += ";C:\Program Files\MySQL\MySQL Server 8.0\bin"
--
-- 3. SE CONNECTER AVEC LOCAL INFILE ACTIVÉ (PowerShell)
--    mysql --local-infile=1 -u root -p labexplain_db
--
-- 4. LANCER L'IMPORT — remplace le chemin par le tien
--
-- ============================================================


LOAD DATA LOCAL INFILE 'C:/Users/lebri/Downloads/liste-ps-20260601-023120.csv'
INTO TABLE Medecin
CHARACTER SET utf8mb4
FIELDS TERMINATED BY ','
ENCLOSED BY '"'
LINES TERMINATED BY '\n'
IGNORE 1 LINES
(
    nom,
    prenom,
    civilite,
    @raison_sociale,
    @carte_vitale,
    @apcv,
    @specialite_code,
    specialite,
    @activite_code,
    @activite_libelle,
    @type_ps_code,
    @type_ps_libelle,
    telephone,
    adresse,
    @complement,
    @lieu_dit,
    code_postal,
    ville,
    @option_code,
    @option_libelle,
    @secteur_code,
    secteur_conventionnel,
    @nature_code,
    nature_exercice
)
SET
    email = NULL,
    civilite = NULLIF(civilite, '');