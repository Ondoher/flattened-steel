# Direct Atmospheric Reference Solver

This implements the [idealization](../../../../agents/topics/poc-experiments/engineering-studies/sky-accuracy-dials/idealized-model.md)
using direct nested quadrature and, with explicit owner approval, Monte Carlo
paths. Neither method stores or reconstructs physical fields. Density,
transmission and incoming light are evaluated directly for each query or path.

## Controls

Pass a `SkyDirectProfile` to `directCpu` or `fragment`:

| Field          | Meaning                                               |
| -------------- | ----------------------------------------------------- |
| `view`         | Gauss-Legendre nodes on the observer's viewing path   |
| `path`         | Gauss-Legendre nodes on each nested incident path     |
| `transmission` | Gauss-Legendre nodes for every optical-depth integral |
| `mu`           | Gauss-Legendre direction-cosine nodes                 |
| `phi`          | Uniform midpoint azimuth directions                   |
| `orders`       | Maximum scattering/reflection interaction depth       |

The present mathematical rule generator admits 2-256 Gauss nodes; pure-order
evaluation admits depths 1-4. Only depths 1/2 completed the first GPU matrix.
Use positive integer azimuth counts. Cost grows rapidly with nested depth.
Source constants and quadrature coefficients are inputs, not cached radiance.

`directCpu(medium, profile, channel)` returns `radiance`, `transmission` and
`kernel`. `radiance(origin, direction, order, true)` computes one pure
interaction order on the outer viewing quadrature. Sum orders 1 through the
selected maximum for the cumulative solution. Ground reflection is one
interaction. Positions, radii and scale heights use kilometres; extinction
coefficients use inverse kilometres. Spectral output is W m^-2 sr^-1 nm^-1.

The GPU dispatcher in `shader.mjs` parallelizes independent outer integration
terms and sums the readback in JavaScript binary64. Its outer rays must end at
space; nested paths include ground. The CPU also supports outer ground views.
Neither implementation is a production runtime shader; nested integration loops
are intentional here.

## Commands And Evidence

### Stochastic all-order reference

`monte-carlo.mjs` uses free-flight null-collision sampling, the exact scattering
phase mixture, direct solar attenuation quadrature and coupled Lambertian
ground reflection. Compensated random termination includes later orders in
expectation. Safety limits reject paths instead of accepting a hard cutoff.
The output texture is readback only; there are no physical lookup textures.

`SkyMcProfile` controls solar nodes (32 or 64), independent batch count,
roulette-start interaction and seed offset. `SkyMcRequest` controls paths per
batch and the execution ceiling. These offline loops do not change the
production requirement of loop-free work inside each ray sample.

```text
node experiments/sky-accuracy-dials/continuation/direct-solver/converge.mjs proof
node experiments/sky-accuracy-dials/continuation/direct-solver/converge.mjs preflight
```

The fixed `converge.mjs execute` allocation is consumed by accepted 00230.
See [convergence evidence and limitations](../../../../agents/topics/poc-experiments/engineering-studies/sky-accuracy-dials/direct-convergence-results.md).
Further evidence execution requires its own prospective bounded allocation;
do not reopen the consumed plan or run. The result reports statistical
uncertainty and does not claim all 20 values meet its preset precision target.

### Earlier deterministic matrix

```text
node experiments/sky-accuracy-dials/continuation/direct-solver/run.mjs proof
node experiments/sky-accuracy-dials/continuation/direct-solver/run.mjs preflight
```

`run.mjs` owns the fixed first matrix. Its `execute` allowance has been consumed;
another evidence run needs a new bounded plan and allocation rather than
reopening 00229. To design a different granularity, adjust the profile objects
or pass a profile directly to the exported solver API. The first runner does
not provide a custom-profile command-line option.

See [results and limitations](../../../../agents/topics/poc-experiments/engineering-studies/sky-accuracy-dials/direct-solver-results.md).
The GPU third-interaction attempt timed out; no third-interaction result was
returned. Completed two-interaction results are finite approximations, not a
certified infinite-order reference. All prior evidence remains immutable.
