// Unit tests for the server-side AI logic.  Run:  npm test
import test from "node:test";
import assert from "node:assert";
import { validateInput, validateRequest, validateRegistration, parseModelJson, normalizeAnalysis } from "../lib/server/validate.js";
import { checkBurst } from "../lib/server/rate-limit.js";
import { callGemini } from "../lib/server/gemini.js";

const valid = { brand: "Maruti Suzuki", model: "Swift", year: 2019, problem: "Grinding noise while braking at low speed." };

test("accepts valid input", () => {
  const r = validateInput({ ...valid, brand: "  Maruti Suzuki ", year: "2019" });
  assert.strictEqual(r.brand, "Maruti Suzuki");
  assert.strictEqual(r.year, 2019);
});
test("rejects missing brand", () => assert.throws(() => validateInput({ ...valid, brand: "" }), /brand and model/));
test("rejects invalid year", () => assert.throws(() => validateInput({ ...valid, year: 1900 }), /Year must be/));
test("rejects short problem", () => assert.throws(() => validateInput({ ...valid, problem: "noise" }), /at least 10/));
test("rejects bad image type", () =>
  assert.throws(() => validateInput({ ...valid, image: { mimeType: "image/gif", base64: "AAAA" } }), /JPEG, PNG or WEBP/));
test("parses fenced JSON", () => assert.strictEqual(parseModelJson('```json\n{"summary":"ok"}\n```').summary, "ok"));
test("normalises AI output", () => {
  const r = normalizeAnalysis({ urgency: "high", possibleCauses: [{ cause: "Pads", likelihood: "HIGH" }], troubleshootingSteps: ["a", ""] }, "m");
  assert.strictEqual(r.urgency, "High");
  assert.deepStrictEqual(r.troubleshootingSteps, ["a"]);
  assert.ok(r.disclaimer.includes("preliminary"));
});
test("rate limit blocks the 6th call in a minute", () => {
  const now = Date.now();
  for (let i = 0; i < 5; i++) checkBurst("u1", now);
  assert.throws(() => checkBurst("u1", now), /wait a minute/);
});
test("callGemini parses a mocked Gemini response", async () => {
  const fakeFetch = async (url, opts) => {
    assert.ok(url.includes("gemini-test:generateContent"));
    assert.strictEqual(opts.headers["x-goog-api-key"], "KEY");
    const body = JSON.parse(opts.body);
    assert.strictEqual(body.generationConfig.responseMimeType, "application/json");
    return { ok: true, json: async () => ({ candidates: [{ finishReason: "STOP", content: { parts: [{ text: '{"summary":"Worn pads","urgency":"High"}' }] } }] }) };
  };
  const r = await callGemini(validateInput(valid), { apiKey: "KEY", modelName: "gemini-test", fetchImpl: fakeFetch });
  assert.strictEqual(r.summary, "Worn pads");
});
test("callGemini maps 429 to rate_limited", async () => {
  const fakeFetch = async () => ({ ok: false, status: 429, statusText: "x", json: async () => ({ error: { message: "quota" } }) });
  await assert.rejects(callGemini(validateInput(valid), { apiKey: "K", modelName: "m", fetchImpl: fakeFetch }), (e) => e.code === "rate_limited");
});
test("validateRequest normalises registration number", () => {
  assert.strictEqual(validateRequest({ ...valid, regNumber: "ka 01  ab 1234" }).regNumber, "KA 01 AB 1234");
  assert.throws(() => validateRequest({ ...valid, regNumber: "@@" }), /registration number/);
});
test("validateRegistration checks email, phone and password", () => {
  const ok = validateRegistration({ name: "Ravi", phone: "9876543210", email: "Ravi@Test.com", password: "secret1" });
  assert.strictEqual(ok.email, "ravi@test.com");
  assert.throws(() => validateRegistration({ ...ok, email: "bad" }), /email/);
  assert.throws(() => validateRegistration({ ...ok, phone: "12" }), /phone/);
  assert.throws(() => validateRegistration({ ...ok, password: "1" }), /Password/);
});
