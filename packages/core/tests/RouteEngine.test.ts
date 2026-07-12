import { describe, it, expect } from 'vitest';
import { RouteEngine, RoutingSnapshot, GraphVersion, Fact, FactStatus } from '../src/index';

describe('RouteEngine - Golden Fixtures', () => {
  it('Fixture 1: Lexicographical Tie-Breaking (ADR-002)', () => {
    const facts: Fact[] = [
      { id: 'action_B', payload: { key: 'ACTION', value: { title: 'action_B', description: 'desc', status: 'OPEN' } }, status: FactStatus.Confirmed, version: 1 },
      { id: 'action_A', payload: { key: 'ACTION', value: { title: 'action_A', description: 'desc', status: 'OPEN' } }, status: FactStatus.Confirmed, version: 1 }
    ];
    
    const graph = new GraphVersion('g1', facts);
    const snapshot = new RoutingSnapshot('s1', graph, facts);
    const route = RouteEngine.generateRoute(snapshot);

    // action_A should come before action_B because of lexicographical sorting
    expect(route.steps[0].actionId).toBe('action_A');
    expect(route.steps[1].actionId).toBe('action_B');
    expect(route.steps[0].reasonCode).toBe('LEXICOGRAPHIC_FOCUS');
  });

  it('Fixture 2: Dependency Blocking', () => {
    const facts: Fact[] = [
      { id: 'action_C', payload: { key: 'ACTION', value: { title: 'action_C', description: 'desc', status: 'OPEN' } }, status: FactStatus.Confirmed, version: 1 },
      { id: 'action_A', payload: { key: 'ACTION', value: { title: 'action_A', description: 'desc', status: 'OPEN' } }, status: FactStatus.Confirmed, version: 1 },
      { id: 'dep1', payload: { key: 'DEPENDENCY', value: { sourceId: 'action_C', targetId: 'action_A', type: 'BLOCKS' } }, status: FactStatus.Confirmed, version: 1 }
    ];

    const graph = new GraphVersion('g2', facts);
    const snapshot = new RoutingSnapshot('s2', graph, facts);
    const route = RouteEngine.generateRoute(snapshot);

    // Even though A < C, A is blocked by C. So C is focus.
    expect(route.steps[0].actionId).toBe('action_C');
    expect(route.steps[0].status).toBe('FOCUS');
    
    const actionA = route.steps.find(r => r.actionId === 'action_A');
    expect(actionA?.status).toBe('BLOCKED');
    expect(actionA?.reasonCode).toBe('BLOCKED_BY_DEPENDENCY');
  });

  it('Fixture 3: Hard Cycle Detection', () => {
    const facts: Fact[] = [
      { id: 'action_A', payload: { key: 'ACTION', value: { title: 'action_A', description: 'desc', status: 'OPEN' } }, status: FactStatus.Confirmed, version: 1 },
      { id: 'action_B', payload: { key: 'ACTION', value: { title: 'action_B', description: 'desc', status: 'OPEN' } }, status: FactStatus.Confirmed, version: 1 },
      { id: 'dep1', payload: { key: 'DEPENDENCY', value: { sourceId: 'action_A', targetId: 'action_B', type: 'BLOCKS' } }, status: FactStatus.Confirmed, version: 1 },
      { id: 'dep2', payload: { key: 'DEPENDENCY', value: { sourceId: 'action_B', targetId: 'action_A', type: 'BLOCKS' } }, status: FactStatus.Confirmed, version: 1 }
    ];

    expect(() => {
      new GraphVersion('g3', facts);
    }).toThrow(/cycle/i);
  });
});
