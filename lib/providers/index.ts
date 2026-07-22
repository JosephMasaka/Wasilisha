export interface SendResult {
  success: boolean;
  messageId?: string;
  cost?: string;
  error?: string;
}

export interface ProviderAdapter {
  send(to: string, content: string, metadata?: Record<string, unknown>): Promise<SendResult>;
}

export async function sendMessage(
  channel: "sms" | "email" | "whatsapp",
  to: string,
  content: string,
  metadata?: Record<string, unknown>
): Promise<SendResult> {
  switch (channel) {
    case "sms":
      const { sendSMS } = await import("./africastalking");
      return sendSMS(to, content, metadata?.from as string | undefined);

    case "email":
      const { sendEmail } = await import("./resend");
      return sendEmail(
        to,
        metadata?.subject as string || "Message from Wasilisha",
        content,
        metadata?.fromName as string | undefined
      );

    case "whatsapp":
      const { sendWhatsApp } = await import("./whatsapp");
      return sendWhatsApp(to, content);

    default:
      return {
        success: false,
        error: `Unsupported channel: ${channel}`,
      };
  }
}
