# Algorithm32 Execution-Profile Contract

Status: Stage 13 Step 1 contract, refined by the completed Step 2 inventory;
profile propagation through groups 3.1 through 3.11 is implemented and the
Step 3.12 closure audit is active.


## Purpose And Ownership

`Algorithm32ExecutionProfile` is the generic, value-agnostic input required to
execute one complete Algorithm32 configuration. Algorithm32 owns the shape and
validates it at ingress. The supplier owns every selected value and constructs
the executable atmosphere, geometry, light source, boundary, and domains.

The caller supplies or selects the complete profile once and passes it to the
aggregate model constructor. The constructor validates and retains that exact
profile for the model lifetime, alongside the component models selected by the
profile. Downstream calculation, cache, shader, and reporting code reads
configuration from `model.profile`; callers do not repeat basis, numerical,
domain, placement, or other profile options on individual method requests.

The Native-15 production profile is the documented default instance. The B1
benchmark owns its direct-40 instances. Algorithm32 does not recognize a
benchmark name, select benchmark values, or recover executable facts from an
identity or descriptor.

The canonical ambient declaration is
[`src/algorithm32/profiles/types.d.ts`](../../../../src/algorithm32/profiles/types.d.ts).


## Complete Shape

| Group     | Required facts                                                                                                                              |
| --------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| Identity  | contract kind, owner-selected id, schema revision, value revision, content hash, and provenance identity                                    |
| Spectral  | one ordered basis with explicit sample semantics and one aligned top-of-atmosphere irradiance-density packet                                |
| Models    | configured light source, atmosphere, geometry, ground boundary or black-ground `null`, and source-placement selection                       |
| Numerical | view-path intervals and sample placement, source-path transmittance intervals, cache-transport intervals, and cumulative scattering maximum |
| Domains   | executable position, weighted incoming-direction, and outgoing-direction domains                                                            |

One source-placement selection is mandatory:

- `geometry-observation` asks geometry to derive placement from the supplied
  observation, preserving ordinary application behavior.
- `explicit-geometry-placement` supplies the same observation plus an exact
  placement already expressed in the selected geometry's coordinates. Geometry
  remains the coordinate owner and validates that placement before installing
  it on the source.

View rays are intentionally not profile fields. A condition-specific profile
owns all cache identity and construction facts; any number of evaluation
requests may reuse its completed cache. B1 therefore creates one profile/cache
per condition and evaluates its 81 benchmark-owned view directions against it.

The retained profile is the single configuration source after ingress. A
downstream request may carry transient work such as a view ray, cancellation
signal, renderer handle, or output target. It must not restate a profile-owned
value. If a method needs the basis, source packet, intervals, scattering order,
domain, or placement, Step 3 will give it the aggregate model or the narrower
model-owned context from which that value can be read.

Constructor injection is the intended ownership seam. There is no global
profile registry, hidden lookup, post-construction attachment, or mutable
profile setter. Replacement configuration constructs a replacement aggregate
model with its replacement profile.


## Ingress Validation And Compatibility

The eventual profile ingress must reject the complete profile before any cache
or shader resource is created when any rule below fails:

1. Identity strings are nonempty, `revision` is a nonnegative integer, and the
   supplied content hash has the repository's canonical SHA-256 spelling.
   Identity and hashes are reporting/provenance metadata, not substitutes for
   validation of executable values.
2. The basis contains at least one channel. Channel centers and support widths
   are finite positive wavelengths, centers are strictly increasing, ids are
   unique, and semantics are one supported `SpectralSampleSemantics` value.
3. The source packet has quantity `spectral-irradiance-density`, units
   `W m^-2 nm^-1`, the identical basis hash and semantics, exactly one finite
   nonnegative value per basis channel, and a nonempty provenance identity.
4. The atmosphere basis matches the profile basis. Every atmosphere packet
   returned during acceptance/evaluation has the requested quantity and units,
   identical basis hash and semantics, matching channel count, and finite
   physical values.
5. A non-null ground boundary has an albedo packet with quantity
   `spectral-reflectance`, units `1`, the identical basis hash and semantics,
   matching channel count, and finite values in `[0, 1]`.
6. The selected placement kind matches the source's
   `geometryPlacementKind`. An explicit direction is finite and unit length;
   an explicit position is finite and unit-bearing. Geometry validates its own
   coordinate and boundary constraints.
7. All three domains have nonempty stable ids and internally consistent
   counts. Position nodes have unique contiguous indices and finite physical
   coordinates. Direction vectors are finite unit vectors. Incoming weights
   are present, finite, nonnegative, count-aligned, and have the domain-owner's
   declared solid-angle normalization. Outgoing reconstruction need not carry
   integration weights.
8. Every interval count is a positive integer. View-path sample placement is
   either `null` for the retained uniform endpoint/trapezoid schedule or one
   supported `ShaderPathSampleDistribution`. The cumulative scattering
   maximum is one of `1`, `2`, `3`, `4`, or `5`; a concrete execution path must
   reject an order it has not implemented rather than silently substitute one.
9. Cache field packing and every produced packet must use the selected basis
   channel count and the selected position/outgoing domain counts. No
   projection, padding, truncation, or native-15 fallback is permitted.

Validation happens once at the trusted configuration ingress. Downstream
owners consume the accepted objects and direct values. Compatibility and cache
reuse are derived from the accepted basis, physical owners, placement,
numerical controls, and domains; a caller-supplied descriptor cannot make
incompatible values compatible.

The aggregate model must expose the exact accepted profile object. Its
`lightSource`, `atmosphere`, `geometry`, and `groundBoundary` properties are the
same objects held by `profile.models`, not reconstructed copies. This makes the
model/profile association unambiguous and allows every downstream owner to
adapt from one retained authority.


## Default And Benchmark Difference

| Concern                   | Native-15 default                               | B1 direct-40 instance                                                   |
| ------------------------- | ----------------------------------------------- | ----------------------------------------------------------------------- |
| Basis                     | 15 contiguous bin averages                      | 40 point-sampled spectral-density coordinates                           |
| Source                    | Native-15 solar packet                          | benchmark-owned paper solar packet                                      |
| Atmosphere                | canonical production atmosphere, ozone disabled | benchmark-owned paper atmosphere, ozone absent                          |
| Ground                    | black ground unless explicitly selected         | benchmark-owned grass albedo with a uniform Lambertian boundary         |
| Placement                 | geometry derives the Sun from observation       | benchmark supplies each exact distant-Sun direction                     |
| View intervals            | 15                                              | 40                                                                      |
| View sample placement     | uniform endpoint/trapezoid                      | uniform endpoint/trapezoid                                              |
| Source intervals          | 20                                              | 20                                                                      |
| Cache transport intervals | 15                                              | 40                                                                      |
| Scattering maximum        | cumulative J4                                   | benchmark selects Default or cumulative J2 through J5                   |
| Position domain           | production Native-48 nodes                      | benchmark's 48 physical altitude nodes, including the exact ground node |
| Incoming domain           | source-selected production domain               | selected reflection-completed ordinary-68 quadrature                                          |
| Outgoing domain           | source-aligned W27                              | source-aligned W27                                                      |

No optional profile field means "use the native value." The native facade will
construct and retain the complete Native-15 default profile, while a benchmark
constructs its own complete profile. The facade accepts the profile as one
selection rather than asking callers to reproduce its options. This prevents
partial benchmark configuration from falling through to application defaults.

## Prospective Compact Local Policy

The [local P0 contract](../caches/local-sun-cache-p0-contract.md#complete-candidate-profile-and-support)
selects one complete local candidate using applicable shared Native15 physical,
spectral, order and W27 selections, with explicitly justified slab/source policies.
P1 extends the numerical declarations/ingress with tagged analytic versus sampled
source transmittance and local-column versus spherical transport. A count is
mandatory and positive only for a policy that consumes it; reject conflicting
or inapplicable overrides rather than silently ignoring them. Existing profiles
retain their current shape and behavior until that extension is implemented.
This does not add an executable builder, public export or qualified custom profile
in P0. The complete local candidate's support/rejection and evidence boundaries
remain owned by the linked contract.


## Step Boundary

The complete profile contract is implemented through Stage 13 Step 3.12.
The [current closure and remaining follow-ups](stage-13-status.md) supersede
the former Step-1-only implementation status. The
[method inventory](execution-profile-method-inventory.md) retains the
propagation surface; it is not an instruction to repeat completed steps.
