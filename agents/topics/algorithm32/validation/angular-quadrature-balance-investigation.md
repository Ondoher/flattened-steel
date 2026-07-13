# Algorithm32 Angular-Quadrature Balance Investigation

Status: closed. The causal mechanism is diagnosed and the shared
reflection-completed ordinary Fibonacci-68 construction is selected and
promoted for both local and distant production.

## Goal

Find an incoming-direction strategy that removes the Sun-relative higher-order
scattering imbalance without sacrificing the original Fibonacci domain's
general angular accuracy. The investigation must distinguish symmetry,
integral accuracy, directional representation, and execution cost rather than
treating any one of them as a substitute for the others.

The working baseline is the original source-oriented Fibonacci-34 domain. The
paired and paired-plus-rotated constructions are treated as earlier, naive
attempts to correct one weakness; they are diagnostic evidence, not the design
starting point or an accuracy authority.

## Current Explanation

The visible lobe is most consistent with an under-resolved anisotropic Mie
integral whose finite directional residual remains locked to the Sun and is
reused coherently through higher scattering orders. Increasing balance can
reduce that residual without necessarily improving the complete radiance
integral. A candidate therefore must be judged against a converged numerical
authority as well as symmetry.

Current controls now make the plane imbalance specific. Completing the exact
ordinary Fibonacci-34 set with `[x,-y,z]` reflections reduces the local
centered maximum from `108` to `1` RGB byte at the unchanged native 15 view
intervals. The complete 17-condition distant B1 aggregate simultaneously
improves from `11.925778` to `11.820392` mW. The reflected-ordinary-68 set is
therefore the first candidate to pass both the local causal boundary and the
user-required distant aggregate gate. It is now the shared production default.
Rotation and performance measurements remain diagnostics for later
optimization rather than correctness gates.

## Ranked Weaknesses Of Original Fibonacci-34

The ranking is specific to the current `g=0.7` higher-order sky-scattering
problem. Related entries describe different parts of the same causal chain and
must not be counted as independent error sources.

| Rank | Weakness                                                        | Expected negative effect                                                                                                                                                          |
| ---: | --------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
|    1 | Too few directions for the forward Mie peak                     | Dominant. Thirty-four samples cannot resolve the narrow, high-energy angular feature; existing phase-only convergence results directly support this.                              |
|    2 | Uniform rather than phase-aware sample allocation               | Most samples are spent in smooth regions while the forward Mie region needs much denser coverage, making the effective resolution lower than the nominal count suggests.          |
|    3 | Reuse of the same source-oriented set at every scattering order | The same quadrature residual is propagated into later orders instead of averaging away, allowing a coherent Sun-relative structure to appear by J4.                               |
|    4 | Orientation dependence and incomplete rotational balance        | Rotating the set changes the result. This controls where unresolved Mie energy appears and is the leading explanation for an error shaped like a localized secondary source.      |
|    5 | Inaccurate higher spherical moments                             | Constants and broad fields are represented well, but the set does not accurately integrate enough higher angular frequencies for anisotropic multiple scattering.                 |
|    6 | Coupling of integration nodes and directional-cache nodes       | A distribution suited to storing broad radiance is not necessarily optimal for integrating a sharp phase function, so one 34-point domain must compromise between two jobs.       |
|    7 | Uneven local spacing and finite spherical holes                 | Fibonacci sampling is quasi-uniform rather than exactly uniform; the largest holes can miss important forward-scattering structure depending on orientation.                      |
|    8 | Imperfect low-order moments                                     | These can introduce net directional bias, but the small measured Rayleigh integration error indicates that they are not the dominant current failure.                             |
|    9 | No guaranteed spherical-cubature degree                         | The construction provides no exactness guarantee for spherical harmonics through a specified degree; this is a limitation of assurance rather than a separate physical mechanism. |
|   10 | No local error estimate or adaptive refinement                  | This does not create the numerical error, but prevents the calculation from detecting and selectively refining the poorly resolved angular region.                                |

The leading causal chain is:

```text
sharp Mie peak
  -> insufficient and inefficient angular sampling
  -> orientation-dependent integration residual
  -> coherent reuse through later scattering orders
  -> visible Sun-relative lobe at J4
```

## Why Naive Balancing Is Insufficient

Exact antipodes and rotated or reflected copies primarily reduce first-moment,
odd-component, and orientation-specific imbalance. They do not directly add
the resolution needed by the forward Mie peak, do not make uniform sampling
phase-aware, and may move effective weight away from directions that happened
to sample important radiance well.

A balanced candidate can consequently improve mirror symmetry while worsening
the total radiance integral. The Bruneton-style 12-by-24 diagnostic demonstrates
that distinction: at 10:15 its mirror relative RMS improves from `0.032399` to
`0.010635`, while its B1 spectral RMSE worsens from `10.979203` to `18.700868`
mW. Symmetry is therefore a necessary diagnostic, not an accuracy authority.

## Accuracy Boundaries

Every candidate must be evaluated independently on these boundaries:

1. **Angular-integral accuracy** against a substantially denser binary64
   authority for representative Rayleigh, Mie, ground, and transported
   radiance integrands.
2. **Rotation stability** across deterministic global rotations of the
   candidate domain, reporting worst-case as well as average error.
3. **Higher-order propagation** at J2, J3, and J4 so the first order at which a
   residual becomes coherent is visible.
4. **Directional-field representation** separately from integration, so a
   quadrature improvement is not confused with a cache-reconstruction change.
5. **Local and distant geometry** through equivalent controls because the
   visible failure class occurs on both paths.
6. **External sky agreement** through the reproducible B1 boundary only after
   the candidate passes the direct numerical controls.
7. **Execution diagnostics** for time, memory, shader preparation, and GPU
   completion. These inform later optimization but cannot override default
   correctness.

## Historical/Current B1 Order Localization

The retained historical paper-profile J2 boundary and a newly generated
current-production GPU J2 boundary use the same physical-profile hash and the
same declared 40/20/34/48, W27, and J2 controls. Across their 1,377 rows and
55,080 spectral values, the current-minus-historical difference has absolute
RMS `0.0018619918350842445`, relative RMS `0.04673336118172676`, and maximum
absolute value `0.016548626485397705`. The current J2 B1 aggregate is
`14.294659` mW, compared with the retained historical `14.153018` mW. The
divergence is therefore already present at J2 and is far larger than the
measured current CPU/GPU residual.

The provenance names for the incoming domain differ, but this is an identity
rename rather than a numerical change. Regenerating the historical formula in
the source-local frame and comparing it with the 34 pinned current vectors
gives maximum component difference `2.220446049250313e-16`; both use exact
weight `4*pi/34 = 0.36959913571644626`. Their source-frame construction also
uses the same positive-X source axis, reference-axis switch, projected Z axis,
and `cross(Z, X)` Y axis.

The source audit corrects the earlier representation hypothesis. The retained
run also reconstructed cumulative `J1 + J2` from W27 during final-view
integration; it did not evaluate direct J1 continuously at the requested view
direction. The exact-J1 replacement and W27/W39/W55/W81 sweep are therefore
current-path sensitivity diagnostics, not retained-parity counterfactuals.

The dominant retained/current difference is the benchmark/world-frame
orientation. The retained benchmark was +Z up while current production is +X
up, and the component mapping is a determinant-`-1` X/Z reflection. Because
the finite Fibonacci and W27 frames use a fixed global +Z reference, this
changes their physical orientation/handedness relative to the observer and
view grid. A current-production-only retained-frame counterfactual across
`09:30`, `11:15`, and `13:30` reduces value-level J2 RMS by 97.3-98.4% in every
condition and 98.06% combined. The B1 scores move slightly upward, so this is
parity causation rather than evidence of better physical accuracy.

Order differences isolate later additions independently of J1. The
current-minus-retained `J3 - J2` increment has absolute RMS `0.001102`, and
`J4 - J3` has absolute RMS `0.000641`. The first and largest uncorrected
higher-order boundary is therefore J2. The next diagnostic evaluates
`L1 -> J2` at the exact requested outgoing direction before considering any
single-cache encoding.

That local J2 diagnostic now confirms monotonic outgoing-resolution
convergence across three Sun conditions. Combined normalized reconstruction
RMS is `0.001941` for W27, `0.000838` for W39, `0.000554` for W55, and
`0.000210` for W81. Denser discrete outgoing support therefore decreases the
interpolation error as expected. W81 is diagnostic rather than a selected
cache: its complete 39,366-direction cubed sphere is nine times W27 storage,
and local J2 convergence alone does not establish an observable improvement.

The sparse touched-direction candidates have now been propagated through the
complete production 40-interval final view path for the three displayed B1
conditions. The scored boundary combines exact binary64 J1 with GPU-R32F pure
J2. Three-condition RMSE is `13.868428` mW at W27, `13.867343` at W39,
`13.866530` at W55, and `13.866222` at W81. All four widths produce the same
paper-rounded per-condition scores: `12.7`, `13.7`, and `15.1` mW. Thus the
89.2% local interpolation-residual reduction from W27 to W81 changes this B1
observable by only `0.002206` mW, or about 0.016%. Outgoing-grid density by
itself is not the retained-parity correction and no width is selected.

Generated diagnostic evidence is under
`tmp/algorithm32-bruneton-paper/order-localization-current/` and the numbered
`tmp/algorithm32-bruneton-paper/exact-j1-diagnostic/` folders. It is ignored
local output and is not an oracle or production input.

## Constraints

- Keep atmosphere, Mie asymmetry, albedo, spectral basis, path sampling, cache
  geometry, scattering depth, and display conversion fixed within a comparison.
- Do not use a view-tuned rotation or choose a candidate from one camera.
- Do not change production defaults during candidate diagnosis.
- Do not accept a candidate solely because it removes the visible lobe or
  improves mirror symmetry.
- Do not accept a candidate solely because it improves B1 aggregate RMSE.
- Preserve the original scattering recurrence unless a later, explicit design
  decision opens an architectural experiment.
- Store each generated diagnostic under a new sortable numbered folder beneath
  `tmp/blue-glow-diagnosis/tests/`.

## Investigation Sequence

### Step 0: Freeze Authorities And Measurements

- Select dense binary64 angular-integral controls for the forward Mie peak,
  smooth Rayleigh field, representative transported fields, and ground term.
- Freeze rotations, scattering orders, local/distant conditions, and reported
  error norms before evaluating candidates.
- Record original Fibonacci-34 on every boundary.

Gate: the baseline is reproducible and each metric has one stated authority.

### Step 1: Separate Count, Allocation, And Coherence

Change one property at a time:

- increase Fibonacci count without balancing or changing allocation;
- keep count fixed while changing only deterministic per-order orientation;
- keep count fixed while changing only allocation near the forward Mie region;
- compare shared versus independent integration and representation domains in
  an isolated diagnostic, without promoting an architecture change.

Gate: identify which of ranks 1 through 6 materially controls integral error,
rotation sensitivity, and J4 lobe formation.

### Step 2: Construct Minimal Candidates

Start from ordinary Fibonacci coverage and add only the mechanism supported by
Step 1. Candidate families may include denser ordinary Fibonacci, deterministic
per-order rotations, correctly weighted phase-aware refinement, or a separated
integration domain. Exact antipodes or reflection completion may be added only
when the measured residual specifically requires that constraint.

Gate: a candidate must improve the causal numerical boundary rather than only
its rendered symptom.

### Step 3: Qualify Accuracy And Stability

Run direct authorities, rotation stress, J2-J4 propagation, equivalent local
and distant controls, and the complete B1 boundary. Reject candidates with a
material regression on any mandatory default-correctness boundary.

Gate: one candidate has a documented accuracy envelope and no view-specific or
orientation-specific dependency.

### Step 4: Evaluate Cost And Select A Default

Measure GPU completion, cache storage, shader preparation, and application
behavior only after accuracy qualification. Compare user-selectable performance
tiers without weakening correctness at the maximum/default setting.

Gate: explicitly select, revise, or reject the candidate. Promotion remains a
separate production decision.

## Closeout

Production now uses the shared reflected-ordinary-68 owner while retaining the
existing final-view interval policy. The complete production GPU B1 boundary
and figures were regenerated at aggregate RMSE `11.820392` mW. Node, B1
contract, Flat32 browser, and type gates pass. Regeneration of the stale
native-N4 binary64 CPU oracle was stopped when this topic closed and remains a
later Algorithm32 validation task; it does not reopen the retired Star lane.

## Current Decision Record

| Question                                                                 | Current answer                                                     |
| ------------------------------------------------------------------------ | ------------------------------------------------------------------ |
| Is original Fibonacci-34 the investigation baseline?                     | Yes.                                                               |
| Is paired Fibonacci treated as the presumed solution?                    | No; it is a naive balance counterfactual.                          |
| Is the lobe sufficiently localized to anisotropic higher-order sampling? | Yes, as the leading tested explanation.                            |
| Does improved symmetry establish improved accuracy?                      | No.                                                                |
| Has a replacement direction strategy been selected?                      | Yes; reflected ordinary Fibonacci-68 is the shared production default. |
| What is the next gate?                                                   | None in this investigation; return to extraterrestrial production integration. |
