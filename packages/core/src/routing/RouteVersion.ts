export enum RouteStepStatus {
  FOCUS = 'FOCUS',
  UPCOMING = 'UPCOMING',
  BLOCKED = 'BLOCKED',
  COMPLETED = 'COMPLETED'
}

export enum RouteStatus {
  ACTIVE = 'ACTIVE',
  BLOCKED = 'BLOCKED',
  COMPLETED = 'COMPLETED',
  EMPTY = 'EMPTY'
}

export interface RouteStep {
  actionId: string;
  title: string;
  description: string;
  status: RouteStepStatus;
  /** Deterministic reason codes, e.g. HARD_PREREQUISITE, HIGH_UNLOCK_VALUE, BLOCKED_BY_DEPENDENCY. */
  reasonCodes: string[];
  /** Plain-language answer to "Why it comes next." — deterministic template, never AI-generated. */
  explanation: string;
  rank: number;
  /** Titles of Actions this step makes available once completed. */
  unlocks: string[];
  /** Titles of incomplete Actions this step is waiting on. */
  blockedBy: string[];
  /** Traceable sources supporting the Action itself. */
  provenance: Provenance[];
}

export class RouteVersion {
  public readonly id: string;
  public readonly snapshotId: string;
  public readonly steps: RouteStep[];
  public readonly focusActionId?: string;
  public readonly status: RouteStatus;
  public readonly createdAt: Date;

  constructor(
    id: string,
    snapshotId: string,
    steps: RouteStep[],
    focusActionId: string | undefined,
    status: RouteStatus
  ) {
    this.id = id;
    this.snapshotId = snapshotId;
    this.steps = steps;
    this.focusActionId = focusActionId;
    this.status = status;
    this.createdAt = new Date();
  }
}
import type { Provenance } from '../domain/Provenance';
