/* GET /api/auth/me - the logged-in user (or null) */
import { NextResponse } from "next/server";
import { handle } from "@/lib/server/http";
import { getCurrentUser } from "@/lib/server/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const GET = handle(async (request) => {
  const user = await getCurrentUser(request);
  return NextResponse.json({ user }, { headers: { "Cache-Control": "no-store" } });
});
