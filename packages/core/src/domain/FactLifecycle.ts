import { Fact, FactStatus } from './Fact';
import { Provenance } from './Provenance';

export class FactLifecycleError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'FactLifecycleError';
  }
}

export const FactLifecycle = {
  propose(id: string, payload: any, provenance?: Provenance): Fact {
    return {
      id,
      status: FactStatus.Proposed,
      payload,
      createdAt: new Date(),
      updatedAt: new Date(),
      provenance
    };
  },

  confirm(fact: Fact, provenance: Provenance): Fact {
    if (fact.status !== FactStatus.Proposed) {
      throw new FactLifecycleError(`Cannot confirm fact in status ${fact.status}`);
    }
    
    return {
      ...fact,
      status: FactStatus.Confirmed,
      provenance: provenance || fact.provenance, // Confirmation must have provenance
      updatedAt: new Date()
    };
  },

  reject(fact: Fact): Fact {
    if (fact.status !== FactStatus.Proposed) {
      throw new FactLifecycleError(`Cannot reject fact in status ${fact.status}`);
    }
    return {
      ...fact,
      status: FactStatus.Rejected,
      updatedAt: new Date()
    };
  },

  supersede(oldFact: Fact, newFact: Fact): Fact {
    if (oldFact.status !== FactStatus.Confirmed) {
      throw new FactLifecycleError(`Only Confirmed facts can be superseded. Current status: ${oldFact.status}`);
    }
    if (newFact.status !== FactStatus.Confirmed) {
      throw new FactLifecycleError(`Superseding fact must be Confirmed. Current status: ${newFact.status}`);
    }
    return {
      ...oldFact,
      status: FactStatus.Superseded,
      supersededByFactId: newFact.id,
      updatedAt: new Date()
    };
  }
};
