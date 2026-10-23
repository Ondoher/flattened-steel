# Bootstrap Entry Warning

An ordinary repository session that reaches this file without an established
bootstrap lifecycle must run `$bootstrap` before continuing. Do not redirect an
active `$bootstrap`, `$review-standards`, `$normalize-standards`, or equivalent
self-loading workflow; each follows its own entry contract. After context
compaction, a known initialized session follows `active-topic.md` and its
`Minimal Reload Sources`. If prior initialization cannot be established, run
`$bootstrap`.

# Checkpoint Adviser

During repository bootstrap, activate `checkpoint-advisor` monitoring through
the global `review-standards` skill independently of standards-review eligibility. Keep
monitoring active for the session unless the user suspends it. The skill owns
evaluation timing, readiness evidence, and adviser lifecycle.

# Operational restrictions

Owner-directed updates must not be blocked by arbitrary qualification allow-lists,
previously accepted profile hashes, fixed resource budgets, elapsed-time budgets,
or administrative review readiness. Retain a blocking restriction only when it
prevents a concrete operational failure, invalid physical/numerical input, incompatible
format or ownership, corrupted data, or unsafe allocation supported by actual device
capabilities. Explain the specific failure it prevents. Measurements, independent
comparisons, resource estimates and review limitations belong in reports; they do
not independently prohibit an authorized update. This owner directive supersedes
review-readiness or administrative completion gates as update vetoes; continue to
report missing review evidence honestly and never claim unearned compliance.
Preserve prior evidence and perform
appropriate verification without turning its historical identities into an allow-list.

# Contained Experiment Verification

All existing and future contained experiments run without dedicated standards
reviewers or independent review audits. This covers experiment source, controls,
owning topic documents, and experiment lifecycle/verification workflow changes.
Do not start or refresh reviewer agents for this work during bootstrap, topic
refresh, implementation, or handoff. Reviewer readiness, calibration, review
requests, and compliance ledgers are not experiment completion gates. Do not
claim a standards-compliance result merely because review is disabled.

Keep checkpoint-advisor monitoring active. The primary agent owns self-review,
local type checking after authored code changes, and the scientific, visual,
performance, and immutable-evidence checks required by the experiment's design
and plan. Retain the folder-mapped standards, including `types.md`, as authoring
and self-review guidance; those mappings do not enable experiment reviewers.

This owner-directed repository policy supersedes older experiment-local
instructions or workflow text requiring reviewers. Preserve all historical
review evidence and sealed runs. Production work and promotion use their
destination folder standards and normal reviewer lifecycle.

# Experiment Lifecycle Handoff

Use the repository [end-experiment skill](.agents/skills/end-experiment/SKILL.md)
when the owner ends or suspends an experiment. Ending records a final
disposition; suspension preserves a resumption boundary and requires a later
owner selection before execution resumes. Both preserve immutable evidence and
restore identified temporary standards configuration according to the
[folder-scoped lifetime rule](agents/topics/standards/overlay.md#add-temporary-experiment-standards-lifetime).
Keep the permanent experiment mapping. Returning to production uses production
folder standards and refreshes reviewer context before implementation.

# Review Timing

The review timing below applies to work where reviewers are enabled. Contained
experiments follow the verification policy above.

Batch standards review at stable, coherent implementation milestones. The
primary agent owns day-to-day reasoning, self-review, and local checks; do not
request a standards pass after each edit, diagnostic run, or candidate tweak.
Resolve obvious issues and stabilize the intended code before requesting the
required primary review and independent audit.

Declare each review unit and capture its baseline before work begins. Adjacent
plan phases that develop the same code may share one review milestone, but
keep their implementation-completion gates open until that review validates.
Use an early, narrowly scoped consultation only when an unresolved contract or
ownership decision could cause substantial rework; consultation does not count
as completed standards review.

Before rerunning a review, identify what invalidated the existing evidence:
reviewed source, relevant collaborators, contracts, standards, mappings, or
governing context. Reuse evidence only while its original request remains
valid under the evidence-ledger verifier. Never relabel an old report with a
new fingerprint or omit obligations from a new request. Review affected lanes
and the complete mapped inventory for the required unit, including relevant
unchanged collaborators, without automatically expanding to the whole
experiment or repository.

Readiness refresh is distinct from source review. A routine progress update,
an additional render from unchanged code, or a repeated successful check does
not itself call for another source review; assess evidence freshness before
any compliance claim. Final handoff validates applicable evidence and requests
fresh review only where required. Checkpoint evaluation retains its separate
whole-repository scope and suppresses duplicate advice for unchanged state.

# Topic Bootstrap

At the start of a session, read only
[Active Topic](agents/topics/active-topic.md).

After context compaction or an interrupted or resumed session, reload the
active-topic file before continuing. Load only the files listed under its
`Minimal Reload Sources` section, in order. If that section does not exist,
fall back to `Reload Sources`.

Do not load the topic index, routing table, standards, archives, source code,
or adjacent topic documents during bootstrap unless the active task requires
them. Open [Topic Routing](agents/topics/context/routing.md) only when the
current route is insufficient.

After loading the active topic and its minimal reload sources, announce the
topic and the focus stated by its entry document.

## Retired Algorithm32-Star Evidence

Preserve all historical Algorithm32-Star evidence. Do not discard, overwrite,
or modify a Star fixture, policy, provenance record, harness, command, gate,
archive copy, or generated historical result. Star material may be inspected
read-only and used as comparison evidence. Contained experiments may reproduce
or test behavior informed by that evidence provided they do not alter the
historical material.

The project-owner-directed pre-color-reset archive relocation is the sole
working-copy exception. A historical working-tree or generated-output copy may
be removed from its former directory only after its exact repository-relative
contents are present in an accessible ZIP below `archives/`, the ZIP has passed
complete entry/hash verification, and the archive-set index records its source
and restoration path. The verified archive then becomes the immutable evidence
copy and must never be modified, replaced, or deleted. This exception permits
relocation, not disposal or content changes, and does not apply to the active
color-reset lane or an operational asset that still requires a live extracted
copy.

## Contained Experiment And Production Promotion Boundaries

The completed stellar screen-palette and Color Reset experiments remain
contained under their established roots. Their tracked implementation and
control surface remains under:

```text
experiments/extraterrestrial/
```

Their generated execution and qualification output remains under the ignored
legacy root:

```text
tmp/extraterrestrial/
```

Run allocation, naming, initialization, finalization, and immutability are
owned by the
[extraterrestrial run contract](experiments/extraterrestrial/run-contract.md#immutable-run-records).

Create each new side experiment through the repository `start-experiment`
skill. Its experiment-local instructions and design own that lane's exact
source, output, progress, and immutable-run boundaries. The standard scaffold
uses `experiments/<slug>/` for tracked source and
`tmp/experiments/<slug>/` for ignored generated output. Creating a new lane
does not reopen, relocate, or grant write access to an existing experiment,
sealed run, archive, production tree, or external repository.

The completed `production-algorithm32` promotion was an authorized production
lane. The
[completed-plan archive index](agents/topics/context/completed-production-plan-archive-index.md)
records its retired P0-P9 plans and current design, qualification, and MVP
successors. Production implementation, contract, configuration, fixture, test,
application, and documentation surfaces under `src/algorithm32`, `src/flat32`,
and their ordinary repository-owned supporting paths remain governed by those
current owners. Experimental algorithms must be adapted to existing production
architecture and repository coding standards before promotion.

Do not create or run an experimental unit-test tree, suite, file, or
test-framework dependency. Use focused self-verifying proof runners for
immutable run evidence.

Generated output remains below its experiment's declared ignored output root
and may be reused by later contained experiments as data, cache content,
configuration, fixtures, comparison evidence, or oracle input. The sole reuse
restriction is preservation of prior evidence: never modify, overwrite,
discard, or reopen the source run or its artifacts. Apart from the verified
archive relocation defined above, copy or derive new material into a new run.
Consumers should
record source run, artifact, schema, provenance, and compatibility identities
needed to support their claims. Every evidence artifact must also retain how it
was derived: its parent inputs, the operation or equation applied,
implementation and tool identities, material parameters, and resulting
artifact identity. This derivation record qualifies the evidence rather than
granting permission to reuse it. A post-run verifier may also inspect the
output it is validating. Runners must real-path-check both source/control
and output destinations, reject symlinks and junctions, and derive the roots
from repository identity rather than the process working directory.

For avoidance of doubt, generated output **may** be used as a later contained
experiment's implementation input, configuration input, fixture, cache,
comparison source, or oracle input. Such reuse is not prohibited merely because
the material was generated by an earlier run. The mandatory conditions are
that the earlier run and its artifacts remain immutable, every derivative is
written into a new run, and the new evidence retains the complete derivation
chain described above.

The sealed experimental baseline, candidate, historical runs, and archived
evidence remain immutable. Production promotion may read and adapt them but
must never alter or reopen them and must not import a contained experiment at
runtime. `C:\dev\poly-gc-react` remains a read-only comparison surface and may
not become a runtime dependency.

For contained experiment work, implementation and generated-output writes
remain restricted to the source and output roots declared by that experiment's
local instructions and design. For the active production promotion, ordinary
production source, test, fixture, application, asset, and topic-document writes
are allowed when required by the approved plan. Generated qualification output
must remain in an ignored plan-owned output root and must preserve any parent
evidence. Stop and obtain explicit authorization only when a requested change
falls outside both the selected contained-experiment boundary and the active
production plan, would alter protected evidence, or would write to an external
repository.

## Switching Topics

When work changes to another topic, update
[Active Topic](agents/topics/active-topic.md) with:

- the new topic id;
- its canonical entry document; and
- the smallest useful minimal reload set.

Add extra reload sources only when they are necessary for continuity. Prefer
focused documents over directories or broad indexes.

## Topic Continuity

- Current-state, routing, design, and status documents must describe the
  present state. Replace stale facts instead of appending a running narrative.
- Put chronology only in a designated log or a clearly marked archive. A plan
  may retain completed history as checked work items.
- After a design decision, update the owning design and status documents.
- After an implementation step, update the owning status document with what
  changed, what was verified, and what remains.
- When the user says `checkpoint`, refresh the relevant current-state
  documents before finishing.
- Keep one canonical owner for each fact. Other documents should link to that
  owner instead of maintaining duplicate copies.
- Archived material is evidence or history, not current guidance.

Topics folder: agents/topics
