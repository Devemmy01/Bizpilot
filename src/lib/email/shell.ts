/** Escape user-supplied text (business names, item names) before interpolating into email HTML. */
export function escapeHtml(value: unknown): string {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

// Shared branded HTML wrapper for every transactional email Bizpilot sends.
export function renderEmailShell(params: {
  eyebrow: string;
  title: string;
  subtitle?: string;
  bodyHtml: string;
}): string {
  return `<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><title>${params.title}</title></head>
<body style="margin:0;padding:0;font-family:'Inter',Arial,sans-serif;background:#f8fafc">
  <div style="max-width:600px;margin:32px auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,.08)">
    <div style="background:linear-gradient(135deg,#09244b,#0f66d8);padding:32px 40px">
      <p style="margin:0;color:#93c5fd;font-size:12px;font-weight:700;letter-spacing:.1em;text-transform:uppercase">${params.eyebrow}</p>
      <h1 style="margin:8px 0 0;color:#fff;font-size:22px;font-weight:900">${params.title}</h1>
      ${params.subtitle ? `<p style="margin:6px 0 0;color:#bfdbfe;font-size:13px">${params.subtitle}</p>` : ""}
    </div>
    <div style="padding:32px 40px">
      ${params.bodyHtml}
    </div>
    <div style="padding:20px 40px;background:#f8fafc;border-top:1px solid #e2e8f0">
      <p style="margin:0;font-size:11px;color:#94a3b8;text-align:center">Sent by Bizpilot · Pilot your business</p>
    </div>
  </div>
</body>
</html>`;
}
