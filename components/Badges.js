export function StatusBadge({ status }) {
  const cls = { Pending: "badge-pending", "In Progress": "badge-progress", Completed: "badge-completed" }[status] || "badge-pending";
  return <span className={`badge ${cls}`}>{status || "Pending"}</span>;
}

export function UrgencyBadge({ urgency }) {
  const u = (urgency || "").toLowerCase();
  const cls = u === "high" ? "badge-high" : u === "medium" ? "badge-medium" : "badge-low";
  return <span className={`badge ${cls}`}>{urgency || "Unknown"} urgency</span>;
}

export function ProgressTracker({ status }) {
  const idx = { Pending: 0, "In Progress": 1, Completed: 2 }[status] ?? 0;
  return (
    <div className="tracker">
      {["Pending", "In Progress", "Completed"].map((s, i) => (
        <div key={s} className={`tracker-step ${i <= idx ? "done" : ""}`}>
          <span />
          {s}
        </div>
      ))}
    </div>
  );
}
