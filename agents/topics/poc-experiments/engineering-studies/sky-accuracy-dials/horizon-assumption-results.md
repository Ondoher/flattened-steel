# Horizon Diagnosis: Color, Paths And Physical Assumptions

H3-H6 identify a mechanism for the selected Flat gray band: in the recorded
away-Sun view, the assumed g=0.7 aerosol phase suppresses warm Mie emission, while
nearby blue and more distant red-weighted Rayleigh contributions balance. The
shared display response compresses the remaining color separation. Independently
recalculating the color projection does not restore orange.

Changing only the assumed Mie asymmetry to zero produces warm R>G>B ordering at
the horizon while retaining blue upper sky. This is a causal sensitivity result,
**not a measurement of actual aerosol properties or a recommended production fix**.
It does not demonstrate a phase-equation or sign bug. Orange remains the owner's
expected Flat outcome; the experiment has narrowed which assumptions can supply it.

The existing [H0-H2 results](horizon-diagnosis-results.md) retain their original
scope. The [plan](horizon-diagnosis-plan.md#next-actions-h3-h6) owns the selected
sequence and the frozen recipes; no production implementation was changed.

## H3: Independent Color Calculation

Accepted [00244](../../../../../tmp/experiments/sky-accuracy-dials/runs/00244-h3-color/sealed.json)
reads the original publisher CIE CSV, verifies its MD5
`17cca777db64b17170f06f67ce9d3ab7`, and independently integrates XYZ and converts
to signed linear sRGB. It does not call the production projection builder or use
the installed RGB weights. The data remain the same published observer functions;
this is independent implementation, not an independent human-vision data set.
The [CIE publisher](https://cie.co.at/datatable/cie-1931-colour-matching-functions-2-degree-observer)
identifies the 1 nm table and checksum. The separate matrix-precision contrast uses
the [W3C D65 XYZ-to-linear-sRGB conversion](https://www.w3.org/TR/2026/CRD-css-color-4-20261009/#color-conversion-code).

The installed midpoint/four-decimal matrix convention agrees with independent
binary64 projection within **5.95e-13 relative**. GPU path RGB agrees within
**1.50e-7 relative** across all 26 retained sky rays. No tested completed sky
reading has a negative RGB channel. Controls verify D65 white, zero input,
equal-energy chromaticity and individual-bin additivity. Wavelength integration
widths and the common 683 photometric factor are accounted for once.

At the Flat 3-degree center ray:

| Conversion | Linear R | Linear G | Linear B | R/B | CIE x,y |
| --- | ---: | ---: | ---: | ---: | --- |
| Independent midpoint, precise matrix | 2939.03 | 2974.43 | 3016.20 | 0.9744 | 0.31098, 0.32751 |
| Matching functions integrated across bins | 2915.73 | 2994.77 | 2947.48 | 0.9892 | 0.31188, 0.33070 |

Bin integration assumes constant spectral density inside each Native15 bin.
It exposes a color-quadrature sensitivity, not recovered fine spectral structure
or a fully regenerated high-resolution transport solution. The band remains
nearly neutral. Subsequent tables consistently use this bin-integrated, precise
matrix convention. No white balancing or spectral renormalization is applied.

## H4: Where The Contributions Arise

Accepted [00245](../../../../../tmp/experiments/sky-accuracy-dials/runs/00245-h4-path/sealed.json)
recomputes the 0.05/3/20-degree continuous local N1 rays with exact flat source/view
columns and 4096 Simpson intervals. Maximum relative disagreement with the
previous equation is **8.86e-15**. Species and numerical distance strata add to
the same total within the registered 1e-12 tolerance. Strata partition Simpson
nodes; they are not separately converged sharp-boundary integrals.

At 3 degrees, the total is `(2915.73, 2994.77, 2947.48)`. Rayleigh contributes
`(2327.54, 2505.54, 2574.90)` and Mie `(588.19, 489.24, 372.58)`.
Near-path Rayleigh emission is strongly blue; attenuated far-path contributions
are redder. Strata at distances of 100 km and beyond supply about 25.4% of total
R but 4.4% of total B. These fractions sum the retained stratum RGB and divide
by the completed channel value; they describe this ray, not a universal horizon.

At the observer, scattering cosine is -0.25395. The assumed Mie phase is
0.01038 sr^-1 versus Rayleigh's 0.06353 sr^-1. Source transmittance varies from
0.541 at the shortest Native15 channel to 0.930 at the longest; source-distance
dilution is 0.89695. Source/view attenuation, phase and distance contributions
are retained explicitly. There is no unexplained intermediate color operation.

## H5: Geometry And Heading At The Same Order

Accepted [00246](../../../../../tmp/experiments/sky-accuracy-dials/runs/00246-h5-n1-geometry/sealed.json)
evaluates 54 continuous N1 cases: three elevations, three Sun-relative headings
and six controlled source/geometry configurations. Refining view quadrature
2048 to 4096 and curved column quadrature 64 to 128 changes any retained spectral
channel by at most **1.204e-6 relative**. This is empirical refinement evidence,
not a rigorous error bound.

At 3 degrees and 180 degrees away from the Sun:

| Controlled configuration | R/B |
| --- | ---: |
| Actual flat finite Sun, 100 km top, accepted dome extent | 0.98923 |
| Flat parallel Sun, matched observer direction/irradiance/extent | 0.99034 |
| Spherical medium, same parallel Sun, 100 km top | 0.90546 |
| Spherical medium, same Sun, 60 km top | 0.90527 |
| Spherical medium, actual distant Sun direction | 0.90793 |
| Spherical medium, actual distant incident irradiance | 0.90793 |

Each adjacent pair changes one declared source or geometry boundary. Changing
geometry includes its atmosphere-exit path domain. The finite-to-parallel change
alone is small here; curvature removes much of the flat model's warm balance.
The final irradiance-scale change is achromatic before display, as expected.

**Heading matters.** At the same Flat 3-degree elevation, R/B is 1.08558 toward
the Sun, 1.02351 across it and 0.98923 away. The toward-Sun RGB is already
`(4038.73, 3961.18, 3720.36)`, with warm ordering. The original recorded default
center view is the away-Sun case. Screenshots were never registered to exact
camera state, so these conclusions must retain their explicit heading limits.

Both modeled sources retain their actual San Jose observation. Observer source
direction is `(0,-0.30422,0.95260)` locally and `(0,-0.24006,0.97076)` distantly.
The production geometry owner supplies the latter as authenticated input; this
does not independently validate its solar ephemeris. Current distant N4 remains
unqualified by this N1 comparison. No compatible authenticated pure-order split
was established, and no N4 campaign was launched to fill that gap.

## H6: A Predicted Phase/Albedo Interaction

Accepted [00247](../../../../../tmp/experiments/sky-accuracy-dials/runs/00247-h6-phase-albedo/sealed.json)
recomputes four cases for the same three local rays: baseline g=0.7/albedo=0.8;
A changes only g to zero; B changes only albedo to one; A+B. Extinction remains
the full combined medium in every case. Zero g retains the Cornette-Shanks family
and has a Rayleigh-shaped phase; it is not isotropic.

| Case, 3-degree away-Sun ray | Linear R | Linear G | Linear B | R/B |
| --- | ---: | ---: | ---: | ---: |
| Baseline | 2915.73 | 2994.77 | 2947.48 | 0.9892 |
| A: zero asymmetry | 5939.18 | 5508.32 | 4860.12 | 1.2220 |
| B: conservative scattering albedo | 3062.77 | 3117.08 | 3040.63 | 1.0073 |
| A+B | 6842.09 | 6259.02 | 5431.42 | 1.2597 |

The predicted warm ordering under A passes at 3 degrees, while the 20-degree
control remains blue (R/B 0.5559). The 0.05-degree ray also becomes warm (1.3619).
Albedo alone supplies a smaller shift and does not create warm R>G>B ordering at
3 degrees. Phase normalization and the forward-scattering direction checks pass;
these results do not identify an implementation sign or normalization failure.

The predeclared interaction identity is
`L_AB - L_A - L_B + L_baseline = 0.25 * (L_A - L_baseline)`.
It follows because albedo scales Mie emission linearly at fixed extinction.
Maximum relative residual is **3.67e-14**. The measured non-additivity is a
physical parameter interaction, not a cache numerical error. Matching an orange
expectation cannot determine real aerosol g or albedo, and g=0 is not promoted.

## Scope, Resources And Verification

The completed package narrows the Flat symptom to the current phase/medium/view
balance and display compression. It does not independently qualify distant N4,
fit aerosols, validate the full physical model against atmospheric measurements,
or select a production correction. A shared local/distant physical defect remains
unproven. There is no automatic follow-on run allocation.

The four accepted runs add **981,846 bytes**, about 0.94 MiB, bringing retained
evidence to **404,847,952 bytes**; scratch is absent. All four immutable verifiers
pass. Recorded numerical-stage windows total **36.274 seconds**: H3 0.028 s,
H4 0.074 s, H5 34.556 s, H6 1.616 s. They include within-stage checks/guards but
exclude allocation, sealing, review and agent orchestration. No GPU/browser job,
cache build or dependency installation occurred. Per-stage time/output caps and
the experiment's total disk/free-space boundaries were respected.

After execution, explicit trace data aliases were clarified and the existing
Gauss generator was localized to avoid a runtime dependency on an unrelated
recursive solver. The 64/128 node and weight arrays were verified bit-identical
to those used by the accepted runs; the phase helper preserves the same equation.
No numerical evidence was overwritten or regenerated for declaration changes.
Local type checking and focused self-verifying controls cover the authored unit;
no experimental unit-test tree was introduced.

The [implementation receipt](../../../../../.codex-tmp/review-standards/session-b5Eogw/summary.md)
owns the current batched folder-mapped primary/audit completion gate. The
[execution summary](../../../../../.codex-tmp/review-standards/session-b5Eogw/execution-summary.md)
owns the complete question/decision list, review disposition and local checkpoint.
Scientific results do not substitute for that implementation gate.
