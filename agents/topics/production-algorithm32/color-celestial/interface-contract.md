# Extraterrestrial Source Interface Contract

Focus: Color, receiver light, visible sources, and stellar presentation.

## Source Definition And Placement State

Every source has one immutable, fingerprinted field definition containing:

- a unique source identity and a `point` or `extended` discriminant;
- a placement-provider contract naming the celestial frame/origin convention,
  the permitted infinite-direction form, time scale, and provider
  fingerprint;
- distant angular support when extended;
- one typed spectral measure;
- ordered wavelength centers, represented bin widths, basis identity, values,
  units, provenance, uncertainty status, and a stable fingerprint.

The current placement is a separate immutable evaluated state:

```text
CelestialPlacementState {
  sourceId
  direction in the declared celestial frame
  frame/origin identity
  epoch and time scale
  placementStateFingerprint
}
```

The field definition and its fingerprint contain no evaluated epoch,
direction, position, model transform, or cache stencil. A placement-state
change therefore refreshes the geometry query packet without changing the
first-family transported-field identity. Changing the provider contract,
angular support/profile, source kind, or radiometry changes the field
definition and invalidates that generation.

The active `spherical-sun-stars-radial-v1` family accepts only infinite
directions and one distant uniform Sun disk. Finite positions, physical body
support, opaque celestial layers, and body-surface state belong to the
[resolved-Moon follow-up](moon-follow-up.md) or another separately qualified
family; they are rejected by the active executable contract.

No bare numeric array crosses this boundary. Geometry does not own brightness,
and the spectral measure does not own camera response, pixel solid angle,
visibility, atmospheric transmittance, or display controls. A field
definition's kind and quantity must agree:

| Source kind | Owned quantity | Unit |
| --- | --- | --- |
| Point | Top-of-atmosphere spectral irradiance density `F_lambda` | `W m^-2 nm^-1` |
| Extended | Directional top-of-atmosphere spectral radiance density `L_lambda(omega)` | `W m^-2 sr^-1 nm^-1` |

This document selects semantics, not a production declaration file or owner
tree. A future accepted promotion must allocate the static field-source
definition, separate evaluated celestial placement state, and
geometry-resolved model/cache packets from the
[Celestial Contribution Cache design](../../../../archives/topics/topic-consolidation-20260906/agents/topics/extraterrestrial/celestial-contribution-cache-design.md)
to their nearest demonstrated capability owners through the
[canonical Algorithm32 organization](../../../../archives/topics/retired-20260906/agents/topics/algorithm32/archive/reconciliation-2026-08-04/algorithm32/source-organization-plan.md#selected-target-tree).
No current `ExtraterrestrialSource` declaration is presumed, and the design
does not freeze an implementation API before that promotion decision.

The first integration normalizes every external source to Algorithm32's active
15-channel spectral-density basis before transport. High-resolution source
data is conservatively reduced per represented wavelength bin:

```text
channelDensity = integral over channel bin of sourceDensity dLambda
                 / channelBinWidth
```

The spectral-basis owner and its direct contract remain the single authority
for centers, bounds, widths, and point-versus-bin semantics. A bin-integrated
energy packet must not be labeled or added as a spectral density.


## Responsibility Split

- **Source/state provider** owns the static radiometry and
  placement-provider contract, then produces one immutable evaluated
  placement state in a named celestial frame for a declared epoch. Artificial
  presentation placement is distinct and cannot satisfy an astronomical
  claim.
- **Geometry** owns the geographic observation frame and every transform from
  celestial-frame placement or renderer receiver state into model placement,
  exact source direction and infinite-depth semantics, atmosphere path, cache
  domain, and cache stencil. Its transform and visibility operations never own
  or interpret brightness or point-response weights. The geometry-provided
  controller's cache builder may consume a validated source-owned spectral
  measure solely to combine it with atmosphere transport.
- **Algorithm32 atmosphere owner** owns path radiance and channel-wise direct
  transmittance. Cache construction asks it to transport the exact
  geometry-resolved point direction or each physical extended direction.
- **Celestial Contribution Cache** retains complete transported point
  irradiance and extended radiance fields in an immutable additive layer
  roster. It owns neither live placement nor camera raster policy.
- **Point-set accumulator** queries the bounded star-field member table,
  resolves each member's exact visibility and projection, then publishes one
  linearly combined star-field result with aggregate and per-member
  conservation accounting.
- **Extended integrator** derives perspective-pixel solid angle, queries
  transported radiance at physical footprint directions, and integrates with
  their angular weights.
- **Live visibility resolver** owns ordinary renderer foreground depth/hits.
  It tests an exact point-source direction before response spreading and the
  selected physical extended directions during footprint integration.
- **Frame composer and Color** add compatible spectral-radiance quantities and
  perform the one global spectral-to-display conversion.

Point emitters add linearly and do not consume an opaque pixel-coverage
fraction. The active family has no celestial blocker; ordinary live scene
geometry can block an exact source direction. A point response is spread only
after that exact-direction visibility decision.

The cache receiver is the current view-ray origin after geometry maps it into
model meters. It is not a renderer endpoint, an atmosphere march point, or an
unconverted camera-space position. Moving that physical receiver within the
declared domain refreshes a cache query stencil but not the transported-field
generation. Camera orientation, projection, FOV, viewport, and resolution
affect only later raster rays, support, response, and pixel solid angle.


## Contribution Layers

The first cache generation has one immutable two-layer additive roster:

```text
starField:
  kind: infinite-point-set
  members: [bounded canonical point-source roster]

sun:
  kind: distant-extended
  profile: uniform-disk

foregroundEdges: []
```

The stars act as one layer for identity, cache publication, failure,
replacement, disposal, composition, and aggregate diagnostics. They do not
become one direction: each member retains its source identity, exact
geometry-resolved direction, transported spectral irradiance, visibility
result, projection, and off-raster accounting until member evaluation is
complete. Only then are surviving member radiances added channel-wise.

The Sun layer is one distant uniform extended disk whose evaluated placement
state supplies its celestial-frame center direction and whose static
definition owns its spectral radiometry and angular-support/profile contract.
It is integrated independently from the point set and added spectrally.

Both layers are infinite, nonblocking, and strictly additive. Array order is
not alpha composition or a draw-order shortcut. Any finite placement, opaque
celestial policy, or nonempty `foregroundOf` graph is unsupported. Moon depth,
surface rendering, solar illumination, and Moon-over-star ordering are
deferred to the [resolved-Moon follow-up](moon-follow-up.md).


## Exact Perspective Pixel Solid Angle

`Omega_i` is derived from the pixel's four unit corner rays, not a fixed or
viewport-wide approximation. Order those rays consistently around the pixel
and split the spherical quadrilateral into two ordered spherical triangles:

```text
Omega_i = Omega_triangle(r00, r10, r11)
        + Omega_triangle(r00, r11, r01)

Omega_triangle(a, b, c) = 2 atan2(
  a dot (b cross c),
  1 + a dot b + b dot c + c dot a
)
```

The corner orientation must make both terms positive; a reversed or
self-crossing order is invalid. This exact spherical-triangle relation is
from Van Oosterom and Strackee, AMA `[11]`. Both point response conversion and
extended pixel averaging use this same `Omega_i`.


## Point Transport

For stable geometry visibility `V_build`, source-direction transmittance
`T_lambda(directionToSource)`, and point spectral irradiance density
`F_lambda`, cache construction produces:

```text
E_cached,lambda
  = V_build T_lambda(directionToSource) F_lambda
```

For destination pixel `i`, exact pixel solid angle `Omega_i`, normalized
response weight `p_i`, and live renderer foreground visibility `V_live`:

```text
L_point,lambda,i
  = V_live E_cached,lambda p_i / Omega_i
```

The response is nonnegative and conserves the modeled source measure:

```text
p_i >= 0
sum_on_frame p_i + p_off_frame = 1
```

Image-edge loss is reported, not renormalized. If the response is chromatic,
normalization and off-frame accounting apply independently per wavelength.
Stable visibility and transmittance are evaluated once at the exact source
direction during cache construction. The live renderer evaluates scene
visibility once at that same exact direction before spreading.
Destination-ray transmittance and destination-pixel visibility must not be
applied again.

The star-field result is the channel-wise sum over its canonical member table
after the live visibility test. A blocked member contributes exact zero; its
irradiance is not redistributed to another member or response pixel.


## Extended Transport

For stable geometry visibility `V_build(directionToSource)`, cache
construction produces:

```text
C_cached,lambda(directionToSource)
  = V_build(directionToSource)
    T_lambda(directionToSource)
    L_lambda(directionToSource)
```

For pixel angular domain `P_i`, live directional visibility
`V_live(directionToSource)`, and exact solid angle `Omega_i`, runtime computes:

```text
L_extended,lambda,i = (1 / Omega_i) integral over P_i of
  V_live(directionToSource)
  * C_cached,lambda(directionToSource)
  dOmega
```

Every quadrature sample uses its own geometry-resolved direction, cache query,
and live visibility. Atmospheric transmittance is already present in the
cached radiance. Angular occupancy is represented by the integral; there is no
later scalar coverage multiplier. Any future profiled or collapsed
representation must converge to the same disk-integrated spectral irradiance.

For a uniform circular disk of angular radius `alpha`:

```text
E_lambda = pi L_lambda sin(alpha)^2
```

A limb profile, when selected, is normalized to the same source-owned
disk-integrated irradiance.


## Frame Composition

The pre-display frame remains one compatible spectral-radiance-density sum:

```text
L_celestial = L_starField
            + L_sun

L_final = L_path
        + L_celestial

if an Algorithm32 path supplies a compatible spectral endpoint:

L_final += L_endpoint_transported
```

The current production path has no spectral endpoint packet; captured scene
RGB remains on its established Color-owned bridge. A future compatible
spectral endpoint stays separately labeled and joins the pre-display sum
without becoming atmosphere path radiance.

The atmosphere path is never spread through a point response. Extraterrestrial
sources stay outside atmospheric-scattering-cache construction and identity;
their own identities instead participate in the distinct celestial cache.
No source converts itself to RGB or owns an independent exposure.


## CPU And GPU Contract

Development implements the readable CPU behavior first. The CPU lane owns the
deterministic quantity, conservation, ordering, and convergence oracle. The
GPU/browser lane then implements the same field-source definitions, placement
states, exact-direction transport, angular integration or response
distribution, and pre-Color spectral addition. CPU and GPU must consume
equivalent geometry-provided
celestial transforms and cache stencils; neither may independently construct
a camera-space source direction.

The GPU implementation must use live GPU atmosphere results where the active
renderer owns them; it must not replace the renderer's atmosphere with an
uploaded CPU atmosphere frame. Resource layout, accumulation strategy, and
lifecycle remain implementation decisions, not source physics. A source phase
is not complete until focused CPU/GPU parity and lifecycle behavior are
resolved.


## Fail-Loud Invariants

Reject quantity/unit/basis mismatch, kind/measure mismatch, negative spectra
or response weights, non-normalized response support, duplicate layer/member
or source IDs, a placement state incompatible with its static source
definition/provider contract, any finite placement, opaque celestial policy,
or nonempty foreground graph, point-set capacity overflow, invalid or
unnamed-frame geometry, camera-space placement at the durable source boundary,
missing required provenance, double transmittance, and any attempt to pass
display RGB as source radiometry.

Diagnostics retain source and basis fingerprints, celestial and
geometry-transform fingerprints, model-frame directions, cache generation and
stencil identities, live blockers, pixel solid angles, response or quadrature
weights, construction transmittance, off-frame accounting, and separate
path/endpoint/extended/point/pre-display components. Detailed retention
requirements may be completed during later production regression and citation
hardening.
