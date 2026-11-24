/* lib/server/requests.js - converts database rows to the JSON used by the UI */
export function rowToRequest(r) {
  return {
    id: r.id,
    customerId: r.customer_id,
    customerName: r.customer_name ?? undefined,
    customerEmail: r.customer_email ?? undefined,
    customerPhone: r.customer_phone ?? undefined,
    vehicle: {
      brand: r.brand, model: r.model, year: r.year, regNumber: r.reg_number,
      fuelType: r.fuel_type, mileage: r.mileage
    },
    problem: r.problem,
    hasImage: Boolean(r.has_image ?? r.image_data),
    imageData: r.image_data ?? undefined,
    aiAnalysis: r.ai_analysis || null,
    aiStatus: r.ai_status,
    status: r.status,
    adminNotes: r.admin_notes,
    createdAt: r.created_at,
    updatedAt: r.updated_at
  };
}

export const LIST_COLUMNS = `
  sr.id, sr.customer_id, sr.brand, sr.model, sr.year, sr.reg_number, sr.fuel_type, sr.mileage,
  sr.problem, (sr.image_data IS NOT NULL) AS has_image, sr.ai_analysis, sr.ai_status, sr.status,
  sr.admin_notes, sr.created_at, sr.updated_at,
  u.name AS customer_name, u.email AS customer_email, u.phone AS customer_phone`;
