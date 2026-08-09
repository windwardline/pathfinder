#!/usr/bin/env node

const healthUrl =
  process.env.HEALTH_URL ?? 'https://pathfinder.windwardline.com/api/health';

// One retry, short warm-up delay: three false alarms in 44 hours (2026-08-06/07)
// were serverless-Postgres cold-start connect latency, not outages. A single
// retry absorbs a cold start while a genuinely down database still fails the
// run within ~25 seconds. The first miss is logged at warning severity so
// flakes stay visible in the run log without opening an alert issue.
const MAX_ATTEMPTS = 2;
const RETRY_DELAY_MS = Number(process.env.HEALTH_RETRY_DELAY_MS ?? 5_000);

function emit(severity, outcome, message, details = {}) {
  const line = JSON.stringify({
    timestamp: new Date().toISOString(),
    service: 'pathfinder-production',
    operation: 'health_verification',
    severity,
    outcome,
    message,
    ...details,
  });
  if (severity === 'error') {
    console.error(line);
  } else {
    console.log(line);
  }
}

/** One probe. Returns null on success, or a { message, details } failure. */
async function probe(attempt) {
  try {
    const startedAt = performance.now();
    const response = await fetch(healthUrl, {
      headers: { accept: 'application/json' },
      signal: AbortSignal.timeout(10_000),
    });
    const durationMs = Math.round(performance.now() - startedAt);
    const body = await response.json().catch(() => null);

    if (!response.ok || !body || typeof body !== 'object') {
      return {
        message: 'Health endpoint did not return a successful JSON response.',
        details: { http_status: response.status, duration_ms: durationMs },
      };
    }

    const checks = body.checks ?? {};
    const failedChecks = ['application', 'database', 'configuration', 'route_engine']
      .filter(check => checks[check] !== true);

    if (body.status !== 'ready' || failedChecks.length > 0) {
      return {
        message: 'Pathfinder reported that production is not ready.',
        details: {
          http_status: response.status,
          duration_ms: durationMs,
          failed_checks: failedChecks,
          correlation_id: body.correlation_id ?? null,
        },
      };
    }

    const versions = body.versions ?? {};
    const missingVersions = ['application', 'commit', 'schema', 'engine', 'rule_set']
      .filter(version => !versions[version]);
    if (missingVersions.length > 0) {
      return {
        message: 'Health endpoint omitted required release identity.',
        details: {
          http_status: response.status,
          duration_ms: durationMs,
          missing_versions: missingVersions,
          correlation_id: body.correlation_id ?? null,
        },
      };
    }

    emit('info', 'ready', 'Production health verified.', {
      attempt,
      http_status: response.status,
      duration_ms: durationMs,
      correlation_id: body.correlation_id ?? null,
      application_version: versions.application,
      commit_reference: versions.commit,
      schema_version: versions.schema,
      engine_version: versions.engine,
      rule_set_version: versions.rule_set,
    });
    return null;
  } catch (error) {
    // AbortSignal.timeout surfaces as TimeoutError — a connect/transport
    // timeout, reported distinctly from a not-ready or malformed response.
    return {
      message: 'Health endpoint request failed.',
      details: {
        error_category: error instanceof Error ? error.name : 'UnknownError',
      },
    };
  }
}

for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
  const failure = await probe(attempt);
  if (failure === null) break;

  if (attempt < MAX_ATTEMPTS) {
    emit('warning', 'retrying', failure.message, {
      ...failure.details,
      attempt,
      retry_in_ms: RETRY_DELAY_MS,
    });
    await new Promise(resolve => setTimeout(resolve, RETRY_DELAY_MS));
  } else {
    emit('error', 'failed', failure.message, {
      ...failure.details,
      attempt,
    });
    process.exitCode = 1;
  }
}
