# Source-column pilot

This contained CPU pilot tests the source beam at the first 16 H view16
midpoints on each frozen C0 ray `p-0930-5-7` and `p-1230-3-5`, channels 0/8,
plus every supporting physical altitude/solar cache anchor. It retains the
exact ray, midpoint, sparse stencil and knot identities. It neither builds a
GPU field nor evaluates whole-view N1/P2.

The owning prospective criteria are in
[source-column-plan.md](../../../../agents/topics/poc-experiments/engineering-studies/sky-accuracy-dials/source-column-plan.md).
The prediction CPU record evaluates S80 and independent adaptive Gauss/Simpson
source columns at tolerance scales 4/1. It freezes an endpoint-derivative S160
response forecast before any `source-column-s160` attempt. A separate target
record authenticates and replays that forecast, evaluates S160, and preserves
every scalar and grouped gate. Neither run uses a higher count as its oracle.

`runSourceColumnAudit(C0)` creates the prediction;
`runSourceColumnAudit(C0, predictionRun)` creates target and assessment.
The equivalent CLI is `node continuation/source-column-audit/run.mjs C0 [predictionRun]`
when invoked from the experiment source directory. Use the original pinned
Node executable. Each run is capped at 3 MiB and five CPU minutes, including
a 30-second finalization reserve, and charged to existing C5.

`sourceColumnAuditProof()` in `proof.mjs` checks manufactured equations,
reference admission, failure and interruption handling without loading actual
pilot coordinates. `readSourceAuditInput()` constructs/authenticates geometry
without source integration. No experimental test framework is added.

The finite rule follows the compiler's anchored binary64 equations; this does
not certify shader Float32 arithmetic or transcendental behavior. The
reference rotates the same anchor height/cosine into a radial coordinate
frame. Independent exit-length disagreement is retained as an optical-depth
allowance. All reference allowances are empirical numerical consistency
estimates. Reconstruction interaction, incoming integration, view transport,
recurrence and whole-view accuracy are explicitly deferred. Existing C3 already
demonstrates finite source/transport cancellation without interpolation.
