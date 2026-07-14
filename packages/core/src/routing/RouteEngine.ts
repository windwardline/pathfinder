import { RoutingSnapshot } from './RoutingSnapshot';
import { RouteVersion, RouteStep, RouteStepStatus, RouteStatus } from './RouteVersion';
import { Action } from '../graph/types';
import { normalizeOrderingEdges } from '../graph/edges';

/**
 * The Route Engine is the sole sequencing authority (ADR-002).
 * Identical Routing Snapshots must always produce identical Routes.
 *
 * Sequencing rules:
 * 1. Completed Actions are contracted out of the graph first, so ordering and
 *    Focus selection depend only on the remaining actionable work — never on
 *    the ids or titles of Actions that are already done.
 * 2. The remaining DAG is ordered with Kahn's algorithm using the canonical
 *    lexicographic ranking tuple, followed by stable title/id tie-breaks.
 * 3. The Focus Action is the first currently-available Action in that order.
 * 4. Completed Actions are appended last, in stable order, for Route History.
 */
export class RouteEngine {
  static generateRoute(snapshot: RoutingSnapshot): RouteVersion {
    const { graph } = snapshot;
    const actions = graph.nodes.filter(n => n.type === 'ACTION') as Action[];

    if (actions.length === 0) {
      return new RouteVersion(
        `rt_${snapshot.id}`,
        snapshot.id,
        [],
        undefined,
        RouteStatus.EMPTY
      );
    }

    const byId = new Map(actions.map(a => [a.id, a]));
    const actionIds = new Set(actions.map(a => a.id));
    const edges = normalizeOrderingEdges(actionIds, graph.dependencies);

    const isCompleted = (id: string) => byId.get(id)!.status === 'COMPLETED';
    const stableCompare = (a: string, b: string) => {
      const ta = byId.get(a)!.title;
      const tb = byId.get(b)!.title;
      return ta.localeCompare(tb) || a.localeCompare(b);
    };

    // Direct relations over ALL actions (used for unlocks/blockedBy display).
    const childrenOf = new Map<string, string[]>();
    const parentsOf = new Map<string, string[]>();
    for (const e of edges) {
      childrenOf.set(e.fromId, [...(childrenOf.get(e.fromId) || []), e.toId]);
      parentsOf.set(e.toId, [...(parentsOf.get(e.toId) || []), e.fromId]);
    }

    const transitiveUnlockCount = (id: string): number => {
      const seen = new Set<string>();
      const pending = [...(childrenOf.get(id) || [])];
      while (pending.length > 0) {
        const child = pending.pop()!;
        if (seen.has(child) || isCompleted(child)) continue;
        seen.add(child);
        pending.push(...(childrenOf.get(child) || []));
      }
      return seen.size;
    };

    const boolRank = (value: boolean | undefined) => (value ? 1 : 0);
    const numberRank = (value: number | undefined) =>
      Number.isFinite(value) ? Number(value) : 0;
    const deadlineRank = (value: string | undefined) => {
      if (!value) return Number.POSITIVE_INFINITY;
      const parsed = Date.parse(value);
      return Number.isFinite(parsed) ? parsed : Number.POSITIVE_INFINITY;
    };
    const createdAtRank = (value: Date | undefined) => value?.getTime() ?? 0;

    /** Higher-value factors sort first; deadline/effort/timestamps sort earlier first. */
    const compare = (a: string, b: string) => {
      const aa = byId.get(a)!;
      const bb = byId.get(b)!;
      const ar = aa.routing;
      const br = bb.routing;

      return (
        boolRank(br?.criticalDeadline) - boolRank(ar?.criticalDeadline) ||
        deadlineRank(ar?.deadline) - deadlineRank(br?.deadline) ||
        boolRank(br?.mandatoryObligation) - boolRank(ar?.mandatoryObligation) ||
        boolRank((childrenOf.get(b) || []).some(id => !isCompleted(id))) -
          boolRank((childrenOf.get(a) || []).some(id => !isCompleted(id))) ||
        transitiveUnlockCount(b) - transitiveUnlockCount(a) ||
        numberRank(br?.blockerReduction) - numberRank(ar?.blockerReduction) ||
        numberRank(br?.goalAlignment) - numberRank(ar?.goalAlignment) ||
        numberRank(br?.userPriority) - numberRank(ar?.userPriority) ||
        numberRank(br?.conflictAvoidance) - numberRank(ar?.conflictAvoidance) ||
        numberRank(ar?.effortCost) - numberRank(br?.effortCost) ||
        createdAtRank(aa.createdAt) - createdAtRank(bb.createdAt) ||
        stableCompare(a, b)
      );
    };

    // Contracted graph: incomplete actions only; edges from completed sources
    // are satisfied and edges into completed targets are irrelevant.
    const openIds = actions.filter(a => !isCompleted(a.id)).map(a => a.id);
    const inDegree = new Map<string, number>(openIds.map(id => [id, 0]));
    const openChildren = new Map<string, string[]>();
    for (const e of edges) {
      if (!isCompleted(e.fromId) && !isCompleted(e.toId)) {
        inDegree.set(e.toId, (inDegree.get(e.toId) || 0) + 1);
        openChildren.set(e.fromId, [...(openChildren.get(e.fromId) || []), e.toId]);
      }
    }

    const initiallyAvailable = new Set(openIds.filter(id => inDegree.get(id) === 0));

    // Deterministic total order over incomplete actions (Kahn + stable tie-break).
    const queue = [...initiallyAvailable];
    const order: string[] = [];
    const remaining = new Map(inDegree);
    while (queue.length > 0) {
      queue.sort(compare);
      const current = queue.shift()!;
      order.push(current);
      for (const child of openChildren.get(current) || []) {
        const d = remaining.get(child)! - 1;
        remaining.set(child, d);
        if (d === 0) queue.push(child);
      }
    }

    const focusActionId = order.find(id => initiallyAvailable.has(id));

    const openUnlocks = (id: string) =>
      (childrenOf.get(id) || [])
        .filter(childId => !isCompleted(childId))
        .sort(stableCompare)
        .map(childId => byId.get(childId)!.title);

    const openBlockers = (id: string) =>
      (parentsOf.get(id) || [])
        .filter(parentId => !isCompleted(parentId))
        .sort(stableCompare)
        .map(parentId => byId.get(parentId)!.title);

    const steps: RouteStep[] = [];
    let rank = 1;

    for (const id of order) {
      const action = byId.get(id)!;
      const available = initiallyAvailable.has(id);
      const unlocks = openUnlocks(id);
      const blockedBy = openBlockers(id);

      let status: RouteStepStatus;
      const reasonCodes: string[] = [];
      let explanation: string;

      if (available) {
        status = id === focusActionId ? RouteStepStatus.FOCUS : RouteStepStatus.UPCOMING;
        if (action.routing?.criticalDeadline) reasonCodes.push('CRITICAL_DEADLINE');
        if (action.routing?.mandatoryObligation) reasonCodes.push('MANDATORY_OBLIGATION');
        if (unlocks.length >= 1) reasonCodes.push('HARD_PREREQUISITE');
        if (unlocks.length >= 2) reasonCodes.push('HIGH_UNLOCK_VALUE');
        if (numberRank(action.routing?.blockerReduction) > 0) {
          reasonCodes.push('BLOCKER_REMOVAL');
        }
        if (
          numberRank(action.routing?.goalAlignment) > 0 ||
          numberRank(action.routing?.userPriority) > 0
        ) {
          reasonCodes.push('USER_PRIORITY');
        }
        if (numberRank(action.routing?.conflictAvoidance) > 0) {
          reasonCodes.push('CONFLICT_AVOIDANCE');
        }
        if (action.routing?.effortCost !== undefined) reasonCodes.push('LOWER_EFFORT');
        if (initiallyAvailable.size === 1) {
          reasonCodes.push('ONLY_ELIGIBLE_ACTION');
        } else {
          reasonCodes.push('STABLE_TIE_BREAK');
        }

        if (action.routing?.criticalDeadline && action.routing.deadline) {
          explanation = `This comes next because it protects the confirmed deadline on ${formatDeadline(action.routing.deadline)}.`;
        } else if (action.routing?.mandatoryObligation) {
          explanation = 'This comes next because it protects a confirmed mandatory Obligation.';
        } else if (unlocks.length >= 1) {
          explanation = `This comes next because it is required before you can complete ${asCompletable(unlocks[0])}.`;
        } else if (initiallyAvailable.size === 1) {
          explanation = 'This comes next because it is the only Action currently available.';
        } else {
          explanation =
            'This comes next based on the deterministic order of your available Actions.';
        }
      } else {
        status = RouteStepStatus.BLOCKED;
        reasonCodes.push('BLOCKED_BY_DEPENDENCY');
        explanation = `This Action becomes available after you complete ${formatList(blockedBy)}.`;
      }

      steps.push({
        actionId: id,
        title: action.title,
        description: action.description ?? '',
        status,
        reasonCodes,
        explanation,
        rank: rank++,
        unlocks,
        blockedBy,
        provenance: action.provenance,
      });
    }

    // Completed actions come last, in stable order, so history stays visible
    // without influencing the actionable sequence.
    const completedIds = actions
      .filter(a => isCompleted(a.id))
      .map(a => a.id)
      .sort(stableCompare);
    for (const id of completedIds) {
      const action = byId.get(id)!;
      steps.push({
        actionId: id,
        title: action.title,
        description: action.description ?? '',
        status: RouteStepStatus.COMPLETED,
        reasonCodes: ['ALREADY_COMPLETED'],
        explanation: 'You have completed this Action.',
        rank: rank++,
        unlocks: openUnlocks(id),
        blockedBy: [],
        provenance: action.provenance,
      });
    }

    const status: RouteStatus =
      openIds.length === 0
        ? RouteStatus.COMPLETED
        : focusActionId
          ? RouteStatus.ACTIVE
          : RouteStatus.BLOCKED;

    return new RouteVersion(
      `rt_${snapshot.id}`,
      snapshot.id,
      steps,
      focusActionId,
      status
    );
  }
}

function formatDeadline(value: string): string {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toISOString().slice(0, 10);
}

function formatList(items: string[]): string {
  if (items.length === 0) return 'its prerequisites';
  if (items.length === 1) return items[0];
  return `${items.slice(0, -1).join(', ')} and ${items[items.length - 1]}`;
}

/**
 * Titles are imperative ("Complete employment onboarding"), so inserting one
 * after "before you can complete …" would double the verb. Matches the
 * canonical explanation copy, which drops the leading verb.
 */
function asCompletable(title: string): string {
  const match = title.match(/^complete\s+(.*)$/i);
  return match ? match[1] : title;
}
