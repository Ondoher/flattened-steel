# Targeted Accuracy Improvements: First Pass

## Objective And Authority

The owner retargeted work toward improving Bruneton RMSE, using Kider
agreement as a practical proxy, without choosing settings that balance known
numerical inaccuracies. This bounded package supersedes the open-ended
execution authority in the earlier attribution plan. Historical plans and
sealed results retain their original meaning.

Reuse retained data whenever compatible. Prefer GPU execution when it reduces
work. The first pass has a hard three-hour elapsed limit, including analysis
and implementation; stop by 2026-09-15 18:00 UTC. Do not automatically create
another investigation after a failed or unresolved result. Limit this package
to three new evidence records, including failed attempts, within existing
experiment storage and compute allocations. At most the one remaining GPU
construction attempt is available. Formal reviews remain suspended; local
checks do not close the deferred source-review gate. The owner reenabled
checkpoint advice, preapproved advised commits and the suggested messages,
and requires adviser suspension if a consultation exceeds one minute.

## Fixed Comparisons

1. **Representation:** evaluate the complete 2 x 2 x 2 factorial of query
   density, query phase, and density-factored finite-top-adjusted sunlight
   columns. The reference control uses reconstructed combined density/phase/
   transmission. Separate the effect of factoring columns from merely moving
   transmission outside the product reconstruction. Preserve that additional
   operation-order control explicitly.
2. **Source count:** repeat the same representation matrix at S80 and S160.
   Compute signed source-by-representation interactions. Existing S320 evidence
   remains supporting evidence, not a reason to start a new count ladder.
3. **Accuracy and score:** compare complete-ray first-order results against
   retained independent P1 references. Hold the original GPU higher-order
   radiance fixed and report the resulting Kider proxy RMSE, numerical-error
   squares, remaining-discrepancy squares, and their cross term. This is a
   final-view substitution diagnostic; changed source integration is not a
   regenerated higher-order solver.

Use all 40 C0 probes at channels 0, 8, 24 and 30: 160 already referenced
scalars at five times. The two previous morning/noon rays remain named
subgroups. This selected difficult-probe score is not the full Bruneton or
17-time Kider score. Physical inputs, geometry, P48/W27/Z180, measurement
weights and higher fields stay fixed. No fitting of physical coefficients,
brightness offsets, interpolation blends or count exponents is permitted.

Run the new source-column and complete-ray factorial on the GPU. CPU work is
limited to preparing authenticated geometry, orchestrating the job, scoring
the returned spectra and focused manufactured checks. Reuse the retained GPU
higher fields, independent physical references and measurement values. Retained
source columns supply matching numerical witnesses where available. Require
at least eight column witnesses, with differences no larger than 0.005 metres
or 0.002% of the retained column, whichever is larger. This is a Float32
implementation screen, not a physical-reference uncertainty estimate. Do not
repeat independent reference integrations. The new GPU shader is a bounded
experiment implementation; compare its raw control with retained production
field results and report any discrepancy explicitly.

## Numerical Boundary And Frozen Criteria

Compare altitude-segmented midpoint levels 8 and 16 using the same
two-half-step attenuation equation. Prioritize directional results, not tight
remainder estimates. Use twice the absolute 8-to-16 change, the retained
physical-reference allowance and an explicit Float32 screening floor to flag
small or unstable directions as unresolved. This diagnostic guard is not a
qualified GPU error bound and cannot rule out shared bias. No finer ladder
or new reference method follows an unresolved result.

Predict that the complete corrected representation reduces first-order error
norm relative to its raw GPU control, in the aggregate and each time group.
Test whether S160 reduces its remaining error and whether both view levels
agree on the direction. Preserve unresolved directions and all individual signs.
No Kider improvement is predeclared: it is the selection objective, evaluated
separately from correctness. A useful proxy gain is at least 0.01 spectral mW
RMSE in the selected aggregate; report every time regression.

For n = candidate P1 - reference P1 and r = frozen higher light + reference
P1 - measurement, retain SSE = ||n||^2 + 2 n dot r + ||r||^2. Report whether a
proxy gain accompanies smaller numerical error or increased cancellation.
Do not call a score gain caused solely by increased known numerical error an
accuracy improvement. Decompose the factorial into all main, pair and triple
terms using inclusion-exclusion; retain signed vectors and pairwise dot
products so large opposing terms cannot disappear in a scalar norm.

The running shader must follow the [per-sample constraint](design.md#running-shader-cost).
The CPU experiment may use loops for precomputation and reference comparisons.
A promoted sample evaluator needs fixed-count lookups and loop-free arithmetic;
multiple outer ray samples are permitted. Report source evaluations, sample
counts and reconstruction support separately from measured GPU performance.

## Review Baseline And Stop

Baseline commit: c7803b241f0f8f409226354dc4fb72484f25a5ec. The pre-existing
unstaged changes are design.md, accuracy-findings-brief.md and status.md in this
topic; no staged or untracked paths existed. Initial patch fingerprint is
ee22aa7c57ffda746faa9c0128e90d52649de129346b90dc20771b3be298ff3b,
SHA-256 of UTF-8 PowerShell `git diff --binary HEAD` lines joined by LF without
a trailing newline. The task unit is the new targeted-improvements source and
its governing topic updates plus directly used numerical collaborators.
The earlier deferred baseline remains unchanged.

One GPU matrix record is expected to complete the comparisons. Reserve at most
6 MiB for it, including source snapshot and seal, and at most 30 minutes execution.
Any further record must remain inside the run, GPU-attempt and elapsed caps
and directly support these same corrections. No new
angular, order-tail, physical-model or independent-reference campaign is
admitted. Finish with a decision table: supported knob, correctness direction,
Kider effect, compensation terms, cost, and missing qualification. If the
corrected candidate worsens the proxy, report that result and stop.
