/*
Fichier : auth.ts
Dossier : src/services/
Description :
  Contient les fonctions d'authentification du frontend LabExplain.
  Ces fonctions appellent le backend Flask pour connecter ou inscrire un utilisateur.
*/

import { removeCurrentUser, setCurrentUser } from "./storage";
import { apiPost } from "./api";
import type { User } from "../types/user";

type LoginResponse = {
  token: string;
  user: User;
};

export async function loginUser(
  email: string,
  password: string
): Promise<User | null> {
  const cleanEmail = email.trim().toLowerCase();

  try {
    // Envoie les identifiants au backend Flask
    const response = await apiPost<LoginResponse>("/auth/login", {
      email: cleanEmail,
      password,
    });

    if (!response.success || !response.data) {
      return null;
    }

    // Stocke l'utilisateur connecté côté frontend
    setCurrentUser(response.data.user);
    localStorage.setItem("labexplain_token", response.data.token);

    return response.data.user;
  } catch (error) {
    console.error("Erreur login :", error);
    return null;
  }
}

export async function registerUser(
  newUser: User
): Promise<{ success: boolean; message?: string }> {
  try {
    // Envoie les informations d'inscription au backend Flask
    const response = await apiPost<User>("/auth/register", newUser);

    if (!response.success) {
      return {
        success: false,
        message: response.message || "Erreur lors de l'inscription.",
      };
    }

    return { success: true };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Erreur lors de l'inscription.";

    return {
      success: false,
      message,
    };
  }
}

export function logoutUser() {
  removeCurrentUser();
  localStorage.removeItem("labexplain_token");
}