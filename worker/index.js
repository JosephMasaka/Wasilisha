const { Worker } = require("bullmq");
const Redis = require("ioredis");
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

const connection = new Redis(process.env.REDIS_URL || "redis://localhost:6379", {
  maxRetriesPerRequest: null,
});

// Provider imports
const AfricasTalking = require("africastalking");
const { Resend } = require("resend");

const atClient = AfricasTalking({
  apiKey: process.env.AFRICASTALKING_API_KEY,
  username: process.env.AFRICASTALKING_USERNAME,
});
const sms = atClient.SMS;

const resend = new Resend(process.env.RESEND_API_KEY);

async function sendSMS(to, message, from) {
  try {
    const options = {
      to: [to],
      message,
      ...(from && { from }),
    };

    const result = await sms.send(options);

    if (result.SMSMessageData.Recipients.length > 0) {
      const recipient = result.SMSMessageData.Recipients[0];

      if (recipient.status === "Success") {
        return {
          success: true,
          messageId: recipient.messageId,
          cost: recipient.cost,
        };
      } else {
        return {
          success: false,
          error: recipient.status,
        };
      }
    }

    return {
      success: false,
      error: "No recipients processed",
    };
  } catch (error) {
    console.error("SMS send error:", error);
    return {
      success: false,
      error: error.message || "Unknown error",
    };
  }
}

async function sendEmail(to, subject, content, fromName) {
  try {
    const from = fromName
      ? `${fromName} <onboarding@resend.dev>`
      : "Wasilisha <onboarding@resend.dev>";

    const isHtml = content.trim().startsWith("<");

    const result = await resend.emails.send({
      from,
      to: [to],
      subject,
      ...(isHtml ? { html: content } : { text: content }),
    });

    if (result.error) {
      return {
        success: false,
        error: result.error.message,
      };
    }

    return {
      success: true,
      messageId: result.data?.id,
      cost: "0.10",
    };
  } catch (error) {
    console.error("Email send error:", error);
    return {
      success: false,
      error: error.message || "Unknown error",
    };
  }
}

async function sendWhatsApp(to, content) {
  try {
    const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
    const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;

    if (!accessToken || !phoneNumberId) {
      throw new Error("WhatsApp credentials not configured");
    }

    const url = `https://graph.facebook.com/v18.0/${phoneNumberId}/messages`;

    const response = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to: to.replace(/[^0-9]/g, ""),
        type: "text",
        text: {
          body: content,
        },
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || "WhatsApp send failed");
    }

    const result = await response.json();

    return {
      success: true,
      messageId: result.messages?.[0]?.id,
      cost: "0.50",
    };
  } catch (error) {
    console.error("WhatsApp send error:", error);
    return {
      success: false,
      error: error.message || "Unknown error",
    };
  }
}

const worker = new Worker(
  "messages",
  async (job) => {
    const { messageId, companyId, channel, to, content, costKes, metadata } = job.data;

    console.log(`Processing message ${messageId} to ${to} via ${channel}`);

    try {
      await prisma.$transaction(async (tx) => {
        const company = await tx.company.findUnique({
          where: { id: companyId },
          select: { walletBalance: true, senderIdSms: true, name: true },
        });

        if (!company) {
          throw new Error("Company not found");
        }

        const balanceNum = parseFloat(company.walletBalance.toString());
        if (balanceNum < costKes) {
          throw new Error("Insufficient wallet balance");
        }

        let result;
        if (channel === "sms") {
          result = await sendSMS(to, content, company.senderIdSms);
        } else if (channel === "email") {
          result = await sendEmail(
            to,
            metadata?.subject || "Message from Wasilisha",
            content,
            company.name
          );
        } else if (channel === "whatsapp") {
          result = await sendWhatsApp(to, content);
        } else {
          throw new Error(`Unsupported channel: ${channel}`);
        }

        if (!result.success) {
          await tx.message.update({
            where: { id: messageId },
            data: {
              status: "failed",
              errorMessage: result.error || "Unknown error",
            },
          });
          throw new Error(result.error || "Send failed");
        }

        // Check if using subscription credits
        const subscriptionPlan = company.subscriptionPlan || (await tx.company.findUnique({
          where: { id: companyId },
          select: { subscriptionPlan: true, subscriptionStatus: true }
        })).subscriptionPlan;

        let useSubscriptionCredits = false;
        if (subscriptionPlan && company.subscriptionStatus === "active") {
          // Get usage this month
          const usage = await tx.message.count({
            where: {
              campaign: {
                companyId,
              },
              channel,
              createdAt: {
                gte: new Date(new Date().setDate(1)),
              },
            },
          });

          const includedField = channel === "sms"
            ? "includedSmsCredits"
            : channel === "email"
            ? "includedEmailCredits"
            : "includedWhatsappCredits";

          const included = subscriptionPlan[includedField];
          useSubscriptionCredits = usage < included;
        }

        if (!useSubscriptionCredits) {
          // Debit wallet
          await tx.company.update({
            where: { id: companyId },
            data: {
              walletBalance: {
                decrement: costKes,
              },
            },
          });

          await tx.walletTransaction.create({
            data: {
              companyId,
              type: "debit",
              amountKes: costKes,
              channel,
              status: "success",
            },
          });
        } else {
          console.log(`Using subscription credits for ${channel} message`);
        }

        await tx.message.update({
          where: { id: messageId },
          data: {
            status: "sent",
            providerMessageId: result.messageId,
            sentAt: new Date(),
          },
        });

        console.log(`Message ${messageId} sent successfully via ${channel}`);
      });
    } catch (error) {
      console.error(`Failed to process message ${messageId}:`, error);

      await prisma.message.update({
        where: { id: messageId },
        data: {
          status: "failed",
          errorMessage: error.message,
        },
      });

      throw error;
    }
  },
  {
    connection,
    concurrency: 10,
    limiter: {
      max: 100,
      duration: 1000,
    },
  }
);

worker.on("completed", (job) => {
  console.log(`Job ${job.id} completed`);
});

worker.on("failed", (job, err) => {
  console.error(`Job ${job?.id} failed:`, err);
});

worker.on("error", (err) => {
  console.error("Worker error:", err);
});

console.log("Worker started, listening for messages (SMS, Email, WhatsApp)...");

process.on("SIGINT", async () => {
  console.log("Shutting down worker...");
  await worker.close();
  await prisma.$disconnect();
  process.exit(0);
});
