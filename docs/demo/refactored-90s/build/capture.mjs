// Choreographed full-screen capture of the seeded SD-008 scenario with a
// visible cursor and click ripples. Records 1920x1080 webm + prints beat marks.
import { chromium } from '@playwright/test';

const OUT = new URL('./captures2/', import.meta.url).pathname;
const mark = (name, t0) => console.log(`MARK ${name} ${((Date.now() - t0) / 1000).toFixed(2)}`);

const CURSOR_JS = `
  const dot = document.createElement('div');
  dot.id = '__cap_cursor';
  Object.assign(dot.style, {
    position: 'fixed', left: '0px', top: '0px', width: '26px', height: '26px',
    borderRadius: '50%', background: 'rgba(121,200,187,0.95)',
    border: '3px solid rgba(7,17,14,0.9)', zIndex: 2147483647,
    pointerEvents: 'none', transform: 'translate(-50%,-50%)',
    boxShadow: '0 2px 10px rgba(0,0,0,0.45)', transition: 'none',
  });
  document.addEventListener('DOMContentLoaded', () => document.body.appendChild(dot));
  if (document.body) document.body.appendChild(dot);
  window.addEventListener('mousemove', e => {
    dot.style.left = e.clientX + 'px';
    dot.style.top = e.clientY + 'px';
  }, true);
  window.addEventListener('mousedown', e => {
    const r = document.createElement('div');
    Object.assign(r.style, {
      position: 'fixed', left: e.clientX + 'px', top: e.clientY + 'px',
      width: '26px', height: '26px', borderRadius: '50%',
      border: '4px solid rgba(217,164,65,0.95)', zIndex: 2147483646,
      pointerEvents: 'none', transform: 'translate(-50%,-50%)',
      animation: '__cap_ripple 0.6s ease-out forwards',
    });
    document.body.appendChild(r);
    setTimeout(() => r.remove(), 700);
  }, true);
  const st = document.createElement('style');
  st.textContent = '@keyframes __cap_ripple { to { width: 90px; height: 90px; opacity: 0; } }';
  document.head ? document.head.appendChild(st) : document.addEventListener('DOMContentLoaded', () => document.head.appendChild(st));
`;

async function glide(page, x, y, ms = 900) {
  const steps = Math.max(12, Math.round(ms / 16));
  await page.mouse.move(x, y, { steps });
}

async function glideTo(page, locator, ms = 900) {
  const box = await locator.boundingBox();
  if (!box) throw new Error('no box for locator');
  await glide(page, box.x + box.width / 2, box.y + box.height / 2, ms);
  return box;
}

const browser = await chromium.launch();
const ctx = await browser.newContext({
  viewport: { width: 1920, height: 1080 },
  deviceScaleFactor: 1,
  recordVideo: { dir: OUT, size: { width: 1920, height: 1080 } },
});
await ctx.addCookies([{ name: 'authjs.session-token', value: 'demo-capture-token', domain: 'localhost', path: '/' }]);
await ctx.addInitScript(CURSOR_JS);
const page = await ctx.newPage();

const t0 = Date.now();
await page.goto('http://localhost:3000/today', { waitUntil: 'networkidle' });
await page.mouse.move(1500, 900);
mark('today_loaded', t0);
await page.waitForTimeout(2500);

// glide to Mark as complete, hover, click
const markBtn = page.getByRole('button', { name: /mark as complete/i }).first();
await glideTo(page, markBtn, 1100);
mark('hover_mark', t0);
await page.waitForTimeout(900);
await markBtn.click({ delay: 90 });
mark('click_mark', t0);
await page.waitForTimeout(3500);
mark('after_dialog_hold', t0);

// if a route-updated dialog is present, glide to its confirm button and click
const backBtn = page.getByRole('button', { name: /back to your route|got it|close/i }).first();
if (await backBtn.isVisible().catch(() => false)) {
  await glideTo(page, backBtn, 900);
  await page.waitForTimeout(700);
  await backBtn.click({ delay: 80 });
  mark('click_back', t0);
  await page.waitForTimeout(2500);
}

// route history via nav
const histLink = page.getByRole('link', { name: /route history/i }).first();
await glideTo(page, histLink, 1000);
await page.waitForTimeout(600);
await histLink.click({ delay: 80 });
mark('click_history', t0);
await page.waitForTimeout(1200);
await page.waitForLoadState('networkidle');
mark('history_loaded', t0);
await page.mouse.move(1400, 820);
await page.waitForTimeout(2500);
await page.mouse.wheel(0, 420);
await page.waitForTimeout(2600);
mark('end', t0);

await ctx.close();
await browser.close();
console.log('CAPTURE DONE');
