-- Fichier : schema.sql
-- Dossier : backend/database/
-- Description :
--     Crée la base de données MySQL de LabExplain ainsi que les tables principales.
--     Ce fichier définit la structure des données utilisées par le backend Flask.

CREATE DATABASE IF NOT EXISTS labexplain_db
    CHARACTER SET utf8mb4
    COLLATE utf8mb4_unicode_ci;
 
USE labexplain_db;
 

CREATE TABLE IF NOT EXISTS Medecin (
    id_medecin  INT             NOT NULL AUTO_INCREMENT,
    nom         VARCHAR(100)    NOT NULL,
    prenom      VARCHAR(100)    NOT NULL,
    email       VARCHAR(255)    NOT NULL UNIQUE,
    specialite  VARCHAR(150),
    PRIMARY KEY (id_medecin)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4; -- encodeur pour accepter les caractères spéciaux 
 

CREATE TABLE IF NOT EXISTS Patient (
    id_patient      INT             NOT NULL AUTO_INCREMENT,
    nom             VARCHAR(100)    NOT NULL,
    prenom          VARCHAR(100)    NOT NULL,
    date_naissance  DATE            NOT NULL,
    PRIMARY KEY (id_patient)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
 

CREATE TABLE IF NOT EXISTS Consultation (
    id_consultation INT             NOT NULL AUTO_INCREMENT,
    date_heure      DATETIME        NOT NULL,
    statut          VARCHAR(50),
    id_medecin      INT             NOT NULL,
    id_patient      INT             NOT NULL,
    PRIMARY KEY (id_consultation),
    CONSTRAINT fk_consultation_medecin
        FOREIGN KEY (id_medecin) REFERENCES Medecin(id_medecin)
        ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT fk_consultation_patient
        FOREIGN KEY (id_patient) REFERENCES Patient(id_patient)
        ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
 

CREATE TABLE IF NOT EXISTS QuestionnairePreparation (
    id_questionnaire    INT         NOT NULL AUTO_INCREMENT,
    date_soumission     DATETIME,
    donnees_brutes      JSON        NOT NULL,
    id_consultation     INT         NOT NULL,
    PRIMARY KEY (id_questionnaire),
    CONSTRAINT fk_questionnaire_consultation
        FOREIGN KEY (id_consultation) REFERENCES Consultation(id_consultation)
        ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
 

CREATE TABLE IF NOT EXISTS SyntheseIA (
    id_synthese         INT             NOT NULL AUTO_INCREMENT,
    motif_principal     VARCHAR(255)    NOT NULL,
    symptomes_cles      JSON            NOT NULL,
    questions_patient   JSON            NOT NULL,
    modele_ia_utilise   VARCHAR(100)    NOT NULL,
    id_questionnaire    INT             NOT NULL,
    PRIMARY KEY (id_synthese),
    CONSTRAINT fk_synthese_questionnaire
        FOREIGN KEY (id_questionnaire) REFERENCES QuestionnairePreparation(id_questionnaire)
        ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
