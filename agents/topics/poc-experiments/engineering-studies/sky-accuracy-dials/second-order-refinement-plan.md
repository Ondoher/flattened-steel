# Second-order Reference Refinement And Dial Attribution

Extension: `compensation-attribution-v1`. Status: prospective refinement
registration after the accepted `00164-p2-view-coarse` result and before any
refinement target in this document. This develops the
[viewing-ray reference plan](second-order-reference-plan.md) within the existing
source, production, immutable-evidence and resource boundaries.

## Fixed Inputs And Question

Use the original C0 ray `p-0930-5-7`, channels 0 and 8, and the unchanged physical
model. Preserve all four J2 source components. The original grouped H N2-N1
contributions are 0.022392116107357238 and 0.02235565026719588 W m^-2 sr^-1 nm^-1.

The accepted coarse parent is `00164-p2-view-coarse`, seal SHA-256
`b6c7281c93fe8d8c1e0ca1e41c480cd7b63100215c03bc60434ac16f6174eefe`.
Its ordinary radial16/azimuth32 whole-view estimates are
0.021232767252490844 and 0.019824211892246934 W m^-2 sr^-1 nm^-1.
The independent mapped-cosine estimates are 0.021232783442529234 and
0.019824280459389994. Their close integrated agreement can conceal cancellation
along the path; retain weighted absolute local differences as well.

The coarse output passes 214 inner-admission, identity and first-shell-ground
predicates, but its outer quadrature is not yet qualified. It suggests original
second-order errors of approximately +1.159 and +2.531 mW at this one ray.
The aim is to test whether those differences and the apparent benefit of earlier
density/altitude changes survive independently refined viewing integration.

## Executable Outer Matrix

Keep the physical altitude splits [0, 1875, 8000, 24000, 60000] m and all three
original angular rules at every new unique physical query. Counts below are
per physical interval. The square-root-height Simpson endpoint at ground has
exactly zero Jacobian and is omitted analytically; no arbitrary height replaces
it. Shared positive interval endpoints keep their separate integration weights.

| Stage         | Rule and selected intervals                  | New physical solves before exact reuse |
| ------------- | -------------------------------------------- | -------------------------------------: |
| `simpson4`    | Simpson4 in sqrt(height), all intervals      |                                     16 |
| `gauss8-low`  | Gauss8 in sqrt(height), intervals 0 and 1    |                                     16 |
| `gauss8-high` | Same complete Gauss8 rule, intervals 2 and 3 |                                     16 |
| `simpson8`    | Simpson8 in sqrt(height), all intervals      |                16 after Simpson4 reuse |

Each complete physical solve uses 1,728 incident representatives: ordinary
radial8/azimuth16, ordinary radial16/azimuth32 and mapped radial16/azimuth32.
The Gaussian split changes job size only. A low-half record retains null full
integrals until its complementary nodes exist in an accepted parent. Physical
reuse requires identical original observer, query coordinates, view direction,
path distance, requested height, spectrum and numerical/angular policy. Different
outer weights or node labels do not justify repeating an identical physical
solve, and their new derivation must remain explicit.

## Predictions Frozen Before These Targets

These predictions test new numerical reference outputs. Earlier candidate GPU
outputs and Kider data are already known; this is not a claim that those older
candidate outputs were withheld.

For each spectral channel and each of the two fine angular placements, denote
the current complete Gauss4 value by G4, the future Simpson4 value by S4, and the
future complete Gauss8 and Simpson8 values by G8 and S8. Let U(X) be the sum of
the positive-weight incident and final-view column allowances for X; it excludes
angular and outer-integration error. Use 1e-7 W as the declared comparison floor.

1. All selected physical points pass unchanged incident, geometry, final-view
   attenuation and component-sum admission. Missing or unresolved points never
   become zero-valued contributions.
2. `abs(S4-G4) <= 0.01*abs(G4) + U(S4)+U(G4)`. The first independent outer
   formulation should change the complete second-order value by less than 1%.
3. `abs(G8-G4) <= 0.5*abs(S4-G4) + U(G8)+U(G4)+U(S4) + 1e-7 W`.
   The already smoother Gaussian rule should need a smaller correction than the
   initial Simpson/Gauss disagreement. This is a falsifiable empirical forecast,
   not an assumed Gaussian convergence exponent.
4. `abs(S8-G8) <= 0.25*abs(S4-G4) + U(S8)+U(G8)+U(S4)+U(G4) + 1e-7 W`.
   Refinement should reduce the independent outer-method disagreement. Report a
   failed or unresolved outcome rather than choosing a new factor afterward.
5. Every complete refined estimate remains below the original H N2-N1 value in
   both channels, with that sign separated from combined numerical allowance.
6. After an adequate component reference is established, P55 raw and P48 density
   factoring each reduce absolute second-order numerical error by at least 80%
   relative to their matched H/raw-split controls, in each channel. Apply the
   uncertainty-aware inequality
   `abs(candidate-R)+U(candidate)+U(R) <= 0.2*(abs(control-R)-U(control)-U(R))`.
   If its right side is nonpositive or reference adequacy fails, the result is
   unresolved. This concerns pure second-order numerical accuracy at this ray;
   it does not qualify whole-N4 or seventeen-time Kider accuracy.

## Reference Admission And Angular Follow-through

Outer-rule agreement does not qualify a shared angular discretization. Retain,
per component, both the signed whole-view angular response and the positive
path integral of its absolute local response. The latter must not exploit
opposing signs at different heights.

Before treating R as an adequate reference for prediction 6, require complete
coarse/fine and independent outer comparisons, admitted inner quantities,
explicit radial-placement comparisons at every material query, and an additional
azimuth64 comparison at fixed radial resolution on the same final-view nodes.
Register its exact point batches, source policy, correction-shrinkage prediction
and allowance equation before executing it. If either angular axis remains
material, refine that axis or independently change its placement. Do not
substitute low Kider error for this admission.

The resulting empirical reference allowance must be no more than 5e-5 W per
channel and no more than 20% of the original H-to-reference difference. Carry
separate outer, angular, incident and final-view terms and state that this is
an empirical numerical allowance, not a rigorous mathematical error bound or
measurement uncertainty. A failed gate redirects the next bounded comparison;
it does not justify modifying a frozen prediction or stopping the broader work.

## Reused Dial Comparisons And Score Accounting

After reference admission, inspect the exact grouped N2-N1 contribution and its
fixed-field integration allowance in these accepted parents:

| Parent                 | Matched control and role                                                  |
| ---------------------- | ------------------------------------------------------------------------- |
| `00103-c-r0-scr`       | H baseline: P48/W27, incoming16x32 midpoint, S80/T160                     |
| `00115-c-r1-scr`       | S160 versus H; the earlier failed 00114 is not a replacement parent       |
| `00140-c-h-t320`       | T320 versus H, preserving S80                                             |
| `00135-c-i512-end`     | Endpoint-aware azimuth placement versus H                                 |
| `00136-c-i512-aspect`  | Incoming8x64 versus16x32 at the same total count; a distribution tradeoff |
| `00130-c-d48-split`    | Raw split higher-order species versus H; control for factoring            |
| `00131-c-d48-factored` | Query-density factoring versus raw split                                  |
| `00132-c-d55-raw`      | P55 altitude grid versus H                                                |

Use `grouped-split-higher` and `grouped-factored-higher` for the respective
special representations, retaining their own species operators. Other listed
comparisons use `grouped`. Authenticate the original schemas and reproduce
each seven-method `reference-envelope`; do not substitute cumulative sums or
an invented scalar reconstruction. The earlier captures require no new GPU
execution. This inventory tests multiple numerical factors against the new
reference rather than focusing solely on the ground-boundary mechanism.

For measurement attribution, replace effective J2 while retaining physical P1
and the original effective J3/J4. Report the signed residual, numerical error,
SSE change and compensation cross term. Also report the combined P1/P2
replacement relative to original raw N4 and distinguish the algebraic score
interaction from a change in the recurrence itself. A prospective second-probe
comparison should test transfer to the frozen 12:30 ray after this reference is
adequate; its new physical reference must be registered before execution.

## Resources, Evidence And Implementation Gate

Each stage reserves 4 MiB and at most one CPU-job hour, including a one-minute
finalization reserve. At most four workers run at once, under the unchanged
memory headroom, 40 GiB disk floor and cumulative C5 allocation. Current measured
worst complete-point cost is 42.366 wall milliseconds per incident; sixteen
new points project to about 19.5 minutes before the twofold safety multiplier.
Recheck actual admission before every stage and after each complete point.
Record worker task time separately from the existing wall-time CPU-job ledger.

Retain compact physical-point sums, complete view-column diagnostics, source
and tool identities, exact reuse derivations, predictions and checks. Keep
reproducible incident arrays in memory. Every result receives a new immutable
run, and every failed prediction remains evidence. Outcome assessment may be a
subsequent derived run; an executor's inner-admission success does not by itself
pass these prospective reference or dial predicates.

The deferred source unit now also includes `continuation/second-order-refine`
and later directly related angular/assessment helpers, under the previously
captured `871690d3` baseline. Local proofs and the POC type check continue.
Formal review remains deferred by the owner's scheduling direction. Production
code remains read-only.
