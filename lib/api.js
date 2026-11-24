/* lib/api.js - browser helper for calling our own Next.js API routes.
   The session cookie is sent automatically (same origin). */
export async function api(path, { method = "GET", body } = {}) {
  let res;
  try {
    res = await fetch(path, {
      method,
      headers: body ? { "Content-Type": "application/json" } : undefined,
      body: body ? JSON.stringify(body) : undefined,
      credentials: "same-origin",
      cache: "no-store"
    });
  } catch {
    throw Object.assign(new Error("Network error. Check your internet connection."), { code: "network" });
  }
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw Object.assign(new Error(json?.error?.message || `Request failed (${res.status}).`), {
      code: json?.error?.code || String(res.status),
      status: res.status
    });
  }
  return json;
}
