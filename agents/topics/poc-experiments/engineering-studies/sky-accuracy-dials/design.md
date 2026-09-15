# Predictable Sky Accuracy Dials Experiment Design

## Objective

Develop predictable atmospheric-scattering accuracy controls judged against
scientific expectations and independent numerical references, with interaction
tests and bounded storage. The
[continuation goals](continuation-goals.md#standard-of-correctness) own the
correctness standard; Kider agreement is a separate observation comparison.

## Acceptance Question

Can independently varied and combined numerical controls predict spectral changes and accuracy trends on unexecuted configurations without relying on cancellation or uncontrolled storage growth?

The first campaign is complete. The [continuation goals](continuation-goals.md)
define the next scientific objective, and the
[continuation execution plan](continuation-plan.md) owns its proposed cases,
criteria and allocations within this experiment's existing boundaries.
The owner has authorized independent execution. The [status](status.md) owns
completed implementation milestones, current work and review evidence.

## Isolation Boundary

Authored experiment implementation, controls and fixtures remain below
`experiments/sky-accuracy-dials/`. The owner explicitly authorizes updating this
experiment's documentation wherever it lives, including its owning topic
documents under `agents/topics/`. That documentation authority does not permit
changes to historical evidence or unrelated work. Generated output remains
below `tmp/experiments/sky-accuracy-dials/`.

Production and other experiment trees remain read-only inputs except for
separately authorized work. The completed
[compiler contract repair](continuation-review-resolution.md) was limited to
comments, ambient declarations and the existing filename compatibility
exception; production executable behavior remains unchanged. Further production
behavior changes or promotion require separate authorization.

## Output and run rules

- `sky-accuracy-dials` is the unnumbered experiment identity.
- The experiment source root is `experiments/sky-accuracy-dials/`. Authored implementation, fixtures, harnesses, runner source, configuration, and dependency manifests belong there.
- The experiment source root owns `jsconfig.json` with `allowJs`, `checkJs`, and `noEmit` enabled. Run its type check after authored code changes and satisfy the repository's required canonical `types.md` review through `review-standards` before reporting an implementation phase complete. A specific experiment may deliberately add standards, checks, or reviewer lanes through its folder mapping and governing instructions; capability use alone does not add them.
- The generated-output root is `tmp/experiments/sky-accuracy-dials/`. Builds, caches, browser profiles, reports, captures, diagnostics, renders, logs, progress records, temporary files, and other generated intermediates belong only there and must remain ignored by Git.
- Derive repository, source, and output roots from the location of a checked-in repository marker rather than `process.cwd()`.
- Real-path-check every read and write boundary. Reject symlinks, junctions, reparse points, and any resolved path outside its declared root.
- Use a new `runs/<sequence>-<name>/` directory for each evidence-bearing execution. `sequence` is exactly five decimal digits followed by `-`; `name` is descriptive kebab-case and is limited to 16 characters, excluding the `#####-` sequence string. Allocate the next sequence within this experiment only, never fill a gap or reuse a sequence, and reject malformed prefixed entries. Never overwrite or reopen a completed run. Copy or derive reused material into the new run and retain its source identity.
- Record the command, inputs, relevant configuration, implementation revision or hashes, tool/runtime versions, environment facts that affect the result, parent artifacts, derivation operation, and resulting artifact identities.
- Finalize a run with an explicit terminal state: `accepted`, `rejected`, `failed`, or `interrupted`. Publish its terminal manifest only after all artifacts are closed and hashed.
- A verifier may read the run it validates but must not mutate it. Corrections and retries create a new run.
- Keep production and other experiment trees read-only during experiment execution unless the engineer explicitly expands the write scope.

## Monitorable progress

Every operation expected to run longer than one minute writes UTF-8 JSON Lines to:

```text
tmp/experiments/sky-accuracy-dials/runs/<sequence>-<name>/progress.jsonl
```

Append one event at process start, every phase transition, at least once every 30 seconds while active, and at terminal completion or failure. Flush each event so another process can tail the file while the operation runs. Each event contains:

```json
{
	"timestamp": "2026-09-04T12:00:00.000Z",
	"phase": "compute",
	"completed": 24,
	"total": 100,
	"message": "Processing sample batch 24 of 100."
}
```

`timestamp`, `phase`, and `message` are always required. Include `completed` and `total` when work is countable. Terminal events additionally include `state` with one of the allowed terminal states. Do not place secrets, credentials, or unnecessary personal data in progress records.

## Storage And Execution Budget

Budget against current disk space only. The owner's copy to another drive
does not release space on C:. Initial observed free space was 50,601,861,120
bytes. Stop starting work below 40 GiB free. Limit this experiment to 512 MiB
of retained evidence and 1 GiB of live scratch; enforce both before expensive
work and before writes. Run one GPU job at a time. Do not use another drive
or delete any previous experiment, production, or historical artifact.

Reproducible bundles, browser profiles, uploads, and intermediate fields belong
under `tmp/experiments/sky-accuracy-dials/scratch/<unique-owner>/`. Scratch is
explicitly excluded from retained evidence. Record its owning run, recipe,
source/input identities, high-water byte count, and cleanup outcome. Cleanup
must verify the resolved absolute target is strictly inside this scratch root,
verify ownership, reject links/junctions throughout the target tree, and occur
after dependent spectra and checks are retained. Never delete a `runs/` path.
Retained failures and prediction failures are evidence and remain immutable.

Compute one wavelength at a time, accumulate pure orders in memory, evaluate
the requested sky rays immediately, and retain compact binary64 spectra.
Four cumulative orders for all 17 x 81 x 40 samples require 1,762,560 bytes.
Do not retain cache packages, full recurrence textures, duplicate per-channel
control documents, films, or full-resolution images. Snapshot the small
authenticated build request, condition geometry, measurement data, and needed
source once; retain derivation links for later runs.

## Scientific Controls

Keep the matched Direct40, ground, atmosphere, collimated source, Z180 solar
grid, anchored numerical policy, and Basic Bruneton physical B1 boundary as
the initial control. Score registered channels 0-30; retain all 40 for final
qualification. Preserve spectral units and exact fitted Sun/observer geometry.
All 17 existing measurements have been seen previously; describe withholding
as prospective intervention validation, never as unseen measurement data.

Use 09:30, 11:15, and 13:30 at channels 0, 8, 16, 24, 30, 39 for inexpensive
screens, keeping all 81 directions. Lock predictions for the remaining times
before full evaluation. Finalists use the complete 17 x 81 x 40 boundary.
Compare numerical convergence separately from Kider agreement. A dial may
predictably improve the numerical solution while worsening Kider RMSE.

Predictions target the spectral change delta first. Given control residual
e = Lcontrol - measured, score predictions use the exact identity
deltaSSE = 2 e dot delta + norm(delta)^2. A predictor may consume earlier
development runs but cannot consume the candidate it predicts or simply run
its full recurrence under another name. Freeze predictions, uncertainty, and
scope before candidate generation; retain misses.

Define a negligible-change floor from unchanged-control repeatability and
reference uncertainty before testing signs. Initial empirical targets are at
least 90% sign agreement above that floor and at most 25% relative vector
prediction error within each declared condition/angular stratum. Explicitly
report unsupported, nonmonotone, and interacting controls. These are empirical
engineering targets, not universal error bounds.

For factors A and B, measure the spectral interaction
IAB = LAB - LA - LB + Lcontrol before considering RMSE. Use full 2 x 2
factorials for selected relationships. Predict interactions explicitly when
the mechanism suggests them; do not infer independence from aggregate scores.

## Hypotheses And Dials

| Factor                            | Initial hypothesis and prospective falsification                                                                                                                                                                                                                                                                                                                     |
| --------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Near-ground altitude nodes        | Refining 48 to 51, 55, then 63 retained-node grids reduces positive N1 reconstruction bias. Losses concentrate in low-altitude view samples. Analytic N1 should remove most of this sensitivity; test the remaining higher-order effect.                                                                                                                             |
| Outgoing directions               | W27 to W39/W51 reduces the angular error of smooth fields, with larger sensitivity near steep lobes. Analytic N1 should remove its own W dependence. Validate spatially and spectrally; nonnested grids need independent-location checks.                                                                                                                            |
| Incoming quadrature               | More and better distributed positive-weight directions reduce phase-weighted integration error. Changing only this factor cannot change J1. Test constant fields and actual sky; never silently renormalize phase values to hide error.                                                                                                                              |
| View integration                  | Qview 30/60/120 changes final radiance while leaving recurrence fields bit-identical. Capture the union of query supports in one recurrence pass, then test convergence and predict correction sizes.                                                                                                                                                                |
| Altitude-aligned view integration | Split each ray at every physical cache altitude knot, then use 1/2/4/8 midpoint substeps per segment. P48 uses 48/96/192/384 actual steps. This removes altitude interpolation derivative jumps from interval interiors; freeze a second-order prediction from two preceding levels before each target. Outgoing-direction reconstruction can still introduce jumps. |
| Source integration                | Qsource 20/40/80 affects direct attenuation and can change every order. Test its coupling to near-ground and grazing paths.                                                                                                                                                                                                                                          |
| Recurrence integration            | Qtransport 40/80/160 leaves pure J1 unchanged but changes later orders. Test interactions with incoming direction count and altitude resolution.                                                                                                                                                                                                                     |
| First-order representation        | Exact phase/local density with direct source transmittance reduces interpolation bias. Separate cached-N1 plus cached-higher-orders from analytic-N1 plus cached-higher-orders to measure cubic grouping effects. Frozen-increment substitutions are diagnostics, not regenerated solutions.                                                                         |
| Density factorization             | Caching separate Rayleigh/Mie lighting coefficients and evaluating physical densities at query altitude may reduce height sensitivity. Requires separate coefficient fields; combined J cannot uniquely recover both. Implement after simpler controls identify value.                                                                                               |
| Solar interpolation               | Current fractional-angle cubic is expected to be small at noon. Test controlled reconstruction changes while preserving Z180 and exact knots; arbitrary solar-grid refinement requires complete experiment-owned coordinate changes.                                                                                                                                 |
| Precision and geometry            | Binary64 reference, stable roots, exact surface height and matched angular frames should bound arithmetic artifacts. Preserve anchored controls and use targeted probes rather than changing geometry alongside sampling.                                                                                                                                            |
| Scattering orders                 | First assess sampling at fixed N4. The observed blue N4 contribution warrants a contained N5/N6 driver with unchanged physical inputs and bit-exact J1-J4 prefix checks. Retain a distinct six-order result schema and use channels 0/8 across all 17 times as an explicitly partial spectral diagnostic. Production remains fixed through J4.                       |
| Atmosphere and observation model  | Keep physical inputs fixed until numerical effects are understood. Any later phase/profile or optical-footprint experiment must be separately identified, with a prediction and no claim that an unknown instrument response has been calibrated.                                                                                                                    |

## Representation And Hardware

Use an experiment-owned generic cubed-sphere geometry/view evaluator and browser
entry around the read-only production compiler where possible. Preserve its
Float32 cumulative addition order and production solar cubic for baseline
parity. Because cubic is nonlinear, interpolation of a sum and sum of
interpolations are different controls. Record each representation explicitly.

For the existing flattened field layout, height is 180P and J width is 6W^2.
The observed texture limit 16,384 permits P <= 91 and odd W <= 51. Preflight
incoming width and both viewport dimensions as well. Estimate live field
memory as 4(180P)(6W^2 + 2I) bytes, plus direction textures and driver/CPU
overhead; dimension fit alone is not memory qualification. Larger grids need
an explicit experiment-owned layout change. Adaptation may not edit production.

## Review Milestone

The initial review unit includes the new experiment source/configuration and
topic scaffold, with baseline
`.codex-tmp/review-standards/session-RFjzF6/baseline.json` captured before writes.
Batch source review when the streaming runner, contracts, and baseline proof
are coherent. Require local type checking plus validated primary and independent
audit evidence for the mapped lanes before claiming implementation completion.
Later scientific executions from unchanged reviewed code do not require repeat
source reviews. Changed mechanisms get a new explicit review unit.

## Development Decisions

The first screening baseline reproduces retained CPU spectra to numerical
roundoff. Its Q30/Q60/Q120 observations falsified a universal second-order
prediction for the reconstructed cache field. Independent continuous first-order
integration follows that scaling much more closely. The altitude-aligned rule
therefore tests a concrete source of nonsmoothness instead of fitting a new
exponent to each response.

First-order density factorization is implemented as a diagnostic: construct
separate analytic Rayleigh/Mie lighting fields, reconstruct them, and apply
physical density at the query point. Retain a split-species grouping/rounding
control and compare with continuous J1 at identical source/view quadrature.
Substituting it into C4-C1 freezes later increments and must be labelled as
such. This does not implement higher-order coefficient fields or qualify a
fully regenerated factorized solver.

Source 20/40/80 and transport 40/80/160 pass the locked second-order model in
the screening and fourteen-condition prospective validation scopes. Segmented
1/2/4 misses the near-Sun magnitude gate; the unchanged model passes at 2/4/8.
The source-by-transport additive prediction passes, while incoming-by-transport
does not. The finer I128/I512/I2048 directional test retains another prediction
failure. No failed gate was relaxed or replaced with an aggregate-only check.

Complete source/transport-by-first-order-representation contrasts distinguish
actual spectral interaction from changed baseline residual alignment. Spatial
attribution retains all registered point errors and a grid-index noon figure.
The six-order diagnostics stay in a separate partial spectral schema. The
[scientific results](results.md) own all numerical outcomes and qualification
limits; the consolidated scorecard retains complete selectors and derivations.

Display color conversion is outside the scored spectral boundary. The B1
scorer consumes spectral radiance before RGB conversion or display mapping;
an app color change cannot explain a difference in these retained spectral
scores. No application color or strobing implementation is changed here.
