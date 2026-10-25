export const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || "").replace(/\/+$/, "");

export function getStoredToken() {
  return sessionStorage.getItem("token") || null;
}

export function setStoredToken(token) {
  if (token) {
    sessionStorage.setItem("token", token);
  } else {
    sessionStorage.removeItem("token");
    sessionStorage.removeItem("future-akshitha:current-user");
  }
}

export async function apiRequest(endpoint, options = {}) {
  const token = getStoredToken();

  const headers = {
    ...(options.body && !(options.body instanceof FormData)
      ? { "Content-Type": "application/json" }
      : {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    let message = `Request failed: ${response.status}`;

    try {
      const data = await response.json();
      message = data.message || message;
    } catch {
      // Keep the default error message if the response isn't JSON.
    }

    if (response.status === 401) {
      setStoredToken(null);
      sessionStorage.removeItem("future-akshitha:current-user");
    }

    const error = new Error(message);
    error.status = response.status;
    throw error;
  }

  if (response.status === 204) {
    return null;
  }

  return response.json();
}
