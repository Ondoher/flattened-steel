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
the global `review-standards` skill after its eligibility gates pass. Keep
monitoring active for the session unless the user suspends it. The skill owns
evaluation timing, readiness evidence, and adviser lifecycle.

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
