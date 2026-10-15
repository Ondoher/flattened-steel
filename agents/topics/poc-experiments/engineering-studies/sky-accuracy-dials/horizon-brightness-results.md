# H27 Local-Horizon Brightness Diagnosis

The selected diagnosis is scientifically complete as accepted
`00270-h27-brightness`. It finds a physical N1 brightness dip and a separate
screen-output encoding concern. Production remains unchanged. The supplied
screenshot motivates this investigation but is not pixel-registered to the
retained app camera, so this does not identify every feature of that image.

## Physical Brightness

The independent infinite-slab, finite-source calculation uses the authenticated
paper-material packet from 00264, black ground and the original local source.
These are away-Sun rays from five meters above ground. The current local app
uses N1; this is not a claim about an all-orders physical sky.

The earlier [independent all-orders reference](independent-horizon-reference-results.md)
also matters for absolute darkness: it gives approximately 3,367 cd/m2 at
0.05 degrees and 4,688 at three degrees under its infinite-slab hypothesis.
It retains a roughly 28% dip while adding substantial diffuse brightness that
the app's N1 target intentionally lacks. Those are earlier Monte Carlo estimates,
not new H27 results or a matched dome-bounded all-orders app comparison.

| Elevation | N1 luminance, cd/m2 | Rayleigh share | Radiance-weighted altitude |
| --- | ---: | ---: | ---: |
| 0.05 degrees | 1,932.72 | 66.8% | 18 m |
| 1 degree | 2,214.99 | 71.9% | 482 m |
| 3 degrees | 2,974.79 | 83.1% | 3,097 m |
| 4 degrees | 3,081.00 | 85.5% | 4,005 m |
| 10 degrees | 2,506.16 | 89.2% | 6,059 m |
| 20 degrees | 1,702.95 | 88.6% | 6,740 m |

The sampled peak is at four degrees; the immediate horizon is **37.3% dimmer**.
This peak is only located within the registered sparse elevations, not optimized.
The lowest ray stays in dense aerosol, which contributes extinction, absorption
and predominantly forward scattering. Away from the Sun it supplies relatively
little scattering toward the observer per unit extinction. A higher ray climbs
above that shallow layer while substantial Rayleigh scattering remains.

The discriminating quantity is the source function `S = j / betaExt`:
`L = integral S(tau) exp(-tau) d tau`. More path length does not by itself make
an optically thick ray brighter; extinction limits the visible contributing
region. At the same view optical depth of one:

| Native15 center | 0.05-degree altitude | 3-degree altitude | S at 0.05 degrees | S at 3 degrees | Increase |
| --- | ---: | ---: | ---: | ---: | ---: |
| 438.33 nm | 13.9 m | 642.5 m | 0.03225 | 0.04074 | 26.3% |
| 563.67 nm | 18.5 m | 1,165.9 m | 0.02634 | 0.04028 | 53.0% |
| 657.67 nm | 21.6 m | 1,704.7 m | 0.01889 | 0.03411 | 80.5% |

S has spectral radiance units, W/(m2 sr nm). At the green channel, aerosol
extinction falls from 5.19e-5 to 2.00e-5 per meter; Rayleigh falls only from
1.23e-5 to 1.06e-5. Direct-source transmittance rises from 0.845 to 0.892.
Unattenuated source irradiance barely changes, 1.6422 to 1.6415 W/(m2 nm).
This identifies density/species balance and attenuation as a plausible mechanism,
without claiming an isolated causal effect from changing aerosol density alone.

Removing source attenuation while keeping the rest fixed raises horizon Y from
1,933 to 2,323 and three-degree Y from 2,975 to 3,347: the low-ray deficit
persists. Removing view attenuation gives 473,738 versus 15,645 cd/m2, reversing
the ordering. Those enormous counterfactual values are not physical replacement
solutions: they show why counting the long illuminated path without its view
extinction gives the wrong brightness expectation. The complete four-cell
factorial is retained; no aerosol-removal atmosphere or corrected-cache claim
is inferred from it. Source and view attenuation are distinct required factors.

## Display Brightness

Exact retained 00239 center-ray path RGB reproduces p2 output within 2e-6 per
channel at fixed original adaptation. The local noon gain is 1.00047, so low-light
adaptation is effectively inactive. The exponential tone mapping compresses
the physical contrast, but treating its result directly as screen-coded sRGB
then expands the relative brightness difference again.

| Retained local ray | Current tone RGB | Relative display Y, direct raw output | Relative display Y, explicit sRGB transfer |
| --- | --- | ---: | ---: |
| 0.05 degrees | 0.416, 0.432, 0.486 | 0.157 | 0.432 |
| 3 degrees | 0.578, 0.582, 0.587 | 0.298 | 0.582 |

Display Y is relative to sRGB white; it is not physical sky luminance or measured
monitor nits. The immediate horizon is 47.3% below the three-degree ray under
direct raw output, versus 25.7% with explicit transfer. This is a large, separable
amplification candidate. Achromatic exposure changes brighten everything; neutral
and common-Y controls separate brightness from saturation. Synthetic 18% and
90% neutral Lambertian cards under the recorded 84,841 lux have luminances
4,861 and 24,305 cd/m2 and current relative display Y of 0.537 and 0.998. These
are reference anchors, not scene measurements or calibration targets.

The controlled GPU proof uses the installed Three revision 180, a fullscreen
`RawShaderMaterial`, `NoToneMapping`, `SRGBColorSpace`, and the default framebuffer,
on the actual RTX 2060/D3D11 path:

| Shader output | Raw canvas byte | Explicit sRGB-transfer byte |
| ---: | ---: | ---: |
| 0.10 | 25 | 89 |
| 0.25 | 64 | 137 |
| 0.50 | 127 | 188 |
| 0.75 | 191 | 225 |

Thus `renderer.outputColorSpace` alone does **not** encode raw-material output.
Source inspection finds the atmosphere uses that material and writes its
exponential result without a final transfer. The declared color metadata says
`linear-srgb`. If that declaration is the intended output contract, the final
screen path needs an sRGB transfer. If the exponential result was intentionally
calibrated as already encoded, adding another transfer would change that policy;
the historical exposure intent must be reconciled rather than silently assumed.
The direct-scene composer separately contains a colorspace fragment; that does
not establish encoding of the atmosphere pass.

This is stronger evidence than an arbitrary exposure tweak, but the tiny proof
is not a fresh capture of the complete Flat32 composer. A matched app render
with a single final transfer is the next discriminating production-facing check.
The distant N4 retained replay shares the concern; this does not explain its
separately measured pre-display spectral excess or prove one shared transport bug.

## Evidence And Verification

Generated artifacts are below
`tmp/experiments/sky-accuracy-dials/runs/00270-h27-brightness/`:

- `brightness.json`: spectra, all attenuation cells, species, optical-depth
  samples, fixed display replays, neutral cards and GPU telemetry.
- `profile.csv`: twelve-elevation physical profile.
- `display-strips.svg`: current output, conditional explicit transfer, neutral
  at original Y and original color at common Y. Diagnostic swatches, not a scene.
- `definition.json` and `sealed.json`: exact input/source identities, derivation,
  runtime, budgets, artifact hashes and cleanup.

64/128-node refinement differs by at most 4.89e-15 relatively across retained
integrals; the both-attenuation integral agrees with the independent existing
direct solver within 2.56e-15. Species sums, optical-depth inversion, retained
p2 parity and byte-level GPU controls pass. These qualify the specified
quadrature and replay; they are not external libRadtran accuracy scores. The
infinite-slab profile retains its domain identity; the app replay uses its own
captured endpoints and spectra. Earlier H16 tail evidence is not relabeled here.

Numerical execution including scratch cleanup took 14.063 seconds, with one tiny
GPU job/context and 258,615 bytes retained. Scratch high-water was 12,023,449 bytes
and cleanup passed.
One pre-allocation setup failure incorrectly sent the Flat32 runtime to an
Algorithm32-only provenance walker; recording that read-only inspection source
directly repaired it. No scientific run was consumed or retried by that failure.
Type checking passed. The matching mapped review and independent audit are
recorded in `.codex-tmp/review-standards/session-jBH3GK/validation.json`;
implementation completion remains conditional on that receipt being `CLEAN`.

No production fix, new cache, screenshot registration, monitor calibration,
all-orders local reference or matched libRadtran horizon score is included.
