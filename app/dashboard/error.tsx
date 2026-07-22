"use client";

import { useEffect } from "react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Dashboard error:", error);
  }, [error]);

  return (
    <div className="space-y-8">
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <div
          className="rounded-2xl border p-8 text-center max-w-md"
          style={{ background: "var(--surface)", borderColor: "var(--border)" }}
        >
          <svg
            width="48"
            height="48"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="mx-auto mb-4"
            style={{ color: "var(--text-faint)" }}
          >
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          <h2 className="text-xl font-semibold mb-2" style={{ color: "var(--text)" }}>
            Something went wrong
          </h2>
          <p className="text-sm mb-1" style={{ color: "var(--text-muted)" }}>
            {error.message || "An unexpected error occurred while loading the dashboard."}
          </p>
          {error.digest && (
            <p className="text-xs mb-4" style={{ color: "var(--text-faint)" }}>
              Error ID: {error.digest}
            </p>
          )}
          <div className="flex gap-3 justify-center mt-6">
            <button
              onClick={() => reset()}
              className="px-5 py-2.5 rounded-full text-sm font-medium transition hover:brightness-110"
              style={{ background: "linear-gradient(135deg, var(--warm), var(--primary))", color: "white" }}
            >
              Try again
            </button>
            <a
              href="/dashboard"
              className="px-5 py-2.5 rounded-full text-sm font-medium transition border"
              style={{ borderColor: "var(--border)", color: "var(--text)" }}
            >
              Go to dashboard
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
