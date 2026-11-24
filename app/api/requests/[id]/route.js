/* =========================================================================
   /api/requests/:id
   GET   -> one request including its image (owner or admin)
   PATCH -> update status / note (admin only)
   ========================================================================= */
import { NextResponse } from "next/server";
import { handle, readJson, isUuid } from "@/lib/server/http";
import { query } from "@/lib/server/db";
import { requireUser } from "@/lib/server/session";
import { cleanString } from "@/lib/server/validate";
import { rowToRequest, LIST_COLUMNS } from "@/lib/server/requests";
import { ApiError } from "@/lib/server/errors";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const STATUSES = ["Pending", "In Progress", "Completed"];
const notFound = () => new ApiError(404, "not_found", "Service request not found.");

export const GET = handle(async (request, { params }) => {
  const { id } = await params;
  if (!isUuid(id)) throw notFound();
  const user = await requireUser(request);
  const rows = await query(
    `SELECT ${LIST_COLUMNS}, sr.image_data FROM service_requests sr JOIN users u ON u.id = sr.customer_id WHERE sr.id = $1`,
    [id]
  );
  const row = rows[0];
  // Customers may only see their own requests (404 hides that others exist)
  if (!row || (user.role !== "admin" && row.customer_id !== user.id)) throw notFound();
  return NextResponse.json({ request: rowToRequest(row) }, { headers: { "Cache-Control": "no-store" } });
});

export const PATCH = handle(async (request, { params }) => {
  const { id } = await params;
  if (!isUuid(id)) throw notFound();
  await requireUser(request, "admin");
  const body = await readJson(request);
  const status = String(body?.status || "");
  if (!STATUSES.includes(status)) throw new ApiError(400, "invalid_input", "Invalid status.");
  const adminNotes = cleanString(body?.adminNotes, 1000);

  const rows = await query(
    `UPDATE service_requests SET status = $1, admin_notes = $2, updated_at = now() WHERE id = $3 RETURNING id`,
    [status, adminNotes, id]
  );
  if (!rows.length) throw notFound();
  return NextResponse.json({ ok: true, id, status, adminNotes });
});
