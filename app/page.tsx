import Link from "next/link";
import ConvergenceOrbit from "@/components/ConvergenceOrbit";

const channels = [
  {
    color: "var(--sms)",
    name: "Bulk SMS",
    body: "Kenya-optimized routing through Africa's Talking, with delivery reports in real time.",
    icon: "bi bi-chat-left-text"
  },
  {
    color: "var(--email)",
    name: "Email campaigns",
    body: "Send, track, and analyze professional campaigns — opens, clicks, and bounces in one view.",
    icon: "bi bi-envelope-at"
  },
  {
    color: "var(--whatsapp)",
    name: "WhatsApp Business",
    body: "Talk to customers where they already are, on Meta's official Business Cloud API.",
    icon: "bi bi-whatsapp"
  },
];

export default function HomePage() {
  return (
    <div className="min-h-screen" style={{ background: "var(--bg)", color: "var(--text)" }}>
      <header
        className="sticky top-0 z-50 border-b"
        style={{
          borderColor: "var(--border)",
          background: "rgba(11,10,20,0.75)",
          backdropFilter: "blur(12px)",
        }}
      >
        <div className="container mx-auto px-6 h-20 flex items-center justify-between relative">
          {/* Logo */}
          <Link href="/" className="font-display text-2xl italic font-semibold">
            Wasilisha
          </Link>

          {/* Center Navigation */}
          <nav className="absolute left-1/2 -translate-x-1/2 hidden md:flex items-center gap-10 text-sm font-medium">
            <Link
              href="/"
              className="transition hover:text-white"
              style={{ color: "var(--text-muted)" }}
            >
              Home
            </Link>

            <Link
              href="/services"
              className="transition hover:text-white"
              style={{ color: "var(--text-muted)" }}
            >
              Services
            </Link>

            <Link
              href="/pricing"
              className="transition hover:text-white"
              style={{ color: "var(--text-muted)" }}
            >
              Pricing
            </Link>

            <Link
              href="/contact"
              className="transition hover:text-white"
              style={{ color: "var(--text-muted)" }}
            >
              Contact
            </Link>
          </nav>

          {/* Right CTA */}
          <div className="flex items-center gap-4">
            <Link
              href="/auth/signup"
              className="px-5 py-2.5 rounded-full text-sm font-semibold transition hover:scale-105"
              style={{
                background:
                  "linear-gradient(135deg, var(--primary), var(--primary-dim))",
                color: "white",
              }}
            >
              Get Started
            </Link>
          </div>
        </div>
      </header>

      <section className="container mx-auto px-6 pt-20 pb-24 grid lg:grid-cols-2 gap-16 items-center">
        <div className="animate-fade-up">
          <p className="text-xs tracking-[0.2em] uppercase mb-4" style={{ color: "var(--text-faint)" }}>
            SMS · Email · WhatsApp
          </p>
          <h1 className="font-display text-5xl md:text-6xl leading-[1.05] mb-6">
            Reach every channel.
            <br />
            <span className="italic" style={{ color: "var(--primary)" }}>One platform.</span>
          </h1>
          <p className="text-lg mb-10 max-w-md" style={{ color: "var(--text-muted)" }}>
            One wallet, one contact list, one dashboard for every message you send —
            built for how East African businesses actually communicate.
          </p>
          <div className="flex gap-4">
            <Link
              href="/auth/signup"
              className="px-7 py-3 rounded-full font-medium transition hover:brightness-110"
              style={{ background: "linear-gradient(135deg, var(--warm), var(--primary))", color: "white" }}
            >
              Get started free
            </Link>
            <Link
              href="/auth/signin"
              className="px-7 py-3 rounded-full font-medium border transition hover:border-white/30"
              style={{ borderColor: "var(--border-strong)", color: "var(--text)" }}
            >
              Sign in
            </Link>
          </div>
        </div>

        <div className="flex justify-center animate-fade-up" style={{ animationDelay: "0.15s" }}>
          <ConvergenceOrbit size={280} />
        </div>
      </section>

      <section className="container mx-auto px-6 pb-24">
        <div className="grid md:grid-cols-3 gap-6">
          {channels.map((c) => (
            <div
              key={c.name}
              className="rounded-2xl p-6 border transition hover:border-white/20"
              style={{ background: "var(--surface)", borderColor: "var(--border)" }}
            >
              <i className={c.icon} style={{ fontSize: `35px`, color: c.color }}></i>
              <div
                className="h-1 w-10 rounded-full mb-5"
                style={{ background: c.color, boxShadow: `0 0 12px 1px ${c.color}` }}
              />
              <h3 className="text-lg font-semibold mb-2">{c.name}</h3>
              <p className="text-sm leading-relaxed" style={{ color: "var(--text-muted)" }}>
                {c.body}
              </p>
            </div>
          ))}
        </div>
      </section>

 <section className="py-24 border-t" style={{ borderColor: "var(--border)" }}>
  <div className="container mx-auto px-6">
    <div className="text-center mb-14">
      <p className="uppercase tracking-[0.25em] text-xs mb-3" style={{ color: "var(--text-faint)" }}>
        Why Wasilisha
      </p>
      <h2 className="font-display text-4xl mb-4">
        What makes <span style={{ color: "var(--primary)" }}>Wasilisha</span> different?
      </h2>
      <p className="max-w-2xl mx-auto" style={{ color: "var(--text-muted)" }}>
        Unlike traditional messaging platforms, Wasilisha brings every customer
        communication channel into one modern, affordable platform built for
        African businesses.
      </p>
    </div>

    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
      {[
        {
          icon: "bi-wallet2",
          color: "var(--primary)",
          title: "One wallet",
          body: "Top up once and send SMS, email, and WhatsApp campaigns from a single unified balance.",
        },
        {
          icon: "bi-speedometer2",
          color: "var(--warm)",
          title: "Lightning fast",
          body: "High-speed delivery with real-time reporting and campaign analytics.",
        },
        {
          icon: "bi-shield-check",
          color: "var(--whatsapp)",
          title: "Enterprise security",
          body: "Bank-grade security, encrypted APIs, and role-based access for your teams.",
        },
        {
          icon: "bi-graph-up-arrow",
          color: "var(--email)",
          title: "Actionable insights",
          body: "Understand delivery, engagement, and campaign performance from one dashboard.",
        },
      ].map((f) => (
        <div
          key={f.title}
          className="feature-card group relative rounded-3xl border p-8 overflow-hidden transition-all duration-300 hover:-translate-y-1.5"
          style={
            {
              "--glow": f.color,
              background: "var(--surface)",
              borderColor: "var(--border)",
            } as React.CSSProperties
          }
        >
          <div
            className="absolute top-0 left-8 right-8 h-px"
            style={{ background: `linear-gradient(90deg, transparent, ${f.color}, transparent)` }}
          />
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center mb-6 border"
            style={{ background: `${f.color}1a`, borderColor: `${f.color}33` }}
          >
            <i className={`bi ${f.icon}`} style={{ fontSize: 24, color: f.color }} />
          </div>
          <h3 className="font-semibold text-xl mb-3" style={{ color: "var(--text)" }}>
            {f.title}
          </h3>
          <p className="text-sm leading-relaxed" style={{ color: "var(--text-muted)" }}>
            {f.body}
          </p>
        </div>
      ))}
    </div>
  </div>
</section>

<section className="py-10">
  <div className="container mx-auto px-6">
    <div
      className="relative rounded-[40px] p-12 md:p-16 text-center overflow-hidden border"
      style={{
        background: "linear-gradient(160deg, var(--surface) 0%, var(--bg-elevated) 100%)",
        borderColor: "var(--border-strong)",
      }}
    >
      {/* ambient glow, echoes the orbit motif used elsewhere */}
      <div
        className="pointer-events-none absolute -top-24 left-1/2 -translate-x-1/2 w-[520px] h-[320px] rounded-full"
        style={{ background: "radial-gradient(circle, var(--primary-glow), transparent 70%)" }}
      />

      <div className="relative">
        <div
          className="w-16 h-16 rounded-2xl mx-auto flex items-center justify-center mb-6 border"
          style={{ background: "rgba(139,92,246,0.12)", borderColor: "rgba(139,92,246,0.3)" }}
        >
          <i className="bi bi-envelope-paper-heart-fill" style={{ fontSize: 26, color: "var(--primary)" }} />
        </div>

        <h2 className="font-display text-4xl mb-4" style={{ color: "var(--text)" }}>
          Stay in the loop
        </h2>

        <p className="max-w-xl mx-auto mb-10" style={{ color: "var(--text-muted)" }}>
          Product updates, feature releases, communication tips, and
          exclusive offers from Wasilisha — no spam, unsubscribe anytime.
        </p>

        <form className="max-w-md mx-auto flex flex-col sm:flex-row gap-3">
          <input
            type="email"
            required
            placeholder="Enter your email address"
            className="flex-1 rounded-full px-6 py-3.5 text-sm border outline-none focus:ring-2 transition"
            style={{ background: "var(--surface-2)", borderColor: "var(--border)", color: "var(--text)" }}
          />
          <button
            type="submit"
            className="rounded-full px-8 py-3.5 text-sm font-semibold transition hover:brightness-110 whitespace-nowrap"
            style={{ background: "linear-gradient(135deg, var(--warm), var(--primary))", color: "white" }}
          >
            Subscribe
          </button>
        </form>
      </div>
    </div>
  </div>
</section>

      
    </div>
  );
}