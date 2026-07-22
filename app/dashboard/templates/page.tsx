import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";
import Link from "next/link";
import TemplatesList from "@/components/templates/TemplatesList";

export default async function TemplatesPage() {
  const session = await auth();
  if (!session) redirect("/auth/signin");

  const templates = await prisma.template.findMany({
    where: { companyId: session.user.companyId },
    orderBy: { createdAt: "desc" },
  });

  const stats = [
    { label: "SMS templates", value: templates.filter((t) => t.channel === "sms").length, accent: "var(--sms)" },
    { label: "Email templates", value: templates.filter((t) => t.channel === "email").length, accent: "var(--email)" },
    { label: "WhatsApp templates", value: templates.filter((t) => t.channel === "whatsapp").length, accent: "var(--whatsapp)" },
  ];

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap justify-between items-start gap-4">
        <div>
          <h1 className="font-display text-3xl" style={{ color: "var(--text)" }}>Templates</h1>
          <p className="mt-1" style={{ color: "var(--text-muted)" }}>Create reusable message templates</p>
        </div>
        <div className="flex items-center gap-4">
          <Link href="/dashboard/campaigns" className="text-sm hover:opacity-80 transition" style={{ color: "var(--text-muted)" }}>
            Use in a campaign →
          </Link>
          <Link
            href="/dashboard/templates/new"
            className="px-5 py-2.5 rounded-full text-sm font-medium transition hover:brightness-110"
            style={{ background: "linear-gradient(135deg, var(--warm), var(--primary))", color: "white" }}
          >
            Create template
          </Link>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-5">
        {stats.map((s) => (
          <div key={s.label} className="rounded-2xl p-6 border" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
            <div className="h-1 w-8 rounded-full mb-4" style={{ background: s.accent, boxShadow: `0 0 10px 1px ${s.accent}` }} />
            <div className="text-sm mb-1" style={{ color: "var(--text-muted)" }}>{s.label}</div>
            <div className="text-3xl font-semibold" style={{ color: "var(--text)" }}>{s.value.toLocaleString()}</div>
          </div>
        ))}
      </div>

      {templates.length === 0 ? (
        <div className="rounded-2xl border p-16 text-center" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-5" style={{ background: "rgba(139,92,246,0.12)" }}>
            <i className="bi bi-file-earmark-text-fill" style={{ color: "var(--primary)", fontSize: 22 }} />
          </div>
          <h2 className="font-display text-xl mb-2" style={{ color: "var(--text)" }}>No templates yet</h2>
          <p className="text-sm mb-8 max-w-sm mx-auto" style={{ color: "var(--text-muted)" }}>
            Create your first template to speed up campaign creation.
          </p>
          <Link
            href="/dashboard/templates/new"
            className="inline-block px-5 py-2.5 rounded-full text-sm font-medium transition hover:brightness-110"
            style={{ background: "linear-gradient(135deg, var(--warm), var(--primary))", color: "white" }}
          >
            Create template
          </Link>
        </div>
      ) : (
        <TemplatesList templates={templates} />
      )}
    </div>
  );
}