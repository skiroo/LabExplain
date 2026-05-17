/*
Fichier : api.ts
Dossier : src/services/
Description :
  Centralise les appels HTTP vers le backend Flask de LabExplain.
  Ce fichier permet au frontend web de communiquer avec l'API partagée web/mobile.
*/

const API_URL = "http://127.0.0.1:5000/api";

export type ApiResponse<T> = {
  success: boolean;
  message: string;
  data?: T;
};

async function request<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  const response = await fetch(`${API_URL}${endpoint}`, {
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
    ...options,
  });

  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.message || "Erreur lors de la requête API");
  }

  return result;
}

export async function apiGet<T>(endpoint: string): Promise<ApiResponse<T>> {
  return request<T>(endpoint, {
    method: "GET",
  });
}

export async function apiPost<T>(
  endpoint: string,
  data: unknown
): Promise<ApiResponse<T>> {
  return request<T>(endpoint, {
    method: "POST",
    body: JSON.stringify(data),
  });
}