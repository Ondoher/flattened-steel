# Sky Cache Angular Quadrature Experiment Design

## Objective And Acceptance Question

Improve incoming angular integration in distant-Sun cache construction, propagate
the resulting changes through four scattering orders, and meet or improve the
paper RMSE scores. Use matched libRadtran to qualify isolated calculations and
identify compensating errors that limit the full cache's benchmark performance.

Acceptance question: can a qualified positive-weight incoming rule remove the
measured aerosol integration deficit and match or improve the full-cache paper
RMSE scores while preserving the runtime lookup representation and final cache
grid at a measured construction cost?

## Isolation Boundary

Authored source and controls belong to `experiments/sky-angular-quadrature/`; generated evidence and owned scratch belong to `tmp/experiments/sky-angular-quadrature/`. This topic owns the experiment documentation. Production, archives, and all other experiment trees are read-only inputs. Reused evidence must retain its immutable parent identity and complete derivation chain. No production promotion or new dependency installation is selected.

## Evidence And Hypotheses

The parent [H33 results](../sky-accuracy-dials/horizon-second-order-results.md) own
the observed phase-mass loss, species cancellation and qualifications. Qualified
data are in accepted `00276-h33-recover-r2` and `00274-h33-phase-r2` below the old
experiment's output root. Failed 00272, superseded 00273 and interrupted 00275
remain part of that derivation chain. The
[suspension record](../sky-accuracy-dials/suspension.md) owns the old lane's boundary.
Reuse is read-only and must verify seals, artifact hashes, schemas, material,
geometry and source identities. Every derivative belongs to a new run in the new
lane with parent identities, operation/equation, parameters, tools and output hash.

Prospective hypotheses:

1. Better incoming sampling removes direction-dependent Mie phase-mass loss and
   reduces pure-P2 source error on independent physical fields. A normalized
   constant-field result alone does not qualify a directional incoming field.
2. Corrected angular integration changes J2 and its J3/J4 descendants while J1 at
   fixed outgoing nodes remains unchanged within measured precision allowance.
3. A real numerical improvement may initially worsen aggregate agreement where
   another calculation compensates for the angular bias. Signed spectra and
   species/order/spatial attribution will identify such cases.
4. The same outgoing/altitude/solar/spectral storage grid can retain the corrected
   cumulative source. Additional cost falls mainly on construction and transient
   incoming fields; measure both instead of assuming affordability.

H33's Native15, San Jose, black-ground P2 probes do not establish a full-paper
score or a common local-Sun defect. Current app N4 brightness excess and the P2
source deficit are different quantities; compensation must be measured at matched
positions, orders, directions and wavelengths before assigning causality.

## Frozen Architecture And Physical Controls

Change incoming quadrature as one construction control. Keep the selected final
altitude/solar/outgoing/spectral grid, cumulative stored quantity, reconstruction,
view integration, paper atmosphere and source fixed for the initial comparison.
Record each exact selected grid and backend rather than assuming every retained
fixture uses the same W count, ground or observer height. Construction may retain
Rayleigh/Mie histories separately for diagnosis and combine them into the existing
final representation. Two runtime caches are not required by this hypothesis.

The existing domain selection separates incoming radiance sampling from outgoing
storage. Audit physical frame transforms, solid-angle weights, phase evaluation,
geometry visibility and CPU/GPU selection before changing the domain. A larger
vector inventory is not sufficient if a compiler path hardcodes the old domain.
Use a new construction/profile identity so old packages cannot be mistaken for
newly built data. Prior packages and archives remain immutable.

Use the paper material and the two distinct acceptance/diagnostic criteria in the
[reference metric owner](../sky-accuracy-dials/reference-model-target.md#current-accuracy-metric).
Authenticate absorption/ozone, ground, solar spectrum, geometry, order scope,
spectral bins and units. Keep the application horizon witness distinct from the
paper benchmark. Full-cache paper RMSE against its original measurement reference
is the adoption gate; require no regression against the matched current baseline and matching or improving the selected Bruneton aggregate. Per-time regressions remain visible; isolated libRadtran agreement is a correctness diagnostic.

Runtime evaluation remains a bounded lookup at each outer view-ray sample. The
initial candidate preserves final payload dimensions and lookup arithmetic;
verify actual final byte size and sampled lookup cost. Numerical angular work
belongs to precomputation. Preserve physical phase functions; the measured
65-66% integral is a diagnostic, not a global brightness correction.

## Output and run rules

- `<experiment-folder>` is the unnumbered `<slug>` identity defined by the skill's [folder-identity contract](../../../../../.agents/skills/start-experiment/SKILL.md#folder-identity).
- The experiment source root is `experiments/<experiment-folder>/`. Authored implementation, fixtures, harnesses, runner source, configuration, and dependency manifests belong there.
- The experiment source root owns `jsconfig.json` with `allowJs`, `checkJs`, and `noEmit` enabled. Run its type check after authored code changes and satisfy the repository's required canonical `types.md` review through `review-standards` before reporting an implementation phase complete. A specific experiment may deliberately add standards, checks, or reviewer lanes through its folder mapping and governing instructions; capability use alone does not add them.
- The generated-output root is `tmp/experiments/<experiment-folder>/`. Builds, caches, browser profiles, reports, captures, diagnostics, renders, logs, progress records, temporary files, and other generated intermediates belong only there and must remain ignored by Git.
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
tmp/experiments/<experiment-folder>/runs/<sequence>-<name>/progress.jsonl
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

## Reviewable Visual Progress

The owner requests images during execution, frequent enough to see progress,
without requiring one for every run. Publish an early baseline preview and
updated comparison sheets at meaningful milestones: angular-rule screening,
the first propagated spectral witness, important order/candidate changes, and
the benchmark assessment. During longer numerical work, aim for an updated
visual about every **5-10 minutes when new results are available**. Combine small
runs into one sheet; do not rerun science or duplicate an unchanged image just
to meet a clock interval. Text progress continues during work without new visuals.

Use inexpensive deterministic SVG/PNG artifacts derived from retained numerical
outputs. Comparison color swatches are sufficient initially; matched horizon
strips or small scene images can follow when the required data exists. Reuse
computed spectra rather than building another cache or launching a browser job
solely to obtain a progress image. Keep preview costs inside the registered
execution/storage allocation; reserve up to 2 MiB of the initial retained budget
for compact visual progress, rather than creating films or full-resolution sets.

| Available evidence                  | Reviewable output                                                                                                                           |
| ----------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| Qualified baseline spectra          | Baseline swatches at low and upper-control rays, with geometry and heading labels.                                                          |
| Angular qualification/source probes | Baseline/candidate/reference comparison sheet; phase-error bars or angular maps, with source-color swatches where complete spectra exist.   |
| One-wavelength propagation pilot    | Clearly labelled monochrome/scalar comparison and order-contribution plot; full-color result marked pending.                                |
| Complete propagated spectra         | Side-by-side baseline/candidate/qualified-reference swatches or horizon strips, followed by pure-order/cumulative comparisons where useful. |
| Full benchmark                      | Updated witness sheet and spatial signed-error/cancellation map beside the paper RMSE summary.                                              |

For color comparisons use the same spectral projection, exposure, display
mapping, adaptation and output encoding across baseline, candidate and reference.
Freeze geometry, viewing direction, atmosphere and scattering-order scope within
each matched row. Keep brightness differences visible in the primary comparison.
An optional equal-luminance row may isolate color shifts, but label that
normalization and retain the ordinary fixed-exposure row beside it.

Only complete, compatible visible spectra support a color swatch. Do not invent
RGB from a few diagnostic wavelengths or portray a source-density chromaticity
as a rendered sky pixel. Source-only color comparisons use an explicitly labelled
common brightness normalization; source magnitude is shown separately in its
physical units. Show partial spectral evidence as scalar plots and distinguish
unavailable references from measured results. Qualified reference comparisons
must match source/geometry/material/order; otherwise mark the reference pending.

Each sheet carries a short change caption, stage/candidate/order identifiers,
ray labels, physical luminance or source magnitude as appropriate, and links to
its spectra and derivation identities. Mark partial/provisional outputs and
uncomputed cells visibly. Retain completed views, including regressions. Write
new preview artifacts under the new experiment's owning run with unique names;
never overwrite a sealed comparison or parent evidence. Link the latest useful
sheet from experiment status at milestones and include its path in progress
events so the owner can open it while work continues.

Visual review complements mathematical diagnostics and the full-cache paper
RMSE acceptance gate. An attractive swatch does not qualify the full cache,
and generating progress images does not add reviewer lanes beyond the mappings.

## Bounded Execution And Evidence

The initial numerical package is Q0-Q1 plus the Q2 pilot: **15 minutes aggregate**
including setup, failed repairs, retention and verification; at most 16 MiB new
retained evidence and one serial GPU job at a time. Prefer CPU phase/source probes.
Cap an individual GPU pilot at two minutes with cancellation/progress controls.
After the pilot, register a separate allocation for propagated witnesses and the
full benchmark using measured scaling and the selected candidate. No successful
science is repeated without an identified invalidation, and no multi-hour build
is launched from an unmeasured estimate. A gate that does not fit remains open;
do not substitute a partial score for completion of Q2 or Q3.

Use the output contract above with fresh run
sequence `00000`, exclusive immutable terminal records, module-derived roots,
real-path/link checks and flushed progress at least every30s. Freeze all authored
source during a numerical run and inspect its actual terminal state before
calling it accepted. Repairs use new runs and debit the aggregate allocation.
Preserve failed, interrupted and superseded evidence with its real disposition.

Register storage before execution: initial retained ceiling 64 MiB and live
scratch ceiling 1 GiB, checking the actual measured compiler needs before Q2.
Higher requirements need an explicit revised allocation before work starts.
Use available disk rather than presumed archive relocation savings; preserve the
existing 40 GiB free-disk floor unless the owner changes it. Record operational
host/GPU memory and real allocation failures; do not reintroduce an arbitrary
8 GiB free-memory admission guard. Report transient build memory and final cache
size separately. Resource limits here govern experiment execution, not frontend
cache-size admission.

## Decisions And Open Questions

The comparison preserved the final cache representation and physical atmosphere. Q0 authenticated the backend and pinned inputs; Q1 selected the horizon-focused 2,048-direction rule; Q2 propagated it through N4 within a measured allocation. Q3-Q4 rejected standalone adoption because full-paper RMSE worsened despite improved isolated angular integration. The [results](results.md) own measured outcomes and the proposed follow-up; the [plan](plan.md) owns completion gates. The remaining scientific question is which independently qualified calculation could explain the compensating bias.

## Registered Execution Refinement

After the three uniform product rules failed the grazing-field gate, one targeted family of three positive horizon-concentrated rules was prospectively registered in `00002-q1-refine-reg`. It qualified the 2,048-direction member without changing physical inputs. This is a bounded refinement informed by a numerical miss, not a fit to paper measurement residuals.

`00006-q2-allocation` owns the measured post-pilot allocation and the explicit finer angular inventory. It permits the paired full paper captures, one single-wavelength refinement, scoring and verification within a 30-minute aggregate cap, with serial GPU work. The initial package remains separately accounted; no multi-hour job is authorized. Generated execution material follows this repository's explicit experiment-output boundary; the independent-execution skill's generic temporary-directory default does not relocate experiment evidence.

## Recorded Storage Amendment

After paired captures completed within 64MiB, immutable metadata left insufficient room for the final refinement and spatial report. Before further execution, `00010-q2-space-amend` explicitly raised the retained ceiling to 96MiB. Earlier budgets and terminal states remain immutable. The 30-minute post-pilot numerical allowance, 1GiB scratch ceiling and actual 40GiB free-disk floor did not change. The final [results](results.md) own measured use.
