"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { useToast } from "@/lib/toast-context";
import { friendlyError } from "@/lib/utils";
import AuthSide from "../AuthSide";
import { ButtonSpinner } from "../Loader";

/** Only allow redirects to our own known pages */
function safeNext(isAdmin) {
  const next = new URLSearchParams(window.location.search).get("next");
  if (next === "/admin") return isAdmin ? "/admin" : "/dashboard";
  if (["/dashboard", "/ai-assistant"].includes(next)) return next;
  return isAdmin ? "/admin" : "/dashboard";
}

export default function LoginView() {
  const router = useRouter();
  const showToast = useToast();
  const { user, isAdmin, loading, login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [busy, setBusy] = useState(false);

  // Already logged in -> go to the right dashboard
  useEffect(() => {
    if (!loading && user && !busy) router.replace(safeNext(isAdmin));
  }, [loading, user, isAdmin, busy, router]);

  async function onSubmit(e) {
    e.preventDefault();
    if (!email || !password) return showToast("Enter your email and password.", "warning");
    setBusy(true);
    try {
      const u = await login(email.trim(), password);
      showToast("Login successful!", "success");
      router.replace(safeNext(u.role === "admin"));
    } catch (err) {
      console.error(err);
      showToast(friendlyError(err), "error");
      setBusy(false);
    }
  }

  return (
    <main className="auth-page">
      <AuthSide
        title="Welcome back"
        text="One login for customers and garage staff. Your role decides which dashboard you see."
        points={["Track your service requests live", "Instant AI troubleshooting with Gemini", "Secure login: hashed passwords + httpOnly cookie"]}
      />
      <section className="auth-main">
        <div className="auth-card">
          <h1>Sign in</h1>
          <p className="sub">Enter your email and password to continue.</p>
          <form onSubmit={onSubmit} noValidate>
            <div className="form-group">
              <label htmlFor="email">Email address</label>
              <input id="email" type="email" autoComplete="email" placeholder="you@example.com"
                value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
            <div className="form-group">
              <label htmlFor="password">Password</label>
              <div className="input-wrap">
                <input id="password" type={showPass ? "text" : "password"} autoComplete="current-password" placeholder="••••••••"
                  value={password} onChange={(e) => setPassword(e.target.value)} required />
                <button type="button" className="toggle-pass" onClick={() => setShowPass((s) => !s)}>{showPass ? "Hide" : "Show"}</button>
              </div>
            </div>
            <div className="auth-row"><span className="muted small">Forgot password? Contact the garage admin.</span></div>
            <button type="submit" className="btn btn-primary btn-block" disabled={busy}>
              {busy ? <><ButtonSpinner /> Signing in...</> : "Sign in"}
            </button>
          </form>
          <p className="auth-foot">New customer? <Link href="/register">Create an account</Link></p>
          <p className="auth-foot"><Link href="/">← Back to home</Link></p>
          <div className="demo-note">
            <strong>Garage staff:</strong> accounts whose email is listed in the <code>ADMIN_EMAILS</code> environment variable
            become admins (DEMO_GUIDE.md, step 4). After login you are sent to the admin dashboard automatically.
          </div>
        </div>
      </section>
    </main>
  );
}
