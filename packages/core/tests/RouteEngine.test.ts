import { describe, it, expect } from 'vitest';
import {
  RouteEngine,
  RoutingSnapshot,
  GraphVersion,
  Fact,
  FactStatus,
  RouteStepStatus,
  RouteStatus,
  computeRouteDifference,
  FactLifecycle,
} from '../src/index';

function actionFact(
  id: string,
  title: string,
  status: 'OPEN' | 'COMPLETED' = 'OPEN',
  description = 'desc',
  routing?: {
    criticalDeadline?: boolean;
    deadline?: string;
    mandatoryObligation?: boolean;
    blockerReduction?: number;
    goalAlignment?: number;
    userPriority?: number;
    conflictAvoidance?: number;
    effortCost?: number;
  }
): Fact {
  return {
    id,
    payload: { key: 'ACTION', value: { title, description, status, routing } },
    status: FactStatus.Confirmed,
    provenance: { source: 'test_fixture' },
  } as Fact;
}

function dependencyFact(id: string, sourceId: string, targetId: string, type: 'BLOCKS' | 'REQUIRES' = 'BLOCKS'): Fact {
  return {
    id,
    payload: { key: 'DEPENDENCY', value: { sourceId, targetId, type } },
    status: FactStatus.Confirmed,
    provenance: { source: 'test_fixture' },
  } as Fact;
}

function domainFact(id: string, key: string, value: unknown): Fact {
  return {
    id,
    payload: { key, value },
    status: FactStatus.Confirmed,
    provenance: { source: 'test_fixture' },
  } as Fact;
}

function buildRoute(facts: Fact[], graphId = 'g', snapshotId = 's') {
  const graph = new GraphVersion(graphId, facts);
  const snapshot = new RoutingSnapshot(snapshotId, graph, facts);
  return RouteEngine.generateRoute(snapshot);
}

describe('RouteEngine - Golden Fixtures', () => {
  // GF-001: Initial Route generation — deterministic Route creation.
  // Seed mirrors the canonical demo scenario: birth certificate already completed,
  // state ID unlocks employment onboarding and the housing application.
  const gf001Facts = () => [
    actionFact('f-birth', 'Request your birth certificate', 'COMPLETED'),
    actionFact('f-id', 'Obtain a state identification card'),
    actionFact('f-onboard', 'Complete employment onboarding'),
    actionFact('f-housing', 'Submit the housing application'),
    actionFact('f-supervision', 'Schedule your supervision check-in'),
    dependencyFact('d1', 'f-birth', 'f-id'),
    dependencyFact('d2', 'f-id', 'f-onboard'),
    dependencyFact('d3', 'f-id', 'f-housing'),
  ];

  it('GF-001: generates the initial Route with correct Focus Action and states', () => {
    const route = buildRoute(gf001Facts());

    expect(route.status).toBe(RouteStatus.ACTIVE);
    expect(route.focusActionId).toBe('f-id');

    const focus = route.steps.find(s => s.actionId === 'f-id')!;
    expect(focus.status).toBe(RouteStepStatus.FOCUS);
    expect(focus.title).toBe('Obtain a state identification card');
    expect(focus.reasonCodes).toContain('HARD_PREREQUISITE');
    expect(focus.reasonCodes).toContain('HIGH_UNLOCK_VALUE');
    expect(focus.provenance).toEqual([{ source: 'test_fixture' }]);
    expect(focus.unlocks).toEqual(
      expect.arrayContaining(['Complete employment onboarding', 'Submit the housing application'])
    );
    // Canonical copy: a leading "Complete" in the downstream title is not doubled.
    expect(focus.explanation).toBe(
      'This comes next because it is required before you can complete employment onboarding.'
    );

    const supervision = route.steps.find(s => s.actionId === 'f-supervision')!;
    expect(supervision.status).toBe(RouteStepStatus.UPCOMING);

    const onboarding = route.steps.find(s => s.actionId === 'f-onboard')!;
    expect(onboarding.status).toBe(RouteStepStatus.BLOCKED);
    expect(onboarding.reasonCodes).toContain('BLOCKED_BY_DEPENDENCY');
    expect(onboarding.blockedBy).toEqual(['Obtain a state identification card']);

    const completed = route.steps.find(s => s.actionId === 'f-birth')!;
    expect(completed.status).toBe(RouteStepStatus.COMPLETED);
    expect(completed.reasonCodes).toContain('ALREADY_COMPLETED');

    // Ranks are a contiguous 1..n sequence with incomplete steps ranked before completed ones.
    expect(route.steps.map(s => s.rank)).toEqual([1, 2, 3, 4, 5]);
    expect(route.steps[route.steps.length - 1].actionId).toBe('f-birth');
  });

  it('GF-001 metamorphic: reordering input facts produces an identical Route', () => {
    const a = buildRoute(gf001Facts());
    const b = buildRoute([...gf001Facts()].reverse());
    expect(b.steps.map(s => [s.actionId, s.status, s.rank])).toEqual(
      a.steps.map(s => [s.actionId, s.status, s.rank])
    );
    expect(b.focusActionId).toBe(a.focusActionId);
  });

  it('ADR-002: Focus Action does not depend on the IDs or titles of completed actions', () => {
    const variantA = [
      actionFact('f-b', 'b-review'),
      actionFact('f-z', 'z-setup', 'COMPLETED'),
      actionFact('f-a', 'a-deploy'),
      dependencyFact('d1', 'f-z', 'f-a'),
    ];
    // Identical logical state; the completed action just has a different title/id.
    const variantB = [
      actionFact('f-b', 'b-review'),
      actionFact('f-0', 'a0-setup', 'COMPLETED'),
      actionFact('f-a', 'a-deploy'),
      dependencyFact('d1', 'f-0', 'f-a'),
    ];

    const routeA = buildRoute(variantA);
    const routeB = buildRoute(variantB);
    expect(routeA.focusActionId).toBe(routeB.focusActionId);
    // Relative order of the two open actions must match in both variants.
    const orderA = routeA.steps.filter(s => s.status !== RouteStepStatus.COMPLETED).map(s => s.actionId);
    const orderB = routeB.steps.filter(s => s.status !== RouteStepStatus.COMPLETED).map(s => s.actionId);
    expect(orderA).toEqual(orderB);
  });

  it('ADR-002: BLOCKED steps use ranking factors before the stable title tie-break', () => {
    const facts = [
      actionFact('f-root', 'Apply for the program'),
      actionFact('f-x', 'Zeta follow-up'),
      actionFact('f-y', 'Alpha follow-up'),
      actionFact('f-deep', 'Final review'),
      dependencyFact('d1', 'f-root', 'f-x'),
      dependencyFact('d2', 'f-root', 'f-y'),
      dependencyFact('d3', 'f-x', 'f-deep'),
    ];
    const route = buildRoute(facts);
    const blockedOrder = route.steps
      .filter(s => s.status === RouteStepStatus.BLOCKED)
      .map(s => s.title);
    // Zeta unlocks Final review, so canonical unlock value ranks it before
    // alphabetically earlier Alpha; the deeper successor still follows both.
    expect(blockedOrder).toEqual(['Zeta follow-up', 'Alpha follow-up', 'Final review']);
  });

  it('rejects a dangling BLOCKS edge instead of making the dependent Action eligible', () => {
    const facts = [
      actionFact('f-a', 'Attend orientation'),
      dependencyFact('d1', 'f-ghost', 'f-a'),
    ];
    expect(() => buildRoute(facts)).toThrow(/unknown action/i);
  });

  it('ranks a hard prerequisite ahead of an unrelated alphabetically earlier Action', () => {
    const facts = [
      actionFact('f-optional', 'Apply for an optional program'),
      actionFact('f-prerequisite', 'Resolve the identification prerequisite'),
      actionFact('f-onboarding', 'Start employment onboarding'),
      dependencyFact('d1', 'f-prerequisite', 'f-onboarding'),
    ];

    expect(buildRoute(facts).focusActionId).toBe('f-prerequisite');
  });

  it('applies the canonical ranking tuple before the stable title/id tie-break', () => {
    const facts = [
      actionFact('f-effort', 'A low-effort optional Action', 'OPEN', 'desc', { effortCost: 1 }),
      actionFact('f-obligation', 'Protect a mandatory obligation', 'OPEN', 'desc', {
        mandatoryObligation: true,
        effortCost: 10,
      }),
      actionFact('f-deadline', 'Protect a critical deadline', 'OPEN', 'desc', {
        criticalDeadline: true,
        deadline: '2026-07-14T12:00:00.000Z',
        effortCost: 20,
      }),
    ];

    const route = buildRoute(facts);
    expect(route.focusActionId).toBe('f-deadline');
    expect(route.steps.map(step => step.actionId)).toEqual([
      'f-deadline',
      'f-obligation',
      'f-effort',
    ]);
    expect(route.steps[0].reasonCodes).toContain('CRITICAL_DEADLINE');
  });

  it('REQUIRES dependency is honored as the reverse of BLOCKS', () => {
    const facts = [
      actionFact('f-onboard', 'Complete employment onboarding'),
      actionFact('f-id', 'Obtain a state identification card'),
      // onboarding REQUIRES the identification card
      dependencyFact('d1', 'f-onboard', 'f-id', 'REQUIRES'),
    ];
    const route = buildRoute(facts);
    expect(route.focusActionId).toBe('f-id');
    expect(route.steps.find(s => s.actionId === 'f-onboard')!.status).toBe(RouteStepStatus.BLOCKED);
  });

  it('GF-007: completing the Focus Action advances focus to the unlocked successor', () => {
    const before = buildRoute(gf001Facts());
    expect(before.focusActionId).toBe('f-id');

    const afterFacts = gf001Facts().map(f =>
      f.id === 'f-id'
        ? actionFact('f-id', 'Obtain a state identification card', 'COMPLETED')
        : f
    );
    const after = buildRoute(afterFacts);
    expect(after.focusActionId).toBe('f-onboard');
    expect(after.steps.find(s => s.actionId === 'f-housing')!.status).toBe(RouteStepStatus.UPCOMING);
  });

  it('GF-002: identification completion makes all three dependent Actions available', () => {
    const facts = [
      actionFact('f-id', 'Obtain a state identification card'),
      actionFact('f-work', 'Complete employment onboarding'),
      actionFact('f-home', 'Submit the housing application'),
      actionFact('f-bank', 'Open a checking account'),
      dependencyFact('d1', 'f-id', 'f-work'),
      dependencyFact('d2', 'f-id', 'f-home'),
      dependencyFact('d3', 'f-id', 'f-bank'),
    ];
    const before = buildRoute(facts);
    const after = buildRoute(
      facts.map(f =>
        f.id === 'f-id'
          ? actionFact('f-id', 'Obtain a state identification card', 'COMPLETED')
          : f
      )
    );

    expect(computeRouteDifference(before, after).newlyAvailable.map(s => s.actionId).sort())
      .toEqual(['f-bank', 'f-home', 'f-work']);
  });

  it('GF-003: transportation loss produces a meaningful deterministic Reroute', () => {
    const before = buildRoute([
      actionFact('f-work', 'Travel to employment onboarding'),
      actionFact('f-call', 'Call your supervision officer'),
    ]);
    const after = buildRoute([
      actionFact('f-transport', 'Restore transportation access'),
      actionFact('f-work', 'Travel to employment onboarding'),
      actionFact('f-call', 'Call your supervision officer'),
      dependencyFact('d-transport', 'f-transport', 'f-work'),
    ]);
    const difference = computeRouteDifference(before, after);

    expect(after.focusActionId).toBe('f-transport');
    expect(difference.newlyBlocked.map(s => s.actionId)).toContain('f-work');
    expect(difference.isMeaningful).toBe(true);
  });

  it('GF-004: a housing blocker keeps the affected Action blocked with an explanation', () => {
    const route = buildRoute([
      actionFact('f-resolve', 'Request a housing denial review'),
      actionFact('f-home', 'Complete the housing application'),
      dependencyFact('d-home', 'f-resolve', 'f-home'),
    ]);
    const housing = route.steps.find(s => s.actionId === 'f-home')!;

    expect(housing.status).toBe(RouteStepStatus.BLOCKED);
    expect(housing.reasonCodes).toContain('BLOCKED_BY_DEPENDENCY');
    expect(housing.explanation).toContain('Request a housing denial review');
  });

  it('GF-005: a mandatory supervision conflict outranks a lower-effort Action', () => {
    const route = buildRoute([
      actionFact('f-shift', 'Resolve the work schedule conflict', 'OPEN', 'desc', {
        mandatoryObligation: true,
        conflictAvoidance: 10,
        effortCost: 10,
      }),
      actionFact('f-optional', 'Complete an optional worksheet', 'OPEN', 'desc', {
        effortCost: 1,
      }),
    ]);

    expect(route.focusActionId).toBe('f-shift');
    expect(route.steps[0].reasonCodes).toContain('MANDATORY_OBLIGATION');
    expect(route.steps[0].reasonCodes).toContain('CONFLICT_AVOIDANCE');
  });

  it('blocks an Action when an active confirmed Constraint makes it infeasible', () => {
    const route = buildRoute([
      actionFact('f-work', 'Travel to employment onboarding'),
      domainFact('f-constraint', 'CONSTRAINT', {
        constraintType: 'TRANSPORTATION',
        description: 'Transportation is not currently available.',
        status: 'ACTIVE',
        targetActionIds: ['f-work'],
      }),
    ]);

    expect(route.status).toBe(RouteStatus.BLOCKED);
    expect(route.focusActionId).toBeUndefined();
    expect(route.steps[0].status).toBe(RouteStepStatus.BLOCKED);
    expect(route.steps[0].blockedBy).toContain('Transportation is not currently available.');
  });

  it('derives Deadline urgency from a confirmed Deadline Fact', () => {
    const route = buildRoute([
      actionFact('f-optional', 'Attend optional orientation'),
      actionFact('f-deadline-action', 'Submit time-sensitive paperwork'),
      domainFact('f-deadline', 'DEADLINE', {
        title: 'Paperwork deadline',
        dueAt: '2026-07-15T12:00:00.000Z',
        severity: 'CRITICAL',
        targetActionId: 'f-deadline-action',
      }),
    ]);

    expect(route.focusActionId).toBe('f-deadline-action');
    expect(route.steps[0].reasonCodes).toContain('CRITICAL_DEADLINE');
  });

  it('turns an unsatisfied hard Requirement with a resolution Action into an ordering dependency', () => {
    const route = buildRoute([
      actionFact('f-resolve', 'Obtain the required document'),
      actionFact('f-submit', 'Submit the application'),
      domainFact('f-requirement', 'REQUIREMENT', {
        description: 'A current identity document is required.',
        status: 'UNSATISFIED',
        hardness: 'HARD',
        targetActionId: 'f-submit',
        resolutionActionId: 'f-resolve',
      }),
    ]);

    expect(route.focusActionId).toBe('f-resolve');
    expect(route.steps.find(step => step.actionId === 'f-submit')?.status)
      .toBe(RouteStepStatus.BLOCKED);
  });

  it('GF-006: an updated critical Deadline deterministically reprioritizes the Action', () => {
    const before = buildRoute([
      actionFact('f-a', 'Submit the application'),
      actionFact('f-b', 'Attend orientation'),
    ]);
    const after = buildRoute([
      actionFact('f-a', 'Submit the application', 'OPEN', 'desc', {
        criticalDeadline: true,
        deadline: '2026-07-15T12:00:00.000Z',
      }),
      actionFact('f-b', 'Attend orientation'),
    ]);

    expect(before.focusActionId).toBe('f-b');
    expect(after.focusActionId).toBe('f-a');
    expect(computeRouteDifference(before, after).focusActionChanged).toBe(true);
    expect(computeRouteDifference(before, after).deadlineChanges).toEqual([
      {
        actionId: 'f-a',
        title: 'Submit the application',
        previousDeadline: undefined,
        newDeadline: '2026-07-15T12:00:00.000Z',
      },
    ]);
  });

  it('GF-008: a Proposed Fact is rejected before it can enter routing', () => {
    const proposed = {
      ...actionFact('f-proposed', 'Unconfirmed Action'),
      status: FactStatus.Proposed,
    };
    expect(() => buildRoute([actionFact('f-confirmed', 'Confirmed Action'), proposed]))
      .toThrow(/non-confirmed/i);
  });

  it('GF-010: all actions completed yields a COMPLETED Route with no focus', () => {
    const facts = [
      actionFact('f-a', 'First step', 'COMPLETED'),
      actionFact('f-b', 'Second step', 'COMPLETED'),
    ];
    const route = buildRoute(facts);
    expect(route.status).toBe(RouteStatus.COMPLETED);
    expect(route.focusActionId).toBeUndefined();
  });

  it('Empty graph yields an EMPTY Route', () => {
    const route = buildRoute([]);
    expect(route.status).toBe(RouteStatus.EMPTY);
    expect(route.steps).toEqual([]);
  });

  it('ONLY_ELIGIBLE_ACTION reason code when a single action is available', () => {
    const route = buildRoute([actionFact('f-a', 'Attend orientation')]);
    const focus = route.steps[0];
    expect(focus.reasonCodes).toContain('ONLY_ELIGIBLE_ACTION');
  });
});

describe('FactLifecycle', () => {
  it('supersedes a Confirmed Fact while preserving the replacement link', () => {
    const current = actionFact('f-old', 'Old Action');
    const replacement = actionFact('f-new', 'Corrected Action');

    const superseded = FactLifecycle.supersede(current, replacement);
    expect(superseded.status).toBe(FactStatus.Superseded);
    expect(superseded.supersededByFactId).toBe('f-new');
  });

  it('expires only a Confirmed Fact', () => {
    const current = actionFact('f-current', 'Time-limited Action');
    expect(FactLifecycle.expire(current).status).toBe(FactStatus.Expired);
    expect(() => FactLifecycle.expire({ ...current, status: FactStatus.Proposed }))
      .toThrow(/confirmed/i);
  });
});

describe('GraphVersion', () => {
  it('rejects hard cycles across ordering dependencies', () => {
    const facts = [
      actionFact('f-a', 'A'),
      actionFact('f-b', 'B'),
      dependencyFact('d1', 'f-a', 'f-b'),
      dependencyFact('d2', 'f-b', 'f-a'),
    ];
    expect(() => new GraphVersion('g', facts)).toThrow(/cycle/i);
  });

  it('rejects non-confirmed facts (ADR-004 trust boundary)', () => {
    const proposed = {
      id: 'f-p',
      payload: { key: 'ACTION', value: { title: 'T', description: '', status: 'OPEN' } },
      status: FactStatus.Proposed,
    } as Fact;
    expect(() => new GraphVersion('g', [proposed])).toThrow(/confirmed/i);
  });

  it('rejects route-affecting facts without provenance', () => {
    const missingProvenance = actionFact('f-a', 'Attend orientation');
    delete missingProvenance.provenance;
    expect(() => new GraphVersion('g', [missingProvenance])).toThrow(/provenance/i);
  });

  it('rejects duplicate Action ids', () => {
    expect(() =>
      new GraphVersion('g', [
        actionFact('f-a', 'Attend orientation'),
        actionFact('f-a', 'Duplicate orientation'),
      ])
    ).toThrow(/duplicate/i);
  });
});

describe('computeRouteDifference', () => {
  it('GF-009: reports focus change, newly available, and completed actions', () => {
    const gf001Facts = [
      actionFact('f-id', 'Obtain a state identification card'),
      actionFact('f-onboard', 'Complete employment onboarding'),
      dependencyFact('d1', 'f-id', 'f-onboard'),
    ];
    const before = buildRoute(gf001Facts);

    const afterFacts = [
      actionFact('f-id', 'Obtain a state identification card', 'COMPLETED'),
      actionFact('f-onboard', 'Complete employment onboarding'),
      dependencyFact('d1', 'f-id', 'f-onboard'),
    ];
    const after = buildRoute(afterFacts);

    const diff = computeRouteDifference(before, after);
    expect(diff.focusActionChanged).toBe(true);
    expect(diff.newlyAvailable.map(s => s.actionId)).toEqual(['f-onboard']);
    expect(diff.completed.map(s => s.actionId)).toEqual(['f-id']);
    expect(diff.newlyBlocked).toEqual([]);
    expect(diff.isMeaningful).toBe(true);
  });

  it('identical before/after routes produce an empty difference', () => {
    const facts = [actionFact('f-a', 'Attend orientation')];
    const diff = computeRouteDifference(buildRoute(facts), buildRoute(facts));
    expect(diff.focusActionChanged).toBe(false);
    expect(diff.newlyAvailable).toEqual([]);
    expect(diff.newlyBlocked).toEqual([]);
    expect(diff.moved).toEqual([]);
    expect(diff.completed).toEqual([]);
    expect(diff.added).toEqual([]);
    expect(diff.removed).toEqual([]);
    expect(diff.isMeaningful).toBe(false);
  });

  it('classifies a newly added actionable step as newly available', () => {
    const before = buildRoute([actionFact('f-a', 'Existing Action')], 'g-before', 's-before');
    const after = buildRoute(
      [actionFact('f-a', 'Existing Action'), actionFact('f-b', 'Newly confirmed Action')],
      'g-after',
      's-after'
    );

    const diff = computeRouteDifference(before, after);
    expect(diff.added.map(s => s.actionId)).toContain('f-b');
    expect(diff.newlyAvailable.map(s => s.actionId)).toContain('f-b');
  });
});
