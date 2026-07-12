import { Provenance } from './Provenance';

export enum FactStatus {
  Proposed = 'PROPOSED',
  Confirmed = 'CONFIRMED',
  Superseded = 'SUPERSEDED',
  Rejected = 'REJECTED'
}

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
