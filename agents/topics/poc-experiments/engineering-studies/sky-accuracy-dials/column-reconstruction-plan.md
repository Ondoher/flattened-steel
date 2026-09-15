# Density-Factored Sunlight Columns

Status: registered before evaluating the new reconstruction controls.
This bounded test continues `compensation-attribution-v1` after `00203` traced
almost all remaining transmission reconstruction error to altitude interpolation.

## Scientific Basis

For species scale height H, starting altitude h, source cosine mu>0, atmosphere
height A and radius r=R+h, the geometric sunlight column has the exact identity

```text
C(h,mu) = exp(-h/H) Q(h,mu)
Q = integral[0,A-h] exp(-z/H) (r+z)/sqrt(r*r*mu*mu+2*r*z+z*z) dz
```

Factoring the starting density removes known exponential variation; it does
not fit a brightness offset. Q still contains spherical curvature, solar-angle
dependence and the finite top. For a vertical ray the exact finite-top column
is `H*(exp(-h/H)-exp(-A/H))`. The corresponding Q is not constant.

Compare three representations using the same admitted, exact-solar altitude
anchors from `00203`, separately for Rayleigh and Mie geometric columns:

1. Linear columns: interpolate C, then form optical depth and transmission.
2. Density-factored columns: interpolate `exp(h/H)*C`, recover C at the query.
3. Finite-top-adjusted factoring: interpolate
   `exp(h/H)*(C + (H/mu)*exp(-A/H))`, recover C and subtract the same constant.

The third is an exact change of representation and reproduces the finite-top
plane-parallel field exactly. It does not substitute plane-parallel columns
for the spherical references. Use weights `w_j*exp((h_j-h)/H)` to avoid large
absolute exponentials. Preserve the original query phase, density, source
irradiance, sample positions, positive projection weights and physical inputs.
Compare with the actual independent query transmission. The original
transmission-interpolation altitude error from `00203` is the control.

For finite-top vertical rays, the unadjusted factored column error is exactly
`-H*exp(-A/H)*(sum_j w_j*exp((h_j-h)/H)-1)`. The adjusted case eliminates this
term. Neither construction promises a universal error sign in spherical or
grazing geometry. No atmospheric parameter is tuned.

## Predictions And Verification

Before computing the controls, predict at least 99% absolute transmission-error
reduction for each factored representation, at every one of the 64 scalar
samples and each of the four fixed projections. Use the conservative predicate
`abs(newError)+Unew <= 0.01*(abs(originalError)-Uoriginal)`; an unresolved
control stays unresolved. Retain all 136 registered outcomes. The ordinary
linear-column control is descriptive and receives no post-hoc success gate.

Exactly authenticate and replay the preceding source, phase and transmission
decompositions. Derive each component-column allowance from both independent
rules, both tolerance scales, their reported errors and path-length difference;
retain its derivation and propagate positive weights through optical depth and
exponential attenuation. No new integration is needed. These remain empirical
numerical allowances, not rigorous physical-model bounds.

Manufactured proofs verify anchor reproduction, zero optical coefficients,
the exact finite-top vertical error above, and exact recovery by the adjusted
representation over multiple heights and species scales. Check failed and
unresolved accuracy gates as well. A passing field comparison qualifies this
specific representation on these samples; it does not prove GPU parity,
whole-sky accuracy, a resolution-count law, later-order correction or Kider gain.

## Execution Limits

Extend only `continuation/source-reconstruction/` within the deferred review
unit, preserving the earlier numerical evaluators for exact replay. One run
may retain 4 MiB and consume five CPU-job minutes with a 30-second finalization
reserve. Existing cumulative allocations and disk limits apply. Use no new
source integrals, GPU jobs or large scratch. Run the focused proofs and POC
type check; formal review stays deferred. One accepted diagnostic retaining
every failure completes the test; do not automatically start a broader sweep.
