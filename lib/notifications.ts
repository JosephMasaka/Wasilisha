import { prisma } from "@/lib/db";
import { Prisma } from "@prisma/client";

export async function notify(
  companyId: string,
  type: string,
  title: string,
  message: string,
  metadata?: Record<string, unknown>
) {
  return prisma.notification.create({
    data: {
      companyId,
      type,
      title,
      message,
      metadata: metadata === undefined ? undefined : (metadata as Prisma.InputJsonValue),
    },
  });
}