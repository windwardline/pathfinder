import { GraphVersion } from '../graph/GraphVersion';
import { Fact } from '../domain/Fact';

export class RoutingSnapshot {
  public readonly id: string;
  public readonly graph: GraphVersion;
  public readonly contextFacts: Fact[];
  public readonly createdAt: Date;

  constructor(id: string, graph: GraphVersion, contextFacts: Fact[]) {
    this.id = id;
    this.graph = graph;
    this.contextFacts = contextFacts;
    this.createdAt = new Date();
  }
}
