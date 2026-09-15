# Constant Background And Directional Angular Response

Status: registered before evaluating this decomposition.
This bounded case continues `compensation-attribution-v1` after the source
reconstruction controls. Its purpose is to locate another error source, not
to repeat the existing phase-normalization sweeps.

## Evidence And Scientific Question

The existing proofs already quantify outgoing-direction-dependent incoming
phase normalization. The atmospheric factorial retains incident radiances
for the frozen `p-0930-5-7:h1000` point at radial/azimuth rules r8-a16,
r16-a16, r8-a32 and r16-a32 in runs `00161` and `00162`. These radial counts
apply within each of three geometric intervals. They are not full-sphere
product-grid counts.

Authenticate the retained nodes, compressed/decompressed identities, incident
method results, reconstruction geometry and original component sums. Reuse
the original outgoing direction and channels 0/8. Add no incident integration.
Only proceed if all required radiances, weights and phase geometry are present
and their original sums reproduce within the declared arithmetic allowance.

For each channel define one diagnostic constant C from the solid-angle mean
of total incoming radiance on the retained r16-a32 grid. Keep C fixed for all
four rules. This is a precisely defined background for an algebraic split;
two angular levels do not qualify it as the exact physical angular mean.

For phase species i and rule q, define

```text
N_i,q = sum_k w_k p_i(direction_out dot direction_k)
Q_i,q = beta_i sum_k w_k p_i(...) L_k
Q_i,q = beta_i C N_i,q + beta_i sum_k w_k p_i(...)(L_k-C)
```

For each existing radial-only, azimuth-only and combined refinement response,
split the exact difference into `beta_i*C*deltaN_i` and the remaining
directional-field response. Retain the factorial interaction as descriptive
evidence. Phase normalization for the physical model is one; report N-1
separately for each rule and species. Do not divide quadrature results by N
or apply a brightness correction.

This measures causes of the observed refinement response, not the absolute
angular error against a newly admitted oracle. Keep that distinction in every
report and conclusion. Propagate retained incident and arithmetic allowances,
including the diagnostic constant's conditional allowance, through the split.

## Frozen Predictions

For total Rayleigh-plus-Mie density, predict that the constant-background
contribution has at most 10% of the absolute radial-only, azimuth-only and
combined responses in each channel: six magnitude tests. Use
`abs(background)+Ubackground <= 0.1*(abs(response)-Uresponse)`; an unresolved
response remains unresolved. Preserve any failures. Report species and
atmosphere/ground components descriptively where the retained inputs allow.

Verify exact sum/response identities, isotropic incident-field and zero-light
limits, and preservation of failed/unresolved gates with focused manufactured
proofs. Reproduction of historical sums is an execution gate, not a prediction
that the historical angular rules were accurate. No Kider value is used.

## Execution And Stop

Declare a separate deferred implementation unit for
`experiments/sky-accuracy-dials/continuation/angular-background/` and its direct
collaborators, with baseline commit
`871690d334b4339f7aaee516dcc140dd00a3edaf` before its authored changes.
Production and immutable evidence remain unchanged. Required formal review
stays deferred under the owner's scheduling instruction; run local proofs
and the full POC type check.

One run may retain 4 MiB and consume five CPU-job minutes, reserving 30 seconds
for finalization, within remaining C5 and cumulative limits. Reuse node data
in memory; add no GPU work, optical integral or large scratch. One accepted
decomposition, with all scientific failures retained, completes this test.
If historical reproduction or input qualification fails, preserve that result
and diagnose it before drawing an attribution conclusion.
