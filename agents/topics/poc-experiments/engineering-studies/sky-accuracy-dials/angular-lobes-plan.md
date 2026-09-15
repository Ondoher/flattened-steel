# Sampling A Known Angular Field

Status: registered before evaluating the manufactured angular comparisons.
This `compensation-attribution-v1` case follows the directional response
attribution in `00206`/`00207`. It distinguishes phase-lobe sampling from
atmospheric path length, attenuation and ground-boundary structure.

## Manufactured Physical Integral

Prescribe incoming radiance proportional to the declared normalized
Cornette-Shanks phase function, `L(w)=p(s dot w)`, and integrate scattering
into `o`: `I=integral p(s dot w)*p(o dot w) dOmega`. Keep the C0 atmosphere's
g=0.7 and the two frozen viewing directions at h1000. This is a manufactured
field with phase-function structure, not a replacement for atmospheric L1.
Its units with the chosen unit amplitude are inverse steradians.

An independent analytic representation follows from spherical orthogonality:

`I(c)=sum_(l>=0) (2l+1)*a_l^2*P_l(c)/(4*pi)`, with `c=s dot o`.

Write `p(c)=k*(1+c^2)*HG_g(c)`, `k=3/(2*(2+g^2))`. Applying the Legendre
recurrence twice to the HG moments `g^l` gives

`a_l=k*((1+B_l)*g^l + l*(l-1)/((2*l-1)*(2*l+1))*g^(l-2)
       + (l+1)*(l+2)/((2*l+3)*(2*l+1))*g^(l+2))`,

`B_l=(l+1)^2/((2*l+1)*(2*l+3)) + l^2/((2*l+1)*(2*l-1))`.

Omit the lower term for l<2. At g=0 use the exact limit a0=1, a2=1/10,
others zero; its convolution is `(1+0.05*P2(c))/(4*pi)`. Use L=128 for the
retained g=0.7 reference. The omitted tail is bounded uniformly in c by

`k^2/pi * g^(2*L-2) * ((2*L+3)/(1-g^2)+2*g^2/(1-g^2)^2)`.

Retain that truncation bound separately from an empirical binary64 allowance
of `8192*EPSILON*sum(abs(terms)) + 1e-13`. Cross-check the analytic answer with
Sun-aligned 64-by-256 Gaussian/midpoint angular integration, requiring a
discrepancy at most `1e-10 + 1e-9*abs(I)`. Failure leaves the reference
unadmitted; do not loosen its criterion after looking at targets.

## Fixed Sampling Controls

Use the original three-interval radial rules r8-a16, r16-a16, r8-a32 and
r16-a32, with both mirror members evaluated explicitly at their original
world directions. Their complete counts are 384, 768, 768 and 1536.

Also compare two complete product rules with exactly 384 directions each:
32 Gaussian polar-cosine nodes and 12 midpoint azimuth nodes. One uses the
existing radial/source-facing frame. The other aligns the polar axis with
the Sun and the azimuth origin with the projection of the outgoing direction.
This is a declared coordinate/frame choice at fixed cost; no sample is fitted
to a measured radiance. Retain the existing 384-direction rule as a third
same-cost comparison. No new atmospheric incident rays are integrated.

## Frozen Hypotheses

The phase-lobe structure alone is predicted to reproduce these qualitative
features of the morning observed response:

1. Radial, azimuth and combined refinement responses are all negative.
2. The azimuth response has at least the radial response's absolute magnitude.

Against the admitted manufactured integral, predict:

3. Combined refinement reduces absolute error by at least 50% for each ray.
4. The Sun-aligned product rule reduces absolute error by at least 75% versus
   the matched radial product rule for each ray.
5. The Sun-aligned product rule has at most 0.01% relative error for each ray.

Retain all ten predicates. Sign and magnitude gates include propagated
arithmetic/reference allowances; unresolved controls remain unresolved.
If the qualitative phase-only predictions fail, atmospheric directional
structure remains necessary to explain the earlier response. If they pass,
that demonstrates a sufficient manufactured mechanism, not a unique diagnosis
of the full atmospheric integral. Improved manufactured accuracy does not
qualify atmospheric sampling, production H, a complete viewing integral or
Kider agreement.

## Verification, Resources And Boundary

New implementation is limited to the existing angular diagnostic area or a
new `continuation/angular-lobes/` folder. The deferred source unit includes
these files and their direct collaborators, with baseline
`871690d334b4339f7aaee516dcc140dd00a3edaf`. Existing numerical collaborators
and immutable evidence remain unchanged. Formal review stays deferred.

Focused manufactured proofs cover normalization moments, g=0 convolution,
Legendre signs at reversed axes, the tail bound, unit directions, total solid
angle and uncertainty-aware failure/unresolved predicates. Run the complete
POC type check. Authenticate C0, physical phase parameters, frozen directions,
prior diagnostic identity and implementation/tool snapshots.

One record is capped at 3 MiB and five CPU-job minutes, with a 30-second
finalization reserve and no GPU job or large scratch. Existing C5 admission
must precede execution. One accepted diagnostic, including failed scientific
predictions, completes this case. Further atmospheric mitigation requires a
new discriminating plan and independently adequate error assessment.
