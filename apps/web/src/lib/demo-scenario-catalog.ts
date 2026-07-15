export const DEMONSTRATION_SCENARIO_CATALOG = [
  { id: 'SD-001', title: 'First-Time User', objective: 'Generate an initial Route from Confirmed Facts.', nextStep: 'Open the reason codes, then complete the state identification Action.' },
  { id: 'SD-002', title: 'Identification Completed', objective: 'Demonstrate prerequisite unlock behavior.', nextStep: 'Open Route to review the Actions made available by completed identification.' },
  { id: 'SD-003', title: 'Transportation Lost', objective: 'Show a meaningful Reroute after a confirmed transportation constraint.', nextStep: 'Open Facts and confirm the Proposed transportation Constraint.' },
  { id: 'SD-004', title: 'Housing Application Denied', objective: 'Demonstrate Blocker creation and explanation.', nextStep: 'Open Facts and confirm the Proposed housing Blocker.' },
  { id: 'SD-005', title: 'Work Schedule Conflict', objective: 'Show deterministic handling of conflicting Obligations.', nextStep: 'Open Facts and confirm the Proposed supervision Obligation.' },
  { id: 'SD-006', title: 'Deadline Updated', objective: 'Demonstrate deterministic reprioritization.', nextStep: 'Open Facts and confirm the Proposed Deadline.' },
  { id: 'SD-007', title: 'Focus Action Completed', objective: 'Show advancement to the next Focus Action.', nextStep: 'Complete the state identification Action and inspect the Reroute.' },
  { id: 'SD-008', title: 'Proposed Fact Review', objective: 'Demonstrate that Proposed Facts do not affect routing.', nextStep: 'Open Facts and observe that the transit Action is Proposed while the Route is unchanged.' },
  { id: 'SD-009', title: 'Fact Confirmation', objective: 'Demonstrate Route recalculation after confirmation.', nextStep: 'Open Facts and confirm the Proposed transit Action.' },
  { id: 'SD-010', title: 'Route Completion', objective: 'Demonstrate successful completion of all Goals.', nextStep: 'Review the completed state and Route History.' },
] as const;

export type DemonstrationScenarioId =
  (typeof DEMONSTRATION_SCENARIO_CATALOG)[number]['id'];
