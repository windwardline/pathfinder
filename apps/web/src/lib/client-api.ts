// Typed client for the Pathfinder APIs. Errors always surface — the UI never
// treats a failed request as an empty result.

export type StepStatus = 'FOCUS' | 'UPCOMING' | 'BLOCKED' | 'COMPLETED';
export type RouteStatus = 'ACTIVE' | 'BLOCKED' | 'COMPLETED' | 'EMPTY';
export type FactStatus = 'PROPOSED' | 'CONFIRMED' | 'REJECTED' | 'SUPERSEDED';

export interface RouteStep {
  actionId: string;
  title: string;
  description: string;
  status: StepStatus;
  reasonCodes: string[];
  explanation: string;
  rank: number;
  unlocks: string[];
  blockedBy: string[];
  provenance: Array<{
    source: string;
    confidence?: number;
    sourceText?: string;
    derivedFromFactId?: string;
  }>;
}

export interface Route {
  id: string;
  status: RouteStatus;
  focusActionId: string | null;
  steps: RouteStep[];
}

export interface RouteResponse {
  route: Route;
  proposedCount: number;
  confirmedCount: number;
}

export interface StepRef {
  actionId: string;
  title: string;
}

export interface RouteDifference {
  focusActionChanged: boolean;
  previousFocus?: StepRef;
  newFocus?: StepRef;
  added: StepRef[];
  removed: StepRef[];
  newlyAvailable: StepRef[];
  newlyBlocked: StepRef[];
  completed: StepRef[];
  moved: Array<StepRef & { fromRank: number; toRank: number }>;
  isMeaningful: boolean;
}

export interface RerouteRecord {
  eventId: string;
  reason: string;
  difference: RouteDifference;
}

export interface FactPayload {
  key: 'ACTION' | 'DEPENDENCY';
  value: {
    title?: string;
    description?: string;
    status?: 'OPEN' | 'COMPLETED';
    sourceId?: string;
    targetId?: string;
    type?: string;
  };
  sourceText?: string;
}

export interface FactRecord {
  id: string;
  status: FactStatus;
  payload: FactPayload | null;
  createdAt: string;
  updatedAt: string;
  provenance?: Array<{ source: string; confidence: number | null; createdAt: string }>;
}

export interface HistoryEntry {
  id: string;
  triggerReason: string;
  createdAt: string;
  difference: RouteDifference | null;
  newFocus: string | null;
}

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...init?.headers },
  });
  let data: { error?: string } & T;
  try {
    data = await res.json();
  } catch {
    throw new ApiError('The server returned an unexpected response.', res.status);
  }
  if (!res.ok) {
    throw new ApiError(data?.error || 'Something went wrong. Please try again.', res.status);
  }
  return data;
}

export const api = {
  getRoute: () => request<RouteResponse>('/api/route'),
  getFacts: () => request<{ facts: FactRecord[] }>('/api/facts'),
  getHistory: () => request<{ history: HistoryEntry[] }>('/api/history'),
  extract: (text: string) =>
    request<{ facts: FactRecord[] }>('/api/ai/extract', {
      method: 'POST',
      body: JSON.stringify({ text }),
    }),
  proposeAction: (title: string, description: string) =>
    request<{ fact: FactRecord }>('/api/facts', {
      method: 'POST',
      body: JSON.stringify({
        action: 'propose',
        payload: { key: 'ACTION', value: { title, description, status: 'OPEN' } },
        provenance: { source: 'user_input' },
      }),
    }),
  confirmFact: (factId: string) =>
    request<{ fact: FactRecord; reroute: RerouteRecord | null }>('/api/facts', {
      method: 'POST',
      body: JSON.stringify({ action: 'confirm', factId }),
    }),
  rejectFact: (factId: string) =>
    request<{ fact: FactRecord }>('/api/facts', {
      method: 'POST',
      body: JSON.stringify({ action: 'reject', factId }),
    }),
  completeAction: (actionId: string) =>
    request<{ factId: string; reroute: RerouteRecord | null }>('/api/actions/complete', {
      method: 'POST',
      body: JSON.stringify({ actionId }),
    }),
  seedDemo: () => request<{ seeded: number }>('/api/demo/seed', { method: 'POST' }),
};
