"use client";
/* Homepage hero card: live AI demo (anyone can type a problem and try it) */
import { useState } from "react";
import { api } from "@/lib/api";

const SAMPLE = {
  problem: "Grinding noise when I brake, and the car pulls slightly to the left.",
  analysis: {
    possibleCauses: [
      { cause: "Worn brake pads", likelihood: "High" },
      { cause: "Scored / uneven brake disc", likelihood: "Medium" },
      { cause: "Sticking brake caliper", likelihood: "Medium" }
    ],
    inspectionRequired: true,
    urgency: "High"
  }
};

const EXAMPLES = [
  "Car takes long to start in the morning and headlights look dim.",
  "Temperature gauge goes near red in traffic, sweet smell from bonnet.",
  "AC blows warm air even on the coldest setting."
];

export default function HeroDemo() {
  const [text, setText] = useState("");
  const [result, setResult] = useState(SAMPLE.analysis);
  const [isSample, setIsSample] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function analyse(e) {
    e.preventDefault();
    const problem = text.trim();
    if (problem.length < 10) return setError("Please describe the problem in at least 10 characters.");
    setBusy(true);
    setError("");
    try {
      const { analysis } = await api("/api/demo", { method: "POST", body: { problem } });
      setResult(analysis);
      setIsSample(false);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <form className="hero-card" onSubmit={analyse} aria-label="Try the AI vehicle assistant">
      <div className="hc-head">
        <span className="hc-title">AI Vehicle Assistant</span>
        <span className="hc-chip">{isSample ? "Sample output" : "Live result"}</span>
      </div>

      <label className="hc-label" htmlFor="hero-problem">Describe your vehicle problem</label>
      <textarea
        id="hero-problem"
        className="hc-textarea"
        rows={3}
        maxLength={300}
        placeholder={SAMPLE.problem}
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) analyse(e);
        }}
      />
      <div className="hc-examples">
        {EXAMPLES.map((ex) => (
          <button key={ex} type="button" className="hc-ex" onClick={() => setText(ex)}>
            {ex.split(" ").slice(0, 3).join(" ")}…
          </button>
        ))}
      </div>
      <button type="submit" className="btn btn-primary btn-block btn-sm" disabled={busy}>
        {busy ? <><span className="btn-spinner" /> Gemini is analysing...</> : "✦ Analyse with AI"}
      </button>
      {error && <p className="hc-error">{error}</p>}

      <div className={busy ? "hc-result loading" : "hc-result"}>
        {!isSample && result.summary && <p className="hc-summary">{result.summary}</p>}
        <div className="hc-label">Possible causes</div>
        <ul className="hc-list">
          {(result.possibleCauses || []).slice(0, 3).map((c, i) => (
            <li key={i}><span>{c.cause}</span><span>{String(c.likelihood || "").toUpperCase()}</span></li>
          ))}
        </ul>
        <div className="hc-label">Recommendation</div>
        <div className="hc-input" style={{ marginBottom: 10 }}>
          {result.inspectionRequired ? "Professional inspection recommended" : "Inspection may not be needed yet"} · {result.urgency} urgency
        </div>
        {!isSample && result.safetyWarning && <p className="hc-warning">⚠ {result.safetyWarning}</p>}
      </div>
      <p className="hc-foot">AI suggestions are preliminary and do not replace professional diagnosis.</p>
    </form>
  );
}
