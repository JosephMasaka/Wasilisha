"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface Template {
  id: string;
  name: string;
  channel: string;
  content: string;
}

interface Contact {
  id: string;
  phone: string | null;
  email: string | null;
  whatsappId: string | null;
  tags: string[];
}

interface ContactListSummary {
  id: string;
  name: string;
  contactCount?: number;
}

interface FallbackRule {
  id: string;
  name: string;
  primaryChannel: string;
  fallbackChannel: string;
  enabled: boolean;
}

const channelOptions = [
  { value: "sms", label: "SMS", icon: "bi-chat-dots-fill", color: "var(--sms)", rate: "KES 0.80 / message" },
  { value: "email", label: "Email", icon: "bi-envelope-fill", color: "var(--email)", rate: "KES 0.10 / message" },
  { value: "whatsapp", label: "WhatsApp", icon: "bi-whatsapp", color: "var(--whatsapp)", rate: "KES 0.50 / message" },
];

const audienceOptions = [
  { value: "all", label: "All contacts", icon: "bi-people-fill" },
  { value: "list", label: "A contact list", icon: "bi-collection-fill" },
  { value: "tags", label: "Filter by tags", icon: "bi-tags-fill" },
  { value: "manual", label: "Pick manually", icon: "bi-check2-square" },
];

export default function NewCampaignPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: "",
    channel: "sms",
    templateId: "",
    customMessage: "",
    subject: "",
    fallbackRuleId: "",
  });
  const [audienceType, setAudienceType] = useState<"all" | "list" | "tags" | "manual">("all");
  const [contactListId, setContactListId] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [manualIds, setManualIds] = useState<string[]>([]);
  const [manualSearch, setManualSearch] = useState("");

  const [scheduledAt, setScheduledAt] = useState("");
  const [showSchedule, setShowSchedule] = useState(false);

  const [submitting, setSubmitting] = useState<"draft" | "schedule" | "send" | null>(null);
  const [error, setError] = useState("");
  const [templates, setTemplates] = useState<Template[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [contactLists, setContactLists] = useState<ContactListSummary[]>([]);
  const [fallbackRules, setFallbackRules] = useState<FallbackRule[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [templatesRes, contactsRes, listsRes, rulesRes] = await Promise.all([
          fetch("/api/templates"),
          fetch("/api/contacts"),
          fetch("/api/contact-lists"),
          fetch("/api/automation/rules/list"),
        ]);

        if (templatesRes.ok) setTemplates(await templatesRes.json());
        if (contactsRes.ok) setContacts(await contactsRes.json());
        if (listsRes.ok) setContactLists(await listsRes.json());
        if (rulesRes.ok) setFallbackRules(await rulesRes.json());
      } catch (err) {
        console.error("Failed to fetch data:", err);
      } finally {
        setLoadingData(false);
      }
    };
    fetchData();
  }, []);

  const filteredTemplates = templates.filter((t) => t.channel === formData.channel);
  const selectedTemplate = templates.find((t) => t.id === formData.templateId);

  const allTags = useMemo(() => {
    const tagSet = new Set<string>();
    contacts.forEach((c) => c.tags?.forEach((t) => tagSet.add(t)));
    return Array.from(tagSet).sort();
  }, [contacts]);

  // Channel-eligible first, then narrowed by audience selection
  const channelEligible = contacts.filter((c) => {
    if (formData.channel === "sms") return !!c.phone;
    if (formData.channel === "email") return !!c.email;
    if (formData.channel === "whatsapp") return !!c.whatsappId;
    return false;
  });

  const audienceContacts = useMemo(() => {
    if (audienceType === "all") return channelEligible;
    if (audienceType === "tags") {
      if (selectedTags.length === 0) return [];
      return channelEligible.filter((c) => c.tags?.some((t) => selectedTags.includes(t)));
    }
    if (audienceType === "manual") {
      return channelEligible.filter((c) => manualIds.includes(c.id));
    }
    // "list" — actual membership lives server-side; we just show the eligible count
    // once contactListId is chosen the recipient count comes from the API on submit.
    return contactListId ? channelEligible : [];
  }, [audienceType, channelEligible, selectedTags, manualIds, contactListId]);

  const recipientCount = audienceContacts.length;

  const manualSearchResults = channelEligible.filter((c) => {
    const q = manualSearch.toLowerCase();
    if (!q) return true;
    return (
      c.phone?.toLowerCase().includes(q) ||
      c.email?.toLowerCase().includes(q) ||
      c.whatsappId?.toLowerCase().includes(q)
    );
  });

  const channelCosts = { sms: 0.8, email: 0.1, whatsapp: 0.5 };
  let costPerMessage = channelCosts[formData.channel as keyof typeof channelCosts];
  if (formData.channel === "sms") {
    const message = formData.templateId && selectedTemplate ? selectedTemplate.content : formData.customMessage;
    costPerMessage = channelCosts.sms * Math.ceil(message.length / 160);
  }
  const totalCost = recipientCount * costPerMessage;
  const activeChannel = channelOptions.find((c) => c.value === formData.channel)!;

  const buildPayload = (status: "draft" | "scheduled" | "sending", scheduledAtIso: string | null) => {
    const message = formData.templateId && selectedTemplate ? selectedTemplate.content : formData.customMessage;
    return {
      name: formData.name,
      channel: formData.channel,
      templateId: formData.templateId || null,
      message,
      subject: formData.channel === "email" ? formData.subject : undefined,
      fallbackRuleId: formData.fallbackRuleId || null,
      status,
      scheduledAt: scheduledAtIso,
      audienceType,
      contactListId: audienceType === "list" ? contactListId : null,
      audienceTags: audienceType === "tags" ? selectedTags : [],
      manualContactIds: audienceType === "manual" ? manualIds : [],
    };
  };

  const submitCampaign = async (action: "draft" | "schedule" | "send") => {
    setError("");

    if (!formData.name) {
      setError("Give this campaign a name");
      return;
    }
    const message = formData.templateId && selectedTemplate ? selectedTemplate.content : formData.customMessage;
    if (!message) {
      setError("Please select a template or enter a custom message");
      return;
    }
    if (action === "send" && recipientCount === 0 && audienceType !== "list") {
      setError("No eligible contacts match this audience for the selected channel");
      return;
    }
    if (action === "schedule" && !scheduledAt) {
      setError("Choose a date and time to schedule this campaign");
      return;
    }

    const status = action === "draft" ? "draft" : action === "schedule" ? "scheduled" : "sending";
    const scheduledAtIso = action === "schedule" ? new Date(scheduledAt).toISOString() : null;

    setSubmitting(action);
    try {
      const res = await fetch("/api/campaigns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(buildPayload(status, scheduledAtIso)),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save campaign");
      router.push(`/dashboard/campaigns/${data.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSubmitting(null);
    }
  };

  const inputStyle = { background: "var(--surface-2)", borderColor: "var(--border)", color: "var(--text)" };

  if (loadingData) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div
            className="w-12 h-12 rounded-full mx-auto mb-4"
            style={{ background: "linear-gradient(135deg, var(--primary), var(--primary-dim))", animation: "core-pulse 1.6s ease-in-out infinite" }}
          />
          <p style={{ color: "var(--text-muted)" }}>Loading…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6 flex items-center justify-between">
        <Link href="/dashboard/campaigns" className="inline-flex items-center gap-1.5 text-sm font-medium hover:opacity-80 transition" style={{ color: "var(--primary)" }}>
          <i className="bi bi-arrow-left" />
          Back to campaigns
        </Link>
        <div className="flex items-center gap-4 text-xs" style={{ color: "var(--text-faint)" }}>
          <Link href="/dashboard/templates" className="hover:opacity-80 transition">Manage templates</Link>
          <Link href="/dashboard/automation" className="hover:opacity-80 transition">Fallback rules</Link>
        </div>
      </div>

      <div className="rounded-2xl border p-8" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
        <h1 className="font-display text-2xl mb-2" style={{ color: "var(--text)" }}>Create campaign</h1>
        <p className="mb-6" style={{ color: "var(--text-muted)" }}>Send bulk messages to your contacts</p>

        {error && (
          <div className="text-sm p-4 rounded-lg mb-5 border" style={{ background: "rgba(239,68,68,0.08)", borderColor: "rgba(239,68,68,0.25)", color: "#fca5a5" }}>
            {error}
          </div>
        )}

        <div className="space-y-6">
          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--text-muted)" }}>Campaign name *</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-2.5 rounded-lg border text-sm outline-none focus:border-[var(--primary)] transition"
              style={inputStyle}
              placeholder="Summer Sale Announcement"
            />
          </div>

          {/* Channel picker */}
          <div>
            <label className="block text-xs font-medium mb-2" style={{ color: "var(--text-muted)" }}>Channel *</label>
            <div className="grid grid-cols-3 gap-3">
              {channelOptions.map((c) => {
                const active = formData.channel === c.value;
                return (
                  <button
                    key={c.value}
                    type="button"
                    onClick={() => setFormData({ ...formData, channel: c.value, templateId: "" })}
                    className="rounded-xl border p-4 text-left transition"
                    style={{ background: active ? "var(--surface-2)" : "transparent", borderColor: active ? c.color : "var(--border)", boxShadow: active ? `0 0 0 1px ${c.color}` : "none" }}
                  >
                    <i className={`bi ${c.icon}`} style={{ color: c.color, fontSize: 20 }} />
                    <div className="text-sm font-medium mt-2" style={{ color: "var(--text)" }}>{c.label}</div>
                    <div className="text-xs mt-0.5" style={{ color: "var(--text-faint)" }}>{c.rate}</div>
                  </button>
                );
              })}
            </div>
          </div>

          {formData.channel === "email" && (
            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--text-muted)" }}>Email subject *</label>
              <input
                type="text"
                value={formData.subject}
                onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                className="w-full px-4 py-2.5 rounded-lg border text-sm outline-none focus:border-[var(--primary)] transition"
                style={inputStyle}
                placeholder="Your email subject line"
              />
            </div>
          )}

          {filteredTemplates.length > 0 && (
            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--text-muted)" }}>Select template (optional)</label>
              <select
                value={formData.templateId}
                onChange={(e) => setFormData({ ...formData, templateId: e.target.value })}
                className="w-full px-4 py-2.5 rounded-lg border text-sm outline-none focus:border-[var(--primary)] transition"
                style={inputStyle}
              >
                <option value="">— Use custom message —</option>
                {filteredTemplates.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
              {selectedTemplate && (
                <div className="mt-2 p-3 rounded-lg border text-sm font-mono" style={{ background: "var(--surface-2)", borderColor: "var(--border)", color: "var(--text-muted)" }}>
                  {selectedTemplate.content}
                </div>
              )}
            </div>
          )}

          {!formData.templateId && (
            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--text-muted)" }}>Message content *</label>
              <textarea
                value={formData.customMessage}
                onChange={(e) => setFormData({ ...formData, customMessage: e.target.value })}
                rows={formData.channel === "email" ? 8 : 5}
                className="w-full px-4 py-2.5 rounded-lg border text-sm outline-none focus:border-[var(--primary)] transition font-mono"
                style={inputStyle}
                placeholder={formData.channel === "email" ? "Enter email content (HTML supported)…" : "Enter your message here…"}
              />
              <p className="text-xs mt-1.5" style={{ color: "var(--text-faint)" }}>
                {formData.customMessage.length} characters
                {formData.channel === "sms" && ` (${Math.ceil(formData.customMessage.length / 160)} SMS)`}
              </p>
            </div>
          )}

          {/* Audience */}
          <div>
            <label className="block text-xs font-medium mb-2" style={{ color: "var(--text-muted)" }}>Who should receive this? *</label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
              {audienceOptions.map((a) => {
                const active = audienceType === a.value;
                return (
                  <button
                    key={a.value}
                    type="button"
                    onClick={() => setAudienceType(a.value as typeof audienceType)}
                    className="rounded-xl border p-3.5 text-center transition"
                    style={{ background: active ? "var(--surface-2)" : "transparent", borderColor: active ? "var(--primary)" : "var(--border)", boxShadow: active ? "0 0 0 1px var(--primary)" : "none" }}
                  >
                    <i className={`bi ${a.icon}`} style={{ color: active ? "var(--primary)" : "var(--text-faint)", fontSize: 18 }} />
                    <div className="text-xs font-medium mt-1.5" style={{ color: "var(--text)" }}>{a.label}</div>
                  </button>
                );
              })}
            </div>

            {audienceType === "list" && (
              contactLists.length === 0 ? (
                <p className="text-sm px-4 py-3 rounded-lg border" style={{ background: "var(--surface-2)", borderColor: "var(--border)", color: "var(--text-faint)" }}>
                  No contact lists yet. <Link href="/dashboard/contacts" className="underline" style={{ color: "var(--primary)" }}>Create one from your contacts page.</Link>
                </p>
              ) : (
                <select
                  value={contactListId}
                  onChange={(e) => setContactListId(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-lg border text-sm outline-none focus:border-[var(--primary)] transition"
                  style={inputStyle}
                >
                  <option value="">— Choose a list —</option>
                  {contactLists.map((l) => (
                    <option key={l.id} value={l.id}>
                      {l.name}{typeof l.contactCount === "number" ? ` (${l.contactCount})` : ""}
                    </option>
                  ))}
                </select>
              )
            )}

            {audienceType === "tags" && (
              allTags.length === 0 ? (
                <p className="text-sm px-4 py-3 rounded-lg border" style={{ background: "var(--surface-2)", borderColor: "var(--border)", color: "var(--text-faint)" }}>
                  None of your contacts have tags yet.
                </p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {allTags.map((tag) => {
                    const active = selectedTags.includes(tag);
                    return (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => setSelectedTags((prev) => active ? prev.filter((t) => t !== tag) : [...prev, tag])}
                        className="px-3 py-1.5 rounded-full text-xs font-medium border transition"
                        style={{
                          background: active ? "var(--primary)" : "var(--surface-2)",
                          borderColor: active ? "var(--primary)" : "var(--border)",
                          color: active ? "white" : "var(--text-muted)",
                        }}
                      >
                        {tag}
                      </button>
                    );
                  })}
                </div>
              )
            )}

            {audienceType === "manual" && (
              <div className="rounded-lg border overflow-hidden" style={{ borderColor: "var(--border)" }}>
                <input
                  type="text"
                  value={manualSearch}
                  onChange={(e) => setManualSearch(e.target.value)}
                  placeholder="Search by phone, email, or WhatsApp ID…"
                  className="w-full px-4 py-2.5 text-sm outline-none border-b"
                  style={{ ...inputStyle, borderColor: "var(--border)" }}
                />
                <div className="max-h-56 overflow-y-auto" style={{ background: "var(--surface-2)" }}>
                  {manualSearchResults.length === 0 ? (
                    <p className="text-sm px-4 py-4" style={{ color: "var(--text-faint)" }}>No matching contacts</p>
                  ) : (
                    manualSearchResults.map((c) => {
                      const checked = manualIds.includes(c.id);
                      return (
                        <label
                          key={c.id}
                          className="flex items-center gap-3 px-4 py-2.5 text-sm cursor-pointer border-t first:border-t-0"
                          style={{ borderColor: "var(--border)", color: "var(--text)" }}
                        >
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => setManualIds((prev) => checked ? prev.filter((id) => id !== c.id) : [...prev, c.id])}
                          />
                          {c.phone || c.email || c.whatsappId}
                        </label>
                      );
                    })
                  )}
                </div>
                {manualIds.length > 0 && (
                  <div className="px-4 py-2 text-xs border-t" style={{ borderColor: "var(--border)", color: "var(--text-faint)" }}>
                    {manualIds.length} selected
                  </div>
                )}
              </div>
            )}
          </div>

          {fallbackRules.length > 0 && (
            <div>
              <label className="flex items-center gap-1.5 text-xs font-medium mb-1.5" style={{ color: "var(--text-muted)" }}>
                <i className="bi bi-arrow-repeat" style={{ fontSize: 12 }} />
                Fallback rule (optional)
              </label>
              <select
                value={formData.fallbackRuleId}
                onChange={(e) => setFormData({ ...formData, fallbackRuleId: e.target.value })}
                className="w-full px-4 py-2.5 rounded-lg border text-sm outline-none focus:border-[var(--primary)] transition"
                style={inputStyle}
              >
                <option value="">— No fallback —</option>
                {fallbackRules.filter((r) => r.enabled && r.primaryChannel === formData.channel).map((rule) => (
                  <option key={rule.id} value={rule.id}>
                    {rule.name} ({rule.primaryChannel.toUpperCase()} → {rule.fallbackChannel.toUpperCase()})
                  </option>
                ))}
              </select>
              {fallbackRules.filter((r) => r.enabled && r.primaryChannel === formData.channel).length === 0 && (
                <p className="text-xs mt-1.5" style={{ color: "var(--text-faint)" }}>
                  No enabled rules for this channel — <Link href="/dashboard/automation/new" className="underline" style={{ color: "var(--primary)" }}>create one</Link>.
                </p>
              )}
            </div>
          )}

          {/* Summary */}
          <div className="rounded-xl border p-5" style={{ background: "var(--surface-2)", borderColor: "var(--border)" }}>
            <h3 className="text-sm font-medium mb-4 flex items-center gap-2" style={{ color: "var(--text)" }}>
              <span className="w-1.5 h-1.5 rounded-full" style={{ background: activeChannel.color }} />
              Campaign summary
            </h3>
            <div className="space-y-2.5 text-sm">
              <div className="flex justify-between"><span style={{ color: "var(--text-faint)" }}>Channel</span><span style={{ color: "var(--text)" }}>{activeChannel.label}</span></div>
              <div className="flex justify-between">
                <span style={{ color: "var(--text-faint)" }}>Recipients</span>
                <span style={{ color: "var(--text)" }}>
                  {audienceType === "list" ? "Determined at send" : `${recipientCount} contacts`}
                </span>
              </div>
              <div className="flex justify-between"><span style={{ color: "var(--text-faint)" }}>Cost per message</span><span style={{ color: "var(--text)" }}>KES {costPerMessage.toFixed(2)}</span></div>
              <div className="flex justify-between pt-2.5 mt-1 border-t" style={{ borderColor: "var(--border)" }}>
                <span className="font-medium" style={{ color: "var(--text)" }}>Estimated cost</span>
                <span className="font-semibold" style={{ color: activeChannel.color }}>
                  {audienceType === "list" ? "—" : `KES ${totalCost.toFixed(2)}`}
                </span>
              </div>
            </div>
          </div>

          {showSchedule && (
            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--text-muted)" }}>Send at</label>
              <input
                type="datetime-local"
                value={scheduledAt}
                onChange={(e) => setScheduledAt(e.target.value)}
                min={new Date(Date.now() + 5 * 60000).toISOString().slice(0, 16)}
                className="w-full px-4 py-2.5 rounded-lg border text-sm outline-none focus:border-[var(--primary)] transition"
                style={inputStyle}
              />
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-wrap gap-3 pt-2">
            <button
              type="button"
              onClick={() => submitCampaign("send")}
              disabled={submitting !== null}
              className="flex-1 min-w-[160px] py-3 rounded-lg font-medium text-sm transition hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ background: "linear-gradient(135deg, var(--warm), var(--primary))", color: "white" }}
            >
              {submitting === "send" ? "Sending…" : "Send now"}
            </button>
            <button
              type="button"
              onClick={() => (showSchedule ? submitCampaign("schedule") : setShowSchedule(true))}
              disabled={submitting !== null}
              className="flex-1 min-w-[160px] py-3 rounded-lg font-medium text-sm border transition hover:border-white/20 disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ borderColor: "var(--border-strong)", color: "var(--text)" }}
            >
              {submitting === "schedule" ? "Scheduling…" : showSchedule ? "Confirm schedule" : "Schedule for later"}
            </button>
            <button
              type="button"
              onClick={() => submitCampaign("draft")}
              disabled={submitting !== null}
              className="py-3 px-6 rounded-lg font-medium text-sm transition hover:opacity-80 disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ color: "var(--text-muted)" }}
            >
              {submitting === "draft" ? "Saving…" : "Save as draft"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}