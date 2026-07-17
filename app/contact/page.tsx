"use client";

import { useState } from "react";
import Link from "next/link";
import ConvergenceOrbit from "@/components/ConvergenceOrbit";

const contactPoints = [
  { icon: "bi-envelope-fill", label: "Email", value: "hello@wasilisha.app" },
  { icon: "bi-telephone-fill", label: "Phone", value: "+254 700 000 000" },
  { icon: "bi-geo-alt-fill", label: "Location", value: "Nairobi, Kenya" },
];

export default function ContactPage() {
  const [formData, setFormData] = useState({ name: "", email: "", company: "", message: "" });
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    // TODO: wire to your actual endpoint, e.g. POST /api/contact
    await new Promise((r) => setTimeout(r, 600));
    setLoading(false);
    setSubmitted(true);
  };

  const inputStyle = {
    background: "var(--surface-2)",
    borderColor: "var(--border)",
    color: "var(--text)",
  };

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
            <Link href="/pricing" className="hover:opacity-80 transition" style={{ color: "var(--text-muted)" }}>
              Pricing
            </Link>
            <Link href="/contact" style={{ color: "var(--text)" }}>
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

      <section className="container mx-auto px-6 py-16 lg:py-20 grid lg:grid-cols-2 gap-16 items-start">
        {/* Left: info panel */}
        <div>
          <ConvergenceOrbit size={110} />
          <p className="uppercase tracking-[0.25em] text-xs mt-8 mb-4" style={{ color: "var(--text-faint)" }}>
            Contact
          </p>
          <h1 className="font-display text-4xl md:text-5xl mb-5 leading-[1.1]">
            Let&apos;s talk about <span className="italic" style={{ color: "var(--primary)" }}>your channels.</span>
          </h1>
          <p className="max-w-md mb-10" style={{ color: "var(--text-muted)" }}>
            Questions about pricing, a custom Scale plan, or just want a walkthrough
            before you commit? We respond within one business day.
          </p>

          <div className="space-y-3">
            {contactPoints.map((c) => (
              <div
                key={c.label}
                className="flex items-center gap-4 px-5 py-4 rounded-xl border"
                style={{ background: "var(--surface)", borderColor: "var(--border)" }}
              >
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
                  style={{ background: "rgba(139,92,246,0.12)" }}
                >
                  <i className={`bi ${c.icon}`} style={{ color: "var(--primary)", fontSize: 16 }} />
                </div>
                <div>
                  <div className="text-xs" style={{ color: "var(--text-faint)" }}>
                    {c.label}
                  </div>
                  <div className="text-sm font-medium" style={{ color: "var(--text)" }}>
                    {c.value}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right: form */}
        <div
          className="rounded-3xl border p-8 md:p-10"
          style={{ background: "var(--surface)", borderColor: "var(--border)" }}
        >
          {submitted ? (
            <div className="text-center py-12">
              <div
                className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-5"
                style={{ background: "rgba(52,211,153,0.12)" }}
              >
                <i className="bi bi-check-lg" style={{ color: "var(--whatsapp)", fontSize: 24 }} />
              </div>
              <h2 className="font-display text-2xl mb-2" style={{ color: "var(--text)" }}>
                Message sent
              </h2>
              <p className="text-sm" style={{ color: "var(--text-muted)" }}>
                Thanks — we&apos;ll get back to you within one business day.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--text-muted)" }}>
                    Name
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-lg border text-sm outline-none focus:border-[var(--primary)] transition"
                    style={inputStyle}
                    placeholder="Jane Doe"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--text-muted)" }}>
                    Company
                  </label>
                  <input
                    type="text"
                    value={formData.company}
                    onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-lg border text-sm outline-none focus:border-[var(--primary)] transition"
                    style={inputStyle}
                    placeholder="Acme Inc."
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--text-muted)" }}>
                  Email
                </label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-lg border text-sm outline-none focus:border-[var(--primary)] transition"
                  style={inputStyle}
                  placeholder="you@company.com"
                />
              </div>

              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--text-muted)" }}>
                  Message
                </label>
                <textarea
                  required
                  rows={5}
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-lg border text-sm outline-none focus:border-[var(--primary)] transition resize-none"
                  style={inputStyle}
                  placeholder="Tell us what you're looking to do…"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-lg font-medium text-sm transition hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ background: "linear-gradient(135deg, var(--warm), var(--primary))", color: "white" }}
              >
                {loading ? "Sending…" : "Send message"}
              </button>
            </form>
          )}
        </div>
      </section>
    </div>
  );
}