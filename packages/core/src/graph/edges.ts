import { Dependency } from './types';

export interface OrderingEdge {
  /** Action that must be completed first. */
  fromId: string;
  /** Action that becomes available afterwards. */
  toId: string;
}

/**
 * Normalize raw dependencies into ordering edges between known Action ids.
 * BLOCKS(source, target) means source must complete before target.
 * REQUIRES(source, target) means source requires target, i.e. target completes first.
 * GraphVersion validates references before calling this helper. The membership
 * guard remains defensive for callers working with already-validated graphs.
 */
export function normalizeOrderingEdges(
  actionIds: ReadonlySet<string>,
  dependencies: readonly Dependency[]
): OrderingEdge[] {
  const edges: OrderingEdge[] = [];
  for (const dep of dependencies) {
    let fromId: string;
    let toId: string;
    if (dep.type === 'BLOCKS') {
      fromId = dep.sourceId;
      toId = dep.targetId;
    } else if (dep.type === 'REQUIRES') {
      fromId = dep.targetId;
      toId = dep.sourceId;
    } else {
      continue;
    }
    if (actionIds.has(fromId) && actionIds.has(toId) && fromId !== toId) {
      edges.push({ fromId, toId });
    }
  }
  return edges;
}
