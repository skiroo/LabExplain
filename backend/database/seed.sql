-- Fichier : seed.sql
-- Dossier : backend/database/
-- Description :
--     Données de test pour le nouveau schéma RGPD Option B.
--     Les mots de passe sont hashés bcrypt.
--     Les données médicales sont chiffrées (simulées ici avec des placeholders).
--
--     Mot de passe de test pour tous les comptes : "1234"
--     Hash bcrypt correspondant généré avec 12 rounds.

USE defaultdb;

-- ============================================================
-- Comptes d'authentification
-- password_hash = bcrypt("1234", 12)
-- ============================================================
INSERT INTO Compte (email, password_hash, role, email_verifie, consent, consent_date, encryption_salt)
VALUES
    ('patient@test.com',  '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMeSSSmIa2J1A8J5MBp2tqW7Gy', 'patient', TRUE,  TRUE, NOW(), 'salt_demo_patient_001'),
    ('patient2@test.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMeSSSmIa2J1A8J5MBp2tqW7Gy', 'patient', TRUE,  TRUE, NOW(), 'salt_demo_patient_002'),
    ('medecin@test.com',  '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMeSSSmIa2J1A8J5MBp2tqW7Gy', 'medecin', TRUE,  TRUE, NOW(), NULL),
    ('medecin2@test.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMeSSSmIa2J1A8J5MBp2tqW7Gy', 'medecin', FALSE, TRUE, NOW(), NULL);


-- ============================================================
-- Patients (données d'identité pseudonymisées)
-- ============================================================
INSERT INTO Patient (nom, prenom, date_naissance, gender, id_compte)
VALUES
    ('Dupont',  'Jean',   '1990-05-12', 'M', 1),
    ('Martin',  'Sophie', '1985-09-23', 'F', 2);


-- ============================================================
-- Médecins (informations professionnelles)
-- ============================================================
INSERT INTO Medecin (nom, prenom, specialite, id_compte)
VALUES
    ('Bernard',  'Pierre',  'Médecin généraliste', 3),
    ('Leclerc',  'Marie',   'Pédiatre',            4);


-- ============================================================
-- Données médicales chiffrées (placeholders pour les tests)
-- En production ces valeurs seront générées par le backend Python
-- avec AES-256-GCM et la clé dérivée du mot de passe utilisateur.
-- ============================================================
INSERT INTO DonneesPatient (id_patient, antecedents_enc, traitements_enc, allergies_enc, poids_enc, taille_enc)
VALUES
    (1, 'DEMO_ENCRYPTED_asthme',    'DEMO_ENCRYPTED_ventoline', 'DEMO_ENCRYPTED_pollen', 'DEMO_ENCRYPTED_70', 'DEMO_ENCRYPTED_175'),
    (2, 'DEMO_ENCRYPTED_diabete',   'DEMO_ENCRYPTED_metformine', NULL,                    'DEMO_ENCRYPTED_60', 'DEMO_ENCRYPTED_165');


-- ============================================================
-- Consultations
-- ============================================================
INSERT INTO Consultation (date_heure, statut, langue, id_medecin, id_patient)
VALUES
    (NOW(), 'draft', 'fr', 1, 1),
    (NOW(), 'sent',  'fr', 2, 2);