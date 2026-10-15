# Bounded Tests Of The Cancellation Hypotheses

## Status And Objective

**Planned, not executed.** The owner requested this plan after the
[H9 small-ray analysis](small-ray-cancellation-results.md#testable-hypotheses).
It defines the next proposed execution package; planning does not start a run or
renew earlier compute allocations. A later instruction to execute this plan selects
the bounded package below, including its conditional branches and stop rules.

Determine which mechanisms explain the measured compensation, and whether a
mathematical correction improves agreement with the appropriate independent
reference. Test four hypotheses separately:

- **A:** phase/source-angle or reference-configuration differences contribute to
  the near-Sun visible deficit that survives the cache-free calculation.
- **B:** scattering-order truncation is a stronger limitation at 360 nm than at
  454 nm on the selected spherical rays.
- **C:** identifiable numerical approximations explain a substantial part of the
  afternoon low-ray overshoot.
- **D:** Flat N1 neutrality follows the retained species/path balance, so numerical
  cache correction alone converges toward that spectrum without necessarily
  restoring orange.

The [current metric](reference-model-target.md#current-accuracy-metric) remains
fixed-paper-atmosphere agreement with matched libRadtran. Distinguish that score
from numerical error against an independently checked continuous solution.
LibRadtran setup/convergence equivalence and cache-free solver systematics remain
open questions. AERONET stays a future validation direction; no aerosol retrieval,
Kider fit, physical-parameter search or production change is part of this package.

## Fixed Witnesses And Controls

| Group | Exact witnesses | Wavelengths | Role |
| --- | --- | --- | --- |
| Near-Sun audit | A `p-0930-5-7`, B `p-1230-3-5`, C `p-1230-3-4` | 360/454 nm | Diagnose angular/configuration differences; retain independent P1/P2 support where available. |
| Spherical order test | A and D `p-1230-0-4` | 360/454 nm | Contrast near-Sun and low-elevation order truncation. |
| Native48 attribution | `p-1330-0-4`, with `p-1330-5-4` as upper-sky control | 360/454/642 nm | Isolate the afternoon low-ray approximation without spoiling an upper control. |
| Additional retained controls | D and E `p-1230-4-4`; morning alternate low ray `p-0930-2-0` | Existing matched bands only | Detect common gain changes and sign reversals, without new reference integration. |
| Flat local N1 | Original 00245 center rays at 0.05/3/20 degrees, away-Sun heading | Original Native15 spectrum | Test the actual horizon against its matched finite-source continuous equation. |

Reuse exact source/observer placement, time labels and physical packets; do not
re-resolve a preset or substitute a new date. Spherical paper and Flat Native15
results remain separate. The 12.115-degree spherical ray is a low-elevation probe,
not an immediate-horizon measurement.

Keep two spherical baselines distinct:

1. **H profile:** authenticated 00103, with the matched four/six-order evidence
   from 00171 and H8/H9. This owns B's order comparison.
2. **Native48:** authenticated `00000-inputs/controls.json` and `native48-gpu.tsv`,
   with 00232's direct reference. Its source/transport counts are 20/40 and its
   maximum order is four. Freeze the complete retained geometry, direction grids,
   interpolation and viewing rules as well; these two counts do not define the
   whole baseline. This owns C's +9.412 mW approximation at 454 nm.

Do not apply an H-profile correction delta to Native48 and call it a measured
Native48 improvement. Final-view P1 substitutions hold higher light frozen and
remain diagnostic hybrids. A claimed corrected total requires regeneration of
every affected recurrence field under the same physical inputs.

## H10: Reference-Input Audit And Execution Preflight

Begin with local authenticated provenance, the published-reference source driver,
its retained libRadtran inputs, version/tool identities and output processing.
Read historical material without changing or rebuilding it. Search configured
local comparison roots only; do not scan the whole drive or launch a data-acquisition
campaign. Read an exact upstream source only if the local provenance identifies
it and it is needed to resolve a missing setting; record revision and checksum.

Compare the actual packets field by field:

- Phase law and normalization, meaning of its shape/asymmetry parameter, incoming
  and outgoing angle conventions, and source direction/sign.
- Spectral sampling, point-versus-bin interpretation, units and incident solar
  irradiance, including any resampling or normalization.
- Molecular/aerosol coefficients, extinction versus scattering, SSA, scale heights,
  absorption settings, ground reflection and vertical/upper boundaries.
- Observer altitude, source/view geometry, solver mode, scattering-order treatment,
  angular resolution and recorded convergence evidence.

Produce a provenance-backed match/difference/unknown table. Do not fill missing
settings from current software defaults or assume that matching parameter names
prove equivalent equations. Check phase normalization and angular conventions
independently if the exact two definitions are available.

**A prediction:** a genuine phase/source-angle mismatch should produce an angular
effect on A/B/C rather than only a common radiance multiplier. This is a proposed
explanation, not a promised improvement. If the configurations already agree,
mark that explanation unsupported by the audit and preserve solver-systematics
as the alternative. If the actual input packet cannot be recovered, A remains
unresolved; B/C/D can continue against their existing independent references.

If a specific discrepancy is found, freeze its predicted signed effect and one
diagnostic intervention before evaluating it. A simple independently evaluated
P1 contrast on A/B/C at 360/454 nm may establish its first-order consequence.
It cannot by itself explain the complete all-order deficit. Do not change g,
SSA, AOD or other material parameters to improve the score. A diagnostic
reference-matching formulation, if different, must retain the fixed-paper control
and its own explicit physical/formulation identity.

Use an existing authenticated libRadtran executable only if already available
and the exact input packet is recoverable. Otherwise do not install or compile
libRadtran or the archived C++ helper driver. A new matched external-reference
execution is a separately bounded follow-up, not an implicit prerequisite for
finishing this package. Do not import an external repository at runtime.

Preflight also authenticates parent seals, available numerical witnesses and
baseline recipes for B/C/D. Freeze exact matrices, source hashes, original
allowances and execution budgets before new candidate generation. Record unavailable
comparisons rather than substituting a different profile.

## H11: Test B With A Reconstruction-By-Order Comparison

First recompute the retained A/D accounting from 00171, 00230 and 00251. This is
a consistency check and test registration, not new confirmation of an already
observed result. Preserve the coupled uncertainty of the direct estimate.

The new discriminating matrix is **raw versus corrected reconstruction, each
through orders four and six**, on A/D at 360/454 nm. Keep the H physical inputs,
source/transport counts, direction grids and viewing rule fixed. Corrected means
query-density/phase and sunlight-column handling identified by the earlier
independent component work, applied consistently wherever the recurrence uses
the affected representation. Record which operations can actually be corrected;
do not call an analytic-P1/frozen-higher substitution a corrected recurrence.

Reuse the retained raw N4/N6 results only after the raw reproduction and prefix
checks pass. One new sequential GPU job may generate the corrected N1-N6 chain
for the two wavelengths. Retain pure orders and queried radiances, not full fields.
N1-N4 must share the same prefix between the corrected N4 and N6 readings;
adding orders may not rebuild those earlier terms under a different policy.

**Prediction:** relative to the direct reference, added orders reduce the 360 nm
deficit more strongly than the 454 nm deficit, while corrected lower orders can
remove a visible excess that extra orders alone would worsen. Measure the actual
reconstruction-by-order interaction, including every sign reversal.

Report the signed change, error interval, numerical SSE change and libRadtran
agreement separately for each scalar. Treat the difference between the 360 and
454 nm truncation responses as the primary spectral contrast. If that contrast
reverses or cannot be resolved after consistent lower-order correction, B is
challenged or unresolved. If the corrected recurrence cannot be implemented and
qualified within the cap, report the missing cell; do not replace it with a
frozen-field hybrid and claim the factorial is complete.

## H12: Test C On The Exact Native48 Low Ray

Reproduce the retained Native48 total at the afternoon low ray and upper control
before changing any numerical operation. Record all counts and reconstruction
choices. Compare against the original 00232 direct mean and its unchanged interval.
The 454 nm low-ray comparison must recover the existing approximation near
+9.412 mW within the combined replay/reference allowances.

Use a nested attribution, stopping at the first unsupported boundary:

1. **Final viewing rule:** reproduce the original view sampling; then compare
   the same fields under an independently refined viewing rule. Do not hide a
   view-integration change inside a cache-reconstruction correction.
2. **P1 representation:** at fixed source count and frozen higher light, evaluate
   the full density/phase/column 2 x 2 x 2 matrix plus the separated-transmission
   control. Use the retained fine CPU P1 estimates as independent references where
   available. Preserve interactions; do not sum isolated improvements as if additive.
3. **Higher-order representation:** propagate the joint supported correction
   consistently through N4 at the Native48 counts, then subtract the P1 effect.
   This measures the additional higher-order response. It does not uniquely
   allocate that response to all internal quadratures.

One sequential GPU job may stream these six ray/wavelength scalars. Use the same
new fields for final-view variants. No incoming-direction, source-count, transport-count
or altitude-grid sweep is included. If a remaining error points to one such
factor, record a follow-up hypothesis instead of adding a ladder.

**Prediction:** the identified correction reduces a material part of the low-ray
approximation against the direct reference, while the upper control's error
does not materially increase. Define material as at least a **25% reduction in
absolute approximation error at the low ray's 454 nm scalar**, with the direction
resolved under the comparison allowance. The upper control must not worsen by
more than the greater of **0.5 spectral mW or its comparison allowance**. These
are prospective diagnostic thresholds, not production acceptance criteria.

If the correction explains less than that amount, or spoils the upper control,
do not assign the whole +9.412 mW to that mechanism. Publish the explained
fraction and remaining signed discrepancy. No improvement against libRadtran
may be credited solely to increased known numerical error.

## H13: Test D At The Actual Flat Horizon

Use 00245's original finite-source geometry and Native15 physical inputs. Reuse
its continuous N1 species spectra and distance-stratum evidence, with their
existing convergence and additivity checks. This is a separate matched Flat
reference, not a spherical libRadtran substitute.

Compare the current contained local-cache representation and the supported
corrected N1 representation on the same 0.05/3/20-degree center rays. Pin the
source/cache/query transforms and read production sources only; implement any
intervention in this experiment. Evaluate Rayleigh and Mie separately at fixed
combined extinction, then sum them. If the current payload cannot separate
species, build an experiment-owned diagnostic payload from the same equation;
do not infer species errors from a combined value. Label that additional
representation explicitly and verify its summed-control parity first.

Reuse an authenticated cache only if its full physical/source/coordinate identity
matches these rays. Otherwise allow one small sequential GPU query/precompute job,
retaining spectra and sparse contributions only. No app screenshot or display
retuning is needed. Apply the same retained linear color projection to every
case, and report raw spectra as the primary evidence.

**Prediction:** a mathematically closer N1 cache approaches the continuous
3-degree R/B near **0.9892** under the retained bin-integrated projection, without
requiring orange ordering; the 20-degree control remains blue. Operationally call
a large hue departure an absolute R/B difference greater than **0.02**, and call
the corrected spectral match resolved only if per-channel error fits the greater
of **0.1% of reference radiance or the combined numerical allowance**. These
thresholds are diagnostic and must not override a failed reference check.

Support D only if a new matched cache intervention actually approaches that
reference within those gates. A still-neutral output with poor spectral agreement
does not support it. A qualified warm continuous N1 result at identical inputs
challenges D; a large cache species bias means the cache explanation remains
live. Do not remove aerosols, alter phase/SSA, change source distance, or add
Flat higher orders to manufacture the expected color within this test.

## Numerical Qualification And Decision Rules

Preserve original empirical allowances and all five 00230 sampling-precision
misses. Do not relabel a marginal sampling interval as a total solver error bound.
For new arithmetic/reference checks, reuse H9's physical and geometry identity
rules and the independent P1/P2 producer allowances.

Raw GPU replay uses the original producer's frozen guard where available.
Otherwise prospectively use the greater of **0.02 spectral mW or 0.02% of the
retained radiance** as a Float32 replay screen, and record that it is an engineering
screen rather than a certified numerical bound. A failed replay stops that
comparison; it does not permit widening the allowance or changing the baseline.

For a deterministic candidate change `delta` against the same uncertain direct
reference, use `deltaSSE = 2 * error * delta + delta^2`. Propagate the shared
reference interval through that expression; do not pretend before/after reference
errors are independent. Include new numerical/refinement allowances. Effects
whose sign depends on allowed reference values remain unresolved. Where new
sampling would be needed to decide a sign, retain unresolved status instead
of automatically increasing paths.

Report each hypothesis as **supported within the tested boundary**, **challenged**
or **unresolved**, with the exact prediction, observed effect, uncertainty and
falsifier. A valid run can challenge a hypothesis. Operational acceptance,
scientific support and standards-review completion are separate facts.

## Resources, Sequence And Stop Conditions

The initial package has a **20-minute aggregate execution ceiling**, including
data preparation inside the runs, browser/setup, computation, retention and
cleanup. Implementation and review time are tracked separately; this is not a
promise that the entire coding session finishes in 20 minutes.

| Stage | Maximum execution allocation | GPU attempts | New retained allowance |
| --- | ---: | ---: | ---: |
| H10 audit/preflight and optional small P1 contrast | 3 minutes | 0 | 2 MiB |
| H11 reconstruction/order test | 5 minutes | 1 | 4 MiB |
| H12 Native48 attribution | 5 minutes | 1 | 4 MiB |
| H13 Flat N1 comparison | 5 minutes | 1 | 4 MiB |
| H14 joined assessment and final resource check | 2 minutes | 0 | 2 MiB |
| **Total** | **20 minutes** | **At most 3** | **16 MiB** |

Execute H10 first. B and C may share implementation scaffolding, but retain their
different baselines. Run GPU work serially, ordinarily H11, H12, H13; finish H14
even if a previous hypothesis is unresolved. Do not spend an unavailable or
unused stage's allowance on extra rays, count ladders, retries or another stage.
Each attempted stage, including a failure, consumes its one allocation. If setup
cannot fit its allowance, stop that stage and report the missing evidence.

On execution selection, register a new package-specific admission record with
the current prior-attempt count, this plan/source identity, stage deadlines and
three-attempt maximum. Preserve consumed authorizations and their absolute
deadlines; do not edit or bypass them to admit this continuation. Existing
admission code may be adapted within the experiment for this new authority.

The experiment-wide **512 MiB retained, 1 GiB scratch and 40 GiB free disk** limits
still apply. Check current totals at admission; the last H9 boundary retained
407,051,357 bytes. GPU caches may exist transiently for computation but must not
be retained as full fields or packages. No additional app/frontend cache-size
admission rule is introduced by this scientific plan.

Respect the owner's relaxed operational memory policy; do not resurrect the
retired 8 GiB free-memory requirement. Use bounded allocations and report actual
allocation/device failures. Product cache-build memory requirements remain a
separate question and do not block this experiment by policy.

Use the existing experiment I/O owner for real-path validation, root derivation,
exclusive run allocation, parent/source/tool hashes, progress and sealing. Preserve
all previous runs; derivatives go into new runs. Emit progress at least every
30 seconds and before each stage. Enforce deadlines in parent/watchdog code,
reserve cleanup time inside each cap, and terminate only the owned process tree.
No automatic retries, full-sky campaign, new dependency/native-helper build,
parameter fitting, historical-evidence mutation or production promotion follows
a failure or inconclusive result.

## Implementation Review And Deliverables

Before authored code changes, capture a fresh task baseline and refresh mapped
reviewer readiness/context. Treat the shared hypothesis runner, numerical
interventions and result report as one coherent implementation unit; keep its
implementation-completion gates open until the batched mapped review validates.
Run the experiment type check and focused self-verifying proof runners. Do not
create an experimental unit-test tree or introduce additional reviewer lanes
because a browser, shader or offline HTML report is used.

Use only the folder-mapped standards, including required canonical types review
and its independent audit. Production remains read-only; deferred historical
reviews are not reopened. Checkpoint advice retains its separate whole-repository
scope and the owner's standing preapproval/one-minute consultation limit.

Deliver compact per-scalar spectra and pure-order/species contributions, a signed
error/cancellation table, input/configuration match ledger, uncertainty/prefix/replay
checks, actual elapsed/storage accounting and a four-row hypothesis decision sheet.
Each decision names what was tested and what remains. Register any proposed next
test separately; do not extend this package to obtain a favorable result.

## Execution Checklist

- [ ] Owner selects execution; capture baseline, refresh readiness and freeze matrices.
- [ ] H10: authenticate reference setup and register any specific intervention.
- [ ] H11: complete or explicitly bound the missing reconstruction-by-order cells.
- [ ] H12: replay Native48 and attribute the afternoon low-ray approximation.
- [ ] H13: compare matched Flat cache/continuous species spectra.
- [ ] H14: evaluate all four hypotheses, preserving misses and unresolved cases.
- [ ] Complete local verification, batched mapped review and resource/immutability handoff.
