import { getMailer } from "@config/mailer";

export interface SendEmailPayload {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  list?: {
    unsubscribe?: any;
  } | object;
  attachments?: any[];
}

export const sendEmail = async (
  sender: string = "Dashboard - Escape Nomade <server@escapenomade.com>", 
  payload: SendEmailPayload
) => {
  const transporter = getMailer();

  try {
    const info = await transporter.sendMail({
      from: sender,
      to: payload.to,
      subject: payload.subject,
      html: payload.html,
      text: payload.text,
      attachments: payload.attachments,
    });

    console.log(`[EMAIL_SENT] Message ID: ${info.messageId}`);

    return {
      messageId: info.messageId,
      accepted: info.accepted,
    };
  } catch (error: any) {
    console.error("[GMAIL_API_ERROR]", error.message);
    throw new Error(`Failed to send email to : ${payload.to}`);
  }
};