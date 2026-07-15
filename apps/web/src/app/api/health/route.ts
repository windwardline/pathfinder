import { NextResponse } from 'next/server';
import { db } from '@pathfinder/core';
import { sql } from 'drizzle-orm';
import { correlationId } from '@/lib/api-response';
import { ENGINE_VERSION, RULE_SET_VERSION } from '@/lib/route-service';
import { releaseIdentity } from '@/lib/release';
import { runRouteEngineCanary } from '@/lib/route-engine-canary';

/** Public, non-sensitive readiness check for deployment and incident verification. */
export async function GET(request?: Request) {
  const correlation = correlationId(request);
  let database = false;
  try {
    await db.execute(sql`select 1`);
    database = true;
  } catch (error) {
    console.error('Health database check failed:', error);
  }

  const configuration = Boolean(
    (process.env.POSTGRES_URL || process.env.DATABASE_URL) && process.env.AUTH_SECRET
  );
  let routeEngine = false;
  try {
    routeEngine = runRouteEngineCanary().ready;
  } catch (error) {
    console.error('Health Route Engine canary failed:', error);
  }
  const ready = database && configuration && routeEngine;
  const response = NextResponse.json(
    {
      status: ready ? 'ready' : 'not_ready',
      correlation_id: correlation,
      checks: {
        application: true,
        database,
        configuration,
        route_engine: routeEngine,
      },
      versions: {
        ...releaseIdentity(),
        engine: ENGINE_VERSION,
        rule_set: RULE_SET_VERSION,
      },
    },
    { status: ready ? 200 : 503 }
  );
  response.headers.set('cache-control', 'no-store');
  response.headers.set('x-correlation-id', correlation);
  return response;
}
