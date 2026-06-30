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

function parseCSV(content: string): {
  headers: string[];
  rows: string[][];
} {
  const lines = content.split("\n").filter((line) => line.trim());

  if (lines.length === 0) {
    throw new Error("CSV file is empty");
  }

  const headers = lines[0].split(",").map((h) => h.trim().toLowerCase());
  const rows = lines.slice(1).map((line) => {
    const values: string[] = [];
    let current = "";
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === "," && !inQuotes) {
        values.push(current.trim());
        current = "";
      } else {
        current += char;
      }
    }
    values.push(current.trim());

    return values;
  });

  return { headers, rows };
}

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json(
        { error: "No file provided" },
        { status: 400 }
      );
    }

    if (!file.name.endsWith(".csv")) {
      return NextResponse.json(
        { error: "File must be a CSV" },
        { status: 400 }
      );
    }

    const content = await file.text();
    const { headers, rows } = parseCSV(content);

    if (!headers.includes("phone")) {
      return NextResponse.json(
        { error: "CSV must have a 'phone' column" },
        { status: 400 }
      );
    }

    const phoneIdx = headers.indexOf("phone");
    const emailIdx = headers.indexOf("email");
    const whatsappIdx = headers.indexOf("whatsappid");
    const tagsIdx = headers.indexOf("tags");

    let imported = 0;
    let skipped = 0;
    const errors: string[] = [];

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      if (row.length === 0 || !row[phoneIdx]) {
        skipped++;
        continue;
      }

      const phone = normalizePhone(row[phoneIdx]);
      if (!phone) {
        errors.push(`Row ${i + 2}: Invalid phone number "${row[phoneIdx]}"`);
        skipped++;
        continue;
      }

      const existing = await prisma.contact.findFirst({
        where: {
          companyId: session.user.companyId,
          phone,
        },
      });

      if (existing) {
        skipped++;
        continue;
      }

      const email = emailIdx >= 0 ? row[emailIdx] || null : null;
      const whatsappId = whatsappIdx >= 0 ? row[whatsappIdx] || null : null;
      const tagsRaw = tagsIdx >= 0 ? row[tagsIdx] || "" : "";
      const tags = tagsRaw
        ? tagsRaw.split(";").map((t) => t.trim()).filter(Boolean)
        : [];

      try {
        await prisma.contact.create({
          data: {
            companyId: session.user.companyId,
            phone,
            email,
            whatsappId,
            tags,
          },
        });
        imported++;
      } catch (error) {
        errors.push(`Row ${i + 2}: Failed to import - ${error}`);
        skipped++;
      }
    }

    return NextResponse.json({
      imported,
      skipped,
      errors,
    });
  } catch (error) {
    console.error("CSV upload error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Upload failed" },
      { status: 500 }
    );
  }
}
