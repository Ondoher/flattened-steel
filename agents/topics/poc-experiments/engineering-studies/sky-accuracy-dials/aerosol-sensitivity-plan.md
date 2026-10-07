# Bounded Aerosol Sensitivity: Phase and Spectral Albedo

The owner authorized the proposed control, phase-only, scattering-albedo-only
and joint comparison. One data-acquisition CPU run and one GPU job; no adaptive
parameter search or automatic GPU retry. Reuse the six rays and five wavelengths
from 00232, with all scattering orders and unchanged geometry, extinction,
height profiles, molecular scattering, ground and solar spectrum.

Start: 2026-09-15 22:35:49 UTC. Absolute stop: 2026-09-16 01:35:49 UTC.
GPU job at most 25 minutes, including cleanup. Keep existing global resource
caps. Data run forecast 256 KiB in C6. Prospectively transfer 1 MiB of unused
C6 allocation to C5 for this authorized GPU package: C5 126 MiB, C6 10 MiB.
GPU evidence forecast 1.25 MiB. Historical allocations and evidence are immutable.
Review unit: new aerosol-input acquisition, phase evaluation/sampling adapter,
bounded runner and admission. Baseline HEAD c7803b241f0f8f409226354dc4fb72484f25a5ec;
preserve existing changes. Reviewers remain suspended; adviser remains blocked.

## Input frozen independently of the sky result

Use NASA AERONET V3 Toronto on 2013-05-27, the nearest corresponding station
identified in Bruneton's comparison. Retain complete public responses for
ALM15 SSA, total PFN and ASY, plus ALM20 SSA to preserve the quality limitation.
Select the one record at 13:19:01 UTC: it is the only returned same-day record
with If_Retrieval_is_L2(without_L2_0.4_AOD_440_threshold)=1. Do not select or
average alternatives based on Kider scores. Phase and albedo must join on exact
site/date/time/instrument. This is a regional sensitivity, not local truth.
ALM20 SSA contains missing values; retain the Level 1.5 values as exploratory
inputs, never claim quality-assured absorption. Record AOD and quality flags,
but keep the benchmark extinction unchanged to isolate the requested factors.

Use the supplied 83 angular nodes per wavelength. Normalize a piecewise-linear
function of scattering cosine to unit solid-angle integral. Retain the original
normalization and compare its mean cosine with ASY as a consistency check.
Linearly interpolate normalized phase and SSA in wavelength between available
440/675/870/1020 nm bands; clamp below 440 nm. Thus 360 nm is an explicit
constant extension, not an observed ultraviolet phase/albedo constraint.
Use the same physical function in next-event evaluation and path sampling.
Input phase tables are material properties, not cached radiance/attenuation.

## Numerical design

Run four cases: original CS g/SSA, measured phase only, measured SSA only, both.
For each case/wavelength use all six fixed rays, 8192 paths per batch and
128 main batches per scalar, solar quadrature 64, roulette starting at 8.
Use identical initial seeds across cases for paired differences. Also run
16 paired batches at solar 32 and 16 at roulette start 16 for each scalar.
Estimate marginal uncertainty from batch means; paired comparisons use exact
matching batch identities. No stopping on score or extra precision runs.

Before atmospheric execution: prove phase normalization, positivity, inverse
CDF consistency and first moment; recover manufactured isotropic and sloped
densities; verify Float32 table mass and sample/evaluation consistency; run
GPU vacuum/ground/absorption cases. Independently calculate first-order rays
by binary64 quadrature and check CPU/GPU parity for all cases. Reproduce the
original control against 00232 within combined sampling uncertainty and a
small arithmetic allowance. Fail incomplete matrices, parity or safety checks.
Sampling targets max(0.5 mW, 0.5%) describe resolution; report misses explicitly.

## Expected responses and scoring

At fixed extinction, raising SSA supplies more scattered light: expect it to
help visible deficits but risk worsening the violet excess. A richer phase can
redistribute light; check its actual ratio to CS at the selected angles before
execution rather than assuming every angle brightens. No successful sign is
required for run acceptance. Full transport includes all affected orders.

Retain signed change, sampling uncertainty and residual at every scalar;
selected-set RMSE by time, ray, wavelength and all scalars; phase/albedo
interaction; and both retained production baselines as context. Separate 360 nm
from the supported spectral range. Highlight improvement or harm on both
times and control rays. This is not a full-sky Bruneton score or identification
of aerosol physics. Preserve numerical-correction adoption hold and original
scores; no production change or shader-cost claim is authorized.
