import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const list = await prisma.contactList.findUnique({
    where: { id },
    include: { contacts: true },
  });

  if (!list || list.companyId !== session.user.companyId) {
    return NextResponse.json({ error: "List not found" }, { status: 404 });
  }

  return NextResponse.json(list);
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const existing = await prisma.contactList.findUnique({ where: { id } });
  if (!existing || existing.companyId !== session.user.companyId) {
    return NextResponse.json({ error: "List not found" }, { status: 404 });
  }

  const { name, addContactIds, removeContactIds } = await req.json();

  const list = await prisma.contactList.update({
    where: { id },
    data: {
      name: name ?? undefined,
      contacts: {
        ...(Array.isArray(addContactIds) && addContactIds.length > 0
          ? { connect: addContactIds.map((cid: string) => ({ id: cid })) }
          : {}),
        ...(Array.isArray(removeContactIds) && removeContactIds.length > 0
          ? { disconnect: removeContactIds.map((cid: string) => ({ id: cid })) }
          : {}),
      },
    },
    include: { _count: { select: { contacts: true } } },
  });

  return NextResponse.json({ id: list.id, name: list.name, contactCount: list._count.contacts });
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const existing = await prisma.contactList.findUnique({ where: { id } });
  if (!existing || existing.companyId !== session.user.companyId) {
    return NextResponse.json({ error: "List not found" }, { status: 404 });
  }

  await prisma.contactList.delete({ where: { id } });
  return NextResponse.json({ success: true });
}