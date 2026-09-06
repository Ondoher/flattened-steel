# Algorithm32 Figure 1 Diagnostic

Focus: Independent B-family execution and scoring.

Related owners: [appearance-review](../../poc-flat32/appearance-review/figure1-diagnostic.md).

## Purpose

The Figure 1 diagnostic places Algorithm32 beside the full published clear-sky
model and measurement panel set at the four rounded solar zenith angles used
by the comparison paper. It is a coherent-artifact and presentation sanity
check. It does not replace B1, B2, or B3 and is not an accuracy score.

The retained artifact is
[the 44-panel full-spectral composite](../../../../references/results/experiments/figure1-full-spectral/figure1-with-algorithm32.png),
with its [result record](../../../../references/results/experiments/figure1-full-spectral/result.md).
Its current SHA-256 is
`12989929e2fa996ce9500f0f59daf3428986569d0686fdd494961772ef43f832`.


## Retained Calculation Boundary

The local Algorithm32 column represents the direct 40-coordinate paper
profile with:

- the paper atmosphere, solar spectrum, and profile-owned Lambertian grass
  spectral albedo;
- pinned Fibonacci-34 incoming integration;
- W27 outgoing reconstruction;
- cumulative scattering through order 4;
- the existing 48 physical altitude nodes with view-only actual-node linear
  interpolation; and
- one final application of the declared paper-comparison spectral-to-display
  transform.

Each panel is a native 256 by 256 pixel-center equidistant fisheye. The 39
published panels are retained without geometric resampling, and the four local
panels are inserted immediately before the libRadtran column. The composite is
2,816 by 1,160 pixels and contains 44 panels.

This is a retained CPU research boundary. It is not output from the current
production GPU cache path, which has not yet been integrated.


## Production Promotion

After the J4 GPU cache and view sampler are complete, regenerate the four local
panels from the production GPU path, compare them with the CPU oracle at the
spectral boundary, rebuild the native-size composite, and register the
standalone diagnostic in `/references/experiments.md`. Keep the published
panels and their source identities fixed so a production change affects only
the declared local column.


## Claim Boundary

The diagnostic can support a statement that a declared Algorithm32 boundary
was rendered and inspected beside the pinned published panels. It cannot
establish numerical equivalence to another model, a perceptual threshold,
agreement with measurements, adequacy of a quadrature, or any B1/B2/B3
classification inferred from image resemblance.

Earlier Default/hi, Algorithm32-star, invariant-domain, and flat/local dome
comparisons are historical evidence only. They do not define this current
diagnostic or the production algorithm.
