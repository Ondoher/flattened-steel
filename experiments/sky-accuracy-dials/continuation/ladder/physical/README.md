# Physical First-Order Ladder Attribution

`readPhysicalFirst` pins accepted physical reference 00109, authenticates its
control and all 160 rows, and repeats admission from both methods and their
two-pass work records. Its returned parents must enter the owning ladder recipe.
`evaluatePhysicalFirst` consumes only `readLadderCapture` results, whose full
six-method fixed-field envelopes are already reconstructed and authenticated.
It performs no new physical or GPU evaluation.

Every R0-to-rung comparison uses grouped independently integrated N1 and N4
on the same forty biased probes and four registered channels. For each scalar,
`n=L1-P`, `r=L4-M`, `p=L4-L1+P-M`; the tables verify
`r²=n²+p²+2np`. The remaining discrepancy changes with the rung and includes
higher-order numerical error, scattering tail, physical-model and observation
discrepancy. It is never a physics-only term.

For J1, `u=Ufixed1+Uphysical`. The conservative paired allowance is
`Upair=L2(uR0+urung)`, counting the shared physical allowance on both sides.
The group reduction is `D=L2(nR0)-L2(nrung)`, qualified only when
`Upair<=0.2D` and `D>2Upair`. These remain empirical allowances, not statistical
or rigorous bounds. R0's self-comparison has zero reduction and does not qualify.
The remaining-term allowance is `Ufixed4+Ufixed1+Uphysical`; N4 measurement
residual allowance covers only fixed-field integration, not measurement error.

Missing/empty/unresolved groups retain null numerical gates and compensation
terms. No unresolved scalar is dropped from a norm. A missing N4 envelope does
not invalidate an otherwise resolved J1 comparison. These are retrospective
local numerical results, not a full-N4 reference or prospective Kider dial.

The parent retains compact points/groups/coverage tables as compressed JSON/CSV
under its existing 2 MiB allocation. `physicalFirstProof` checks independent
manufactured compensation, allowance, empty/missing and unchanged-control cases.
