# H56: Why The Paper Score Regresses

The owner selected the [diagnosis plan](paper-b1-diagnosis-plan.md) after H55.
The aim is to explain the regression while retaining the independently justified
Toronto corrections. Production and all earlier evidence remain unchanged.

## Completed Factorial Diagnosis

Accepted initial attribution `00348-h56-joint-map`, transport-only capture
`00349-h56-t60`, normalization-only capture `00350-h56-norm40` and final report
`00351-h56-factorial` complete the selected diagnosis. Both new captures retain
all 40 wavelengths, 17 times, 81 benchmark rays and four cumulative orders.

| Fixed paper case | Aggregate RMSE | Change from baseline |
| --- | ---: | ---: |
| Original weights, transport 40 | 11.62291403 | 0 |
| Original weights, transport 60 | 11.63993781 | +0.01702378 |
| Normalized weights, transport 40 | 11.64340550 | +0.02049147 |
| Normalized weights, transport 60 | 11.66848239 | +0.04556836 |

RMSE units are mW m^-2 sr^-1 nm^-1; lower is better. Both numerical changes
contribute to the regression. Exact squared-error attribution gives 37.31% of
the joint increase to transport's main effect, 44.92% to normalization's main
effect and 17.77% to score interaction. These percentages use SSE, not additive
RMSE. The score interaction includes the quadratic cross term even if spectral
changes were additive; it is not all new error introduced by nonlinear transport.
The actual spectral interaction RMS is 0.03766 mW and its mean is +0.01781 mW.

The main mechanism is a change in existing error compensation: refined transport
and normalized angular scattering change higher-order radiance, often making
already underpredicted paper directions dimmer. Their largest jointly worsened
region is the lowest scored ring. This explains the score response without
establishing the physical cause of the pre-existing underprediction. The
independently justified Toronto correction is not invalidated by this result.

[Full factorial intervals](../../../../../tmp/experiments/sky-accuracy-dials/runs/00351-h56-factorial/interval-factorial.tsv),
[aggregate scores](../../../../../tmp/experiments/sky-accuracy-dials/runs/00351-h56-factorial/scores.tsv),
and [complete attribution](../../../../../tmp/experiments/sky-accuracy-dials/runs/00351-h56-factorial/summary.json)
retain full precision and all selectors.

## Where The Joint Score Change Occurs

The scored B1 rays start at **12.115 degrees elevation**. They do not include
the **0.05-degree** Toronto horizon witness where the independent references
showed the large discrepancy. Improvement at that witness and a small B1 score
regression therefore describe different parts of the sky and different material.

The joint change makes the paper result dimmer on average. For the lowest ring,
the original mean measured-radiance residual was already **-3.0879 mW** in
spectral-radiance units. The change adds another **-0.8384 mW**. That ring supplies
**95.70% of the net squared-error increase**. This is a signed net share: other
regions both worsen and improve, so the shares are not absolute error fractions.

| Elevation group | Change in summed squared error (W spectral units squared) |
| --- | ---: |
| 12.1 degrees | +0.04335638 |
| 33.7 degrees | +0.00464013 |
| 53.4 degrees and above | -0.00269063 |
| Net | +0.04530588 |

The largest net angular penalty is 45-90 degrees from the Sun (+0.08181341).
Looking more than 90 degrees from the Sun improves (-0.03426924), and the 15-45
degree region also improves (-0.00864967). The small total masks these larger
opposing changes. Across individual sky/time cells, worsened SSE sums to
**+0.13891915**, offset by **-0.09361327** of improvements.

The spectral response also cancels. The 360-430 nm group improves by 0.08120453
in summed squared error; 430-550 nm worsens by 0.09449000, and 550-720 nm worsens
by 0.03202041. The wavelength/time map shows these signed contributions directly.
These are observational residual budgets, not a proof of the physical cause of
each pre-existing deficit.

## Where In The Recurrence

First-order scattering is exactly unchanged. A symmetric ledger of telescoping
cumulative increments allocates 11.35% of the net penalty to the second increment,
60.86% to the third and 27.80% to the fourth. These percentages describe exact
score bookkeeping, not unique causal ownership: the third order inherits errors
from earlier incoming radiance and also adds new transport/scattering error.
Nonlinear cubic reconstruction prevents treating cumulative differences as pure
physical-order radiance.

The transport count applies to incoming L1 integration as well as L2/L3. It can
therefore alter J2 even when the stored J1 field and viewed N1 are identical.
The factorial cases keep this implementation unchanged and separate that effect
from phase normalization.

Separately reconstructed pure-order differences confirm the cumulative ledger.
The values below allocate the final SSE change symmetrically across component
changes: `2 * baselineResidual * componentChange + componentChange * totalChange`.
This exactly sums to the observed final score change, while allocating shared
cross terms by an explicit convention. It is not a new independent per-order
reference or a claim that an early truncated-order score should match measurements.

| Contribution to final SSE change | Transport only | Normalization only | Joint |
| --- | ---: | ---: | ---: |
| Pure N1 change | 0 | 0 | 0 |
| Pure N2 change | +0.01811685 | -0.01419044 | +0.00514201 |
| Pure N3 change | +0.00289145 | +0.02107619 | +0.02757205 |
| Pure N4 change | -0.00410209 | +0.01346643 | +0.01259377 |
| Cumulative reconstruction remainder | -0.00000124 | -0.00000067 | -0.00000195 |

Thus normalization's second-order change helps the final fit, but its later
changes reverse that gain. For transport refinement, the main adverse change
already appears in N2; its N4 change offsets part of the penalty. The joint
third/fourth-order response dominates the net increase. The remaining difference
between summing separately reconstructed pure orders and reconstructing the
cumulative field includes nonlinear cubic grouping and Float32 accumulation.
Its joint contribution is only **-0.0043% of net SSE change**, with response RMS
0.0000494 mW. Those mechanisms do not explain this observed regression.

## Retained Paper Models: Target And Approximation Are Distinct

The original retained published-model boundary was authenticated against
SHA-256 `4e11e9ebc6c8cf2eb85e608d86a750b827a17d13582f4b89f035b71824b204f4`
and its sidecar. Its measured paper scores reproduce 11.48054694 for libRadtran
and 11.28323859 for Bruneton. The comparison below is RMSE between our output and
those retained model radiances; it is a separate quantity from paper RMSE.

| Case | Agreement with retained libRadtran | Agreement with retained Bruneton |
| --- | ---: | ---: |
| Baseline40 | 3.84882973 | 3.62277374 |
| Transport60 | 4.09523696 | 3.86104069 |
| Normalized40 | 3.95403363 | 3.72236956 |
| Normalized60 | 4.20456817 | 3.96787141 |

The joint candidate diverges from both retained references too. Therefore the
regression cannot be explained solely as a measurement-target issue. For
libRadtran, the joint change raises model-to-reference SSE by 0.12229412; the
reference-to-measurement cross term offsets 0.07698824, leaving the observed
measurement SSE increase 0.04530588. This is another directly measured cancellation.

These archived outputs are not a newly matched, convergence-qualified numerical
oracle. Their configuration and scattering-order equivalence must be established
before interpreting this divergence entirely as numerical approximation error.
No libRadtran execution, atmospheric refit or change of acceptance metric occurred.
The [retained-reference ledger](../../../../../tmp/experiments/sky-accuracy-dials/runs/00351-h56-factorial/retained-reference.json)
keeps every cross term and the scope qualification.

## Mathematical Phase Check

The paper's analytic Cornette-Shanks phase at g 0.7 integrates to
**1.000000000000048** using 32,768 Simpson intervals; refinement from 16,384
agrees within the declared numerical tolerance. The corresponding first moment
is 0.757349397590409; the phase parameter g is not substituted for this independently
integrated moment.

Over all 4,374 outgoing cache directions, the original F68 phase mass ranges
from **0.650026 to 1.417856**. Thus the Mie contribution from a uniform incoming
radiance field can be underweighted by 35% or overweighted by 41.8%, depending
on outgoing direction.
Normalization restores its total mass. The normalized first-moment RMS error
also falls from **0.0819592 to 0.0224964**, a **72.55% reduction**.

This supports a mathematical purpose for the correction in the paper material
too. It does not prove accurate integration of every anisotropic incoming field:
the same 68 incoming directions still have finite angular resolution. A paper
RMSE change and a phase-moment improvement remain separate measurements.

## Reviewable Images

Final maps use one common signed color scale, so their intensities can be
compared directly. Blue improves the measured score; red worsens it.

| Intervention | Time/wavelength map |
| --- | --- |
| Transport only | [PNG](../../../../../tmp/experiments/sky-accuracy-dials/runs/00351-h56-factorial/score-map-Transport60.png) |
| Normalization only | [PNG](../../../../../tmp/experiments/sky-accuracy-dials/runs/00351-h56-factorial/score-map-Normalized40.png) |
| Joint | [PNG](../../../../../tmp/experiments/sky-accuracy-dials/runs/00351-h56-factorial/score-map-Normalized60.png) |

[Measured spectrum and all four cases at the largest joint regression](../../../../../tmp/experiments/sky-accuracy-dials/runs/00351-h56-factorial/selected-spectrum.png).
The model curves nearly overlap on the measurement scale: the numerical changes
are small beside the existing deficit at this ray. The plot makes that scale
distinction visible rather than fitting separate exposures.

The initial saved-data evidence remains immutable:

[Wavelength/time score-change map](../../../../../tmp/experiments/sky-accuracy-dials/runs/00348-h56-joint-map/score-map-Normalized60.png)
([SVG](../../../../../tmp/experiments/sky-accuracy-dials/runs/00348-h56-joint-map/score-map-Normalized60.svg)).
Blue cells improve and red cells worsen. Colors encode summed squared-error
change over the 81 rays, not sky display color.

[Largest individual regression: measured and modeled spectra](../../../../../tmp/experiments/sky-accuracy-dials/runs/00348-h56-joint-map/selected-spectrum.png).
This 11:00 ray is 53.37 degrees high and 4.19 degrees from the Sun. Both model
curves already lie well below the measurement; the joint change is small beside
that pre-existing deficit. Selection is descriptive, not a withheld test.

## Existing Tail Evidence And Interpretation Limits

The older [six-order diagnostics](results.md#hypothesis-12-scattering-truncation-remains-material-and-depends-on-sampling)
show material positive N5/N6 additions, concentrated at low elevations, whose
size falls when angular or transport integration is refined. Those tests used
only 360 and 454 nm and a different retained baseline. They establish that order
truncation and quadrature interact, but do not quantify a tail correction for
this new paper-profile candidate. No old tail is added to the new cache, and
no full-spectrum N5/N6 or convergence claim is made here.

## Verification And Execution

Local type checking passed after each coherent authored-code change. Exact J1
field hashes and viewed N1 spectra pass at all 40 wavelengths in both new captures.
All physical-order ray spectra are finite and nonnegative. Parent authentication,
exact scores, SSE/reference cross terms, disjoint geometry budgets, cumulative
and pure-order ledger identities, zero N1 response, phase refinement and final
image inspection pass. All four new runs are accepted with no source changes,
heartbeat failures or execution failures. Immutable-artifact verification and
owned scratch cleanup pass. Numerical jobs, browser processes and loopback
servers have exited. Dedicated reviewers and audits were not used.

The complete transport-only runner took 719.812 seconds and normalization-only
took 711.196 seconds: 23 minutes 51 seconds combined, including authentication,
browser compilation, GPU work, CPU reconstruction and IO. These are not pure
GPU kernel timings or a measured production speed ratio. Final reporting took
27.601 seconds. No numerical retry, deleted evidence or new reference-solver run
was needed. The bounded 592 MiB retention allowance preserved the two new full
captures and reports; scratch/free-disk budgets were unchanged.

## Decisions, Remaining Uncertainty And Handoff

The diagnosis kept the full paper setup and all 40 wavelengths, reused accepted
factorial corners, ran only the two missing cases sequentially on hardware GPU,
and preserved original evidence. The captured source/type-check identities remain
valid for each run; the later report amendment adds retained-reference accounting
and pure-order/reconstruction separation without changing either completed build.
No user clarification was needed. No production code, atmosphere composition,
cache deployment, metric or full-cache acceptance gate changed.

We have identified which numerical interventions create this score response,
where their changes cancel, and which order changes carry the penalty. We have
not isolated the full physical/numerical cause of the original radiance deficit,
nor proved a converged tail or accurate integration of every anisotropic field.
A focused next diagnosis would independently check incoming transport and angular
integration at selected 12.1-degree side-Sun rays and selected third-order states,
then measure any missing-order contribution with the corrected recurrence.
That is follow-on work, not an automatically launched full-cache sweep.
The experiment remains open. Checkpoint advice and the authorized local checkpoint
preserve this coherent diagnosis; nothing is pushed or promoted.
