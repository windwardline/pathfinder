type OperationalEvent = {
  correlationId: string;
  service: 'web' | 'route-engine' | 'facts' | 'authentication' | 'ai-gateway';
  operation: 'route_generation' | 'fact_mutation' | 'action_completion' | 'magic_link_request';
  outcome: 'success' | 'rejected' | 'failure';
  severity?: 'info' | 'warning' | 'error';
  durationMs?: number;
  httpStatus?: number;
  factType?: 'ACTION' | 'DEPENDENCY' | 'GOAL' | 'REQUIREMENT' | 'OBLIGATION' | 'CONSTRAINT' | 'DEADLINE' | 'BLOCKER';
  mutation?: 'propose' | 'confirm' | 'reject' | 'supersede' | 'expire' | 'complete';
  routeStatus?: 'ACTIVE' | 'BLOCKED' | 'COMPLETED' | 'EMPTY';
  rerouteCreated?: boolean;
};

/**
 * Emits privacy-safe structured telemetry. Fact values, document content,
 * email addresses, user identifiers, and credentials are intentionally absent
 * from the accepted event contract.
 */
export function emitOperationalEvent(event: OperationalEvent) {
  const record = JSON.stringify({
    timestamp: new Date().toISOString(),
    correlation_id: event.correlationId,
    request_id: event.correlationId,
    service: event.service,
    operation: event.operation,
    severity:
      event.severity ??
      (event.outcome === 'failure' ? 'error' : event.outcome === 'rejected' ? 'warning' : 'info'),
    outcome: event.outcome,
    ...(event.durationMs == null ? {} : { duration_ms: Math.round(event.durationMs) }),
    ...(event.httpStatus == null ? {} : { http_status: event.httpStatus }),
    ...(event.factType == null ? {} : { fact_type: event.factType }),
    ...(event.mutation == null ? {} : { mutation: event.mutation }),
    ...(event.routeStatus == null ? {} : { route_status: event.routeStatus }),
    ...(event.rerouteCreated == null ? {} : { reroute_created: event.rerouteCreated }),
  });
  if (event.severity === 'error' || event.outcome === 'failure') console.error(record);
  else if (event.severity === 'warning' || event.outcome === 'rejected') console.warn(record);
  else console.info(record);
}
