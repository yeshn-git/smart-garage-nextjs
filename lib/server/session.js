/* =========================================================================
   lib/server/session.js - login sessions without any third-party auth.
   - Passwords are hashed with bcrypt (never stored in plain text).
   - After login the server sets an httpOnly, Secure, SameSite=Lax cookie
     containing a signed JWT (HS256, AUTH_SECRET). JavaScript in the browser
     cannot read it, which protects it from XSS theft.
   - Every API request re-loads the user from the database, so a removed
     user or a role change takes effect immediately.
   ========================================================================= */
import { SignJWT, jwtVerify } from "jose";
import { ApiError } from "./errors.js";
import { query } from "./db.js";

export const COOKIE_NAME = "sg_session";
const MAX_AGE = 60 * 60 * 24 * 7; // 7 days

function secretKey() {
  const s = process.env.AUTH_SECRET;
  if (!s || s.length < 32) {
    throw new ApiError(500, "not_configured", "AUTH_SECRET is not set (use a random string of at least 32 characters).");
  }
  return new TextEncoder().encode(s);
}

export function publicUser(row) {
  return { id: row.id, name: row.name, email: row.email, phone: row.phone, role: row.role, createdAt: row.created_at };
}

/** Emails listed in ADMIN_EMAILS (comma separated) become garage admins. */
export function isAdminEmail(email) {
  return (process.env.ADMIN_EMAILS || "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean)
    .includes(String(email).toLowerCase());
}

export async function setSessionCookie(response, user) {
  const token = await new SignJWT({ role: user.role })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(user.id)
    .setIssuedAt()
    .setExpirationTime(`${MAX_AGE}s`)
    .sign(secretKey());
  response.cookies.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: MAX_AGE
  });
}

export function clearSessionCookie(response) {
  response.cookies.set(COOKIE_NAME, "", { httpOnly: true, path: "/", maxAge: 0 });
}

export async function getCurrentUser(request) {
  const token = request.cookies.get(COOKIE_NAME)?.value;
  if (!token) return null;
  let payload;
  try {
    ({ payload } = await jwtVerify(token, secretKey(), { algorithms: ["HS256"] }));
  } catch (err) {
    if (err instanceof ApiError) throw err;
    return null; // expired / tampered
  }
  const rows = await query("SELECT id, name, email, phone, role, created_at FROM users WHERE id = $1", [payload.sub]);
  return rows[0] ? publicUser(rows[0]) : null;
}

/** Throws 401/403 unless a user (or an admin) is logged in. */
export async function requireUser(request, role = "customer") {
  const user = await getCurrentUser(request);
  if (!user) throw new ApiError(401, "unauthenticated", "Please log in to continue.");
  if (role === "admin" && user.role !== "admin") throw new ApiError(403, "forbidden", "Admin access only.");
  return user;
}
