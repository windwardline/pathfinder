import { Fact, FactStatus } from '../domain/Fact';
import { Action, GraphNode, Dependency } from './types';
import { CycleDetector } from './CycleDetector';
import { normalizeOrderingEdges } from './edges';

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

    const routeFacts = facts.filter(
      fact => fact.payload?.key === 'ACTION' || fact.payload?.key === 'DEPENDENCY'
    );
    const missingProvenance = routeFacts.filter(
      fact => !fact.provenance?.source && !fact.provenanceHistory?.some(item => item.source)
    );
    if (missingProvenance.length > 0) {
      throw new GraphVersionError(
        `Cannot build graph with missing provenance: ${missingProvenance.map(f => f.id).join(', ')}`
      );
    }

    const seenFactIds = new Set<string>();
    for (const fact of facts) {
      if (seenFactIds.has(fact.id)) {
        throw new GraphVersionError(`Dependency graph contains duplicate Fact id: ${fact.id}`);
      }
      seenFactIds.add(fact.id);
    }

    this.id = id;
    this.createdAt = new Date();
    this.sourceFacts = facts.map(f => f.id);
    
    // 2. Derive nodes and edges from facts
    this.nodes = [];
    this.dependencies = [];

    this.deriveFromFacts(facts);

    // 3. Validate references before normalizing. Invalid dependencies must fail
    // publication; silently dropping one can make a blocked Action eligible.
    const actionIds = new Set(
      this.nodes.filter(n => n.type === 'ACTION').map(n => n.id)
    );
    for (const dependency of this.dependencies) {
      if (!actionIds.has(dependency.sourceId) || !actionIds.has(dependency.targetId)) {
        throw new GraphVersionError(
          `Dependency references an unknown Action: ${dependency.sourceId} -> ${dependency.targetId}`
        );
      }
      if (dependency.sourceId === dependency.targetId) {
        throw new GraphVersionError(`Dependency graph contains a self-cycle: ${dependency.sourceId}`);
      }
    }

    // 4. Detect cycles deterministically, over ordering edges only.
    const orderingEdges = normalizeOrderingEdges(actionIds, this.dependencies).map(
      e => ({ sourceId: e.fromId, targetId: e.toId, type: 'BLOCKS' as const })
    );
    if (CycleDetector.hasCycle(orderingEdges)) {
      throw new GraphVersionError('Dependency graph contains a hard cycle.');
    }
  }

  private deriveFromFacts(facts: Fact[]) {
    for (const fact of facts) {
      const { payload } = fact;
      if (payload.key === 'ACTION') {
        if (
          !payload.value ||
          typeof payload.value !== 'object' ||
          typeof payload.value.title !== 'string' ||
          !['OPEN', 'COMPLETED'].includes(payload.value.status)
        ) {
          throw new GraphVersionError(`Action Fact has an invalid payload: ${fact.id}`);
        }
        this.nodes.push({ 
          id: fact.id, 
          type: 'ACTION', 
          title: payload.value.title, 
          description: payload.value.description, 
          status: payload.value.status,
          createdAt: fact.createdAt,
          provenance:
            fact.provenanceHistory ?? (fact.provenance ? [fact.provenance] : []),
          routing: payload.value.routing,
        } as Action);
      } else if (payload.key === 'DEPENDENCY') {
        if (
          !payload.value ||
          typeof payload.value !== 'object' ||
          typeof payload.value.sourceId !== 'string' ||
          typeof payload.value.targetId !== 'string' ||
          !['BLOCKS', 'REQUIRES'].includes(payload.value.type)
        ) {
          throw new GraphVersionError(`Dependency Fact has an invalid payload: ${fact.id}`);
        }
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
