import { NextResponse } from 'next/server';

export interface ApiErrorOptions {
  status: number;
  code: string;
  message: string;
  retryable?: boolean;
  details?: unknown;
  request?: Request;
  correlationId?: string;
}

export function correlationId(request?: Request): string {
  const provided = request?.headers.get('x-correlation-id');
  return provided && provided.length <= 128 ? provided : crypto.randomUUID();
}

export function apiError(options: ApiErrorOptions) {
  const id = options.correlationId ?? correlationId(options.request);
  const response = NextResponse.json(
    {
      error: options.message,
      error_code: options.code,
      message: options.message,
      correlation_id: id,
      retryable: options.retryable ?? false,
      ...(options.details === undefined ? {} : { details: options.details }),
    },
    { status: options.status }
  );
  response.headers.set('x-correlation-id', id);
  return response;
}

export function apiSuccess<T extends Record<string, unknown>>(
  data: T,
  request?: Request,
  status = 200,
  fixedCorrelationId?: string
) {
  const id = fixedCorrelationId ?? correlationId(request);
  const response = NextResponse.json(
    { success: true, correlation_id: id, ...data },
    { status }
  );
  response.headers.set('x-correlation-id', id);
  return response;
}
