const TOKEN_KEY = 'studybuddy_token';

export const tokenStore = {
  get: () => localStorage.getItem(TOKEN_KEY),
  set: (t) => localStorage.setItem(TOKEN_KEY, t),
  clear: () => localStorage.removeItem(TOKEN_KEY),
};

export class ApiError extends Error {
  constructor(status, message, details) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

/** Small fetch wrapper: JSON in/out, bearer token, throws ApiError on non-2xx. */
export async function api(path, { method = 'GET', body } = {}) {
  const headers = {};
  const token = tokenStore.get();
  if (token) headers.Authorization = `Bearer ${token}`;
  if (body !== undefined) headers['Content-Type'] = 'application/json';

  const res = await fetch(`/api${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  if (res.status === 204) return null;
  const data = await res.json().catch(() => null);
  if (!res.ok) {
    if (res.status === 401 && token) {
      tokenStore.clear();
      window.dispatchEvent(new Event('studybuddy:logout'));
    }
    throw new ApiError(res.status, data?.error || `Request failed (${res.status})`, data?.details);
  }
  return data;
}

/** Turns an ApiError into a readable message, including field errors. */
export function errorMessage(err) {
  if (err instanceof ApiError && err.details?.length) {
    return `${err.message}: ${err.details.map((d) => `${d.field} – ${d.message}`).join(', ')}`;
  }
  return err?.message || 'Prišlo je do napake';
}
