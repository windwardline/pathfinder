import {
  FactStatus,
  GraphVersion,
  RouteEngine,
  RoutingSnapshot,
  type Fact,
} from '@pathfinder/core';

const createdAt = new Date(0);

function action(id: string, title: string): Fact {
  return {
    id,
    status: FactStatus.Confirmed,
    payload: { key: 'ACTION', value: { title, description: '', status: 'OPEN' } },
    provenance: { source: 'health_canary' },
    createdAt,
    updatedAt: createdAt,
  };
}

function dependency(id: string, sourceId: string, targetId: string): Fact {
  return {
    id,
    status: FactStatus.Confirmed,
    payload: { key: 'DEPENDENCY', value: { sourceId, targetId, type: 'BLOCKS' } },
    provenance: { source: 'health_canary' },
    createdAt,
    updatedAt: createdAt,
  };
}

/** Executes the real graph and Route Engine without reading or writing user data. */
export function runRouteEngineCanary() {
  const facts = [
    action('health-id', 'Obtain a state identification card'),
    action('health-work', 'Complete employment onboarding'),
    action('health-home', 'Submit the housing application'),
    dependency('health-dep-work', 'health-id', 'health-work'),
    dependency('health-dep-home', 'health-id', 'health-home'),
  ];
  const graph = new GraphVersion('health-graph', facts);
  const route = RouteEngine.generateRoute(new RoutingSnapshot('health-snapshot', graph, facts));
  const focus = route.steps.find(step => step.actionId === route.focusActionId);
  const ready =
    focus?.title === 'Obtain a state identification card' &&
    focus.reasonCodes.includes('HARD_PREREQUISITE') &&
    focus.reasonCodes.includes('HIGH_UNLOCK_VALUE');
  return {
    ready,
    focusTitle: focus?.title ?? null,
    reasonCodes: focus?.reasonCodes ?? [],
  };
}
