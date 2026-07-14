/** Canonical Release 1 planning aggregate. Route Engine inputs are derived from this state. */
export interface Plan {
  id: string;
  userId: string;
  version: number;
  status: 'ACTIVE' | 'SUPERSEDED';
  goals: PlanGoal[];
  actions: PlanAction[];
  requirements: PlanRequirement[];
  obligations: PlanObligation[];
  constraints: PlanConstraint[];
  deadlines: PlanDeadline[];
  blockers: PlanBlocker[];
  unlocks: PlanUnlock[];
  dependencies: PlanDependency[];
  createdAt: Date;
  updatedAt: Date;
}

export interface PlanGoal {
  id: string;
  title: string;
  status: 'ACTIVE' | 'ACHIEVED' | 'PAUSED' | 'ABANDONED';
  priority: number;
}

export interface PlanAction {
  id: string;
  title: string;
  status: 'AVAILABLE' | 'BLOCKED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  actionType: string;
  effortEstimate: number;
  dueAt?: Date;
}

export interface PlanRequirement {
  id: string;
  description: string;
  requirementType: string;
  status: 'UNSATISFIED' | 'SATISFIED' | 'WAIVED' | 'UNKNOWN';
  hardness: 'HARD' | 'SOFT';
}

export interface PlanObligation {
  id: string;
  title: string;
  status: 'ACTIVE' | 'COMPLETED' | 'CANCELLED';
  startAt: Date;
  endAt?: Date;
  sourceFactId: string;
}

export interface PlanConstraint {
  id: string;
  constraintType: 'TIME' | 'TRANSPORTATION' | 'FINANCIAL' | 'LOCATION' | 'AVAILABILITY' | 'ACCESSIBILITY' | 'POLICY';
  value: unknown;
  status: 'ACTIVE' | 'INACTIVE' | 'SUPERSEDED';
  sourceFactId: string;
}

export interface PlanDeadline {
  id: string;
  title: string;
  dueAt: Date;
  severity: 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL';
  sourceFactId: string;
}

export interface PlanBlocker {
  id: string;
  targetEntityId: string;
  reasonCode: string;
  description: string;
  active: boolean;
  sourceReference: string;
}

export interface PlanUnlock {
  id: string;
  sourceActionId: string;
  targetId: string;
  unlockType: string;
}

export interface PlanDependency {
  id: string;
  sourceEntityId: string;
  targetEntityId: string;
  relationshipType: 'REQUIRES' | 'BLOCKS' | 'UNLOCKS' | 'SUPPORTS' | 'CONFLICTS_WITH' | 'SATISFIES';
  hardness: 'HARD' | 'SOFT';
  active: boolean;
  derivationType: 'DOMAIN_STATE' | 'VERIFIED_RULE' | 'USER_CONFIRMED_RELATIONSHIP' | 'SYSTEM_DERIVATION';
  derivationReference: string;
}
