# H83-H88: original F68 incoming grid plus Sun-focused samples

Status: completed with a negative candidate disposition. H83-H85 and H88 are
complete; H86 finds no finalist, so fresh validation and conditional H87 work
are not triggered. The [results](f68-sun-overlay-results.md) own the scientific
disposition; the [execution record](f68-sun-overlay-execution.md) owns decisions
and verification. The experiment stays open; production remains unchanged.

The owner-requested secondary critique is incorporated: explicit incoming-path
convergence, active-work controls, shared phase normalization, an early fixed
exterior diagnostic and decision rules registered before atmospheric screening.

## Question and expected mechanism

Can the exact original F68 incoming quadrature supply useful broad coverage
while added Sun-focused directions resolve narrow illumination features, at a
better accuracy/build-cost tradeoff than a complete Sun-focused rule alone?

The [completed refinement](geometry-incoming-results.md) used generated background
grids in its layered candidates. It found placement-sensitive aerosol-numerator
errors, but no transferable improvement. Retaining the actual F68 nodes is a
distinct hypothesis. F68 is a baseline, not an accuracy authority: the
[sunset attribution](sunset-j2-results.md) already identifies a large F68 J2 error.

These are **incoming directions used during cache construction**. This work can
change J2 and subsequent scattering orders. It does not increase the outgoing
cache resolution, replace final-view N1 with exact-angle tracing, or repair an
N1 outgoing interpolation defect. The runtime remains a cache lookup if the
builder produces the existing final representation.

## Fixed experiment contract

- Freeze the original F68 ordered unit vectors, integration weights, coordinate
  convention and source/control hashes from the retained transport request.
  Preserve those physical directions at each location. Do not regenerate them
  as a new Fibonacci grid or rotate the backbone to obtain a favorable score.
- Freeze exact paper and Toronto AERONET material requests separately, including
  aerosol loading, phase function and SSA. Keep corrected60 path transport,
  existing phase-mass normalization, geometry, outgoing grid and boundary fixed
  within each contrast. No exposure or atmosphere tuning.
- The baseline F68 weights remain immutable inputs. Combined effective weights
  may change: keeping every old node does not mean retaining its full old
  contribution and adding another full angular integral.
- Use the same incoming rule for all outgoing slots, species, wavelengths and
  orders at a location initially. Only the added layer follows the physical Sun
  axis. Its rotation, quadrature weights and L/J direction identities travel
  together. No outgoing-dependent allocation in this campaign.
- Local J2 probes use continuous, cache-free L1 evaluated at the actual incoming
  directions, with the declared atmospheric-only black boundary. They isolate
  quadrature before native cache interpolation. Local source density must not
  be compared directly to libRadtran observer radiance.

## H83: register two valid overlay constructions

Let `Qb` be the exact F68 quadrature for a solid-angle integral, and `Qs` a
complete Sun-warped quadrature, including its physical solid-angle Jacobian.
For any prescribed directional window `s`, use:

```text
Qoverlay(f) = Qb((1 - s) * f) + Qs(s * f)
           = Qb(f) + [Qs(s * f) - Qb(s * f)]
```

Thus the same angular region is partitioned rather than counted twice. Each
node receives its original quadrature weight times its own partition factor.
The correction form is algebraic attribution, not an extra negative-weight
transport field: the actual two-stream weights are nonnegative. Finite
quadrature errors remain measurable; the identity alone does not ensure accuracy.

Test two constructions, keeping Sun concentration `k=.35` fixed initially:

1. **Smooth local replacement.** Let `theta` be angle to the Sun. Set `s=1`
   inside 15 degrees, `s=0` outside 45 degrees, and use a fixed smoothstep taper
   between them. The original grid supplies the exterior; the added grid
   supplies the center. Register the exact function and angle units. If this
   window fails manufactured integration or shows a boundary-coverage defect,
   allow one predeclared broader 30-to-90-degree rescue. Do not tune widths on
   the worst atmospheric ray after seeing its score.
2. **Smooth full-sphere balance.** Let `Js` be the Sun map's physical Jacobian
   evaluated by its inverse at each physical direction. Define
   `alpha = nSun / (68 + nSun)` and
   `s = (alpha / Js) / ((1 - alpha) + alpha / Js)`.
   This is an analytic, overlapping partition; it does not require assigning
   an empirical PDF to the discrete F68 points. It preserves both streams
   across the sphere and supplies a comparator without a compact window edge.

No arbitrary post-hoc area rescaling or phase-based fitting of integration
weights. Keep the current aerosol phase normalization as a separate, fixed
operator and expose its numerator and denominator errors.

For each stream retain `R` (Rayleigh source with its coefficients), `M` (raw
aerosol source with its coefficients) and `D` (sampled aerosol phase mass), all
using the stream's effective partition weights. Reduce them as:

```text
J2raw = Rb + Rs + Mb + Ms
J2    = Rb + Rs + (Mb + Ms) / (Db + Ds)
```

Use the existing integrator's phase convention and coefficients. Sum both
streams before division; never compute `Mb/Db + Ms/Ds`. Attribute each stream's
aerosol contribution under the same combined denominator. Keep the correction
identity above at the raw linear level: subtracting separately normalized
quadratures would not be the same calculation. Verify reduction closure against
a single concatenated weighted grid, including a stream with zero phase mass.
Only the combined phase mass must be strictly positive for normalization.

Initial added counts are 256, 512 and 1024: nominal totals are
324, 580 and 1092 before any justified exact-node reuse. Zero-weight nodes may
skip path tracing only if this is declared and actual saved work is counted.
Do not move unused samples into a different region during the comparison.

Before atmospheric work, freeze the two added-layer azimuth placements, using
the existing primary and half-golden-angle offset conventions where compatible
with reflection symmetry. Keep F68 fixed in both. Check each construction at
both placements; prospective finalists must later pass atmospheric comparisons
at both, not merely a lucky placement. A placement ensemble is a new costed
rule, not a way to conceal a failed placement.

Freeze the numerical decision registration in H83, before H84 atmospheric
screening: absolute per-profile denominator floors, protected target/channel
identities, manufactured tolerances, cost accounting and comparator-selection
rules, path-convergence criteria, reference qualifications and the H86 decision
margins. Derive error floors from the authenticated development references
using the inherited `1e-8 * max(reference mean)` convention, record the resulting
values and retain them through validation. Protect every development case;
register every reserved case as protected before exposing its result. Nominate
complete controls for each cost route in advance and report the full frontier,
rather than choosing whichever comparator makes a candidate win. Register the
paired bootstrap seed 1013904223, 2000 replicates and one-sided empirical 95%
margin rule; coupled interval bounds are sensitivity checks, not an alternative
acceptance rule. Changes require a new prospective registration, not retroactive
threshold changes for already-scored candidates.

### Mathematical admission and first images

For every actual grid, verify unit vectors, positive finite active weights,
physical rotation/inverse/Jacobian, partition closure and reproduction of the
stored F68 identity. Verify area, first moments, smooth manufactured Sun lobes
and horizon bands against analytic or independently converged integrals. Include
constant incident fields with paper and actual Toronto phase functions at the
development outgoing angles. Obtain Toronto phase mass from its exact
piecewise-linear cosine-table integral with the correct solid-angle convention.

Use the previous 2% local and 0.5% fine-finalist area/first-moment screens,
normalized to `4*pi`. Freeze manufactured-lobe tolerances from their known
integrals and intended accuracy before scoring atmosphere. A failed candidate
gets mathematical diagnosis and the single registered rescue, not an expensive
atmospheric sweep. Measure baseline F68 defects without silently repairing it;
its legacy diagnostic role does not exempt a proposed finalist from admission.

Output node diagrams distinguishing F68 and added samples, angular window and
effective-weight plots, and a manufactured-error table. Show near-Sun and
horizon coverage at ground and elevated locations. These are the first
reviewable progress images.

## H84: screen local J2 in both atmospheres

Use the already observed ten-target development panel registered in
`00457-h75-registration`: the four H67 dusk witnesses plus six altitude/solar/
outgoing contrasts. Use all three retained bands, indices 3/5/8, giving 30 cases
per atmosphere. These cases are development, not fresh validation.

Reuse authenticated total and species-resolved references from
`00461-h76-dev-ref`, qualified through `00484-h82-final-proof`. Preserve their
uncertainty and history covariance. Reuse incident packets only when physical
direction, location, spectrum, material, transport and boundary identities match.
Otherwise trace new actual directions; do not interpolate saved F68 values to
manufacture an independent L1 reference.

### Incoming-path convergence before interpreting angular error

Retain the independent probe's 64/128 path-quadrature contrast for every new
candidate/control packet. Reuse a convergence receipt only for matching physical
directions, path integrator and material identities. Compare the resulting raw
and normalized J2 and species contributions using the registered absolute
floors. If a relevant change exceeds 1%, compute the 256-path-sample contrast
and compare 128/256. Preserve each packet's resolution, changes and work counts.
An unresolved 128/256 change does not qualify an angular-accuracy claim; diagnose
or register a bounded further path refinement before advancement.

Corrected60 is the fixed native cache-transport setting, not a substitute for
this continuous-L1 probe check. Even a sub-1% path change is insufficient when
it can reverse the claimed candidate/control improvement. Recompute decisive
paired margins at both retained path resolutions and require the disposition
to survive; otherwise refine the live contrast or report it as path-limited.
Resolution differences are convergence diagnostics, not rigorous error bounds.

Compare each admitted overlay against these complete controls:

- Original F68 alone, to measure the benefit over the original builder.
- Sun-only at the same nominal totals, 324/580/1092, with matching
  generator, concentration and paired added-layer placement conventions.
- Complete Sun-only controls matched to actual active path work if compact
  window zeros or exact-node reuse reduce the overlay's traces. Determine those
  counts from geometry before atmospheric scoring. Bracket unsupported counts
  with the nearest supported generator counts; retain both brackets and their
  actual costs. A rounded count is not an exact equal-cost comparison.
- The retained complete Sun-only 1024/1408/2048 frontier on this same panel.

Preserve exact original F68 rather than forcing its placement to match the new
generator. Report that difference. Do not combine one control's best mean with
another's best maximum. Use actual path evaluations, measured GPU/host time and
projected builder/intermediate-storage cost; reused evidence still carries its
nominal standalone work. Incident reuse is an execution saving, not a faster
proposed algorithm.

Report nominal nodes, active traced directions, any exact-direction sharing,
path quadrature samples per trace, convergence/refinement overhead, measured
time and projected native storage separately. Register a common standalone
work metric and the precise equal-cost rule in H83. Qualification-only path
checks and reference acquisition remain visible as campaign overhead. If costs
cannot be matched, use the measured accuracy/cost frontier or the H86 lower-cost
route; do not claim the equal-cost route from nominal totals alone. Charge all
active directions at the path resolution the proposed builder would require.

Start at +256 and +512. Reject invalid or clearly dominated configurations
early. Give a mathematically sound construction one +1024 rescue when it has
a coherent improvement trend or identifiable under-resolution. Avoid tracing
both dense variants merely to complete a table after clear failure.

Retain signed raw Rayleigh/Mie integrals, phase mass, normalized aerosol source,
total J2, and the overlay's inherited/added/correction contributions. Show where
an apparent total gain hides species or numerator/denominator cancellation.
Publish per-profile mean/worst errors and every protected-case change, including
the red sunlit-ground witness and sideways/high-altitude cases.

### Early fixed-exterior error-floor diagnostic

For the compact window, extra Sun nodes cannot refine the inherited
`Qb((1-s)*f)` exterior. On the red ground witness and representative sideways
and high-altitude cases in both profiles, independently resolve the windowed
interior/exterior raw Rayleigh and aerosol numerators and phase masses. Use a
qualified independent-coordinate integral or matching partitioned path tallies
with their own refinement/uncertainty, not the overlay's largest grid as truth.
Whole-integral references alone do not identify the partitioned error.

Combine the fixed F68 exterior with the independently resolved interior using
the shared denominator above to estimate the limiting overlay as Sun resolution
increases. Plot its signed exterior error and reference uncertainty before
expensive +1024/+2048 tracing. If that limit cannot meet protected-case or
advancement gates, reject this window or use the already registered broader
rescue; do not keep increasing only the Sun count. Finite-count cancellation
does not establish a convergent improvement. If the partitioned reference is
too uncertain, record that limit and do not claim an irreducible error was
established. This diagnostic does not replace the all-case advancement gate.

Output both-profile error/cost plots and directional contribution diagrams after
the first meaningful screen. Three-band diagnostics are not full-color sky
swatches; do not present them as rendered horizon colors.

## H85: placement robustness and bounded follow-ons

Repeat promising complete rules at the second frozen added-layer placement,
including matched Sun-only controls. The backbone remains unchanged. Diagnose
whether a failure enters the inherited exterior, Sun contribution, taper overlap,
phase denominator or subsequent normalization before choosing another variant.

Allow further registered development work if evidence supports a distinct
mechanism: for example, widening an under-covered taper or refining only a
demonstrably unresolved added stream. Register prediction, changed parameter,
both-profile controls, cost ceiling and rejection condition before computing.
Do not repeat a rejected generated-base/horizon family under an F68 label.
Do not add horizon layers, per-order allocation or outgoing-grid changes unless
new evidence first justifies a separately scoped extension.

An exhausted initial list need not end useful investigation. Continue only
while an explicit lead predicts a discriminating improvement; stop a dominated
family when the permitted rescue fails or new measurements transfer its error
elsewhere. Initial overlay ceiling is +2048 directions for one justified rescue
beyond the initial matrix, not an automatic count sweep.

## H86: freeze finalists and expose fresh validation

Apply the previous paired-reference procedure: shared reference draws for
candidate/control and species/bands sharing histories, independent groups
resampled separately, 2000 fixed-seed bootstrap replicates, and a coupled
reference-interval sensitivity check. Use H83's frozen floors, uncertainty
treatment, protected cases and threshold margins. H86 verifies that registration
and freezes finalist identities, not new rules. Report reference-limited
differences as inconclusive; refine at most four decisive
reference cases per atmosphere in a wave only when precision can resolve a
live decision. Never replace uncertain truth with the candidate's finest grid.

Advancement requires either at least 20% lower mean or worst error at matched
actual cost, or at least 25% fewer evaluations with both statistics within a
10% relative margin of a competitive complete control. Require a resolved gain
in at least one atmosphere and no resolved material regression in the other,
the other statistic or protected cases. A material regression exceeds both
20% relative and two percentage points, with uncertainty assessed jointly.
Both added-layer placements must support the disposition. Beating F68 alone
does not qualify an overlay that loses to an economical complete Sun-only rule.

Freeze no more than two finalists before exposing the twelve still-reserved
H80 targets. Register exact geometry/material/order identities and confirm
their separation from development evidence. Validate both profiles and add a
cheap matched +60-minute twilight probe before any full-cache commitment.
Do not tune on fresh cases and continue calling them held out. A failure can
inform a new development lead, but consumes that validation set for future use.

## H87: conditional native recurrence, paper B1 and scene evidence

Only survivors advance. First demonstrate a feasible native builder contract:
the same physical directions and weights must feed incoming L transport and
J integration at each location. Solar-row and ground-boundary sampling must
not interpolate unlike directions just because their indices match. Reuse the
prior dimensional audit, updating actual intermediate storage, padding, boundary
work and peak live allocations for this two-stream implementation. Direction
metadata may be procedural; that does not remove incoming-L field costs.

Run both-profile three-band J2/J3/J4 microbuilds, distinguishing incoming-path
L1 accuracy from L2/J2 and L3/J3 reconstruction. Preserve pure and cumulative
orders. Then acquire selected 15-band observer rays if the benefit survives
recurrence. Compare matched independent references and libRadtran where solver
geometry supports them; label N1-N4 versus all-orders correctly. Reject a
resolved later-order failure before undertaking full B1 or scene rendering.

For a survivor, run exact paper B1 atmosphere, source and grass boundary,
40 wavelengths, the registered 31-band scoring convention, all 17 intervals
and 81 dome rays per interval. Match or improve both retained H61 Focused60
and H55 Original40 aggregate RMSE using authenticated full-precision scores.
Publish interval results and dome comparisons. Toronto gets its own independent
accuracy results; its material is not scored as though it were paper atmosphere.

Render matched baseline/overlay scenes for paper and Toronto at noon, sunset,
and +30/+60 minutes with common exposure and display mapping. Preserve current
production twilight behavior as a protected comparison; justify material
changes with physical references or present a concrete image set for the owner
to judge. Neither production nor a brighter horizon is an assumed oracle.
No production promotion or live-shader exact-ray integration is included.

## H88: execution, resources and disposition

Prefer GPU for radiance, independent probes, native builds and scene capture;
run one owned GPU job at a time. Use CPU for inexpensive proofs, reduction and
verification. Follow existing bounded dispatch and progress/heartbeat contracts.
Review progress and projected cost at each wave. Sixty minutes is guidance:
continue monitoring while strong positive progress is demonstrated, rather than
stopping solely because that time has elapsed.

Before execution measure actual retained usage and estimate each wave. Current
approved retention is 896 MiB; completed H82 recorded about 852.51 MiB. Preserve
the existing 1 GiB scratch limit, free-disk requirement and sealing reserve.
The owner's standing AFK authority permits a justified recorded retention
amendment needed to proceed; it never permits altering earlier evidence.
No retention amendment was needed during this campaign.

Source stays under `experiments/sky-accuracy-dials/`, generated material under
`tmp/experiments/sky-accuracy-dials/`, and documentation here. Real-path-check
inputs/outputs and reject links/junctions under the existing run contract.
Keep prior runs immutable; every derivative records parent artifacts, operation,
parameters, implementation/tool identities and resulting identity. Preserve
failures; fix a diagnosed cause before retrying into a new run.

Use focused self-verifying proof runners and the experiment's local type check
after code changes. No experimental test framework or native helper executable.
No dedicated standards reviewers/audits; retain checkpoint-adviser monitoring
at coherent milestones. Mathematical verification and evidence checks remain
required.

Completion is either a qualified finalist with complete limits, an explained
negative result, or a specific external dependency with independent work done.
Publish images at mathematical admission, first local screen, each material
follow-on finding and conditional recurrence/scene milestones. Finish with an
execution summary, accuracy/cost frontier, all decisions and verification.
Untriggered expensive stages are explicitly conditional, not unfinished runs.
The experiment remains open unless the owner separately ends or suspends it.
