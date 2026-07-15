import { describe, expect, it } from 'vitest';
import {
  Fact,
  FactStatus,
  GraphVersion,
  RouteEngine,
  RoutingSnapshot,
  computeRouteDifference,
} from '../src';

function confirmedFact(id: string, payload: Fact['payload']): Fact {
  const now = new Date('2026-01-01T00:00:00.000Z');
  return {
    id,
    payload,
    status: FactStatus.Confirmed,
    provenance: { source: 'performance_fixture' },
    createdAt: now,
    updatedAt: now,
  };
}

function demonstrationScaleFacts() {
  const facts: Fact[] = Array.from({ length: 500 }, (_, index) =>
    confirmedFact(`action-${index.toString().padStart(3, '0')}`, {
      key: 'ACTION',
      value: {
        title: `Action ${index.toString().padStart(3, '0')}`,
        description: 'Deterministic performance fixture.',
        status: 'OPEN',
      },
    })
  );

  let edgeCount = 0;
  for (let gap = 1; gap < 500 && edgeCount < 2_000; gap += 1) {
    for (let source = 0; source + gap < 500 && edgeCount < 2_000; source += 1) {
      facts.push(
        confirmedFact(`dependency-${edgeCount.toString().padStart(4, '0')}`, {
          key: 'DEPENDENCY',
          value: {
            sourceId: `action-${source.toString().padStart(3, '0')}`,
            targetId: `action-${(source + gap).toString().padStart(3, '0')}`,
            type: 'BLOCKS',
          },
        })
      );
      edgeCount += 1;
    }
  }
  expect(edgeCount).toBe(2_000);
  return facts;
}

describe('Route Engine performance budgets', () => {
  it('builds and validates 500 nodes with 2,000 edges within 500 ms', () => {
    const facts = demonstrationScaleFacts();
    const startedAt = performance.now();
    const graph = new GraphVersion('performance-graph', facts);
    const elapsed = performance.now() - startedAt;

    expect(graph.nodes).toHaveLength(500);
    expect(graph.dependencies).toHaveLength(2_000);
    expect(elapsed).toBeLessThan(500);
  });

  it('evaluates and compares demonstration-scale Routes within the release budgets', () => {
    const facts = demonstrationScaleFacts();
    const graph = new GraphVersion('performance-graph', facts);
    const snapshot = new RoutingSnapshot('performance-snapshot', graph, facts);

    const routeStartedAt = performance.now();
    const first = RouteEngine.generateRoute(snapshot);
    const routeElapsed = performance.now() - routeStartedAt;

    const comparisonStartedAt = performance.now();
    const second = RouteEngine.generateRoute(snapshot);
    const difference = computeRouteDifference(first, second);
    const comparisonElapsed = performance.now() - comparisonStartedAt;

    expect(first.steps).toHaveLength(500);
    expect(first.focusActionId).toBe('action-000');
    expect(difference.isMeaningful).toBe(false);
    expect(routeElapsed).toBeLessThan(500);
    expect(comparisonElapsed).toBeLessThan(250);
  });
});
