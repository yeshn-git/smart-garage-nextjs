"use client";
/* Garage Admin dashboard: all requests (live), stats, filters, status updates */
import { useCallback, useMemo, useState } from "react";
import { api } from "@/lib/api";
import { useRequireAuth, usePolling } from "@/lib/auth-context";
import { useToast } from "@/lib/toast-context";
import { formatDate, friendlyError, shortId, STATUSES, toMillis } from "@/lib/utils";
import DashboardShell, { ADMIN_NAV } from "../DashboardShell";
import { StatusBadge, UrgencyBadge } from "../Badges";
import RequestDetails from "../RequestDetails";
import Modal from "../Modal";
import { PageLoader, ButtonSpinner } from "../Loader";

export default function AdminView() {
  const ready = useRequireAuth("admin");
  const showToast = useToast();
  const [requests, setRequests] = useState(null);
  const [loadError, setLoadError] = useState("");
  const [status, setStatus] = useState("All");
  const [urgency, setUrgency] = useState("All");
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState(null);
  const [edit, setEdit] = useState({ status: "Pending", adminNotes: "" });
  const [saving, setSaving] = useState(false);

  // All requests from the cloud database, refreshed every 10 seconds
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

  const all = requests || [];
  const stats = useMemo(() => {
    const c = (s) => all.filter((r) => r.status === s).length;
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const total = all.length;
    const pct = (n) => (total ? Math.round((n / total) * 100) : 0);
    const pending = c("Pending"), progress = c("In Progress"), completed = c("Completed");
    return {
      total, pending, progress, completed,
      urgent: all.filter((r) => (r.aiAnalysis?.urgency || "").toLowerCase() === "high" && r.status !== "Completed").length,
      today: all.filter((r) => toMillis(r.createdAt) >= today.getTime()).length,
      pPending: pct(pending), pProgress: pct(progress), pCompleted: pct(completed)
    };
  }, [all]);

  const rows = all.filter((r) => {
    if (status !== "All" && r.status !== status) return false;
    if (urgency !== "All" && (r.aiAnalysis?.urgency || "Unknown") !== urgency) return false;
    if (!search) return true;
    const hay = [shortId(r.id), r.customerName, r.customerEmail, r.customerPhone, r.vehicle?.brand, r.vehicle?.model, r.vehicle?.regNumber, r.problem]
      .join(" ").toLowerCase();
    return hay.includes(search.toLowerCase());
  });

  const selected = all.find((r) => r.id === selectedId);

  function openRequest(r) {
    setSelectedId(r.id);
    setEdit({ status: STATUSES.includes(r.status) ? r.status : "Pending", adminNotes: r.adminNotes || "" });
  }

  function quickFilter(s) {
    setStatus(s);
    document.getElementById("requests-section")?.scrollIntoView({ behavior: "smooth" });
  }

  async function saveUpdate(e) {
    e.preventDefault();
    if (!selectedId || !STATUSES.includes(edit.status)) return;
    setSaving(true);
    try {
      await api(`/api/requests/${selectedId}`, {
        method: "PATCH",
        body: { status: edit.status, adminNotes: edit.adminNotes.trim().slice(0, 1000) }
      });
      await loadRequests();
      showToast(`${shortId(selectedId)} updated to "${edit.status}".`, "success");
      setSelectedId(null);
    } catch (err) {
      console.error(err);
      showToast(friendlyError(err), "error");
    } finally {
      setSaving(false);
    }
  }

  if (!ready) return <PageLoader text="Checking admin access..." />;

  return (
    <DashboardShell section="Garage Admin" items={ADMIN_NAV} title="Garage Control Centre"
      subtitle="All service requests, AI analysis and statistics from the cloud database (auto-refresh every 10 s).">
      <section className="stats-grid six">
        <Stat icon="▦" color="blue" value={stats.total} label="Total Requests" onClick={() => quickFilter("All")} />
        <Stat icon="⏳" color="amber" value={stats.pending} label="Pending" onClick={() => quickFilter("Pending")} />
        <Stat icon="🔧" color="purple" value={stats.progress} label="In Progress" onClick={() => quickFilter("In Progress")} />
        <Stat icon="✓" color="green" value={stats.completed} label="Completed" onClick={() => quickFilter("Completed")} />
        <Stat icon="!" color="red" value={stats.urgent} label="High Urgency (open)" />
        <Stat icon="📅" color="navy" value={stats.today} label="Received Today" />
      </section>

      <div className="admin-overview">
        <section className="panel">
          <div className="panel-head"><div><h2>Status Distribution</h2><p>Share of requests in each stage.</p></div></div>
          <div className="bars">
            <Bar label="Pending" cls="pending" pct={stats.pPending} />
            <Bar label="In Progress" cls="progress" pct={stats.pProgress} />
            <Bar label="Completed" cls="completed" pct={stats.pCompleted} />
          </div>
        </section>
        <section className="panel completion">
          <div className="panel-head" style={{ justifyContent: "center" }}><h2>Completion Rate</h2></div>
          <div className="big">{stats.pCompleted}%</div>
          <p className="muted small" style={{ marginTop: 10 }}>of all requests completed</p>
        </section>
      </div>

      <section className="panel" id="requests-section">
        <div className="panel-head">
          <div>
            <h2>Service Requests</h2>
            <p>{rows.length} of {all.length} requests</p>
          </div>
          <div className="table-controls">
            <input type="search" placeholder="Search name, reg. no, problem, ID..." value={search} onChange={(e) => setSearch(e.target.value)} />
            <select aria-label="Filter by status" value={status} onChange={(e) => setStatus(e.target.value)}>
              <option value="All">All statuses</option>
              {STATUSES.map((s) => <option key={s}>{s}</option>)}
            </select>
            <select aria-label="Filter by AI urgency" value={urgency} onChange={(e) => setUrgency(e.target.value)}>
              <option value="All">All urgency</option>
              <option>High</option><option>Medium</option><option>Low</option>
              <option value="Unknown">No AI result</option>
            </select>
          </div>
        </div>
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr><th>ID</th><th>Customer</th><th>Vehicle</th><th>AI Urgency</th><th>Status</th><th>Submitted</th><th>Action</th></tr>
            </thead>
            <tbody>
              {loadError ? (
                <tr><td colSpan={7} className="empty-row">Could not load requests: {loadError}</td></tr>
              ) : requests === null ? (
                <tr><td colSpan={7} className="loading-row"><ButtonSpinner dark /> Loading requests from the database...</td></tr>
              ) : rows.length === 0 ? (
                <tr><td colSpan={7} className="empty-row">
                  {all.length ? "No requests match the current filters." : "No service requests yet. New ones appear here automatically."}
                </td></tr>
              ) : rows.map((r) => (
                <tr key={r.id}>
                  <td data-label="ID"><span className="request-id">{shortId(r.id)}</span></td>
                  <td data-label="Customer"><strong>{r.customerName || "—"}</strong><br /><span className="muted small">{r.customerEmail}</span></td>
                  <td data-label="Vehicle">{r.vehicle?.brand} {r.vehicle?.model}<br /><span className="muted small">{r.vehicle?.regNumber}</span></td>
                  <td data-label="AI Urgency">{r.aiAnalysis ? <UrgencyBadge urgency={r.aiAnalysis.urgency} /> : <span className="badge badge-low">No AI</span>}</td>
                  <td data-label="Status"><StatusBadge status={r.status} /></td>
                  <td data-label="Submitted"><span className="small">{formatDate(r.createdAt)}</span></td>
                  <td data-label="Action"><button className="btn btn-outline btn-sm" onClick={() => openRequest(r)}>View / Update</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <Modal open={Boolean(selected)} onClose={() => setSelectedId(null)} label="Request details">
        {selected && (
          <>
            <RequestDetails request={selected} showCustomer />
            <form className="update-box" onSubmit={saveUpdate}>
              <h4>Update Service Status</h4>
              <div className="form-group">
                <label htmlFor="status">Status</label>
                <select id="status" value={edit.status} onChange={(e) => setEdit((x) => ({ ...x, status: e.target.value }))}>
                  {STATUSES.map((s) => <option key={s}>{s}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label htmlFor="adminNotes">Note for customer (optional)</label>
                <textarea id="adminNotes" maxLength={1000} value={edit.adminNotes}
                  onChange={(e) => setEdit((x) => ({ ...x, adminNotes: e.target.value }))}
                  placeholder="e.g. Brake pads replaced. Vehicle ready for pickup after 5 PM." />
              </div>
              <div className="form-actions">
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? <><ButtonSpinner /> Saving...</> : "Save Update"}
                </button>
                <button type="button" className="btn btn-ghost" onClick={() => setSelectedId(null)}>Cancel</button>
              </div>
            </form>
          </>
        )}
      </Modal>
    </DashboardShell>
  );
}

function Stat({ icon, color, value, label, onClick }) {
  return (
    <div className="stat-card" onClick={onClick} style={onClick ? { cursor: "pointer" } : undefined}>
      <div className={`stat-icon ${color}`}>{icon}</div>
      <div><div className="stat-value">{value}</div><div className="stat-label">{label}</div></div>
    </div>
  );
}

function Bar({ label, cls, pct }) {
  return (
    <div className="bar-row">
      <span>{label}</span>
      <div className="bar-track"><div className={`bar-fill ${cls}`} style={{ width: `${pct}%` }} /></div>
      <span className="bar-pct">{pct}%</span>
    </div>
  );
}
