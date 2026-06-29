-- ============================================================
-- Fichier : schema.sql
-- Dossier : backend/database/
-- Description :
--     Schéma LabExplain
--
--     Principes de conception :
--       - 1NF : valeurs atomiques, pas de groupes répétitifs
--       - 2NF : chaque attribut non-clé dépend de la clé entière
--       - 3NF : pas de dépendance transitive entre attributs non-clés
--
--     Sources de données annuaire :
--       - ps-libreacces-personne-activite.txt (ANS) → MedecinAnnuaire, Specialite, CabinetMedecin
--       - extraction-correspondance-mssante.txt (ANS) → MedecinAnnuaire.email_mssante
--
-- ============================================================

USE defaultdb;


-- ============================================================
-- TABLE : Specialite
-- Rôle  : Table de référence des spécialités médicales.
--         Alimente depuis ps-libreacces via Code savoir-faire (SM*).
--         Évite les chaînes libres incohérentes (violation 2NF).
-- ============================================================
CREATE TABLE IF NOT EXISTS Specialite (
    id_specialite   INT             NOT NULL AUTO_INCREMENT,
    -- Code officiel ANS (ex: "SM26", "SM54") — source ps-libreacces
    code_sm         VARCHAR(10)     DEFAULT NULL UNIQUE,
    libelle         VARCHAR(150)    NOT NULL UNIQUE,
    PRIMARY KEY (id_specialite),
    INDEX idx_libelle (libelle(50))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;


-- ============================================================
-- TABLE : Compte
-- Rôle  : Authentification uniquement.
--         Ne contient aucune donnée médicale ni personnelle sensible.
--         encryption_salt appartient logiquement aux credentials :
--         nécessaire au déchiffrement, inutilisable sans le mot de passe.
-- ============================================================
CREATE TABLE IF NOT EXISTS Compte (
    id_compte           INT             NOT NULL AUTO_INCREMENT,
    email               VARCHAR(255)    NOT NULL UNIQUE,
    -- Mot de passe hashé bcrypt 12 rounds (jamais en clair)
    password_hash       VARCHAR(255)    NOT NULL,
    role                ENUM('patient', 'medecin') NOT NULL DEFAULT 'patient',
    -- Vérification email à l'inscription
    email_verifie       BOOLEAN         NOT NULL DEFAULT FALSE,
    token_verification  VARCHAR(255)    DEFAULT NULL,
    token_expiration    DATETIME        DEFAULT NULL,
    -- Consentement RGPD horodaté — obligatoire avant tout traitement
    consent             BOOLEAN         NOT NULL DEFAULT FALSE,
    consent_date        DATETIME        DEFAULT NULL,
    -- Sel PBKDF2-SHA256 pour dériver la clé AES des données médicales
    -- NULL pour les médecins (pas de données médicales chiffrées)
    encryption_salt     VARCHAR(64)     DEFAULT NULL,
    created_at          TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id_compte),
    INDEX idx_email_verifie (email_verifie)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;


-- ============================================================
-- TABLE : Patient
-- Rôle  : Données d'identité pseudonymisées.
--         Séparées de Compte pour limiter l'exposition en cas de
--         fuite des credentials (principe de minimisation RGPD).
-- ============================================================
CREATE TABLE IF NOT EXISTS Patient (
    id_patient      INT             NOT NULL AUTO_INCREMENT,
    nom             VARCHAR(100)    NOT NULL,
    prenom          VARCHAR(100)    NOT NULL,
    date_naissance  DATE            DEFAULT NULL,
    gender          VARCHAR(20)     DEFAULT NULL,
    id_compte       INT             NOT NULL UNIQUE,
    PRIMARY KEY (id_patient),
    CONSTRAINT fk_patient_compte
        FOREIGN KEY (id_compte) REFERENCES Compte(id_compte)
        ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;


-- ============================================================
-- TABLE : DonneesPatient
-- Rôle  : Données médicales sensibles chiffrées AES-256-GCM.
--         Format : base64(IV[12] + TAG[16] + CIPHERTEXT).
--         Clé dérivée du mot de passe via PBKDF2-SHA256.
--         Sans le mot de passe, illisibles — même pour nous.
--         Séparée de Patient pour isoler identité et données médicales.
-- ============================================================
CREATE TABLE IF NOT EXISTS DonneesPatient (
    id_donnees      INT             NOT NULL AUTO_INCREMENT,
    antecedents_enc TEXT            DEFAULT NULL,
    traitements_enc TEXT            DEFAULT NULL,
    allergies_enc   TEXT            DEFAULT NULL,
    poids_enc       TEXT            DEFAULT NULL,
    taille_enc      TEXT            DEFAULT NULL,
    updated_at      TIMESTAMP       DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    id_patient      INT             NOT NULL UNIQUE,
    PRIMARY KEY (id_donnees),
    CONSTRAINT fk_donnees_patient
        FOREIGN KEY (id_patient) REFERENCES Patient(id_patient)
        ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;


-- ============================================================
-- TABLE : MedecinAnnuaire
-- Rôle  : Référentiel open data ANS (annuaire.sante.fr).
--         Table de référence pure — aucune FK sortante.
--         C'est Medecin qui pointe ici, jamais l'inverse.
--
--         Clé primaire : rpps (Identifiant PP, 11 chiffres)
--         Identifiant officiel unique et pérenne sur toute la
--         vie professionnelle. Pas de clé surrogate nécessaire.
--
--         Spécialité principale : id_specialite_principale
--         Les spécialités supplémentaires sont dans MedecinSpecialite.
--
--         email_mssante : adresse de messagerie sécurisée de santé,
--         issue de extraction-correspondance-mssante.txt.
--         Utilisée pour le flux de vérification RPPS.
--         83% des médecins en ont une.
--
--         3NF : adresse/code_postal/ville → CabinetMedecin.
-- ============================================================
CREATE TABLE IF NOT EXISTS MedecinAnnuaire (
    -- Clé naturelle : numéro RPPS (11 chiffres, source ANS)
    rpps                        CHAR(11)        NOT NULL,
    nom                         VARCHAR(100)    NOT NULL,
    prenom                      VARCHAR(100)    NOT NULL,
    civilite                    VARCHAR(20)     DEFAULT NULL,
    -- Spécialité principale (type S en priorité, puis CEX, puis NULL)
    id_specialite_principale    INT             DEFAULT NULL,
    telephone                   VARCHAR(20)     DEFAULT NULL,
    -- Email MSSanté issu de extraction-correspondance-mssante.txt
    -- Utilisé pour envoyer le code de vérification RPPS
    email_mssante               VARCHAR(255)    DEFAULT NULL,
    mode_exercice               VARCHAR(50)     DEFAULT NULL,
    PRIMARY KEY (rpps),
    INDEX idx_nom_prenom        (nom, prenom),
    INDEX idx_specialite        (id_specialite_principale),
    INDEX idx_email_mssante     (email_mssante(50)),
    CONSTRAINT fk_annuaire_specialite
        FOREIGN KEY (id_specialite_principale) REFERENCES Specialite(id_specialite)
        ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;


-- ============================================================
-- TABLE : MedecinSpecialite
-- Rôle  : Spécialités supplémentaires d'un médecin.
--         Relation N:N entre MedecinAnnuaire et Specialite.
--         Alimente depuis ps-libreacces quand un RPPS a plusieurs
--         lignes avec des codes savoir-faire différents.
-- ============================================================
CREATE TABLE IF NOT EXISTS MedecinSpecialite (
    rpps            CHAR(11)    NOT NULL,
    id_specialite   INT         NOT NULL,
    -- Type de savoir-faire : S (Spécialité ordinale), CEX (Compétence Exclusive), PAC
    type_savoir_faire   VARCHAR(10) DEFAULT NULL,
    PRIMARY KEY (rpps, id_specialite),
    CONSTRAINT fk_medspec_annuaire
        FOREIGN KEY (rpps) REFERENCES MedecinAnnuaire(rpps)
        ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_medspec_specialite
        FOREIGN KEY (id_specialite) REFERENCES Specialite(id_specialite)
        ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;


-- ============================================================
-- TABLE : CabinetMedecin
-- Rôle  : Coordonnées géographiques des structures d'exercice.
--         3NF : adresse/code_postal/ville décrivent un lieu physique,
--         pas le médecin lui-même. Un médecin peut avoir plusieurs
--         cabinets — une ligne par structure dans ps-libreacces.
-- ============================================================
CREATE TABLE IF NOT EXISTS CabinetMedecin (
    id_cabinet      INT             NOT NULL AUTO_INCREMENT,
    adresse         VARCHAR(255)    DEFAULT NULL,
    code_postal     VARCHAR(10)     DEFAULT NULL,
    ville           VARCHAR(100)    DEFAULT NULL,
    telephone       VARCHAR(20)     DEFAULT NULL,
    -- Coordonnées GPS pour la carte interactive du choix de médecin.
    -- NULL jusqu'au passage du script de géocodage (backend/database/geocode_cabinets.py).
    latitude        DECIMAL(9,6)    DEFAULT NULL,
    longitude       DECIMAL(9,6)    DEFAULT NULL,
    rpps            CHAR(11)        NOT NULL,
    PRIMARY KEY (id_cabinet),
    INDEX idx_code_postal   (code_postal),
    INDEX idx_ville         (ville),
    INDEX idx_rpps          (rpps),
    INDEX idx_coords        (latitude, longitude),
    CONSTRAINT fk_cabinet_annuaire
        FOREIGN KEY (rpps) REFERENCES MedecinAnnuaire(rpps)
        ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;


-- ============================================================
-- TABLE : Medecin
-- Rôle  : Médecin ayant un compte LabExplain.
--         rpps_saisi : RPPS entré par le médecin à l'inscription.
--         rpps_annuaire : FK vers MedecinAnnuaire.rpps, NULL tant
--           que la vérification n'est pas confirmée.
--         UNIQUE sur rpps_annuaire : un profil annuaire ne peut
--           être lié qu'à un seul compte LabExplain.
-- ============================================================
CREATE TABLE IF NOT EXISTS Medecin (
    id_medecin              INT             NOT NULL AUTO_INCREMENT,
    nom                     VARCHAR(100)    NOT NULL,
    prenom                  VARCHAR(100)    NOT NULL,
    -- Spécialité déclarée par le médecin (avant vérification RPPS)
    id_specialite           INT             DEFAULT NULL,
    -- RPPS saisi à l'inscription — non encore vérifié
    rpps_saisi              CHAR(11)        DEFAULT NULL,
    -- TRUE après confirmation du code envoyé à email_mssante
    rpps_verifie            BOOLEAN         NOT NULL DEFAULT FALSE,
    -- Token temporaire pour le flux de vérification (effacé après confirmation)
    rpps_token              VARCHAR(64)     DEFAULT NULL,
    rpps_token_expiration   DATETIME        DEFAULT NULL,
    -- Lien vers l'annuaire — NULL tant que rpps_verifie = FALSE
    -- UNIQUE : empêche deux comptes de revendiquer le même RPPS
    rpps_annuaire           CHAR(11)        DEFAULT NULL UNIQUE,
    id_compte               INT             NOT NULL UNIQUE,
    PRIMARY KEY (id_medecin),
    INDEX idx_rpps_saisi    (rpps_saisi),
    INDEX idx_rpps_verifie  (rpps_verifie),
    CONSTRAINT fk_medecin_compte
        FOREIGN KEY (id_compte) REFERENCES Compte(id_compte)
        ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_medecin_annuaire
        FOREIGN KEY (rpps_annuaire) REFERENCES MedecinAnnuaire(rpps)
        ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT fk_medecin_specialite
        FOREIGN KEY (id_specialite) REFERENCES Specialite(id_specialite)
        ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;


-- ============================================================
-- TABLE : RendezVous
-- Rôle  : Déclaration par le patient d'un rendez-vous médical à venir.
--         Volontairement déclaratif et non transactionnel : le patient
--         indique lui-même la date, l'heure et le médecin (choisi sur
--         la carte des cabinets via MedecinAnnuaire), sans validation
--         ni notification du médecin. Cela évite tout spam vers des
--         médecins qui n'ont pas le temps de gérer un agenda numérique,
--         et respecte le principe RGPD de minimisation : aucune donnée
--         n'est transmise au médecin sans action explicite du patient
--         (export/partage du document de préparation, en dehors de
--         ce système).
--         rpps_medecin référence MedecinAnnuaire et non Medecin.id_medecin,
--         car le médecin choisi par le patient n'a généralement pas de
--         compte LabExplain (c'est un médecin de l'annuaire ANS).
-- ============================================================
CREATE TABLE IF NOT EXISTS RendezVous (
    id_rendezvous   INT             NOT NULL AUTO_INCREMENT,
    date_heure      DATETIME        NOT NULL,
    -- Nom/spécialité dupliqués en clair au moment de la création :
    -- le patient doit pouvoir consulter son rendez-vous même si la
    -- ligne MedecinAnnuaire correspondante disparaît un jour (mise à
    -- jour de l'annuaire ANS). Cohérent avec le choix déjà fait pour
    -- Consultation (données non sensibles conservées en clair).
    medecin_nom         VARCHAR(100)    NOT NULL,
    medecin_prenom      VARCHAR(100)    NOT NULL,
    medecin_specialite  VARCHAR(150)    DEFAULT NULL,
    lieu                VARCHAR(255)    DEFAULT NULL,
    statut          ENUM('a_venir', 'passe', 'annule') NOT NULL DEFAULT 'a_venir',
    rpps_medecin    CHAR(11)        DEFAULT NULL,
    id_cabinet      INT             DEFAULT NULL,
    id_patient      INT             NOT NULL,
    created_at      TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id_rendezvous),
    INDEX idx_patient       (id_patient),
    INDEX idx_date_heure    (date_heure),
    INDEX idx_statut        (statut),
    CONSTRAINT fk_rendezvous_patient
        FOREIGN KEY (id_patient) REFERENCES Patient(id_patient)
        ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_rendezvous_annuaire
        FOREIGN KEY (rpps_medecin) REFERENCES MedecinAnnuaire(rpps)
        ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT fk_rendezvous_cabinet
        FOREIGN KEY (id_cabinet) REFERENCES CabinetMedecin(id_cabinet)
        ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;


-- ============================================================
-- TABLE : Consultation
-- Rôle  : Séance de préparation patient ↔ médecin.
--         Données du chatbot conservées en clair (non médicalement
--         sensibles au sens strict — pas de diagnostics).
--         Données chiffrées → QuestionnairePreparation, SyntheseIA.
--         statut en ENUM pour garantir la cohérence (1NF).
--         id_rendezvous : lien optionnel vers le rendez-vous que cette
--         consultation prépare. NULL si la préparation est faite sans
--         rendez-vous déclaré au préalable.
-- ============================================================
CREATE TABLE IF NOT EXISTS Consultation (
    id_consultation         INT             NOT NULL AUTO_INCREMENT,
    date_heure              DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    statut                  ENUM('draft', 'sent', 'reviewed', 'archived') NOT NULL DEFAULT 'draft',
    langue                  VARCHAR(10)     NOT NULL DEFAULT 'fr',
    symptomes               TEXT            DEFAULT NULL,
    historique_medical      TEXT            DEFAULT NULL,
    traitements_actuels     TEXT            DEFAULT NULL,
    niveau_douleur          TINYINT UNSIGNED DEFAULT NULL,
    notes_complementaires   TEXT            DEFAULT NULL,
    id_medecin              INT             DEFAULT NULL,
    id_patient              INT             NOT NULL,
    id_rendezvous           INT             DEFAULT NULL,
    PRIMARY KEY (id_consultation),
    INDEX idx_patient       (id_patient),
    INDEX idx_medecin       (id_medecin),
    INDEX idx_statut        (statut),
    INDEX idx_rendezvous    (id_rendezvous),
    CONSTRAINT fk_consultation_medecin
        FOREIGN KEY (id_medecin) REFERENCES Medecin(id_medecin)
        ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT fk_consultation_patient
        FOREIGN KEY (id_patient) REFERENCES Patient(id_patient)
        ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_consultation_rendezvous
        FOREIGN KEY (id_rendezvous) REFERENCES RendezVous(id_rendezvous)
        ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT chk_niveau_douleur
        CHECK (niveau_douleur IS NULL OR niveau_douleur BETWEEN 0 AND 10)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;


-- ============================================================
-- TABLE : QuestionnairePreparation
-- Rôle  : Réponses détaillées du chatbot, chiffrées.
--         JSON chiffré AES-256-GCM, même format que DonneesPatient.
--         Une consultation → au plus un questionnaire (UNIQUE).
-- ============================================================
CREATE TABLE IF NOT EXISTS QuestionnairePreparation (
    id_questionnaire    INT         NOT NULL AUTO_INCREMENT,
    date_soumission     DATETIME    DEFAULT CURRENT_TIMESTAMP,
    donnees_brutes_enc  TEXT        NOT NULL,
    id_consultation     INT         NOT NULL UNIQUE,
    PRIMARY KEY (id_questionnaire),
    CONSTRAINT fk_questionnaire_consultation
        FOREIGN KEY (id_consultation) REFERENCES Consultation(id_consultation)
        ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;


-- ============================================================
-- TABLE : SyntheseIA
-- Rôle  : Résumé et questions générés par le module IA.
--         resume_enc / questions_enc chiffrés avec la clé du patient.
--         modele_ia_utilise conservé en clair pour les statistiques.
--         Un questionnaire → au plus une synthèse (UNIQUE).
-- ============================================================
CREATE TABLE IF NOT EXISTS SyntheseIA (
    id_synthese         INT             NOT NULL AUTO_INCREMENT,
    motif_principal     VARCHAR(255)    NOT NULL,
    resume_enc          TEXT            DEFAULT NULL,
    questions_enc       TEXT            DEFAULT NULL,
    modele_ia_utilise   VARCHAR(100)    NOT NULL,
    created_at          DATETIME        DEFAULT CURRENT_TIMESTAMP,
    id_questionnaire    INT             NOT NULL UNIQUE,
    PRIMARY KEY (id_synthese),
    CONSTRAINT fk_synthese_questionnaire
        FOREIGN KEY (id_questionnaire) REFERENCES QuestionnairePreparation(id_questionnaire)
        ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;


-- ============================================================
-- TABLE : Prescription
-- Rôle  : Ordonnances liées à une consultation.
--         contenu_enc : JSON chiffré (médicament, posologie, durée).
--         date_emission en clair pour les rappels et le tri.
-- ============================================================
CREATE TABLE IF NOT EXISTS Prescription (
    id_prescription     INT             NOT NULL AUTO_INCREMENT,
    date_emission       DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    statut              ENUM('active', 'terminee', 'annulee') NOT NULL DEFAULT 'active',
    contenu_enc         TEXT            NOT NULL,
    id_consultation     INT             NOT NULL,
    PRIMARY KEY (id_prescription),
    INDEX idx_consultation  (id_consultation),
    INDEX idx_statut        (statut),
    CONSTRAINT fk_prescription_consultation
        FOREIGN KEY (id_consultation) REFERENCES Consultation(id_consultation)
        ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;


-- ============================================================
-- TABLE : Notification
-- Rôle  : Notifications système liées à un compte.
--         Message en clair — pas de données médicales sensibles.
-- ============================================================
CREATE TABLE IF NOT EXISTS Notification (
    id_notification INT             NOT NULL AUTO_INCREMENT,
    type            VARCHAR(50)     NOT NULL,
    message         VARCHAR(500)    NOT NULL,
    lu              BOOLEAN         NOT NULL DEFAULT FALSE,
    created_at      DATETIME        DEFAULT CURRENT_TIMESTAMP,
    id_compte       INT             NOT NULL,
    PRIMARY KEY (id_notification),
    INDEX idx_compte_lu (id_compte, lu),
    CONSTRAINT fk_notification_compte
        FOREIGN KEY (id_compte) REFERENCES Compte(id_compte)
        ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;


-- ============================================================
-- TABLE : TokenRevocation
-- Rôle  : Blacklist JWT pour invalidation anticipée.
--         Index sur revoked_at pour le nettoyage périodique efficace :
--         DELETE WHERE revoked_at < NOW() - INTERVAL 7 DAY
-- ============================================================
CREATE TABLE IF NOT EXISTS TokenRevocation (
    id_token        INT             NOT NULL AUTO_INCREMENT,
    token_hash      VARCHAR(255)    NOT NULL UNIQUE,
    revoked_at      DATETIME        DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id_token),
    INDEX idx_revoked_at (revoked_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;


-- ============================================================
-- VUES
-- ============================================================

-- ------------------------------------------------------------
-- VUE : v_patient_complet
-- ------------------------------------------------------------
CREATE OR REPLACE VIEW v_patient_complet AS
    SELECT
        c.id_compte,
        c.email,
        c.role,
        c.email_verifie,
        c.consent,
        c.consent_date,
        c.created_at,
        p.id_patient,
        p.nom,
        p.prenom,
        p.date_naissance,
        p.gender
    FROM Compte c
    INNER JOIN Patient p ON p.id_compte = c.id_compte;


-- ------------------------------------------------------------
-- VUE : v_medecin_complet
-- Expose le statut de vérification RPPS sans exposer le token.
-- email_mssante issu de MedecinAnnuaire (jamais exposé au frontend).
-- ------------------------------------------------------------
CREATE OR REPLACE VIEW v_medecin_complet AS
    SELECT
        c.id_compte,
        c.email,
        c.role,
        c.email_verifie,
        c.consent,
        c.consent_date,
        c.created_at,
        m.id_medecin,
        m.nom,
        m.prenom,
        m.rpps_saisi,
        m.rpps_verifie,
        m.rpps_annuaire,
        s.libelle           AS specialite,
        ma.civilite,
        ma.telephone        AS telephone_professionnel,
        ma.mode_exercice
    FROM Compte c
    INNER JOIN Medecin m            ON m.id_compte              = c.id_compte
    LEFT  JOIN Specialite s         ON s.id_specialite          = m.id_specialite
    LEFT  JOIN MedecinAnnuaire ma   ON ma.rpps                  = m.rpps_annuaire;


-- ------------------------------------------------------------
-- VUE : v_consultation_detail
-- ------------------------------------------------------------
CREATE OR REPLACE VIEW v_consultation_detail AS
    SELECT
        c.id_consultation,
        c.date_heure,
        c.statut,
        c.langue,
        c.symptomes,
        c.historique_medical,
        c.traitements_actuels,
        c.niveau_douleur,
        c.notes_complementaires,
        c.id_patient,
        p.nom               AS patient_nom,
        p.prenom            AS patient_prenom,
        c.id_medecin,
        m.nom               AS medecin_nom,
        m.prenom            AS medecin_prenom,
        s.libelle           AS medecin_specialite
    FROM Consultation c
    INNER JOIN Patient p        ON p.id_patient     = c.id_patient
    LEFT  JOIN Medecin m        ON m.id_medecin     = c.id_medecin
    LEFT  JOIN Specialite s     ON s.id_specialite  = m.id_specialite;


-- ------------------------------------------------------------
-- VUE : v_synthese_complete
-- ------------------------------------------------------------
CREATE OR REPLACE VIEW v_synthese_complete AS
    SELECT
        si.id_synthese,
        si.motif_principal,
        si.resume_enc,
        si.questions_enc,
        si.modele_ia_utilise,
        si.created_at           AS synthese_created_at,
        qp.id_questionnaire,
        qp.date_soumission,
        co.id_consultation,
        co.date_heure           AS consultation_date,
        co.statut               AS consultation_statut,
        co.langue,
        co.id_patient,
        p.nom                   AS patient_nom,
        p.prenom                AS patient_prenom
    FROM SyntheseIA si
    INNER JOIN QuestionnairePreparation qp  ON qp.id_questionnaire  = si.id_questionnaire
    INNER JOIN Consultation co              ON co.id_consultation   = qp.id_consultation
    INNER JOIN Patient p                    ON p.id_patient         = co.id_patient;


-- ============================================================
-- PROCÉDURE : sp_supprimer_compte
-- Rôle : Suppression RGPD conforme — anonymise avant de supprimer.
-- ============================================================
DROP PROCEDURE IF EXISTS sp_supprimer_compte;

DELIMITER $$

CREATE PROCEDURE sp_supprimer_compte(IN p_id_compte INT)
BEGIN
    DECLARE v_role          VARCHAR(20);
    DECLARE v_id_patient    INT DEFAULT NULL;

    SELECT c.role, p.id_patient
    INTO v_role, v_id_patient
    FROM Compte c
    LEFT JOIN Patient p ON p.id_compte = c.id_compte
    WHERE c.id_compte = p_id_compte;

    IF v_role = 'patient' AND v_id_patient IS NOT NULL THEN
        -- Anonymisation identité
        UPDATE Patient
        SET nom = 'ANONYME', prenom = 'ANONYME',
            date_naissance = NULL, gender = NULL
        WHERE id_patient = v_id_patient;

        -- Effacement données médicales
        UPDATE DonneesPatient
        SET antecedents_enc = NULL, traitements_enc = NULL,
            allergies_enc = NULL, poids_enc = NULL, taille_enc = NULL
        WHERE id_patient = v_id_patient;

        -- Effacement données chiffrées dans les questionnaires
        UPDATE QuestionnairePreparation qp
        INNER JOIN Consultation co ON co.id_consultation = qp.id_consultation
        SET qp.donnees_brutes_enc = NULL
        WHERE co.id_patient = v_id_patient;

        -- Effacement résumés IA
        UPDATE SyntheseIA si
        INNER JOIN QuestionnairePreparation qp ON qp.id_questionnaire = si.id_questionnaire
        INNER JOIN Consultation co             ON co.id_consultation  = qp.id_consultation
        SET si.resume_enc = NULL, si.questions_enc = NULL
        WHERE co.id_patient = v_id_patient;

        -- Effacement prescriptions
        UPDATE Prescription pr
        INNER JOIN Consultation co ON co.id_consultation = pr.id_consultation
        SET pr.contenu_enc = NULL
        WHERE co.id_patient = v_id_patient;
    END IF;

    DELETE FROM Compte WHERE id_compte = p_id_compte;
END$$

DELIMITER ;