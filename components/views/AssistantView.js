"use client";
/* Standalone AI Vehicle Assistant (Gemini via /api/analyze) */
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useRequireAuth } from "@/lib/auth-context";
import { useToast } from "@/lib/toast-context";
import { api } from "@/lib/api";
import { compressImage, friendlyError } from "@/lib/utils";
import DashboardShell, { CUSTOMER_NAV } from "../DashboardShell";
import VehicleFields, { ImagePicker } from "../VehicleFields";
import AnalysisView from "../AnalysisView";
import { PageLoader, ButtonSpinner } from "../Loader";

const EXAMPLES = [
  ["Brake noise", "There is a grinding metal noise when I press the brake pedal, and the car pulls slightly to the left while braking."],
  ["Hard starting", "The engine takes a long time to start in the morning. It cranks slowly and the headlights look dim before starting."],
  ["Overheating", "The temperature gauge goes near the red mark in traffic and I can smell something sweet from the bonnet."],
  ["AC not cooling", "The AC is blowing warm air even on the coldest setting. The fan works but there is no cooling."],
  ["Bike jerking", "My bike's engine check light is on and the bike jerks when I accelerate at low speed."]
];

export default function AssistantView() {
  const ready = useRequireAuth("customer");
  const router = useRouter();
  const showToast = useToast();
  const [form, setForm] = useState({ brand: "", model: "", year: "", fuelType: "Petrol", mileage: "", problem: "" });
  const [file, setFile] = useState(null);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState(null); // { analysis, payload }
  const [error, setError] = useState("");
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  async function onSubmit(e) {
    e.preventDefault();
    const payload = {
      brand: form.brand.trim(), model: form.model.trim(), year: form.year,
      fuelType: form.fuelType, mileage: String(form.mileage).trim(), problem: form.problem.trim()
    };
    if (!payload.brand || !payload.model || !payload.year) return showToast("Please fill in brand, model and year.", "warning");
    if (payload.problem.length < 10) return showToast("Describe the problem in a little more detail (at least 10 characters).", "warning");

    setBusy(true);
    setError("");
    setResult(null);
    try {
      const body = { ...payload };
      if (file) {
        const img = await compressImage(file);
        body.image = { base64: img.base64, mimeType: img.mimeType };
      }
      const { analysis } = await api("/api/analyze", { method: "POST", body });
      setResult({ analysis, payload });
      showToast("AI analysis ready.", "success");
    } catch (err) {
      console.error("AI analysis failed:", err);
      setError(friendlyError(err));
      showToast(friendlyError(err), "error");
    } finally {
      setBusy(false);
    }
  }

  function bookWithAnalysis() {
    if (!result) return;
    sessionStorage.setItem("sg_prefill", JSON.stringify({ ...result.payload, aiAnalysis: result.analysis }));
    router.push("/dashboard#new-request");
  }

  if (!ready) return <PageLoader text="Checking your session..." />;

  return (
    <DashboardShell section="Customer" items={CUSTOMER_NAV} title="✦ AI Vehicle Assistant"
      subtitle="Describe the problem and Google Gemini will suggest possible causes and safe first steps.">
      <div className="dash-grid">
        <section className="panel">
          <div className="panel-head"><div><h2>Vehicle &amp; Problem</h2><p>The more detail you give, the better the analysis.</p></div></div>
          <p className="small muted" style={{ marginBottom: 8 }}>Try an example:</p>
          <div className="example-chips">
            {EXAMPLES.map(([label, text]) => (
              <button key={label} type="button" className="chip" onClick={() => setForm((f) => ({ ...f, problem: text }))}>{label}</button>
            ))}
          </div>
          <form onSubmit={onSubmit} noValidate>
            <VehicleFields values={form} onChange={set} idPrefix="ai-" />
            <div className="form-group">
              <label htmlFor="ai-problem">
                Problem description <span className="req">*</span>
                <span className="char-count">{form.problem.length}/1500</span>
              </label>
              <textarea id="ai-problem" maxLength={1500} value={form.problem} onChange={set("problem")}
                placeholder="Describe the symptoms: noises, smells, warning lights, when it happens..." />
            </div>
            <ImagePicker id="ai-image" file={file} onFile={setFile} showToast={showToast} />
            <button type="submit" className="btn btn-primary btn-block" disabled={busy}>
              {busy ? <><ButtonSpinner /> Analysing...</> : "✦ Analyse with Gemini AI"}
            </button>
          </form>
        </section>

        <section className="panel" id="ai-output">
          <div className="panel-head"><div><h2>AI Analysis</h2><p>Results appear here.</p></div></div>
          {busy && (
            <div className="ai-thinking">
              <div className="dots"><span /><span /><span /></div>
              Gemini is analysing your vehicle problem in the cloud...
            </div>
          )}
          {error && <div className="ai-error"><strong>AI analysis failed.</strong> {error}</div>}
          {result && <AnalysisView analysis={result.analysis} />}
          {!busy && !error && !result && (
            <div className="ai-empty">
              Fill in the form and click <strong>Analyse with Gemini AI</strong>. You will get:
              <ul>
                <li>Possible causes with likelihood</li>
                <li>Preliminary troubleshooting steps</li>
                <li>Whether a professional inspection is needed</li>
                <li>Urgency level and safety warnings</li>
              </ul>
            </div>
          )}
          {result && (
            <button className="btn btn-primary btn-block" style={{ marginTop: 16 }} onClick={bookWithAnalysis}>
              Book a Service Request with this Analysis →
            </button>
          )}
        </section>
      </div>
    </DashboardShell>
  );
}
