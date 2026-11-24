/* =========================================================================
   /api/requests
   GET  -> customer: own requests | admin: all requests (without images)
   POST -> create a service request; Gemini analysis runs on the server
   ========================================================================= */
import { NextResponse } from "next/server";
import { handle, readJson } from "@/lib/server/http";
import { query } from "@/lib/server/db";
import { requireUser } from "@/lib/server/session";
import { validateRequest, normalizeAnalysis } from "@/lib/server/validate";
import { checkAiLimit } from "@/lib/server/rate-limit";
import { callGemini } from "@/lib/server/gemini";
import { rowToRequest, LIST_COLUMNS } from "@/lib/server/requests";
import { ApiError } from "@/lib/server/errors";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

export const GET = handle(async (request) => {
  const user = await requireUser(request);
  const rows = user.role === "admin"
    ? await query(`SELECT ${LIST_COLUMNS} FROM service_requests sr JOIN users u ON u.id = sr.customer_id
                   ORDER BY sr.created_at DESC LIMIT 500`)
    : await query(`SELECT ${LIST_COLUMNS} FROM service_requests sr JOIN users u ON u.id = sr.customer_id
                   WHERE sr.customer_id = $1 ORDER BY sr.created_at DESC LIMIT 200`, [user.id]);
  return NextResponse.json({ requests: rows.map(rowToRequest) }, { headers: { "Cache-Control": "no-store" } });
});

export const POST = handle(async (request) => {
  const user = await requireUser(request);
  const body = await readJson(request);
  const data = validateRequest(body);

  // AI analysis: reuse the one from the AI Assistant page, or call Gemini now
  let aiAnalysis = null;
  let aiError = null;
  if (body.aiAnalysis && typeof body.aiAnalysis === "object" && !data.image) {
    aiAnalysis = normalizeAnalysis(body.aiAnalysis, String(body.aiAnalysis.model || "gemini").slice(0, 60));
  } else {
    try {
      await checkAiLimit(user.id);
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) throw new ApiError(500, "not_configured", "GEMINI_API_KEY is not set on the server.");
      const modelName = process.env.GEMINI_MODEL || "gemini-2.5-flash";
      aiAnalysis = normalizeAnalysis(await callGemini(data, { apiKey, modelName }), modelName);
    } catch (err) {
      // The request is still saved; the garage can process it without AI.
      console.error("AI analysis failed while creating request:", err?.message);
      aiError = err instanceof ApiError ? err.message : "AI analysis failed.";
    }
  }

  const imageData = data.image ? `data:${data.image.mimeType};base64,${data.image.base64}` : null;
  const rows = await query(
    `INSERT INTO service_requests
       (customer_id, brand, model, year, reg_number, fuel_type, mileage, problem, image_data, ai_analysis, ai_status)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
     RETURNING id`,
    [user.id, data.brand, data.model, data.year, data.regNumber, data.fuelType, data.mileage, data.problem,
      imageData, aiAnalysis ? JSON.stringify(aiAnalysis) : null, aiAnalysis ? "completed" : "failed"]
  );
  const full = await query(
    `SELECT ${LIST_COLUMNS}, sr.image_data FROM service_requests sr JOIN users u ON u.id = sr.customer_id WHERE sr.id = $1`,
    [rows[0].id]
  );
  console.log(JSON.stringify({ event: "request_created", user: user.id, ai: Boolean(aiAnalysis) }));
  return NextResponse.json({ request: rowToRequest(full[0]), aiError }, { status: 201 });
});
