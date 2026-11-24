"use client";
import { useEffect, useMemo } from "react";

/* Brand / model / year / fuel / odometer inputs shared by the forms */
const BRANDS = ["Maruti Suzuki", "Hyundai", "Tata", "Mahindra", "Honda", "Toyota", "Kia", "Renault", "Volkswagen",
  "Skoda", "MG", "Hero", "Bajaj", "TVS", "Royal Enfield", "Yamaha"];
const FUELS = ["Petrol", "Diesel", "CNG", "Electric", "Hybrid"];

export default function VehicleFields({ values, onChange, idPrefix = "" }) {
  const id = (n) => `${idPrefix}${n}`;
  const maxYear = new Date().getFullYear() + 1;
  return (
    <>
      <div className="form-row">
        <div className="form-group">
          <label htmlFor={id("brand")}>Vehicle brand <span className="req">*</span></label>
          <input id={id("brand")} list="brand-list" placeholder="e.g. Maruti Suzuki" maxLength={40}
            value={values.brand} onChange={onChange("brand")} />
          <datalist id="brand-list">{BRANDS.map((b) => <option key={b} value={b} />)}</datalist>
        </div>
        <div className="form-group">
          <label htmlFor={id("model")}>Model <span className="req">*</span></label>
          <input id={id("model")} placeholder="e.g. Swift VXi" maxLength={40} value={values.model} onChange={onChange("model")} />
        </div>
      </div>
      <div className="form-row three">
        <div className="form-group">
          <label htmlFor={id("year")}>Year <span className="req">*</span></label>
          <input id={id("year")} type="number" min="1980" max={maxYear} placeholder="2019" value={values.year} onChange={onChange("year")} />
        </div>
        <div className="form-group">
          <label htmlFor={id("fuelType")}>Fuel type</label>
          <select id={id("fuelType")} value={values.fuelType} onChange={onChange("fuelType")}>
            {FUELS.map((f) => <option key={f}>{f}</option>)}
          </select>
        </div>
        <div className="form-group">
          <label htmlFor={id("mileage")}>Odometer (km)</label>
          <input id={id("mileage")} type="number" min="0" placeholder="45000" value={values.mileage} onChange={onChange("mileage")} />
        </div>
      </div>
    </>
  );
}

export function ImagePicker({ id, file, onFile, showToast }) {
  const preview = useMemo(() => (file ? URL.createObjectURL(file) : ""), [file]);
  useEffect(() => () => preview && URL.revokeObjectURL(preview), [preview]);
  function handle(e) {
    const f = e.target.files?.[0];
    if (!f) return onFile(null);
    if (!f.type.startsWith("image/")) { showToast("Only image files are allowed.", "warning"); e.target.value = ""; return onFile(null); }
    if (f.size > 5 * 1024 * 1024) { showToast("Image must be smaller than 5 MB.", "warning"); e.target.value = ""; return onFile(null); }
    onFile(f);
  }
  return (
    <div className="form-group">
      <label>Vehicle image (optional)</label>
      <label className="file-drop" htmlFor={id}>
        📷 {file ? `Selected: ${file.name} (click to change)` : "Click to upload a photo (JPG/PNG, max 5 MB)"}
        <input type="file" id={id} accept="image/*" onChange={handle} />
      </label>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      {preview && <div className="image-preview"><img src={preview} alt="Selected vehicle preview" /></div>}
    </div>
  );
}
