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
  public readonly actionBlockers = new Map<string, string[]>();
  public readonly actionConstraintIds = new Map<string, string[]>();

  constructor(id: string, facts: Fact[]) {
    // 1. Ensure only Confirmed facts are present (ADR-005)
    const invalidFacts = facts.filter(f => f.status !== FactStatus.Confirmed);
    if (invalidFacts.length > 0) {
      throw new GraphVersionError(`Cannot build graph with non-confirmed facts: ${invalidFacts.map(f => f.id).join(', ')}`);
    }

    const routeFacts = facts.filter(fact =>
      ['ACTION', 'DEPENDENCY', 'GOAL', 'REQUIREMENT', 'OBLIGATION', 'CONSTRAINT', 'DEADLINE', 'BLOCKER']
        .includes(fact.payload?.key)
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
    this.applyDomainFacts(facts);

    // 3. Validate references before normalizing. Invalid dependencies must fail
    // publication; silently dropping one can make a blocked Action eligible.
    const actionIds = new Set(this.nodes.filter(n => n.type === 'ACTION').map(n => n.id));
    const nodeIds = new Set(this.nodes.map(node => node.id));
    for (const dependency of this.dependencies) {
      if (!nodeIds.has(dependency.sourceId) || !nodeIds.has(dependency.targetId)) {
        throw new GraphVersionError(
          `Dependency references an unknown Action or domain node: ${dependency.sourceId} -> ${dependency.targetId}`
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
          goalId: payload.value.goalId,
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
      } else if (
        ['GOAL', 'REQUIREMENT', 'OBLIGATION', 'CONSTRAINT', 'DEADLINE', 'BLOCKER']
          .includes(payload.key)
      ) {
        if (!payload.value || typeof payload.value !== 'object') {
          throw new GraphVersionError(`Domain Fact has an invalid payload: ${fact.id}`);
        }
        this.nodes.push({
          id: fact.id,
          type: payload.key,
          ...payload.value,
        } as GraphNode);
      }
      // Additional node derivatives can be mapped here deterministically
    }
  }

  private applyDomainFacts(facts: Fact[]) {
    const actions = new Map(
      this.nodes
        .filter((node): node is Action => node.type === 'ACTION')
        .map(action => [action.id, action])
    );
    const goals = new Map(
      facts
        .filter(fact => fact.payload.key === 'GOAL')
        .map(fact => [fact.id, fact.payload.value])
    );

    const requireAction = (id: string, factId: string) => {
      const action = actions.get(id);
      if (!action) {
        throw new GraphVersionError(`Domain Fact ${factId} references an unknown Action: ${id}`);
      }
      return action;
    };
    const addBlocker = (actionId: string, description: string) => {
      this.actionBlockers.set(actionId, [
        ...(this.actionBlockers.get(actionId) ?? []),
        description,
      ]);
    };
    const addResolution = (
      factId: string,
      targetActionId: string,
      resolutionActionId: string | undefined,
      description: string
    ) => {
      requireAction(targetActionId, factId);
      if (resolutionActionId) {
        requireAction(resolutionActionId, factId);
        this.dependencies.push({
          sourceId: resolutionActionId,
          targetId: targetActionId,
          type: 'BLOCKS',
        });
      } else {
        addBlocker(targetActionId, description);
      }
    };

    for (const action of actions.values()) {
      if (!action.goalId) continue;
      const goal = goals.get(action.goalId);
      if (!goal || goal.status !== 'ACTIVE') continue;
      const priority = Number(goal.priority);
      action.routing = {
        ...action.routing,
        goalAlignment: Number.isFinite(priority) ? priority : 0,
        userPriority: Number.isFinite(priority) ? priority : 0,
      };
    }

    for (const fact of facts) {
      const value = fact.payload.value;
      if (!value || typeof value !== 'object') continue;

      if (fact.payload.key === 'REQUIREMENT') {
        if (
          value.hardness === 'HARD' &&
          !['SATISFIED', 'WAIVED'].includes(value.status)
        ) {
          addResolution(
            fact.id,
            value.targetActionId,
            value.resolutionActionId,
            value.description
          );
        }
      } else if (fact.payload.key === 'CONSTRAINT' && value.status === 'ACTIVE') {
        for (const targetId of value.targetActionIds ?? []) {
          this.actionConstraintIds.set(targetId, [
            ...(this.actionConstraintIds.get(targetId) ?? []),
            fact.id,
          ]);
          addResolution(
            fact.id,
            targetId,
            value.resolutionActionId,
            value.description
          );
        }
      } else if (fact.payload.key === 'BLOCKER' && value.active === true) {
        addResolution(
          fact.id,
          value.targetActionId,
          value.resolutionActionId,
          value.description
        );
      } else if (fact.payload.key === 'DEADLINE') {
        const action = requireAction(value.targetActionId, fact.id);
        action.routing = {
          ...action.routing,
          criticalDeadline: value.severity === 'CRITICAL',
          deadline: value.dueAt,
        };
      } else if (fact.payload.key === 'OBLIGATION' && value.status === 'ACTIVE') {
        if (value.resolutionActionId) {
          const resolution = requireAction(value.resolutionActionId, fact.id);
          resolution.routing = {
            ...resolution.routing,
            mandatoryObligation: true,
            conflictAvoidance: Math.max(resolution.routing?.conflictAvoidance ?? 0, 1),
          };
        }
        for (const targetId of value.conflictActionIds ?? []) {
          addResolution(fact.id, targetId, value.resolutionActionId, value.title);
        }
      }
    }
  }
}
