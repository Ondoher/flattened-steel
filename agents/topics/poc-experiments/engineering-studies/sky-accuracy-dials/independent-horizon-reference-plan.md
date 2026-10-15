# Independent Local And Distant Horizon Reference: H21-H26

## Purpose And Status

**Planned at the owner's request on 2026-10-15; not implemented or executed.**
Set up an independent spectral light-transport reference for both current horizon
questions, before deciding whether the rendered colors are physically expected.
This is the next planned package within Sky Accuracy Dials, not a new experiment
or authorization to change production. The
[parent diagnosis plan](horizon-diagnosis-plan.md) retains earlier evidence.

Owner hypothesis: substantial light scatters far from the observer, traverses a
long nearly horizontal atmospheric segment, loses proportionally more blue, and
makes the local-Sun horizon orange. Test its three links independently: appreciable
distant received contribution, reddening along that final segment, and sufficient
warm contribution to determine the total color. No target hue is fitted.

The companion question is whether an independent solution makes the distant-Sun
horizon whiter than the current renderer, and whether the two symptoms arise from
a common calculation, distinct approximations, or chosen physical assumptions.

## Existing Independent Evidence

| Existing reference | What it independently checks | Gap this plan addresses |
| --- | --- | --- |
| [00230 stochastic convergence](direct-convergence-results.md) | Cache-free spherical/distant transport with null-collision free flight, phase sampling, ground and compensated termination; all orders in expectation. Five rays/four wavelengths; 15 of 20 values meet the preset sampling target. | Older benchmark geometry/inputs; immediate horizon and current San Jose/local Sun are not qualified. |
| [H3-H6 controls](horizon-assumption-results.md) | Independent color integration and continuous N1, species/distance and physical-input contrasts. | N1 only; earlier Flat path limits were inherited. |
| [H16-H20 audit](horizon-algorithm-results.md) | Independent bounds, continuous N1/view controls and sparse P2 incoming-angular attribution. | No full current N4 or all-order horizon oracle; some sparse lookup comparisons use production collaborators. |
| [Retained libRadtran outputs](reference-model-target.md#current-accuracy-metric) | Separately implemented reference-model comparison under authenticated compatible settings. | Exact configuration/convergence qualification remains open; no matched immediate-horizon/local-source result is established. |

The existing Monte Carlo numerical core is experiment-owned and separate from
production caches, grids and view integration. It is a valuable starting point,
not proof of universal correctness. Its spherical geometry, parallel illumination,
finite solar-column quadrature and GPU arithmetic need the checks below before
reuse at new witnesses. Historical source, authorizations and runs remain intact.
Do not rerun the consumed `converge.mjs execute` package.

## H21: Freeze The Physical Problem And Independence Contract

Authenticate the retained San Jose solar-noon and Flat closest instants, observer
positions and source placements. Hold the paper material fixed under the
[metric owner](reference-model-target.md#current-accuracy-metric): density laws,
spectral coefficients, Cornette-Shanks phase, SSA and absorption settings. Use the
original authenticated solar spectrum rather than fitting color or Kider data.
State spectral point/bin semantics and units before resampling.

Keep three comparisons separate:

1. **Current-app reproduction:** exact physical medium, source, ground and domain
   selected by each app mode. Current atmospheric ground is canonical-black,
   independently of the green visible scene. Local renders N1 and distant N4.
2. **Physical horizon hypothesis:** Flat exponential slab to its declared 100 km
   physical top, finite source, no arbitrary observer dome or cache coverage edge;
   spherical medium uses its own declared physical radii. Label differences from
   the app's domain explicitly. Use the app-matched lane to isolate numerical error.
3. **Paper/libRadtran benchmark:** the independently authenticated complete paper
   packet, including its own ground and source/observer geometry. App black ground,
   Native15 and San Jose observations do not silently replace that packet.

The primary local baseline matches the app's atmospheric point-source illumination,
including geometric dilution and source-path extinction. Extended solar-disk
illumination is a separate model sensitivity, not an unnoticed change of target.

Write an import/data-flow inventory before implementation. Sharing authenticated
physical constants, observed ray directions, units, original spectral/observer
tables and immutable I/O/provenance utilities is allowed. Independently implement
or audit the reference's density evaluation, phase evaluation/sampling, source
illumination/visibility, physical intersections and transmittance.

The numerical reference must not import or call production cache builders,
reconstruction, W27/F68/solar-node coordinate transforms, view integrators,
termination helpers, source-shell adapters or runtime shaders. It must not consume
their radiance/optical-depth fields as implementation inputs. Retained production
spectra are comparison data only, loaded after reference registration is frozen.
Do not import the H19 finite-angular calculation as the reference's incoming field.

Prefer an audited adaptation of the earlier Monte Carlo method in new authored
files under `experiments/sky-accuracy-dials/horizon-reference/`. Reuse verified
sampling ideas and tooling where appropriate; record shared code/data explicitly.
The final implementation may adapt the old experiment core, but independent
analytic/binary64 checks must not merely call that same core again. Preserve a
dependency manifest and all parent identities. No independent implementation can
independently validate physical assumptions that both sides deliberately share.

## H22: Qualify Simple Cases Before Atmospheric Color

Use focused self-verifying proof runners, not an experimental test suite:

- Vacuum and absorption-only paths; Beer-Lambert transmission and reciprocity.
- Constant-density, constant-source segments with a closed-form radiance integral.
- Separately normalized Rayleigh and Cornette-Shanks phase functions; direction
  signs, sampling distributions and mixture probabilities checked independently.
- Single scattering in the flat exponential medium against separately coded
  analytic density columns and deterministic binary64 quadrature.
- Spherical tangencies, ground/top intersections and one-sided surface limits
  against independent binary64 geometry, not a second call to the GPU helper.
- Local-source inverse-square dilution, source visibility and the distant-source
  limit, with source power adjusted explicitly to maintain observer irradiance.
- Sampled order/region contributions add to the total; compensated random
  termination remains unbiased within its statistical checks. A reached safety
  ceiling fails the estimate rather than silently discarding long paths.

Compare separately seeded batches and an independently evaluated subset of GPU
paths/scalars in binary64 if GPU execution is selected. Check source-transmission
refinement and majorant validity throughout the declared domain. Define numerical
allowances before inspecting candidate color. More samples do not establish absence
of a systematic error; retain shared dependencies and unqualified effects.

## H23: Freeze A Small Local And Distant Witness Set

Register twelve sky rays: two modes, elevations 0.05/3/20 degrees, headings toward
and away from the Sun. Exclude the solar disk. Authenticate direction vectors and
independently derive endpoints; shared physical rays are allowed, borrowed path
lengths are not. Do not infer the screenshot's exact heading.

Run a throughput pilot on predeclared low/upper rays and three visible wavelengths
selected from the authenticated spectrum near 450/550/650 nm. Pilot outcomes must
not select favorable rays, phases or spectral bands. They estimate variance and
cost; retain them separately from confirmation or account for their use explicitly.

Before confirmation, freeze seeds, path counts and batches using that pilot's
variance/cost only. Retain N1, N2, N3, N4 and N5-plus contributions alongside the
all-order estimate; count atmospheric events and ground reflections separately.
Compensated termination includes later orders in expectation rather than assuming
four or six orders are exact. Report marginal sampling intervals and reference
systematics separately. Do not stop sampling because a swatch looks orange.

Start with all twelve rays at three diagnostic bands. Full-color confirmation
uses the horizon/upper away-Sun trio in each mode, six rays total, on the complete
declared visible spectrum. Declare spectral quadrature and refine it at a frozen
subset before interpreting small color changes. Three wavelengths or a sparse
band score cannot establish an orange/white color conclusion. Preserve the
six toward-Sun controls as spectral diagnostics if full-color budget is insufficient.

## H24: Attribute The Received Light By Distance And History

For each observer contribution retain non-overlapping distance bins in km:
0-10, 10-50, 50-100, 100-300, 300-1000, and above 1000. Bin the **last atmospheric
scattering event's distance from the observer**, not its distance to the Sun.
Measure spectral contributions both before final-segment transmission and after
that transmission reaches the observer. Pre-attenuation quantities must be
estimated directly, not recovered by dividing noisy values by tiny transmission.

For multiple scattering also record separate summaries of maximum path distance
from the observer, total atmospheric path length/optical depth and last-event
species. Earlier distant scattering followed by a nearby final event must not
disappear from the history attribution. Avoid retaining individual path histories;
keep batch-level additive summaries, including pure orders and a later-order bin.

Deliver cumulative spectral-distance curves, Rayleigh/Mie/order contributions,
physical XYZ/chromaticity/luminance with uncertainty, and fixed-exposure swatches.
Use the same fixed source/reference white and display convention; no per-case white
balance, saturation or fitted exposure. Propagate batch uncertainty through color
comparisons rather than treating noisy point estimates as decisive colors.

The main tests distinguish:

- Far light is redder but too weak to control the total: the first two links of
  the hypothesis may hold while the orange-total expectation is unsupported.
- Later orders add enough distant warm light to change the horizon: N1 truncation
  is implicated, separately from cache error.
- An independently qualified matched N1/N4 reference is orange/whiter while the
  app is gray/blue: isolate algorithmic error with an actual matched order target.
- Both independent and current matched solutions are neutral: investigate physical
  assumptions or appearance expectations without adding numerical compensation.

R/B alone is not an orange classification. Report the whole spectrum and measured
chromaticity relative to the declared white; preserve inconclusive confidence
regions. The same rules apply to the distant expectation of a whiter horizon.

## H25: Check Whether Source Proximity Is Causal

After validating the baseline, compare the original finite source, twice its
observer distance along the same direction, and a parallel-source limit. Hold
unattenuated observer irradiance and spectral shape fixed, adjusting emitted
intensity explicitly; otherwise proximity is confounded with overall brightness.
Keep atmosphere, observer, ground, viewing directions and source angular model
fixed. Evaluate the 3-degree and 20-degree away-Sun controls at the three pilot
bands first. Full spectra follow only if the measured contrast warrants them
within the same budget. These are diagnostic source changes, not a production fit.

If a new ground or phase hypothesis emerges, register it separately. Do not
quietly introduce a reflective ground, altered aerosols or a different source
spectrum to force the desired color during reference qualification.

## H26: Apply The Oracle To The Distant And Component Questions

Use matched N1/N4 comparisons to distinguish current numerical error from omitted
later scattering. Keep app-minus-matched-reference and all-orders-minus-N4 separate.
Compare against retained app spectra only at authenticated compatible physical
rays/bases/domains; otherwise identify the missing observation instead of forcing
a join. No full cache build or new live app capture is included in this setup.

At the two H19 distant near-ground receivers, permit a sparse independent pure-P2
source check at its exact points/directions and wavelengths if ray qualification
leaves budget. Compare its independently generated N1 incoming field with F68 and
the boundary-split H19 result. This tests whether the measured opposing Rayleigh/
Mie angular errors survive an independent incoming solution. It does not replace
consistent regeneration of the current N4 recurrence or prove a final color fix.

For the distant Sun, libRadtran provides an additional independently implemented
comparison. First audit local retained input decks/version/settings and available
outputs at the proposed rays; verify geometry, ground, phase conventions, spectra
and convergence. If actual near-horizon support is absent, retain that gap and
specify the smallest later external-reference run. Do not install/compile a solver,
launch a reference-data acquisition campaign, use a different ray, or assert that
a standard distant-Sun libRadtran setup supports a finite local emitter.

The resulting coverage table must identify, for each problem, the independent
oracle, matched physical/order scope, shared inputs and remaining uncertainty:
local horizon color, distant horizon color, endpoint/domain assumptions, source
and view extinction, scattering-order tail, angular/species compensation and
spectral/display projection. An end-to-end discrepancy does not by itself uniquely
attribute a component; follow-up interventions use the same qualified oracle.

## Execution, Review And Deliverables

The owner selected H21-H26 for independent execution on 2026-10-15. The
[results](independent-horizon-reference-results.md) own completed numerical work,
qualification limits and the matching implementation-review receipt. On selection,
freeze one coherent implementation baseline and confirm mapped reviewer readiness.
Batch required source review and its independent audit after the stable reference
milestone, including the required types review/local type check. No per-ray or
per-candidate review, added capability lanes or new experimental test suite.

Proposed aggregate numerical allowance: **20 minutes including setup, pilot,
confirmation, qualification, retention and cleanup; at most two serial GPU attempts
and 16 MiB new retained evidence**. Prefer sparse CPU checks plus the existing GPU
runtime only if the pilot justifies it; no full images, full-sky sweep, full cache,
new dependency or native helper compilation. Implementation/review time is measured
separately. Old compute packages are not renewed. Choose workloads from measured
throughput before launching them, not from an assumed samples-per-second rate.

A fixed statistical precision target should be frozen before confirmation, initially
aiming at 1% relative marginal 95% radiance half-width on materially contributing
visible bands, with an absolute near-zero allowance derived from proof controls.
Use chromaticity uncertainty to decide whether color ordering is resolved; do not
promise this precision inside the resource cap. If the pilot predicts the complete
matrix cannot fit, prioritize full spectra on each mode's 3-degree away-Sun ray,
retain the registered upper/heading controls as partial, and identify those gaps.
Never substitute a different atmosphere or accept a biased estimator to fit time.

Repair setup faults within the remaining allowance in fresh immutable runs;
preserve completed scientific comparisons and avoid unchanged retries. Reaching
the allocation retains available estimates and explicit unsupported cells rather
than silently extending into a multi-hour run. Each numerical job over a minute
publishes the existing flushed progress heartbeat and runs one GPU job at a time.

Retain a dependency/independence manifest, authenticated physical packets, simple-
case checks, pilot/admission, exact confirmation registration, batch means, distance/
order/species summaries, compact spectra/uncertainties, figures/swatches and a
decision/coverage report. Source and output stay within the experiment's declared
roots; prior evidence remains immutable and complete derivation chains are retained.
The existing 512 MiB evidence, 1 GiB scratch, 40 GiB free-disk and relaxed operational
memory rules apply. The two accepted H16-H20 runs remain closed. The results
record H21-H26 implementation and numerical execution; no production change or
matched libRadtran horizon qualification is implied.
