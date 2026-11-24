"use client";
/* Sidebar + main layout for customer, AI assistant and admin pages */
import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Logo from "./Logo";
import { useAuth } from "@/lib/auth-context";
import { useToast } from "@/lib/toast-context";
import { friendlyError } from "@/lib/utils";

export default function DashboardShell({ section, items, title, subtitle, actions, children }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const { user, profile, logout } = useAuth();
  const showToast = useToast();
  const name = profile?.name || user?.email?.split("@")[0] || "User";

  async function handleLogout() {
    try {
      await logout("/");
    } catch (err) {
      showToast(friendlyError(err), "error");
    }
  }

  return (
    <div className="dash-body">
      <div className="dash-layout">
        <aside className={`sidebar ${open ? "open" : ""}`}>
          <Logo />
          <div>
            <p className="side-label">{section}</p>
            <ul className="side-nav">
              {items.map((it) => (
                <li key={it.href}>
                  <Link href={it.href} className={pathname === it.href ? "active" : ""} onClick={() => setOpen(false)}>
                    <span className="ico">{it.icon}</span> {it.label}
                  </Link>
                </li>
              ))}
              <li>
                <button type="button" onClick={handleLogout}><span className="ico">⎋</span> Logout</button>
              </li>
            </ul>
          </div>
          <div className="side-user">
            <div className="avatar">{name.charAt(0).toUpperCase()}</div>
            <div>
              <div className="u-name">{name}</div>
              <div className="u-mail">{user?.email}</div>
            </div>
          </div>
        </aside>
        <div className="sidebar-backdrop" onClick={() => setOpen(false)} />

        <main className="dash-main">
          <div className="dash-topbar" id="overview">
            <div>
              <h1>{title}</h1>
              {subtitle && <p>{subtitle}</p>}
            </div>
            <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
              {actions}
              <button className="mobile-menu-btn" aria-label="Open menu" onClick={() => setOpen((o) => !o)}>☰</button>
            </div>
          </div>
          {children}
        </main>
      </div>
    </div>
  );
}

export const CUSTOMER_NAV = [
  { href: "/dashboard", icon: "▦", label: "Dashboard" },
  { href: "/dashboard#new-request", icon: "＋", label: "New Service Request" },
  { href: "/dashboard#my-requests", icon: "☰", label: "My Requests" },
  { href: "/ai-assistant", icon: "✦", label: "AI Assistant" },
  { href: "/", icon: "⌂", label: "Home" }
];

export const ADMIN_NAV = [
  { href: "/admin", icon: "▦", label: "Overview" },
  { href: "/admin#requests-section", icon: "☰", label: "Service Requests" },
  { href: "/", icon: "⌂", label: "Website" }
];
