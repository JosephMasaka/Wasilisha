"use client";

import { Contact } from "@prisma/client";

interface ContactsTableProps {
  contacts: Contact[];
}

function Cell({ value, color }: { value: string | null; color: string }) {
  return (
    <div className="flex items-center gap-2">
      <span
        className="w-1.5 h-1.5 rounded-full shrink-0"
        style={{ background: value ? color : "var(--text-faint)" }}
      />
      <span style={{ color: value ? "var(--text)" : "var(--text-faint)" }}>
        {value || "—"}
      </span>
    </div>
  );
}

export default function ContactsTable({ contacts }: ContactsTableProps) {
  if (contacts.length === 0) {
    return (
      <div
        className="rounded-2xl border p-12 text-center"
        style={{ background: "var(--surface)", borderColor: "var(--border)" }}
      >
        <div
          className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-5"
          style={{ background: "rgba(139,92,246,0.12)" }}
        >
          <i className="bi bi-person-vcard-fill" style={{ color: "var(--primary)", fontSize: 22 }} />
        </div>
        <h3 className="font-display text-xl mb-2" style={{ color: "var(--text)" }}>
          No contacts yet
        </h3>
        <p className="text-sm" style={{ color: "var(--text-muted)" }}>
          Upload a CSV file or add contacts manually to get started
        </p>
      </div>
    );
  }

  return (
    <div
      className="rounded-2xl border overflow-hidden"
      style={{ background: "var(--surface)", borderColor: "var(--border)" }}
    >
      <div className="overflow-x-auto">
        <table className="min-w-full">
          <thead>
            <tr style={{ borderBottom: "1px solid var(--border)" }}>
              {["Phone", "Email", "WhatsApp", "Tags", "Added"].map((h) => (
                <th
                  key={h}
                  className="px-6 py-3.5 text-left text-xs font-medium uppercase tracking-wider"
                  style={{ color: "var(--text-faint)" }}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {contacts.map((contact, i) => (
              <tr
                key={contact.id}
                className="transition-colors"
                style={{
                  borderTop: i === 0 ? "none" : "1px solid var(--border)",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "var(--surface-2)")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
              >
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  <Cell value={contact.phone} color="var(--sms)" />
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  <Cell value={contact.email} color="var(--email)" />
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  <Cell value={contact.whatsappId} color="var(--whatsapp)" />
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  {contact.tags.length > 0 ? (
                    <div className="flex flex-wrap gap-1.5">
                      {contact.tags.map((tag, idx) => (
                        <span
                          key={idx}
                          className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium"
                          style={{
                            background: "var(--surface-2)",
                            color: "var(--primary)",
                            border: "1px solid var(--border)",
                          }}
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <span style={{ color: "var(--text-faint)" }}>—</span>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm" style={{ color: "var(--text-muted)" }}>
                  {new Date(contact.createdAt).toLocaleDateString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}