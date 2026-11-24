/* POST /api/auth/login - check password, set session cookie */
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { handle, readJson } from "@/lib/server/http";
import { query } from "@/lib/server/db";
import { setSessionCookie, publicUser, isAdminEmail } from "@/lib/server/session";
import { checkLoginAttempts } from "@/lib/server/rate-limit";
import { cleanString } from "@/lib/server/validate";
import { ApiError } from "@/lib/server/errors";

export const runtime = "nodejs";

// Used so that a wrong email takes as long as a wrong password
const DUMMY_HASH = "$2b$10$/FMwp2rNeYuG26V3tbB5zuoiMzrzGFvefLUraZapsApqTNi1DW.Tm";

export const POST = handle(async (request) => {
  const body = await readJson(request);
  const email = cleanString(body?.email, 120).toLowerCase();
  const password = typeof body?.password === "string" ? body.password : "";
  if (!email || !password) throw new ApiError(400, "invalid_input", "Enter your email and password.");
  checkLoginAttempts(email);

  const rows = await query(
    "SELECT id, name, email, phone, role, password_hash, created_at FROM users WHERE email = $1",
    [email]
  );
  const row = rows[0];
  const ok = await bcrypt.compare(password, row ? row.password_hash : DUMMY_HASH);
  if (!row || !ok) throw new ApiError(401, "invalid_credentials", "Incorrect email or password.");

  // Promote to admin if the email is listed in ADMIN_EMAILS
  if (row.role !== "admin" && isAdminEmail(email)) {
    await query("UPDATE users SET role = 'admin' WHERE id = $1", [row.id]);
    row.role = "admin";
  }
  const user = publicUser(row);
  const res = NextResponse.json({ user });
  await setSessionCookie(res, user);
  return res;
});
