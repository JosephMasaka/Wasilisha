"use client";

import { useState } from "react";
import Link from "next/link";
import ConvergenceOrbit from "@/components/ConvergenceOrbit";

const rates = [
  { channel: "SMS", color: "var(--sms)", unit: "per message", price: "KES 0.80" },
  { channel: "Email", color: "var(--email)", unit: "per email", price: "KES 0.15" },
  { channel: "WhatsApp", color: "var(--whatsapp)", unit: "per conversation", price: "KES 2.50" },
];

const tiers = [
  {
    name: "Starter",
    tagline: "For businesses just getting going",
    monthly: 0,
    annual: 0,
    highlight: false,
    features: [
      "Pay-as-you-go wallet, no minimum",
      "Up to 3 team seats",
      "SMS, email & WhatsApp sending",
      "Basic delivery analytics",
      "Community support",
    ],
  },
  {
    name: "Growth",
    tagline: "For teams sending regularly",
    monthly: 4999,
    annual: 3999,
    highlight: true,
    features: [
      "Everything in Starter",
      "Lower per-message wallet rates",
      "Up to 10 team seats",
      "Automation workflows",
      "Campaign scheduling",
      "Priority support",
    ],
  },
  {
    name: "Scale",
    tagline: "For high-volume senders",
    monthly: null,
    annual: null,
    highlight: false,
    features: [
      "Everything in Growth",
      "Custom wallet rates",
      "Unlimited team seats",
      "Dedicated account manager",
      "Custom API integrations",
      "Uptime SLA",
    ],
  },
];

const faqs = [
  {
    q: "How does the wallet work?",
    a: "Top up once in KES and spend it across SMS, email, and WhatsApp — no separate balances or providers to juggle.",
  },
  {
    q: "Can I switch plans later?",
    a: "Yes, upgrade or downgrade anytime from your dashboard. Wallet balance carries over regardless of plan.",
  },
  {
    q: "Do unused wallet funds expire?",
    a: "No. Your balance stays available until you spend it, whether that's next week or next year.",
  },
  {
    q: "Is there a contract on Scale?",
    a: "Scale is custom-priced with terms based on volume — reach out and we'll put together a plan that fits.",
  },
];

export default function PricingPage() {
  const [annual, setAnnual] = useState(false);

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
            <Link href="/services" className="hover:opacity-80 transition" style={{ color: "var(--text-muted)" }}>
              Services
            </Link>
            <Link href="/pricing" style={{ color: "var(--text)" }}>
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
          <ConvergenceOrbit size={90} />
        </div>
        <p className="uppercase tracking-[0.25em] text-xs mb-4" style={{ color: "var(--text-faint)" }}>
          Pricing
        </p>
        <h1 className="font-display text-5xl mb-5">
          Simple pricing, <span className="italic" style={{ color: "var(--primary)" }}>one wallet.</span>
        </h1>
        <p className="max-w-xl mx-auto" style={{ color: "var(--text-muted)" }}>
          Top up once, send across every channel. No hidden fees, no per-provider contracts.
        </p>

        <div className="inline-flex items-center gap-3 mt-10 p-1 rounded-full border" style={{ borderColor: "var(--border)", background: "var(--surface)" }}>
          <button
            onClick={() => setAnnual(false)}
            className="px-4 py-2 rounded-full text-sm font-medium transition"
            style={{
              background: !annual ? "var(--surface-2)" : "transparent",
              color: !annual ? "var(--text)" : "var(--text-muted)",
            }}
          >
            Monthly
          </button>
          <button
            onClick={() => setAnnual(true)}
            className="px-4 py-2 rounded-full text-sm font-medium transition"
            style={{
              background: annual ? "var(--surface-2)" : "transparent",
              color: annual ? "var(--text)" : "var(--text-muted)",
            }}
          >
            Annual
            <span className="ml-1.5 text-xs" style={{ color: "var(--whatsapp)" }}>
              −20%
            </span>
          </button>
        </div>
      </section>

      {/* Tiers */}
      <section className="container mx-auto px-6 pb-24">
        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto items-start">
          {tiers.map((t) => (
            <div
              key={t.name}
              className="relative rounded-3xl border p-8"
              style={{
                background: t.highlight ? "var(--surface-2)" : "var(--surface)",
                borderColor: t.highlight ? "var(--primary)" : "var(--border)",
                boxShadow: t.highlight ? "0 0 0 1px var(--primary), 0 20px 40px -20px var(--primary-glow)" : "none",
              }}
            >
              {t.highlight && (
                <span
                  className="absolute -top-3 left-1/2 -translate-x-1/2 text-xs font-medium px-3 py-1 rounded-full"
                  style={{ background: "linear-gradient(135deg, var(--warm), var(--primary))", color: "white" }}
                >
                  Most popular
                </span>
              )}
              <h3 className="text-lg font-semibold mb-1" style={{ color: "var(--text)" }}>
                {t.name}
              </h3>
              <p className="text-sm mb-6" style={{ color: "var(--text-muted)" }}>
                {t.tagline}
              </p>

              <div className="mb-6">
                {t.monthly === null ? (
                  <span className="font-display text-3xl" style={{ color: "var(--text)" }}>
                    Custom
                  </span>
                ) : t.monthly === 0 ? (
                  <span className="font-display text-3xl" style={{ color: "var(--text)" }}>
                    Free
                  </span>
                ) : (
                  <div>
                    <span className="font-display text-3xl" style={{ color: "var(--text)" }}>
                      KES {(annual ? t.annual : t.monthly)?.toLocaleString()}
                    </span>
                    <span className="text-sm" style={{ color: "var(--text-faint)" }}>
                      {" "}/mo
                    </span>
                  </div>
                )}
              </div>

              <ul className="space-y-3 mb-8">
                {t.features.map((f) => (
                  <li key={f} className="flex items-start gap-2.5 text-sm" style={{ color: "var(--text-muted)" }}>
                    <i className="bi bi-check-circle-fill mt-0.5" style={{ color: t.highlight ? "var(--primary)" : "var(--whatsapp)", fontSize: 14 }} />
                    {f}
                  </li>
                ))}
              </ul>

              <Link
                href={t.monthly === null ? "/contact" : "/auth/signup"}
                className="block text-center w-full py-3 rounded-full text-sm font-medium transition hover:brightness-110"
                style={
                  t.highlight
                    ? { background: "linear-gradient(135deg, var(--warm), var(--primary))", color: "white" }
                    : { border: "1px solid var(--border-strong)", color: "var(--text)" }
                }
              >
                {t.monthly === null ? "Talk to sales" : "Get started"}
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* Wallet rates */}
      <section className="border-t py-20" style={{ borderColor: "var(--border)" }}>
        <div className="container mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="font-display text-3xl mb-3">Wallet rates by channel</h2>
            <p style={{ color: "var(--text-muted)" }}>
              Every plan uses the same pay-as-you-go wallet underneath.
            </p>
          </div>
          <div className="max-w-2xl mx-auto rounded-2xl border overflow-hidden" style={{ borderColor: "var(--border)" }}>
            {rates.map((r, i) => (
              <div
                key={r.channel}
                className="flex items-center justify-between px-6 py-5"
                style={{ background: "var(--surface)", borderTop: i === 0 ? "none" : "1px solid var(--border)" }}
              >
                <div className="flex items-center gap-3">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ background: r.color, boxShadow: `0 0 10px 1px ${r.color}` }} />
                  <span className="font-medium" style={{ color: "var(--text)" }}>
                    {r.channel}
                  </span>
                </div>
                <div className="text-right">
                  <span className="font-semibold" style={{ color: "var(--text)" }}>
                    {r.price}
                  </span>
                  <span className="text-sm ml-1.5" style={{ color: "var(--text-faint)" }}>
                    {r.unit}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20">
        <div className="container mx-auto px-6 max-w-2xl">
          <h2 className="font-display text-3xl text-center mb-10">Questions, answered</h2>
          <div className="space-y-3">
            {faqs.map((f) => (
              <details
                key={f.q}
                className="group rounded-2xl border px-6 py-4"
                style={{ background: "var(--surface)", borderColor: "var(--border)" }}
              >
                <summary className="flex items-center justify-between cursor-pointer list-none font-medium text-sm" style={{ color: "var(--text)" }}>
                  {f.q}
                  <i className="bi bi-plus transition group-open:rotate-45" style={{ color: "var(--text-faint)" }} />
                </summary>
                <p className="mt-3 text-sm leading-relaxed" style={{ color: "var(--text-muted)" }}>
                  {f.a}
                </p>
              </details>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}