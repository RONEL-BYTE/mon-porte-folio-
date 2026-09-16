import { apiFetch } from "./api";

export async function getProfile() {
  const response = await apiFetch("/api/profile");

  if (!response.ok) {
    throw new Error("Impossible de récupérer le profil");
  }

  return await response.json();
}