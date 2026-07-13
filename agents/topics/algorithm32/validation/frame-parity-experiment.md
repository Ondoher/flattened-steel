# Algorithm32 Frame-Parity Experiment

Status: diagnosis, implementation, qualification, and production promotion complete. The controlled Z-up/handedness change
removes 97.3-98.4% of the current retained-boundary RMS in every condition and
98.06% combined. A determinant-`+1` 90-degree rotation agrees with its
unchanged binary64 CPU control at RMS `3.94e-18` and maximum `5.55e-17`. The
dominant cause is therefore the determinant-`-1` frame/handedness change, not
general rotation or backend execution. The remaining `12:45` J2 outlier is
caused by the retained paper run's exact-zero first altitude node versus the
former application-default first node at 2 m. Production now owns the 0 m node;
the GPU consumes a binary64 CPU-derived ground-contact mask for its discrete
incoming directions. Exact-0 m J2 CPU/GPU parity passes at RMS `1.7170e-7`
and maximum `7.6079e-7`, while the retained 2 m control passes at RMS
`1.0062e-7` and maximum `4.0205e-7`.

## Goal

Determine whether the retained/current J2 boundary drift is caused by the
audited change in benchmark world frame and finite source-frame orientation.
Use only current production Algorithm32 as the executable implementation and
the promoted retained direct-40 J2 table as a read-only result authority.

## Containment

- Implementation and runner source: `scripts/experiments/algorithm32-frame-parity/`
- Generated output and progress: `tmp/algorithm32-frame-parity/`
- The accepted profile/domain and GPU ground-contact correction are production
  implementation surfaces; generated evidence remains contained below `tmp`.
- Archived source may be inspected as historical evidence; no archived module,
  fixture, harness, policy, command, or run is executable input.

Every execution uses a new zero-padded sortable folder below the output root.

## Method

1. Reproduce the unchanged current X-up J2 result as the local control.
2. Apply a proper rotation to observer, Sun, view grid, Fibonacci frame, and
   W27 frame; require invariance within the established CPU/GPU envelope.
3. Apply the single X/Z handedness/reference-axis difference identified by the
   source audit.
4. Compare every generated spectral value with the promoted retained J2 table
   for `09:30`, `11:15`, and `13:30`.
5. Expand to all 17 conditions only if the retained residual materially
   collapses.

Required metrics are absolute RMS, maximum absolute residual and location,
signed mean, floored relative RMS, and per-condition B1 RMSE. No aggregate may
hide a failed value-level comparison.

## Work Plan

- [x] F0. Create the isolated current-production CPU profile and comparison
      runner with independently pollable progress.
- [x] F1. Prove the unchanged X-up control reproduces an existing current J2
      condition.
- [x] F2. Prove proper-rotation invariance.
- [x] F3. Run the retained-frame handedness counterfactual for the three
      bounded conditions.
- [x] F4. Diagnose the earliest differing stage or reject the frame cause.
- [x] F5. Update retained-parity guidance; do not modify production.
- [x] F6. Attribute the isolated `12:45` J2-or-earlier remainder.
- [x] F7. Add the profile-owned 0 m node and reproduce binary64 CPU contact
      classification on GPU while retaining the then-current application 2 m node.
- [x] F8. Pass exact-0 m J1/J2 parity, the historical 2 m control, 477 production
      specs, and the complete all-condition J4 retained boundary.
- [x] F9. Promote Z-up spherical/distant orientation and exact-0 m native
      domains, then reproduce the qualified J4 table through the ordinary
      production generator and pass the Flat32 browser gate.

## Bounded Results

| Time  | Current-to-retained RMS | Retained-frame RMS | Reduction | Current maximum | Retained-frame maximum | B1 current -> retained frame (mW) |
| ----- | ----------------------: | -----------------: | --------: | --------------: | ---------------------: | --------------------------------: |
| 09:30 |          `0.0024091041` |     `0.0000440233` |    98.17% |  `0.0165486265` |         `0.0002285466` |          `13.854945 -> 14.039107` |
| 11:15 |          `0.0014249657` |     `0.0000382646` |    97.31% |  `0.0081406084` |         `0.0001951960` |          `13.390315 -> 13.594474` |
| 13:30 |          `0.0019887490` |     `0.0000325104` |    98.37% |  `0.0100558320` |         `0.0001828082` |          `15.230944 -> 15.425405` |

Across the 9,720 values, current-to-retained RMS is `0.0019823750` and
retained-frame RMS is `0.0000385537`, a 98.06% reduction. The B1 scores move
slightly upward rather than improving. The frame change therefore explains
the retained/current numerical delta; it is not evidence that the retained
orientation is a more accurate physical quadrature.

The same-backend proper-rotation control compares current X-up with a
90-degree rotation around global Z at `11:15`. Across 3,240 values it has RMS
`3.9449924e-18`, signed mean `4.9016646e-19`, relative RMS `8.2473765e-17`,
and maximum absolute residual `5.5511151e-17`. The matching current GPU table
differs from the unchanged binary64 CPU control by RMS `2.3394116e-7` and
maximum `1.4072916e-6`; that earlier mixed-backend residual is precision, not
rotation failure.

## Retained-Frame J2 Dome Renders

The standard Figure 5 times `10:15`, `11:15`, and `13:15` were rendered from
the retained-Z-up J2 values into immutable run
`tmp/algorithm32-frame-parity/011-retained-frame-j2-domes/`. Their B1 RMSE
scores are `12.323516`, `13.594474`, and `14.627060` mW respectively. The run
contains three individual PNGs, a labeled SVG strip, and a result manifest
with source provenance and image hashes. These images expose the currently
tested J2 configuration only; they do not replace the canonical J4 Figure 5
comparison.

## Current-Worktree J4 B1 Control

A complete 17-condition cumulative-J4 GPU run against the current production
worktree completed in 125.3 seconds under
`tmp/algorithm32-frame-parity/013-current-worktree-j4-b1/`. It produced a
valid 55,080-value boundary, scored all 42,687 B1 values, and regenerated all
six B1 figures. Aggregate RMSE is `12.225732` mW; the displayed `10:15`,
`11:15`, and `13:15` scores are `10.979341`, `10.872633`, and `11.823660` mW.
The previous current-production GPU run scored `12.225715` mW with displayed
scores `10.979203`, `10.872635`, and `11.823653` mW. The current worktree has
therefore not materially changed B1 accuracy.

This control uses the maintained current X-up production configuration and is
the direct comparison boundary for the isolated retained-frame GPU result
below.

## Retained-Frame GPU J4 Result

The isolated retained-frame GPU path applies the Z-up mapping consistently to
the observer geometry, Sun direction, and all 81 view-direction constants in
the production final shader. Its `11:15` J2 proof agrees with the retained-
frame binary64 CPU diagnostic across 3,240 values at RMS `2.2800e-7` and
maximum absolute error `1.1916e-6`, passing the declared `5e-7` and `2e-6`
thresholds.

The complete 17-condition cumulative-J4 GPU boundary is retained in run 016;
run 017 copies those immutable values into the complete canonical provenance
schema, scores B1, and generates all six figures. Aggregate RMSE is
`11.935329` mW, compared with current X-up `12.225732` and historical retained
J4 `11.925783`. The displayed comparison is:

| Time  | Current X-up | Retained-frame GPU | Historical retained |
| ----- | -----------: | -----------------: | ------------------: |
| 10:15 |  `10.979341` |        `10.349462` |         `10.359799` |
| 11:15 |  `10.872633` |        `11.218502` |         `11.212044` |
| 13:15 |  `11.823660` |        `11.588177` |         `11.577412` |

Thus the retained frame improves aggregate B1 by `0.290403` mW (2.38%) versus
current X-up and finishes within `0.009546` mW (0.08%) of the historical
aggregate. Value-level comparison against historical J4 reduces full-boundary
RMS from current `0.0034681320` to `0.0003065680` (91.16%). That aggregate is
dominated by one `12:45` residual: maximum `0.01248238` at grid `(8,4)`,
channel 4. Excluding `12:45`, retained-frame RMS is `0.0000438277`. The frame
finding is therefore strongly confirmed at J4, but the isolated `12:45`
historical-parity remainder required the lower-boundary attribution below and
must not be hidden by the B1 aggregate.

## Isolated 12:45 Remainder

Order-separated retained-frame runs locate the remainder at J2. At `12:45`,
J2 differs from the retained table by RMS `0.0008573784`, with maximum
`0.0105105713` at grid `(8,4)`, channel 35. J3 and J4 propagate the same
grid-X-8 strip rather than creating it. A direct binary64 CPU/GPU comparison
at current settings has RMS `1.1266e-7` and maximum `4.7655e-7`, ruling out
the GPU backend as its cause.

The retained paper profile and construction path place altitude node zero at
exactly `0 m`; the current native 48-node domain places it at `2 m`. A bounded
current-production binary64 CPU counterfactual restored the `0 m` node while
retaining the Z-up frame. Across all 3,240 `12:45` J2 values it matches the
retained authority at RMS `1.5634247e-9`, signed mean `1.5373553e-10`, and
maximum `9.5259050e-9`. This attributes the one-condition remainder to the
lower-boundary node change in a ground-coupled finite-angular configuration,
not to a changed J2 recurrence.

The initial GPU `0 m` and 1 mm proxy runs remain rejected evidence. Follow-up
stage separation proved J1 parity, then localized J2 transport to one grazing
Fibonacci direction whose binary64 CPU root lies just outside the geometry's
roundoff tolerance. A build-derived 34-value contact mask now carries that
CPU classification into exact-ground GPU transport and reflection. Black-
ground J2 passes at RMS `1.3963e-7`, and production-ground J2 passes at RMS
`1.7170e-7`.

The completed exact-0 m retained-frame J4 run 040 scores `11.925778` mW versus
historical `11.925783`. Across all 55,080 spectral values, GPU-to-historical
RMS is `2.5582e-7` and maximum absolute residual is `1.9919e-6`. The 2 m
default control in run 041 independently passes its CPU authority.

Production promotion run 043 used the ordinary B1 GPU generator with no frame
counterfactual. Its complete all-17-condition J4 table has SHA-256
`50a6df87d73bf0b7979faa21675ecdb50099f4be02229313ab65518727bcd486`,
exactly matching isolated run 040, and scores `11.925778` mW. The promoted
worktree passes 477/477 Algorithm32 specs, 16/16 B1 production tests, 3/3
Flat32 browser tests, and both Algorithm32 and Flat32 type checks.

The outlier remains useful as a high-sensitivity accuracy diagnostic. Any
future attempt to reduce this ground-coupled finite-sampling weakness must be
scored across all 17 B1 conditions and the comparison domes; exact Star parity
alone is not an accuracy-improvement criterion.

## Conclusion

The diagnosed retained/current J2 delta entered when the benchmark/world frame
changed from retained +Z up to the formerly-current +X up through an X/Z component swap.
That swap is a reflection, so the fixed global +Z reference used by the finite
Fibonacci and W27 frames changes their physical orientation and handedness.
A proper rotation does not produce the delta. The isolated `12:45` remainder
came from the retained `0 m` first altitude node versus the former application-
default `2 m` node. The production node and GPU contact mask now reach
value-level parity through J4. Retained numerical orientation and exact-ground
sampling are now selected production contracts; visible-lobe review remains
an application observation, not a parity ambiguity.

The owning source audit is
[Retained J2 Source Audit](retained-j2-source-audit.md).
