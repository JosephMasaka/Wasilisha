import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";
import Link from "next/link";
import TemplatesList from "@/components/templates/TemplatesList";

export default async function TemplatesPage() {
  const session = await auth();

  if (!session) {
    redirect("/auth/signin");
  }

  const templates = await prisma.template.findMany({
    where: { companyId: session.user.companyId },
    orderBy: { createdAt: "desc" },
  });

  const smsTemplates = templates.filter((t) => t.channel === "sms");
  const emailTemplates = templates.filter((t) => t.channel === "email");
  const whatsappTemplates = templates.filter((t) => t.channel === "whatsapp");

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Templates</h1>
          <p className="text-gray-600 mt-1">
            Create reusable message templates
          </p>
        </div>
        <Link
          href="/dashboard/templates/new"
          className="bg-primary-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-primary-700 transition"
        >
          Create Template
        </Link>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="text-sm font-medium text-gray-600 mb-1">
            SMS Templates
          </div>
          <div className="text-3xl font-bold text-gray-900">
            {smsTemplates.length}
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="text-sm font-medium text-gray-600 mb-1">
            Email Templates
          </div>
          <div className="text-3xl font-bold text-gray-900">
            {emailTemplates.length}
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="text-sm font-medium text-gray-600 mb-1">
            WhatsApp Templates
          </div>
          <div className="text-3xl font-bold text-gray-900">
            {whatsappTemplates.length}
          </div>
        </div>
      </div>

      <TemplatesList templates={templates} />
    </div>
  );
}
