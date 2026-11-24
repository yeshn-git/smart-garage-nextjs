"use client";
/* Toast notifications (success / error / warning / info) */
import { createContext, useCallback, useContext, useRef, useState } from "react";

const ToastContext = createContext(() => {});
const ICONS = { success: "✓", error: "✕", warning: "!", info: "i" };

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const idRef = useRef(0);

  const remove = useCallback((id) => {
    setToasts((t) => t.map((x) => (x.id === id ? { ...x, show: false } : x)));
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 300);
  }, []);

  const showToast = useCallback((message, type = "info", timeout = 4000) => {
    const id = ++idRef.current;
    setToasts((t) => [...t, { id, message, type, show: false }]);
    requestAnimationFrame(() => setToasts((t) => t.map((x) => (x.id === id ? { ...x, show: true } : x))));
    if (timeout) setTimeout(() => remove(id), timeout);
  }, [remove]);

  return (
    <ToastContext.Provider value={showToast}>
      {children}
      <div className="toast-container" aria-live="polite">
        {toasts.map((t) => (
          <div key={t.id} className={`toast toast-${t.type} ${t.show ? "show" : ""}`}>
            <span className="toast-icon">{ICONS[t.type] || "i"}</span>
            <span className="toast-msg">{t.message}</span>
            <button className="toast-close" aria-label="Close" onClick={() => remove(t.id)}>×</button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export const useToast = () => useContext(ToastContext);
