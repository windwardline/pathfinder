import { describe, expect, it } from 'vitest';
import { MAGIC_LINK_FROM, magicLinkEmail } from '../src/lib/auth-email';

// House standard shared with TimeShift and LevelFlow: sender is
// "{App} <login@windwardline.com>", subject is "Your {App} sign-in link",
// body is headline / expiry sentence / brand button / ignore-line footer.
describe('magic link email (house standard)', () => {
  const url =
    'https://pathfinder.example/verify?callbackUrl=%2Fapi%2Fauth%2Fcallback%2Fresend%3Ftoken%3Dsecret';
  const email = magicLinkEmail(url);

  it('sends from the shared login identity', () => {
    expect(MAGIC_LINK_FROM).toBe('Pathfinder <login@windwardline.com>');
  });

  it('uses the house subject pattern', () => {
    expect(email.subject).toBe('Your Pathfinder sign-in link');
  });

  it('renders headline, expiry copy, brand button, and ignore-line', () => {
    expect(email.html).toContain('Sign in to Pathfinder');
    expect(email.html).toContain('This link expires in 15 minutes.');
    expect(email.html).toContain(`href="${url}"`);
    expect(email.html).toContain('#17594e');
    expect(email.html).toContain("If you didn't request this, you can ignore it.");
  });

  it('includes a plain-text alternative carrying the same link', () => {
    expect(email.text).toContain(url);
    expect(email.text).toContain('15 minutes');
  });
});

// Hardened 2026-08-02: dark-mode mail clients recolor anything left to a
// default, and the old #667 footer fell to roughly 3.1:1 under inversion.
describe('magic link email (dark mode)', () => {
  const email = magicLinkEmail('https://pathfinder.example/verify?callbackUrl=%2F');

  it('declares a light scheme the client is asked not to override', () => {
    expect(email.html).toContain('color-scheme:light');
    expect(email.html).toContain('<meta name="color-scheme" content="light">');
    expect(email.html).toContain('<meta name="supported-color-schemes" content="light">');
  });

  it('backs the wrapper and the button with bgcolor attributes', () => {
    expect(email.html).toContain('bgcolor="#ffffff"');
    expect(email.html).toContain('bgcolor="#17594e"');
  });

  it('states every text color, at the accent of record', () => {
    expect(email.html).toContain('color:#111111');
    expect(email.html).toContain('color:#555555');
    expect(email.html).toContain('background-color:#17594e');
    expect(email.html).toContain('color:#ffffff');
  });

  it('leaves no element carrying a client default', () => {
    expect(email.html).not.toContain('#667');
    expect(email.html).not.toMatch(/<p>/);
    expect(email.html).not.toMatch(/<h2 style="margin:0 0 12px">/);
  });
});
