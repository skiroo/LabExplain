export type UserRole = "patient" | "medecin";

export type User = {
  nom: string;
  prenom: string;
  email: string;
  password: string;
  role: UserRole;
  antecedents?: string;
  traitements?: string;
  allergies?: string;
  birthdate?: string;
  gender?: "M" | "F" | "O" | string;
  weight?: number;
  height?: number;
  consent: boolean;
};
