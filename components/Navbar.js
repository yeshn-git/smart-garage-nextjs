"use client";
/* Public navbar (home page) - changes when the user is logged in */
import { useEffect, useState } from "react";
import Link from "next/link";
import Logo from "./Logo";
import { useAuth } from "@/lib/auth-context";

export default function Navbar() {
  const { user, isAdmin, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const close = () => setOpen(false);
  return (
    <header className={`navbar ${scrolled ? "scrolled" : ""}`}>
      <div className="container nav-inner">
        <Logo />
        <button className="nav-toggle" aria-label="Open menu" aria-expanded={open} onClick={() => setOpen((o) => !o)}>☰</button>
        <ul className={`nav-links ${open ? "open" : ""}`}>
          <li><a href="#features" onClick={close}>Features</a></li>
          <li><a href="#how" onClick={close}>How it works</a></li>
          <li><a href="#architecture" onClick={close}>Architecture</a></li>
          {user ? (
            <>
              <li><Link href={isAdmin ? "/admin" : "/dashboard"} className="btn btn-primary btn-sm">My Dashboard</Link></li>
              <li><button className="link-btn" style={{ color: "rgba(255,255,255,.82)" }} onClick={() => { close(); logout(); }}>Logout</button></li>
            </>
          ) : (
            <>
              <li><Link href="/login">Login</Link></li>
              <li><Link href="/register" className="btn btn-primary btn-sm">Get Started</Link></li>
            </>
          )}
        </ul>
      </div>
    </header>
  );
}

export function HeroButtons() {
  const { user, isAdmin } = useAuth();
  return (
    <div className="hero-cta">
      {user
        ? <Link href={isAdmin ? "/admin" : "/dashboard"} className="btn btn-primary">Open Dashboard</Link>
        : <Link href="/register" className="btn btn-primary">Book a Service</Link>}
      <Link href="/ai-assistant" className="btn btn-ghost">Try AI Assistant</Link>
    </div>
  );
}

export function CtaButton() {
  const { user, isAdmin } = useAuth();
  return user
    ? <Link href={isAdmin ? "/admin" : "/dashboard"} className="btn btn-light">Go to Dashboard</Link>
    : <Link href="/register" className="btn btn-light">Create Free Account</Link>;
}
