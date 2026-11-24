/* =========================================================================
   POST /api/analyze - Gemini analysis for the AI Assistant page
   (runs as a Vercel Serverless Function; GEMINI_API_KEY never leaves the server)
   ========================================================================= */
import { NextResponse } from "next/server";
import { handle, readJson } from "@/lib/server/http";
import { requireUser } from "@/lib/server/session";
import { validateInput, normalizeAnalysis } from "@/lib/server/validate";
import { checkAiLimit } from "@/lib/server/rate-limit";
import { callGemini } from "@/lib/server/gemini";
import { ApiError } from "@/lib/server/errors";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

export const POST = handle(async (request) => {
  const started = Date.now();
  const user = await requireUser(request);
  const input = validateInput(await readJson(request));
  await checkAiLimit(user.id);

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new ApiError(500, "not_configured", "GEMINI_API_KEY is not set on the server.");
  const modelName = process.env.GEMINI_MODEL || "gemini-2.5-flash";

  const analysis = normalizeAnalysis(await callGemini(input, { apiKey, modelName }), modelName);
  console.log(JSON.stringify({ event: "ai_analysis", user: user.id, urgency: analysis.urgency, ms: Date.now() - started }));
  return NextResponse.json({ analysis });
});

/* Health check: open /api/analyze in a browser */
export function GET() {
  return NextResponse.json({
    ok: true,
    endpoint: "POST /api/analyze",
    geminiConfigured: Boolean(process.env.GEMINI_API_KEY),
    databaseConfigured: Boolean(process.env.DATABASE_URL),
    authConfigured: (process.env.AUTH_SECRET || "").length >= 32
  });
}
