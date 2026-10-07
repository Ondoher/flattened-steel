# Remaining Factors: Fixed Observation Sensitivity

## Admission And Resources

Accepted retained-data run **00225-remain-account**, seal SHA-256
`b927afb9919d4b6c22c389b1d8448a15effdb60b7d7d3b53a32ae3e4aae0fbc6`,
does not admit the new higher-order factorial. All tested numerical mechanisms
improve the four available P2 reference comparisons. Density/altitude controls
worsen aggregate Kider proxy; doubled transport improves it by only about
0.0017 spectral mW, below the frozen 0.01 work-priority floor.

The owner's "run those" authorizes the observation-comparison stage and its
new GPU work. Allocate at most **two additional GPU attempts**, scoped only to
package `remaining-factors-v1`, through **2026-09-15 19:39 UTC**. The original
36 attempts remain charged and unchanged. This package may not lend slots to
another campaign. One GPU observation matrix is planned; the second slot is
only a failure allowance inside the same fixed matrix and time limit.
Record this authorization, the exact 00225 seal, and the plan identity in the
new run definition before launching the GPU. Chronological accounting must
authenticate these identities for every attempt beyond the original cap.

Retained output is at most **3 MiB per attempt**, inside the unchanged C5,
continuation and total storage limits. Admission must independently establish
that remaining bytes suffice; a second GPU slot does not reserve extra bytes.
Maximum job elapsed is 30 minutes, further limited by the package deadline.
All physical radiance integration runs on hardware GPU. CPU geometry,
orchestration, scoring and manufactured checks are allowed. No new independent
reference integration or higher-order cache generation is admitted here.

## Instrument And Dataset Evidence

The locally retained Kider author paper, section 4.1, describes approximately
0.5-degree motor rotational error and an approximately three-minute 81-point
hemisphere scan. It describes one-degree and eight-degree fore-optics, with
most scans using one degree. Those statements do not identify the optic used
for every selected capture or provide a calibrated angular-response kernel.

Audit all consumed capture headers and direction filenames, unit conversion,
the canonical Y reflection, anomaly repair and fitted solar azimuth. Preserve
the original measurement table and scene geometry. Do not infer individual
acquisition timestamps from a shared capture timestamp or assume a scan order.
The scan duration is an identified comparison uncertainty; it does not justify
inventing per-sample times.

## Fixed GPU Matrix

Use all forty original C0 rays, all five times and channels 0/8/24/30. Hold the
jointly corrected P1 formulation and source count S160 fixed. Evaluate:

1. Original ideal viewing direction.
2. Elevation minus and plus 0.5 degrees.
3. Azimuth minus and plus 0.5 degrees about the observer's local vertical.
4. Uniform circular acceptance cones of full angle 1 and 8 degrees. These are
   two instrument-scale sensitivity scenarios, not fitted or calibrated optics.

Use two fixed cone quadratures: one equal-area radial midpoint with four
azimuths, and two equal-area radial midpoints with four azimuths each. Their
difference is a directional stability check, not a certified integration bound.
Use altitude-segmented viewing levels 8/16. At zenith azimuth rotations leave
the viewing direction unchanged; choose the source-meridian tangent for the
otherwise undefined elevation direction and retain that convention.

Precompute finite species sunlight columns on the GPU. At each view sample,
reconstruct density-normalized, finite-top-adjusted columns, evaluate density
and phase analytically, and apply the existing two-half-step attenuation rule.
The sample helper closure must remain loop-free. Store only compact results,
source/geometry identities and exact reconstruction recipes; large prepared
sample arrays may be reproducible scratch/input rather than retained evidence.

## Interpretation And Stop

Compare the unperturbed P1 with 00224 at both viewing levels before interpreting
changes. Require agreement within the sum of its retained diagnostic guard
and a Float32 floor of max(1e-8 W, 32*2^-23*abs(P1)).

For each variant record delta P1, its sign and magnitude relative to the
remaining residual, and the proxy score with original higher light held fixed.
This is a **first-order observation sensitivity**, not a complete
instrument-convolved solver prediction. Higher-order angular response remains
unmeasured; do not claim to rule out all observation mismatch from a small P1
response. Report both offset signs, both cones, quadrature/view stability and
every time regression. No selecting a per-ray offset to lower the score.

Interpret 0.01 spectral mW aggregate RMSE as the existing useful-change floor.
Retain a generous per-scalar envelope across the fixed scenarios as a diagnostic
of whether their magnitude can reach the residual; it is not a realizable
globally calibrated correction. Inspect the already admitted physical P1+P2
morning lower-bound scalars separately. No further offset search, additional
optic width, time fitting, physical coefficient fitting or reference ladder
follows this matrix. The package ends after assessment and documentation.
