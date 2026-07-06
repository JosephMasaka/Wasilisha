import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding subscription plans...");

  const starter = await prisma.subscriptionPlan.upsert({
    where: { id: "starter-plan" },
    update: {},
    create: {
      id: "starter-plan",
      name: "Starter",
      monthlyPriceKes: 2000,
      includedSmsCredits: 1000,
      includedEmailCredits: 5000,
      includedWhatsappCredits: 500,
      overageRateSms: 0.8,
      overageRateEmail: 0.1,
      overageRateWhatsapp: 0.5,
    },
  });

  const growth = await prisma.subscriptionPlan.upsert({
    where: { id: "growth-plan" },
    update: {},
    create: {
      id: "growth-plan",
      name: "Growth",
      monthlyPriceKes: 5000,
      includedSmsCredits: 3000,
      includedEmailCredits: 15000,
      includedWhatsappCredits: 1500,
      overageRateSms: 0.75,
      overageRateEmail: 0.09,
      overageRateWhatsapp: 0.45,
    },
  });

  const scale = await prisma.subscriptionPlan.upsert({
    where: { id: "scale-plan" },
    update: {},
    create: {
      id: "scale-plan",
      name: "Scale",
      monthlyPriceKes: 10000,
      includedSmsCredits: 7000,
      includedEmailCredits: 35000,
      includedWhatsappCredits: 3500,
      overageRateSms: 0.7,
      overageRateEmail: 0.08,
      overageRateWhatsapp: 0.4,
    },
  });

  console.log("Seeded plans:", { starter, growth, scale });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
