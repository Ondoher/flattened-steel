# Direct Idealization Convergence: Fixed Execution Plan

## Authority and scope

The owner's renewed "do that now" requests convergence on the five selected
Kider rays, and the subsequent explicit reply permits cache-free Monte Carlo
with statistical uncertainty. Kider is the empirical correctness target; the
converged equation is the numerical reference. Keep physical inputs and solar
geometry fixed. Do not tune numerical error to cancel a measurement residual.

This is one new GPU job, following all 39 charged attempts through immutable 00229. Earlier plans remain consumed. Stop at 25 minutes of job time, with
30 seconds reserved for closing the owned browser and sealing, and in all
cases before 2026-09-15 22:44 UTC (three hours from this renewed work).
No automatic retry. Retained output forecast: 550,000 bytes of the remaining
561,725 C5 bytes. Global storage, compute and phase allocations are unchanged.

Review unit: new stochastic direct solver, its bounded runner, new package
authority and resource dispatch integration. Baseline HEAD
`c7803b241f0f8f409226354dc4fb72484f25a5ec`; existing uncommitted source is
preserved and the run snapshots exact source identities and changed bytes.
Formal reviewers remain suspended by the owner; checkpoint adviser remains
blocked by the previously recorded stale calibration gate.

## Estimator and checks

Use backward scalar-spectral paths. A constant sea-level extinction majorant
and null-collision rejection sample the physical free-flight distribution.
At a real collision, add `weight * sunlight * K / extinction`; continue with
`weight *= scattering / extinction` and a direction from the exact scattering
mixture. Rayleigh uses uniform-cosine rejection; Cornette-Shanks uses the
Henyey-Greenstein proposal, accepted with `(1+cosine^2)/2`. At ground, add the
direct Lambert contribution and continue with a cosine-weighted direction
and the physical ground albedo. There is no physical-field cache.

After interaction 8, survive with probability 0.8 and divide surviving weight
by 0.8. This preserves the expected contribution of later interactions rather
than truncating them. A separate safety ceiling fails the calculation instead
of silently accepting truncated paths. These are standard null-scattering
and compensated-termination constructions; see the primary descriptions in
[PBRT transmittance](https://pbr-book.org/4ed/Volume_Scattering/Transmittance)
and [Russian roulette](https://pbr-book.org/4ed/Monte_Carlo_Integration/Improving_Efficiency).
The authored implementation and phase-mixture derivation are specific here.

Fixed matrix, each on all 20 ray/wavelength combinations, 8,192 paths/batch:

| Profile    | Solar nodes | Batches | Roulette starts | Seeds                    |
| ---------- | ----------: | ------: | --------------: | ------------------------ |
| t32        |          32 |      32 |               8 | paired base              |
| t64        |          64 |      32 |               8 | paired base              |
| reference  |          64 |     128 |               8 | independent offset 2^30  |
| roulette16 |          64 |      32 |              16 | same starts as reference |

Retain independent batch means for total, first, second, third-and-higher
radiance, plus maximum visited depth. Approximate marginal 95% intervals use
2.04 times the batch standard error; they are sampling intervals, not bounds
on physical-model or input error. Fixed counts avoid stopping when noise
happens to make an interval small. Report first/second halves independently.

Check the first interaction against fresh binary64 direct quadrature at
128/256 view and transmission nodes. Require absolute CPU change below
0.01 mW, and GPU first-order difference below six estimated standard errors
plus max(0.001 mW, 0.03% of the CPU result). Reuse old second-order evidence as
comparison only because its angular convergence was not established.
Manufactured checks cover the phase normalization/rejection identity,
vacuum transport, ground reflection, absorption-only zero radiance and the
existing 46 deterministic properties. GPU manufactured cases precede data.

## Interpretation gate

Desired numerical resolution per total is max(0.5 mW, 0.5% of modeled value).
Report whether sampling intervals meet it. Separately require paired solar
refinement magnitude plus its 95% sampling allowance to fit that tolerance,
and report the roulette contrast with its uncertainty. No finite refinement
test proves a strict bound on all floating-point or quadrature bias.

If these checks pass, describe an approximately converged reference at the
reported precision, with all residual limitations. If not, mark unresolved
components explicitly. Compare signed residuals against unchanged Kider data;
do not claim Bruneton RMSE improvement from these selected rays. Preserve
partial evidence and seal failed if execution, verification or the deadline
fails. No production changes or promotion are included.
