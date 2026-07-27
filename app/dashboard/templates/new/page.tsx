"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { EmailBlock, compileEmailHtml, extractPlainText, newBlockId } from "@/lib/emailBuilder";
import { calculateSmsSegments } from "@/lib/smsEncoding";

const channelOptions = [
  { value: "sms", label: "SMS", icon: "bi-chat-dots-fill", color: "var(--sms)" },
  { value: "email", label: "Email", icon: "bi-envelope-fill", color: "var(--email)" },
  { value: "whatsapp", label: "WhatsApp", icon: "bi-whatsapp", color: "var(--whatsapp)" },
];

const blockTypeOptions: { type: EmailBlock["type"]; label: string; icon: string }[] = [
  { type: "heading", label: "Heading", icon: "bi-type-h1" },
  { type: "text", label: "Text", icon: "bi-text-paragraph" },
  { type: "image", label: "Image", icon: "bi-image" },
  { type: "button", label: "Button", icon: "bi-square" },
  { type: "divider", label: "Divider", icon: "bi-dash-lg" },
  { type: "spacer", label: "Spacer", icon: "bi-arrows-expand" },
];

function defaultBlock(type: EmailBlock["type"]): EmailBlock {
  const id = newBlockId();
  switch (type) {
    case "heading": return { id, type, text: "Your heading here" };
    case "text": return { id, type, text: "Write your message here." };
    case "image": return { id, type, url: "", alt: "" };
    case "button": return { id, type, text: "Click here", url: "" };
    case "divider": return { id, type };
    case "spacer": return { id, type };
  }
}

export default function NewTemplatePage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [channel, setChannel] = useState("sms");
  const [variablesInput, setVariablesInput] = useState("");

  // SMS / WhatsApp body
  const [plainContent, setPlainContent] = useState("");

  // WhatsApp-specific
  const [waHeaderImage, setWaHeaderImage] = useState("");
  const [waFooter, setWaFooter] = useState("");

  // Email-specific
  const [subject, setSubject] = useState("");
  const [blocks, setBlocks] = useState<EmailBlock[]>([
    { id: newBlockId(), type: "heading", text: "Your heading here" },
    { id: newBlockId(), type: "text", text: "Write your message here." },
  ]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const activeChannel = channelOptions.find((c) => c.value === channel)!;
  const variableList = variablesInput ? variablesInput.split(",").map((v) => v.trim()).filter(Boolean) : [];

  const smsStats = useMemo(() => calculateSmsSegments(plainContent), [plainContent]);
  const compiledHtml = useMemo(() => compileEmailHtml(blocks, subject || "Preview"), [blocks, subject]);

  const inputStyle = { background: "var(--surface-2)", borderColor: "var(--border)", color: "var(--text)" };

  const updateBlock = (id: string, patch: Partial<EmailBlock>) => {
    setBlocks((prev) => prev.map((b) => (b.id === id ? ({ ...b, ...patch } as EmailBlock) : b)));
  };
  const addBlock = (type: EmailBlock["type"]) => setBlocks((prev) => [...prev, defaultBlock(type)]);
  const removeBlock = (id: string) => setBlocks((prev) => prev.filter((b) => b.id !== id));
  const moveBlock = (id: string, dir: -1 | 1) => {
    setBlocks((prev) => {
      const idx = prev.findIndex((b) => b.id === id);
      const swapWith = idx + dir;
      if (swapWith < 0 || swapWith >= prev.length) return prev;
      const next = [...prev];
      [next[idx], next[swapWith]] = [next[swapWith], next[idx]];
      return next;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (channel === "email" && !subject.trim()) {
      setError("Give this email a subject line");
      return;
    }
    if (channel !== "email" && !plainContent.trim()) {
      setError("Message content can't be empty");
      return;
    }

    setLoading(true);
    try {
      const payload: Record<string, unknown> = {
        name,
        channel,
        variables: variableList,
      };

      if (channel === "email") {
        payload.content = extractPlainText(blocks) || subject;
        payload.subject = subject;
        payload.htmlContent = compiledHtml;
        payload.design = blocks;
        const firstImage = blocks.find((b) => b.type === "image") as Extract<EmailBlock, { type: "image" }> | undefined;
        if (firstImage?.url) payload.headerImageUrl = firstImage.url;
      } else if (channel === "whatsapp") {
        payload.content = plainContent;
        payload.headerImageUrl = waHeaderImage || null;
        payload.footerText = waFooter || null;
      } else {
        payload.content = plainContent;
      }

      const res = await fetch("/api/templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create template");
      router.push("/dashboard/templates");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-6">
        <Link href="/dashboard/templates" className="inline-flex items-center gap-1.5 text-sm font-medium hover:opacity-80 transition" style={{ color: "var(--primary)" }}>
          <i className="bi bi-arrow-left" />
          Back to templates
        </Link>
      </div>

      <div className="rounded-2xl border p-8" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
        <h1 className="font-display text-2xl mb-2" style={{ color: "var(--text)" }}>Create template</h1>
        <p className="mb-6" style={{ color: "var(--text-muted)" }}>Build a reusable template for one channel at a time</p>

        {error && (
          <div className="text-sm p-4 rounded-lg mb-5 border" style={{ background: "rgba(239,68,68,0.08)", borderColor: "rgba(239,68,68,0.25)", color: "#fca5a5" }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid md:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--text-muted)" }}>Template name *</label>
              <input
                type="text" required value={name} onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-2.5 rounded-lg border text-sm outline-none focus:border-[var(--primary)] transition"
                style={inputStyle} placeholder="Welcome Message"
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--text-muted)" }}>Variables (optional)</label>
              <input
                type="text" value={variablesInput} onChange={(e) => setVariablesInput(e.target.value)}
                className="w-full px-4 py-2.5 rounded-lg border text-sm outline-none focus:border-[var(--primary)] transition"
                style={inputStyle} placeholder="first_name, order_id"
              />
            </div>
          </div>

          {/* Channel picker */}
          <div>
            <label className="block text-xs font-medium mb-2" style={{ color: "var(--text-muted)" }}>Channel *</label>
            <div className="grid grid-cols-3 gap-3">
              {channelOptions.map((c) => {
                const active = channel === c.value;
                return (
                  <button key={c.value} type="button" onClick={() => setChannel(c.value)}
                    className="rounded-xl border p-4 text-left transition"
                    style={{ background: active ? "var(--surface-2)" : "transparent", borderColor: active ? c.color : "var(--border)", boxShadow: active ? `0 0 0 1px ${c.color}` : "none" }}>
                    <i className={`bi ${c.icon}`} style={{ color: c.color, fontSize: 20 }} />
                    <div className="text-sm font-medium mt-2" style={{ color: "var(--text)" }}>{c.label}</div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* ---------- SMS ---------- */}
          {channel === "sms" && (
            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--text-muted)" }}>Message content *</label>
              <textarea
                required value={plainContent} onChange={(e) => setPlainContent(e.target.value)}
                rows={6}
                className="w-full px-4 py-2.5 rounded-lg border text-sm outline-none focus:border-[var(--primary)] transition font-mono"
                style={inputStyle} placeholder="Hello {{first_name}}, welcome to our service!"
              />
              <div className="flex flex-wrap gap-4 mt-2 text-xs" style={{ color: "var(--text-faint)" }}>
                <span>{plainContent.length} characters</span>
                <span
                  className="flex items-center gap-1.5"
                  style={{ color: smsStats.encoding === "Unicode" ? "var(--sms)" : "var(--text-faint)" }}
                >
                  {smsStats.encoding === "Unicode" && <i className="bi bi-exclamation-triangle-fill" style={{ fontSize: 10 }} />}
                  {smsStats.encoding} encoding ({smsStats.limit} chars/segment)
                </span>
                <span>{smsStats.segments} SMS segment{smsStats.segments !== 1 ? "s" : ""}</span>
              </div>
              {smsStats.encoding === "Unicode" && (
                <p className="text-xs mt-1.5" style={{ color: "var(--sms)" }}>
                  This message contains characters outside standard GSM-7 (emoji, accented letters, or curly quotes) —
                  that drops your per-segment limit from 160 to 70 characters and increases cost per send.
                </p>
              )}
            </div>
          )}

          {/* ---------- WhatsApp ---------- */}
          {channel === "whatsapp" && (
            <div className="space-y-5">
              <div
                className="rounded-xl p-4 text-xs border"
                style={{ background: "rgba(52,211,153,0.06)", borderColor: "rgba(52,211,153,0.25)", color: "var(--text-muted)" }}
              >
                <i className="bi bi-info-circle-fill mr-1.5" style={{ color: "var(--whatsapp)" }} />
                WhatsApp templates outside an active customer conversation must be pre-approved by Meta before
                they can be sent. Structure this as header / body / footer to match what Meta reviews.
              </div>

              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--text-muted)" }}>Header image URL (optional)</label>
                <input
                  type="url" value={waHeaderImage} onChange={(e) => setWaHeaderImage(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-lg border text-sm outline-none focus:border-[var(--primary)] transition"
                  style={inputStyle} placeholder="https://…"
                />
              </div>

              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--text-muted)" }}>Body *</label>
                <textarea
                  required value={plainContent} onChange={(e) => setPlainContent(e.target.value)}
                  rows={5}
                  className="w-full px-4 py-2.5 rounded-lg border text-sm outline-none focus:border-[var(--primary)] transition font-mono"
                  style={inputStyle} placeholder="Hi {{first_name}}, your order {{order_id}} has shipped!"
                />
                <p className="text-xs mt-1.5" style={{ color: "var(--text-faint)" }}>{plainContent.length} characters</p>
              </div>

              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--text-muted)" }}>Footer (optional)</label>
                <input
                  type="text" value={waFooter} onChange={(e) => setWaFooter(e.target.value)}
                  maxLength={60}
                  className="w-full px-4 py-2.5 rounded-lg border text-sm outline-none focus:border-[var(--primary)] transition"
                  style={inputStyle} placeholder="Reply STOP to unsubscribe"
                />
              </div>

              {/* Phone-mockup preview */}
              <div>
                <label className="block text-xs font-medium mb-2" style={{ color: "var(--text-muted)" }}>Preview</label>
                <div className="rounded-2xl p-4 max-w-sm" style={{ background: "#0b141a" }}>
                  <div className="rounded-xl p-3" style={{ background: "#005c4b" }}>
                    {waHeaderImage && (
                      <div className="rounded-lg overflow-hidden mb-2 aspect-video bg-black/20 flex items-center justify-center">
                        <i className="bi bi-image text-white/40" style={{ fontSize: 24 }} />
                      </div>
                    )}
                    <p className="text-sm text-white whitespace-pre-wrap">{plainContent || "Body text will appear here…"}</p>
                    {waFooter && <p className="text-xs mt-1.5" style={{ color: "rgba(255,255,255,0.6)" }}>{waFooter}</p>}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ---------- Email builder ---------- */}
          {channel === "email" && (
            <div className="space-y-5">
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--text-muted)" }}>Subject line *</label>
                <input
                  type="text" required value={subject} onChange={(e) => setSubject(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-lg border text-sm outline-none focus:border-[var(--primary)] transition"
                  style={inputStyle} placeholder="Your order has shipped 🎉"
                />
              </div>

              <div className="grid lg:grid-cols-2 gap-5">
                {/* Block editor */}
                <div>
                  <label className="block text-xs font-medium mb-2" style={{ color: "var(--text-muted)" }}>Content blocks</label>
                  <div className="space-y-3">
                    {blocks.map((block, i) => (
                      <div key={block.id} className="rounded-xl border p-4" style={{ background: "var(--surface-2)", borderColor: "var(--border)" }}>
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-xs font-medium uppercase tracking-wide" style={{ color: "var(--text-faint)" }}>
                            {block.type}
                          </span>
                          <div className="flex items-center gap-1">
                            <button type="button" onClick={() => moveBlock(block.id, -1)} disabled={i === 0}
                              className="w-6 h-6 rounded flex items-center justify-center disabled:opacity-30" style={{ color: "var(--text-muted)" }}>
                              <i className="bi bi-chevron-up" style={{ fontSize: 11 }} />
                            </button>
                            <button type="button" onClick={() => moveBlock(block.id, 1)} disabled={i === blocks.length - 1}
                              className="w-6 h-6 rounded flex items-center justify-center disabled:opacity-30" style={{ color: "var(--text-muted)" }}>
                              <i className="bi bi-chevron-down" style={{ fontSize: 11 }} />
                            </button>
                            <button type="button" onClick={() => removeBlock(block.id)}
                              className="w-6 h-6 rounded flex items-center justify-center" style={{ color: "#f87171" }}>
                              <i className="bi bi-trash" style={{ fontSize: 11 }} />
                            </button>
                          </div>
                        </div>

                        {(block.type === "heading" || block.type === "text") && (
                          <textarea
                            value={block.text}
                            onChange={(e) => updateBlock(block.id, { text: e.target.value })}
                            rows={block.type === "heading" ? 2 : 3}
                            className="w-full px-3 py-2 rounded-lg border text-sm outline-none focus:border-[var(--primary)] transition"
                            style={inputStyle}
                          />
                        )}

                        {block.type === "image" && (
                          <div className="space-y-2">
                            <input
                              type="url" placeholder="Image URL (https://…)"
                              value={(block as any).url}
                              onChange={(e) => updateBlock(block.id, { url: e.target.value } as Partial<EmailBlock>)}
                              className="w-full px-3 py-2 rounded-lg border text-sm outline-none focus:border-[var(--primary)] transition"
                              style={inputStyle}
                            />
                            <input
                              type="text" placeholder="Alt text"
                              value={(block as any).alt}
                              onChange={(e) => updateBlock(block.id, { alt: e.target.value } as Partial<EmailBlock>)}
                              className="w-full px-3 py-2 rounded-lg border text-sm outline-none focus:border-[var(--primary)] transition"
                              style={inputStyle}
                            />
                          </div>
                        )}

                        {block.type === "button" && (
                          <div className="space-y-2">
                            <input
                              type="text" placeholder="Button text"
                              value={(block as any).text}
                              onChange={(e) => updateBlock(block.id, { text: e.target.value } as Partial<EmailBlock>)}
                              className="w-full px-3 py-2 rounded-lg border text-sm outline-none focus:border-[var(--primary)] transition"
                              style={inputStyle}
                            />
                            <input
                              type="url" placeholder="Link URL"
                              value={(block as any).url}
                              onChange={(e) => updateBlock(block.id, { url: e.target.value } as Partial<EmailBlock>)}
                              className="w-full px-3 py-2 rounded-lg border text-sm outline-none focus:border-[var(--primary)] transition"
                              style={inputStyle}
                            />
                          </div>
                        )}

                        {(block.type === "divider" || block.type === "spacer") && (
                          <p className="text-xs" style={{ color: "var(--text-faint)" }}>No settings needed</p>
                        )}
                      </div>
                    ))}
                  </div>

                  <div className="flex flex-wrap gap-2 mt-3">
                    {blockTypeOptions.map((opt) => (
                      <button
                        key={opt.type} type="button" onClick={() => addBlock(opt.type)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition hover:border-white/20"
                        style={{ background: "var(--surface-2)", borderColor: "var(--border)", color: "var(--text-muted)" }}
                      >
                        <i className={`bi ${opt.icon}`} style={{ fontSize: 11 }} />
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Live preview */}
                <div>
                  <label className="block text-xs font-medium mb-2" style={{ color: "var(--text-muted)" }}>Preview</label>
                  <div className="rounded-xl border overflow-hidden" style={{ borderColor: "var(--border)" }}>
                    <iframe
                      title="Email preview"
                      srcDoc={compiledHtml}
                      className="w-full"
                      style={{ height: 480, background: "white", border: "none" }}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button
              type="submit" disabled={loading}
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