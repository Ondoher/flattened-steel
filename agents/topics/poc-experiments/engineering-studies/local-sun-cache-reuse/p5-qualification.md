# P5 Defensibility And Pre-Video Qualification

This record separates model defensibility, numerical consistency, application
behavior, measured cost and visual suitability. It does not estimate absolute
physical error for the hypothetical flat/local geometry.

Current numerical authority:
[00639 complete report](../../../../../tmp/experiments/local-sun-cache-reuse/runs/00639-p45-app-report/result.json).
All five sky and five colored-scene pairs pass, each with 120 original states.
Implementation completion additionally requires matching exit-0 CLEAN
[primary/audit validation](../../../../../.codex-tmp/review-standards/session-przBnI/validation.json)
for the complete P3-E–P5 unit. A missing, stale or non-CLEAN receipt keeps the
unit open. The [execution summary](p4-p5-execution.md) owns all questions,
decisions, recovery work and checkpoint disposition.

Celestial readiness is separate: the qualified application had no enabled
celestial roster, so these results do not qualify a visible Sun disc or stars.
[P5-Celestial](plan.md#p5-celestial--integrate-the-sun-disc-and-stars) now precedes
owner visual review and P6. The historical receipt retains its frozen scope;
changed governing context and new implementation require fresh review evidence.

## Claim Matrix

| Claim                               | Disposition and evidence                                                                                                                                                                                                                                                 | Boundary                                                                                                                                                                                                                         |
| ----------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Inherited transport mathematics     | Defended by the completed [abstraction inventory](abstraction-inventory.md) and [current evidence policy](reference-method.md#current-evidence-policy). Spectral extinction, exponential attenuation, phase laws and scattering recurrence retain their stated meanings. | Distant/spherical acceptance supports method provenance within its original domain; it does not independently validate flat/local geometry.                                                                                      |
| Flat atmosphere and local source    | Explicit model assumptions: homogeneous horizontal slab, isotropic finite-distance source, fixed height, black physical ground and ozone disabled. See the [design](design.md#assumptions-and-abstraction-boundaries) and [pinned contract](p3-contract.md).             | Ground reflection and ozone restoration remain separate future decisions. Scene geometry reflectance does not add atmospheric ground bounce.                                                                                     |
| Shell addressing and reconstruction | Defensible Euclidean source-distance/altitude addressing, complete compact support and disclosed density-normalized numerical reconstruction. [P3-C qualification](p3-layout-qualification.md) checks layout, validity and accounting.                                   | Targeted resolution/integration error bars remain deferred. Shared-policy agreement supplies consistency rather than an independent accuracy oracle.                                                                             |
| Empty-band omission                 | Six empty bands receive neither scattering storage nor evaluation. Occupied-field equivalence and avoided storage/work are qualified by P3-C; P4 height replacement and the finite future-workload proof exercise support.                                               | Omission savings compare with the matched proof-only unculled layout, not a historical production-grid allocation.                                                                                                               |
| Horizontal reuse                    | [P3-D](p3-movement.md) verifies complete-field covariance under the admitted symmetry; P5 checks exact-time consumers without rebuilding each frame.                                                                                                                     | Source height, medium, emission, ground, numerical policy and coverage changes remain compatible-rebuild boundaries. No unsupported query is clamped into the cache.                                                             |
| Exact-time sky trajectories         | PASS: Flat0/45/90/135/180, each with all 120 original slots, 96 view rays and Native15 receiver packets. Images match byte for byte; spectral and first/second differences remain inside unchanged limits.                                                               | Controls and reuse fields are independently constructed once per job/window. This is not 120 fresh GPU constructions per trajectory. Window joins retain original slots and count extra builds.                                  |
| Colored scene and shadow continuity | PASS: all five independently constructed control/reuse pairs, with 120 exact states each, pass image, Native15 and frame-change comparisons.                                                                                                                             | P5 uses exact-state receiver lighting and six ordinary shadow maps. It does not substitute the film's one-second lighting interpolation or shared shadow adapter.                                                                |
| Application lifecycle               | PASS under [P4](p4-application.md): replacement, coherent publication, cancellation, failure, supersession, live-lease disposal and coverage exit.                                                                                                                       | This is experimental browser integration. Production code/API promotion remains unselected.                                                                                                                                      |
| Future recording coverage           | PASS: [00610 proof](../../../../../tmp/experiments/local-sun-cache-reuse/runs/00610-p5-coverage/result.json), 1,801 camera/source states and 39,622 compact stencils, minimum margin 18,395.033 m.                                                                       | A geometric/support proof for December 14, 2024 and the original camera score; no video was rendered or encoded.                                                                                                                 |
| Runtime and memory                  | Costs are recorded separately from acceptance. Original timing/speedup targets remain informative under the owner's relaxation. Required sampled process, machine reserve and job limits remain enforced.                                                                | Remaining P5 captures use the explicitly approved 6 GiB reserve; earlier required P4 jobs used 8 GiB. The default stays 8 GiB and the exception ends with P5. Sampled host/process telemetry is not a physical VRAM measurement. |
| Absolute approximation error        | DEFERRED under the owner-selected evidence policy.                                                                                                                                                                                                                       | No percentage accuracy, global reference convergence, empirical flat-Earth validation or frame-rate guarantee is claimed.                                                                                                        |
| Source compliance                   | Determined only by the current complete primary/audit receipt linked above.                                                                                                                                                                                              | Type checking and rendered consistency do not substitute for source review.                                                                                                                                                      |

## Results And Limits

The complete report compares 1,200 matched exact states from 2,400 captures,
using 23 accepted trajectory jobs including bounded sky windows. All image-channel
differences are zero. The largest spectral absolute difference is
4.656612873077393e-10; Flat180's first/second difference residuals are
1.7937662139649184e-7 and 3.587532427929837e-7. The other four sky pairs have
zero measured residuals. Colored-scene Flat135 has maximum absolute spectral
difference 4.656612873077393e-10 and first/second difference residuals
1.2591831439700268e-7 and 2.5183662879400536e-7; other scene pairs have zero
measured residuals. No color, exposure, ground, ozone or numerical recipe
was tuned during this qualification.

Each full trajectory avoids 119 of 120 hypothetical per-state constructions;
the two-window Flat135 and Flat180 sky paths avoid 118. These observed counts
are separate from P3-D's mathematical construction-invariance defense. Warm
draw timings exclude exact-state receiver/preparation cost, spectral checks,
readbacks and PNG capture; they do not imply a 60 fps application.

P5 cold preparation took 28.001–43.010 seconds. Exact-state preparation p95
ranged from 127.0 to 194.2 ms; warm draw p95 ranged from 0.1 to 0.8 ms.
Maximum page pulse gap was 37.6 ms. Peak sampled P5 private memory was
5,348,098,048 bytes; minimum free memory was 8,673,619,968 bytes. The ten final
colored-scene jobs took 35.994 minutes of guarded wall time, including setup,
spectral checks, readbacks, PNGs and cleanup. This is not pure cache-build time.
Maximum P5 logical payload was 1,163,596,276 bytes; P4's wider replacement
payload and host peak are recorded separately in its owning document.
Original performance targets are not all met: coverage replacement took
34.135 seconds against its original 30-second target. The v2 report retains
that false target disposition while qualifying correctness under the owner's
timing relaxation. No performance optimization was added to turn it green.

The retained cumulative field remains 275,299,560 bytes (262.5 MiB), with
825,898,680 bytes of peak live construction fields and a separate
33,592,320-byte phase payload. Application logical payload, process-private
memory, working set and machine free memory remain different quantities.
The [P3 disposition](p3-disposition.md) owns layout and omission cost details.

## Handoff

Direct [sky stack](../../../../../tmp/experiments/local-sun-cache-reuse/runs/00639-p45-app-report/sky-cadence.png)
and [colored-scene stack](../../../../../tmp/experiments/local-sun-cache-reuse/runs/00639-p45-app-report/scene-cadence.png)
copy unchanged slot-60 captures in Flat0/45/90/135/180 order. Both stacks were
inspected by the primary agent. Their derivation, source hashes, parent edges,
commands and tool identities remain in the sealed report and capture inputs.
Neither stack supplies quantified absolute accuracy or owner visual approval.

Stop before P6 recording. The next owner-selected recording remains Union
Glacier on December 14, 2024, starting at Flat180 and ending at Flat540, with
the original distant-Sun film's scene setup otherwise retained. This P5 reserve
exception does not authorize P6 execution or its resource policy.
All P5 captures are finished; no heavy job remains. The default 8 GiB reserve
applies to subsequent work. The explicit remaining-P5 exception is no longer
selected; its flags and sealed metadata remain available for provenance.
Gray-horizon research, ozone, reflective physical ground, shared construction
values and quantified error-bound experiments remain deferred.
