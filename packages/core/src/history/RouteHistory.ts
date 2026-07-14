import { RouteVersion } from '../routing/RouteVersion';
import { RouteDifference, computeRouteDifference } from '../routing/RouteDiff';

export enum RerouteReason {
  FACT_CONFIRMED = 'FACT_CONFIRMED',
  FACT_SUPERSEDED = 'FACT_SUPERSEDED',
  FACT_EXPIRED = 'FACT_EXPIRED',
  FACT_REJECTED = 'FACT_REJECTED',
  ACTION_COMPLETED = 'ACTION_COMPLETED',
  DEADLINE_CHANGED = 'DEADLINE_CHANGED',
  MANUAL_REFRESH = 'MANUAL_REFRESH'
}

export class RerouteEvent {
  public readonly id: string;
  public readonly previousRouteId?: string;
  public readonly newRouteId: string;
  public readonly reason: RerouteReason;
  public readonly diff: RouteDifference;
  public readonly timestamp: Date;

  constructor(id: string, reason: RerouteReason, newRoute: RouteVersion, previousRoute?: RouteVersion) {
    this.id = id;
    this.reason = reason;
    this.newRouteId = newRoute.id;
    this.previousRouteId = previousRoute?.id;
    this.timestamp = new Date();
    this.diff = previousRoute
      ? computeRouteDifference(previousRoute, newRoute)
      : emptyBaselineDifference(newRoute);
  }
}

function emptyBaselineDifference(next: RouteVersion): RouteDifference {
  return {
    focusActionChanged: true,
    newFocus: next.focusActionId
      ? {
          actionId: next.focusActionId,
          title: next.steps.find(s => s.actionId === next.focusActionId)?.title ?? '',
        }
      : undefined,
    added: next.steps.map(s => ({ actionId: s.actionId, title: s.title })),
    removed: [],
    newlyAvailable: [],
    newlyBlocked: [],
    completed: [],
    moved: [],
    deadlineChanges: [],
    isMeaningful: next.steps.length > 0,
  };
}
