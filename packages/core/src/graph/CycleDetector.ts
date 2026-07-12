import { Dependency } from './types';

export class CycleDetector {
  static hasCycle(dependencies: Dependency[]): boolean {
    const adj: Record<string, string[]> = {};
    for (const dep of dependencies) {
      if (!adj[dep.sourceId]) adj[dep.sourceId] = [];
      adj[dep.sourceId].push(dep.targetId);
    }

    const visited = new Set<string>();
    const recStack = new Set<string>();

    for (const node of Object.keys(adj)) {
      if (this.dfs(node, adj, visited, recStack)) {
        return true;
      }
    }
    return false;
  }

  private static dfs(node: string, adj: Record<string, string[]>, visited: Set<string>, recStack: Set<string>): boolean {
    if (recStack.has(node)) return true;
    if (visited.has(node)) return false;

    visited.add(node);
    recStack.add(node);

    const children = adj[node] || [];
    for (const child of children) {
      if (this.dfs(child, adj, visited, recStack)) {
        return true;
      }
    }

    recStack.delete(node);
    return false;
  }
}
