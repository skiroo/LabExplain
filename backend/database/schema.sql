-- Fichier : schema.sql
-- Dossier : backend/database/
-- Description :
--     Schéma LabExplain — Option B RGPD
--     Séparation stricte entre données d'authentification (en clair),
--     données d'identité (pseudonymisées) et données médicales (chiffrées AES-256).
--     La clé de chiffrement des données médicales est dérivée du mot de passe
--     utilisateur via PBKDF2 — la base ne contient jamais cette clé.

USE defaultdb;


-- ============================================================
-- TABLE : Compte
-- Rôle  : Authentification uniquement.
--         Contient les credentials et le statut de vérification email.
--         Ne contient aucune donnée médicale ni personnelle sensible.
-- ============================================================
CREATE TABLE IF NOT EXISTS Compte (
    id_compte           INT             NOT NULL AUTO_INCREMENT,
    email               VARCHAR(255)    NOT NULL UNIQUE,
    -- Mot de passe hashé bcrypt (jamais en clair)
    password_hash       VARCHAR(255)    NOT NULL,
    role                ENUM('patient', 'medecin') NOT NULL DEFAULT 'patient',
    -- Vérification email
    email_verifie       BOOLEAN         NOT NULL DEFAULT FALSE,
    token_verification  VARCHAR(255)    DEFAULT NULL,
    token_expiration    DATETIME        DEFAULT NULL,
    -- Consentement RGPD — horodaté
    consent             BOOLEAN         NOT NULL DEFAULT FALSE,
    consent_date        DATETIME        DEFAULT NULL,
    -- Sel utilisé pour dériver la clé de chiffrement des données médicales (PBKDF2)
    -- Stocké ici car nécessaire au déchiffrement, mais inutilisable sans le mot de passe
    encryption_salt     VARCHAR(64)     DEFAULT NULL,
    created_at          TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id_compte)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;


-- ============================================================
-- TABLE : Patient
-- Rôle  : Données d'identité pseudonymisées.
--         Séparées des credentials pour limiter l'exposition en cas de fuite.
-- ============================================================
CREATE TABLE IF NOT EXISTS Patient (
    id_patient      INT             NOT NULL AUTO_INCREMENT,
    nom             VARCHAR(100)    NOT NULL,
    prenom          VARCHAR(100)    NOT NULL,
    date_naissance  DATE            DEFAULT NULL,
    gender          VARCHAR(20)     DEFAULT NULL,
    -- Référence vers le compte d'authentification
    id_compte       INT             NOT NULL UNIQUE,
    PRIMARY KEY (id_patient),
    CONSTRAINT fk_patient_compte
        FOREIGN KEY (id_compte) REFERENCES Compte(id_compte)
        ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;


-- ============================================================
-- TABLE : DonneesPatient
-- Rôle  : Données médicales sensibles chiffrées.
--         Chaque champ est chiffré individuellement avec AES-256-GCM.
--         La clé est dérivée du mot de passe utilisateur (PBKDF2-SHA256).
--         Sans le mot de passe, ces données sont illisibles — même pour nous.
-- ============================================================
CREATE TABLE IF NOT EXISTS DonneesPatient (
    id_donnees          INT             NOT NULL AUTO_INCREMENT,
    -- Données chiffrées — format : base64(iv + tag + ciphertext)
    antecedents_enc     TEXT            DEFAULT NULL,
    traitements_enc     TEXT            DEFAULT NULL,
    allergies_enc       TEXT            DEFAULT NULL,
    poids_enc           TEXT            DEFAULT NULL,
    taille_enc          TEXT            DEFAULT NULL,
    -- Vecteur d'initialisation propre à chaque champ (stocké avec la donnée)
    -- Le format base64 inclut déjà l'IV en préfixe
    updated_at          TIMESTAMP       DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    id_patient          INT             NOT NULL UNIQUE,
    PRIMARY KEY (id_donnees),
    CONSTRAINT fk_donnees_patient
        FOREIGN KEY (id_patient) REFERENCES Patient(id_patient)
        ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;


-- ============================================================
-- TABLE : Medecin
-- Rôle  : Informations professionnelles du médecin.
--         Pas de données médicales — le médecin n'est pas patient.
-- ============================================================
CREATE TABLE IF NOT EXISTS Medecin (
    id_medecin      INT             NOT NULL AUTO_INCREMENT,
    nom             VARCHAR(100)    NOT NULL,
    prenom          VARCHAR(100)    NOT NULL,
    specialite      VARCHAR(150)    DEFAULT NULL,
    -- Lien optionnel vers l'annuaire AMELI
    id_annuaire     INT             DEFAULT NULL,
    id_compte       INT             NOT NULL UNIQUE,
    PRIMARY KEY (id_medecin),
    CONSTRAINT fk_medecin_compte
        FOREIGN KEY (id_compte) REFERENCES Compte(id_compte)
        ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;


-- ============================================================
-- TABLE : MedecinAnnuaire
-- Rôle  : Référentiel des médecins issus de l'annuaire AMELI
--         (data.gouv.fr — open data gouvernemental).
--         Ces médecins n'ont pas nécessairement de compte LabExplain.
--         Utilisé pour la recherche de médecin dans le chatbot.
-- ============================================================
CREATE TABLE IF NOT EXISTS MedecinAnnuaire (
    id_annuaire             INT             NOT NULL AUTO_INCREMENT,
    nom                     VARCHAR(100)    NOT NULL,
    prenom                  VARCHAR(100)    NOT NULL,
    civilite                VARCHAR(10)     DEFAULT NULL,
    specialite              VARCHAR(150)    DEFAULT NULL,
    adresse                 VARCHAR(255)    DEFAULT NULL,
    code_postal             VARCHAR(10)     DEFAULT NULL,
    ville                   VARCHAR(100)    DEFAULT NULL,
    telephone               VARCHAR(20)     DEFAULT NULL,
    email                   VARCHAR(255)    DEFAULT NULL,
    secteur_conventionnel   VARCHAR(100)    DEFAULT NULL,
    nature_exercice         VARCHAR(100)    DEFAULT NULL,
    -- Lien optionnel vers un compte LabExplain actif
    id_compte_labexplain    INT             DEFAULT NULL,
    PRIMARY KEY (id_annuaire),
    INDEX idx_ville         (ville),
    INDEX idx_code_postal   (code_postal),
    INDEX idx_specialite    (specialite(50)),
    INDEX idx_nom_prenom    (nom, prenom),
    CONSTRAINT fk_annuaire_medecin
        FOREIGN KEY (id_compte_labexplain) REFERENCES Medecin(id_medecin)
        ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;


-- ============================================================
-- TABLE : Consultation
-- Rôle  : Lien entre un patient et un médecin pour une séance.
-- ============================================================
CREATE TABLE IF NOT EXISTS Consultation (
    id_consultation     INT             NOT NULL AUTO_INCREMENT,
    date_heure          DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    statut              VARCHAR(50)     DEFAULT 'draft',
    langue              VARCHAR(10)     DEFAULT 'fr',
    id_medecin          INT             DEFAULT NULL,
    id_patient          INT             NOT NULL,
    PRIMARY KEY (id_consultation),
    CONSTRAINT fk_consultation_medecin
        FOREIGN KEY (id_medecin) REFERENCES Medecin(id_medecin)
        ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT fk_consultation_patient
        FOREIGN KEY (id_patient) REFERENCES Patient(id_patient)
        ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;


-- ============================================================
-- TABLE : QuestionnairePreparation
-- Rôle  : Réponses brutes du chatbot, chiffrées.
--         donnees_brutes contient un JSON chiffré avec la clé du patient.
-- ============================================================
CREATE TABLE IF NOT EXISTS QuestionnairePreparation (
    id_questionnaire    INT         NOT NULL AUTO_INCREMENT,
    date_soumission     DATETIME    DEFAULT CURRENT_TIMESTAMP,
    -- JSON chiffré — format identique à DonneesPatient (base64 iv+tag+ciphertext)
    donnees_brutes_enc  TEXT        NOT NULL,
    id_consultation     INT         NOT NULL,
    PRIMARY KEY (id_questionnaire),
    CONSTRAINT fk_questionnaire_consultation
        FOREIGN KEY (id_consultation) REFERENCES Consultation(id_consultation)
        ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;


-- ============================================================
-- TABLE : SyntheseIA
-- Rôle  : Résultat généré par le module IA.
--         resume_enc et questions_enc sont chiffrés avec la clé du patient.
-- ============================================================
CREATE TABLE IF NOT EXISTS SyntheseIA (
    id_synthese         INT             NOT NULL AUTO_INCREMENT,
    motif_principal     VARCHAR(255)    NOT NULL,
    -- Données chiffrées
    resume_enc          TEXT            DEFAULT NULL,
    questions_enc       TEXT            DEFAULT NULL,
    -- Métadonnées non sensibles — utiles pour les stats sans exposer le contenu
    modele_ia_utilise   VARCHAR(100)    NOT NULL,
    created_at          DATETIME        DEFAULT CURRENT_TIMESTAMP,
    id_questionnaire    INT             NOT NULL,
    PRIMARY KEY (id_synthese),
    CONSTRAINT fk_synthese_questionnaire
        FOREIGN KEY (id_questionnaire) REFERENCES QuestionnairePreparation(id_questionnaire)
        ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;


-- ============================================================
-- TABLE : TokenRevocation
-- Rôle  : Stocke les tokens révoqués (déconnexion, suppression compte).
--         Permet d'invalider un token avant son expiration naturelle.
-- ============================================================
CREATE TABLE IF NOT EXISTS TokenRevocation (
    id_token        INT             NOT NULL AUTO_INCREMENT,
    token_hash      VARCHAR(255)    NOT NULL UNIQUE,
    revoked_at      DATETIME        DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id_token)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;