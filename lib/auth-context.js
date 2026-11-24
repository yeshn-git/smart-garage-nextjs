"use client";
/* =========================================================================
   Auth context: the logged-in user comes from GET /api/auth/me.
   The session itself is an httpOnly cookie set by the server, so the
   browser JavaScript never handles passwords hashes or tokens.
   ========================================================================= */
import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "./api";
import { useToast } from "./toast-context";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [state, setState] = useState({ loading: true, user: null, error: "" });

  const refresh = useCallback(async () => {
    try {
      const { user } = await api("/api/auth/me");
      setState({ loading: false, user, error: "" });
      return user;
    } catch (err) {
      setState({ loading: false, user: null, error: err.message });
      return null;
    }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  const login = useCallback(async (email, password) => {
    const { user } = await api("/api/auth/login", { method: "POST", body: { email, password } });
    setState({ loading: false, user, error: "" });
    return user;
  }, []);

  const register = useCallback(async (data) => {
    const { user } = await api("/api/auth/register", { method: "POST", body: data });
    setState({ loading: false, user, error: "" });
    return user;
  }, []);

  /** Logs out. With redirectTo, does a full page load there (avoids the page
      guard redirecting to /login first). */
  const logout = useCallback(async (redirectTo) => {
    await api("/api/auth/logout", { method: "POST", body: {} });
    if (redirectTo) {
      window.location.assign(redirectTo);
      return;
    }
    setState({ loading: false, user: null, error: "" });
  }, []);

  const value = {
    ...state,
    isAdmin: state.user?.role === "admin",
    profile: state.user,
    refresh, login, register, logout
  };
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);

/** Page guard. role = "customer" (any logged-in user) or "admin". */
export function useRequireAuth(role = "customer") {
  const { loading, user, isAdmin } = useAuth();
  const router = useRouter();
  const showToast = useToast();

  useEffect(() => {
    if (loading) return;
    if (!user) router.replace(`/login?next=${encodeURIComponent(window.location.pathname)}`);
    else if (role === "admin" && !isAdmin) {
      showToast("Admin access only. Redirecting to your dashboard.", "error");
      router.replace("/dashboard");
    }
  }, [loading, user, isAdmin, role, router, showToast]);

  return !loading && Boolean(user) && (role !== "admin" || isAdmin);
}

/** Calls `load` now, every `ms` milliseconds and when the tab regains focus. */
export function usePolling(load, ms = 10000, enabled = true) {
  useEffect(() => {
    if (!enabled) return;
    load();
    const t = setInterval(() => document.visibilityState === "visible" && load(), ms);
    const onFocus = () => load();
    window.addEventListener("focus", onFocus);
    return () => { clearInterval(t); window.removeEventListener("focus", onFocus); };
  }, [load, ms, enabled]);
}
