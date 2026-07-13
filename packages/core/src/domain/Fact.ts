import { Provenance } from './Provenance';

export enum FactStatus {
  Proposed = 'PROPOSED',
  Confirmed = 'CONFIRMED',
  Superseded = 'SUPERSEDED',
  Rejected = 'REJECTED'
}

export type ActionStatus = 'OPEN' | 'COMPLETED';

export interface ActionFactPayload {
  key: 'ACTION';
  value: {
    title: string;
    description: string;
    status: ActionStatus;
  };
}

export interface DependencyFactPayload {
  key: 'DEPENDENCY';
  value: {
    sourceId: string;
    targetId: string;
    type: 'BLOCKS' | 'REQUIRES';
  };
}

export type KnownFactPayload = ActionFactPayload | DependencyFactPayload;

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
  supersededByFactId?: string;
}
