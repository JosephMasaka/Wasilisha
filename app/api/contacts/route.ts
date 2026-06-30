import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

function normalizePhone(phone: string): string | null {
  const cleaned = phone.replace(/\s+/g, "").replace(/[-()\s]/g, "");

  if (cleaned.startsWith("0") && cleaned.length === 10) {
    return `+254${cleaned.slice(1)}`;
  }

  if (cleaned.startsWith("254") && cleaned.length === 12) {
    return `+${cleaned}`;
  }

  if (cleaned.startsWith("+254") && cleaned.length === 13) {
    return cleaned;
  }

  if (/^\d{9}$/.test(cleaned)) {
    return `+254${cleaned}`;
  }

  return null;
}

export async function GET(req: Request) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const contacts = await prisma.contact.findMany({
      where: { companyId: session.user.companyId },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(contacts);
  } catch (error) {
    console.error("Fetch contacts error:", error);
    return NextResponse.json(
      { error: "Failed to fetch contacts" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { phone, email, whatsappId, tags } = await req.json();

    if (!phone) {
      return NextResponse.json(
        { error: "Phone number is required" },
        { status: 400 }
      );
    }

    const normalizedPhone = normalizePhone(phone);
    if (!normalizedPhone) {
      return NextResponse.json(
        { error: "Invalid phone number format" },
        { status: 400 }
      );
    }

    const existing = await prisma.contact.findFirst({
      where: {
        companyId: session.user.companyId,
        phone: normalizedPhone,
      },
    });

    if (existing) {
      return NextResponse.json(
        { error: "A contact with this phone number already exists" },
        { status: 400 }
      );
    }

    const contact = await prisma.contact.create({
      data: {
        companyId: session.user.companyId,
        phone: normalizedPhone,
        email: email || null,
        whatsappId: whatsappId || null,
        tags: tags || [],
      },
    });

    return NextResponse.json(contact);
  } catch (error) {
    console.error("Create contact error:", error);
    return NextResponse.json(
      { error: "Failed to create contact" },
      { status: 500 }
    );
  }
}
