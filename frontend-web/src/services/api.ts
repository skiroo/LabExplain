/*
Fichier : api.ts
Dossier : src/services/
Description :
  Centralise les appels HTTP vers le backend Flask de LabExplain.
  Envoie automatiquement le token et X-User-Id (= id_compte) dans chaque requête.
*/

const API_URL = "http://127.0.0.1:5000/api";

export type ApiResponse<T> = {
    success: boolean;
    message: string;
    data?: T;
};

function getUserId(): string | null {
    try {
        const raw = localStorage.getItem("labexplain_current_user");
        if (!raw) return null;
        const user = JSON.parse(raw);
        // Nouveau schéma : id_compte est la clé d'authentification centrale
        return user?.id_compte ? String(user.id_compte) : null;
    } catch {
        return null;
    }
}

async function request<T>(
    endpoint: string,
    options: RequestInit = {}
): Promise<ApiResponse<T>> {
    const token   = localStorage.getItem("labexplain_token");
    const userId  = getUserId();

    const response = await fetch(`${API_URL}${endpoint}`, {
        ...options,
        headers: {
            "Content-Type": "application/json",
            ...(token  ? { Authorization: `Bearer ${token}` } : {}),
            ...(userId ? { "X-User-Id": userId }              : {}),
            ...options.headers,
        },
    });

    const result = await response.json();

    if (!response.ok) {
        throw new Error(result.message || "Erreur lors de la requête API");
    }

    return result;
}

export async function apiGet<T>(endpoint: string): Promise<ApiResponse<T>> {
    return request<T>(endpoint, { method: "GET" });
}

export async function apiPost<T>(endpoint: string, data: unknown): Promise<ApiResponse<T>> {
    return request<T>(endpoint, { method: "POST", body: JSON.stringify(data) });
}

export async function apiPut<T>(endpoint: string, data: unknown): Promise<ApiResponse<T>> {
    return request<T>(endpoint, { method: "PUT", body: JSON.stringify(data) });
}

export async function apiDelete<T>(endpoint: string): Promise<ApiResponse<T>> {
    return request<T>(endpoint, { method: "DELETE" });
}
