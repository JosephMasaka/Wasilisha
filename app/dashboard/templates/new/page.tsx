"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

const channelOptions = [
  { value: "sms", label: "SMS", icon: "bi-chat-dots-fill", color: "var(--sms)" },
  { value: "email", label: "Email", icon: "bi-envelope-fill", color: "var(--email)" },
  { value: "whatsapp", label: "WhatsApp", icon: "bi-whatsapp", color: "var(--whatsapp)" },
];

export default function NewTemplatePage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: "",
    channel: "sms",
    content: "",
    variables: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const variables = formData.variables
        ? formData.variables.split(",").map((v) => v.trim()).filter(Boolean)
        : [];

      const res = await fetch("/api/templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          channel: formData.channel,
          content: formData.content,
          variables,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to create template");
      }

      router.push("/dashboard/templates");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const charCount = formData.content.length;
  const smsCount = formData.channel === "sms" ? Math.ceil(charCount / 160) : 0;
  const activeChannel = channelOptions.find((c) => c.value === formData.channel)!;

  const variableList = formData.variables
    ? formData.variables.split(",").map((v) => v.trim()).filter(Boolean)
    : [];

  // Substitutes {{variable}} with a sample value so the preview reads naturally
  const previewText = useMemo(() => {
    if (!formData.content) return "";
    let preview = formData.content;
    variableList.forEach((v) => {
      const sample = `[${v}]`;
      preview = preview.replace(new RegExp(`{{\\s*${v}\\s*}}`, "g"), sample);
    });
    return preview;
  }, [formData.content, variableList]);

  // Flags {{...}} placeholders in the content that aren't declared in the variables field
  const undeclaredVariables = useMemo(() => {
    const found = [...formData.content.matchAll(/{{\s*(\w+)\s*}}/g)].map((m) => m[1]);
    return [...new Set(found)].filter((v) => !variableList.includes(v));
  }, [formData.content, variableList]);

  const inputStyle = {
    background: "var(--surface-2)",
    borderColor: "var(--border)",
    color: "var(--text)",
  };

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-6">
        <Link
          href="/dashboard/templates"
          className="inline-flex items-center gap-1.5 text-sm font-medium hover:opacity-80 transition"
          style={{ color: "var(--primary)" }}
        >
          <i className="bi bi-arrow-left" />
          Back to templates
        </Link>
      </div>

      <div className="rounded-2xl border p-8" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
        <h1 className="font-display text-2xl mb-2" style={{ color: "var(--text)" }}>
          Create template
        </h1>
        <p className="mb-6" style={{ color: "var(--text-muted)" }}>
          Build reusable templates with variable placeholders
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
            <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--text-muted)" }}>
              Template name *
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-2.5 rounded-lg border text-sm outline-none focus:border-[var(--primary)] transition"
              style={inputStyle}
              placeholder="Welcome Message"
            />
          </div>

          {/* Channel picker */}
          <div>
            <label className="block text-xs font-medium mb-2" style={{ color: "var(--text-muted)" }}>
              Channel *
            </label>
            <div className="grid grid-cols-3 gap-3">
              {channelOptions.map((c) => {
                const active = formData.channel === c.value;
                return (
                  <button
                    key={c.value}
                    type="button"
                    onClick={() => setFormData({ ...formData, channel: c.value })}
                    className="rounded-xl border p-4 text-left transition"
                    style={{
                      background: active ? "var(--surface-2)" : "transparent",
                      borderColor: active ? c.color : "var(--border)",
                      boxShadow: active ? `0 0 0 1px ${c.color}` : "none",
                    }}
                  >
                    <i className={`bi ${c.icon}`} style={{ color: c.color, fontSize: 20 }} />
                    <div className="text-sm font-medium mt-2" style={{ color: "var(--text)" }}>{c.label}</div>
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--text-muted)" }}>
              Message content *
            </label>
            <textarea
              required
              value={formData.content}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              rows={6}
              className="w-full px-4 py-2.5 rounded-lg border text-sm outline-none focus:border-[var(--primary)] transition font-mono"
              style={inputStyle}
              placeholder="Hello {{first_name}}, welcome to our service!"
            />
            <div className="flex justify-between items-center mt-1.5">
              <p className="text-xs" style={{ color: "var(--text-faint)" }}>
                Use {`{{variable_name}}`} for dynamic content
              </p>
              <div className="text-xs" style={{ color: "var(--text-faint)" }}>
                {charCount} characters
                {formData.channel === "sms" && ` (${smsCount} SMS${smsCount !== 1 ? "s" : ""})`}
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--text-muted)" }}>
              Variables (optional)
            </label>
            <input
              type="text"
              value={formData.variables}
              onChange={(e) => setFormData({ ...formData, variables: e.target.value })}
              className="w-full px-4 py-2.5 rounded-lg border text-sm outline-none focus:border-[var(--primary)] transition"
              style={inputStyle}
              placeholder="first_name, order_id, amount"
            />
            <p className="text-xs mt-1.5 mb-2" style={{ color: "var(--text-faint)" }}>
              Comma-separated list of variable names used in your template
            </p>
            {variableList.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {variableList.map((v) => (
                  <span
                    key={v}
                    className="px-2.5 py-1 rounded-full text-xs font-mono font-medium"
                    style={{ background: "var(--surface-2)", color: "var(--primary)", border: "1px solid var(--border)" }}
                  >
                    {`{{${v}}}`}
                  </span>
                ))}
              </div>
            )}
            {undeclaredVariables.length > 0 && (
              <p className="text-xs mt-2 flex items-center gap-1.5" style={{ color: "var(--sms)" }}>
                <i className="bi bi-exclamation-triangle-fill" style={{ fontSize: 11 }} />
                Your message uses {undeclaredVariables.map((v) => `{{${v}}}`).join(", ")} but{" "}
                {undeclaredVariables.length === 1 ? "it isn't" : "they aren't"} listed above.
              </p>
            )}
          </div>

          {/* Live preview */}
          {formData.content && (
            <div className="rounded-xl border p-5" style={{ background: "var(--surface-2)", borderColor: "var(--border)" }}>
              <h3 className="text-sm font-medium mb-3 flex items-center gap-2" style={{ color: "var(--text)" }}>
                <span className="w-1.5 h-1.5 rounded-full" style={{ background: activeChannel.color }} />
                Preview with sample values
              </h3>
              <div
                className="rounded-lg p-4 text-sm leading-relaxed whitespace-pre-wrap"
                style={{ background: "var(--surface)", border: "1px solid var(--border)", color: "var(--text)" }}
              >
                {previewText}
              </div>
            </div>
          )}

          {/* Cost estimate */}
          <div className="rounded-xl border p-5" style={{ background: "var(--surface-2)", borderColor: "var(--border)" }}>
            <h3 className="text-sm font-medium mb-2 flex items-center gap-2" style={{ color: "var(--text)" }}>
              <i className="bi bi-calculator" style={{ fontSize: 12, color: "var(--text-faint)" }} />
              Cost estimate
            </h3>
            {formData.channel === "sms" ? (
              <p className="text-sm" style={{ color: "var(--text-muted)" }}>
                This message costs approximately{" "}
                <span className="font-semibold" style={{ color: "var(--sms)" }}>
                  KES {(smsCount * 0.8).toFixed(2)}
                </span>{" "}
                per recipient ({smsCount} SMS @ KES 0.80 each)
              </p>
            ) : (
              <p className="text-sm" style={{ color: "var(--text-faint)" }}>
                Cost estimates are shown for SMS templates
              </p>
            )}
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-3 rounded-lg font-medium text-sm transition hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ background: "linear-gradient(135deg, var(--warm), var(--primary))", color: "white" }}
            >
              {loading ? "Creating…" : "Create template"}
            </button>
            <Link
              href="/dashboard/templates"
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