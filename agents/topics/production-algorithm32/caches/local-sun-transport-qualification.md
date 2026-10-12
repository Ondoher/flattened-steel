# Local-Sun Cache Transport Qualification

This sixth bounded P1 slice implements selected-ray cache transport through current
production owners. The owner authorized a 45-minute slice on 2026-10-12, followed
by review, local checkpoint and stop. The [status](local-sun-cache-promotion-status.md)
owns completion and its matching review receipt. Full physical-field construction,
recurrence, profile integration, GPU and runtime consumers remain open.

## Policy And Ownership

`LocalSunCompactTransport` owns explicit `column48-tail64-binary64-v1` cache
discretization and accumulation. The retained policy uses 48 intervals, squared
cumulative Rayleigh-column placement and a per-channel optical-depth-64 prefix
found by 24 bisection steps. The number 64 is a cutoff, not an additional interval
count. The near-horizontal, low-argument logarithm, exponential-column and
attenuation-weight series branches retain the selected experiment algorithm.
The exact final sample is the retained length rather than a rounded inverse.

Geometry creates a closed physical ray from an admitted unit-bearing origin and
direction using the actual compact topology cylinder. It resolves ground, slab
top, cylinder or explicit shortened boundary independently of rectangular defaults.
The cylinder quadratic uses a rationalized outward root to avoid cancellation.
Only the exact geometry-created physical endpoint receives boundary construction:
ground/top have exact altitude, and a cylinder endpoint is constructed inward by
four binary64 epsilons. At the frozen radius that displacement is below 0.01 m.
This bounded rounding does not admit an outside origin or alter an interior query.
A tau-cutoff prefix remains interior and never inherits cylinder endpoint handling.

The new private `CanonicalExponentialCacheColumn` adapter lives under the
atmosphere's cache owner. It obtains unchanged public Native15 coefficient packets
and scale heights and supplies unit-bearing exponential density columns and
dimensionless optical depth. The cache does not implement medium equations or
coordinate transforms. Existing atmosphere, source, phase/scattering models and
their default paths remain unchanged. Ozone, nonpositive extinction and changed
bases are unsupported by this adapter. Changed physical inputs need their own
comparison before acceptance; this receipt qualifies the frozen control only.

At each sample, existing compact reconstruction restores physical J from read-only
stored values. The source function is `S=J/kappa`; positive weights integrate its
linear interpolation in cell optical depth, with transmission accumulated from the
atmosphere-owned columns. Finite signed values retain their sign without clamping.
Output is a Native15 radiance packet in W m^-2 sr^-1 nm^-1, with the parent field
identity and executable transport policy. Returned transmittance is to the retained
per-channel prefix, which can end before the full physical ray. It is dimensionless
with the shared packet unit `1`. No field is rewritten or allocated by this slice.

## Independent Controls

The [checked authority](../../../../src/algorithm32/implementation/local-sun/cache/fixtures/local-sun-transport-controls.json)
has SHA-256 `908815a638350a5ddc00d0172282cd81c2ffd79b4d5fa2acd48b22c33bfdc2df`.
Final formatted numerical controls and gates were frozen before candidate scoring.
The offline author imports only shared physical literal data and checked-path
tooling, with no production numerical owner. It computes independent slab/cylinder
intersection equations, stable `expm1` exponential integrals and convergent
attenuation-weight series. Retained source/policy and `00132` input/manifest
ancestry are authenticated read-only and recorded with complete hashes; the
later ended policy source is a separate parent, not represented as the exact
`00132` implementation. Historical source is never executed or edited.

Twelve rays include ground/top/cylinder, axis, near-horizontal, descending,
explicit shortened, optically thick cutoff and zero-length outward exits. All
15 channels have 49 independent sample distances and scalar output controls.
Synthetic physical J is `kappa*(h/r)^2`; independent normalization factors provide
stored node samples, so reconstructed `S=(h/r)^2` has analytic physical meaning.
The authority applies endpoint-linear optical integration independently to those
sample values. This qualifies the selected transport kernel and its coupling to
reconstruction; it does not establish actual scattering-field accuracy or recurrence.

The frozen gates are endpoint 0.01 m, sample distance 1e-5 m, column relative
1e-9 with absolute 1e-9 m, attenuation-weight absolute 1e-10, radiance relative
2e-7 with absolute 1e-9 W m^-2 sr^-1 nm^-1, and transmittance absolute 1e-7.
These are declared algebra/control gates, not observed residuals or physical
accuracy bounds. They preserve and expose the retained small-argument approximations.

The original control/producer are preserved in immutable `00014-control-documentation`
after the first `00013-transport` comparison. A required JSDoc spacing repair
changed only producer documentation and evidence metadata; numerical values,
ray selection and gates remain identical. Their common numerical-payload SHA-256
is `61f032b79750c1f854efa602947d890c6c062a2d40b5d8e21674e6f9d6f67370`.
The checked fixture records that original authority and producer ancestry. No
observed candidate residual altered a control value or acceptance rule.

## Selected Comparison And Limits

New immutable [run 00015](../../../../tmp/production-local-sun-cache-promotion/runs/00015-transport/comparison.json)
passes 180 channel outputs, 8,820 sample distances, 15 cutoff prefixes,
16 exponential column controls and nine positive-weight pairs. Largest residuals
are 3.725290298461914e-9 m for sample placement,
5.459296517074108e-7 m for the retained density-column approximation,
4.09430302161784e-13 for weights,
5.6316895591379534e-12 W m^-2 sr^-1 nm^-1 for synthetic radiance and
2.3514523661560816e-13 for transmittance. Stored J bytes remain unchanged;
signed input remains signed. Four focused unsupported-input checks reject.
The manifest identifies authority/comparison artifacts; derivation retains parent,
operation, complete relevant implementation, material parameters and tool identities.

Offline entrypoints:

```text
node scripts/algorithm32/local-sun-cache/transport/LocalSunTransportProof.js
node scripts/algorithm32/local-sun-cache/transport/LocalSunTransportProof.js --out <new-plan-run-directory>
node node_modules/typescript/bin/tsc -p scripts/algorithm32/local-sun-cache/transport/jsconfig.json
```

Output writes require a new normalized plan-owned directory; existing runs,
traversal and symlinks/junctions reject through the shared checked-path owner.
The portable proof authenticates checked bytes and producer identity before typed
use and does not require the historical generated tree. Authoring alone reads it.
Complete compact CPU fields, incoming-frame integration, pure/cumulative recurrence,
direct L1/source-path and runtime-view column selection, changed profiles, rotated
boundary families, GPU parity/resource measurements and consumer behavior remain
separate gates. Ordinary profiles/defaults and deployment remain unchanged.
