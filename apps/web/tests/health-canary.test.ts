import { describe, expect, it } from 'vitest';
import { runRouteEngineCanary } from '../src/lib/route-engine-canary';

describe('Route Engine readiness canary', () => {
  it('executes the canonical deterministic routing path', () => {
    const result = runRouteEngineCanary();
    expect(result.ready).toBe(true);
    expect(result.focusTitle).toBe('Obtain a state identification card');
    expect(result.reasonCodes).toEqual(expect.arrayContaining([
      'HARD_PREREQUISITE',
      'HIGH_UNLOCK_VALUE',
    ]));
  });
});
