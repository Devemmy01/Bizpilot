import { Resend } from "resend";

export function getResendClient() {
  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey) {
    throw new Error("RESEND_API_KEY is not configured");
  }

  return new Resend(apiKey);
}

export function getFromEmail() {
  return process.env.REPORT_FROM_EMAIL ?? "Bizpilot <onboarding@resend.dev>";
}

/**
 * Send an email and throw if Resend rejects it. The Resend SDK reports API failures
 * (unverified domain, bad recipient, rate limit) as `{ error }` rather than throwing,
 * so without this check a failed send looks like a success.
 */
export async function sendEmail(params: { to: string; subject: string; html: string }) {
  const { data, error } = await getResendClient().emails.send({
    from: getFromEmail(),
    ...params,
  });

  if (error) {
    throw new Error(`Email to ${params.to} failed: ${error.message}`);
  }

  return data;
}
