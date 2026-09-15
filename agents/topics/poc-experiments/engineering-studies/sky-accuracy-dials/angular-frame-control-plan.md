# Isolating Angular Frame And Node Placement

Status: prospective diagnostic, registered after the atmospheric Sun32 result
`00214` and before evaluating these manufactured controls. This is a bounded
continuation of the [atmospheric frame test](angular-frame-plan.md), not a
replacement for its frozen predictions or reference criteria.

## Scientific Question

The actual coarse Sun-frame result overshoots its finer results. The earlier
phase-product benchmark used a different azimuth origin and a different polar
node distribution. Does either construction change already explain the poor
resolution of the known phase lobe, without introducing atmospheric path,
visibility or ground variation?

Use only the frozen morning `p-0930-5-7:h1000` geometry and the declared model's
Cornette-Shanks phase function. Prescribe incoming radiance
`L(w) = p_CS(s dot w)` and integrate `p_CS(o dot w) L(w)` over solid angle.
Reuse the independently checked analytic convolution and its allowance from
`00210`; this is not an atmospheric radiance reference. Authenticate its
geometry, phase parameters, formula and implementation identities before reuse.

## Controls

Evaluate these deterministic rules against that same known integral:

| Rule | Polar placement | Azimuth origin | Directions | Contrast |
| --- | --- | --- | ---: | --- |
| Original manufactured | Unpartitioned Gauss32, 12 midpoint azimuths | Outgoing projection | 384 | Replay the retained benchmark |
| Rotated manufactured | Unpartitioned Gauss32, 12 midpoint azimuths | Radial projection | 384 | Change only azimuth origin |
| Matched unpartitioned | Unpartitioned Gauss24, 16 midpoint azimuths | Radial projection | 384 | Match the atmospheric rule's azimuths and total count |
| Actual coarse construction | Three physical intervals, Gauss8 each, 16 midpoint azimuths | Radial projection | 384 | Change only polar node placement from the preceding control |
| Actual first refinement | Three physical intervals, Gauss16 each, 32 midpoint azimuths | Radial projection | 1536 | Replay the atmospheric construction at its finer count |
| Actual second refinement | Three physical intervals, Gauss32 each, 64 midpoint azimuths | Radial projection | 6144 | Replay its next count |

The latter rules must use the unchanged geometry implementation from `00212`
and both members of every mirror pair. No atmospheric mirror reuse is needed
for this prescribed directional field. Accumulate Rayleigh and Mie phase mass
as separate normalization diagnostics; never renormalize quadrature weights
to force the phase integral to one.

## Predictions Frozen Before Evaluation

1. Every rule has positive weights, unit directions, and total solid angle
   `4*pi` within an operand-scaled arithmetic allowance. Replaying the original
   manufactured rule agrees with its retained integral within joint arithmetic
   allowances. These are implementation/geometry checks, separate from accuracy.
2. The rotated and matched unpartitioned rules each retain at most 0.01%
   relative error in the analytic convolution, including reference and
   arithmetic allowances. If only the rotated control fails, azimuth origin
   already matters at this count.
3. The actual coarse construction also has at most 0.01% relative convolution
   error. If it fails while the matched unpartitioned rule passes, distributing
   its polar nodes over physical intervals introduces inadequate resolution
   of this smooth phase product at the same cost.
4. Each actual-construction refinement removes at least 50% of absolute
   manufactured convolution error, including allowances. A coarse error too
   small to distinguish from its allowance stays unresolved.
5. Both phase-mass integrals of each rule differ from one by at most 0.01%,
   including arithmetic allowance. Keep mass error distinct from the
   phase-product error; normalization agreement does not imply lobe accuracy.

Retain every failed and unresolved prediction. These controls distinguish
azimuth origin, polar placement and unresolved atmospheric structure. They do
not uniquely attribute a residual atmospheric error to attenuation, visibility
or ground reflection. No Kider input or adjustment of physical parameters is
allowed. The analytic phase field is a deliberately isolated equation control.

## Execution And Resource Boundary

Wait until an active atmospheric run finishes before modifying experiment
source. Implement only a small `continuation/angular-frame-control/` reader,
calculation and evidence runner, reusing the unchanged angular and analytic
helpers. Capture deferred source-review baseline
`871690d334b4339f7aaee516dcc140dd00a3edaf` before edits. Run focused manufactured
proofs and the complete POC type check; formal review remains deferred.

Use one new immutable C5 record with a 2 MiB retained cap and five CPU-job
minutes, including failed evidence. It consumes the existing campaign
allocation, separately from the atmospheric package's unchanged 16 MiB cap.
Reuse the authenticated `00210` source snapshot with a complete source delta
and derivation record. No new atmospheric integrations, GPU job, large cache
or disposable scratch is required. Preserve the 40 GiB disk floor and prior
evidence. If input compatibility or reference adequacy fails, retain an
unresolved conclusion rather than substituting an approximate answer.
