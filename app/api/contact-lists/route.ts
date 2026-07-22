import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET() {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const lists = await prisma.contactList.findMany({
    where: { companyId: session.user.companyId },
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { contacts: true } } },
  });

  return NextResponse.json(
    lists.map((l) => ({
      id: l.id,
      name: l.name,
      contactCount: l._count.contacts,
      createdAt: l.createdAt,
    }))
  );
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { name, contactIds } = await req.json();
  if (!name) {
    return NextResponse.json({ error: "List name is required" }, { status: 400 });
  }

  // ownership check: only connect contacts that actually belong to this company
  const validIds =
    Array.isArray(contactIds) && contactIds.length > 0
      ? (
          await prisma.contact.findMany({
            where: { id: { in: contactIds }, companyId: session.user.companyId },
            select: { id: true },
          })
        ).map((c) => c.id)
      : [];

  const list = await prisma.contactList.create({
    data: {
      companyId: session.user.companyId,
      name,
      contacts: validIds.length > 0 ? { connect: validIds.map((id) => ({ id })) } : undefined,
    },
    include: { _count: { select: { contacts: true } } },
  });

  return NextResponse.json({ id: list.id, name: list.name, contactCount: list._count.contacts });
}