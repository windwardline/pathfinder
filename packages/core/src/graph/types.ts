export interface GraphNode {
  id: string;
  type: 'GOAL' | 'ACTION' | 'REQUIREMENT' | 'CONSTRAINT' | 'DEADLINE' | 'BLOCKER';
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

export interface Dependency {
  sourceId: string;
  targetId: string;
  type: 'BLOCKS' | 'REQUIRES' | 'CONSTRAINS' | 'COMPLETES';
}
import type { Provenance } from '../domain/Provenance';
