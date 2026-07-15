import type { DemonstrationScenarioId } from './demo-scenario-catalog';

// Server-side fixture details. Client Components import only the metadata-only
// catalog so Dependency Graph infrastructure never enters the browser bundle.

interface ScenarioAction {
  ref: string;
  title: string;
  description: string;
  actionStatus: 'OPEN' | 'COMPLETED';
  factStatus?: 'PROPOSED' | 'CONFIRMED';
  sourceText?: string;
  routing?: {
    criticalDeadline?: boolean;
    deadline?: string;
    mandatoryObligation?: boolean;
    conflictAvoidance?: number;
    effortCost?: number;
  };
}

interface ScenarioDependency {
  prerequisiteRef: string;
  dependentRef: string;
}

export interface DemonstrationScenario {
  id: DemonstrationScenarioId;
  title: string;
  objective: string;
  actions: ScenarioAction[];
  dependencies: ScenarioDependency[];
}

const baseActions = (): ScenarioAction[] => [
  {
    ref: 'birth-certificate',
    title: 'Request your birth certificate',
    description: 'Order a certified copy from the county records office.',
    actionStatus: 'COMPLETED',
    sourceText: 'Bring a certified birth certificate to your ID appointment. — Identification guidance packet',
  },
  {
    ref: 'state-id',
    title: 'Obtain a state identification card',
    description: 'Visit the DMV with your birth certificate and proof of address.',
    actionStatus: 'OPEN',
    sourceText: 'A current state ID is required before onboarding paperwork can be processed. — Harbor Light Logistics offer letter',
  },
  {
    ref: 'employment-onboarding',
    title: 'Complete employment onboarding at Harbor Light Logistics',
    description: 'Submit your I-9 and direct-deposit forms to HR.',
    actionStatus: 'OPEN',
    sourceText: 'Please complete onboarding within two weeks of your start date. — Harbor Light Logistics offer letter',
  },
  {
    ref: 'housing-application',
    title: 'Submit the housing application at Riverside Commons',
    description: 'File the supportive-housing application with a copy of your state ID.',
    actionStatus: 'OPEN',
    sourceText: 'Applications require a government-issued photo ID. — Riverside Commons application checklist',
  },
  {
    ref: 'checking-account',
    title: 'Open a checking account',
    description: 'A basic account lets your paychecks arrive by direct deposit.',
    actionStatus: 'OPEN',
    sourceText: 'Direct deposit requires an active checking account. — Harbor Light Logistics onboarding guide',
  },
  {
    ref: 'supervision-checkin',
    title: 'Schedule your weekly supervision check-in',
    description: 'Set a recurring time that will not conflict with your work shifts.',
    actionStatus: 'OPEN',
    sourceText: 'Check-ins are required weekly; reschedule at least 48 hours ahead. — Supervision schedule',
  },
];

const baseDependencies = (): ScenarioDependency[] => [
  { prerequisiteRef: 'birth-certificate', dependentRef: 'state-id' },
  { prerequisiteRef: 'state-id', dependentRef: 'employment-onboarding' },
  { prerequisiteRef: 'state-id', dependentRef: 'housing-application' },
  { prerequisiteRef: 'state-id', dependentRef: 'checking-account' },
];

function withStateIdCompleted(): ScenarioAction[] {
  return baseActions().map(action =>
    action.ref === 'state-id' ? { ...action, actionStatus: 'COMPLETED' } : action
  );
}

export const DEMONSTRATION_SCENARIOS: DemonstrationScenario[] = [
  {
    id: 'SD-001',
    title: 'First-Time User',
    objective: 'Generate an initial Route from Confirmed Facts.',
    actions: baseActions(),
    dependencies: baseDependencies(),
  },
  {
    id: 'SD-002',
    title: 'Identification Completed',
    objective: 'Demonstrate prerequisite unlock behavior.',
    actions: withStateIdCompleted(),
    dependencies: baseDependencies(),
  },
  {
    id: 'SD-003',
    title: 'Transportation Lost',
    objective: 'Show a meaningful Reroute after a confirmed transportation constraint.',
    actions: [
      {
        ref: 'restore-transportation',
        title: 'Restore transportation access',
        description: 'Arrange a reliable way to reach employment onboarding.',
        actionStatus: 'OPEN',
      },
      {
        ref: 'employment-onboarding',
        title: 'Travel to employment onboarding',
        description: 'Attend the scheduled employment onboarding appointment.',
        actionStatus: 'OPEN',
      },
      {
        ref: 'supervision-call',
        title: 'Call your supervision officer',
        description: 'Confirm the weekly check-in schedule.',
        actionStatus: 'OPEN',
      },
    ],
    dependencies: [
      { prerequisiteRef: 'restore-transportation', dependentRef: 'employment-onboarding' },
    ],
  },
  {
    id: 'SD-004',
    title: 'Housing Application Denied',
    objective: 'Demonstrate Blocker creation and explanation.',
    actions: [
      {
        ref: 'denial-review',
        title: 'Request a housing denial review',
        description: 'Ask Riverside Commons to review the fictional denial notice.',
        actionStatus: 'OPEN',
      },
      {
        ref: 'housing-application',
        title: 'Complete the housing application',
        description: 'Finish the application after the denial review is resolved.',
        actionStatus: 'OPEN',
      },
    ],
    dependencies: [
      { prerequisiteRef: 'denial-review', dependentRef: 'housing-application' },
    ],
  },
  {
    id: 'SD-005',
    title: 'Work Schedule Conflict',
    objective: 'Show deterministic handling of conflicting Obligations.',
    actions: [
      {
        ref: 'schedule-conflict',
        title: 'Resolve the work schedule conflict',
        description: 'Coordinate the fictional work shift and supervision check-in.',
        actionStatus: 'OPEN',
        routing: {
          mandatoryObligation: true,
          conflictAvoidance: 10,
          effortCost: 10,
        },
      },
      {
        ref: 'optional-worksheet',
        title: 'Complete an optional worksheet',
        description: 'Review the optional preparation worksheet.',
        actionStatus: 'OPEN',
        routing: { effortCost: 1 },
      },
    ],
    dependencies: [],
  },
  {
    id: 'SD-006',
    title: 'Deadline Updated',
    objective: 'Demonstrate deterministic reprioritization.',
    actions: [
      {
        ref: 'deadline-paperwork',
        title: 'Submit time-sensitive paperwork',
        description: 'Submit the fictional paperwork before its Confirmed Deadline.',
        actionStatus: 'OPEN',
        routing: {
          criticalDeadline: true,
          deadline: '2026-07-16T17:00:00.000Z',
        },
      },
      {
        ref: 'orientation',
        title: 'Attend orientation',
        description: 'Attend the next available orientation.',
        actionStatus: 'OPEN',
      },
    ],
    dependencies: [],
  },
  {
    id: 'SD-007',
    title: 'Focus Action Completed',
    objective: 'Show advancement to the next Focus Action.',
    actions: withStateIdCompleted(),
    dependencies: baseDependencies(),
  },
  {
    id: 'SD-008',
    title: 'Proposed Fact Review',
    objective: 'Demonstrate that Proposed Facts do not affect routing.',
    actions: [
      ...baseActions(),
      {
        ref: 'transit-pass',
        title: 'Apply for a transit pass',
        description: 'Review this candidate Action before it can affect the Route.',
        actionStatus: 'OPEN',
        factStatus: 'PROPOSED',
      },
    ],
    dependencies: baseDependencies(),
  },
  {
    id: 'SD-009',
    title: 'Fact Confirmation',
    objective: 'Demonstrate Route recalculation after confirmation.',
    actions: [
      ...baseActions(),
      {
        ref: 'transit-pass',
        title: 'Apply for a transit pass',
        description: 'Confirm this Proposed Fact to trigger a Reroute.',
        actionStatus: 'OPEN',
        factStatus: 'PROPOSED',
      },
    ],
    dependencies: baseDependencies(),
  },
  {
    id: 'SD-010',
    title: 'Route Completion',
    objective: 'Demonstrate successful completion of all Goals.',
    actions: baseActions().map(action => ({ ...action, actionStatus: 'COMPLETED' })),
    dependencies: baseDependencies(),
  },
];

export function findDemonstrationScenario(id: string): DemonstrationScenario | undefined {
  return DEMONSTRATION_SCENARIOS.find(scenario => scenario.id === id);
}
