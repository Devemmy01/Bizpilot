import { sendEmail } from "@/lib/resend";
import { escapeHtml, renderEmailShell } from "@/lib/email/shell";

export async function sendLowStockEmail(
  to: string,
  businessName: string,
  item: { name: string; stock: number; threshold: number; unit: string },
) {
  const html = renderEmailShell({
    eyebrow: "Restock Alert",
    title: escapeHtml(item.name),
    subtitle: escapeHtml(businessName),
    bodyHtml: `
      <div style="background:#fef2f2;border:1px solid #fecaca;border-radius:8px;padding:16px 20px;margin:0 0 20px">
        <p style="margin:0;font-size:13px;color:#7f1d1d;font-weight:700">Stock is below your warning threshold</p>
      </div>
      <table style="width:100%;border-collapse:collapse;font-size:14px">
        <tr>
          <td style="padding:8px 0;color:#64748b;font-weight:600">Current stock</td>
          <td style="padding:8px 0;text-align:right;color:#dc2626;font-weight:800">${item.stock} ${escapeHtml(item.unit)}</td>
        </tr>
        <tr>
          <td style="padding:8px 0;color:#64748b;font-weight:600;border-top:1px solid #e2e8f0">Warning threshold</td>
          <td style="padding:8px 0;text-align:right;color:#0f172a;font-weight:700;border-top:1px solid #e2e8f0">${item.threshold} ${escapeHtml(item.unit)}</td>
        </tr>
      </table>
      <p style="font-size:13px;color:#64748b;margin:20px 0 0">Restock this item soon to avoid running out.</p>
    `,
  });

  return sendEmail({
    to,
    subject: `Low stock: ${item.name} — ${businessName}`,
    html,
  });
}
