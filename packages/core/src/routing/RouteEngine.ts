import { RoutingSnapshot } from './RoutingSnapshot';
import { RouteVersion, RouteStep, RouteStepStatus } from './RouteVersion';
import { Action } from '../graph/types';

export class RouteEngine {
  /**
   * Deterministically sequence actions based on dependencies and lexicographic tie-breaking.
   */
  static generateRoute(snapshot: RoutingSnapshot): RouteVersion {
    const { graph } = snapshot;
    const actions = graph.nodes.filter(n => n.type === 'ACTION') as Action[];
    const dependencies = graph.dependencies;

    const inDegree: Record<string, number> = {};
    const adj: Record<string, string[]> = {};

    for (const a of actions) {
      inDegree[a.id] = 0;
      adj[a.id] = [];
    }

    // Build graph for topological sort (only considering Action -> Action blocks for now)
    for (const dep of dependencies) {
      if (dep.type === 'BLOCKS' && inDegree[dep.targetId] !== undefined) {
        adj[dep.sourceId] = adj[dep.sourceId] || [];
        adj[dep.sourceId].push(dep.targetId);
        inDegree[dep.targetId]++;
      }
    }

    const steps: RouteStep[] = [];
    let rank = 1;
    let focusActionId: string | undefined = undefined;

    // We process available nodes. To ensure determinism (ADR-002), we sort the queue lexicographically.
    const availableQueue: string[] = Object.keys(inDegree).filter(id => inDegree[id] === 0);

    while (availableQueue.length > 0) {
      availableQueue.sort((a, b) => a.localeCompare(b)); // Lexicographic tie-breaker
      
      const currentId = availableQueue.shift()!;
      const action = actions.find(a => a.id === currentId)!;
      
      let status = RouteStepStatus.PENDING;
      let reason = 'DEFAULT_RANKING';

      if (action.status === 'COMPLETED') {
        status = RouteStepStatus.COMPLETED;
        reason = 'ALREADY_COMPLETED';
        
        const children = adj[currentId] || [];
        for (const child of children) {
          inDegree[child]--;
          if (inDegree[child] === 0) {
            availableQueue.push(child);
          }
        }
      } else if (!focusActionId) {
        // First uncompleted valid action is focus
        status = RouteStepStatus.FOCUS;
        reason = 'LEXICOGRAPHIC_FOCUS';
        focusActionId = currentId;
      }

      steps.push({
        actionId: currentId,
        status,
        reasonCode: reason,
        rank: rank++
      });
    }

    // Any nodes left with inDegree > 0 are hard blocked by cycles or incomplete parents 
    for (const id of Object.keys(inDegree)) {
      if (inDegree[id] > 0) {
        steps.push({
          actionId: id,
          status: RouteStepStatus.BLOCKED,
          reasonCode: 'BLOCKED_BY_DEPENDENCY',
          rank: rank++
        });
      }
    }

    return new RouteVersion(`rt_${Date.now()}`, snapshot.id, steps, focusActionId);
  }
}
