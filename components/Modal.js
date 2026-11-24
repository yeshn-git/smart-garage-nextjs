"use client";
import { useEffect } from "react";

export default function Modal({ open, onClose, label, children }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    document.body.classList.add("no-scroll");
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.classList.remove("no-scroll");
    };
  }, [open, onClose]);

  return (
    <div className={`modal ${open ? "open" : ""}`} role="dialog" aria-modal="true" aria-label={label}
      onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-box">
        <button className="modal-close" aria-label="Close" onClick={onClose}>×</button>
        {open && children}
      </div>
    </div>
  );
}
