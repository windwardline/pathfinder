# Pathfinder User Validation Plan

**Version:** 1.0  
**Status:** Canonical Research Document

## Purpose

This document defines how the hypotheses in [Validation Strategy](validation.md)
would be evaluated with participants. It specifies phase structure, participant
protections, measures, and the results that would halt or redirect the work.

[Validation Strategy](validation.md) defines what must be validated.
[Release 1 Validation Study](release-1-validation-study.md) holds the
de-identified evidence record. This document defines the field protocol that
would produce that record.

Pathfinder produces a Reentry Route: what comes next, why it comes next, and
what it unlocks. Routing is deterministic, only Confirmed Facts affect it, and
every route-affecting fact carries provenance. Automated tests verify those
properties. They do not establish that a person reading a Route can tell what to
do next.

The study covers four phases across approximately four weeks and about twenty
sessions, with development time scheduled between phases so that each round of
research revises the product before the following round begins.

## Operating Conditions

Three conditions constrain every decision in this plan. All three are stated up
front.

**One person.** Pathfinder has a single developer, who would also recruit
participants, facilitate every session, take the notes, analyze the results, and
decide what changes. Every role that a funded study would separate is held by
the same person. There is no second reader, no independent facilitator, and no
practitioner on the team. The design compensates where it can and records the
exposure where it cannot.

**No funding.** Participants are not paid. Sessions are short, recruitment
depends on organizations willing to host, and sample size is bounded by what one
unpaid researcher can ask of people who are also not being paid.

**Remote delivery.** All contact is remote. Recruiting and scheduling run by
email through the partner organization. Sessions run on Zoom or Google Meet.
Phases that put the product in front of a participant require a screen and a
connection stable enough to share it. This is the condition with the largest
effect on who can take part, and Limits examines it directly.

Accommodations are made where a participant needs them, including a phone
session for the phase that shows no product, a scheduled call to walk through
consent, and timing set around supervision and work obligations. Validating a
web application still requires a participant to use one, so accommodation can
widen access to parts of the study but cannot remove the device requirement from
all of it.

None of the three conditions is presented as acceptable. All three are the
actual conditions, and a plan that assumed otherwise would not be executable.

## Status

No participant sessions have been conducted. No comprehension, trust, or
outcome claim about Pathfinder rests on human evidence. This plan is written and
held in reserve; it does not authorize any claim until sessions occur and are
recorded in [Release 1 Validation Study](release-1-validation-study.md).

## Structural Decisions

**Friction before solutions.** No product is shown in Phase 1. The sequencing
problem needs to be described by people who have experienced it before a
proposed route through it can be evaluated. Presenting an interface first
produces reactions to the interface and loses the sequence data the product
depends on.

**The protocol is organized around participant circumstances rather than
researcher convenience.** Participants are under supervision, have limited time
and money, and have been assessed repeatedly by institutions that described the
process as evaluation. A protocol that does not account for this will collect
polite responses and little else.

## Design Considerations Specific to This Population

The practices below are standard qualitative research practice adjusted for a
population whose prior experience of being studied has generally not been
voluntary.

**Terminology and framing.** Participants have been assessed, scored,
classified, and monitored by systems that used the vocabulary of research and
evaluation. The opening of each session has to distinguish this work from that
experience. Without it, the remainder of the session produces guarded answers.

**Offense history is never requested.** The protocol does not ask what a
participant was convicted of, in any form, at any point. Neither the product nor
the research requires it. Omitting the question also communicates something
useful to the participant about the purpose of the session.

**Questions address institutions rather than individuals.** "What did the parole
office require in your first week" asks about an institution. "What was hardest
for you" asks a participant to characterize their own difficulty for a stranger.
The first produces more usable data at lower cost to the participant.

**Friction is described as a system defect.** A participant who could not obtain
identification because the application required a document that itself required
the identification has described a defect in a public process. Stating it that
way is accurate, and it affects what the participant is willing to describe
next.

**Scarcity is assumed.** Time, money, transportation, phone data, a private
space, a working device, and a connection good enough for video are all
constrained. Any design that assumes otherwise excludes the participants whose
input is most needed.

**Sessions close on agency.** The final question asks what the participant would
change, or what they would tell someone released next week. Sessions do not end
on the most difficult material raised.

**No performed empathy.** Participants in this population identify performed
sympathy quickly, and it costs credibility that is difficult to recover.
Sessions stay brief, useful, and accurate about their purpose.

## Participant Protections

### Recruitment and consent

- Recruitment runs through partner reentry organizations only. No cold outreach
  and no public postings. The introducing organization's existing relationship
  is the only credential the facilitator has.
- Scheduling runs by email through the organization. A participant is never
  required to hold an ongoing email thread with the researcher to take part.
- Participation is decoupled from services. It changes nothing a participant
  receives, and declining costs them nothing. This is stated in the recruiting
  message and again at the start of the session. Any perceived connection
  between participating and being served is coercive regardless of intent.
- Consent is in plain language, read aloud at the start of the session, with a
  written copy sent in advance. The right to skip any question without
  explanation is stated at the start and again at the midpoint.
- Pathfinder is introduced as a prototype, and described explicitly as not legal
  advice, not a risk score, and not connected to supervision. This follows the
  unsupported-use boundaries in [Safety Specification](../04-risk/safety.md).
- Cameras are optional. A participant may take part with video off, and this is
  said before the session so that nobody has to ask.

### Unpaid participation

Participants are not compensated, which is binding on what the protocol may ask.

- Sessions are capped at 30 minutes.
- Remote delivery removes travel time and cost, which is the one way this design
  reduces the burden it places on unpaid participants.
- Nothing is asked that would be worth asking only if someone were being paid to
  answer it. Where a question serves the researcher more than the protocol, it
  is cut.
- Six participants per phase. Sample size is set by what can be asked of unpaid
  volunteers and by what one facilitator can run well, not by saturation.

Participant payment is the first thing added if funding becomes available.

### Data

- Participant codes only, such as `P01`. No names, case identifiers,
  supervision details, or document contents. This follows the rule already
  recorded in [Release 1 Validation Study](release-1-validation-study.md).
- No session recording. Zoom and Google Meet recording stays off, and the
  participant is told so at the start. Notes are written immediately after each
  session rather than during it, so that a single facilitator can attend to the
  participant instead of to a notepad. This costs fidelity and is recorded as a
  limitation.
- Scheduling email is deleted on the same schedule as the research material and
  is never joined to session observations.
- All working research material carries a deletion date set before the study
  begins.
- No material collected in research enters the product database.
- Where the research question permits, reactions are collected against the
  seeded fictional scenarios SD-001 through SD-010 defined in
  [Seeded Demonstration Scenarios](../09-testing/seeded-demonstration-scenarios.md).
  Phase 1 is the exception, and its questions address institutions rather than
  individual cases.

Participants are under supervision, which means records concerning them may be
of interest to parties they did not consent to. The protocol is designed so that
little exists to produce. The governing rule is to avoid collecting material
that would have to be surrendered on request.

### During and after the session

- When material becomes difficult, the facilitator names it, offers a pause, and
  takes the pause. The protocol yields to the participant.
- A dropped connection ends the session at the participant's discretion. Nothing
  is rescheduled by default and no follow-up is sent unless the participant asks
  for one.
- Sessions are scheduled around supervision appointments and work.
- Each session ends with a referral list, sent by email and read aloud on
  request, so that a need surfaced during the session does not go unaddressed.

## Phases

Development time is scheduled between phases so that each phase evaluates a
product revised in response to the one before it.

### Phase 0. Protocol review

*Days 1 to 3. External review where available.*

The protocol is reviewed before use by whoever the partner organization can
spare, and by preference someone with lived experience of reentry. This is a
request, not a resource the study controls. Where no reviewer is available, the
protocol is checked against the written criteria below and the absence of
external review is recorded as a limitation of the study.

- Does any question require a participant to disclose case information?
- Does any question ask a participant to characterize their own difficulty?
- Can the consent script be read aloud in under two minutes?
- Does any item assume a device, a private space, a fixed address, or a stable
  connection?
- Does any question serve the researcher more than the protocol?

A written self-check is weaker than review by the people a product serves. It is
what a single unfunded researcher can guarantee, and the gap between the two is
stated plainly.

**Output:** revised question set, final consent script, recruitment confirmed
through partner organizations, and a record of whether external review occurred.

### Phase 1. Friction mapping

*Week 1. Six sessions. No product shown. Phone or video.*

The phase establishes the actual sequence of the first ninety days after release
and the points at which it breaks, including which barriers create downstream
dependencies and which actions unlock the most subsequent progress. These are
research questions 1 and 2 in [Problem Space](problem-space.md).

Because no product is shown, this phase runs by phone for any participant who
prefers it or who has no reliable video connection. It is the only phase that
does not require a screen, and it is therefore the phase whose sample can come
closest to the population the product is built for.

Questions address institutions and order: what had to happen first, what was
required to do it, what happened when it failed, who provided the next
instruction, and what was learned too late to act on.

**Output:** a friction inventory ranked by frequency against cost, where cost is
measured in days lost, money spent, and exposure to a supervision violation. A
first-thirty-days map. A record of which participants could join by video, for
comparison against the Phase 2 and Phase 3 samples.

### Build gap A

*Days 8 to 10.*

Top frictions are converted into Dependency Graph revisions and candidate Route
sequences. Expected results for Phase 2 are recorded in writing before it
begins, including which Focus Action the evidence implies and what participants
are expected to say. With no second analyst, a written prediction made in
advance is the only available check on the facilitator reading his own
expectations into the results.

### Phase 2. Solution reaction

*Week 2. Six sessions. Video with screen share. Low fidelity.*

Phase 1 participants who are willing return, together with two or three new
participants to control for familiarity. Two or three proposed Route treatments
are presented as rough artifacts on a shared screen. Rough artifacts attract
criticism that finished screens do not.

The measure is comprehension. Participants describe, in their own words, what
the product is instructing them to do next and why. They are not asked whether
they like it.

- Can the participant state the next action and its reason without coaching?
- Does the participant believe the stated unlock? A correct explanation that is
  not believed produces no behavior.
- Does the distinction between Confirmed and Proposed survive plain-language
  explanation, specifically that something the system has recorded but not
  confirmed has not changed the Route?

Artifacts are also sent as images before the session, so that a participant on a
poor connection can follow the discussion without depending on screen share.

**Output:** comprehension results against H1, a selected Route treatment, and a
list of every string that failed, quoted verbatim.

### Build gap B

*Days 15 to 18.*

The selected treatment is built. Every explanation template that failed
comprehension is rewritten, and a reading-level pass is run across all of them.

### Phase 3. Task-based usability

*Week 3. Six sessions. Video with participant screen share. Working build.*

The participant opens the build on their own device and shares their screen.
Participants complete tasks. No walkthrough is given. Identify what comes next.
State why. Complete the Focus Action and describe what changed. Name one thing
it unlocked. Incorporate a stated change in circumstances into the Route.

- Unassisted completion rate, time to first useful answer, and points of
  hesitation.
- Vocabulary that breaks comprehension, recorded verbatim.
- Trust probe. "What do you think happens to what you just entered, and who can
  see it?" A participant who believes a supervising officer can read their
  entries will behave accordingly, whatever the privacy policy states.

Each participant is asked at the start what device they would normally use for
something like this, and the answer is recorded against the session, because it
will often differ from the device they joined on.

Screen share shows navigation, hesitation, task completion, and the words a
participant uses. It does not show the physical device, the hand, the
surroundings, or whether a control was missed instead of deliberately skipped.
Accessibility findings from these sessions are partial: the screen reader pass,
contrast checks, and touch target measurements are run by the researcher against
the build directly, and what a participant's own assistive configuration does is
visible only to the extent they describe it.

**Output:** task completion data, partial accessibility findings, the recorded
gap between joining device and habitual device, and the gap between the actual
trust model and the assumed one.

### Phase 4. Confirmation

*Week 4. Three returning participants. Practitioner conversations where
available.*

**Participant confirmation.** Three Phase 1 participants are re-contacted, shown
what changed as a result of their input, and asked whether the change addresses
what they raised. This closes the loop with the people who provided the input.
With no independent analyst, it is also the strongest validity check the study
has, because it puts the researcher's interpretation back in front of the person
who supplied the material.

**Practitioner input.** Case managers and reentry coaches at the partner
organization see across many cases and can identify where a sample of six is
unrepresentative. Their time is donated and cannot be assumed. Where it is
given, it contextualizes participant evidence and does not override it. Where it
is not, the sample stands unqualified and that is stated in the results.

**Output:** results against the H1 to H4 gates, a decision log, and a written
statement of what the study could not determine.

## Schedule

| When | Phase | Sessions | Delivery | Output |
|---|---|---|---|---|
| Days 1 to 3 | Protocol review | External review where available | Email | Final consent script, revised questions |
| Week 1 | Friction mapping | Six | Phone or video | Ranked friction inventory, 30-day map |
| Days 8 to 10 | Build gap A | None | None | Graph revisions, recorded predictions |
| Week 2 | Solution reaction | Six | Video, facilitator screen share | Comprehension results, selected treatment |
| Days 15 to 18 | Build gap B | None | None | Working build, rewritten copy |
| Week 3 | Task usability | Six | Video, participant screen share | Completion data, partial accessibility findings |
| Week 4 | Confirmation | Three, plus practitioner time if offered | Phone or video | Synthesis, decision log, stated limits |

## Measures

The hypotheses and gates below are defined in
[Validation Strategy](validation.md) and
[Release 1 Validation Study](release-1-validation-study.md). This plan assigns
each to a phase and a method.

| ID | Hypothesis | Tested in | Gate |
|---|---|---|---|
| H1 | Route comprehension. Users correctly identify what comes next and explain why it comes next after viewing a Route. | Phase 2, Phase 3 | At least 80% identify the Focus Action without coaching, and 80% correctly explain its reason and one unlock |
| H2 | Reroute comprehension. Users understand how a confirmed change alters their Route. | Phase 3 | At least 80% correctly interpret the Reroute |
| H3 | Trust. Confirmed Facts and provenance increase user confidence in recommendations. | Phase 2, Phase 3 | At least 80% understand that a Proposed Fact has no routing effect. Any trust claim cites the observed sample size and uncertainty |
| H4 | Cognitive load. The Adaptive Route View reduces perceived complexity compared with an equivalent checklist. | Phase 3 | No worse task accuracy than the equivalent checklist |
| H5 | Determinism. Identical routing inputs always produce identical Routes. | Automated tests | Not a participant question. Fixture, regression, metamorphic, and adversarial tests |

At six participants per phase, an 80% gate means five of six. One response moves
the observed rate by seventeen points, so these gates are coarse instruments.
They are useful for detecting a copy failure and useless for detecting a small
effect. Results are reported with the count, never as a percentage alone.

Every result carries the delivery method and the participant's stated habitual
device. A completion rate observed on a laptop over broadband is not evidence
about the same task on a phone over cellular data.

H5 is included to mark a boundary. Automated verification is not human
validation, and passing test suites support no claim about comprehension or
trust.

## Stop Conditions

The following results would halt or redirect the study. They are set in advance.

- **Fewer than five of six participants restate the next step correctly.** The
  explanation copy has failed. It is rewritten before Phase 3, and not carried
  forward on the assumption that it improves.
- **Participants explain the Route but do not believe the stated unlock.** The
  issue is credibility rather than comprehension, and interface changes will not
  address it. Work returns to content and provenance.
- **The Confirmed and Proposed distinction does not survive plain-language
  explanation.** The trust model is not visible to the people it protects, which
  calls for redesign. Revised copy will not reach it.
- **Phase 1 indicates that sequencing is not the binding constraint.** If
  participants already know the order and cannot act on it, the Route-first
  premise does not hold for this population, and that result takes precedence
  over the roadmap.
- **Fewer than four Phase 1 participants can join a video session.** The Phase 2
  and Phase 3 samples would then describe a different population from the one
  that produced the friction data, and the study is redesigned around in-person
  access before it continues.

The fourth condition is the reason Phase 1 shows no product. A study designed
only to improve an existing answer cannot determine that the question itself was
wrong.

## Limits of This Design

- **One person holds every role.** The developer designs the product, writes the
  protocol, recruits, facilitates, records the observations, analyzes them, and
  decides what changes. No step is independently checked. This is the largest
  threat to the validity of anything the study produces. It is reduced by
  scripted questions, comprehension-based measures instead of preference,
  predictions recorded before each phase, verbatim quotation instead of
  paraphrase, and participant confirmation in Phase 4. It is not removed. An
  independent facilitator would be the single highest-value addition to this
  design.
- **The study is remote, and validating a web application requires a device.**
  Phases 2 and 3 need a screen, a browser, and a connection stable enough to
  share it. That requirement selects for participants who already have a working
  computer or a good phone, reliable internet, an email address, and a private
  place to sit for half an hour. Those are the people least representative of
  the population Pathfinder is built for. Phase 1 runs by phone and partly
  offsets this, which means the friction data and the solution data may come
  from meaningfully different samples. Any comparison across phases has to state
  that.
- **Remote observation is partial.** Screen share does not show the device, the
  hand, or the room. Task completion observed on a laptop over broadband will
  overstate performance on a phone over cellular data, which is the condition
  the product will actually meet. Mobile and low-bandwidth behavior is not
  validated by this design and needs separate verification.
- **Accessibility findings are incomplete.** Screen reader, contrast, and touch
  target checks are run by the researcher against the build. A participant's own
  assistive setup is visible only through description, so this study cannot
  claim the product works for people who rely on it.
- **Participants are not compensated.** This narrows what can be asked, shortens
  every session, and biases the sample toward people with enough slack to
  volunteer time they will not be paid for.
- **Six participants per phase.** Results are directional, not statistical. The
  gates are coarse at this sample size, and no significance claim follows from
  them.
- **External protocol review is not guaranteed.** Where the partner organization
  cannot spare a reviewer, the protocol is self-checked, which is weaker in
  exactly the way this population has most reason to care about.
- **Notes are written after each session.** A single
  facilitator cannot both attend to a participant and record accurately. Detail
  is lost, and quotations are reconstructed unless the participant is quoted
  verbatim at the time.
- **Recruitment through partner organizations skews the sample** toward
  participants already connected to services. The most isolated are least likely
  to appear, and are likely to have the highest need.
- **One month measures comprehension, not outcomes.** Whether a Route changes
  what a participant does requires longitudinal work outside this design.

## Traceability

Supports:

- [Validation Strategy](validation.md)
- [Release 1 Validation Study](release-1-validation-study.md)
- [Problem Space](problem-space.md)
- [Safety Specification](../04-risk/safety.md)
- [Seeded Demonstration Scenarios](../09-testing/seeded-demonstration-scenarios.md)
- [Glossary](../00-governance/glossary.md)

## Definition of Done

This plan is complete when every hypothesis in
[Validation Strategy](validation.md) has an assigned phase, method, and gate;
participant protections are specified before recruitment begins; stop conditions
are recorded in advance of the first session; and the limits of the design,
including those created by running it alone, without funding, and at a distance,
are stated without qualification.
