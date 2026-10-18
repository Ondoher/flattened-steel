# H75-H82 independent execution

Status: completed with a negative candidate disposition. The owner selected the
[geometry-driven refinement plan](geometry-incoming-refinement-plan.md).
Production is unchanged. No dedicated standards reviewers/audits are used;
checkpoint advice, local types, scientific proofs and immutable evidence remain.

## Decisions

1. Output boundaries follow explicit experiment instructions, overriding the
   independent-execution skill's generic temporary-root default. New source stays
   under its experiment, output under its ignored root, this durable summary here.
2. Preserve H67/H68/H70 data and source runs; reuse compatible incident samples,
   independent batches and raw reductions rather than recompute them.
3. Use one GPU job at a time and the previously validated full reference kernel.
   Continue evidence-driven alternatives while useful progress is measurable;
   exhausting the initial hypothesis list is not a completion condition.
4. Current retained evidence is 776671024 bytes (740.691 MiB), scratch0, free disk
   about 103GB. Initial tests plus development references and several exploration
   waves can need80-140 MiB new evidence. Under the owner's explicit AFK authority,
   raise retained disk from 768to896 MiB; preserve the 1 GiB scratch/free-disk bounds
   and every prior artifact. This is disk retention, not a product cache limit.
5. Native direction-table feasibility? Actual native dimensions are48positions,
   180solar rows and 4374outgoing slots. At4096 incoming directions, a full
   direction table alone would be540 MiB, whereas procedural rule metadata/base
   streams are about 0.30 MiB. Estimated2J+2L fields total 558.3 MiB. Hardware caps
   accept the dimensions. This is an estimate and implementation route, not a
   measured full builder or qualification of its ground-boundary logic.
6. How to validate species accuracy cheaply? Reuse existing pure N2 Rayleigh/
   Mie tallies at means12/13, aggregate the same32 history batches as total N2,
   and check closure. Exact Toronto phase mass comes from the normalized cosine
   table integral, not the coarse grid itself. Preserve aligned band histories
   for paired-reference comparisons, independent group seeds across locations.

7. Which placement carries forward? Midpoint. At1024 the old layered endpoint
   improves Toronto mean/worst to 3.05%/5.60% from midpoint4.53%/12.61%, but fails
   the tighter.5% manufactured geometry screen and worsens paper mean error.
   Sun-only placements are close at 1024; preserve historical endpoint scores
   and use complete midpoint controls in the allocation contrasts. No claim
   that placement alone fixes the layered family.
8. New references use the unchanged full validated stochastic kernel and retain
   pure N2/species tallies. Shortening the kernel previously lost the GPU context;
   no repeat of that failed optimization. New6-target references are development,
   with the 12 reserved geometries still unexposed.
9. Accepted 00461 qualifies all 60 local references; maximum relative95% half-width
   is 2.59%. These are uncertain independent estimates, not exact answers. Retain
   the frozen paired-reference bootstrap and coupled sensitivity check.
10. H76 allocation result does not earn advancement: across30 cases/profile,
    Sun 1024 mean/worst are paper.68%/2.66%, Toronto 1.66%/5.32%; Sun-heavy is
    1.02%/2.91% and 3.45%/18.52%. Fixed-heavy is.94%/2.05% and 4.08%/25.12%.
    Toronto has resolved protected-case regressions for both layered variants.
    Continue additive/width diagnosis and distinct H79 leads rather than expand
    these allocations into native recurrence.
11. Reuse recent matching physical node arrays as well as H70 packets. Authenticate
    each parent run/file and recompute mixture weights, raw/normalized/species
    sums; nominal standalone work remains charged. This avoids retracing complete
    controls while preserving an explicit input identity per reused packet.
12. H77/H78 additive result: paper mean/worst.77%/1.65% at width .1 and
    .83%/1.52% at.03; Toronto 3.33%/18.13% and 2.82%/13.44%. Sun 1408 is
    .78%/2.00% and 1.15%/3.71%. Added layers do not earn advancement.
    Keeping physical Sun positions does not preserve their weights or integral.
    The width trend supports one further diagnostic bracket, but its paired
    20% worst-improvement upper margin remains+.19percentage points: inconclusive.
13. Lead L1, registered00465: distinguish narrow-lobe resolution from scalar
    phase-mass error using k .35/.2 and 1024/2048 counts. Only three new layered
    variants; complete same-k/count Sun controls prevent false attribution.
    Lead L2, registered00468: width .01 plus matched width transfer to heavy B.
    Both use the same two atmospheres,10 development targets and unchanged
    normalization. Neither exposes reserved validation or claims adoption.
14. L1 outcome,00467/00469: sharper/doubled layered rules reduce Toronto mean/
    worst from 3.45%/18.52% to.85%/3.46%, but complete Sun 2048 at k .35 is
    .68%/2.04%, with slightly better paper mean/worst as well. Reject constant
    focus/count as a full-build candidate; no4096 expansion of a dominated rule.
    Constant Sun k .2 fails elsewhere: paper high-altitude worst19.27% at 1024,
    Toronto worst18.44% (and 22.80% at 2048). Near-ground improvement cannot justify
    constant sharp focus across the whole atmosphere.
15. Distinct lead L3,00470: that altitude-dependent tradeoff predicts a useful
    geometry-conditioned focus. Register Sun-only and sparse-dusk B at 1024;
    compare sparse B with/without focus adaptation. k transitions from.2 in
    low-altitude dusk to.35 in day/high atmosphere; same physical rule for
    both materials and all outgoing probes. Sparse dusk allocation4/236/16
    retains small broad/horizon layers, with original day/high counts. Both
    frozen sample placements pass the 2% local mathematical preflight. Sparse
    variants fail the.5% finalist screen at some targets and need a repair before
    advancement; a radiance repeat is still mandatory before fresh validation.
16. L2 outcome,00471/00472: narrowing from.03 to.01 reverses the Toronto gain.
    Additive mean/worst become3.17%/15.67%; heavy B becomes3.01%/17.39% versus
    .03's2.35%/12.24%. Stop the width-only branch: it remains behind complete
    controls and the bracket exposes nonmonotonic sampling rather than a simple
    benefit from narrowing indefinitely.
17. L3 outcome,00473/00475: adaptive Sun-only avoids the high-altitude paper
    blowup but Toronto still has a16.02% protected-case error near the ground
    looking sideways. Sparse B and adaptive sparse B give worst8.50%/15.67%
    and remain mathematically ineligible as finalists. Reject these formulas;
    adapting by Sun/height alone does not resolve every outgoing integrand.
18. Why one more distinct wave after those failures? New directional evidence
    in00474 shows the heavy-B width .03 base stream has a coincident pair at
    [0.9998779222,0,.015625], carrying 13.79% of the red Toronto aerosol angular
    numerator. Reflection completion forces phi0 when a stream half-count is
    even. Coincident cubature is not intrinsically invalid; its alignment with
    a sharp lobe is a concrete sampling hypothesis. L4 registers half-golden-
    angle shifts for base only, horizon only, and both, preserving Sun nodes,
    counts and PDFs. The shift follows a structural criterion, not score search.
    These three variants pass local and fine preflight at both frozen placements.

19. L4 outcome,00476/00477: base-only shift changes the original red witness
    from+12.24% to-2.02%, horizon-only leaves+12.93%, and both shifts give-1.42%.
    The full panel exposes transferred errors: Toronto worst11.97% for base only
    and 9.63% for both. Neither qualifies against complete controls. This supports
    the local alignment mechanism without adopting a fixed phase as a correction.
20. L5 stabilization,00478: average raw species integrals and phase mass before
    normalization, sharing identical corresponding Sun rays. Base-only and
    base+horizon ensembles use1152-1280 and 1280-1408 directions. They still lose
    to competitive complete controls; exact shared values and algebraic closure
    3.65e-15 qualify this derivative, not a new GPU build-time measurement.
21. L6 attribution,00483: saved finer base/horizon rays from 00467 allow one more
    distinct cheap test. Hold original proposal-mixture coefficients and Sun
    nodes fixed while refining component quadrature; use weight n[j]/m[j]
    divided by the original mixture density. Base refinement helps more than
    horizon refinement. Both together give Toronto 1.67%/5.23% at greater cost
    than Sun 1024's1.66%/5.32%; no rule passes improvement/equivalence. The last
    two follow-ons, ensembles and component-only refinement, supply no further
    transferable benefit or new discriminating lead. End the campaign negative,
    rather than continue an unsupported parameter search or stop on a time cap.
22. Extra reference histories? No: large protected Toronto regressions and
    competitive-control failures decide the tested candidates. Small paper
    differences remain reference-limited and are not mathematical wins. Do not
    spend histories to disguise missing candidate benefit.
23. Which conditional work remains? No prospective finalist passes primary
    development. Second-placement radiance, reserved H80 validation, native
    physical-direction/ground proofs, N4/B1 and final scenes are untriggered.
    Both-placement mathematical preflight is retained, but is not radiance
    robustness. The12 reserved targets remain unexposed. No production change.
24. Final proof recovery:00480 could not spawn nested Node in the sandbox
    (EPERM).00481 then caught a type error in the diagnostic error-code access;
    use Error.message. Preserve both failed packaging receipts.00482 passes
    initial verification;00484 supersedes it after the component refinement.
    No numerical GPU run failed, no original payload was replaced or retraced.
25. Routine preparation fixes occurred before allocation: shorten names to the
    allocator's16-character limit, and check actual duplicate streams instead
    of assuming every component half-count is even. Normalize only owned changed
    files to LF after Windows helper edits, avoiding whole-file line-ending churn.

## Completed work and verification

Accepted 00457-00479 preserve the controlled screens, registrations, matched
references, exploration, replay and figures.00483 adds180 derived component-
refinement cells. Accepted 00484 verifies25 accepted parent runs, including
immutable inventories/hashes, progress intervals, source stability at sealing,
cleanup, all 60 reference precision gates, exact geometry/phase/numerator replay,
180 source-index/weight/incident derivative replays, and the complete local type
check. Failed 00480/00481 remain explicit. `git diff --check` passes.

There are2568 screen cases including reused controls, plus 120 ensemble and 180
component-refinement derivatives. The [results](geometry-incoming-results.md)
own the final comparisons, figures, local alignment attribution and limits.
Images were inspected: placement, allocation, focus/count, component shifts,
ensembles, physical nodes and component-only refinement. No dedicated standards
reviewers/audits were run. Checkpoint advice remains separate from science/types.

## Timing and resources

- First registered run to final00484 receipt:17:09:11.754-18:05:45.051 UTC,
  56.6 minutes. This includes development, setup, analysis, figures and recovery;
  it is not pure GPU or model-reasoning time. Documentation/checkpoint follow.
- Hardware: NVIDIA RTX2060 through ANGLE D3D11; one owned GPU job at a time.
  3,385,344 new continuous-L1 direction/path-resolution evaluations;
  2,423,808 compatible evaluations reused. These include64/128 path controls,
  not3.4million independent scattering histories.
- New cache-free references:11,796,480 full path histories including controls,
  36 new spectral geometry cases plus 24 reused, all 60 qualified. Retained kernel
  execution totals121.75 seconds. New continuous-L1 measurement calls total
  1142.14 seconds, including page/GPU/compilation overhead; setup, provenance,
  verification and analysis are outside those call totals.
- Retention at final seal893920347 bytes (852.51 MiB), up111.82 MiB from start,
  below 896 MiB. Scratch0; about 95.8 GiB free. Earlier evidence is untouched.
- Native4096 estimates remain estimates: a full row-dependent direction table
  would be540 MiB, versus about.30 MiB procedural metadata; conservative2J+2L
  fields558.3 MiB. No native builder was implemented or benchmarked.

## Handoff and checkpoint

The requested campaign is complete; the experiment remains open. No job or new
campaign is selected. There is no external blocker. A new owner-selected
hypothesis/plan is needed before further experimental execution. Full-cache,
paper-RMSE, twilight and production implications remain unqualified conditional
work, not unfinished tasks within this negative disposition.

Checkpoint adviser disposition: CHECKPOINT_URGENT, coherent completed negative
result. Local checkpoint message: `Reject geometry-driven incoming refinements`,
with its three suggested summary bullets. The independent-execution skill
preauthorizes this local commit. Git history owns its resulting commit identity;
no push is selected.
