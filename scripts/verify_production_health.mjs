#!/usr/bin/env node

const healthUrl =
  process.env.HEALTH_URL ?? 'https://pathfinder.windwardline.com/api/health';

function fail(message, details = {}) {
  console.error(
    JSON.stringify({
      timestamp: new Date().toISOString(),
      service: 'pathfinder-production',
      operation: 'health_verification',
      severity: 'error',
      outcome: 'failed',
      message,
      ...details,
    })
  );
  process.exitCode = 1;
}

try {
  const startedAt = performance.now();
  const response = await fetch(healthUrl, {
    headers: { accept: 'application/json' },
    signal: AbortSignal.timeout(10_000),
  });
  const durationMs = Math.round(performance.now() - startedAt);
  const body = await response.json().catch(() => null);

  if (!response.ok || !body || typeof body !== 'object') {
    fail('Health endpoint did not return a successful JSON response.', {
      http_status: response.status,
      duration_ms: durationMs,
    });
  } else {
    const checks = body.checks ?? {};
    const failedChecks = ['application', 'database', 'configuration', 'route_engine']
      .filter(check => checks[check] !== true);

    if (body.status !== 'ready' || failedChecks.length > 0) {
      fail('Pathfinder reported that production is not ready.', {
        http_status: response.status,
        duration_ms: durationMs,
        failed_checks: failedChecks,
        correlation_id: body.correlation_id ?? null,
      });
    } else {
      console.log(
        JSON.stringify({
          timestamp: new Date().toISOString(),
          service: 'pathfinder-production',
          operation: 'health_verification',
          severity: 'info',
          outcome: 'ready',
          http_status: response.status,
          duration_ms: durationMs,
          correlation_id: body.correlation_id ?? null,
          engine_version: body.versions?.engine ?? null,
          rule_set_version: body.versions?.rule_set ?? null,
        })
      );
    }
  }
} catch (error) {
  fail('Health endpoint request failed.', {
    error_category: error instanceof Error ? error.name : 'UnknownError',
  });
}
