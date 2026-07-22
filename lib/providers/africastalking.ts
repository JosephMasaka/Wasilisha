import { SendResult } from "./index";

const AfricasTalking = require("africastalking");

const client = AfricasTalking({
  apiKey: process.env.AFRICASTALKING_API_KEY,
  username: process.env.AFRICASTALKING_USERNAME,
});

const sms = client.SMS;

export async function sendSMS(
  to: string,
  message: string,
  from?: string
): Promise<SendResult> {
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
    console.error("Africa's Talking SMS error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}
