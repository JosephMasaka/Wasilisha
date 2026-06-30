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

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Contacts</h1>
          <p className="text-gray-600 mt-1">
            Manage your contacts and lists
          </p>
        </div>
        <div className="flex space-x-3">
          <Link
            href="/dashboard/contacts/upload"
            className="bg-primary-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-primary-700 transition"
          >
            Upload CSV
          </Link>
          <Link
            href="/dashboard/contacts/new"
            className="bg-white text-primary-600 px-4 py-2 rounded-lg font-medium border border-primary-600 hover:bg-primary-50 transition"
          >
            Add Contact
          </Link>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="text-sm font-medium text-gray-600 mb-1">
            Total Contacts
          </div>
          <div className="text-3xl font-bold text-gray-900">
            {contacts.length}
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="text-sm font-medium text-gray-600 mb-1">
            Contact Lists
          </div>
          <div className="text-3xl font-bold text-gray-900">
            {contactLists.length}
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="text-sm font-medium text-gray-600 mb-1">
            With Phone Numbers
          </div>
          <div className="text-3xl font-bold text-gray-900">
            {contacts.filter((c) => c.phone).length}
          </div>
        </div>
      </div>

      <ContactsTable contacts={contacts} />
    </div>
  );
}
