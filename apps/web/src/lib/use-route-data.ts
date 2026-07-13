'use client';

import { useCallback, useEffect, useState } from 'react';
import { api, RouteResponse } from './client-api';

/**
 * Loads the current Route. On refresh failures the last valid Route is
 * preserved and the error is surfaced alongside it.
 */
export function useRouteData() {
  const [data, setData] = useState<RouteResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    api
      .getRoute()
      .then(next => {
        if (cancelled) return;
        setData(next);
        setError(null);
      })
      .catch((e: unknown) => {
        if (cancelled) return;
        setError(e instanceof Error ? e.message : 'The Route could not be loaded.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  /** Refreshes the Route after a user action; keeps the last valid Route on failure. */
  const refresh = useCallback(async () => {
    try {
      const next = await api.getRoute();
      setData(next);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'The Route could not be loaded.');
    } finally {
      setLoading(false);
    }
  }, []);

  return { data, loading, error, refresh };
}
