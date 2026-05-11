import type { User } from "../types/user";

export const demoUsers: User[] = [
  {
    nom: "Dupont",
    prenom: "Jean",
    email: "patient@test.com",
    password: "1235",
    role: "patient",
    antecedents: "Asthme",
    traitements: "Ventoline",
    allergies: "Pollen",
    birthdate: "2015-05-12",
    gender: "M",
    weight: 35,
    height: 140,
    consent: true,
  },
  {
    nom: "Martin",
    prenom: "Dr",
    email: "medecin@test.com",
    password: "1234",
    role: "medecin",
    consent: true,
  },
];
