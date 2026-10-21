# H134-H140: illumination reconstruction results

Status: current execution wrapped at the owner's request on2026-10-20; the
experiment remains open. H134-H140 is incomplete. This report records the
conclusions and the boundary reached, with prior detailed evidence retained below. The
[execution record](illumination-reconstruction-execution.md) owns decisions,
milestones and the live resumption boundary; the
[plan](illumination-reconstruction-plan.md) owns the scientific gates.

## Conclusions at the owner-requested wrap

The incoming-light reconstruction is supported by the local evidence, but this
campaign has not established an improved complete cache. It also exposed a
separate source-altitude interpolation error: accurate stored source nodes can
still produce inaccurate light between those nodes and during transport.

1. **The incoming reconstruction works at its tested scope.** The full128-ring
   union and phase-factored positive interpolation pass all60 local component,
   paired-midpoint and complete-Sun physical protections across both profiles.
   One whole15-band paper source row also passes the numerical source-production
   checks. These are L1-to-local-J2 results, not N4 or B1 results.
2. **Spatial interpolation matters independently of incoming angular accuracy.**
   In the short vertical probe, native source nodes agree with independent
   physical estimates, while ordinary interpolation substantially overestimates
   the Mie contribution between them. Removing the known exponential species
   density before interpolation, restoring it once at the query, and preserving
   the remaining curvature reduces this error. This repair is supported in a
   bounded case; a general altitude/order policy is not yet qualified.
3. **The improved total is not just a hidden component tradeoff in that case.**
   The65536-query independent reference protects both last-scattering species
   and total against normalized linear interpolation. Mie and total improve
   across the reported uncertainty range. Rayleigh is protected, with its own
   improvement unresolved. References retain statistical and empirical numerical
   uncertainty; these are not simultaneous physical certificates.
4. **Toronto source production remains unresolved.** Its measured phase has a
   sharper feature than the paper phase. The completed degree128 projections at
   orders4/8/16 reduce the numerical envelope from4.0833e-4 to5.5985e-5, still
   above the unchanged1e-5 target. Native phase convergence and independent
   full-phase driver checks are unfinished. The owner-directed wrap stopped
   expansion after the completed order16 artifact. No scientific rejection is
   inferred from the browser-shutdown failure used to finalize that run.
5. **No conclusion about the final horizon appearance or paper RMSE follows.**
   No complete own-field N1-N4 cache, reflective-ground recurrence, new full B1
   score or full-spectrum scene comparison was produced. Production and optical
   profiles are unchanged. These results do not establish that the deployed
   horizon is physically wrong.

The following table compares every source-altitude variant with the same
strongest retained reference768. It concerns only paper band8 (626.333nm), Sun
elevation0.5degree and a ground-observer zenith ray restricted to0-4375m, pure
atmospheric L2 with a black boundary. It is not a horizon ray or full radiance.

| Source support and representation | Partial-L2 total | Relative error over the common reference range |
| --- | ---: | ---: |
| Four native heights, physical-source linear | 3.1333099232e-4 | +6.495% to+6.673% |
| Four native heights, normalized linear | 2.9066922714e-4 | -1.207% to-1.042% |
| Seven computed heights, physical-source linear | 2.9887494564e-4 | +1.582% to+1.752% |
| Seven computed heights, normalized linear | 2.9313681822e-4 | -.368% to-.202% |
| Seven computed heights, normalized shape-preserving cubic | 2.9404580122e-4 | -.059% to+.108% |

The cubic-minus-normalized-linear absolute-error changes are[-.2492,+.0375]
percentage point Rayleigh,[-.3584,-.1696] Mie and[-.3091,-.0943] total. Every
upper bound is below the unchanged+.1-point protection allowance. The fixed
rule was tested against independently traced physical light; no atmosphere,
exposure or interpolation coefficient was fitted to those reference errors.

[Verified wrap772](../../../../../tmp/experiments/sky-accuracy-dials/runs/00772-h140-wrap-report/summary.json)
authenticates the selected terminal evidence and all15 variant/component
derivatives. Its [native comparison table](../../../../../tmp/experiments/sky-accuracy-dials/runs/00772-h140-wrap-report/partial-path-comparison.tsv)
retains the unrounded common-reference values. Earlier report attempt771 is
preserved: it failed a reporting assertion using the wrong terminal-state field
name. The corrected derivative changes no scientific input or result.

## Delivery, costs and scope assessment

| Planned outcome | Disposition |
| --- | --- |
| Local reconstruction and exposed transfer | Qualified within the tested black-boundary L1-to-local-J2 scope |
| Complete paper15-band source row | Numerically qualified at one receiver |
| Actual own-source partial-L2 transport | Implemented; finite GPU checks and independent physical attribution retained |
| Normalized cubic altitude repair | CPU controls/physical protection pass in the bounded case; hardware runner prepared but unexecuted |
| Toronto whole-native source production | Inconclusive; completed projection levels preserved |
| Four-order global cache and ground recurrence | Not completed |
| Full paper B1 and matched full-spectrum scenes | Not run |
| Eight reserved physical tuples | Unexposed |
| Additive source-phase numerical control | Prepared/type-checked only; unproved and held |

Elapsed campaign time is about8hours, including scientific computation,
implementation, reference precision, verification and recovery; it is not all
GPU time or pure reasoning time. The original full-cache outcome was not reached.
Prerequisite diagnostics expanded too far relative to that deliverable. Their
findings are useful, but successful slices must not be presented as completion.

Measured732's15-band projection takes277.085s at one receiver. The native grid has
8640 altitude/Sun rows; even the first-atmospheric-order shadow exclusion leaves
5323. A naive serial extrapolation is17.1 days for that stage over5323 rows, or
27.7 days over all rows. These are prototype extrapolations, not measured full
builds or upper bounds, and they exclude other work. Cost remains a reported
engineering issue, not a scientific rejection. A scalar15-band native field is
2,267,481,600 uncompressed bytes; four separate source transitions are
9,069,926,400 bytes. Streaming avoids requiring the complete tensor resident.

The two new physical-reference levels took180.169s and238.184s for their new
traces/writes/statistics, reusing every old query result. The final Toronto
degree128/order16 projection took1445.030s with55,147,957 quadrature queries;
its numerical target was not met. No new phase-control branch was executed.

Local types and immutable evidence checks accompany the wrap. Exact recovery
snapshot769 preserves156 files and passes byte replay/types. Git permissions
still prevent a local commit; a recovery snapshot is not a Git checkpoint.
Final source/report recovery and cleanup are recorded by the execution record.

## Recommended next decision

Keep the proven local reconstruction and the bounded altitude finding. A later
owner-selected continuation should first close the Toronto producer's numerical
gate and validate the cubic hardware path, with a deliberately bounded milestone
and an explicit decision on the complete builder route. The prepared additive
phase control is a hypothesis for that numerical gate, not an adopted solution.
Do not reopen broad grid searches or call for a full N4/B1/scene campaign until
the producer and execution route are concrete. No further execution is implied
by this recommendation.

## Current polar-union evidence

The fixed full128-proposal union passes all60 component and paired-midpoint
protections in [00705](../../../../../tmp/experiments/sky-accuracy-dials/runs/00705-h137-polar-all/summary.json).
Its geometry varies from11,264 to12,160 directions across the exposed receivers.
These remain local-J2 reconstruction budgets, not paper RMSE or sky brightness:

| Exposed cohort | Paper error reduction | Toronto error reduction |
| --- | ---: | ---: |
| Original36 fields, disjoint32768-query stream | 80.82% | 83.64% |
| Additional24 fields,8192-query stream | 77.71% | 77.17% |

[Combined00720](../../../../../tmp/experiments/sky-accuracy-dials/runs/00720-h137-polar-qual/protections.tsv)
qualifies all60 complete-Sun protections, rejects0 and leaves0 unresolved, with
no reference conflicts. Continuous integration00708, finer quadrature00717 and
targeted disjoint query waves00714/00719 resolve their separate drivers. Earlier
inconclusive intervals stay unchanged. The independent
construction0 repeat00710 passes all six component, paired-midpoint and complete-
Sun protections. Its older conservative rectangle summaries remain inconclusive;
the registered shared-batch paired protections are separately retained.

Geometry proof00711 verifies that every prior twelve-ring selection lies inside
the full proposal: targeted, uniform and reversed allocations give identical
final directions, phases and manufactured interpolation on all ten geometries.
The old allocation now determines which already measured rays are reused;
the final full-union geometry itself is fixed by the physical construction.

The actual red-band paper builder row00712 passes all-outgoing GPU/binary64
comparison and a uniform empirical projection envelope. Paper bands0/8 pass;
the complete15-band source row721 is running with four CPU workers and one GPU.
Own-field recurrence, reflective ground, full B1 and
observer scenes remain unexecuted.

## Completed local development evidence

All comparisons below use the same 36 exposed physical fields (six geometries,
two profiles, three bands) and seed684729181. The metric is the outgoing-Mie-
weighted absolute incoming-origin reconstruction budget A_origins, normalized
to matched local J2/reference floors. This is not observer radiance or paper RMSE.

| Method | Incoming nodes | Paper error reduction | Toronto error reduction |
| --- | ---: | ---: | ---: |
| Phase-factored polar cubic, active-profile raw-curvature rings | 4864 | 60.8% | 73.0% |
| Phase-factored polar and azimuth cubic, same rings | 4864 | 77.4% | 81.4% |
| Two-axis cubic, amplitude-curvature ring alternative | 4864 | 74.4% | 74.5% |
| Two-axis cubic, raw-curvature rings plus doubled azimuth samples | 9728 | 86.8% | 86.8% |

All component protections pass on this development panel. Selecting rings from
amplitude curvature is weaker than the raw-curvature control across both pools;
that allocation branch is rejected. Positive interpolation in azimuth and then
denser within-sector azimuth sampling each address additional measured error.
Every original physical node remains in the refined grid. Construction cost is
measured and reported, not used as an accuracy rejection gate.

[Native profile table](../../../../../tmp/experiments/sky-accuracy-dials/runs/00659-h135-progress/summary.tsv)
and [native field table](../../../../../tmp/experiments/sky-accuracy-dials/runs/00659-h135-progress/fields.tsv)
preserve all measured cases, signed error estimates and uncertainty.

The first polar-only wave resolves two adverse total-error witnesses despite
its lower component error. The two-axis variant removes those resolved adverse
decisions, but uncertainty remains in other physical comparisons.

## Independent-stream confirmation

[Accepted00658](../../../../../tmp/experiments/sky-accuracy-dials/runs/00658-h135-confirm/summary.json)
uses 32768 new directions per field and a disjoint seed. The 4864-node method
reduces the reconstruction pool by **77.38% paper / 81.60% Toronto**; the 9728-node
method reduces it by **86.78% / 87.07%**. Every component protection passes.
Against the matched midpoint, all36 physical-total protections pass per method.
Against complete Sun4096, that initial wave passes33 and leaves three
inconclusive per method. Targeted precision00673 and the separately derived
[physical recovery00678](../../../../../tmp/experiments/sky-accuracy-dials/runs/00678-h135-phys-close/summary.json)
resolve every remaining protection: **36/36 pass for each method**. Earlier
decisions remain immutable. The recovery combines a converged model integral
with independently sampled model-minus-direct error, preserving common physical
reference covariance. All recovered comparisons overlap increased independent
path histories. These are finite empirical local-J2 protections, not certificates.

## Transfer evidence

[Accepted00670](../../../../../tmp/experiments/sky-accuracy-dials/runs/00670-h137-transfer/summary.json)
adds24 fields over four exposed geometries beyond the original six. The4864-node
method reduces the error pool69.0% paper /72.7% Toronto; the9728-node method
reduces it80.3% /83.2%. Every component and midpoint physical protection passes.
Complete-Sun physical calculations00680 finish:4864 passes21/rejects1/leaves2
inconclusive;9728 passes22/rejects1/leaves1 inconclusive. Its post-run verifier
fails a56.676s heartbeat gap. [Accepted00699](../../../../../tmp/experiments/sky-accuracy-dials/runs/00699-h137-xfer-replay/summary.json)
authenticates all artifacts/source identities and exactly replays every numerical
decision; this does not relabel the original monitoring as verified.
Toronto/dev-2/red rejects both
configurations: absolute-error worsening is0.166-0.201 percentage points for
4864 nodes and0.227-0.263 points for9728, beyond the0.1-point allowance. Their
signed errors are negative, and reducing azimuth component error exposes a
larger underestimate. This rejects their full physical admission; original36
protections remain valid for their original scope. Paper/node-90/red also
remains inconclusive for the denser variant; the smaller grid passes that case.
A fixed polar-refinement diagnostic passes four component/midpoint cases in
[accepted00697](../../../../../tmp/experiments/sky-accuracy-dials/runs/00697-h137-polar-union/summary.json);
all four independent physical protections pass00700. See decision24 in the
execution record.

At that adverse witness, retained8192-query point estimates show how improved
angular errors can leave a worse signed total. Values below are percentages of
the fixed local reference, not observer brightness:

| Reconstruction | Positive angular error | Negative angular error magnitude | Signed total error |
| --- | ---: | ---: | ---: |
| Original experimental midpoint | 2.3656 | 1.1476 | +1.2180 |
| Two-axis4864 | 0.3506 | 0.6139 | -0.2633 |
| Two-axis9728 | 0.2606 | 0.5832 | -0.3226 |

Derivation: in00670's Toronto/dev-2/b8 row, sum outgoing-Rayleigh/Mie statistics
to form signed E=mE+rE and absolute A=mA+rA, then positive=(A+E)/2 and
negative=(A-E)/2. Both error magnitudes decrease with azimuth refinement, but
positive error falls faster, leaving a larger negative balance. These are
illustrative means; the separate physical protection bounds above own the
decision. This decomposition does not establish why the stronger Sun4096
quadrature is closer, nor does it validate a complete cache.

[Accepted00674](../../../../../tmp/experiments/sky-accuracy-dials/runs/00674-h137-repeat/summary.json)
rebuilds every original/additional direction under an independent construction
at the exposed near-Sun witness. Both profiles pass their gain, component and
midpoint physical checks. No old light was copied into changed directions by index.

## Builder evidence

### Bounded polar follow-on

The fixed128-proposal union retains all original and previously added rings,
keeping64 azimuth nodes per ring. It has11,648 directions at dev-2 and11,776
at node-89; only genuinely new directions are traced. Accepted00697 passes
all four component and midpoint protections. Signed error point estimates are:

| Profile / exposed receiver | Prior4864 | Polar union |
| --- | ---: | ---: |
| Paper / dev-2 | -0.2742% | -0.1050% |
| Toronto / dev-2 | -0.2633% | -0.0894% |
| Paper / node-89 | -0.0414% | -0.0430% |
| Toronto / node-89 | +0.0755% | +0.0598% |

These are red-band, fixed-reference local source errors, not observer brightness.
All use the same retained independent query truth and unchanged interpolation.
Accepted00700's continuous model integrals qualify physical protection in all
four cases. Its Toronto/dev-2/red worsening relative to complete Sun is bounded
0.0084-0.0368 percentage points, within the unchanged0.1-point allowance. All
four finite convergence checks pass; the independently repeated old adverse
integral overlaps00680. This supports the polar mechanism at these exposed
witnesses; it does not establish whole-panel transfer by itself. The completed
unchanged60-field expansion and current physical qualification are recorded above.
No new physical tuple or full-cache result is claimed.

Actual native-input, complete15-band local-J2 rows are accepted for
[paper00667](../../../../../tmp/experiments/sky-accuracy-dials/runs/00667-h136-native-row/summary.json)
and [Toronto00669](../../../../../tmp/experiments/sky-accuracy-dials/runs/00669-h136-native-row/summary.json),
each covering4374 outgoing directions. Selected hardware-GPU/double-precision
finite-sum comparisons pass. These are scattering-density rows, not observer
spectra or sky colors. Their angular sum is not yet independently qualified as
the continuous integral.

Unpartitioned integration probes00660/00661/00666 show that nearly correct phase
mass can coexist with unresolved illumination-integral error. The analytic
phase-moment controls00664 pass; the control-variate trial00665 does not establish
an improvement. Boundary-partitioned integration00668 is active: the paper
near-Sun red witness changes by less than2e-8 of reference between its last two
levels. Completed00671 resolves the paper opposite-Sun bands;00676 checks
actual native-input red fields with last-level changes around1e-7. The actual
streamed GPU source operation passes selected same-function comparisons in00682
after fixing final partial-upload padding; failed00681 remains preserved. The
earlier8192 finite row sum remains unqualified for continuous accuracy.

A shared spherical-harmonic phase convolution passes manufactured controls00684
and selected whole-outgoing GPU parity00689 (4374 directions, one band). It
does not yet qualify as a complete spectral operator: Toronto degree64/128
residuals remain around2.8e-4 of reference, with opposite signs, while projection
refinement changes only2.6e-7 in00690. Further degree convergence is required.
Runs00685/00686 retain post-verifier heartbeat failures; their numerical data
are not relabeled fully verified. Worker orchestration repair00687 and exact
paper replay00688 preserve their numerical work with an independently verified
monitoring route. Higher-order manufactures00683 are not actual recurrence.

Further degree refinement00691/00692 reduces the selected Toronto discrepancy
to3.57e-7 of reference at512, with7.13e-7 projection change. Whole-outgoing GPU
proof00693 passes selected binary64 parity at4.90e-6 relative; independent phase
moments through512 pass00696. Spectral pilot00694 covers paper bands0/14, not
all15 bands. The inherited64/128-point Gauss light-generation operation remains
distinct from the current compiler's trapezoidal L1 template; its exact-template
bridge now passes00702 on both profiles,three bands and15/60/120 transport
intervals: R/M splitting recombines to the unchanged scalar template within
1.06e-6 relative across4096 directions. This is arithmetic/source-operation parity.

[Input difference00707](../../../../../tmp/experiments/sky-accuracy-dials/runs/00707-h136-input-gap/differences.tsv)
keeps that result distinct from physical agreement. With source columns fixed
at20 intervals, current-template60 values differ from the inherited Gauss128
values by1.31-1.48% median over positive selected directions;120 reduces medians
to0.42-0.62%. Directionwise tails and unweighted row totals remain distinct.
The selector is inherited signal above1e-8 of each row peak, not a score gate.
All physical medium/source settings and receiver-local directions are matched.
Neither input is declared exact truth by this difference alone; its cause is
not isolated and no whole-current-compiler equivalence is claimed.

### Shared-integration convergence and construction cost

The following are selected native-geometry Toronto red-band source integrals,
not sky spectra. Differences are divided by the unchanged matched local reference.

| Maximum harmonic degree | Continuous-integral discrepancy | Projection4-to8 change |
| ---: | ---: | ---: |
| 128 (00690) | +2.787e-4 | -2.596e-7 |
| 256 (00691) | -1.192e-5 | -2.893e-7 |
| 512 (00692) | -3.566e-7 | +7.135e-7 |

This separates degree truncation from illumination-projection integration.
The actual physical phase is unchanged; its512 moments agree with independent
Gauss384 integration to4.93e-12 in00696. GPU whole-row evaluation00693 takes
4.655s host-inclusive for4374 directions plus the physical witness; its selected
GPU/binary64 error is4.90e-6 relative. CPU projection00692 takes146.093s for
10,516,318 light queries and2395 polar quadrature rings. These are prototype
host measurements under shared-machine load, not isolated GPU kernel timings.
Four complex-origin coefficient arrays require4,218,912 binary64 bytes at512;
serialization, geometry and other working storage are additional.

Uniformly repeating those two measured stages over9180 rows gives a deliberately
naive serial J2-only work estimate of5766hours for15 bands or15376hours for40.
This is a multiplication scenario, not a full-build ETA or bound: degree needs
vary with field/profile, and geometry, spectral work and transforms can be shared
or evaluated on GPU. It excludes path transport and later orders. Construction
cost does not reject the method; these figures motivate improving the numerical
adapter while retaining its independent correctness checks. The equivalent FFT
projection is independently exercised on the fixed Toronto/red native-geometry
field:00706 covers2048/4096/8192 azimuth samples,00709 adds16384. Its final
continuous-reference discrepancy is4.73e-7;8192-to16384 changes9.26e-7. This
qualifies only that selected finite integration comparison. The550.809s final
worker time under shared load shows no demonstrated speedup over the earlier
146.093s partitioned projection. Small manufactured projection agrees with a direct sum
to3.56e-15 in accepted00698, which also replays the selected integration/phase
evidence. Constant-amplitude aligned phase tails remain explicit: degree512
does not establish a whole-field truncation bound.

Batching-only GPU proof00701 preserves all4375 measured row values exactly
against00693 while using five1024-wide dispatches instead of69 small dispatches.
Measured host-inclusive setup/evaluation/readback is2.990s; maximum individual
draw/readback request232ms. The earlier4.655s includes its selected binary64
checks;00701's corresponding total is3.044s. This single-pair comparison under
different shared load is not a controlled kernel-speed benchmark.

### Proposed full-union builder row

[Accepted00712](../../../../../tmp/experiments/sky-accuracy-dials/runs/00712-h136-polar-row/summary.json)
uses the same actual direct-L1 panel/log Gauss nodal operation as the local proof,
then the fixed full-union reconstruction and physical harmonic phase integration.
Every GPU component over4374 native directions plus the physical/source/opposite-
source witnesses matches independent binary64 evaluation within3.75e-6 relative.
All measured values are positive. Projection4-to8 has an empirical uniform
coefficient-change envelope8.9993e-6 of the fixed original4096 numerical control.
That normalization is numerical only; it is not an independent physical oracle.

The positive analytic paper-CS moment series supplies a uniform phase-kernel
tail bound; combining it with a bounded illumination mass makes degree128's
truncation contribution negligible in this row. This argument does not apply
unchanged to Toronto's tabulated phase. Coefficient projection, input uncertainty,
GPU floating evaluation and physical accuracy retain separate qualifications.

The finer worker takes199.236s, including source preparation,12,860,926 projection
queries and independent binary64 evaluation of the entire outgoing row. The GPU
request stage takes259ms, including host upload/draw/readback under shared load.
These timings do not isolate production projection throughput. Accepted00725
now assembles all15 qualified paper bands from00721 and targeted refinement00723.
All4374 native plus3 physical directions retain all four transition components
and their independent binary64 values. Eleven bands qualify at projection8;
four bands3/4/5/6 need projection16, with envelopes8.546e-6,3.908e-6,4.197e-6
and2.786e-6. No band is passed by averaging its error with another band. The four
refinement workers take531-545s each under shared load, including45,072,088
projection queries and whole-row CPU evaluation. Completed inputs/levels are
reused; no extra light was traced for that precision recovery. This is pure-
J2 scattering density; observer spectra and sky-color swatches require subsequent
transport and complete spectral/order qualification.

Preparation proofs00722/00724 separate geometry from sampled light and share ring
setup across azimuths. The prepared CPU values agree with the original positive
interpolator within1.14e-14; the latitude specialization agrees within2.32e-12 on
8688 actual quadrature queries over paper/Toronto near-Sun/transfer geometries.
These are equivalent numerical implementations, not new physical evidence.
Hardware interpolation/Fourier work remains separately qualified.

### Complete GPU implementation and transport boundary

Accepted00726 compares every query component on four exposed fields, both optical
profiles. Its maximum relative discrepancy is1.21e-5; selected weighted mean
absolute discrepancies are7.35e-8 to1.08e-7 of the unchanged numerical control.
Raw manufactured controls pass. Accepted00727 verifies all modes0-128 on28 actual
quadrature rings, and00728 completes the same-input paper/red projection with a
weighted uniform discrepancy1.48e-6 against the retained binary64 coefficients.

Binary replay00730 preserves every coefficient exactly and reduces observed
prototype wall time278.138s to85.395s. Shared-geometry/partial-sum implementation
00732 then completes all15 paper bands in277.085s, with each uniform discrepancy
between9.10e-7 and2.18e-6. These are same-function numerical implementation checks;
they do not replace725's separate projection-convergence and physical-input gates.
The shared row includes68.297s preparation,203.480s dispatch and4.481s binary64
reduction. Peak owned textures5.45MB and binary packet4.44MB exclude browser,
driver and other process allocations; logical streamed input is7.62GB. Neither
measurement is a whole-cache or isolated-GPU benchmark.

Accepted00734 supplies all15 actual Toronto nodal bands with per-band binary64
calibration. Bands0-2 preserve registered analytic-CS/.8 SSA fallbacks; bands3-14
use registered AERONET-derived phase/SSA. It is a hybrid registered optical profile,
not15 wholly measured bands or Toronto weather. Toronto full-field convolution
precision remains open. Shared projection partitions must include source-phase
knots from every active wavelength, including tables absent from band0.

Accepted00735 verifies the contained black-boundary transport adapter's independent
finite trapezoids, scalar/species sum, row-specific directions and vacuum units.
The known constant-source attenuating control has physical CPU errors.3231% at60
intervals,.08165% at120 and.02047% at240. This diagnoses a numerical path operation,
not an actual scene/cache error. Precision736 improves CPU integration but fails
the strict scalar/species arithmetic gate at1920. Diagnostic737 reproduces that
failure with complete readback; compensated accumulation also fails the gate.
CPU3840 quadrature converges (empirical4.80e-6), while the compensated GPU's maximum
physical discrepancy remains4.62e-5. The fine-step calibration is not qualified;
the original passing60-interval finite control remains unchanged.

Builder geometry733 reproduces all20 exposed profile/receiver constructions
without loading retained light. Actual own-source-row738 qualifies1875m,
paper band8/SZA89.5, including all4374 native directions and projection envelope
5.0863e-6. All registered native/midpoint rows are now complete for the0-4375m
radial partial-path probe. Its
native/midpoint source rows, independent two-event history reference and spatial/
transport decomposition are specified in execution Decision46. No full-L2,
four-order, ground, B1 or observer-color qualification follows yet.

The independent cache-free two-event reference741 completes131072 histories
with the frozen physical proposals and seed. Partial-path last-Rayleigh is
1.3371240e-4, last-Mie1.6260005e-4 and total2.9631245e-4. Their32-batch
three-standard-error sampling widths are1.69%,1.15%,1.05%, respectively;
128/256 Gauss-column sensitivity is negligible. These are sampling intervals,
not deterministic enclosures or complete observer radiance. Actual cache/source
fields are not inputs to that reference. Numerical CPU integration takes1.662s
at128 and3.293s at256, excluding proposal preparation, retained-evidence IO and
source verification. The GPU remains occupied with actual source construction.

### Source-altitude error isolated in actual owned fields

Accepted738/740/743 complete the registered native0/1875/3125/4375m support.
Their radial-up source values agree with frozen independent point references744
within the reported statistical intervals. At the first two altitude midpoints,
however, unchanged physical-source linear interpolation745 overestimates Mie by
22.53% and12.75%. Rayleigh errors are-3.43% and-.48%, partly offsetting it.
The total errors are+14.12% and+4.33%. This is a measured between-altitude error
in the actual source representation, even after the angular method is improved.

The density-normalized derivative changes only that stencil: remove the known
exponential species density at each stored node, interpolate, restore once at
the physical query. Its Mie errors become-2.82% and-.95%, totals-2.45% and-.55%.
It improves both tested queries; the first remains outside its statistical
interval. No global representation policy is qualified by this small diagnostic.

Independent same-field transport748 yields partial-L2 Rayleigh1.3065227e-4,
Mie1.8267872e-4 and total3.1333099e-4. Relative to fully binary64 cache-free
reference742, errors are-2.29%,+12.35%,+5.74%. Increasing the same-field path
quadrature from the finite60 control to exact-column Gauss changes total only
about.0069%; altitude-source interpolation dominates this probe. The species
errors partly cancel. Density normalization747 changes total to2.9066923e-4,
or-1.90%; that improves agreement but remains outside the reference's+/-1.05%
three-SE interval. Completed midpoint-refined source rows test the
remaining curvature. This is one-wavelength partial atmospheric pure-L2,
not a complete observer ray, full cache, later-order or B1 result.

### Paired physical precision and incremental source refinement

Accepted751 adds a cache-free direct-L1 control-variate reference at16384 actual
height/direction queries. Both fixed-coefficient known-integral proxies close
within paired sensitivities and overlap standalone742. Finite32/128 through64/256
changes are negligible. Accepted752 clarifies the two-last-species tally labels
and compares both candidates with one common empirical reference interval hull.
Both incoming origins are combined; inherited helper origin labels in751 do
not constitute an origin decomposition. These intervals include three-standard-
error sampling widths and empirical finite/proxy sensitivities; they are not
deterministic or simultaneous physical enclosures.

The sharper reference changes the estimated error, not the stored candidate:

| Actual source support | Ordinary interpolation: total error range | Density-normalized: total error range |
| --- | ---: | ---: |
| Native0/1875/3125/4375m | +6.19% to+6.82% | -1.49% to-.91% |
| Add computed937.5m row | +1.88% to+2.49% | -.762% to-.175% |
| Also add computed2500m row | +1.46% to+2.06% | -.679% to-.092% |

Accepted753/756 own the incremental derivatives;757 completes3750m support.
Cell attribution754 splits the same retained paired events and exact proxy
integrals at the original altitude boundaries. Cell sums reproduce the parent
values exactly. Most original excess arises in0-1875m: Mie excess is1.754e-5
to1.928e-5 and partly offset by Rayleigh deficit1.327e-6 to1.921e-6. Whole-path
numerical sensitivities are conservatively reused in each cell's range.

All these path numbers are for a radial-up/zenith view restricted to0-4375m,
paper band8 and Sun elevation.5degree. They establish an altitude-interpolation
mechanism; full horizon radiance, later scattering, scenes and B1 remain open.

### Complete support and shape-preserving source interpolation

Accepted766 reuses all16384 cache-free physical traces with the complete seven-row
known-integral proxies. No physical light or candidate source value is changed.
Both proxies close and remain compatible with the independent two-event reference.
The sharper common total range is2.9356511560e-4 to2.9429103957e-4.

| Seven-row source representation | Partial-L2 total | Relative error over766's common range |
| --- | ---: | ---: |
| Physical-source linear | 2.9887494564e-4 | +1.558% to+1.809% |
| Species-density-normalized linear | 2.9313681822e-4 | -.392% to-.146% |
| Species-density-normalized shape-preserving cubic | 2.9404580122e-4 | -.083% to+.164% |

Accepted767 uses a fixed nonuniform PCHIP rule on the identical source nodes.
Affine/constant controls, nodal restoration, positivity/no-overshoot and independent
knot-split transport convergence pass. Each cubic component and its total overlap
the reported physical interval. The extended65536-query reference768 preserves
every old physical value and resolves all three protections against normalized
linear interpolation. It stops under the registered condition, without larger
waves. Cubic-minus-linear absolute-error changes are[-.2492,+.0375] percentage
point Rayleigh,[-.3584,-.1696] Mie and[-.3091,-.0943] total. Mie and total improve
across that range; Rayleigh is protected without a resolved improvement claim.
The refined common total interval is[2.9372976836e-4,2.9422059179e-4]. These are
statistical plus empirical numerical ranges, not physical certificates.

Actual linear and normalized-linear hardware path checks758/760 pass independent
finite arithmetic at60/120/240 intervals. Variable-height direct-L1 calibration
761 exposes one tiny short-ground-ray cancellation; stable log1p/expm1 repair763
passes all16384 frozen queries, maximum relative discrepancy2.470e-6. Hardware
cubic interpolation is a separate, outstanding check.

Toronto native phase investigation765 was interrupted at the owner-requested
wrap after its completed degree128/order16 level. Independent audit762 checks
phase moments through degree1024 (maximum discrepancy4.926e-12). The whole-native
projection and independent full-phase driver checks must qualify before Toronto
producer admission. Neither this audit nor the paper partial-path result admits
later-order, full-cache, B1 or scene claims.

[Frame-contract proof00679](../../../../../tmp/experiments/sky-accuracy-dials/runs/00679-h136-frame-proof/summary.json)
confirms the original native controls use receiver-local cube vectors. Extra
rotated-direction run00677 is a diagnostic, not a correction to that layout.
Its initial recipe interpretation is explicitly superseded by this contract proof.

## Scope and next evidence

This is spherical distant-Sun, black-boundary L1-to-local-pure-J2. Toronto is
the registered optical profile, not a reconstruction of Toronto weather. All
eight H97 reserved physical tuples remain unexposed. No later-order, reflective-
ground, twilight, observer-color or B1 result is claimed. No physical sky image
is derived from the three diagnostic bands.

H134's reconstruction replay and exact retained B1 arithmetic pass in accepted00653.
H135's completed development runs00654-00657 and native report00659 are immutable.
Confirmation00658 is accepted. Finite-sum builder parity passes; continuous
operator qualification remains incomplete at the wrap. Production is unchanged; no standards reviewers/audits
are enabled for this contained experiment.
