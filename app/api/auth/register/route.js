/* POST /api/auth/register - create a customer account and log in */
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { handle, readJson } from "@/lib/server/http";
import { query } from "@/lib/server/db";
import { validateRegistration } from "@/lib/server/validate";
import { setSessionCookie, publicUser, isAdminEmail } from "@/lib/server/session";
import { ApiError } from "@/lib/server/errors";

export const runtime = "nodejs";

export const POST = handle(async (request) => {
  const { name, phone, email, password } = validateRegistration(await readJson(request));
  const existing = await query("SELECT 1 FROM users WHERE email = $1", [email]);
  if (existing.length) throw new ApiError(409, "email_taken", "An account with this email already exists.");

  const hash = await bcrypt.hash(password, 10);
  const role = isAdminEmail(email) ? "admin" : "customer";
  let rows;
  try {
    rows = await query(
      `INSERT INTO users (name, email, phone, password_hash, role) VALUES ($1, $2, $3, $4, $5)
       RETURNING id, name, email, phone, role, created_at`,
      [name, email, phone, hash, role]
    );
  } catch (err) {
    if (err?.code === "conflict") throw new ApiError(409, "email_taken", "An account with this email already exists.");
    throw err;
  }
  const user = publicUser(rows[0]);
  const res = NextResponse.json({ user }, { status: 201 });
  await setSessionCookie(res, user);
  return res;
});
