import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const existing = await prisma.contact.findUnique({ where: { id } });

  if (!existing || existing.companyId !== session.user.companyId) {
    return NextResponse.json({ error: "Contact not found" }, { status: 404 });
  }

  const body = await req.json();
  const { phone, email, whatsappId, tags } = body;

  if (!phone) {
    return NextResponse.json({ error: "Phone number is required" }, { status: 400 });
  }

  try {
    const updated = await prisma.contact.update({
      where: { id },
      data: {
        phone,
        email: email || null,
        whatsappId: whatsappId || null,
        tags: Array.isArray(tags) ? tags : [],
      },
    });

    return NextResponse.json(updated);
  } catch (err) {
    return NextResponse.json({ error: "Failed to update contact" }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const existing = await prisma.contact.findUnique({ where: { id } });

  if (!existing || existing.companyId !== session.user.companyId) {
    return NextResponse.json({ error: "Contact not found" }, { status: 404 });
  }

  try {
    await prisma.contact.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: "Failed to delete contact" }, { status: 500 });
  }
}