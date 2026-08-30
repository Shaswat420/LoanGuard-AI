const API_URL = "http://localhost:8082/api";

/**
 * Centralized authenticated API client.
 *
 * Automatically:
 * - Adds Authorization Bearer token
 * - Adds JSON headers when appropriate
 * - Handles 401 / 403 authentication failures
 */
export async function apiFetch(
  endpoint: string,
  options: RequestInit = {}
): Promise<Response> {
  const token = localStorage.getItem("loanguard_token");

  const headers = new Headers(
    options.headers || {}
  );

  headers.set("Accept", "application/json");

  /*
   * Do not manually set Content-Type for FormData.
   * The browser must set the multipart boundary.
   */
  if (
    options.body &&
    !(options.body instanceof FormData)
  ) {
    headers.set(
      "Content-Type",
      "application/json"
    );
  }

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
      headers,
    }
  );

  /*
   * Global authentication handling.
   */
  if (
    response.status === 401 ||
    response.status === 403
  ) {
    localStorage.removeItem(
      "loanguard_token"
    );

    localStorage.removeItem(
      "loanguard_user"
    );

    window.location.replace("/");

    throw new Error(
      "Your session has expired. Please sign in again."
    );
  }

  return response;
}

export { API_URL };