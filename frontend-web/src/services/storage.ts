import { demoUsers } from "../data/demoUsers";
import type { FontMode, Lang } from "../types/lang";
import type { User } from "../types/user";

export const STORAGE = {
  users: "labexplain_users",
  currentUser: "labexplain_current_user",
  drafts: "labexplain_drafts",
  sentForms: "labexplain_sent_forms",
  lang: "labexplain_preferred_lang",
  font: "labexplain_preferred_font",
};

export function getUsers(): User[] {
  return JSON.parse(localStorage.getItem(STORAGE.users) || "[]");
}

export function setUsers(users: User[]) {
  localStorage.setItem(STORAGE.users, JSON.stringify(users));
}

export function seedUsers() {
  if (getUsers().length === 0) {
    setUsers(demoUsers);
  }
}

export function getCurrentUser(): User | null {
  return JSON.parse(localStorage.getItem(STORAGE.currentUser) || "null");
}

export function setCurrentUser(user: User) {
  localStorage.setItem(STORAGE.currentUser, JSON.stringify(user));
}

export function removeCurrentUser() {
  localStorage.removeItem(STORAGE.currentUser);
}

export function getDoctors(): User[] {
  return getUsers().filter((user) => user.role === "medecin");
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
