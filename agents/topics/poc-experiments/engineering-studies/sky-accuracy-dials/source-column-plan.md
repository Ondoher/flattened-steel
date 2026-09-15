# Prospective source-column discriminator

Extension: `compensation-attribution-v1`, phase C5. This plan owns only the
new `source-column-predict` and `source-column-s160` CPU cases. Production,
the physical reference core and prior evidence remain immutable.

## Missing question and fixed scope

C3's existing S80/S160 by T160/T320 factorial already demonstrates finite
source/transport cancellation without cache interpolation. C2 also establishes
source-dial dependence on the surrounding reconstruction. Do not repeat that
factorial or claim the present scalar source test explains integrated N1/P2.

The missing discriminator is whether each source optical column becomes more
accurate when S80 changes to S160, even where downstream N1/P2 error grows.
Freeze the first 16 altitude-segmented view16 midpoints in the original H
0–1875 m interval for C0 rays `p-0930-5-7` and `p-1230-3-5`. Include every
altitude/solar anchor touched by their original monotone-cubic stencils, with
outgoing support retained for provenance. Compute channels 0 and 8 only.
Deduplicate source anchors by physical altitude and solar-node index; retain
every ray association. Samples and knots remain separate reporting scopes.

Authenticate exact C0 `00099-c0-registration`, H `00103-c-r0-scr`, and the
S160-only control `00115-c-r1-scr`. The latter supplies controls, not target
source values or a numerical reference. Derive exact controls from the
original inputs and original case definitions. Frozen C0 ray coordinates,
interval endpoints, midpoints, stencils, source anchors and compiler source
identity are retained. The bounded pilot supports lit outward source paths;
unsupported geometry rejects execution instead of silently dropping rows.

## Prediction before target

The first CPU record evaluates S80 and independently integrated reference
columns, then seals `sky-source-column-prediction-v1` before every attempted
`source-column-s160` case. It never evaluates S160 at actual pilot coordinates.
Manufactured proof data are separate. The target CPU record requires that
accepted exact forecast, matching plan/source/input identities and ordering
before every prior target attempt, including failed attempts. It recomputes
the frozen formula from retained inputs before evaluating S160. No refitting,
replacement model, survivor selection or count-based oracle is allowed.

Let kappa(s) be the two-species extinction along source distance s, L its
atmospheric exit length and h=L/80. Composite trapezoid endpoint analysis gives

```text
predictedDeltaTau = -(h*h/16) * (kappa'(L) - kappa'(0))
predictedDeltaT = T80 * expm1(-predictedDeltaTau)
kappa_i'(s) = -kappa_i(s) * mu(s) / H_i
expected abs(tau160-tauReference)/abs(tau80-tauReference) = 1/4
```

The leading endpoint term is the frozen model, not an assumed remainder
bound. Non-asymptotic S80 behavior can reject it. No S320 result is requested.
The anchored binary64 finite rule follows the production composite-trapezoid
equation, accumulating species columns separately before spectral combination.
That operation ordering is explicit; it does not assert exact shader arithmetic parity.

## Independent reference and uncertainty

Reuse unchanged exponential-column integrators with adaptive Gauss and Simpson,
each at tolerance scales 4 and 1 and its standard work caps. Rotate each
source path to origin `(0,0,R+h)` and direction `(sqrt(1-mu^2),0,mu)` so the
stored anchor height and cosine remain exact. Compute its exit independently;
include `abs(L-independentL)*(betaR+betaMext)` in the optical-depth allowance.

For each channel set `tau=betaR*columnR+betaMext*columnM` and
`t(tau)=1e-9+1e-8*abs(tau)`. All four passes must be complete and converged.
Each coarse/fine difference must be at most `4*t(coarse)+t(fine)`, each fine
weighted remainder at most `t(fine)`, and the independent fine-method
difference at most `t(fineGauss)+t(fineSimpson)`. The reference is the mean of
the two fine values. Its allowance U is twice the maximum of the three
coarse/fine/intermethod differences and the two fine weighted remainders,
plus the exit-geometry allowance. This is empirical consistency, not a rigorous
error bound. Transform both sides of the optical-depth interval through exp
using the existing `volumeAttenuation`. Unresolved references retain all
results and reasons; every dependent scientific gate remains unresolved.

## Frozen response, sign and rate gates

Use arithmetic floor `1e-10` in dimensionless optical depth/transmission.
A scalar response is significant only if the forecast optical-depth change
exceeds `5*U+1e-10`. Retain optical-depth and transmission response errors
separately. Each resolved scalar must have the predicted sign, and each
response error must be at most 25% of its predicted response magnitude plus
the arithmetic floor. A target change within the floor has unresolved sign.

For each of the four ray/channel groups, report sample and supporting-knot
vectors separately: eight groups total. A group is significant only with all
references admitted and the predicted transmission-response norm exceeding
five times the reference-transmission-allowance norm plus the floor. Require
at most 25% vector response error plus the floor. Sign agreement requires at
least four resolved scalar signs and at least 90% correct signs. Zero or
insignificant groups remain unresolved, never automatic successes. Known T80
is excluded from response normalization. All scalar failures remain visible
even when a vector gate passes.

The radial exponential is convex on a complete outward path when, at its
origin, `mu^2 >= H/(r+H)` for both scale heights. The condition remains true
outward. Only under this explicitly checked condition predict
`tau80 >= tau160 >= tauReference`, within U and the arithmetic floor.
This is the corresponding increase of T80 toward the independent reference.

Independently require absolute optical-depth error reduction greater than
`2*U+1e-10`; an increase greater than that amount fails, and overlap is
unresolved. The expected error ratio is 1/4 with the fixed 25% band
`[3/16,5/16]`. If the baseline error does not exceed `5*U+1e-10`, rate is
unresolved. Otherwise propagate U to conservative numerator/denominator ratio
limits. The entire ratio interval inside the band passes, a disjoint interval
fails, and overlapping endpoints remain unresolved. Do not invent a tail or
global convergence certificate from these two counts.

## Bounds, retention and deferred claims

Each separate CPU record reserves at most 3 MiB and five minutes including
30 seconds for finalization, under existing C5 accounting. Limit support to
128 distinct source columns and two million independent medium evaluations;
retain the original per-column/method caps. Use the pinned original runtime,
safe repository/output identities, all-parent/source reauthentication, scratch
cleanup and immutable seals. Account only the exact already registered
invalid `00100` exception; every other failed verification rejects admission.

Retain exact plan/source/input identities, every baseline and reference pass,
endpoint forecast, actual target, scalar/group gate, finite and independent
work counts, and completed partial evidence on interruption. An interrupted
coordinate's absent result is explicitly unavailable; do not fabricate it.
Successful execution and scientific gate outcomes are distinct.

Reconstructed-density interaction is deferred: monotone-cubic reconstruction
is nonlinear and cannot inherit an allowance through simple linear weights.
This pilot establishes neither GPU arithmetic parity, complete near-ground
interpolation error, whole-view N1/P2 attribution, incoming/transport accuracy,
nor a measurement-fit improvement.
