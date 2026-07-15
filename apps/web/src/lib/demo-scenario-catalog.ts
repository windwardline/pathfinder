export const DEMONSTRATION_SCENARIO_CATALOG = [
  { id: 'SD-001', title: 'First-Time User', objective: 'Generate an initial Route from Confirmed Facts.' },
  { id: 'SD-002', title: 'Identification Completed', objective: 'Demonstrate prerequisite unlock behavior.' },
  { id: 'SD-003', title: 'Transportation Lost', objective: 'Show a meaningful Reroute after a confirmed transportation constraint.' },
  { id: 'SD-004', title: 'Housing Application Denied', objective: 'Demonstrate Blocker creation and explanation.' },
  { id: 'SD-005', title: 'Work Schedule Conflict', objective: 'Show deterministic handling of conflicting Obligations.' },
  { id: 'SD-006', title: 'Deadline Updated', objective: 'Demonstrate deterministic reprioritization.' },
  { id: 'SD-007', title: 'Focus Action Completed', objective: 'Show advancement to the next Focus Action.' },
  { id: 'SD-008', title: 'Proposed Fact Review', objective: 'Demonstrate that Proposed Facts do not affect routing.' },
  { id: 'SD-009', title: 'Fact Confirmation', objective: 'Demonstrate Route recalculation after confirmation.' },
  { id: 'SD-010', title: 'Route Completion', objective: 'Demonstrate successful completion of all Goals.' },
] as const;

export type DemonstrationScenarioId =
  (typeof DEMONSTRATION_SCENARIO_CATALOG)[number]['id'];
