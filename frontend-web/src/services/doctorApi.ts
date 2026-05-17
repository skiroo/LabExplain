/*
Fichier : doctorApi.ts
Dossier : src/services/
Description :
  Contient les appels API liés aux médecins.
  Ces fonctions récupèrent les médecins depuis le backend Flask.
*/

import { apiGet } from "./api";
import type { User } from "../types/user";

export async function getDoctors(): Promise<User[]> {
  try {
    const response = await apiGet<User[]>("/doctors/");

    if (!response.success || !response.data) {
      return [];
    }

    return response.data;
  } catch (error) {
    console.error("Erreur récupération médecins :", error);
    return [];
  }
}