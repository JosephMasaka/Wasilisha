export type EmailBlock =
  | { id: string; type: "heading"; text: string }
  | { id: string; type: "text"; text: string }
  | { id: string; type: "image"; url: string; alt: string; link?: string }
  | { id: string; type: "button"; text: string; url: string }
  | { id: string; type: "divider" }
  | { id: string; type: "spacer" };

const COLORS = {
  primary: "#8b5cf6",
  warm: "#ff8a65",
  text: "#1a1625",
  muted: "#6b6485",
  border: "#e5e2ef",
};

function escapeHtml(s: string) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function blockToHtml(block: EmailBlock): string {
  switch (block.type) {
    case "heading":
      return `<h2 style="margin:0 0 16px;font-family:Georgia,serif;font-size:24px;line-height:1.3;color:${COLORS.text};">${escapeHtml(block.text)}</h2>`;
    case "text":
      return `<p style="margin:0 0 16px;font-family:Arial,sans-serif;font-size:15px;line-height:1.6;color:${COLORS.text};">${escapeHtml(block.text).replace(/\n/g, "<br/>")}</p>`;
    case "image": {
      const img = `<img src="${escapeHtml(block.url)}" alt="${escapeHtml(block.alt)}" style="max-width:100%;height:auto;display:block;margin:0 0 16px;border-radius:8px;" />`;
      return block.link
        ? `<a href="${escapeHtml(block.link)}" style="text-decoration:none;">${img}</a>`
        : img;
    }
    case "button":
      return `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 0 16px;"><tr><td style="border-radius:9999px;background:${COLORS.primary};">
        <a href="${escapeHtml(block.url)}" style="display:inline-block;padding:12px 28px;font-family:Arial,sans-serif;font-size:14px;font-weight:600;color:#ffffff;text-decoration:none;border-radius:9999px;">${escapeHtml(block.text)}</a>
      </td></tr></table>`;
    case "divider":
      return `<hr style="border:none;border-top:1px solid ${COLORS.border};margin:20px 0;" />`;
    case "spacer":
      return `<div style="height:24px;line-height:24px;">&nbsp;</div>`;
    default:
      return "";
  }
}

/** Compiles blocks into a single, reasonably email-client-safe HTML document.
 * Uses inline styles and a table wrapper (not flex/grid) since many email
 * clients — Outlook especially — ignore modern CSS. This covers Gmail,
 * Apple Mail, and most webmail; Outlook desktop can still render spacing
 * slightly differently since it uses Word's rendering engine. */
export function compileEmailHtml(blocks: EmailBlock[], subject: string): string {
  const body = blocks.map(blockToHtml).join("\n");
  return `<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${escapeHtml(subject)}</title>
  </head>
  <body style="margin:0;padding:0;background:#f4f3f8;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f3f8;padding:32px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:16px;padding:32px;">
            <tr><td>
              ${body}
            </td></tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

export function extractPlainText(blocks: EmailBlock[]): string {
  return blocks
    .filter((b) => b.type === "heading" || b.type === "text")
    .map((b: any) => b.text)
    .join("\n\n");
}

let idCounter = 0;
export function newBlockId() {
  idCounter += 1;
  return `blk_${Date.now()}_${idCounter}`;
}