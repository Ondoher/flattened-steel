# Aerosol refinement and full-scattering confirmation

Status: execution selected through independent-execution. Independent plan critique incorporated.
The [first campaign](plan.md) and its
[results](results.md) retain their original scope, criteria and accepted evidence.

## Outcome

Determine whether `combo025` can retain its solar glow while displaying a less
gray horizon, and distinguish changes in brightness, spectral hue, multiple
scattering and display mapping. This is an exploratory atmosphere-selection study,
not a claim that production transport is wrong or that a whiter horizon is always
more accurate. Retain original and zero-aerosol controls. Do not change the app.

The order of work is full-scattering baseline, cheap parameter isolation, then
conditional full-scattering finalists and independent confirmation. The completed
N1 screen is a starting point, not a substitute for this sequence.

## Baseline and comparison contract

- `combo025`: original loading fraction 0.25, beta=0.01, SSA=0.95,
  Cornette–Shanks shape g=0.85, aerosol scale height 1200 m, Ångström exponent
  alpha=0.8. Record complete spectral coefficients rather than relying on labels.
- Use the authenticated first-campaign San Jose noon Sun direction, spherical
  geometry, observer 5 m, Native15 source/basis, molecular atmosphere and black
  ground. Keep ozone/refraction/polarization choices and the corrected numerical
  policy explicit and unchanged within each material comparison.
- Reuse runs `00001-property-refine`, `00002-verify-report` and
  `00003-visual-report` as immutable data after checking their manifests, relevant
  implementation identities, units, coordinate conventions and material profiles.
  The deliberately failed pilot remains failed; reuse its qualified derivatives.
- Keep the numerical and material changes separate. A cache, direct transport,
  source attenuation and reference solver must all use the same candidate medium.
  Include material identities in cache keys; never combine a new medium with an
  old cache merely because its geometry matches.
- In every comparison retain spectral radiance in W m^-2 sr^-1 nm^-1, luminance,
  xy and a perceptual chromaticity-distance measure such as u'v'. Report a neutral
  reference (D65) descriptively, not as measured sky truth or a universal target.
- Freeze views and selected rays before candidate analysis: toward/cross/away-Sun
  elevations 0.05, 1, 3, 10 and 20 degrees; Sun offsets 0.5, 1, 2, 5 and 10 degrees.
  Retain the first campaign's sparse glow contrast and add absolute near-Sun
  luminance plus horizon-to-3/10-degree luminance ratios. Contrast alone cannot
  demonstrate a brighter solar surround.
- Report both absolute near-Sun luminance and glow contrast relative to unchanged
  `combo025` at each matched geometry. Before screening, register a provisional
  10% maximum loss in either as the search guard for calling glow "retained".
  A larger loss is an explicit tradeoff, not automatic rejection of a useful
  Pareto candidate or a statement about what the owner must prefer visually.
- Hold out horizontal left/right and downward Sun offsets at 1 and 5 degrees as
  verification probes. Construct actual great-circle/tangent-frame offsets,
  not azimuth changes masquerading as equal angular separation near zenith.
  Classify ground-intersecting probes consistently in the baseline and candidate;
  exclude them from a sky-only metric and retain the exclusion record.
- Use a common physical-to-display mapping and primary exposure across media at
  each matched geometry. Retain raw spectra/float RGB and the common 0.125 exposure
  bracket. A further shared bracket may be registered if clipping prevents useful
  inspection; never auto-expose individual candidates. If a later app capture uses
  its normal medium-dependent adaptation, label that as a separate comparison.

## M1 — Establish what four scattering orders change

Purpose: avoid tuning an N1 gray band that extra scattered light already fills.
Initial estimate: 40–80 minutes for one new medium at noon/5 m, including
profile/renderer adaptation and a two-ray reference pilot. The recent
production build's roughly ten-minute cost is context, not a promise for this setup.
First report the pilot's measured time/uncertainty before scheduling the full
spectral/order reference; that conditional reference duration is initially unknown.

1. Authenticate the `combo025` N1 baseline and repeat only invalidated controls.
   Record a source/repository baseline without modifying existing dirty work.
2. Pilot the existing higher-order reference route immediately: one `combo025`
   horizon ray at 0.05 degrees and one solar-offset ray at 1 degree. Establish
   actual supported scattering-order semantics, spherical geometry, availability,
   runtime and uncertainty. A three-band operational check may precede the full
   Native15 pilot, but cannot qualify spectral agreement. Route all new output
   into this experiment's root. Diagnose the existing installation; do not expand
   this plan into an unbounded WSL repair or new solver-installation project.
3. Build an experiment-owned distant-Sun cache for `combo025` using current
   corrected transport and outgoing sampling. Preserve complete wavelength,
   phase, altitude and solar support identities. Start with the noon/5 m scene;
   prepare additional coverage only when earned by later work.
4. Capture cumulative N1, N1–2, N1–3 and N1–4, and pure order increments where
   the builder can expose them. Never label pure N4 as the cumulative N1–4 total.
   Capture the order boundaries within one build where supported, rather than
   automatically performing four independent cache builds.
   First check the cache's N1 output against converged direct CPU rays at the
   horizon and solar-surround probes before interpreting its higher orders.
5. Extend the qualified pilot to a small independently computed N1–4 probe set for the same medium:
   horizon 0.05/3 degrees and solar offset 1/5 degrees. Reuse the independent
   higher-order machinery only after confirming its physical inputs and order
   accounting. Use a refinement or repeated-batch measurement to quantify numerical
   and sampling error; do not treat old-medium or N1 agreement as N4 validation.
6. Render matched N1 versus N1–4 sky/horizon and Sun-surround images promptly.
   Use a Sun-centered perspective projection or an equivalent undistorted local
   angular projection for halo shape. The previous azimuth/elevation map may remain
   comparison evidence but must not establish a physical halo shape near zenith.
   Keep the direct disk excluded from physical glow metrics; a fixed visual disk
   marker, if used, is separately identified and identical across comparisons.
7. Separate the findings: extra luminance, changed chromaticity, changed glow,
   and any difference introduced by display mapping. Report original/zero controls
   at matching order where available; authenticate any reused cache's altitude and
   solar-neighbor support rather than reusing the older elevated-coverage defect.
   Original/zero N4 controls are optional reused evidence, not implicit additional
   full-cache builds. Register a distinct reason and cost before any new control build.

Deliverables: first order-resolved spectrum table/plot, matched actual color fields,
build timing/memory/storage, and a concise M1 report in `refinement-results.md`.

Gate: finite matched coefficients, converged direct N1 and qualified higher-order
references permit N4 interpretation on qualified rays. Target <=0.2% direct CPU
refinement and <=0.5% standalone GPU/direct N1 discrepancy. Report cache/direct N1
reconstruction error separately; the standalone tolerance must not silently become
an unattainable cache-interpolation gate at a sharp forward lobe. For N1–4,
target <=1% reference uncertainty, <=2% spectrum/luminance disagreement and
<=0.001 u'v' difference, with 95% uncertainty and every exception reported.

Use a spectrum-level relative L2 norm weighted by channel widths, plus separate
luminance and chromaticity differences. Report per-channel residuals above the
frozen baseline floor without letting a negligible weak channel dominate the
spectrum-level judgment. These are numerical comparison targets, not atmospheric
realism criteria. If a target fails, hold the affected ray/claim and continue
qualified sensitivities elsewhere. Permit one targeted path refinement and one
angular/reconstruction refinement diagnostic, each at fixed medium; then report
remaining disagreement rather than turn this study into a cache redesign.
Unavailable spherical libRadtran is an explicit external-validation gap; a
qualified independent N1–4 route can still support its own narrower comparisons.
If unchanged N1–4 supplies the desired brightness while meeting the glow guard,
deliver that result, finish a small one-factor sensitivity screen, and skip new
finalist cache builds unless they show a distinct additional benefit.

## M2 — Isolate the remaining physical adjustments

Purpose: identify which control improves brightness or hue while retaining glow.
Estimate: 20–40 minutes for parameterization, physical controls and eleven unique
noon/5 m N1 configurations once the reusable harness is ready. This includes the
two reusable 10%/25% endpoints and nine new one-factor configurations before any
earned adaptive combination. Keep g=0.85 throughout this milestone. Existing original/zero
first-order controls may be reused without adding cache builds.

Run one-factor variations around `combo025`, not a full Cartesian product:

| Branch | Values | Quantity held fixed | Testable prediction |
| --- | --- | --- | --- |
| Vertical distribution, first priority | H=1200, 1800, 2400 m | Total aerosol optical depth at 550 nm; alpha and SSA | Spreading the same column higher lowers near-ground concentration and may reduce long horizontal attenuation without removing the solar surround. |
| Spectral dependence | alpha=0, 0.4, 0.8, 1.2 | Optical depth at 550 nm; H and SSA | Spectral slope may change horizon hue independently of reference-wavelength loading. Direction and size of the effect must be measured. |
| Finer loading | 10%, 15%, 20%, 25% of original loading | H=1200 m, alpha=0.8, SSA=0.95 | Intermediate loading may preserve more glow than `combo010` while giving a brighter horizon than `combo025`. |
| Remaining absorption | SSA=0.95, 0.98, 1.0 | Aerosol extinction spectrum, H and alpha | Reduced absorption may give a smaller brightness improvement without requiring lower loading. |

The 10% and 25% endpoints and the baseline are reusable only when their exact
geometry, source, projection and numerical inputs remain compatible.

Implementation and controls:

1. For changed H or alpha, derive the new coefficients from the fixed baseline
   550 nm column. For an exponential shell of top height T:

   `extinction(lambda, z) = tau550 / [H * (1 - exp(-T/H))] * (lambda / 550 nm)^(-alpha) * exp(-z/H)`.

   Numerically verify the finite-height column, not just beta's label. Recompute
   channel values with the same Native15 projection convention used by the cache
   and reference; do not replace bin means with center samples in one solver.
2. Keep scattering=SSA*extinction and absorption=(1-SSA)*extinction explicit.
   At fixed extinction, molecular N1 must be unchanged and aerosol N1 must scale
   with SSA. Where useful retain the original fixed-scattering/no-absorption control.
3. Confirm the GPU kernel actually receives every changed property. The current
   session's scale heights and coefficient spectra are compiled constants; updating
   metadata or only the CPU medium is insufficient. Use explicit keyed kernels or
   uniforms and requalify each distinct physical family against CPU spectra.
4. Reuse one hardware GPU session where compatible; CPU handles selected binary64
   reference rays. Fix numerical floors from control radiance before comparing
   candidates; refine only failing rays. Record near-zero cases separately.
5. Record physical hue and luminance independently of their displayed gray/white
   appearance. Do not remove the molecular atmosphere or add an aerosol-free
   surface layer as an unregistered shortcut.

Deliverables: compact spectral/metric tables, a useful horizon/Sun image gallery
when fields are ready, and an M2 report explaining each branch's disposition.
Images show actual appearance or spectral shape; numbers and prose stay in native
text/JSON/TSV. Do not produce status cards or tables as images.

Gate: use the registered glow-retention guard alongside absolute luminance and
held-out direction checks. Reject a branch from the N1 screen only if it moves neither requested
quantity beyond its numerical uncertainty, weakens both horizon and glow, or merely
substitutes an unwanted hue. A small change is not a failure when its uncertainty
overlaps zero: mark inconclusive and state the resolving measurement. Keep a
Pareto shortlist using brightness, chromaticity, absolute solar-surround luminance
and contrast. Preserve distinct winners rather than selecting one aggregate score.
An N1 rejection does not disprove an N4 effect; if M1 shows that higher orders dominate
the relevant mechanism, carry one informative near-baseline case into M3 even if
its N1 appearance is inconclusive.

## M3 — Confirm a bounded shortlist across orders and conditions

Purpose: test whether any improvement survives the full cache and changing view
conditions. Conditional on a useful M2 effect or an M1 higher-order lead.
Duration and retained size are unknown until M1's measured cache/reference pilot;
publish a revised estimate before beginning this stage.

1. Advance at most three new configurations initially: the best vertical-profile
   change, the most informative distinct spectral/loading/SSA change, and one
   evidence-supported combination. Keep unmodified `combo025` as the comparator.
   Do not build a large parameter grid simply because the runner permits it.
2. If two isolated adjustments look complementary, record their predicted joint
   effect and preserve both single-factor controls. Count the combination within
   the shortlist. Reuse cache content only when the full material and numerical
   identities match; never rescale a cumulative cache to emulate different optics.
3. Compare cumulative N1–4 using identical geometry: noon/5 m first, then noon/500 m
   and Sun elevation 15 degrees/5 m separately. Check a 2 km noon horizon for retained
   candidates before an app-oriented conclusion. Register exact source directions;
   synthetic Sun angles are not matched sunset timestamps. If the lower-Sun result
   earns a sunset follow-on, register the exact sunset geometry as a separate case.
   The initial M3 commitment is up to three new media plus the reused comparator
   across three independent conditions, with the 2 km check conditional on retention.
   Update the estimate after the first actual finalist build, including whether
   one package covers several conditions or further cache builds are required.
4. Use matched full-scattering horizon and Sun-surround renders, plus selected
   per-order spectra. An experiment-local adapter may exercise read-only production
   transport/rendering, but changing its atmosphere must update both the experimental
   cache and live transport. Keep field images and actual scene captures labeled.
5. Include libRadtran at the unchanged `combo025` baseline and 1–2 shortlisted
   profiles on the rays with greatest measured change. Authenticate the local tool
   installation, actual input decks, geometry, source units, phase normalization,
   aerosol columns, source/view angle conventions and executed outputs. Use the
   fully spherical-capable route for near-horizon claims; do not silently substitute
   plane-parallel DISORT. Pilot photon/layer convergence and independent repeats.
   If it returns all orders rather than N1–4, report that distinction and quantify
   the N5+ tail using the independent solver; unmeasured tail is not cache error.
6. Check angular and path-integration convergence where g=0.85 or the changed
   vertical profile exposes disagreement. Keep a numerical refinement diagnostic
   separate from each physical intervention. A numerical failure of a particular
   cache implementation does not establish that the atmosphere itself is wrong.

Deliverables: a finalist-versus-`combo025` gallery, spectra/order tables, matched
libRadtran and independent-solver comparisons with uncertainty, and an M3 report.

Gate: a retained candidate must preserve its claimed effect beyond measured
uncertainty in qualified N1–4 output, retain meaningful absolute solar-surround
light, pass or explicitly trade off the registered glow guard, and disclose every
height/angle and held-out-direction tradeoff. Apply M1's comparison thresholds
or record a new justified comparison before using a different tolerance. If the
external solver is unavailable, preserve completed work and label independent
confirmation incomplete; diagnose/retry the affected tool step rather than restart
the parameter campaign or claim full validation. No production default changes.

## Adaptive work, exit gates and completion

- If N1–4 fills the gray at unchanged `combo025`, retain that result and only
  expand physics branches with a distinct demonstrated benefit.
- If physical xy is near neutral while only display brightness is deficient,
  derive common exposure brackets from retained raw RGB. Treat a display change
  as a separate diagnostic; do not alter the atmosphere to conceal tone mapping.
- If increasing H helps only at ground level, investigate the measured geometric
  tradeoff before adding a cutoff or shifting the whole layer upward.
- If results justify a richer scattering mixture or wavelength-dependent SSA,
  record the evidence, distinct mechanism, falsifiable prediction, bounded next
  test, cost and protected cases first. Permit at most two active additions. Such
  a branch does not authorize a production model extension or rewriting old gates.
- Numerical failure holds the affected claim. Adverse evidence rejects that
  candidate/condition. Exhausted hypotheses do not require stopping a promising
  distinct lead; repeated tweaks that only transfer the same defect should stop
  with an explanatory negative result.

Each milestone ends with a concise report: completed work and artifact links,
observations versus interpretation, limitations/verification, and advance/refine/
reject/inconclusive disposition. Share useful images and measurements promptly,
not only at milestone end. Maintain `refinement-results.md` and `status.md` as the
resumption boundary: completed stages, run ids, current findings, next action and
remaining checks. A final report explains the original question, retained and
rejected branches, geometric tradeoffs, unresolved validation and which conditional
work was not triggered. It may conclude that no improved atmosphere is supported.

Favor GPU work. Measure build time, peak CPU/GPU memory, transient scratch and
retained size; cache-building complexity is reported, not a scientific rejection
criterion. A 60-minute point is progress-review guidance, not an automatic stop
while strong progress continues. Extend estimates using measurements and actual
resource availability; do not invent disk approval caps. Use one owned GPU browser
at a time and clean only its verified scratch resources.

All source/output boundaries, immutable-run allocation, provenance, heartbeat
(at least every 30 seconds), terminal manifests, no experimental test-suite rule,
local type checking and self-review follow [design](design.md). Production source,
selected cache, previous sealed runs and suspended studies remain unchanged.
Production promotion requires its own owner selection. No full paper RMSE claim
may compare different media as if the algorithm alone changed; any future matched
paper-atmosphere regression check must preserve that reference atmosphere.

## Review scope and first execution step

One create-plan critique is requested before handoff, read-only and limited to
this plan's causal controls, order/reference matching, resource sequence, visual
evidence and early exit gates. Its completion condition is incorporated feedback
with dispositions recorded here. No standards reviewers, independent audits or
recurring reviews are enabled. Any later discretionary review must name its
specific trigger, smallest scope/question and completion condition before dispatch.
Checkpoint-advisor monitoring remains independent.

The single critique is complete. All seven recommendations were incorporated:
numerical glow retention; held-out halo directions; local and distinct direct/
cache accuracy gates; an immediate expensive-reference pilot; spectrum-level
error norms; explicit counts/control-build estimates; and the early-success path
that avoids unnecessary finalist caches. No recommendations were rejected.

First executable step after selection: authenticate the existing N1 evidence,
register complete `combo025` material/geometry and numerical controls, pilot the
two reference rays, then build one experiment-owned noon cache and collect its
N1 through cumulative N1–4 probes.
