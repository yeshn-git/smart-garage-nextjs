"use client";
/* Details of one service request (used by customer and admin views) */
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { formatDate, shortId } from "@/lib/utils";
import { StatusBadge, ProgressTracker } from "./Badges";
import AnalysisView from "./AnalysisView";

function VehicleImage({ request }) {
  const [src, setSrc] = useState(request.imageData || "");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!request.hasImage || request.imageData) return;
    let cancelled = false;
    setLoading(true);
    api(`/api/requests/${request.id}`)
      .then(({ request: full }) => !cancelled && setSrc(full.imageData || ""))
      .catch((e) => console.warn("Image load failed", e))
      .finally(() => !cancelled && setLoading(false));
    return () => { cancelled = true; };
  }, [request.id, request.hasImage, request.imageData]);

  if (!request.hasImage) return null;
  return (
    <div className="details-section">
      <h5>Vehicle Image</h5>
      {loading && <p className="muted small">Loading image from the cloud database...</p>}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      {src && <img className="details-img" src={src} alt="Vehicle uploaded by customer" />}
    </div>
  );
}

export default function RequestDetails({ request, showCustomer = false }) {
  const v = request.vehicle || {};
  return (
    <>
      <div className="details-head">
        <div>
          <p className="request-id">{shortId(request.id)}</p>
          <h3>{v.brand} {v.model} ({v.year})</h3>
          <p className="muted">
            {v.regNumber} · {v.fuelType}{v.mileage ? ` · ${v.mileage} km` : ""}
          </p>
        </div>
        <StatusBadge status={request.status} />
      </div>
      <ProgressTracker status={request.status} />

      {showCustomer && (
        <div className="info-grid">
          <div className="info-box">
            <h5>Customer</h5>
            <p><strong>{request.customerName || "—"}</strong></p>
            <p>{request.customerEmail}</p>
            <p>{request.customerPhone || "No phone"}</p>
          </div>
          <div className="info-box">
            <h5>Timeline</h5>
            <p>Submitted: {formatDate(request.createdAt)}</p>
            <p>Last update: {formatDate(request.updatedAt)}</p>
            <p>AI status: {request.aiStatus || "—"}</p>
          </div>
        </div>
      )}

      <div className="details-section">
        <h5>Problem Description</h5>
        <p>{request.problem}</p>
      </div>
      <VehicleImage request={request} />
      {request.adminNotes && (
        <div className="details-section notes">
          <h5>Note from Garage</h5>
          <p>{request.adminNotes}</p>
        </div>
      )}
      <div className="details-section">
        <AnalysisView analysis={request.aiAnalysis} />
      </div>
      {!showCustomer && (
        <p className="muted small">
          Submitted: {formatDate(request.createdAt)}
          {request.updatedAt ? ` · Last update: ${formatDate(request.updatedAt)}` : ""}
        </p>
      )}
    </>
  );
}
