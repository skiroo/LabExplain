export type UserRole = "patient" | "medecin";

export type User = {
    // Identifiant central du nouveau schéma
    id_compte?:      number;
    // Identifiants spécifiques
    id_patient?:     number;
    id_medecin?:     number;

    email:           string;
    password?:       string;
    role:            UserRole;
    email_verifie?:  boolean;
    consent:         boolean;
    consent_date?:   string;
    created_at?:     string;

    // Identité (table Patient / Medecin)
    nom:             string;
    prenom:          string;
    date_naissance?: string;
    birthdate?:      string;
    gender?:         "M" | "F" | "O" | string;
    specialite?:     string;

    // Informations médicales patient (formulaire d'inscription)
    weight?:         number;
    height?:         number;
    antecedents?:    string;
    traitements?:    string;
    allergies?:      string;

    // Indicateur - les données médicales existent en base (chiffrées)
    has_medical_data?: boolean;
};
