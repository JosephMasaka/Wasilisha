import { Resend } from "resend";
import { SendResult } from "./index";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendEmail(
  to: string,
  subject: string,
  content: string,
  fromName?: string
): Promise<SendResult> {
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
    console.error("Resend email error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}
