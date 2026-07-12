export enum RouteStepStatus {
  FOCUS = 'FOCUS',
  BLOCKED = 'BLOCKED',
  PENDING = 'PENDING',
  COMPLETED = 'COMPLETED'
}

export interface RouteStep {
  actionId: string;
  status: RouteStepStatus;
  reasonCode: string; // e.g. 'BLOCKED_BY_DEPENDENCY', 'TIE_BREAK_LEXICOGRAPHIC'
  rank: number;
}

export class RouteVersion {
  public readonly id: string;
  public readonly snapshotId: string;
  public readonly steps: RouteStep[];
  public readonly focusActionId?: string;
  public readonly createdAt: Date;

  constructor(id: string, snapshotId: string, steps: RouteStep[], focusActionId?: string) {
    this.id = id;
    this.snapshotId = snapshotId;
    this.steps = steps;
    this.focusActionId = focusActionId;
    this.createdAt = new Date();
  }
}
