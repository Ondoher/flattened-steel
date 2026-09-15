# Matched Fifth And Sixth Scattering Orders

Extension: `compensation-attribution-v1`. This prospectively registers the
next missing-order diagnostic. It follows package D of the
[attribution plan](attribution-plan.md), alongside the physical P2 work.
Historical N6 outputs are known; no matched H or P55 six-order output exists
when these predictions are recorded.

## Purpose And Matched Controls

The old six-order records use S20 with either T40/F68, T160/F68 or T40/I512,
and Q30 viewing integration. They cannot supply H's omitted-order contribution.
Use the exact original H S80/T160/I512, P48/W27 build request from
`00103-c-r0-scr`, preserving its physical inputs and N4 configuration. The new
contained driver separately declares actual orders 1 through 6. It must prove
its first four field and radiance outputs against that original accepted parent.

First capture `matched-h-n6`; then `matched-p55-n6` with the exact controls of
`00132-c-d55-raw`. These two cases test the interaction between altitude
resolution and finite omitted orders. A factored-species N6 recurrence is a
distinct possible extension requiring a separate implementation, exact raw-split
control and prior prospective registration; it is not implicitly the raw adapter.

Both cases initially use channels 0/8 and all forty original C0 probe rays.
This is a partial spectral diagnostic. Preserve the original parent's screen
selectors for prefix verification. New probe comparisons use the original
seven-method fixed-field view envelope, explicitly extended to actual N5/N6.
Do not pass the new six-order layout through a four-order decoder or relabel
N5/N6 as original N3/N4. Reused quadrature support or slot mappings must have
explicit actual-order derivations and exact N1-N4 parity.

## Predictions Before Matched H

At `p-0930-5-7` and `p-1230-3-5`, channels 0/8, let E4/E5/E6 be the admitted
grouped cumulative reference-envelope means. Let their view allowances be
U4/U5/U6. Define a=E5-E4, b=E6-E5, Ua=U5+U4 and Ub=U6+U5.

1. Both added increments are positive beyond their own view allowances.
2. The second added increment is between one-quarter and 0.65 of the first,
   after comparison allowance: `b+Ub >= 0.25*(a-Ua)` and
   `b-Ub <= 0.65*(a+Ua)`. This predicts a finite-order ratio range; it does
   not assert a contraction law or bound orders seven onward.
3. The exact N1-N4 field, original spectrum and probe-envelope parity checks
   pass. Fixed-field numerical envelopes remain admitted at actual N5/N6;
   unresolved envelopes prevent their use as quantified tail additions.
4. Where the physical P1/P2 substitution has an adequate component reference,
   adding the matched positive E6-E4 to its frozen original J3/J4 residual
   increases squared error at the selected overbright morning channels and
   decreases squared error at the selected underbright midday channels.
   Require the relevant correction and residual signs to be separated from
   their numerical allowances, and verify the exact SSE identity. If either
   component reference remains unqualified, keep this assessment unresolved.

The ratio forecast is informed by the historical selected ratios of roughly
0.32-0.53, under explicitly different controls. Preserve any failed transfer.
These tests can distinguish a finite omitted-order contribution from a
second-order numerical error. They cannot demonstrate numerical accuracy of
N5/N6 recurrence fields, infer an infinite tail from two increments, or assign
the remaining discrepancy solely to physics or measurements.

## P55 Contrast And Next Prediction

The P55 capture must satisfy the same exact matched N4 prefix and view-admission
gates. Compare its finite E6-E4 addition with H's at identical probes and
channels, including the propagated view allowances. Preserve signed changes,
spatial/spectral norms, and the interaction between altitude refinement and
order truncation. Register any quantitative H-to-P55 tail-response forecast
after H is available but before P55 execution; do not invent that forecast
after viewing P55's output.

## Resources, Isolation And Evidence

Use the existing experiment-owned raw six-order GPU driver and unchanged
production common shader read-only. A new contained browser/host adapter may
carry the six-order diagnostic contract and actual-order derivations. Do not
alter any previous capture, four-order decoder or production behavior merely
to admit new evidence. Run focused manufactured order, sparse-index, actual-order
mapping and prefix-rejection proofs, plus the complete POC type check.

Each case reserves at most 6 MiB and fifteen GPU-job minutes, with two minutes
for finalization. Authenticate the remaining original C5 allocation, total
36 GPU-attempt ceiling, 18 GPU-job hours, 8 CPU-job hours, storage cap and disk
floor before admission. These cases consume those existing limits; they do not
raise them. Start with H alone and use measured cost to admit P55. Historical
N4 timings of about 158/144 seconds at six screen channels are planning context,
not N6 estimates. The raw driver adds four passes while preserving its streamed
peak field layout. Count sparse-union memory and independent view work too.

Retain compact spectra, field hashes, complete prefix evidence, diagnostics,
plans, source/tool identities, predictions and derivations. No full texture
packages or scene caches are retained. Reproducible scratch is owned, verified
and removed at completion. Every failed attempt and prediction remains a new
immutable record. Formal source review remains deferred under the owner's
scheduling instruction.
