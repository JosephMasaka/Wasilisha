import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";
import Link from "next/link";
import ContactsTable from "@/components/contacts/ContactsTable";

export default async function ContactsPage() {
  const session = await auth();
  if (!session) {
    redirect("/auth/signin");
  }

  const contacts = await prisma.contact.findMany({
    where: { companyId: session.user.companyId },
    orderBy: { createdAt: "desc" },
  });
  const contactLists = await prisma.contactList.findMany({
    where: { companyId: session.user.companyId },
    orderBy: { createdAt: "desc" },
  });

  const withPhone = contacts.filter((c) => c.phone).length;

  const stats = [
    { label: "Total contacts", value: contacts.length, accent: "var(--primary)" },
    { label: "Contact lists", value: contactLists.length, accent: "var(--warm)" },
    { label: "With phone numbers", value: withPhone, accent: "var(--whatsapp)" },
  ];

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap justify-between items-start gap-4">
        <div>
          <h1 className="font-display text-3xl" style={{ color: "var(--text)" }}>
            Contacts
          </h1>
          <p className="mt-1" style={{ color: "var(--text-muted)" }}>
            Manage your contacts and lists
          </p>
        </div>
        <div className="flex gap-3">
          <Link
            href="/dashboard/contacts/new"
            className="px-4 py-2.5 rounded-full text-sm font-medium border transition hover:border-white/20"
            style={{ borderColor: "var(--border-strong)", color: "var(--text)" }}
          >
            Add contact
          </Link>
          <Link
            href="/dashboard/contacts/upload"
            className="px-4 py-2.5 rounded-full text-sm font-medium transition hover:brightness-110"
            style={{ background: "linear-gradient(135deg, var(--warm), var(--primary))", color: "white" }}
          >
            Upload CSV
          </Link>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-5">
        {stats.map((s) => (
          <div
            key={s.label}
            className="rounded-2xl p-6 border"
            style={{ background: "var(--surface)", borderColor: "var(--border)" }}
          >
            <div
              className="h-1 w-8 rounded-full mb-4"
              style={{ background: s.accent, boxShadow: `0 0 10px 1px ${s.accent}` }}
            />
            <div className="text-sm mb-1" style={{ color: "var(--text-muted)" }}>
              {s.label}
            </div>
            <div className="text-3xl font-semibold" style={{ color: "var(--text)" }}>
              {s.value.toLocaleString()}
            </div>
          </div>
        ))}
      </div>

      {contacts.length === 0 ? (
        <div
          className="rounded-2xl border p-16 text-center"
          style={{ background: "var(--surface)", borderColor: "var(--border)" }}
        >
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-5"
            style={{ background: "rgba(139,92,246,0.12)" }}
          >
            <i className="bi bi-people-fill" style={{ color: "var(--primary)", fontSize: 22 }} />
          </div>
          <h2 className="font-display text-xl mb-2" style={{ color: "var(--text)" }}>
            No contacts yet
          </h2>
          <p className="text-sm mb-8 max-w-sm mx-auto" style={{ color: "var(--text-muted)" }}>
            Add contacts one at a time, or upload a CSV to bring in your whole list at once.
          </p>
          <div className="flex justify-center gap-3">
            <Link
              href="/dashboard/contacts/new"
              className="px-5 py-2.5 rounded-full text-sm font-medium border transition hover:border-white/20"
              style={{ borderColor: "var(--border-strong)", color: "var(--text)" }}
            >
              Add contact
            </Link>
            <Link
              href="/dashboard/contacts/upload"
              className="px-5 py-2.5 rounded-full text-sm font-medium transition hover:brightness-110"
              style={{ background: "linear-gradient(135deg, var(--warm), var(--primary))", color: "white" }}
            >
              Upload CSV
            </Link>
          </div>
        </div>
      ) : (
        <ContactsTable contacts={contacts} />
      )}
    </div>
  );
}