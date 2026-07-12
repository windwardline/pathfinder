import { RouteVersion, RouteStepStatus } from '../routing/RouteVersion';

export enum RerouteReason {
  FACT_CONFIRMED = 'FACT_CONFIRMED',
  FACT_SUPERSEDED = 'FACT_SUPERSEDED',
  ACTION_COMPLETED = 'ACTION_COMPLETED',
  MANUAL_REFRESH = 'MANUAL_REFRESH'
}

export interface RouteDifference {
  addedActionIds: string[];
  removedActionIds: string[];
  statusChanges: { actionId: string, oldStatus: RouteStepStatus, newStatus: RouteStepStatus }[];
  focusChanged: boolean;
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
    this.diff = this.calculateDiff(previousRoute, newRoute);
  }

  private calculateDiff(prev: RouteVersion | undefined, next: RouteVersion): RouteDifference {
    if (!prev) {
      return {
        addedActionIds: next.steps.map(s => s.actionId),
        removedActionIds: [],
        statusChanges: [],
        focusChanged: true
      };
    }

    const prevMap = new Map(prev.steps.map(s => [s.actionId, s]));
    const nextMap = new Map(next.steps.map(s => [s.actionId, s]));

    const added = next.steps.filter(s => !prevMap.has(s.actionId)).map(s => s.actionId);
    const removed = prev.steps.filter(s => !nextMap.has(s.actionId)).map(s => s.actionId);
    
    const statusChanges = [];
    for (const nextStep of next.steps) {
      const prevStep = prevMap.get(nextStep.actionId);
      if (prevStep && prevStep.status !== nextStep.status) {
        statusChanges.push({
          actionId: nextStep.actionId,
          oldStatus: prevStep.status,
          newStatus: nextStep.status
        });
      }
    }

    return {
      addedActionIds: added,
      removedActionIds: removed,
      statusChanges,
      focusChanged: prev.focusActionId !== next.focusActionId
    };
  }
}
