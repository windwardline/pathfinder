// House-standard magic-link email, shared with TimeShift and LevelFlow:
// "{App} <login@windwardline.com>" sender, "Your {App} sign-in link" subject,
// headline / expiry sentence / brand button / ignore-line body. Only the app
// name, accent color, and true link expiry vary per product.
export const MAGIC_LINK_FROM = 'Pathfinder <login@windwardline.com>';

const BRAND = '#17594e'; // spruce, from globals.css

export function magicLinkEmail(url: string): {
  subject: string;
  html: string;
  text: string;
} {
  return {
    subject: 'Your Pathfinder sign-in link',
    html: `
      <div style="font-family:system-ui,sans-serif;line-height:1.5">
        <h2 style="margin:0 0 12px">Sign in to Pathfinder</h2>
        <p>Click the button below to sign in. This link expires in 15 minutes.</p>
        <p><a href="${url}" style="display:inline-block;background:${BRAND};color:#fff;
           text-decoration:none;padding:10px 18px;border-radius:8px;font-weight:600">Sign in</a></p>
        <p style="color:#667;font-size:13px">If you didn't request this, you can ignore it.</p>
      </div>`,
    text: `Sign in to Pathfinder\n\n${url}\n\nThis link expires in 15 minutes. If you didn't request this, you can ignore it.`,
  };
}
