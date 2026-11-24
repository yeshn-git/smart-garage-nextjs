/* lib/server/http.js - small helpers shared by all API routes */
import { NextResponse } from "next/server";
import { ApiError } from "./errors.js";

/** Wraps a route handler: converts ApiError into a JSON error response. */
export function handle(fn) {
  return async (request, context) => {
    try {
      return await fn(request, context);
    } catch (err) {
      if (err instanceof ApiError) {
        return NextResponse.json({ error: { code: err.code, message: err.message } }, { status: err.status });
      }
      console.error("Unexpected API error:", err);
      return NextResponse.json({ error: { code: "internal", message: "Unexpected server error." } }, { status: 500 });
    }
  };
}

/**
 * Reads a JSON body. Requiring Content-Type: application/json (which an
 * HTML form on another site cannot send) blocks CSRF attacks together with
 * the SameSite=Lax session cookie.
 */
export async function readJson(request) {
  const type = request.headers.get("content-type") || "";
  if (!type.includes("application/json")) {
    throw new ApiError(415, "invalid_input", "Content-Type must be application/json.");
  }
  try {
    return await request.json();
  } catch {
    throw new ApiError(400, "invalid_input", "Request body must be valid JSON.");
  }
}

export const isUuid = (v) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(String(v));
