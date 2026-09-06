# Extraterrestrial Fact Accounting

Status: current evidence and citation disposition. This document records where
each extraterrestrial formula or value belongs; it is not a second fact table
or experiment register.

Paper-facing values and formulas are owned by
[`algorithm32-working-facts.md`](../../../../references/algorithm32-working-facts.md).
Only [`references.md`](../../../../references/references.md) supplies numbered
external citations, and only [`experiments.md`](../../../../references/experiments.md)
makes a local experiment referenceable. A retained runner, imported record, or
former-repository result is not citable by itself.


## Generic Transport And Geometry

| Boundary | Working-fact owner | Current support | Remaining accounting |
| --- | --- | --- | --- |
| Point and extended sources own different spectral measures and units. | Incorporated into `FACT-A32-002313` and `FACT-A32-003025`. | PBRT radiometry, AMA `[8]`; selected interface contract. | XA1 and XA2 must exercise kind/quantity/unit rejection. |
| A point source is transported at its exact direction and distributed as `L_lambda,i = V_s T_lambda(omega_s) F_lambda p_i / Omega_i`. | `FACT-A32-002313`. | E4 (`EXPERIMENT-A32-WF-000011`) independently establishes only `L = F p / Omega`; it is not yet official. | Repair and promote E4, then use XA1 for the typed source, exact solid angle, visibility/transmittance ordering, and no-second-transmittance boundary. |
| Point-response mass includes on-frame and off-frame support and is not edge-renormalized. | `FACT-A32-002315` and `FACT-A32-003023`. | E4 retained standalone runner/result. | Repair E4 terminology and stable reporting before promotion; XA1 adds the coupled source boundary. |
| Exact perspective pixel solid angle is the sum of two ordered spherical-triangle solid angles. | `FACT-A32-003034`. | Van Oosterom and Strackee, AMA `[11]`. | XA1 must independently check corner ordering, positivity, whole-frustum closure, and camera/raster cases. |
| Extended radiance integrates over ordinary or cosine-projected solid angle; a uniform disk has projected solid angle `pi sin(alpha)^2`. | `FACT-A32-002289` and `FACT-A32-003024`. | PBRT, AMA `[8]`; E5 (`EXPERIMENT-A32-WF-000012`) is a retained standalone analytic experiment. | Promote E5 after stable-ID and artifact-reporting repair. The E5 value `0.00465 rad` is only a fixture radius, not a solar fact. |
| Each extended direction owns its own visibility and transmittance and the pixel result is divided by exact pixel solid angle. | `FACT-A32-003025`. | E6 (`EXPERIMENT-A32-WF-000013`) establishes the per-direction weighted sum but is not official. | Repair/promote E6; XA2 must add exact-pixel averaging and detect center-direction, second-transmittance, and second-coverage errors. |
| Path, transported endpoint, extended, and point radiance add once before Color. | `FACT-A32-003026`. | E7 (`EXPERIMENT-A32-WF-000014`) establishes linear spectral closure but is not official. | Repair/promote E7; XA2 must exercise the coupled extraterrestrial ordering. |
| High-resolution source density is conservatively reduced to the shared 15-bin density basis. | `FACT-A32-003000`, `FACT-A32-003016`, and `FACT-A32-003020`. | Spectral-density integration and the pinned Bruneton basis are supported by AMA `[8]` and `[12]`. E8 is retained, nonofficial evidence only. | XA1--XA3 consume this basis; they do not select a second source basis. |
| Finite spherical-body visibility uses the standard ray/sphere quadratic. | `FACT-A32-001695`. | PBRT spheres, AMA `[9]`. | Production fixtures may test mechanics; an astronomical ephemeris claim needs a separate objective experiment. |


## Legacy Lane Reconciliation

The frozen discovery catalog still labels several former celestial-cache
statements as legacy facts. That classification is not current authority. The
paper-facing content is folded into the current working-fact owners below;
cache topology and implementation policies do not survive as separate facts.

| Legacy item | Current accounting |
| --- | --- |
| `FACT-A32-001564`, camera-independent transported celestial cache | Excluded. It describes the rolled-back celestial contribution-cache architecture, which is neither selected production design nor a physical fact. No current working-fact owner replaces it. |
| `FACT-A32-001565` and `FACT-A32-001566`, extended field and zero outside angular support | Folded into `FACT-A32-003025`: the integration domain is the pixel/source-support intersection and its integrand is `V(omega) T_lambda(omega) L_lambda(omega)`. XA2 must establish the coupled boundary. |
| `FACT-A32-001567`, extended footprint integration policy | Not a separate paper fact. Its physical integral is owned by `FACT-A32-003025`; quadrature and footprint realization remain local implementation decisions tested by XA2. |
| `FACT-A32-001568`, `FACT-A32-001569`, and `FACT-A32-001570`, point field, placement, and response | The physical point measure and `F_lambda p_i / Omega_i` conversion are folded into `FACT-A32-002313`. Exact-direction ordering belongs to XA1; the chosen response family and placement realization are engineering policy, not facts. |
| `FACT-A32-001571` and `FACT-A32-001572`, response conservation and no edge renormalization | Folded into `FACT-A32-002315` and `FACT-A32-003023`, including explicit on-frame/off-frame partitioning. E4 must be repaired/promoted and XA1 must establish the typed coupled boundary. |
| `FACT-A32-001573`, `FACT-A32-001574`, `FACT-A32-001575`, and `FACT-A32-001580`, celestial sum, pre-display composition, no second transmittance, and transparent spectral addition | Folded into `FACT-A32-003026`. E7 supplies only a promotion candidate for linear closure; XA2 must detect duplicate transport and coupled composition errors. |
| `FACT-A32-001576`, exact-source foreground gating before point response | Folded into `FACT-A32-002313`; XA1 must exercise exact-direction visibility before response distribution. |
| `FACT-A32-001577`, receiver-dependent finite point measure | Deferred to a future finite-distance point-source class and distance law. It is not required by the distant Sirius fixture and is not a current paper fact. |
| `FACT-A32-001578`, interpolation across discontinuities | Not a separate paper fact. Support-aware sampling is an implementation policy; any paper claim about it requires a bounded formula and an objective XA2 case. |
| `FACT-A32-001579`, angular coverage applied once | Folded into `FACT-A32-003025`: angular occupancy is already in the integral, so no later scalar coverage multiplier is permitted. XA2 must test the wrong route. |
| `FACT-A32-001581` and `FACT-A32-001582`, opaque support suppresses only behind contributions and preserves front path radiance | Optional paper scope only. Do not restore these as working facts unless the paper makes an opaque depth-ordering claim and XA2 is expanded to establish both cases objectively. They remain implementation invariants otherwise. |
| `FACT-A32-001583` through `FACT-A32-001589`, open mutual-depth/subpixel policies, missing CPU qualification, and direct-receiver semantics | These entries describe gaps or local policies, not facts. Mutual depth or visibility belongs in XA2 only if it enters paper scope; receiver/cache query semantics belong to the future cache/API design; the missing CPU oracle is addressed only by an official experiment. |
| `FACT-A32-001590` through `FACT-A32-001604`, spherical cache queries, coordinates, horizon interpolation, and exact-source response queries | The exact-source consequences in `FACT-A32-001598`--`001601` are folded into `FACT-A32-002313` and require XA1. The remaining coordinate, march-query, interpolation, and qualification statements belong to the future cache design; they are not current extraterrestrial paper facts. |
| `FACT-A32-001605` through `FACT-A32-001621`, flat coordinates, top-plane reductions, and finite-local-source qualifications | Deferred in full to the later flat/local phase. That phase must select and establish its own bounded formulas and objective experiments; none of these legacy entries is current paper evidence. |


## Source-Specific Accounting

| Source item | Disposition |
| --- | --- |
| Canonical 15-bin Sun packet | Retained as `FACT-A32-003016`. It remains the sole planned runtime solar owner. XA3 must reproduce its identity and bounded-band comparison against TSIS without creating a second solar packet. Historical imported integrals are comparison targets, not facts. |
| TSIS-1 HSRS v2 | Retained as `FACT-A32-003029` and AMA `[2]`. XA3 must independently reproduce the selected 360--830 nm binning, uncertainty treatment, and comparison. |
| Solar physical radius | Not a selected input. The source descriptor owns angular support directly, so the former `695,700 km` ER6/M5 packet value is not a current paper fact. |
| Finite-Moon radius and ephemeris geometry | Deferred to the [resolved-Moon follow-up](../../production-algorithm32/color-celestial/moon-follow-up.md); no active first-family fixture consumes a lunar radius, finite placement, or depth. The former `1,737.4 km` and returned case states remain candidates, not current facts. The eight ER6/ER8 cases cannot select or validate them. |
| Astronomical unit and Sun--Moon distance conversion | The exact AU definition is externally valid, but no current production descriptor consumes it. XA3 must declare and cite any AU conversion required by the selected LIME transformation before it returns to working facts. |
| CALSPEC Sirius | `FACT-A32-003035` owns the exact `0.01` conversion from the retained CALSPEC FLAM unit to `W m^-2 nm^-1` and the no-magnitude-rescaling boundary, with AMA `[1]` as external support. CALSPEC remains the planned absolute Earth-observer spectral-irradiance owner; XA3 must reproduce data-quality selection, application of the conversion, exact 15-bin reduction, and uncertainty handling before the source is called calibrated. |
| Rieke Sirius anchors | AMA `[3]` supplies independent visible and near-infrared comparisons. No anchor value or residual becomes a working fact until XA3 predeclares and reproduces the comparison and uncertainty rule. |
| LIME lunar model | AMA `[6]`, `[7]`, and `[10]` are retained candidates for disk-integrated lunar radiometry only. The deferred Moon calibration experiment—whether an independently classified XA3 branch or a successor ID—must resolve the ATBD/release interpolation and coefficient-order conflicts, select the exact coefficient/covariance/ASD realization, declare distance normalization, and propagate uncertainty. |
| Air-LUSI and ROLO | AMA `[4]` and `[5]` are planned independent lunar comparisons. The deferred Moon calibration experiment must predeclare their supported bins and roles; they do not establish a resolved lunar BRDF, texture, Earthshine, eclipse, or per-surface radiance model. |
| Magnitude-to-flux relation | Deferred with broader catalog-star research. It is not applied to the selected absolute CALSPEC Sirius packet and is not a current first-integration fact. |
| Reflected-body BRDF equation | `FACT-A32-002288` remains a general externally supported relation. It does not promote a resolved-Moon model, which remains deferred. |


## Standalone Experiment Boundary

E4--E7 are local, deterministic, renderer-independent runners with retained
results. They cover the generic conservation identities, but they have not
passed the complete publication checklist. Before registration:

- E4 must use spectral-irradiance-density terminology and units rather than
  calling `F_lambda` radiant flux without an area;
- E4--E7 must report their full stable experiment IDs, exact command and input
  identity, result hashes, and claim limits;
- E6 and E7 must make units and integration-weight semantics explicit; and
- every supported working-fact row must cite the registered experiment only
  after its entry exists in `references/experiments.md`.

XA1 therefore adds the typed point-source, exact-pixel, and exact-direction
boundary rather than repeating E4. XA2 adds the coupled extended-pixel and
composition wrong-route checks rather than repeating E5--E7. XA3 remains a
planned experiment requiring further protocol research; the imported 033,
049, and 050 results cannot serve as its oracle.


## Explicit Non-Facts

The following values and outcomes are fully accounted for by exclusion:

- every observer, epoch, direction, state residual, convergence result, and
  image from the ER6/ER8 eight-case subjective matrix;
- the E5 `0.00465 rad` analytic fixture radius and the Bruneton paper-profile
  `0.004675 rad` value as physical solar-radius evidence;
- neutral lunar albedo `0.12`, authored star disks or sizes, magnitude-scaled
  solar spectra, fixed or viewport-wide pixel solid angle, source-only
  exposure, and visibility thresholds from presentation experiments;
- the old `remaining * coverage` celestial compositor and any later scalar
  coverage multiplier after angular integration; and
- former local-Sun distance/radius controls and run tolerances as physical
  constants.


## Retained Payload Status

The extraterrestrial payload bytes under
`references/downloads/extraterrestrial-sources-2026-07-12/` match their bundle
hashes, but they are not yet admitted to the canonical downloads manifest.
License and redistribution review remains open, including the copied ROLO and
LIME ATBD PDFs, CALSPEC and TSIS data, and the LIME coefficient component.
Those bytes are research inputs for XA3; publication or redistribution remains
blocked until each file has a manifest entry with its exact consumer,
transformation, locator, authenticity, and license disposition.
