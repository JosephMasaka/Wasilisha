"use client";

import Link from "next/link";
import { Template } from "@prisma/client";

interface TemplatesListProps {
  templates: Template[];
}

const channelMeta: Record<string, { color: string; label: string }> = {
  sms: { color: "var(--sms)", label: "SMS" },
  email: { color: "var(--email)", label: "Email" },
  whatsapp: { color: "var(--whatsapp)", label: "WhatsApp" },
};

export default function TemplatesList({ templates }: TemplatesListProps) {
  if (templates.length === 0) return null; // empty state handled by the page

  return (
    <div className="grid md:grid-cols-2 gap-5">
      {templates.map((template) => {
        const meta = channelMeta[template.channel] ?? { color: "var(--text-faint)", label: template.channel };
        return (
          <div
            key={template.id}
            className="rounded-2xl border p-6 transition hover:border-white/20"
            style={{ background: "var(--surface)", borderColor: "var(--border)" }}
          >
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="font-semibold mb-1.5" style={{ color: "var(--text)" }}>{template.name}</h3>
                <span
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium"
                  style={{ background: "var(--surface-2)", color: meta.color, border: "1px solid var(--border)" }}
                >
                  <span className="w-1.5 h-1.5 rounded-full" style={{ background: meta.color }} />
                  {meta.label}
                </span>
              </div>
              <Link
                href={`/dashboard/campaigns/new?templateId=${template.id}`}
                className="text-xs font-medium hover:underline shrink-0"
                style={{ color: "var(--primary)" }}
              >
                Use →
              </Link>
            </div>

            <div className="p-3 rounded-lg mb-3 border" style={{ background: "var(--surface-2)", borderColor: "var(--border)" }}>
              <p className="text-sm font-mono line-clamp-3" style={{ color: "var(--text-muted)" }}>
                {template.content}
              </p>
            </div>

            {template.variables && Array.isArray(template.variables) && template.variables.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mb-2">
                {(template.variables as string[]).map((variable, idx) => (
                  <span
                    key={idx}
                    className="px-2 py-0.5 rounded text-xs font-mono"
                    style={{ background: "var(--surface-2)", color: "var(--text-faint)", border: "1px solid var(--border)" }}
                  >
                    {`{{${variable}}}`}
                  </span>
                ))}
              </div>
            )}

            <div className="text-xs" style={{ color: "var(--text-faint)" }}>
              Created {new Date(template.createdAt).toLocaleDateString()}
            </div>
          </div>
        );
      })}
    </div>
  );
}