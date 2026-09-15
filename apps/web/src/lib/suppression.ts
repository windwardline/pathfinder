// Resend suppression lookup, and the reason the magic-link path needs one.
//
// A send to a suppressed address is ACCEPTED. Resend takes the POST, creates an
// email record with status `suppressed`, delivers nothing, and returns a 2xx
// with an id. `res.ok` is true. So the handler emits success, /check-email
// tells the reader to go look in their inbox, and nothing arrives — ever, and
// with no error anywhere in the system to find. The address stays blocked until
// a human removes it.
//
// This is not hypothetical. One address sat suppressed from 2026-07-28 to
// 2026-09-15 after a single bounce on a mistyped sign-in, and it was found by a
// person reading a dashboard, which is not a mechanism.
//
// `GET /suppressions/:email` answers 200 when the address is suppressed and 404
// when it is not. Those are the only two answers that mean anything; everything
// else is this check failing rather than the address being bad.
//
// **It fails OPEN, deliberately.** If the lookup itself cannot complete — a
// network blip, a 500, a revoked key — the send proceeds. Failing closed here
// would convert every transient Resend hiccup into a total sign-in outage for
// every user, which is far worse than the defect being fixed: this check makes
// an invisible failure visible, it is not an authorization gate. The failure is
// never silent, though — `unknown` is a distinct result its callers report.

export type SuppressionStatus =
  /** The address is on the list. Mail to it is accepted and dropped. */
  | 'suppressed'
  /** Confirmed absent from the list (404). */
  | 'clear'
  /** The lookup could not complete. Not evidence of either other state. */
  | 'unknown'

export const SUPPRESSIONS_ENDPOINT = 'https://api.resend.com/suppressions'

export async function suppressionStatus(
  apiKey: string | undefined,
  email: string,
  fetchImpl: typeof fetch = fetch,
): Promise<SuppressionStatus> {
  // No key configured is not "clear" — it is a lookup that did not happen.
  if (!apiKey) return 'unknown'

  // The address is a path segment. An unencoded `+` tag or `#` would silently
  // address a different resource and answer 404, which reads as clear.
  const url = `${SUPPRESSIONS_ENDPOINT}/${encodeURIComponent(email)}`

  try {
    const res = await fetchImpl(url, {
      headers: { Authorization: `Bearer ${apiKey}` },
    })
    if (res.status === 200) return 'suppressed'
    if (res.status === 404) return 'clear'
    return 'unknown'
  } catch {
    return 'unknown'
  }
}

/**
 * The sign-in gate, as a function a test can call.
 *
 * Enforcement cannot live in `sendVerificationRequest`: @auth/core builds that
 * promise and then awaits a hash before attaching a handler, so rejecting
 * inside that window is an unhandled rejection, which Node ends the process
 * for. The /signin server action runs BEFORE Auth.js is involved and needs no
 * throw — but an inline `if` inside a server action is reachable by no test,
 * and the enforcement of the whole feature would then be the one line nothing
 * covers. This is that line, extracted so it can be exercised.
 *
 * Returns the redirect target when the address must not be sent to, or null to
 * proceed. Only a confirmed `suppressed` blocks: `unknown` proceeds, because a
 * lookup that could not run must not deny anyone sign-in.
 */
export const UNDELIVERABLE_REDIRECT = '/signin?error=Undeliverable'

export async function signinBlockRedirect(
  apiKey: string | undefined,
  email: string,
  fetchImpl: typeof fetch = fetch,
): Promise<string | null> {
  const status = await suppressionStatus(apiKey, email, fetchImpl)
  return status === 'suppressed' ? UNDELIVERABLE_REDIRECT : null
}
