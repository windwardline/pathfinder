import type { FactPayload } from './client-api';

/** Preserve all route-affecting structure while changing only user-facing copy. */
export function buildFactCorrectionPayload(
  payload: FactPayload,
  correction: string,
  context = ''
): FactPayload {
  const wording = correction.trim();
  if (!wording) throw new Error('A correction is required.');
  const value = { ...payload.value };

  if (['REQUIREMENT', 'CONSTRAINT', 'BLOCKER'].includes(payload.key)) {
    value.description = wording;
  } else {
    value.title = wording;
  }
  if (payload.key === 'ACTION') value.description = context.trim();

  return { ...payload, value };
}
