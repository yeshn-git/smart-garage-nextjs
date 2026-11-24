/* =========================================================================
   lib/ai-client.js - Browser side of the AI integration.

   The browser NEVER calls Gemini directly. It sends the request to our own
   Next.js API route (/api/analyze), which runs on Vercel's servers, verifies
   the Firebase ID token, and calls Gemini with the secret GEMINI_API_KEY.
   ========================================================================= */
import { getFirebaseAuth } from "./firebase";

export async function requestAIAnalysis(payload) {
  const user = getFirebaseAuth().currentUser;
  if (!user) throw Object.assign(new Error("Please log in again."), { code: "ai/unauthenticated" });
  const token = await user.getIdToken();

  let res;
  try {
    res = await fetch("/api/analyze", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify(payload)
    });
  } catch {
    throw Object.assign(new Error("Network error while contacting the AI service."), { code: "ai/network" });
  }
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    const e = new Error(json?.error?.message || `AI service error (${res.status}).`);
    e.code = "ai/" + (json?.error?.code || res.status);
    throw e;
  }
  if (!json.analysis) throw new Error("Empty response from AI service.");
  return json.analysis;
}
