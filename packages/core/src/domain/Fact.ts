import { Provenance } from './Provenance';

export enum FactStatus {
  Proposed = 'PROPOSED',
  Confirmed = 'CONFIRMED',
  Superseded = 'SUPERSEDED',
  Rejected = 'REJECTED',
  Expired = 'EXPIRED'
}

export type ActionStatus = 'OPEN' | 'COMPLETED';

export interface ActionFactPayload {
  key: 'ACTION';
  value: {
    title: string;
    description: string;
    status: ActionStatus;
    goalId?: string;
    /** Deterministic Release 1 ranking inputs. Omitted factors use neutral defaults. */
    routing?: {
      criticalDeadline?: boolean;
      deadline?: string;
      mandatoryObligation?: boolean;
      blockerReduction?: number;
      goalAlignment?: number;
      userPriority?: number;
      conflictAvoidance?: number;
      effortCost?: number;
    };
  };
}

export interface DependencyFactPayload {
  key: 'DEPENDENCY';
  value: {
    sourceId: string;
    targetId: string;
    type: 'BLOCKS' | 'REQUIRES' | 'UNLOCKS' | 'SUPPORTS' | 'CONFLICTS_WITH' | 'SATISFIES';
  };
}

export interface GoalFactPayload {
  key: 'GOAL';
  value: { title: string; status: 'ACTIVE' | 'ACHIEVED' | 'PAUSED' | 'ABANDONED'; priority: number };
}

export interface RequirementFactPayload {
  key: 'REQUIREMENT';
  value: {
    description: string;
    status: 'UNSATISFIED' | 'SATISFIED' | 'WAIVED' | 'UNKNOWN';
    hardness: 'HARD' | 'SOFT';
    targetActionId: string;
    resolutionActionId?: string;
  };
}

export interface ConstraintFactPayload {
  key: 'CONSTRAINT';
  value: {
    constraintType: 'TIME' | 'TRANSPORTATION' | 'FINANCIAL' | 'LOCATION' | 'AVAILABILITY' | 'ACCESSIBILITY' | 'POLICY';
    description: string;
    status: 'ACTIVE' | 'INACTIVE' | 'SUPERSEDED';
    targetActionIds: string[];
    resolutionActionId?: string;
  };
}

export interface ObligationFactPayload {
  key: 'OBLIGATION';
  value: {
    title: string;
    status: 'ACTIVE' | 'COMPLETED' | 'CANCELLED';
    startAt: string;
    endAt?: string;
    conflictActionIds?: string[];
    resolutionActionId?: string;
  };
}

export interface DeadlineFactPayload {
  key: 'DEADLINE';
  value: {
    title: string;
    dueAt: string;
    severity: 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL';
    targetActionId: string;
  };
}

export interface BlockerFactPayload {
  key: 'BLOCKER';
  value: {
    targetActionId: string;
    reasonCode: string;
    description: string;
    active: boolean;
    resolutionActionId?: string;
  };
}

export type KnownFactPayload =
  | ActionFactPayload
  | DependencyFactPayload
  | GoalFactPayload
  | RequirementFactPayload
  | ConstraintFactPayload
  | ObligationFactPayload
  | DeadlineFactPayload
  | BlockerFactPayload;

export interface FactPayload {
  key: string;
  value: any;
  [key: string]: any;
}

export interface Fact {
  id: string;
  status: FactStatus;
  payload: FactPayload;
  createdAt: Date;
  updatedAt: Date;
  provenance?: Provenance;
  /** Complete immutable provenance trail, oldest source first. */
  provenanceHistory?: Provenance[];
  supersedesFactId?: string;
  supersededByFactId?: string;
  expiresAt?: Date;
}
