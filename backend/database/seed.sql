-- Fichier : seed.sql
-- Dossier : backend/database/
-- Description :
--     Insère des données de test dans la base de données LabExplain.
--     Ce fichier permet de tester rapidement la connexion, l'inscription,
--     la connexion utilisateur et l'affichage des médecins.


 
USE labexplain_db;
 

INSERT INTO Medecin (nom, prenom, email, specialite) VALUES
    ('Martin',   'Thomas',   'medecin@test.com',         'Médecin généraliste'),
    ('Bernard',  'Sophie',   'sophie.bernard@test.com',  'Cardiologue'),
    ('Leclerc',  'Paul',     'paul.leclerc@test.com',    'Pédiatre');
 

INSERT INTO Patient (nom, prenom, date_naissance) VALUES
    ('Dupont',  'Jean',   '2015-05-12'),
    ('Moreau',  'Claire', '1990-03-22'),
    ('Girard',  'Lucas',  '1985-11-08');
 

INSERT INTO Consultation (date_heure, statut, id_medecin, id_patient) VALUES
    ('2025-05-10 09:00:00', 'terminée',   1, 1),
    ('2025-05-12 14:30:00', 'terminée',   1, 2),
    ('2025-05-20 10:00:00', 'planifiée',  2, 3),
    ('2025-05-22 11:15:00', 'planifiée',  3, 1);
 

INSERT INTO QuestionnairePreparation (date_soumission, donnees_brutes, id_consultation) VALUES
(
    '2025-05-09 18:00:00',
    '{
        "symptomes": ["toux", "fièvre", "difficultés respiratoires"],
        "duree": "5 jours",
        "intensite": "modérée",
        "antecedents": "Asthme",
        "traitements_en_cours": "Ventoline",
        "allergies": "Pollen"
    }',
    1
),
(
    '2025-05-11 20:30:00',
    '{
        "symptomes": ["fatigue", "douleurs thoraciques", "essoufflement"],
        "duree": "2 semaines",
        "intensite": "élevée",
        "antecedents": "Hypertension",
        "traitements_en_cours": "Amlodipine",
        "allergies": "Aucune"
    }',
    2
),
(
    '2025-05-19 17:00:00',
    '{
        "symptomes": ["maux de tête", "nausées", "vision floue"],
        "duree": "3 jours",
        "intensite": "modérée",
        "antecedents": "Aucun",
        "traitements_en_cours": "Aucun",
        "allergies": "Pénicilline"
    }',
    3
);
 

INSERT INTO SyntheseIA (motif_principal, symptomes_cles, questions_patient, modele_ia_utilise, id_questionnaire) VALUES
(
    'Syndrome respiratoire avec fièvre chez un enfant asthmatique',
    '["toux persistante", "fièvre à 38.5°C", "difficultés respiratoires"]',
    '["La Ventoline est-elle toujours efficace ?", "L''asthme est-il bien contrôlé ?", "Y a-t-il des signes de surinfection ?"]',
    'BioMistral-7B-test',
    1
),
(
    'Douleurs thoraciques avec essoufflement chez une patiente hypertendue',
    '["douleurs thoraciques", "essoufflement à l''effort", "fatigue inhabituelle"]',
    '["Les douleurs irradient-elles vers le bras gauche ?", "L''hypertension est-elle bien contrôlée ?", "Un ECG récent a-t-il été réalisé ?"]',
    'BioMistral-7B-test',
    2
);
