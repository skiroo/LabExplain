/*
Fichier : doctorApi.ts
Dossier : src/services/
Description :
  Contient les appels API liés aux médecins.
  Ces fonctions récupèrent les médecins depuis le backend Flask.
*/

import { apiGet } from "./api";
import { getStoredLang } from "./storage";
import { t } from "../i18n";
import type { User } from "../types/user";

export async function getDoctors(): Promise<User[]> {
  try {
    const response = await apiGet<User[]>("/doctors/");

    if (!response.success || !response.data) {
      return [];
    }

    return response.data;
  } catch (error) {
    console.error(t(getStoredLang(), "doctorService.fetchDoctorsError"), error);
    return [];
  }
}
