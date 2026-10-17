# H59 Angular Interpolation Execution

Status: completed the [approved plan](angular-interpolation-plan.md).
[Results](angular-interpolation-results.md) own the scientific conclusions,
full B1 score and images. Baseline Git: `73af9897`. Production and all prior
immutable evidence remain unchanged. No further campaign is selected.

## Completed Milestones And Evidence

- 00371: three-band GPU angular isolation; saved corrected cumulative spectra
 and native node controls match exactly.
- 00372: frozen-input transport screen on four initial rows.
- 00374/00377: isolated L2/L3 injections on eight registered rows across the
 three witnesses; unaffected prefixes match exactly.
- 00375: fresh68/256/512 incoming-rule control, with exact native L1 replay.
 The refinement pair is not a converged physical reference.
- 00373/00376: immutable interim reports;00376's PNG was inspected.
- 00379: complete40-band GPU validation, exact reuse of12 channels from00378,
 and28 new wavelengths. Retains the compact GPU direct-base coefficients.
- 00380: full17x81x40 B1 frozen-increment score,17 interval table, and Figure5
 dome comparison. All55080 native N1 entries satisfy the replay allowance.
- 00381: all40-band common-p2 swatches, N1 spectra and signed per-order errors
 with reference intervals. Images were inspected.
- 00382: post-run verification of all13 preceding runs, exact reuse, component
 materiality, recurrence norms, combined interventions and arithmetic sensitivity.

The numerical paper gate passes at11.5920225214mW versus original11.6229140283
and corrected11.6684823920. This qualifies the experimental readout result;
it does not qualify a production implementation or twilight behavior.

## Questions And Decisions

1. Which paper baseline is the target? H55 controls confirm transport40,
   distinct from the earlier deployed15. Correct the plan label while preserving
   its original numerical RMSE target; H59 native replay stays normalized60.
2. Where should generated files live? Use the approved experiment-owned output
   root and immutable allocator, the specific plan boundary. Keep authored
   deliverables in the experiment/topic roots; no arbitrary system scratch.
3. Can N1 readout propagate through L1? No: L1 evaluates direct scattering
   analytically. Preserve compiled later orders and test N1 readout separately.
4. How to recover launch failures?00369 stopped before computation on an
   unnormalized executable path. Normalize it.00370 preserved Chrome spawnEPERM;
   use the approved launch route for00371. Neither produced numerical data.
5. Which recurrence support should be used? The initial transport screen used
   four rows near ray1. Register eight geometry-selected rows distributed
   across all three rays before the causal injection runs.
6. How to isolate angles? Use identical GPU direct-base/preceding-L inputs and
   original altitude/solar anchors. Change only outgoing-phase evaluation,
   restore shader anchor globals, and retain original reconstruction operators.
7. How to distinguish incoming quadrature? Freshly compute L1 at every new
   direction with unchanged source20/transport60. Native F68 replay is exact.
   Do not obtain the denser rule by interpolating68 values or call it converged.
8. Why did disk usage exceed estimates? Full282KiB controls were repeated in
   per-artifact derivations and terminal seals.00378 stopped at the retention
   guard after retaining channels0-11; channel12 was computed but not written.
   Preserve its failed immutable disposition, source/heartbeat validity and
   completed outputs. Compact subsequent recipes using canonical control hashes.
9. May the retention allowance change? Automatic approval review rejected the
   attempted624to656MiB continuation because owner authorization was required.
   Restore624 while waiting; ask explicitly. The owner approved656MiB retained
   disk, after which00379 resumed. No workaround bypassed the rejection.
   Scratch, GPU/system memory, free-disk and production limits did not change.
10. How to avoid rerunning completed work? Verify the failed run and its artifact
    hashes, exact control and adapted compiler identity, and full coefficient
    shape. Copy12 complete packets byte-for-byte into00379; repeat replay/node
    checks over all40 bands. Compute only28 remaining channels.
11. Is full B1 warranted? The demonstrated N1 mechanism has a general factored
    readout. Test it across the full boundary with identical GPU coefficients
    and compiled later increments. Validate binary64/GPU phase replay first,
    and retain a paired-arithmetic score to rule out a rounding-induced gain.
12. What did local checks find? Three tuple/readonly declaration errors appeared
    when the full-boundary reducer was added. Correct them without changing
    measured shader equations; the complete experiment type check then passes.
13. What may remain unresolved? Bounded row injections cannot determine global
    recurrence behavior, and256/512 is not converged. State those limits and
    preserve later-order discrepancies. Do not start an unrelated global
    quadrature sweep, production promotion or twilight campaign.

## Verification And Limits

Current experiment type checking and Git whitespace checks pass. Accepted and
failed runs00369- 00381 all pass ordinary immutable-run verification; failed
states are preserved. Source failures and heartbeat failures are empty.00382
verifies exact byte reuse, component scores, unaffected prefixes and the combined
interaction maximum5.56e-17. The paired-arithmetic B1 score differs by only
0.0000108748mW and still passes the original paper gate.

Native40-band witness replay and outgoing-node probes match exactly. Alternate
GPU native-angular reconstruction differs by at most1.20e-7. Full-boundary
binary64/GPU native N1 replay is within3.90e-6 and direct-angle witness replay
within3.16e-6, below the declared5e-6 allowance. The native field build remains
hardware GPU; only compact boundary reduction/color work uses CPU binary64.

All final swatches, spectra, order errors and B1 dome PNGs were inspected.
Bright near-Sun swatches compress visual differences; retained Y values and
signed residuals make that limitation explicit. No full-scene or horizon
appearance claim follows from these rays. No new external solver campaign,
experimental unit-test tree, dedicated reviewer or independent audit was run.
No standards-compliance claim is made. Production/runtime/twilight qualification
is deferred to separately authorized adaptation, not hidden as completed work.

## Timing, Resources And Checkpoints

Measured phase wall times:00371 screen29.24s;00372 transport46.14s;
00374 L2 intervention47.61s;00375 quadrature46.00s;00377 L3 intervention47.38s.
Full-spectrum00378 spent92.09s before its disk-limit failure. Resumed00379 took
223.06s including12-channel reuse and28 new GPU builds. Full B1 reduction and
figures00380 took52.07s; final verification00382 took6.32s. These include staging,
compilation, computation, readback, reduction and delivery as applicable; they
are not isolated kernel times or total agent reasoning time.

The renderer is hardware NVIDIA RTX2060 via ANGLE/D3D11; maximum texture width
is16384. Native compiler-owned field peak is165,607,200bytes per wavelength,
with final field bytes zero. That excludes context/driver and diagnostic memory,
so it is not total GPU usage. Resumed-job scratch peak is16,496,565bytes.
Final retained evidence is666,672,287bytes (635.79MiB), inside the approved656MiB
allowance; live scratch is empty and final measured free disk exceeds112GB.
All owned browser/solver clients exited; earlier evidence was never deleted.

The checkpoint adviser recommended the coherent intermediate unit; local commit
`e59b4bfe` records `Record H59 angular interpolation diagnostics`. The final adviser returned CHECKPOINT_URGENT and suggested
`Complete H59 angular interpolation validation`. That checkpoint records completed
validation and the approved disk allowance; its Git identity is reported in the
handoff. Local checkpoint messages/commits are
preauthorized by independent-execution; no push or publication is authorized.

## Reproduction

Each command allocates new immutable output; do not reopen the listed runs.
Use the returned paths for later consumers:

```text
node experiments/sky-accuracy-dials/angular-interpolation/run.mjs screen
node experiments/sky-accuracy-dials/angular-interpolation/run.mjs transport
node experiments/sky-accuracy-dials/angular-interpolation/run.mjs L2
node experiments/sky-accuracy-dials/angular-interpolation/run.mjs L3
node experiments/sky-accuracy-dials/angular-interpolation/run.mjs quadrature
node experiments/sky-accuracy-dials/angular-interpolation/run.mjs screen --full
node experiments/sky-accuracy-dials/angular-interpolation/paper.mjs <full-run>
node experiments/sky-accuracy-dials/angular-interpolation/report.mjs <full-run>
node experiments/sky-accuracy-dials/angular-interpolation/verify.mjs
node node_modules/typescript/bin/tsc -p experiments/sky-accuracy-dials/jsconfig.json
```

The executed recovery command was `run.mjs screen --full --reuse
 tmp/experiments/sky-accuracy-dials/runs/00378-h59-40-screen`. It only reuses
qualified complete packets and preserves the original failed run.
