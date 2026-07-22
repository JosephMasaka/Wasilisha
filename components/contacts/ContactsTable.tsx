"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Contact } from "@prisma/client";

interface ContactsTableProps {
  contacts: Contact[];
}

function Cell({ value, color }: { value: string | null; color: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: value ? color : "var(--text-faint)" }} />
      <span style={{ color: value ? "var(--text)" : "var(--text-faint)" }}>{value || "—"}</span>
    </div>
  );
}

export default function ContactsTable({ contacts: initialContacts }: ContactsTableProps) {
  const router = useRouter();
  const [contacts, setContacts] = useState(initialContacts);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [selected, setSelected] = useState<string[]>([]);
  const [creatingList, setCreatingList] = useState(false);
  const [listName, setListName] = useState("");
  const [savingList, setSavingList] = useState(false);
  const [error, setError] = useState("");

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this contact? This can't be undone.")) return;
    setError("");
    setDeletingId(id);
    try {
      const res = await fetch(`/api/contacts/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to delete contact");
      }
      setContacts((prev) => prev.filter((c) => c.id !== id));
      setSelected((prev) => prev.filter((sid) => sid !== id));
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setDeletingId(null);
    }
  };

  const toggleSelected = (id: string) => {
    setSelected((prev) => (prev.includes(id) ? prev.filter((sid) => sid !== id) : [...prev, id]));
  };

  const toggleAll = () => {
    setSelected((prev) => (prev.length === contacts.length ? [] : contacts.map((c) => c.id)));
  };

  const handleSaveList = async () => {
    if (!listName.trim()) {
      setError("Give the list a name");
      return;
    }
    setError("");
    setSavingList(true);
    try {
      const res = await fetch("/api/contact-lists", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: listName.trim(), contactIds: selected }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create list");
      setCreatingList(false);
      setListName("");
      setSelected([]);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSavingList(false);
    }
  };

  if (contacts.length === 0) {
    return (
      <div className="rounded-2xl border p-12 text-center" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
        <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-5" style={{ background: "rgba(139,92,246,0.12)" }}>
          <i className="bi bi-person-vcard-fill" style={{ color: "var(--primary)", fontSize: 22 }} />
        </div>
        <h3 className="font-display text-xl mb-2" style={{ color: "var(--text)" }}>No contacts yet</h3>
        <p className="text-sm" style={{ color: "var(--text-muted)" }}>
          Upload a CSV file or add contacts manually to get started
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {error && (
        <div className="text-sm px-4 py-3 rounded-lg border" style={{ background: "rgba(239,68,68,0.08)", borderColor: "rgba(239,68,68,0.25)", color: "#fca5a5" }}>
          {error}
        </div>
      )}

      {selected.length > 0 && (
        <div
          className="flex flex-wrap items-center justify-between gap-3 px-5 py-3 rounded-xl border"
          style={{ background: "rgba(139,92,246,0.08)", borderColor: "rgba(139,92,246,0.25)" }}
        >
          <span className="text-sm font-medium" style={{ color: "var(--text)" }}>
            {selected.length} selected
          </span>
          {creatingList ? (
            <div className="flex items-center gap-2">
              <input
                autoFocus
                type="text"
                value={listName}
                onChange={(e) => setListName(e.target.value)}
                placeholder="List name"
                className="px-3 py-1.5 rounded-lg border text-sm outline-none focus:border-[var(--primary)]"
                style={{ background: "var(--surface-2)", borderColor: "var(--border)", color: "var(--text)" }}
              />
              <button
                onClick={handleSaveList}
                disabled={savingList}
                className="px-4 py-1.5 rounded-lg text-sm font-medium transition hover:brightness-110 disabled:opacity-50"
                style={{ background: "linear-gradient(135deg, var(--warm), var(--primary))", color: "white" }}
              >
                {savingList ? "Saving…" : "Save"}
              </button>
              <button
                onClick={() => { setCreatingList(false); setListName(""); }}
                className="px-3 py-1.5 rounded-lg text-sm"
                style={{ color: "var(--text-muted)" }}
              >
                Cancel
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <button
                onClick={() => setCreatingList(true)}
                className="px-4 py-1.5 rounded-lg text-sm font-medium transition hover:brightness-110"
                style={{ background: "linear-gradient(135deg, var(--warm), var(--primary))", color: "white" }}
              >
                Save as list
              </button>
              <button onClick={() => setSelected([])} className="text-sm" style={{ color: "var(--text-faint)" }}>
                Clear
              </button>
            </div>
          )}
        </div>
      )}

      <div className="rounded-2xl border overflow-hidden" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr style={{ borderBottom: "1px solid var(--border)" }}>
                <th className="px-6 py-3.5 text-left">
                  <input type="checkbox" checked={selected.length === contacts.length} onChange={toggleAll} />
                </th>
                {["Phone", "Email", "WhatsApp", "Tags", "Added"].map((h) => (
                  <th key={h} className="px-6 py-3.5 text-left text-xs font-medium uppercase tracking-wider" style={{ color: "var(--text-faint)" }}>
                    {h}
                  </th>
                ))}
                <th className="px-6 py-3.5 text-right text-xs font-medium uppercase tracking-wider" style={{ color: "var(--text-faint)" }}>
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {contacts.map((contact, i) => {
                const isDeleting = deletingId === contact.id;
                const isChecked = selected.includes(contact.id);
                return (
                  <tr
                    key={contact.id}
                    className="transition-colors"
                    style={{ borderTop: i === 0 ? "none" : "1px solid var(--border)", opacity: isDeleting ? 0.5 : 1 }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = "var(--surface-2)")}
                    onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                  >
                    <td className="px-6 py-4">
                      <input type="checkbox" checked={isChecked} onChange={() => toggleSelected(contact.id)} />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm"><Cell value={contact.phone} color="var(--sms)" /></td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm"><Cell value={contact.email} color="var(--email)" /></td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm"><Cell value={contact.whatsappId} color="var(--whatsapp)" /></td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {contact.tags.length > 0 ? (
                        <div className="flex flex-wrap gap-1.5">
                          {contact.tags.map((tag, idx) => (
                            <span key={idx} className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium"
                              style={{ background: "var(--surface-2)", color: "var(--primary)", border: "1px solid var(--border)" }}>
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
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <div className="flex items-center justify-end gap-1">
                        <Link
                          href={`/dashboard/contacts/${contact.id}/edit`}
                          aria-label="Edit contact"
                          className="w-8 h-8 rounded-lg flex items-center justify-center transition"
                          style={{ color: "var(--text-muted)" }}
                        >
                          <i className="bi bi-pencil" style={{ fontSize: 14 }} />
                        </Link>
                        <button
                          type="button"
                          disabled={isDeleting}
                          onClick={() => handleDelete(contact.id)}
                          aria-label="Delete contact"
                          className="w-8 h-8 rounded-lg flex items-center justify-center transition disabled:opacity-50"
                          style={{ color: "var(--text-muted)" }}
                        >
                          {isDeleting ? <i className="bi bi-arrow-repeat animate-spin" style={{ fontSize: 14 }} /> : <i className="bi bi-trash" style={{ fontSize: 14 }} />}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}