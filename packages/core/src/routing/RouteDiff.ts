import { RouteVersion, RouteStepStatus } from './RouteVersion';

export interface RouteStepRef {
  actionId: string;
  title: string;
  reasonCodes: string[];
}

export interface MovedStep extends RouteStepRef {
  fromRank: number;
  toRank: number;
}

export interface DeadlineChange extends RouteStepRef {
  previousDeadline?: string;
  newDeadline?: string;
}

export interface ObligationChange extends RouteStepRef {
  wasMandatory: boolean;
  isMandatory: boolean;
}

export interface ConstraintChange extends RouteStepRef {
  addedConstraintIds: string[];
  removedConstraintIds: string[];
}

/**
 * Structured Route Difference between two Route Versions. Powers the Reroute
 * explanation: what changed, what moved, what became blocked, what became
 * available. The client must never infer differences itself.
 */
export interface RouteDifference {
  focusActionChanged: boolean;
  previousFocus?: RouteStepRef;
  newFocus?: RouteStepRef;
  added: RouteStepRef[];
  removed: RouteStepRef[];
  newlyAvailable: RouteStepRef[];
  newlyBlocked: RouteStepRef[];
  completed: RouteStepRef[];
  moved: MovedStep[];
  deadlineChanges: DeadlineChange[];
  obligationChanges: ObligationChange[];
  constraintChanges: ConstraintChange[];
  isMeaningful: boolean;
}

const ACTIONABLE = new Set([RouteStepStatus.FOCUS, RouteStepStatus.UPCOMING]);

export function computeRouteDifference(
  prev: RouteVersion,
  next: RouteVersion
): RouteDifference {
  const prevMap = new Map(prev.steps.map(s => [s.actionId, s]));
  const nextMap = new Map(next.steps.map(s => [s.actionId, s]));

  const ref = (s: { actionId: string; title: string; reasonCodes: string[] }): RouteStepRef => ({
    actionId: s.actionId,
    title: s.title,
    reasonCodes: s.reasonCodes,
  });

  const added = next.steps.filter(s => !prevMap.has(s.actionId)).map(ref);
  const removed = prev.steps.filter(s => !nextMap.has(s.actionId)).map(ref);

  const newlyAvailable: RouteStepRef[] = next.steps
    .filter(s => !prevMap.has(s.actionId) && ACTIONABLE.has(s.status))
    .map(ref);
  const newlyBlocked: RouteStepRef[] = next.steps
    .filter(step => !prevMap.has(step.actionId) && step.status === RouteStepStatus.BLOCKED)
    .map(ref);
  const completed: RouteStepRef[] = [];
  const moved: MovedStep[] = [];
  const deadlineChanges: DeadlineChange[] = [];
  const obligationChanges: ObligationChange[] = [];
  const constraintChanges: ConstraintChange[] = [];

  for (const nextStep of next.steps) {
    const prevStep = prevMap.get(nextStep.actionId);
    if (!prevStep) continue;

    const statusChanged = prevStep.status !== nextStep.status;
    if (prevStep.deadline !== nextStep.deadline) {
      deadlineChanges.push({
        ...ref(nextStep),
        previousDeadline: prevStep.deadline,
        newDeadline: nextStep.deadline,
      });
    }
    if (Boolean(prevStep.mandatoryObligation) !== Boolean(nextStep.mandatoryObligation)) {
      obligationChanges.push({
        ...ref(nextStep),
        wasMandatory: Boolean(prevStep.mandatoryObligation),
        isMandatory: Boolean(nextStep.mandatoryObligation),
      });
    }
    const previousConstraintIds = new Set(prevStep.constraintIds ?? []);
    const nextConstraintIds = new Set(nextStep.constraintIds ?? []);
    const addedConstraintIds = [...nextConstraintIds]
      .filter(id => !previousConstraintIds.has(id))
      .sort();
    const removedConstraintIds = [...previousConstraintIds]
      .filter(id => !nextConstraintIds.has(id))
      .sort();
    if (addedConstraintIds.length > 0 || removedConstraintIds.length > 0) {
      constraintChanges.push({
        ...ref(nextStep),
        addedConstraintIds,
        removedConstraintIds,
      });
    }
    if (statusChanged && nextStep.status === RouteStepStatus.COMPLETED) {
      completed.push(ref(nextStep));
    } else if (
      statusChanged &&
      prevStep.status === RouteStepStatus.BLOCKED &&
      ACTIONABLE.has(nextStep.status)
    ) {
      newlyAvailable.push(ref(nextStep));
    } else if (
      statusChanged &&
      ACTIONABLE.has(prevStep.status) &&
      nextStep.status === RouteStepStatus.BLOCKED
    ) {
      newlyBlocked.push(ref(nextStep));
    } else if (prevStep.rank !== nextStep.rank) {
      moved.push({ ...ref(nextStep), fromRank: prevStep.rank, toRank: nextStep.rank });
    }
  }

  const focusActionChanged = prev.focusActionId !== next.focusActionId;
  const prevFocusStep = prev.focusActionId ? prevMap.get(prev.focusActionId) : undefined;
  const nextFocusStep = next.focusActionId ? nextMap.get(next.focusActionId) : undefined;

  const isMeaningful =
    focusActionChanged ||
    added.length > 0 ||
    removed.length > 0 ||
    newlyAvailable.length > 0 ||
    newlyBlocked.length > 0 ||
    completed.length > 0 ||
    moved.length > 0 ||
    deadlineChanges.length > 0 ||
    obligationChanges.length > 0 ||
    constraintChanges.length > 0;

  return {
    focusActionChanged,
    previousFocus: prevFocusStep ? ref(prevFocusStep) : undefined,
    newFocus: nextFocusStep ? ref(nextFocusStep) : undefined,
    added,
    removed,
    newlyAvailable,
    newlyBlocked,
    completed,
    moved,
    deadlineChanges,
    obligationChanges,
    constraintChanges,
    isMeaningful,
  };
}
