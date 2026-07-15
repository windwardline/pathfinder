import { afterEach, describe, expect, it, vi } from 'vitest';
import { emitOperationalEvent } from '../src/lib/telemetry';

describe('privacy-safe operational telemetry', () => {
  afterEach(() => vi.restoreAllMocks());

  it('emits the complete structured contract without accepting user or Fact values', () => {
    const info = vi.spyOn(console, 'info').mockImplementation(() => undefined);
    emitOperationalEvent({
      correlationId: 'correlation-1',
      service: 'route-engine',
      operation: 'route_generation',
      outcome: 'success',
      durationMs: 12.6,
      routeStatus: 'ACTIVE',
    });

    const record = JSON.parse(String(info.mock.calls[0][0]));
    expect(record).toMatchObject({
      correlation_id: 'correlation-1',
      request_id: 'correlation-1',
      service: 'route-engine',
      operation: 'route_generation',
      severity: 'info',
      outcome: 'success',
      duration_ms: 13,
      route_status: 'ACTIVE',
    });
    expect(JSON.stringify(record)).not.toMatch(/user|email|document|fact_value/i);
  });

  it('records rejected operations as warnings', () => {
    const warning = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    emitOperationalEvent({
      correlationId: 'correlation-2',
      service: 'facts',
      operation: 'fact_mutation',
      outcome: 'rejected',
      mutation: 'confirm',
      httpStatus: 409,
    });

    expect(JSON.parse(String(warning.mock.calls[0][0]))).toMatchObject({
      severity: 'warning',
      outcome: 'rejected',
      http_status: 409,
    });
  });
});
