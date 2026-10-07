# Aerosols and the Identified Cancellation Cases

**Subsequent test:** the [00235 aerosol sensitivity](aerosol-sensitivity-results.md)
now evaluates phase and SSA changes using regional data. The evaluation below
owns the preceding case interpretation; the new report owns the intervention
and its measured responses and remaining ambiguities. For the owner's current
diagnosis, use the [supported-wavelength breakdown](aerosol-sensitivity-results.md#supported-wavelength-interpretation):
exclude unsupported 360 nm; phase and albedo each help both controls separately,
but together overshoot. The historical violet discussion below remains evidence,
not a request to resume UV investigation.

## Assessment

The owner's working hypothesis is that shared physical-model weaknesses,
especially aerosol assumptions, account for much of the discrepancy exposed
by numerical corrections. Existing evidence supports investigating this
hypothesis, but does not establish what fraction is caused by aerosols.

The strongest case concerns the broad visible deficit outside the near-Sun
region. The violet excess is a separate target. Several earlier examples are
instead demonstrated cancellation between numerical errors; their existence
does not depend on an incorrect aerosol model.

This is a case-by-case interpretation of existing accepted evidence through 00233. It introduces no new simulation, parameter fit, artifact-producing
assessment or production change. Numerical values below are transcribed from
the linked owning reports; their run identities, uncertainty and derivations
remain there. All radiance errors use spectral mW m^-2 sr^-1 nm^-1 unless
otherwise stated. P1 and P2 mean contributions from the first and second
scattering orders.

## Separate the two balances

Let A be the approximate calculation, D the direct solution of the current
equations and M the Kider measurement. Then

$$
A-M = (A-D)+(D-M) = n+p.
$$

The numerical error n can cancel the remaining discrepancy p. That remaining
term includes physical-model and input errors, observation mismatch and any
unresolved direct-solver error; it is not automatically an aerosol error.

There is also cancellation _within n_: inaccurate density reconstruction can
brighten the result while inaccurate transmission dims it. Replacing the
aerosol model would not make either numerical operation correct.

Importantly, a P1-only experiment with frozen higher-order fields does not
measure D. Its remainder still contains higher-order numerical error. The
later all-order direct experiments provide stronger evidence about the
physical/observation remainder, but do not separately attribute every earlier
implementation correction.

## 1. Joint first-order reconstruction: a clear score penalty

[00224](targeted-improvements-results.md) evaluated 40 selected rays at four
wavelengths, retaining the original higher-order light.

| Calculation                                | P1 numerical RMS | Kider proxy RMSE |
| ------------------------------------------ | ---------------: | ---------------: |
| Original combined S80                      |            9.010 |           30.858 |
| Query density only, S80                    |            1.154 |           32.634 |
| Query density and phase, S80               |            0.685 |           32.207 |
| Density, phase and corrected columns, S160 |            0.048 |           32.061 |

The joint correction removes 99.47% of P1 numerical RMS while worsening the
selected aggregate proxy by 3.90%. The original positive density error was
helping hide deficits elsewhere in the result. The recorded cancellation
cross term changes from -0.024985852 to +0.000115380 spectral W squared,
more than offsetting the reduction in squared P1 error.

**Aerosol interpretation:** insufficient modeled visible scattering in those
directions could be part of the deficit that the positive numerical error
concealed. Candidate causes include phase shape and spectral scattering versus
absorption. This is compatible with the later angular findings, but 00224
alone cannot distinguish those causes from inaccurate higher orders or
observation geometry.

**Counterevidence to a simple explanation:** the correction improves the
09:30 and 10:15 proxies and worsens 11:15, 12:30 and 13:30. Neither a uniform
brightness adjustment nor a universal statement that corrections worsen
measurements fits this result. These selected probes also include near-Sun
cases; their aggregate penalty cannot be assigned entirely to the broad
away-Sun trough.

## 2. Analytic phase evaluation: two meanings of “phase correction”

The existing repair evaluates the **same declared phase law** at the actual
angle instead of interpolating its sampled values. It does not replace the
physical phase law with a more realistic aerosol model.

In 00224, phase-only evaluation changes numerical RMS from 9.010 to 9.456
while improving the proxy from 30.858 to 30.488. With density already repaired,
phase evaluation instead improves both numerical RMS (1.154 to 0.685) and
proxy (32.634 to 32.207).

The [00202 component decomposition](attribution-results.md#outgoing-phase-versus-transmission-reconstruction)
explains the sign dependence. At 454 nm, outgoing interpolation contributes
+0.171363 on the morning witness and -2.526087 at noon. The morning positive
term offsets negative transmission reconstruction; removing it exposes more
of that negative error. These are bottom-interval projections, not full-ray
Kider errors.

**Assessment:** numerical cancellation is directly demonstrated. A physically
inadequate phase law may separately remain after analytic evaluation, but
cannot explain away these measured interpolation errors. A lower score from
phase-only evaluation is not evidence that either the original interpolation
or the original physical phase law was better.

## 3. Source transmission: an important exception

The [source-column tests](attribution-results.md#source-transmission-a-held-numerical-control)
show that coarse integration overestimates optical depth on the tested lit
columns. It underestimates transmission and dims P1. Source refinement removes
that negative error, exposing a larger positive reconstruction error in the
original representation.

But after joint reconstruction correction, 00224's S80-to-S160 change improves
P1 RMS from 0.139 to 0.048 and improves aggregate Kider proxy RMSE from 32.079
to 32.061. Four of five time groups improve; 10:15 worsens slightly. The report
retains the limits on the absolute refinement claim under its view-level
guards.

**Assessment:** this is not a general aerosol-induced score regression.
Representation error explains the demonstrated failure of raw source
refinement. A physical aerosol extinction error could still affect the final
Kider residual, but these tests varied numerical integration, not aerosol
extinction. They do not identify the amount or sign of an aerosol correction.

## 4. Higher-order density and altitude repairs

[00225](remaining-factors-results.md) holds corrected P1 fixed and substitutes
each candidate's own higher-order contribution on 80 selected scalars.

| Higher-order change                       | Proxy RMSE | Numerical evidence                    |
| ----------------------------------------- | ---------: | ------------------------------------- |
| Original higher light                     |   31.34244 | Control                               |
| More near-ground altitude resolution, P55 |   31.56112 | All four available P2 errors decrease |
| Density-factored reconstruction, P48      |   31.64316 | All four available P2 errors decrease |
| Density-factored reconstruction, P55      |   31.58865 | All four available P2 errors decrease |
| Doubled transport integration, T320       |   31.34071 | All four available P2 errors decrease |

Density factoring lowers mean higher light by about 2.03. It improves the
morning proxy groups but deepens later deficits. Its numerical accuracy is
independently supported at four P2 witnesses, not at every order and ray.

**Aerosol interpretation:** the removed excess could be compensating for too
little diffuse light in the assumed atmosphere. Aerosol absorption, angular
redistribution and vertical distribution can affect that light. Ground
reflection is another plausible influence. These controls alone do not rank
those physical causes.

Changing numerical altitude resolution is not a test of the physical aerosol
height profile. Likewise, density factoring changes how the same exponential
profile is reconstructed; it does not change aerosol concentration.

## 5. Missing scattering orders: strongest spectral distinction

Adding cached orders five and six in 00225 raises mean light by about 2.15
and worsens the proxy in every selected time group, from 31.34244 to 31.93817.
Those cached additions alone do not certify a converged physical tail.

The later [00230 direct calculation](direct-convergence-results.md) supplies
a stronger witness. On the noon low-elevation ray D at 360 nm, the previous
two-interaction calculation is 6.686 below Kider, whereas the all-order
estimate is **20.546 above Kider**, with a 0.156 sampling half-width.
The reported higher-order contribution is 27.203; the small difference from
subtracting those two residuals also includes different numerical evaluation
of the lower orders. At 454 nm, the full result on the same ray remains
**24.439 below Kider** even though later orders add light.

**Aerosol interpretation:** excessive violet scattering or insufficient violet
absorption could make correct multiple scattering amplify the wrong physical
brightness. Insufficient visible scattering or excessive visible absorption
could contribute to the opposite 454 nm sign. These are hypotheses, not
retrieved optical properties.

**Constraint:** suppressing later orders is not a physical resolution. Neither
uniformly increasing nor uniformly decreasing brightness addresses both
wavelengths. At fixed extinction and all other inputs, increasing aerosol
single-scattering albedo increases scattering contributions; one
wavelength-independent change in that direction cannot both dim violet and
brighten the visible. Changing aerosol amount is more complicated because it
changes attenuation and scattering together.

## 6. Away-Sun direct witnesses: strongest case for a broad phase weakness

[00232](alternate-rays-results.md) removes cache approximations and estimates
all orders on six additional rays. All 30 numerical targets pass; sampling
half-widths are 0.032-0.165. The approximate control has lower five-wavelength
RMSE on all six rays, helping 22 of 30 scalars, harming five and leaving three
unresolved.

The following are 548 nm examples. Approximation means control minus direct;
residual means model minus Kider.

| Ray           | Sun separation | Approximation | Direct residual | Control residual |
| ------------- | -------------: | ------------: | --------------: | ---------------: |
| 09:30 high    |  48.94 degrees |        +0.616 |          -6.786 |           -6.170 |
| 09:30 low     | 122.51 degrees |        -1.326 |          +3.655 |           +2.330 |
| 13:30 high    |  39.86 degrees |        +0.988 |          -8.217 |           -7.229 |
| 13:30 low     |  56.10 degrees |        +7.239 |         -31.628 |          -24.389 |
| 13:30 control |  78.03 degrees |        -0.284 |          -1.925 |           -2.209 |

The afternoon low ray gives a particularly clear cancellation: the old
calculation adds 7.239 that partly hides a 31.628 deficit. The morning low ray
shows the opposite useful numerical bias. The afternoon control is a
counterexample where removing the approximation helps at this wavelength.

[00233](angular-residual-results.md) independently describes a shared
middle/red deficit around 40-80 degrees across all 17 times in the retained
control and reference mean. Angular structure survives time/elevation mean
removal. This makes a broad phase-shape weakness a stronger hypothesis than
it was from isolated rays alone. The 39.86-degree high witness lies just
outside the 40-degree bin; these bins are descriptive, not physical boundaries.

**What is still missing:** no physical phase perturbation was run. Angle also
correlates with transport and acquisition geometry. A normalized alternative
phase function must improve the relevant directions through full transport,
without creating unacceptable changes elsewhere. Observer-Sun angle alone
does not determine the scattering angles of multiple-scattering paths.

## 7. Violet excess: weak evidence for a phase-only explanation

At 360 nm the direct solution is too bright on all six 00232 rays. On the
morning low ray, numerical dimming of -6.268 hides part of a +21.409 excess.
On the afternoon low ray the approximation instead worsens the violet excess.

The 00233 angular diagnostic accounts for only 6.0% of centered residual
variation at 360 nm in the control and 2.7% in the reference mean, versus
41.4% and 42.0% at 548 nm. These conditional diagnostic percentages are not
fractions of physical error attributable to aerosols.

**Assessment:** spectral aerosol extinction/absorption is a candidate, but
violet phase shape is less directly supported by this evidence than the broad
visible angular hypothesis. Solar spectral input, molecular scattering and
measurement response remain alternatives. Weak angular skill does not prove
absorption error or exclude aerosol phase effects on multiple scattering.

## 8. Ground boundary: a counterexample to aerosol attribution

The [00191/00192 boundary repair](attribution-results.md#ground-boundary-a-measured-compensating-error)
restores a missing positive contribution at the ground knot. At the morning
P48 witness, the 454 nm P2 numerical error rises from 2.532074 to 2.789705.
The missing contribution had hidden another positive numerical error.

This comparison is against an independent solution of the same equations;
Kider is not needed to demonstrate it. Aerosol-model weakness is therefore
not the explanation for this particular cancellation. It remains a required
boundary repair, with other numerical errors addressed separately. No isolated
full-benchmark Kider effect is established for this repair.

## Physical hypotheses and discriminating expectations

Bruneton used wavelength-independent aerosol phase shape and
single-scattering albedo, with fixed aerosol scale height. The fitted aerosol
parameters do not independently measure the actual atmosphere. Those choices
make aerosol model inadequacy plausible, rather than demonstrating it.
[Bruneton, section 3.4](https://arxiv.org/pdf/1612.04336).

The following are prospective expectations derived from the transport model,
not additional measurements or qualified parameter directions:

| Candidate                                              | Most relevant existing case                                     | What would distinguish it                                                                                                                      |
| ------------------------------------------------------ | --------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| Broader or wavelength-dependent normalized phase shape | Visible deficit at roughly 40-80 degrees                        | Changes angular contrast at fixed extinction/albedo; must preserve nonnegativity and total phase integral and transfer across times/elevations |
| Wavelength-dependent scattering versus absorption      | Violet excess with visible deficit                              | Produces the required opposing spectral response; test albedo at fixed extinction to isolate it before changing aerosol amount                 |
| Aerosol optical-depth spectrum                         | Spectral offsets and their path-length dependence               | Alters direct attenuation as well as scattered light; cannot be treated as a brightness multiplier                                             |
| Aerosol vertical distribution                          | Strong low-elevation discrepancies and higher-order sensitivity | Change profile at fixed column optical depth first, separating redistribution from changing total aerosol amount                               |
| Observation geometry or ground reflection              | Remaining angular/elevation structure                           | Independent camera alignment or surface evidence; atmospheric fit alone cannot rule these out                                                  |

## Decision

The evidence supports the specific claim that **known numerical errors hide a
remaining model/input/observation mismatch**, including outside the near-Sun
region. It does not yet support the stronger claim that aerosols explain most
of that mismatch or every example of cancellation.

Prioritize two physical questions separately: broad visible angular shape and
the violet spectral excess. Preserve corrected numerical operations as the
reference for those tests. A factorial comparison of old/corrected numerical
evaluation and original/alternative physical inputs would test whether the
score penalty from numerical correction shrinks when the physical assumption
is changed. Changing the physical inputs requires recomputing affected
scattering orders; frozen higher-order fields would confound that test.

Parameter changes must have independent justification or be labeled sensitivity
tests. Held-time gains alone remain validation within one capture day, not
proof of the retrieved aerosol state. Keep the original full benchmark for
comparability and any changed-atmosphere result separately labeled.

No new execution plan is selected here. The production adoption hold remains.
Any eventual runtime adaptation must retain loop-free fixed work within each
ray sample; offline reference integration and outer ray sampling are separate.
