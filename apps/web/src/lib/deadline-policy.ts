export type DeadlineSeverity = 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL';

/**
 * Release 1 deadline urgency is a deterministic policy, not a user or model
 * ranking control. Past-due and near-term dates receive the strongest signal.
 */
export function deriveDeadlineSeverity(
  dueAt: string,
  now = new Date()
): DeadlineSeverity {
  const milliseconds = new Date(dueAt).getTime() - now.getTime();
  if (!Number.isFinite(milliseconds)) return 'LOW';
  const hours = milliseconds / 3_600_000;
  if (hours <= 24) return 'CRITICAL';
  if (hours <= 72) return 'HIGH';
  if (hours <= 14 * 24) return 'MODERATE';
  return 'LOW';
}
