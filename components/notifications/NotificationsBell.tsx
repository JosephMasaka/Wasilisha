"use client";

import { useEffect, useState, useRef } from "react";

interface NotificationItem {
  id: string;
  type: string;
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
}

export default function NotificationsBell() {
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const fetchNotifications = async () => {
    try {
      const res = await fetch("/api/notifications");
      if (res.ok) setItems(await res.json());
    } catch {
      // silent — a failed poll shouldn't disrupt the page
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 60_000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const unreadCount = items.filter((n) => !n.read).length;

  const markAllRead = async () => {
    const unreadIds = items.filter((n) => !n.read).map((n) => n.id);
    if (unreadIds.length === 0) return;
    setItems((prev) => prev.map((n) => ({ ...n, read: true })));
    await fetch("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids: unreadIds }),
    });
  };

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        aria-label="Notifications"
        className="relative w-9 h-9 rounded-lg flex items-center justify-center transition"
        style={{ color: "var(--text-muted)" }}
        onMouseEnter={(e) => (e.currentTarget.style.background = "var(--surface-2)")}
        onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
      >
        <i className="bi bi-bell" style={{ fontSize: 16 }} />
        {unreadCount > 0 && (
          <span
            className="absolute top-1 right-1 w-2 h-2 rounded-full"
            style={{ background: "var(--warm)", boxShadow: "0 0 6px 1px var(--warm)" }}
          />
        )}
      </button>

      {open && (
        <div
          className="absolute right-0 mt-2 w-80 rounded-2xl border overflow-hidden z-30"
          style={{ background: "var(--bg-elevated)", borderColor: "var(--border)" }}
        >
          <div className="flex items-center justify-between px-4 py-3 border-b" style={{ borderColor: "var(--border)" }}>
            <span className="text-sm font-medium" style={{ color: "var(--text)" }}>Notifications</span>
            {unreadCount > 0 && (
              <button onClick={markAllRead} className="text-xs hover:underline" style={{ color: "var(--primary)" }}>
                Mark all read
              </button>
            )}
          </div>
          <div className="max-h-80 overflow-y-auto">
            {items.length === 0 ? (
              <p className="text-sm px-4 py-6 text-center" style={{ color: "var(--text-faint)" }}>
                No notifications yet
              </p>
            ) : (
              items.map((n) => (
                <div
                  key={n.id}
                  className="px-4 py-3 border-t first:border-t-0"
                  style={{ borderColor: "var(--border)", background: n.read ? "transparent" : "rgba(139,92,246,0.05)" }}
                >
                  <div className="flex items-start gap-2">
                    {!n.read && <span className="w-1.5 h-1.5 rounded-full mt-1.5 shrink-0" style={{ background: "var(--warm)" }} />}
                    <div>
                      <div className="text-sm font-medium" style={{ color: "var(--text)" }}>{n.title}</div>
                      <div className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>{n.message}</div>
                      <div className="text-xs mt-1" style={{ color: "var(--text-faint)" }}>
                        {new Date(n.createdAt).toLocaleString()}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}