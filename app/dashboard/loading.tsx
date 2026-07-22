export default function DashboardLoading() {
  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="h-9 w-48 rounded-lg animate-pulse" style={{ background: "var(--surface-2)" }} />
          <div className="h-6 w-64 mt-2 rounded-lg animate-pulse" style={{ background: "var(--surface-2)" }} />
        </div>
        <div className="h-10 w-32 rounded-full animate-pulse" style={{ background: "var(--surface-2)" }} />
      </div>

      {/* Quick actions skeleton */}
      <div className="flex flex-wrap gap-3">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-10 w-36 rounded-xl animate-pulse"
            style={{ background: "var(--surface-2)" }}
          />
        ))}
      </div>

      {/* Wallet skeleton */}
      <div className="h-48 rounded-lg animate-pulse" style={{ background: "var(--surface-2)" }} />

      {/* Stats skeleton */}
      <div className="grid md:grid-cols-3 gap-5">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="rounded-2xl p-6 h-32 animate-pulse"
            style={{ background: "var(--surface-2)" }}
          />
        ))}
      </div>

      {/* Recent transactions skeleton */}
      <div className="rounded-2xl border overflow-hidden" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
        <div className="flex items-center justify-between px-6 py-5 border-b" style={{ borderColor: "var(--border)" }}>
          <div className="h-6 w-48 rounded animate-pulse" style={{ background: "var(--surface-2)" }} />
          <div className="h-5 w-20 rounded animate-pulse" style={{ background: "var(--surface-2)" }} />
        </div>
        <div className="px-6 py-4 space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full animate-pulse" style={{ background: "var(--surface-2)" }} />
                <div className="space-y-2">
                  <div className="h-4 w-32 rounded animate-pulse" style={{ background: "var(--surface-2)" }} />
                  <div className="h-3 w-24 rounded animate-pulse" style={{ background: "var(--surface-2)" }} />
                </div>
              </div>
              <div className="h-5 w-20 rounded animate-pulse" style={{ background: "var(--surface-2)" }} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
