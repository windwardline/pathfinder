export interface GraphNode {
  id: string;
  type: 'GOAL' | 'ACTION' | 'REQUIREMENT' | 'OBLIGATION' | 'CONSTRAINT' | 'DEADLINE' | 'BLOCKER' | 'UNLOCK';
}

export interface Goal extends GraphNode {
  type: 'GOAL';
  title: string;
  description: string;
  status: 'OPEN' | 'COMPLETED' | 'BLOCKED';
}

export interface Action extends GraphNode {
  type: 'ACTION';
  title: string;
  description: string;
  status: 'OPEN' | 'COMPLETED' | 'BLOCKED';
  createdAt?: Date;
  provenance: Provenance[];
  goalId?: string;
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
}

export interface Requirement extends GraphNode {
  type: 'REQUIREMENT';
  description: string;
  isMet: boolean;
}

export interface Constraint extends GraphNode {
  type: 'CONSTRAINT';
  description: string;
  isViolated: boolean;
}

export interface Deadline extends GraphNode {
  type: 'DEADLINE';
  date: Date;
  isExpired: boolean;
}

export interface Blocker extends GraphNode {
  type: 'BLOCKER';
  description: string;
}

export interface Obligation extends GraphNode {
  type: 'OBLIGATION';
  title: string;
  status: 'ACTIVE' | 'COMPLETED' | 'CANCELLED';
  startAt: Date;
  endAt?: Date;
}

export interface Unlock extends GraphNode {
  type: 'UNLOCK';
  sourceActionId: string;
  targetId: string;
  unlockType: string;
}

export interface Dependency {
  sourceId: string;
  targetId: string;
  type: 'REQUIRES' | 'BLOCKS' | 'UNLOCKS' | 'SUPPORTS' | 'CONFLICTS_WITH' | 'SATISFIES';
}
import type { Provenance } from '../domain/Provenance';
