# Measured Clean Horizon Profiles Plan

State: independent execution authorized on 2026-10-24; the bounded M1 investigation
concluded with partial/inconclusive input qualification. [Results](results.md)
record the gate: no complete ambient profile qualified, so candidate M2 and M3–M4
were not triggered. The experiment remains selected for owner review.

## Outcome and baseline

Find a measurement-backed aerosol atmosphere with a visibly clearer globe horizon
at 5-500 m while retaining solar glow. This is exploratory work, not a promised
haze-free profile or production promotion. A supported negative/partial result is useful.
[Design](design.md) owns scientific assumptions, data sources and output contracts.
Production Bruneton, molecular atmosphere, source/display and prior evidence remain
read-only. No arbitrary aerosol loading/SSA/height fitting to a desired screenshot.
Cache-building complexity is reported rather than used to reject promising physics.

Reuse authenticated [earlier profile evidence](../elevated-horizon-validation/alternate-profiles-results.md)
where geometries/inputs match. Continental-clean improved the 5 m limb but increased
solar radiance strongly; the 10 km result does not answer this near-ground question.
Old black-ground/reference or diagnostic images have their original claim boundaries.
Numerical changes must be isolated from profile effects; no new B1 score is claimed.

## M1 - Qualified inputs and achievable clarity

Purpose: distinguish a cleaner near-ground atmosphere from missing observations.

1. Implement minimum checked run/progress/provenance utilities inside this lane.
   Pin production/scientific inputs, tool versions and display configuration.
2. Resolve ATom V2 documentation/file inventory; acquire the smallest useful sample.
   Validate revisions, quality flags, humidity, units and coverage before ranking.
   Log access failures; use a documented alternative endpoint/transport or earned
   fallback. No blind retries or credentials in logs/source/chat.
3. First establish actual minimum altitude/resolution/RH in the one-minute data;
   kilometer bins cannot establish the unobserved surface layer. Inventory the
   entire above-aircraft column, including gaps below stratospheric products,
   and spectral/phase completeness. Record observed, derived and assumed coverage
   separately; a named product is not proof of full coverage.
   Separate observations, supplied derived optics and new assumptions. Do not
   identify g-only phase or missing-data zeros as complete measured optics.
4. Select up to three distinct clean contiguous ascents/descents (or documented
   profile products) and one representative
   control using input-only low-level-extinction/coverage ranking, with AOD reported.
   Freeze selection, time spans/cloud screening and two physically/observationally
   justified surface-layer completions before rendering. Absent surface support
   permits only a labeled extrapolation study, not a measured 5 m claim.
   Never construct a minimum-aerosol composite from unrelated flights. Assess
   horizontally uniform use of each observed profile as an idealized comparison.
5. Authenticate reusable Bruneton/molecular-only rays; obtain missing matched
   cases at 5/100/500 m to bracket the aerosol-free clarity opportunity. Verify
   actual ground heights, units, Sun geometry and full-sphere solver behavior.
   Include authenticated continental-clean colors, or a matched control where
   old inputs differ: it previously gained about 0.095 contrast at 5 m yet did
   not satisfy the requested appearance. A smaller contrast gain is not by itself
   progress beyond that unsuccessful appearance reference.

Early evidence: a selectable coverage/optics table with source identities. Share
matched baseline/molecular-only color strips as soon as available; these show
essential appearance rather than numeric tables rasterized as images.

Gate: missing observations limit a claim rather than reject the atmosphere.
No credible surface completion means no 5 m claim. If molecular-only contrast
barely improves, assess what aerosol changes can accomplish before cache work.
ATom access/completeness failure opens the adaptive source branch below.

Deliverable: M1 inventory and feasibility disposition, selected/held/unavailable
profiles, uncertainty register, frozen cases and a small pilot where possible.
It does not promise qualified candidates. The initial 40-80 minutes is a provisional
inventory/pilot estimate only; full acquisition/optics completion is unknown until
that inventory. Revise immediately from access, coverage and phase findings.

## M2 - LibRadtran appearance screen

Purpose: establish horizon benefit and Sun tradeoffs before building caches.

1. Start with noon at 5 and 500 m. Compare baseline, molecular-only and qualified
   profiles with the same molecular/source/surface model. Follow each geometric
   limb, not local horizontal: initial offsets -1, -0.25, -0.1, -0.02, +0.02, +0.1,
   +0.25, +1 and +3 degrees. Add adaptive local rays to resolve the transition;
   do not fabricate a convincing edge by smoothing sparse samples. Freeze
   Sun-relative azimuth and actual scene direction per design; offsets alone do
   not define a ray. Sample/integrate the intended 1024x576/50-degree camera pixel
   footprint before ranking sharpness. Solar separations are disk-center angles.
2. Measure C=(Y_above-Y_below)/(Y_above+Y_below) at +/-0.1 and +/-0.25 degrees,
   spectra/color, direct surface transmission and path radiance. Define transition
   width/endpoint conventions before ranking. If no plateau exists, report width
   undefined and retain contrast/profiles; do not invent endpoints to pass a gate.
3. Keep surface properties identical within each pair. Black-ground controls
   diagnose transport; final appearance claims need actual app-ground reflectance
   or an explicitly labeled approximation. Primary colors share fixed exposure;
   normal app adaptation is separate. No per-candidate white balance.
4. For promising profiles add 100 m, pre-sunset and sunset. Sample diffuse Sun
   offsets 0.5/1/2/5/10 degrees outside the disk, reporting absolute radiance and
   halo contrast. Add common lower-exposure brackets if clipping obscures differences.
5. Refine spectral/vertical/angular-phase sampling separately. Use three pilot
   replicates to estimate variance/covariance and work, then register a fixed
   five-replicate finalist confirmation batch with photon counts/seed pairing
   before it runs. Shared seeds do not guarantee useful covariance. Report paired
   per-comparison 95% confidence intervals (not familywise winner significance).
   Check surface/phase/upper-column
   sensitivity. Negative/noisy extinction and missing flags are not evidence of clean air.

Registered screening guidance: +0.05 absolute contrast at a primary pair in at
least one priority height, with no resolved decline >0.02 at another height,
earns examination. Require a gain larger than numerical uncertainty and the same
sign under defensible completions. These are screening thresholds, not visual
acceptance. Preserve partial-height benefits as such. Target paired contrast
95% half-width <=0.02 and luminance half-width <=max(5% of Y, 0.1 cd/m^2) on
finalist rays. Near-zero-denominator contrast is unresolved, not set to zero.
Physical completion/phase uncertainty is separate from Monte Carlo confidence.
Insufficient precision is inconclusive. Use the pilot to set a fixed confirmation
batch, not repeated optional peeking until a favorable confidence interval appears.
If further precision is justified, register a new fixed batch/analysis and preserve
the earlier result rather than silently pooling or changing its stopping rule.

Reject a branch if no gain survives uncertainty, it only brightens the horizon,
or it depends on an unsupported surface extension. Report lost Sun glow, glare
and clipping as tradeoffs; refine only from new input evidence, not screenshot
fitting. A visual lead with unresolved precision is not a completed success claim.

Also compare resolved edge visibility, transition width and veiling/path radiance
against the earlier continental-clean result, alongside its glare/Sun tradeoff.
Deliverable: M2 report, actual color strips/solar swatches, spectra/CSV and
per-condition pass/fail/inconclusive decisions. Share useful pairs when available.
Estimate initial batch 40-80 minutes after M1; finalist refinement 40-120 minutes,
revised from the pilot. No global cache construction in this milestone.

## M3 - Faithful renderer and finalist choice

Purpose: separate profile benefit from rendering approximations.

1. Advance at most two distinct M2 finalists. Inventory height/wavelength-dependent
   extinction, scattering, absorption and phase against the CPU/GPU/cache contracts.
   Design an experiment-owned adapter; independently verify integrated extinction.
2. Compare selected rays with qualified libRadtran. Start with production sampling
   and isolate needed refinements. Do not attribute numerical improvement to the
   profile. An exponential or g-only proxy remains a separate approximation.
3. Check conservation, spectral interpolation, phase normalization, layer boundaries,
   physical heights and surface completions. Reference/render uncertainty must be
   smaller than the claimed profile effect, or be resolved before making that claim.
4. Measure one adapter/cache pilot: construction time, logical peak GPU/host memory,
   retained size and frame cost. Update the M4 estimate before wider construction.

Gate: repair concrete scientific/format/ownership incompatibility or hold the
affected claim. Implementation difficulty alone does not reject a promising
profile. If faithful rendering remains unavailable, retain the positive solver
finding and identify the capability gap; the renderer/appearance question remains
open. Do not mislabel an approximate screenshot. A supported negative M1/M2 result
can leave M3-M4 explicitly untriggered without being an execution failure.

Deliverable: M3 report, adapter/input/ray proof and measured render scope.
Duration/resources are currently unknown; M1 inventory and this pilot determine
them. No production source/default/operational-asset changes.

## M4 - Actual scenes and overall conclusion

Purpose: answer the owner's appearance question with full scene renders.

1. Render qualified finalists at 5/100/500 m, initially noon and sunset. Match camera,
   FOV, objects, source, Earth/ground, sampling and display. Include horizon and
   Sun-facing views with Bruneton and molecular-only controls. Add pre-sunset only
   to resolve a distinct tradeoff. Label every diagnostic approximation.
2. Show paired fixed-exposure images plus separate normal-adaptation views. Verify
   receiver height, active medium/cache identity, edge geometry, finite spectra,
   raw/pre-tone values and page/WebGL state. No sharpening, background fade, color
   fitting or geometry trick to manufacture a clear horizon.
3. Verify artifact hashes/parents, compatibility, local types and numerical evidence.
   Measure construction time, size, memory and frame cost in selectable tables.
4. Report which measured profile, if any, clears which horizon; libRadtran agreement;
   surface/phase/upper-column uncertainty; Sun tradeoffs; physical versus display
   changes; untriggered work and evidence that would justify reopening.

Completion: a reviewable provenance-backed answer, including supported negative or
partial outcomes. Actual visual acceptance remains the owner's preference; a
contrast threshold is not that acceptance. No automatic promotion. M4 duration/
resources are unknown until M3's pilot; update before execution of broad captures.

## Adaptive leads, recovery and reporting

Keep at most two new branches active. Before each, record supporting evidence,
distinct mechanism, falsifiable prediction, bounded next proof, cost and protected
cases. Update current plan/status without changing original gates or old results.
Initially permitted alternatives, only if earned:

- Owner addition (2026-10-24): if ATom/public derivatives are unsuitable, inspect
  retained ARM data and available low-aerosol ARM periods. Prefer co-located
  surface measurements and extinction profiles; column AOD alone cannot supply
  vertical placement or phase. Reuse earlier downloads read-only and record any
  account dependency without logging credentials. This does not reopen the ARM experiment.
- ATom access/surface/optics gaps: examine ACTIVATE co-located lidar/in-situ/
  polarimeter data or a published coastal-polar profile with better surface coverage.
  Account for ACTIVATE's documented low-extinction retrieval biases.
- Low column but surface haze: select another observed vertical distribution using
  the same input-only criteria. Do not artificially move particles upward.
- Strong molecular-only haze or display whitening: separate surface reflectance/
  exposure effects with a matched diagnostic. Explain limits; production tone-map
  changes remain outside this experiment.

Log download failures and move to credible alternatives instead of repeatedly
failing requests. Credentials/access are dependencies, not scientific failures.
Wall time/disk estimates are review points, not vetoes. Stop expanding branches
without distinct predictions, but follow supported leads after initial hypotheses end.

[Status](status.md) owns the resumption boundary; create an execution log when
execution begins. Each milestone ends with linked deliverables, observations versus
interpretation, limitations/verification/cost and an advance/refine/reject/inconclusive
disposition. Share useful evidence immediately. Follow immutable runs and the
30-second progress contract. Repair affected work into new runs; preserve old evidence.

One read-only create-plan critique is limited to this draft's near-ground goal,
data completeness, comparisons, gates, sequencing and adaptive scope. Incorporate
suggestions unless opposed to owner goals; record exclusions and reasons. No
additional discretionary reviews requested. Contained standards reviewers/audits
remain disabled; self-review, types and scientific/visual proof apply. Checkpoint
monitoring stays active. This planning critique introduces no approval pause.

First executable step after execution is selected: M1 access/optical-completeness
inventory and smallest pilot. No defensible overall duration exists until access,
surface coverage and phase inventory are known. The bounded M2 batches have their
provisional estimates above; update them from the first actual solver timing.
Downstream scene time remains unknown. Acquisition, source audits and matched
control calculations are complete; see the results rather than repeating setup.

## Plan critique record

One independent read-only critique completed. All seven recommendations incorporated:
surface-layer feasibility first; full intermediate/upper-column audit; explicit
continental-clean appearance benchmark; azimuth/pixel-footprint registration;
95% precision/fixed-batch procedure with dark-ray floor; separate observed/derived/
assumed qualification and contiguous profile selection; provisional estimates and
explicit untriggered/solver-only outcomes. No suggestions rejected. No additional
review pass or approval gate introduced. Subsequent experimental results are owned
by the linked results document; the critique itself is planning evidence.
