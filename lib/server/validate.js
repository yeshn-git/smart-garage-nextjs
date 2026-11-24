/* =========================================================================
   lib/server/validate.js - input validation + AI output normalisation
   (pure functions, unit-tested in test/validate.test.mjs)
   ========================================================================= */
import { ApiError } from "./errors.js";

export const DISCLAIMER =
  "These AI suggestions are preliminary and do not replace a professional diagnosis by a qualified mechanic. If the vehicle feels unsafe, do not drive it.";

export function cleanString(value, maxLen) {
  if (value === undefined || value === null) return "";
  // eslint-disable-next-line no-control-regex
  return String(value).replace(/[\u0000-\u001F\u007F]/g, " ").trim().slice(0, maxLen);
}

/** Validates the JSON body sent by the browser. Throws ApiError(400). */
export function validateInput(data) {
  const bad = (msg) => new ApiError(400, "invalid_input", msg);
  if (!data || typeof data !== "object") throw bad("Request data is missing.");

  const brand = cleanString(data.brand, 40);
  const model = cleanString(data.model, 40);
  const fuelType = cleanString(data.fuelType, 20) || "Not specified";
  const mileage = cleanString(data.mileage, 10);
  const problem = cleanString(data.problem, 1500);
  const year = Number(data.year);
  const maxYear = new Date().getFullYear() + 1;

  if (!brand || !model) throw bad("Vehicle brand and model are required.");
  if (!Number.isInteger(year) || year < 1980 || year > maxYear) throw bad(`Year must be between 1980 and ${maxYear}.`);
  if (problem.length < 10) throw bad("Please describe the problem in at least 10 characters.");

  let image = null;
  if (data.image) {
    const mimeType = cleanString(data.image.mimeType, 30);
    const base64 = typeof data.image.base64 === "string" ? data.image.base64 : "";
    if (!["image/jpeg", "image/png", "image/webp"].includes(mimeType)) throw bad("Image must be JPEG, PNG or WEBP.");
    if (!base64 || base64.length > 3 * 1024 * 1024 || !/^[A-Za-z0-9+/=]+$/.test(base64)) {
      throw bad("Image is invalid or too large.");
    }
    image = { mimeType, base64 };
  }
  return { brand, model, year, fuelType, mileage, problem, image };
}

/** Extra checks for saving a service request. */
export function validateRequest(data) {
  const base = validateInput(data);
  const regNumber = cleanString(data.regNumber, 15).toUpperCase().replace(/\s+/g, " ");
  if (!/^[A-Z0-9 -]{4,15}$/.test(regNumber)) {
    throw new ApiError(400, "invalid_input", "Enter a valid registration number (e.g. KA 01 AB 1234).");
  }
  if (base.image && base.image.base64.length > 1_400_000) {
    throw new ApiError(400, "invalid_input", "Image is too large. Please use a smaller photo.");
  }
  return { ...base, regNumber };
}

/** Validates registration data. */
export function validateRegistration(data) {
  const bad = (msg) => new ApiError(400, "invalid_input", msg);
  const name = cleanString(data?.name, 80);
  const phone = cleanString(data?.phone, 15);
  const email = cleanString(data?.email, 120).toLowerCase();
  const password = typeof data?.password === "string" ? data.password : "";
  if (name.length < 2) throw bad("Please enter your full name.");
  if (!/^[0-9+\-\s]{10,15}$/.test(phone)) throw bad("Enter a valid phone number (10–15 digits).");
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw bad("The email address is not valid.");
  if (password.length < 6 || password.length > 128) throw bad("Password must be 6–128 characters.");
  return { name, phone, email, password };
}

/** Extracts the JSON object from model text (handles ```json fences). */
export function parseModelJson(text) {
  if (!text) throw new Error("Empty AI response");
  let t = text.trim();
  const fence = t.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fence) t = fence[1].trim();
  const start = t.indexOf("{");
  const end = t.lastIndexOf("}");
  if (start === -1 || end === -1) throw new Error("No JSON object in AI response");
  return JSON.parse(t.slice(start, end + 1));
}

/** Gives the AI result a safe, predictable shape. */
export function normalizeAnalysis(raw, modelName) {
  const levels = ["Low", "Medium", "High"];
  const pickLevel = (v, fallback) => {
    const s = cleanString(v, 10).toLowerCase();
    return levels.find((l) => l.toLowerCase() === s) || fallback;
  };
  const causes = Array.isArray(raw?.possibleCauses) ? raw.possibleCauses : [];
  const steps = Array.isArray(raw?.troubleshootingSteps) ? raw.troubleshootingSteps : [];
  return {
    summary: cleanString(raw?.summary, 600),
    urgency: pickLevel(raw?.urgency, "Medium"),
    safetyWarning: cleanString(raw?.safetyWarning, 400),
    possibleCauses: causes.slice(0, 6).map((c) => ({
      cause: cleanString(c?.cause, 120) || "Unspecified cause",
      likelihood: pickLevel(c?.likelihood, "Medium"),
      explanation: cleanString(c?.explanation, 300)
    })),
    troubleshootingSteps: steps.slice(0, 8).map((s) => cleanString(s, 300)).filter(Boolean),
    inspectionRequired: raw?.inspectionRequired !== false,
    inspectionReason: cleanString(raw?.inspectionReason, 300),
    estimatedServiceType: cleanString(raw?.estimatedServiceType, 80),
    disclaimer: DISCLAIMER,
    model: modelName,
    generatedAt: new Date().toISOString()
  };
}
