"use client";

import { Campaign, Message } from "@prisma/client";
import Link from "next/link";

interface CampaignsListProps {
  campaigns: (Campaign & { messages: Message[] })[];
}

const statusMeta: Record<string, { color: string; bg: string; label: string }> = {
  draft: { color: "var(--text-faint)", bg: "var(--surface-2)", label: "Draft" },
  scheduled: { color: "var(--sms)", bg: "rgba(251,191,36,0.12)", label: "Scheduled" },
  sending: { color: "var(--email)", bg: "rgba(96,165,250,0.12)", label: "Sending" },
  completed: { color: "var(--whatsapp)", bg: "rgba(52,211,153,0.12)", label: "Completed" },
  failed: { color: "#f87171", bg: "rgba(239,68,68,0.12)", label: "Failed" },
};

const channelMeta: Record<string, { icon: string; color: string }> = {
  sms: { icon: "bi-chat-dots-fill", color: "var(--sms)" },
  email: { icon: "bi-envelope-fill", color: "var(--email)" },
  whatsapp: { icon: "bi-whatsapp", color: "var(--whatsapp)" },
};

const audienceLabels: Record<string, string> = {
  all: "All contacts",
  list: "Contact list",
  tags: "Tag filter",
  manual: "Hand-picked",
};

export default function CampaignsList({ campaigns }: CampaignsListProps) {
  if (campaigns.length === 0) return null; // empty state handled by the page

  return (
    <div className="space-y-4">
      {campaigns.map((campaign) => {
        const totalMessages = campaign.messages.length;
        const sentMessages = campaign.messages.filter((m) => m.status === "sent" || m.status === "delivered").length;
        const failedMessages = campaign.messages.filter((m) => m.status === "failed").length;
        const status = statusMeta[campaign.status] ?? statusMeta.draft;
        const channel = channelMeta[campaign.channel] ?? { icon: "bi-question-circle", color: "var(--text-faint)" };

        return (
          <Link
            key={campaign.id}
            href={`/dashboard/campaigns/${campaign.id}`}
            className="block rounded-2xl border p-6 transition hover:border-white/20"
            style={{ background: "var(--surface)", borderColor: "var(--border)" }}
          >
            <div className="flex flex-wrap justify-between items-start gap-4 mb-4">
              <div>
                <div className="flex items-center gap-2.5 mb-2">
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                    style={{ background: `${channel.color}1a` }}
                  >
                    <i className={`bi ${channel.icon}`} style={{ color: channel.color, fontSize: 14 }} />
                  </div>
                  <h3 className="font-semibold text-lg" style={{ color: "var(--text)" }}>{campaign.name}</h3>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span
                    className="inline-block px-3 py-1 rounded-full text-xs font-medium"
                    style={{ background: status.bg, color: status.color }}
                  >
                    {status.label}
                  </span>
                  <span
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs"
                    style={{ background: "var(--surface-2)", color: "var(--text-faint)", border: "1px solid var(--border)" }}
                  >
                    {audienceLabels[campaign.audienceType] ?? campaign.audienceType}
                  </span>
                </div>
              </div>
              <div className="text-right text-sm" style={{ color: "var(--text-muted)" }}>
                <div>Created {new Date(campaign.createdAt).toLocaleDateString()}</div>
                {campaign.scheduledAt && (
                  <div className="text-xs mt-0.5" style={{ color: "var(--sms)" }}>
                    Scheduled for {new Date(campaign.scheduledAt).toLocaleString()}
                  </div>
                )}
              </div>
            </div>

            {totalMessages > 0 ? (
              <div className="grid grid-cols-3 gap-4 pt-4 border-t" style={{ borderColor: "var(--border)" }}>
                <div>
                  <div className="text-xs" style={{ color: "var(--text-faint)" }}>Total</div>
                  <div className="text-lg font-semibold" style={{ color: "var(--text)" }}>
                    {campaign.recipientCount ?? totalMessages}
                  </div>
                </div>
                <div>
                  <div className="text-xs" style={{ color: "var(--text-faint)" }}>Sent</div>
                  <div className="text-lg font-semibold" style={{ color: "var(--whatsapp)" }}>{sentMessages}</div>
                </div>
                <div>
                  <div className="text-xs" style={{ color: "var(--text-faint)" }}>Failed</div>
                  <div className="text-lg font-semibold" style={{ color: failedMessages > 0 ? "#f87171" : "var(--text-muted)" }}>
                    {failedMessages}
                  </div>
                </div>
              </div>
            ) : campaign.status === "draft" || campaign.status === "scheduled" ? (
              <p className="text-xs pt-4 border-t" style={{ borderColor: "var(--border)", color: "var(--text-faint)" }}>
                Not sent yet — {campaign.status === "draft" ? "still a draft." : "waiting for its scheduled time."}
              </p>
            ) : null}
          </Link>
        );
      })}
    </div>
  );
}