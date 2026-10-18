# H67 Locate the sunset L1-to-J2 error

Status: complete through accepted00447 and00448. [Results](sunset-j2-results.md)
own the operator attribution, images, precision and preserved failed attempt.
Owner-selected continuation after H66. Production and prior evidence remain
read-only. The goal is to identify where the first large later-order excess
enters, rather than infer the cause from accumulated brightness.

## Frozen controls and targets

Reuse H65 sunset physics and the Sun-focused k=.35 Corrected60 compiler:
Toronto phase/SSA, canonical amount/profile, San Jose sunset zenith89.9579152265,
observer5m, Native15, incoming F68, source20, normalized aerosol phase mass,
transport60. Initially measure channels3/5/8 (469.7/532.3/626.3nm), not a full
spectrum or paper score. Use exact ground nodes at solar rows89/90 (89.5/90.5deg)
and the0.05deg/5deg-relative-azimuth camera ray's Q30 samples0/4.

At each exact node choose the actual warped outgoing node closest to the primary
view; compare that physical direction across all methods. Off-grid targets use
the exact physical ray direction and retained cubic reconstruction supports.

## Calculations

1. Instrument the unchanged complete-domain GPU compiler through J2. Retain all
   68 incoming L1 values at both exact nodes, exact J1/J2 scalars and J1/J2
   reconstruction at both off-grid targets. Stop after J2; no need to rebuild N4.
2. Recompute each exact-node J2 from those same L1 values in binary64 with the
   identical F68 directions, weights, phase, density and Mie mass normalization.
   This must reproduce the field before attributing an error to input versus sum.
3. Independently trace continuous L1 at all68 directions at every target, with
   paired64/128 path controls. Replace only incoming L1 in the same normalized
   F68 sum. Retain species terms and the largest direction-by-direction changes.
4. Refine the continuous angular J2 integral at exact nodes using species phase
   importance32/64. Qualify angular and path convergence; a finest rule is not
   automatically an oracle. Retain the independent local J2 Monte Carlo check.
5. Use cache-free local GPU path estimates of J1/J2,32 batches of8192 histories
   with optical128 and8 paired optical64 batches. The initial second-event
   truncation encountered context loss before returning samples in failed00446.
   Preserve that run's compiler probes and algebra. The operational retry uses
   the already validated full-path kernel and1024-history draws, aggregating
   eight consecutive microbatches per reported batch. The seed ranges and
   total histories per target remain identical; later events cannot change the
   first-two prefix tallies. Retain microbatch evidence. Target5% J2
   empirical95% half-width; disclose rather than hide misses. Deterministic N1
   controls, positive illumination and shadowed exact nodes remain separate.
6. Report A=native-L1/F68, B=continuous-L1/F68, C=refined continuous angular J2.
   A-B isolates the incident-field substitution under the fixed rule; B-C is
   the angular-rule response under the continuous incident field. These are
   conditional differences, not independent universal correction factors.
   Compare off-grid reconstruction against independent local source estimates.
7. Render component ratios, angular/incoming-direction plots and a clear table
   of local source-density units. Three bands do not qualify full-color swatches.
   Verify immutable evidence, input/source identities, algebra and cleanup;
   run local types and inspect plots. No dedicated experiment reviewers.

Owner approved736MiB retained disk for this package; scratch/GPU bounds unchanged.
Prefer serial GPU execution and compact selected probes, not full field retention.
Use real runtime paths and authorized browser spawning. Keep progress visible,
preserve failed attempts, and continue useful progress beyond the60minute guide.

## Direct four-order construction question

Assess separately from this run: final cache storage is unchanged for the same
representation; direct construction can remove intermediate fields. Naive
deterministic nested transport repeatedly branches over incoming directions and
path samples instead of reusing prior fields, increasing work dramatically.
Cache-free Monte Carlo can accumulate orders along each sampled path with small
batch memory but requires many histories per cell. A fused GPU dispatch that
still reads interpolated prior fields does not remove the suspected error.
No direct-full-cache implementation or performance benchmark is selected here.
