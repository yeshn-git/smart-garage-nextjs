"use client";
/* Customer dashboard: new service request + live list of my requests */
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import { useAuth, useRequireAuth, usePolling } from "@/lib/auth-context";
import { useToast } from "@/lib/toast-context";
import { compressImage, formatDate, friendlyError, shortId } from "@/lib/utils";
import DashboardShell, { CUSTOMER_NAV } from "../DashboardShell";
import VehicleFields, { ImagePicker } from "../VehicleFields";
import { StatusBadge, ProgressTracker } from "../Badges";
import RequestDetails from "../RequestDetails";
import Modal from "../Modal";
import { PageLoader, ButtonSpinner } from "../Loader";

const EMPTY = { brand: "", model: "", year: "", fuelType: "Petrol", mileage: "", regNumber: "", problem: "" };

export default function CustomerView() {
  const ready = useRequireAuth("customer");
  const { user } = useAuth();
  const showToast = useToast();

  const [form, setForm] = useState(EMPTY);
  const [file, setFile] = useState(null);
  const [pickerKey, setPickerKey] = useState(0);
  const [prefill, setPrefill] = useState(null);
  const [busy, setBusy] = useState(false);
  const [step, setStep] = useState("");
  const [requests, setRequests] = useState(null);
  const [loadError, setLoadError] = useState("");
  const [filter, setFilter] = useState("All");
  const [selected, setSelected] = useState(null);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  // Analysis handed over from the AI Assistant page
  useEffect(() => {
    if (!ready) return;
    const raw = sessionStorage.getItem("sg_prefill");
    if (!raw) return;
    sessionStorage.removeItem("sg_prefill");
    try {
      const p = JSON.parse(raw);
      setPrefill(p);
      setForm((f) => ({ ...f, brand: p.brand || "", model: p.model || "", year: p.year || "",
        fuelType: p.fuelType || "Petrol", mileage: p.mileage || "", problem: p.problem || "" }));
      showToast("AI analysis attached. Add your registration number and submit.", "info", 6000);
      setTimeout(() => document.getElementById("new-request")?.scrollIntoView({ behavior: "smooth" }), 300);
    } catch { /* ignore */ }
  }, [ready, showToast]);

  // My requests from the cloud database, refreshed every 10 seconds (and on tab focus)
  const loadRequests = useCallback(async () => {
    try {
      const { requests: list } = await api("/api/requests");
      setRequests(list);
      setLoadError("");
    } catch (err) {
      console.error(err);
      setLoadError(friendlyError(err));
    }
  }, []);
  usePolling(loadRequests, 10000, ready);

  // Keep an open details modal in sync with live data
  const liveSelected = selected && requests?.find((r) => r.id === selected.id) ? requests.find((r) => r.id === selected.id) : selected;

  const resetForm = useCallback(() => {
    setForm(EMPTY);
    setFile(null);
    setPickerKey((k) => k + 1);
    setPrefill(null);
  }, []);

  async function onSubmit(e) {
    e.preventDefault();
    const data = {
      brand: form.brand.trim(), model: form.model.trim(), year: Number(form.year),
      regNumber: form.regNumber.trim().toUpperCase().replace(/\s+/g, " "),
      fuelType: form.fuelType, mileage: String(form.mileage).trim(), problem: form.problem.trim()
    };
    const maxYear = new Date().getFullYear() + 1;
    if (!data.brand || !data.model) return showToast("Brand and model are required.", "warning");
    if (!Number.isInteger(data.year) || data.year < 1980 || data.year > maxYear)
      return showToast(`Enter a valid year between 1980 and ${maxYear}.`, "warning");
    if (!/^[A-Z0-9 -]{4,15}$/.test(data.regNumber))
      return showToast("Enter a valid registration number (e.g. KA 01 AB 1234).", "warning");
    if (data.problem.length < 10) return showToast("Please describe the problem (at least 10 characters).", "warning");

    setBusy(true);
    try {
      const body = { ...data };
      if (file) {
        setStep("Compressing vehicle image...");
        const img = await compressImage(file, 900);
        body.image = { base64: img.base64, mimeType: img.mimeType };
      }
      const reuse = prefill?.aiAnalysis && prefill.problem === data.problem && !file ? prefill.aiAnalysis : null;
      if (reuse) body.aiAnalysis = reuse;
      setStep(reuse ? "Saving request to the cloud database..." : "Gemini AI is analysing the problem and saving your request...");
      const { request, aiError } = await api("/api/requests", { method: "POST", body });
      if (aiError) showToast("AI analysis unavailable right now, but your request was saved. " + aiError, "warning", 8000);
      showToast(`Service request ${shortId(request.id)} submitted successfully!`, "success");
      resetForm();
      setRequests((list) => [request, ...(list || []).filter((r) => r.id !== request.id)]);
      setSelected(request);
    } catch (err) {
      console.error("Submit failed:", err);
      showToast(friendlyError(err), "error", 7000);
    } finally {
      setBusy(false);
      setStep("");
    }
  }

  if (!ready) return <PageLoader text="Checking your session..." />;

  const count = (s) => (requests || []).filter((r) => r.status === s).length;
  const visible = (requests || []).filter((r) => filter === "All" || r.status === filter);
  const name = user.name || "Customer";

  return (
    <DashboardShell
      section="Customer"
      items={CUSTOMER_NAV}
      title={`Hello, ${name} 👋`}
      subtitle="Book a service, get AI suggestions and track your vehicle's status in real time."
      actions={<>
        <Link href="/ai-assistant" className="btn btn-outline btn-sm">✦ Ask AI</Link>
        <a href="#new-request" className="btn btn-primary btn-sm">＋ New Request</a>
      </>}
    >
      <section className="stats-grid">
        <Stat icon="▦" color="blue" value={requests?.length ?? 0} label="Total Requests" />
        <Stat icon="⏳" color="amber" value={count("Pending")} label="Pending" />
        <Stat icon="🔧" color="purple" value={count("In Progress")} label="In Progress" />
        <Stat icon="✓" color="green" value={count("Completed")} label="Completed" />
      </section>

      <div className="dash-grid">
        <section className="panel" id="new-request">
          <div className="panel-head">
            <div>
              <h2>New Service Request</h2>
              <p>Gemini AI will analyse the problem automatically after you submit.</p>
            </div>
          </div>
          {prefill && <div className="prefill-note">✦ The analysis from the AI Assistant is attached to this request.</div>}

          <form onSubmit={onSubmit} onReset={resetForm} noValidate>
            <VehicleFields values={form} onChange={set} />
            <div className="form-group">
              <label htmlFor="regNumber">Registration number <span className="req">*</span></label>
              <input id="regNumber" placeholder="e.g. KA 01 AB 1234" maxLength={15} style={{ textTransform: "uppercase" }}
                value={form.regNumber} onChange={set("regNumber")} />
            </div>
            <div className="form-group">
              <label htmlFor="problem">Describe the problem <span className="req">*</span></label>
              <textarea id="problem" maxLength={1500} placeholder="What happens, when it happens, any sounds, smells or warning lights..."
                value={form.problem} onChange={set("problem")} />
            </div>
            <ImagePicker key={pickerKey} id="vehicle-image" file={file} onFile={setFile} showToast={showToast} />
            <div className="form-actions">
              <button type="submit" className="btn btn-primary" disabled={busy}>
                {busy ? <><ButtonSpinner /> Submitting...</> : "Submit & Analyse with AI"}
              </button>
              <button type="reset" className="btn btn-outline" disabled={busy}>Clear</button>
            </div>
            {step && <div className="submit-progress">{step}</div>}
          </form>
        </section>

        <section className="panel" id="my-requests">
          <div className="panel-head">
            <div>
              <h2>My Service Requests</h2>
              <p>Synced with the cloud database every 10 seconds.</p>
            </div>
          </div>
          <div className="chip-row" style={{ marginBottom: 16 }}>
            {["All", "Pending", "In Progress", "Completed"].map((f) => (
              <button key={f} className={`chip ${filter === f ? "active" : ""}`} onClick={() => setFilter(f)}>{f}</button>
            ))}
          </div>
          <div className="request-list">
            {loadError ? (
              <div className="empty-state">Could not load requests: {loadError}</div>
            ) : requests === null ? (
              <><div className="skeleton-card" /><div className="skeleton-card" /></>
            ) : visible.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">🚗</div>
                <p>{requests.length ? "No requests with this status." : "You have not submitted any service requests yet."}</p>
                {!requests.length && <a href="#new-request" className="btn btn-primary btn-sm">Create your first request</a>}
              </div>
            ) : (
              visible.map((r) => (
                <article key={r.id} className="request-card" tabIndex={0}
                  onClick={() => setSelected(r)} onKeyDown={(e) => e.key === "Enter" && setSelected(r)}>
                  <div className="request-card-top">
                    <span className="request-id">{shortId(r.id)}</span>
                    <StatusBadge status={r.status} />
                  </div>
                  <h4>{r.vehicle?.brand} {r.vehicle?.model} <span className="muted">({r.vehicle?.year})</span></h4>
                  <p className="reg">{r.vehicle?.regNumber}</p>
                  <p className="problem-snippet">{(r.problem || "").slice(0, 110)}{(r.problem || "").length > 110 ? "…" : ""}</p>
                  <div className="request-card-foot">
                    <span>{formatDate(r.createdAt)}</span>
                    <span className={`ai-tag ${r.aiStatus === "completed" ? "ok" : "fail"}`}>
                      {r.aiStatus === "completed" ? "AI analysed" : "AI unavailable"}
                    </span>
                  </div>
                  <ProgressTracker status={r.status} />
                </article>
              ))
            )}
          </div>
        </section>
      </div>

      <Modal open={Boolean(selected)} onClose={() => setSelected(null)} label="Service request details">
        {liveSelected && <RequestDetails request={liveSelected} />}
      </Modal>
    </DashboardShell>
  );
}

function Stat({ icon, color, value, label }) {
  return (
    <div className="stat-card">
      <div className={`stat-icon ${color}`}>{icon}</div>
      <div><div className="stat-value">{value}</div><div className="stat-label">{label}</div></div>
    </div>
  );
}
