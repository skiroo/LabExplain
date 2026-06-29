/*
Fichier : storage.ts
Dossier : src/services/
Description :
  Gère uniquement les préférences locales du frontend LabExplain
  (utilisateur courant en session, langue, police).
  Toutes les données métier (utilisateurs, médecins, consultations,
  rendez-vous) sont désormais gérées exclusivement par le backend Flask.
*/

import type { FontMode, Lang } from "../types/lang";
import type { User } from "../types/user";

export const STORAGE = {
    currentUser: "labexplain_current_user",
    lang: "labexplain_preferred_lang",
    font: "labexplain_preferred_font",
};

export function getCurrentUser(): User | null {
    return JSON.parse(localStorage.getItem(STORAGE.currentUser) || "null");
}

export function setCurrentUser(user: User) {
    localStorage.setItem(STORAGE.currentUser, JSON.stringify(user));
}

export function removeCurrentUser() {
    localStorage.removeItem(STORAGE.currentUser);
}

export function getStoredLang(): Lang {
    return (localStorage.getItem(STORAGE.lang) as Lang) || "fr";
}

export function setStoredLang(lang: Lang) {
    localStorage.setItem(STORAGE.lang, lang);
}

export function getStoredFont(): FontMode {
    return (localStorage.getItem(STORAGE.font) as FontMode) || "standard";
}

export function setStoredFont(font: FontMode) {
    localStorage.setItem(STORAGE.font, font);
}
