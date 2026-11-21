/** Hosted full-word lockup. The portal serves this PNG at the same path. */
export const UNIZ_EMAIL_LOGO_URL =
  "https://uniz.rguktong.in/email/uniz-wordmark.png";

export const UNIZ_PORTAL_URL = "https://uniz.rguktong.in";

const NAVY = "#0b1b3a";
const NAVY_SOFT = "#f2f5fb";
const INK = "#0a0a0b";
const MUTED = "#464b55";
const LINE = "#e3e5e9";
const WHITE = "#ffffff";

export type UnizEmailButton = {
  label: string;
  href: string;
};

export type UnizEmailInput = {
  title: string;
  preheader?: string;
  /** Trusted markup. Callers escape every interpolated value. */
  bodyHtml: string;
  /** Why this person received the message, without the leading "you got this because". */
  reason: string;
  text: string;
  otp?: { code: string; expiresIn: string };
  button?: UnizEmailButton;
  logoUrl?: string;
};

export function escapeEmailHtml(value: string): string {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/**
 * One light, table-based message. Inline CSS only, so Gmail, Outlook, and
 * Apple Mail keep the navy bar, the wordmark, and a single button.
 */
export function renderUnizEmail(input: UnizEmailInput): {
  html: string;
  text: string;
} {
  const title = escapeEmailHtml(input.title);
  const reason = escapeEmailHtml(input.reason);
  const preheader = escapeEmailHtml(input.preheader || input.title);
  const logo = escapeEmailHtml(input.logoUrl || UNIZ_EMAIL_LOGO_URL);
  const otp = input.otp
    ? `
          <tr>
            <td align="center" style="padding:8px 28px 8px 28px;">
              <p style="margin:0;font-family:'Courier New',Courier,monospace;font-size:32px;line-height:40px;letter-spacing:6px;color:${NAVY};">${escapeEmailHtml(input.otp.code)}</p>
              <p style="margin:8px 0 0 0;font-family:Arial,Helvetica,sans-serif;font-size:13px;line-height:18px;color:${MUTED};">This code expires in ${escapeEmailHtml(input.otp.expiresIn)}.</p>
            </td>
          </tr>`
    : "";
  const button = input.button
    ? `
          <tr>
            <td align="left" style="padding:8px 28px 8px 28px;">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td bgcolor="${NAVY}" style="border-radius:6px;">
                    <a href="${escapeEmailHtml(input.button.href)}" style="display:inline-block;padding:12px 22px;font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:20px;color:${WHITE};text-decoration:none;">${escapeEmailHtml(input.button.label)}</a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>`
    : "";

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
</head>
<body style="margin:0;padding:0;background:${NAVY_SOFT};">
  <div style="display:none;max-height:0;overflow:hidden;mso-hide:all;">${preheader}</div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${NAVY_SOFT};">
    <tr>
      <td align="center" style="padding:24px 12px;">
        <!--[if mso]><table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0"><tr><td><![endif]-->
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;background:${WHITE};border:1px solid ${LINE};">
          <tr>
            <td bgcolor="${NAVY}" style="background:${NAVY};padding:18px 28px;">
              <img src="${logo}" width="72" height="44" alt="uniZ" style="display:block;border:0;outline:none;text-decoration:none;height:44px;width:72px;">
            </td>
          </tr>
          <tr>
            <td style="padding:28px 28px 8px 28px;font-family:Georgia,'Times New Roman',serif;font-size:28px;line-height:34px;color:${NAVY};">
              ${title}
            </td>
          </tr>
          <tr>
            <td style="padding:8px 28px 8px 28px;font-family:Arial,Helvetica,sans-serif;font-size:16px;line-height:24px;color:${INK};">
              ${input.bodyHtml}
            </td>
          </tr>${otp}${button}
          <tr>
            <td style="padding:24px 28px 28px 28px;font-family:Arial,Helvetica,sans-serif;font-size:12px;line-height:18px;color:${MUTED};border-top:1px solid ${LINE};">
              Rajiv Gandhi University of Knowledge Technologies, Ongole<br>
              You got this because ${reason}.
            </td>
          </tr>
        </table>
        <!--[if mso]></td></tr></table><![endif]-->
      </td>
    </tr>
  </table>
</body>
</html>`;

  const textLines = [
    input.text.trim(),
    "",
    "uniZ",
    campusFooterLine(),
    `You got this because ${input.reason}.`,
  ];
  return { html, text: textLines.join("\n") };
}

export function campusFooterLine(): string {
  return "Rajiv Gandhi University of Knowledge Technologies, Ongole";
}
