const API_URL = "https://loanguard-ai-2y9l.onrender.com/api";

/**
 * Centralized authenticated API client.
 */
export async function apiFetch(
  endpoint: string,
  options: RequestInit = {}
): Promise<Response> {

  const token = localStorage.getItem("loanguard_token");

  const headers = new Headers(options.headers || {});

  headers.set("Accept", "application/json");

  // Add JSON Content-Type unless using FormData
  if (options.body && !(options.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }

  // Add JWT token
  if (token) {
    headers.set(
      "Authorization",
      `Bearer ${token}`
    );
  }

  const response = await fetch(
    `${API_URL}${endpoint}`,
    {
      ...options,
      headers
    }
  );

  // Handle authentication errors
  if (response.status === 401 || response.status === 403) {

    localStorage.removeItem("loanguard_token");
    localStorage.removeItem("loanguard_user");

    window.location.replace("/");

    throw new Error(
      "Your session has expired. Please sign in again."
    );
  }

  return response;
}

export { API_URL };