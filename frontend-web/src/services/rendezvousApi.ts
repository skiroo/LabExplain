/*
Fichier : rendezvousApi.ts
Dossier : src/services/
Description :
  Contient les appels API liés aux rendez-vous déclarés par le patient
  et à la recherche de cabinets médicaux géolocalisés (carte interactive).
*/

import { apiGet, apiPost, apiDelete } from "./api";
import { getStoredLang } from "./storage";
import { t } from "../i18n";
import type { Cabinet, RendezVous } from "../types/chat";

export async function searchCabinetsNear(
  lat: number,
  lng: number,
  query: string = ""
): Promise<Cabinet[]> {
  try {
    const params = new URLSearchParams({ lat: String(lat), lng: String(lng) });
    if (query.trim()) params.set("q", query.trim());

    const response = await apiGet<Cabinet[]>(`/doctors/map?${params.toString()}`);

    if (!response.success || !response.data) return [];
    return response.data;
  } catch (error) {
    console.error(t(getStoredLang(), "rendezvousService.searchCabinetsError"), error);
    return [];
  }
}

export async function getUpcomingRendezVous(): Promise<RendezVous[]> {
  try {
    const response = await apiGet<RendezVous[]>("/rendezvous/upcoming");
    if (!response.success || !response.data) return [];
    return response.data;
  } catch (error) {
    console.error(t(getStoredLang(), "rendezvousService.fetchUpcomingError"), error);
    return [];
  }
}

export async function getAllRendezVous(): Promise<RendezVous[]> {
  try {
    const response = await apiGet<RendezVous[]>("/rendezvous/");
    if (!response.success || !response.data) return [];
    return response.data;
  } catch (error) {
    console.error(t(getStoredLang(), "rendezvousService.fetchAllError"), error);
    return [];
  }
}

export type CreateRendezVousPayload = {
  date_heure: string;
  medecin_nom: string;
  medecin_prenom: string;
  medecin_specialite?: string;
  lieu?: string;
  rpps_medecin?: string;
  id_cabinet?: number;
};

export async function createRendezVous(
  payload: CreateRendezVousPayload
): Promise<RendezVous | null> {
  try {
    const response = await apiPost<RendezVous>("/rendezvous/", payload);
    if (!response.success || !response.data) return null;
    return response.data;
  } catch (error) {
    console.error(t(getStoredLang(), "rendezvousService.createError"), error);
    return null;
  }
}

export async function deleteRendezVous(id: number): Promise<boolean> {
  try {
    const response = await apiDelete(`/rendezvous/${id}`);
    return response.success;
  } catch (error) {
    console.error(t(getStoredLang(), "rendezvousService.deleteError"), error);
    return false;
  }
}
