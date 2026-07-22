"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import NotificationsBell from "@/components/notifications/NotificationsBell";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: "M4 12l8-8 8 8M6 10v10h4v-6h4v6h4V10" },
  { href: "/dashboard/contacts", label: "Contacts", icon: "M16 19h6v-1a4 4 0 00-3-3.87M8 19H2v-1a4 4 0 013-3.87m7-1.13a4 4 0 10-4-4 4 4 0 004 4z" },
  { href: "/dashboard/campaigns", label: "Campaigns", icon: "M3 8l9 6 9-6M4 6h16v12H4z" },
  { href: "/dashboard/templates", label: "Templates", icon: "M8 7V5a2 2 0 012-2h4a2 2 0 012 2v2m-9 0h10a1 1 0 011 1v11a1 1 0 01-1 1H7a1 1 0 01-1-1V8a1 1 0 011-1z" },
  { href: "/dashboard/subscription", label: "Subscription", icon: "M3 7a2 2 0 012-2h14a2 2 0 012 2v10a2 2 0 01-2 2H5a2 2 0 01-2-2V7zm0 4h18" },
  { href: "/dashboard/usage", label: "Usage", icon: "M4 20V10m6 10V4m6 16v-7m6 7v-4" },
  { href: "/dashboard/analytics", label: "Analytics", icon: "M3 17l6-6 4 4 8-8M15 7h6v6" },
  { href: "/dashboard/automation", label: "Automation", icon: "M13 2L4.5 13.5H11L10 22l9-11.5H12.5z" },
  // { href: "/dashboard/notifications", label: "Notifications", icon: "M13 2L4.5 13.5H11L10 22l9-11.5H12.5z" },
];

function NavList({
  pathname,
  onNavigate,
}: {
  pathname: string | null;
  onNavigate?: () => void;
}) {
  const isActive = (href: string) =>
    href === "/dashboard" ? pathname === href : !!pathname?.startsWith(href);

  return (
    <nav className="flex flex-col gap-1">
      {navItems.map((item) => {
        const active = isActive(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition relative"
            style={{
              background: active ? "var(--surface-2)" : "transparent",
              color: active ? "var(--text)" : "var(--text-muted)",
            }}
          >
            {active && (
              <span
                className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 rounded-full"
                style={{ background: "var(--primary)" }}
              />
            )}
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
              <path d={item.icon} />
            </svg>
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

export default function DashboardNav({
  companyName,
  signOutSlot,
}: {
  companyName: string;
  signOutSlot: React.ReactNode;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* Mobile top bar */}
      <div
        className="lg:hidden flex items-center justify-between px-4 h-14 border-b sticky top-0 z-20"
        style={{ background: "var(--bg-elevated)", borderColor: "var(--border)" }}
      >
        <button onClick={() => setOpen(true)} aria-label="Open menu" style={{ color: "var(--text)" }}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round">
            <path d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
        <span className="font-display text-lg italic" style={{ color: "var(--text)" }}>
          Wasilisha
        </span>
        <NotificationsBell />
      </div>

      {/* Mobile drawer */}
      {open && (
        <div className="lg:hidden fixed inset-0 z-30 flex">
          <div className="absolute inset-0" style={{ background: "rgba(0,0,0,0.5)" }} onClick={() => setOpen(false)} />
          <div className="relative w-64 h-full flex flex-col p-5" style={{ background: "var(--bg-elevated)" }}>
            <button
              onClick={() => setOpen(false)}
              className="self-end mb-4"
              style={{ color: "var(--text-faint)" }}
              aria-label="Close menu"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round">
                <path d="M6 6l12 12M18 6L6 18" />
              </svg>
            </button>
            <NavList pathname={pathname} onNavigate={() => setOpen(false)} />
            <div className="mt-auto pt-6 border-t" style={{ borderColor: "var(--border)" }}>
              <div className="px-2 text-sm mb-3 truncate" style={{ color: "var(--text-muted)" }}>
                {companyName}
              </div>
              {signOutSlot}
            </div>
          </div>
        </div>
      )}

      {/* Desktop sidebar */}
      <aside
        className="hidden lg:flex flex-col w-60 shrink-0 h-screen sticky top-0 border-r px-4 py-6"
        style={{ background: "var(--bg-elevated)", borderColor: "var(--border)" }}
      >
        <Link href="/dashboard" className="font-display text-xl italic mb-8 px-2" style={{ color: "var(--text)" }}>
          Wasilisha
        </Link>
        <NavList pathname={pathname} />
        <div className="mt-auto pt-6 border-t" style={{ borderColor: "var(--border)" }}>
          <div className="px-2 text-sm mb-3 truncate" style={{ color: "var(--text-muted)" }}>
            {companyName}
          </div>
          {signOutSlot}
        </div>
      </aside>
    </>
  );
}