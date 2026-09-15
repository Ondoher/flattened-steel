# Held Source Refinement After Reconstruction Correction

Status: registered before computing any atmospheric S320 target in this case.
This bounded `compensation-attribution-v1` test extends the original-grid
combination in `00205`. Its S160 columns were already known; this test must
establish a prediction on a genuinely new count.

## Scientific Question

Does correcting the identified reconstruction errors restore the expected
source-integration convergence on an unexecuted count, without fitting any
coefficient to radiance or Kider values?

Keep the same sixteen original altitude/solar anchors, 32 bottom-interval
samples, two channels, physical inputs and projection weights. Keep analytic
query density and phase and the finite-top-adjusted species-column
representation from `00205`. Do not use the additional exact-solar diagnostic
columns to construct the candidate.

For each species, predict the change from S160 to S320 from the known
trapezoidal endpoint term:

`deltaC = -(L/160)^2 * (f'(L)-f'(0)) / 16`,

where `f'(s)=-exp(-altitude(s)/H)*mu(s)/H`. Propagate `C160+deltaC`
through exactly the same nonlinear column reconstruction and transmission.
The forecast must be sealed before any atmospheric S320 integration executes.
An execution mode then reads that sealed prediction and evaluates S320 once.
Both records retain their source, plan and parent identities. A modified
predictor requires a new forecast; it cannot replace the existing prediction.

## Frozen Predictions

At each of the four ray/channel projections:

1. The S320 first-order component error against the continuous-query reference
   remains negative beyond the propagated allowance.
2. The absolute S320/S160 error ratio lies in `[3/16, 5/16]`, including
   propagated uncertainty on both numerator and denominator.
3. The predicted S160-to-S320 response differs from the observed response by
   at most 0.5%, comparing discrepancy plus allowance against resolved response
   minus allowance. The tighter threshold follows the leading quadrature
   remainder's expected fourfold reduction; no response coefficient is fitted.

Retain all twelve required group outcomes and all 64 local signs, ratios and
response checks, including failures and unresolved controls. The fixed
representation error floor remains part of the total component error. This
does not predict unlimited monotonicity as source error approaches that floor.

## Implementation And Evidence

New helpers below `continuation/source-refinement/` preserve all earlier
numerical evaluator bytes. Authenticate `00205` and its relevant input and
source identities. A generic reconstruction must exactly replay its reference,
S80 and S160 density values before predicting the new count. The generic finite
column integrator must reproduce retained S160 columns before computing S320.
Manufactured exponential/constant cases verify count scaling, signs, finite-top
behavior and failed/unresolved comparison gates. They do not use atmospheric
S320 targets. Run the complete POC type check before scientific execution.

Use the existing independently admitted column references and their empirical
allowances. No new adaptive reference solve, GPU job, complete viewing integral,
later-order recurrence or Kider comparison is included. The test qualifies this
component and retained domain; it does not establish production arithmetic parity
or behavior near tangent rays, twilight or other atmospheres.

The source unit is the new folder and its directly used collaborators, within
the continuing deferred attribution review baseline
`871690d334b4339f7aaee516dcc140dd00a3edaf`. Formal standards review remains
deferred under the owner's scheduling direction. Local proofs are not a claim
that the implementation review gate has closed.

## Resource Bounds And Stopping Conditions

Two serial records, each capped at 3 MiB and five CPU-job minutes with a
30-second finalization reserve, fit within the existing C5 and total allocations.
The target performs only sixteen finite S320 species-pair columns, plus the
S160 parity checks; at most 16,000 species-density evaluations. No large scratch is
needed. Admission must charge existing immutable evidence before each run.

One sealed forecast and one accepted assessment, including failed scientific
predictions, complete this bounded case. A replay or identity failure is an
execution failure and must remain recorded. Use the result to decide the next
discriminating test; do not automatically launch a count sweep.
