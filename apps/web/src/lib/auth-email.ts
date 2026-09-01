// House-standard magic-link email, shared with LevelFlow:
// "{App} <login@windwardline.com>" sender, "Your {App} sign-in link" subject,
// headline / expiry sentence / brand button / ignore-line body. Only the app
// name, accent color, and true link expiry vary per product.
export const MAGIC_LINK_FROM = 'Pathfinder <login@windwardline.com>';

const BRAND = '#17594e'; // spruce, from globals.css

// Dark-mode hardened per the standard (2026-08-02). A dark-mode client recolors
// anything left to a default, so the document declares a light scheme, the
// wrapper and the button carry `bgcolor` fallbacks, and every text color is
// named. The footer moved from `#667` (~3.1:1 under inversion) to `#555555`.
// This sender owns the whole document — nothing wraps what Resend is handed —
// so the head carries the scheme meta tags as well.
export function magicLinkEmail(url: string): {
  subject: string;
  html: string;
  text: string;
} {
  return {
    subject: 'Your Pathfinder sign-in link',
    html: `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="color-scheme" content="light">
    <meta name="supported-color-schemes" content="light">
  </head>
  <body style="margin:0;padding:0;background-color:#ffffff">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#ffffff" style="color-scheme:light;background-color:#ffffff">
      <tr><td style="font-family:system-ui,sans-serif;line-height:1.5;color:#111111">
        <h2 style="margin:0 0 12px;color:#111111">Sign in to Pathfinder</h2>
        <p style="color:#111111">Click the button below to sign in. This link expires in 15 minutes.</p>
        <table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr>
          <td bgcolor="${BRAND}" style="border-radius:8px"><a href="${url}" style="display:inline-block;background-color:${BRAND};color:#ffffff;text-decoration:none;padding:10px 18px;border-radius:8px;font-weight:600">Sign in</a></td>
        </tr></table>
        <p style="color:#555555;font-size:13px">If you didn't request this, you can ignore it.</p>
      </td></tr>
    </table>
  </body>
</html>`,
    text: `Sign in to Pathfinder\n\n${url}\n\nThis link expires in 15 minutes. If you didn't request this, you can ignore it.`,
  };
}
