"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Contact } from "@prisma/client";

export default function EditContactForm({ contact }: { contact: Contact }) {
  const router = useRouter();
  const [formData, setFormData] = useState({
    phone: contact.phone || "",
    email: contact.email || "",
    whatsappId: contact.whatsappId || "",
    tags: contact.tags.join(", "),
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch(`/api/contacts/${contact.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone: formData.phone,
          email: formData.email || null,
          whatsappId: formData.whatsappId || null,
          tags: formData.tags
            ? formData.tags.split(",").map((t) => t.trim()).filter(Boolean)
            : [],
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to update contact");
      }

      router.push("/dashboard/contacts");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const tagList = formData.tags
    ? formData.tags.split(",").map((t) => t.trim()).filter(Boolean)
    : [];

  const inputStyle = {
    background: "var(--surface-2)",
    borderColor: "var(--border)",
    color: "var(--text)",
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <Link
          href="/dashboard/contacts"
          className="inline-flex items-center gap-1.5 text-sm font-medium hover:opacity-80 transition"
          style={{ color: "var(--primary)" }}
        >
          <i className="bi bi-arrow-left" />
          Back to contacts
        </Link>
      </div>

      <div className="rounded-2xl border p-8" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
        <h1 className="font-display text-2xl mb-2" style={{ color: "var(--text)" }}>
          Edit contact
        </h1>
        <p className="mb-6" style={{ color: "var(--text-muted)" }}>
          Update this contact&apos;s details
        </p>

        {error && (
          <div
            className="text-sm p-4 rounded-lg mb-5 border"
            style={{ background: "rgba(239,68,68,0.08)", borderColor: "rgba(239,68,68,0.25)", color: "#fca5a5" }}
          >
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="flex items-center gap-2 text-xs font-medium mb-1.5" style={{ color: "var(--text-muted)" }}>
              <span className="w-1.5 h-1.5 rounded-full" style={{ background: "var(--sms)" }} />
              Phone number *
            </label>
            <input
              type="tel"
              required
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className="w-full px-4 py-2.5 rounded-lg border text-sm outline-none focus:border-[var(--primary)] transition"
              style={inputStyle}
              placeholder="0712345678 or +254712345678"
            />
            <p className="text-xs mt-1.5" style={{ color: "var(--text-faint)" }}>
              Kenyan phone number format
            </p>
          </div>

          <div>
            <label className="flex items-center gap-2 text-xs font-medium mb-1.5" style={{ color: "var(--text-muted)" }}>
              <span className="w-1.5 h-1.5 rounded-full" style={{ background: "var(--email)" }} />
              Email (optional)
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-4 py-2.5 rounded-lg border text-sm outline-none focus:border-[var(--primary)] transition"
              style={inputStyle}
              placeholder="contact@example.com"
            />
          </div>

          <div>
            <label className="flex items-center gap-2 text-xs font-medium mb-1.5" style={{ color: "var(--text-muted)" }}>
              <span className="w-1.5 h-1.5 rounded-full" style={{ background: "var(--whatsapp)" }} />
              WhatsApp ID (optional)
            </label>
            <input
              type="text"
              value={formData.whatsappId}
              onChange={(e) => setFormData({ ...formData, whatsappId: e.target.value })}
              className="w-full px-4 py-2.5 rounded-lg border text-sm outline-none focus:border-[var(--primary)] transition"
              style={inputStyle}
              placeholder="254712345678"
            />
          </div>

          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--text-muted)" }}>
              Tags (optional)
            </label>
            <input
              type="text"
              value={formData.tags}
              onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
              className="w-full px-4 py-2.5 rounded-lg border text-sm outline-none focus:border-[var(--primary)] transition"
              style={inputStyle}
              placeholder="customer, vip, lagos"
            />
            <p className="text-xs mt-1.5 mb-2" style={{ color: "var(--text-faint)" }}>
              Separate tags with commas
            </p>
            {tagList.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {tagList.map((tag) => (
                  <span
                    key={tag}
                    className="px-2.5 py-1 rounded-full text-xs font-medium"
                    style={{ background: "var(--surface-2)", color: "var(--primary)", border: "1px solid var(--border)" }}
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-3 rounded-lg font-medium text-sm transition hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ background: "linear-gradient(135deg, var(--warm), var(--primary))", color: "white" }}
            >
              {loading ? "Saving…" : "Save changes"}
            </button>
            <Link
              href="/dashboard/contacts"
              className="px-6 py-3 rounded-lg font-medium text-sm border transition hover:border-white/20 text-center"
              style={{ borderColor: "var(--border-strong)", color: "var(--text)" }}
            >
              Cancel
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}