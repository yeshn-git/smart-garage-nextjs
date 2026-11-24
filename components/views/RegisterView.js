"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { useToast } from "@/lib/toast-context";
import { friendlyError } from "@/lib/utils";
import AuthSide from "../AuthSide";
import { ButtonSpinner } from "../Loader";

export default function RegisterView() {
  const router = useRouter();
  const showToast = useToast();
  const { user, isAdmin, loading, register } = useAuth();
  const [form, setForm] = useState({ name: "", phone: "", email: "", password: "", confirm: "" });
  const [showPass, setShowPass] = useState(false);
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  useEffect(() => {
    if (!loading && user && !busy) router.replace(isAdmin ? "/admin" : "/dashboard");
  }, [loading, user, isAdmin, busy, router]);

  async function onSubmit(e) {
    e.preventDefault();
    const name = form.name.trim();
    const phone = form.phone.trim();
    const email = form.email.trim();
    if (name.length < 2) return showToast("Please enter your full name.", "warning");
    if (!/^[0-9+\-\s]{10,15}$/.test(phone)) return showToast("Enter a valid phone number (10–15 digits).", "warning");
    if (form.password.length < 6) return showToast("Password must be at least 6 characters.", "warning");
    if (form.password !== form.confirm) return showToast("Passwords do not match.", "warning");

    setBusy(true);
    try {
      const u = await register({ name, phone, email, password: form.password });
      showToast("Account created! Redirecting...", "success");
      router.replace(u.role === "admin" ? "/admin" : "/dashboard");
    } catch (err) {
      console.error(err);
      showToast(friendlyError(err), "error");
      setBusy(false);
    }
  }

  return (
    <main className="auth-page">
      <AuthSide
        title="Service made simple"
        text="Create a free customer account to book services and use the AI vehicle assistant."
        points={["AI-generated possible causes & first steps", "Upload a photo of the issue", "Live status: Pending → In Progress → Completed"]}
      />
      <section className="auth-main">
        <div className="auth-card">
          <h1>Create account</h1>
          <p className="sub">It takes less than a minute.</p>
          <form onSubmit={onSubmit} noValidate>
            <div className="form-group">
              <label htmlFor="name">Full name <span className="req">*</span></label>
              <input id="name" autoComplete="name" placeholder="e.g. Rahul Kumar" value={form.name} onChange={set("name")} maxLength={80} />
            </div>
            <div className="form-group">
              <label htmlFor="phone">Phone number <span className="req">*</span></label>
              <input id="phone" type="tel" autoComplete="tel" placeholder="e.g. 9876543210" value={form.phone} onChange={set("phone")} maxLength={15} />
            </div>
            <div className="form-group">
              <label htmlFor="email">Email address <span className="req">*</span></label>
              <input id="email" type="email" autoComplete="email" placeholder="you@example.com" value={form.email} onChange={set("email")} />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="password">Password <span className="req">*</span></label>
                <div className="input-wrap">
                  <input id="password" type={showPass ? "text" : "password"} autoComplete="new-password" placeholder="Min 6 characters"
                    value={form.password} onChange={set("password")} />
                  <button type="button" className="toggle-pass" onClick={() => setShowPass((s) => !s)}>{showPass ? "Hide" : "Show"}</button>
                </div>
              </div>
              <div className="form-group">
                <label htmlFor="confirm">Confirm password <span className="req">*</span></label>
                <input id="confirm" type="password" autoComplete="new-password" placeholder="Repeat password" value={form.confirm} onChange={set("confirm")} />
              </div>
            </div>
            <button type="submit" className="btn btn-primary btn-block" disabled={busy}>
              {busy ? <><ButtonSpinner /> Creating account...</> : "Create account"}
            </button>
          </form>
          <p className="auth-foot">Already have an account? <Link href="/login">Sign in</Link></p>
          <p className="auth-foot"><Link href="/">← Back to home</Link></p>
        </div>
      </section>
    </main>
  );
}
