/* =========================================================================
   lib/server/gemini.js - calls the Google Gemini API (server side only)
   Uses the REST endpoint models/{model}:generateContent with a JSON
   response schema so the answer is always structured.
   ========================================================================= */
import { ApiError } from "./errors.js";
import { parseModelJson } from "./validate.js";

export const SYSTEM_PROMPT = `You are "SmartGarage AI", an assistant for an automobile service centre in India.
A customer describes a problem with their car or two-wheeler. Your job:
1. Give a short plain-language summary of what the symptoms suggest.
2. List 2-5 possible causes, most likely first, each with likelihood (High/Medium/Low) and a one-sentence explanation.
3. Give 3-6 SAFE preliminary troubleshooting steps an ordinary vehicle owner can do (checks, observations, simple precautions).
   Never suggest dangerous DIY repairs (fuel system, airbags, high-voltage EV/hybrid parts, brake hydraulics, lifting the vehicle without stands).
4. Decide whether a professional inspection is required and explain why in one sentence.
5. Rate urgency: High (unsafe to drive / risk of major damage), Medium (book a service soon), Low (minor / monitor).
6. If there is a safety risk, put a clear warning in safetyWarning, otherwise return an empty string.
7. Suggest the likely service type (e.g. "Brake service", "Battery & electrical check").
If an image is provided, use it only as supporting evidence (e.g. a dashboard warning light) and mention what you see.
If the description is not about a vehicle, say so in the summary and return Low urgency with general advice to describe a vehicle problem.
Use simple English. Do not invent prices. Respond ONLY with JSON that matches the schema.`;

const RESPONSE_SCHEMA = {
  type: "OBJECT",
  properties: {
    summary: { type: "STRING" },
    urgency: { type: "STRING", enum: ["Low", "Medium", "High"] },
    safetyWarning: { type: "STRING" },
    possibleCauses: {
      type: "ARRAY",
      items: {
        type: "OBJECT",
        properties: {
          cause: { type: "STRING" },
          likelihood: { type: "STRING", enum: ["High", "Medium", "Low"] },
          explanation: { type: "STRING" }
        },
        required: ["cause", "likelihood", "explanation"]
      }
    },
    troubleshootingSteps: { type: "ARRAY", items: { type: "STRING" } },
    inspectionRequired: { type: "BOOLEAN" },
    inspectionReason: { type: "STRING" },
    estimatedServiceType: { type: "STRING" }
  },
  required: ["summary", "urgency", "possibleCauses", "troubleshootingSteps", "inspectionRequired", "inspectionReason", "estimatedServiceType"]
};

export async function callGemini(input, { apiKey, modelName, fetchImpl = fetch }) {
  const userText = `Vehicle: ${input.brand} ${input.model} (${input.year})
Fuel type: ${input.fuelType}
Odometer: ${input.mileage ? input.mileage + " km" : "Not specified"}
Customer's problem description: """${input.problem}"""`;

  const parts = [{ text: userText }];
  if (input.image) parts.push({ inlineData: { mimeType: input.image.mimeType, data: input.image.base64 } });

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(modelName)}:generateContent`;
  const body = {
    systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
    contents: [{ role: "user", parts }],
    generationConfig: {
      temperature: 0.3,
      maxOutputTokens: 8192,
      responseMimeType: "application/json",
      responseSchema: RESPONSE_SCHEMA
    }
  };

  let res;
  try {
    res = await fetchImpl(url, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-goog-api-key": apiKey },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(50000)
    });
  } catch (err) {
    console.error("Gemini network error:", err?.message);
    throw new ApiError(503, "ai_unavailable", "Could not reach the Gemini AI service. Please retry.");
  }

  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg = json?.error?.message || res.statusText;
    console.error("Gemini API error:", res.status, msg);
    if (res.status === 429) throw new ApiError(429, "rate_limited", "Gemini quota exceeded. Please try again in a minute.");
    if (res.status === 400 && /api key/i.test(msg)) throw new ApiError(500, "not_configured", "Gemini API key is invalid. Check GEMINI_API_KEY.");
    if (res.status === 404) throw new ApiError(500, "not_configured", `Gemini model "${modelName}" not found. Update GEMINI_MODEL.`);
    if (res.status === 403) throw new ApiError(500, "not_configured", "Gemini API access denied for this key.");
    throw new ApiError(503, "ai_unavailable", "Gemini AI service error. Please retry.");
  }

  const candidate = json?.candidates?.[0];
  if (!candidate) {
    const reason = json?.promptFeedback?.blockReason;
    throw new ApiError(400, "invalid_input", reason ? `Blocked by AI safety filters (${reason}).` : "AI returned no answer.");
  }
  if (candidate.finishReason === "SAFETY") {
    throw new ApiError(400, "invalid_input", "The AI could not answer because of safety filters. Rephrase the description.");
  }
  const text = (candidate.content?.parts || []).map((p) => p.text || "").join("");
  try {
    return parseModelJson(text);
  } catch {
    console.error("Could not parse Gemini JSON:", text.slice(0, 300));
    throw new ApiError(502, "ai_unavailable", "AI response could not be understood. Please retry.");
  }
}
