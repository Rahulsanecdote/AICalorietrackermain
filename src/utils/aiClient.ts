import { API_CONFIG } from "../constants"

function buildAuthHeaders(): Record<string, string> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  }

  const authToken = import.meta.env.VITE_API_AUTH_TOKEN
  if (authToken) {
    headers.Authorization = `Bearer ${authToken}`
  }

  return headers
}

export function postAIChat(body: Record<string, unknown>, options?: { signal?: AbortSignal }) {
  return fetch(API_CONFIG.AI_PROXY_URL, {
    method: "POST",
    headers: buildAuthHeaders(),
    body: JSON.stringify(body),
    signal: options?.signal,
  })
}

export function getAIHealth(options?: { signal?: AbortSignal }) {
  return fetch(API_CONFIG.AI_HEALTH_URL, {
    method: "GET",
    headers: buildAuthHeaders(),
    signal: options?.signal,
  })
}
