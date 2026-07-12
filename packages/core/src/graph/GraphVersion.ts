import { Fact, FactStatus } from '../domain/Fact';
import { Action, GraphNode, Dependency } from './types';
import { CycleDetector } from './CycleDetector';

export class GraphVersionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'GraphVersionError';
  }
}

export class GraphVersion {
  public readonly id: string;
  public readonly nodes: GraphNode[];
  public readonly dependencies: Dependency[];
  public readonly sourceFacts: string[];
  public readonly createdAt: Date;

  constructor(id: string, facts: Fact[]) {
    // 1. Ensure only Confirmed facts are present (ADR-005)
    const invalidFacts = facts.filter(f => f.status !== FactStatus.Confirmed);
    if (invalidFacts.length > 0) {
      throw new GraphVersionError(`Cannot build graph with non-confirmed facts: ${invalidFacts.map(f => f.id).join(', ')}`);
    }

    this.id = id;
    this.createdAt = new Date();
    this.sourceFacts = facts.map(f => f.id);
    
    // 2. Derive nodes and edges from facts
    this.nodes = [];
    this.dependencies = [];

    this.deriveFromFacts(facts);

    // 3. Detect Cycles deterministically
    if (CycleDetector.hasCycle(this.dependencies)) {
      throw new GraphVersionError('Dependency graph contains a hard cycle.');
    }
  }

  private deriveFromFacts(facts: Fact[]) {
    for (const fact of facts) {
      const { payload } = fact;
      if (payload.key === 'ACTION') {
        this.nodes.push({ 
          id: fact.id, 
          type: 'ACTION', 
          title: payload.value.title, 
          description: payload.value.description, 
          status: payload.value.status 
        } as Action);
      } else if (payload.key === 'DEPENDENCY') {
        this.dependencies.push({
          sourceId: payload.value.sourceId,
          targetId: payload.value.targetId,
          type: payload.value.type
        });
      }
      // Additional node derivatives can be mapped here deterministically
    }
  }
}
