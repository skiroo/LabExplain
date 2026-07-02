/*
Fichier : auth.ts
Dossier : src/services/
Description :
  Fonctions d'authentification - nouveau schéma RGPD Option B.
  - loginUser  : connexion + stockage id_compte dans localStorage
  - registerUser : inscription (renvoie vers page d'attente email)
  - logoutUser : appelle POST /api/auth/logout puis nettoie le localStorage
  - confirmEmail : valide le token depuis l'URL de confirmation
*/

import { removeCurrentUser, setCurrentUser, getStoredLang } from "./storage";
import { apiPost, apiGet } from "./api";
import { t } from "../i18n";
import type { User } from "../types/user";

type LoginResponse = {
    token: string;
    user:  User;
};

type ConfirmResponse = {
    email: string;
    role:  string;
};

export async function loginUser(
    email: string,
    password: string
): Promise<{ user: User | null; message?: string }> {
    const cleanEmail = email.trim().toLowerCase();

    try {
        const response = await apiPost<LoginResponse>("/auth/login", {
            email: cleanEmail,
            password,
        });

        if (!response.success || !response.data) {
            return { user: null, message: response.message };
        }

        // Stocke l'utilisateur complet - id_compte est inclus dans user
        setCurrentUser(response.data.user);
        localStorage.setItem("labexplain_token", response.data.token);

        return { user: response.data.user };
    } catch (error) {
        const message = error instanceof Error ? error.message : t(getStoredLang(), "authService.badLogin");
        return { user: null, message };
    }
}

export async function registerUser(
    newUser: User & { specialite?: string }
): Promise<{ success: boolean; message?: string }> {
    try {
        const response = await apiPost<User>("/auth/register", newUser);

        if (!response.success) {
            return {
                success: false,
                message: response.message || t(getStoredLang(), "authService.registerError"),
            };
        }

        return { success: true };
    } catch (error) {
        const message = error instanceof Error ? error.message : t(getStoredLang(), "authService.registerError");
        return { success: false, message };
    }
}

export async function logoutUser(): Promise<void> {
    try {
        // Notifie le backend - déclenche l'email de déconnexion
        await apiPost("/auth/logout", {});
    } catch {
        // Silencieux - on nettoie le localStorage de toute façon
    }
    removeCurrentUser();
    localStorage.removeItem("labexplain_token");
}

export async function confirmEmail(
    token: string
): Promise<{ success: boolean; message?: string; email?: string }> {
    try {
        const response = await apiGet<ConfirmResponse>(
            `/auth/confirm-email?token=${encodeURIComponent(token)}`
        );

        if (!response.success) {
            return { success: false, message: response.message };
        }

        return {
            success: true,
            email:   response.data?.email,
            message: response.message,
        };
    } catch (error) {
        const message = error instanceof Error ? error.message : t(getStoredLang(), "authService.confirmEmailError");
        return { success: false, message };
    }
}
