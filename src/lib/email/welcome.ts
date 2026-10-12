import { sendEmail } from "@/lib/resend";
import { escapeHtml, renderEmailShell } from "@/lib/email/shell";

export async function sendWelcomeEmail(to: string, businessName: string) {
  const html = renderEmailShell({
    eyebrow: "Welcome to Bizpilot",
    title: `${escapeHtml(businessName)} is live`,
    subtitle: "Your command center is ready.",
    bodyHtml: `
      <p style="font-size:15px;color:#334155;line-height:1.6;margin:0 0 16px">Hello,</p>
      <p style="font-size:15px;color:#334155;line-height:1.6;margin:0 0 16px">
        <strong>${escapeHtml(businessName)}</strong> has been set up on Bizpilot. From here you can log daily sales and
        expenses, track inventory and staff, and get automatic profit &amp; margin calculations — no spreadsheet required.
      </p>
      <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;padding:16px 20px;margin:20px 0">
        <p style="margin:0;font-size:13px;color:#065f46;font-weight:600">Next steps</p>
        <ul style="margin:8px 0 0;padding-left:18px;color:#065f46;font-size:13px;line-height:1.7">
          <li>Log today's sales and expenses on the Dashboard tab</li>
          <li>Register your inventory to get low-stock alerts</li>
          <li>Add staff to track sales and tasks per team member</li>
        </ul>
      </div>
    `,
  });

  return sendEmail({
    to,
    subject: `Welcome to Bizpilot, ${businessName}`,
    html,
  });
}
