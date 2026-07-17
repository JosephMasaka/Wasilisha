import Link from "next/link";
import ConvergenceOrbit from "@/components/ConvergenceOrbit";

const coreServices = [
  {
    key: "sms",
    icon: "bi-chat-dots-fill",
    color: "var(--sms)",
    name: "Bulk SMS",
    body: "Send transactional and promotional SMS at scale, with Kenya-optimized routing through Africa's Talking and real-time delivery reports.",
    points: ["Sender ID registration handled for you", "Delivery reports in real time", "Two-way SMS for replies & opt-outs", "Scheduled & recurring sends"],
  },
  {
    key: "email",
    icon: "bi-envelope-fill",
    color: "var(--email)",
    name: "Email campaigns",
    body: "Design, send, and track professional email campaigns without juggling a separate ESP — opens, clicks, and bounces live in the same dashboard.",
    points: ["Drag-and-drop template builder", "Open & click tracking", "Bounce & unsubscribe handling", "Segmented contact lists"],
  },
  {
    key: "whatsapp",
    icon: "bi-whatsapp",
    color: "var(--whatsapp)",
    name: "WhatsApp Business",
    body: "Reach customers on the channel they actually check, using Meta's official WhatsApp Business Cloud API — fully compliant, no gray-market gateways.",
    points: ["Approved message templates", "Two-way conversations", "Media, buttons & quick replies", "Official Meta Business verification"],
  },
];

const supporting = [
  {
    icon: "bi-lightning-charge-fill",
    color: "var(--primary)",
    name: "Automation",
    body: "Trigger messages off events — welcome flows, reminders, re-engagement — without writing code.",
  },
  {
    icon: "bi-graph-up-arrow",
    color: "var(--warm)",
    name: "Analytics & insights",
    body: "One dashboard for delivery, engagement, and spend across every channel you send from.",
  },
  {
    icon: "bi-plug-fill",
    color: "var(--primary)",
    name: "API & integrations",
    body: "Plug Wasilisha into your own product or CRM with a straightforward REST API and webhooks.",
  },
];

export default function ServicesPage() {
  return (
    <div className="min-h-screen" style={{ background: "var(--bg)", color: "var(--text)" }}>
      <header
        className="sticky top-0 z-10 border-b"
        style={{ borderColor: "var(--border)", background: "rgba(11,10,20,0.75)", backdropFilter: "blur(12px)" }}
      >
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="font-display text-xl italic" style={{ color: "var(--text)" }}>
            Wasilisha
          </Link>
          <nav className="flex items-center gap-6 text-sm">
            <Link href="/services" style={{ color: "var(--text)" }}>
              Services
            </Link>
            <Link href="/pricing" className="hover:opacity-80 transition" style={{ color: "var(--text-muted)" }}>
              Pricing
            </Link>
            <Link href="/contact" className="hover:opacity-80 transition" style={{ color: "var(--text-muted)" }}>
              Contact
            </Link>
            <Link href="/auth/signin" className="hover:opacity-80 transition" style={{ color: "var(--text-muted)" }}>
              Sign in
            </Link>
            <Link
              href="/auth/signup"
              className="px-4 py-2 rounded-full text-sm font-medium transition hover:brightness-110"
              style={{ background: "linear-gradient(135deg, var(--primary), var(--primary-dim))", color: "white" }}
            >
              Get started
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section className="container mx-auto px-6 pt-20 pb-16 text-center">
        <div className="flex justify-center mb-6">
          <ConvergenceOrbit size={100} />
        </div>
        <p className="uppercase tracking-[0.25em] text-xs mb-4" style={{ color: "var(--text-faint)" }}>
          Services
        </p>
        <h1 className="font-display text-5xl mb-5">
          Every channel, <span className="italic" style={{ color: "var(--primary)" }}>done properly.</span>
        </h1>
        <p className="max-w-xl mx-auto" style={{ color: "var(--text-muted)" }}>
          Three sending channels, one platform, built specifically for how East African businesses reach customers.
        </p>
      </section>

      {/* Core services — alternating rows */}
      <section className="container mx-auto px-6 pb-20 space-y-6">
        {coreServices.map((s, i) => (
          <div
            key={s.key}
            className="grid md:grid-cols-2 gap-10 items-center rounded-3xl border p-10 md:p-12"
            style={{ background: "var(--surface)", borderColor: "var(--border)" }}
          >
            <div className={i % 2 === 1 ? "md:order-2" : ""}>
              <div
                className="w-14 h-14 rounded-2xl flex items-center justify-center mb-6 border"
                style={{ background: `${s.color}1a`, borderColor: `${s.color}33` }}
              >
                <i className={`bi ${s.icon}`} style={{ fontSize: 24, color: s.color }} />
              </div>
              <h2 className="font-display text-2xl mb-3" style={{ color: "var(--text)" }}>
                {s.name}
              </h2>
              <p className="text-sm leading-relaxed mb-6" style={{ color: "var(--text-muted)" }}>
                {s.body}
              </p>
              <Link
                href="/auth/signup"
                className="inline-flex items-center gap-2 text-sm font-medium hover:underline"
                style={{ color: s.color }}
              >
                Start sending {s.name.toLowerCase()}
                <i className="bi bi-arrow-right" />
              </Link>
            </div>

            <div className={i % 2 === 1 ? "md:order-1" : ""}>
              <ul className="space-y-3">
                {s.points.map((p) => (
                  <li
                    key={p}
                    className="flex items-start gap-3 text-sm px-4 py-3 rounded-xl border"
                    style={{ background: "var(--surface-2)", borderColor: "var(--border)", color: "var(--text-muted)" }}
                  >
                    <i className="bi bi-check-circle-fill mt-0.5" style={{ color: s.color, fontSize: 14 }} />
                    {p}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ))}
      </section>

      {/* Supporting services */}
      <section className="border-t py-20" style={{ borderColor: "var(--border)" }}>
        <div className="container mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="font-display text-3xl mb-3">What holds it together</h2>
            <p style={{ color: "var(--text-muted)" }}>
              The tools that turn three channels into one operation.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {supporting.map((s) => (
              <div
                key={s.name}
                className="rounded-2xl border p-7"
                style={{ background: "var(--surface)", borderColor: "var(--border)" }}
              >
                <i className={`bi ${s.icon}`} style={{ fontSize: 26, color: s.color }} />
                <h3 className="font-semibold text-lg mt-4 mb-2" style={{ color: "var(--text)" }}>
                  {s.name}
                </h3>
                <p className="text-sm leading-relaxed" style={{ color: "var(--text-muted)" }}>
                  {s.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-10 pb-24">
        <div className="container mx-auto px-6">
          <div
            className="relative rounded-[40px] p-12 md:p-16 text-center overflow-hidden border"
            style={{
              background: "linear-gradient(160deg, var(--surface) 0%, var(--bg-elevated) 100%)",
              borderColor: "var(--border-strong)",
            }}
          >
            <div
              className="pointer-events-none absolute -top-24 left-1/2 -translate-x-1/2 w-[520px] h-[320px] rounded-full"
              style={{ background: "radial-gradient(circle, var(--primary-glow), transparent 70%)" }}
            />
            <div className="relative">
              <h2 className="font-display text-3xl mb-4" style={{ color: "var(--text)" }}>
                Ready to reach every channel?
              </h2>
              <p className="max-w-md mx-auto mb-8" style={{ color: "var(--text-muted)" }}>
                Set up your wallet and send your first campaign in minutes.
              </p>
              <Link
                href="/auth/signup"
                className="inline-block px-8 py-3.5 rounded-full text-sm font-semibold transition hover:brightness-110"
                style={{ background: "linear-gradient(135deg, var(--warm), var(--primary))", color: "white" }}
              >
                Get started free
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}