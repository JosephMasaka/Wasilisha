import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { redirect, notFound } from "next/navigation";
import EditContactForm from "@/components/contacts/EditContactForm";

export default async function EditContactPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const session = await auth();
  if (!session) {
    redirect("/auth/signin");
  }

  const contact = await prisma.contact.findUnique({
    where: { id },
  });

  if (!contact || contact.companyId !== session.user.companyId) {
    notFound();
  }

  return <EditContactForm contact={contact} />;
}