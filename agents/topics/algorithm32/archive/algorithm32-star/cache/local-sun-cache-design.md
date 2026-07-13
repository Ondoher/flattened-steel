# Local-Sun Whole-Flat-World Cache Design

The Star source and immutable run paths in this terminal design are
archive-internal and resolve through the
[Algorithm32-Star evidence index](../../../../evidence/algorithm32-star/README.md).

Status: terminal accepted design and archived experiment evidence. Phase 1 is
complete, and corrected physical Phase 2 work is accepted
through diagnostic P2.7 in runs `000253` through `000255` and `000335`;
production-backed run `000325` is invalid evidence. The v1 V-only field
and query-time cumulative scaling are superseded. The corrected candidate
retains the geometry-owned `z * rho` physical position domain, exact source
direction/path facts at every position, Fibonacci-34 construction radiance,
and W27 scattering density. Shell distance quantizes only the inverse-square
incident amplitude used during J1 construction. Run `000258` additionally
wires a bounded z19/rho2/Fibonacci-34/W3 cumulative cache into Star's
flat/local subjective CPU scene and renders it without a separate direct-J1
loop. Run `000259` extends that path to a Union Glacier / Flat 0 perspective
fixture with endpoint-shortened rays and matte boxes at 250 m, 3 km, and
30 km, so distance extinction and in-scattering are visible on objects.
Run `000260` repeats the fixture at canonical Union Glacier Flat 180 with an
expanded `31.413 Mm` bounded rho endpoint and matching subjective shell
facts; its low approximately `8.738 deg` source is not clamped into the Flat
0 radial domain.
Run `000261` retains those inputs and rerenders the scene at 384 by 256
physical view rays; it is the current subjective Flat 180 artifact.
Run `000262` repeats the fixed high-resolution scene at Flat 135 with matching
`29.110 Mm` radial facts. Its still-dark horizon is retained as subjective
evidence only and has not been attributed to the cache or physical model.
Run `000263` repeats the scene at Flat 45. Its independently verified
`14.194 Mm` source distance, `19.886 deg` elevation, and
`0.11436755656756563` incident scale produce a materially brighter subjective
horizon than the 135/180 variants.
Run `000264` provides the matching high-resolution Flat 0 baseline at
`7.924 Mm` source distance and `37.538 deg` elevation; it is visibly brighter
than all three offset-time variants.
Run `000265` widens that unchanged scene to a 90-degree vertical field of
view. The additional upper sky remains pale, retaining a possible cache,
spectral, or display-boundary color question for later diagnosis.
Balanced-quadrature diagnostics now close the first replacement trial. The
score-independent cube-diagonal-rotated Lebedev-38 candidate removes exact
horizon nodes and greatly reduces Flat N2/N4 mirror residuals in runs
`000294` and `000295` without later-order energy growth. Paper runs `000296`
and `000297` show improved B1 RMSE but worse B2 RMSE, absolute bias, and
worst residual than Fibonacci-34. It is therefore not selected; production
and default incoming domains remain Fibonacci-34.
The follow-up five-degree near-horizon orientation retains grazing nodes and
passes N2 in run `000298`, but its N4 sky crosses both gross-clipping limits
in runs `000299` and `000300`. It stops before paper scoring and is likewise
not selected.
The frozen paired-Fibonacci count ladder then tests `34, 38, 42, 46, 50`
without choosing a render-favorable orientation. Runs `000301` through
`000310` show that paired-34 is the only low-asymmetry stable N4 member;
paired-38 clips and the three higher counts retain large coherent residuals.
Paper boundaries `000311` through `000314` and analysis `000317` select
paired Fibonacci-34 as the B1-first experimental candidate: B1 improves to
`11.769137` from production Fibonacci-34's `11.925783`, while B2 RMSE
slightly worsens to `2.705527` from `2.629376`. This is candidate evidence,
not a production-domain change; the default remains pinned Fibonacci-34.
P2.7 diagnostic implementation is accepted in run `000325`.
The experimental Flat32 path uploads the active source case's `2,049`
equal-inverse-square boundaries as an R32F data texture and substitutes the
containing shell's arithmetic-mean scale only during GPU J1 construction.
Accepted real-browser runs `000321` through `000323` prove this path compiles
and executes with paired Fibonacci-34 at Flat 135, Flat 0, and Flat 180.
Run `000325` additionally accepts its predeclared R32F fact bounds,
binary64-CPU/R32F-GPU N1/N2/N4 selected fields, W27 completed rays, resource
limits, source/plan identity invalidation, publication lifecycle, and cleanup.
Production
and the ordinary Flat32 branch remain unchanged. This
document owns the scattering-aligned shell/base-fact representation for a
finite local Sun under the selected whole-flat-world atmosphere boundary. It
is not a production selection and does not change the selected physical
model. Phase 1 compared continuous
direct available light with the arithmetic-mean light level held by increasing
inverse-square shell counts, then projected only that difference through a
frozen color-perception calculation. It did not materialize a complete
scattering field. Its ladder reached the first passing tested count at
`N = 2,048`; the `1.5 m` family-wide minimum innermost-shell width remains
the alternative backstop for a fresh family. The
[shell-cache characterization plan](../experiments/local-sun-shell-cache-experiment-plan.md)
owns its staged execution and current status.

## Closed Light-Only Characterization Foundation

Status: accepted Phase 1 facts and isolated Phase 2 CPU candidate evidence.
GPU, renderer, application, and production selection remain separate.
Phase 1 characterized continuous direct
available light against the arithmetic-mean light level held by a shell. It
did not construct or interpolate a complete resident scattering field. The
downstream field section is retained as context only.

The modeled Phase 1 fact representation is not a multidimensional spatial grid.
It has two independent one-dimensional row families:

```text
u: inverse-square source-distance boundaries exercised by this study
v: 48 modeled shared atmosphere rows counted for resource accounting
```

There is no around-shell `s` coordinate. Available source light and the
shell's inner and outer boundaries are constant around a shell. Geometry
computes the exact query ray length and ground, atmosphere-exit, rim, and
whole-world classification; those facts determine where an otherwise valid
shell or ray is physically truncated. Variation in that exact query geometry
does not create another stored cache axis.

Geometry also owns the conversion from its native position coordinates and
the selected finite-source position into source-relative query coordinates.
The deciding radial lookup consumes the resulting `distanceFromSource`; it
does not subtract source/world positions or interpret a geometry frame
itself. The selected Native-48 atmosphere lookup consumes the
geometry-resolved flat altitude under the rule below, although the light-only
deciding study does not invoke it. Neither row family needs world-position
rows merely to perform these transforms.

The atmosphere model is globally shared and is not a shell-count
approximation axis. The deciding study generates its physical samples only in
shell-relative inverse-square coordinates. A fixed normalized direct-primary
radiance response bank supplies the atmosphere/geometry context needed for the
display diagnostic without adding world-position rows or a second deciding
spatial axis. The deciding approximation is only continuous direct light
versus the one light level used to generate the shell's cached result.

The modeled Phase 1 fact block contains two independent one-dimensional
tables: source-light and shell-boundary facts use `u`, and atmosphere facts
use `v`. Analytically derivable values need not be stored. A coupled `U * V`
fact record is a different representation and fresh family. This does not
define the resident payload, construction peak, or resource model of a
complete Phase 2 scattering cache.

The radial approximation is shell-held, not query-time interpolation of
available light. For one fixed atmosphere and exact-geometry context, the two
radial boundaries and their light levels deterministically define the one
light input that would generate the shell's cached result. The
characterization does not construct that result. The input applies throughout
the shell even though direct inverse-square light varies continuously inside
it. Increasing `N` narrows the interval over which one input is reused and is
therefore expected to reduce the radial error.

The characterization need not materialize the complete cached field to test
this. It calculates only the shell-held light level and the fixed response
projection needed to compare the implied result with continuous direct light.
It must not replace the shell-held result with exact query-time inverse-square
interpolation, because that would remove the approximation being measured.

The selected shell-generation light rule is the arithmetic mean of the two
boundary levels:

```text
shellHeldLightLevel = (entryLight + exitLight) / 2
```

Because available light is linear in normalized inverse-square coordinate,
this is exactly its coordinate midpoint and minimizes the maximum absolute
light-level error across the shell.

## Summary

Atmospheric scattering is too expensive to calculate from scratch for every
visible point, so the current design retains or derives the small set of base
facts needed by a deterministic calculation from shell facts.

The eventual complete field contains lighting for thousands of directions and
wavelengths at every retained position. The current study avoids constructing
that field and asks how closely one arithmetic-mean shell light level tracks
continuous direct light under the selected fixed-response E8/E2 projection.

Distance from the Sun determines the available-light amplitude tested here.
The complete scattering calculation additionally consumes geometry-owned
position, direction, atmosphere depth, and path facts. Those are not
distance-dependent light factors and are not discarded by the corrected
physical cache.

The proposed solution is a nonlinear, shell-based index:

- Arrange samples on expanding shells centered on the Sun.
- Place the fixed number of radial shells by inverse-square available-light
  intervals, which are narrow near the source and wide farther away.
- Use fixed inverse-square radial bands and 48 modeled shared atmosphere rows.
- Apply exact query ray length and boundary classification when a ray or shell
  reaches the ground, atmosphere exit, rim, or whole-world edge.
- Do not add an around-shell sample dimension to base facts that are invariant
  around the shell.

This concentrates cache memory where it contributes the most accuracy. It
changes only how cached samples are organized; it does not alter the Sun,
atmosphere, dome, world size, or lighting physics.

Initial validation keeps continuous direct light, the shell-held midpoint
light, and their deterministic color projection distinct. Exact whole-world
geometry and atmosphere are evaluated once into a normalized response bank;
that same response is scaled by both light levels, so only the level
approximated by shell placement contributes to shell error.

The first study reports how light-level and perceptual error change with shell
count, the complete bytes of the modeled fact representation, the terminal
reason, and the last five completed counts at either scientific stop. It does
not assign a full W27-by-native-15 packet to every logical fact sample.

Those curves can expose cache-quality tuning levers rather than force one
global application configuration. This study selects no application profile.
The
[Flat32 application design](../production/flat32-migration-inventory.md#future-application-cache-quality-profiles-and-feature-policies)
owns later profile selection and feature-scoped override behavior.

## Problem

For downstream comparison only, the runtime cache ultimately supplies
cumulative local spectral scattering density:

```text
JthroughN(position, outgoingDirection, wavelength)
```

That former complete-field representation requires `4,374 * 15` scalar values
at every retained position. At R32F precision, each additional position costs:

```text
4 bytes * 4,374 directions * 15 wavelengths = 262,440 bytes
```

That complete-field cost motivates the current question: whether the
deterministic calculation can instead be characterized and driven from a
small factorized set of source/shell and atmosphere facts. The current memory
model therefore counts those fact records rather than assigning `262,440`
bytes to every logical `(u,v)` combination.

The whole-flat-world atmosphere also has two distinct horizontal centers:

- `Sxy`, the finite Sun's horizontal subpoint; and
- `C`, the fixed map and atmosphere-dome center.

Source distance controls inverse-square illumination and shell membership.
Map position controls the exact boundary exit and physical ray length. The
current calculation preserves the latter as query geometry instead of
sampling it as a resident cache coordinate.

The design objective is therefore:

> Minimize perceptually relevant error from the radial shell approximation
> per resident base-fact byte, while preserving exact atmosphere, ray length,
> and whole-flat-world boundary behavior.

## Physical Invariants

The index is an approximation of a fixed physical model. It may not change:

- the Sun's physical position, radius policy, spectrum, or inverse-square
  behavior;
- the map center, whole-world radius, ground, atmospheric dome, or transparent
  atmosphere exit;
- altitude-based density, scattering, absorption, or optical depth;
- vacuum continuation between atmosphere exit and the finite Sun;
- the physical meaning of the wavelength and direction domains, recurrence,
  or ground-boundary contracts; an alternative numerical discretization must
  be a separately named and validated quality configuration rather than a
  hidden budget adjustment; or
- ray distances, source distances, or world coverage to satisfy a cache
  budget.

Camera and display state are not cache coordinates and cannot shape the
physical boundary or shell index.

### Spatial-Placement Guiding Principle

The modeled base-fact index separates the shared physical inputs into
finite-source distance/inverse-square change along `u` and atmosphere state
along `v`; the light-only characterization exercises only `u`.
Source-path length, cap thickness, map-relative geometry, and
ground/cap/rim/world-exit classification are evaluated exactly for the query
ray and control the integration interval; they do not receive cache rows.
Wavelength and the five fixed response directions participate only in the
frozen deterministic comparison projection and do not receive separate shell
meshes or spatial sample axes.

The fixed source spectrum and atmospheric composition determine the
wavelength-dependent response to the light-level difference. Continuous
direct binary64 light is the measurement authority. The selected projection
is the normalized direct-primary response at `[0, 0, 5] m` under five retained
local-Sun ray roles, followed by the typed E8 and E2 output boundaries. It
does not turn each wavelength or response direction into a separately fitted
spatial partition.

### Inverse-Square Shell-Count Guiding Principle

Each characterization level begins by choosing one integer number of shell
intervals $N$ over the complete valid source-distance range
$[r_{\min},r_{\max}]$. Its baseline boundaries are the equal inverse-square
available-light intervals:

$$
\frac{1}{r_i^2}
=
\frac{1}{r_{\min}^2}
-
\frac{i}{N}
\left(
  \frac{1}{r_{\min}^2}-\frac{1}{r_{\max}^2}
\right),
\qquad
r_i
=
\left[
  \frac{1}{r_{\min}^2}
  -
  \frac{i}{N}
  \left(
    \frac{1}{r_{\min}^2}-\frac{1}{r_{\max}^2}
  \right)
\right]^{-1/2},
\quad 0\leq i\leq N.
$$

The source irradiance constant cancels from this construction. Thus a level's
primary controlled variable is its shell count: shells are narrow near the
finite source and progressively wider farther away. Exact query ray length and
boundary classification may truncate the portion of a ray that intersects a
band, but they never deform a band or add a cache row. No atmosphere,
wavelength, direction, or world feature creates a separate radial partition.

The smaller near-source bands do not intentionally contain greater
inverse-square variation. Their underlying variation per meter is greater,
and their width is reduced so that each baseline band has the same absolute
unattenuated available-light change. One light-dependent cached result is held
across each band, so direct light at interior samples generally differs from
the light represented by that result. The separately frozen shell
generation rule uses the arithmetic mean of the two boundary light levels;
exact query geometry does not turn it into query-time light interpolation.

The selected family-wide minimum permitted innermost-shell width is:

$$
w_{\mathrm{inner,min}}=1.5\ \mathrm{m}.
$$

For source case $c$, define:

$$
w_{\mathrm{inner},c}(N)=r_{1,c}(N)-r_{0,c}(N),
\qquad
w_{\mathrm{family}}(N)=\min_c w_{\mathrm{inner},c}(N).
$$

The largest width-valid count is:

$$
N_{\mathrm{width,max}}
=
\max\{N:w_{\mathrm{family}}(N)\geq1.5\ \mathrm{m}\}.
$$

For the currently documented source-case family, the centered case controls
this minimum. It gives `N_width_max = 1,484,977`, whose packed binary64 fact
block is `11,880,984` bytes. The distant-Sun `12,597,120`-byte resident size
is the guide from which this physical floor was selected; it is not a third
scientific terminal condition.

The deciding count sequence is frozen before output and runs in increasing
resolution. Unless an earlier count passes, its final entry is
`N_width_max`. It has exactly two scientific terminal conditions:

1. **Perceptual success:** after a completed count, every required deciding
   sample passes the frozen uncertainty-inclusive human-perception gate.
2. **Minimum width:** no completed count has passed, the last width-valid
   count has completed, and the next count would make
   `w_family < 1.5 m`.

If both conditions are true at the last width-valid count, retain both flags
and close with perceptual success. A failure, cancellation, or interruption
is an incomplete attempt, not a scientific terminal result. The deciding
ladder performs no further counts after perceptual success. “First” means
first in the frozen tested sequence; it means the smallest successful integer
`N` only if the family manifest selects an exhaustive integer sequence or an
explicit bracketing/refinement search that proves that claim.

### Shell-Method Test-Design Principle

The pure inverse-square construction is the required baseline shell method.
A different radial partition or shell-held light rule is a
separately named, predeclared family, not a post-result adjustment. Each family
has its own identity and untouched deciding samples.

Every method uses the same complete selected source-case coverage, including
centered, near-center, production-offset, outer, near-rim, and reflected
configurations. It changes only the declared shell method and its controlled
count $N$. Deciding samples remain radial. Ground, cap, rim, tangent,
source-axis, two-center, and reflection fixtures qualify geometry and response
construction before deciding output; they are not crossed into a second
spatial scoring axis.

The heldout comparison input contains continuous direct available light plus
only the selected fixed direct-primary response bank and E8/E2 projection
required to evaluate the perceptual gate. It is computationally practical,
independent of shell placement, and identical across every level in one
family. It never creates wavelength-, direction-, or around-shell-specific
spatial meshes. Changing the projection, approximation rule, or deciding
samples creates a fresh family.

## Application Profile Handoff

This study reports the shell-count/fact-byte/error tradeoff surface needed to
expose shell count as a possible later tuning lever. It selects no
application profile and does not define application state, controls, feature
overrides, or animation lifecycle.

The canonical application-facing profile and time-animation design is owned
by the
[Flat32 migration inventory](../production/flat32-migration-inventory.md#future-application-cache-quality-profiles-and-feature-policies).
That document owns application state, profile resolution, control
presentation, feature policies, and animation lifecycle. Cache owners
continue to own numerical construction, fingerprinting, and atomic cache
publication.

A future profile label never replaces cache identity. The complete resolved
cache schema and revision, shell family and level, order, domains, controls,
representation, physical owner identities, plan/result identity, and backend
capability record remain source-controller fingerprint inputs, and a changed
cache-relevant value requires a complete build unless separately proven exact
reuse applies.

## Theory And Mathematics Behind The Index And Cache Data

### Downstream Cached Physical Field

Status: downstream context only. These equations describe the complete field
that the selected physical calculation ultimately supplies; they are not the
payload or spatial grid constructed by the current fact characterization.

For physical position $\mathbf{p}$, outgoing direction $\boldsymbol{\omega}$,
and wavelength $\lambda$, the cache approximates cumulative local spectral
scattering density through order $N$:

$$
J_{\leq N}(\mathbf{p},\boldsymbol{\omega},\lambda)
=
\sum_{k=1}^{N}
J_k(\mathbf{p},\boldsymbol{\omega},\lambda).
$$

The pure scattering orders are constructed by the selected recurrence:

$$
\begin{aligned}
J_1 &= \mathcal{P}(\text{source},\text{atmosphere},\text{geometry}), \\
L_1 &= \mathcal{T}_{\mathrm{primary}}
      (\text{source},\text{atmosphere},\text{geometry}), \\
J_k &= \mathcal{S}[L_{k-1}], && 2 \leq k \leq N, \\
L_k &= \mathcal{T}[J_k], && 2 \leq k < N.
\end{aligned}
$$

$\mathcal{P}$ is the local-Sun primary scattering operation,
$\mathcal{T}_{\mathrm{primary}}$ is direct-primary transport,
$\mathcal{S}$ is the selected atmospheric scattering operation, and
$\mathcal{T}$ is stored-field transport. These operations retain the selected
atmosphere, physical boundaries, ground behavior, spectral basis, angular
domains, and construction controls. Only a pure preceding order enters the
next order.

Let $\chi$ identify a smooth geometry-owned direction chart and let:

$$
R_\chi(\mathbf{p})\in SO(3)
$$

map a canonical local cache direction into a physical direction at
$\mathbf{p}$. Define the charted field:

$$
\widetilde{J}_{\leq N}
(\mathbf{p},\widehat{\boldsymbol{\omega}},\lambda)
=
J_{\leq N}
\left(
  \mathbf{p},
  R_\chi(\mathbf{p})\widehat{\boldsymbol{\omega}},
  \lambda
\right).
$$

For a hypothetical downstream position node $\mathbf{p}_i$, canonical W27
coordinate $\widehat{\boldsymbol{\omega}}_d$, and native wavelength
$\lambda_\ell$, the runtime cache payload is:

$$
C_{i d \ell}
=
\widetilde{J}_{\leq N}
(\mathbf{p}_i,\widehat{\boldsymbol{\omega}}_d,\lambda_\ell),
$$

with:

$$
0 \leq d < 4{,}374,
\qquad
0 \leq \ell < 15.
$$

The logical R32F storage address remains:

$$
\operatorname{address}(d,i,\ell)
=
(x=d,\ y=i,\ \text{arrayLayer}=\ell).
$$

For physical query direction $\boldsymbol{\omega}$ at $\mathbf{p}$, geometry
first computes:

$$
\widehat{\boldsymbol{\omega}}
=
R_\chi(\mathbf{p})^{\mathsf T}\boldsymbol{\omega},
$$

then resolves its W27 stencil. Within one smooth chart, position interpolation
holds this canonical direction coordinate fixed; it does not pretend that
the same W27 index denotes one fixed world-space direction at every node.

The current fact design does not select downstream position nodes or their
packed IDs. A later field implementation may consume the factorized facts,
but must define and account for its own field representation. The equations
above establish only the downstream quantity and do not reintroduce a spatial
axis into the current family.

### Exact Query Geometry Inputs (Nonresident)

The coordinates in this section are temporary geometry inputs used to compute
source distance, atmosphere coordinate, ray length, and boundary
classification. They are not cache axes, table dimensions, or resident
records. The two-center derivation is retained to prove that exact query
geometry remains available after the fact tables discard around-shell
position.

#### Geometry-Owned Source-Relative Transform

For every query, geometry performs the semantic transform:

```text
geometryPosition, selectedSourcePosition
    --geometry transform--> sourceRelativePosition

rSun = sourceRelativePosition.distanceFromSource
atmosphereCoordinate = geometry-resolved atmosphere coordinate
rayLength, boundaryClassification = exact geometry query facts

u = inverseSquareCoordinate(rSun)              cache/fact lookup
v = atmosphereLookup(atmosphereCoordinate)     cache/fact lookup
```

The source-relative packet may also carry directions to/from the source and
other geometry-owned facts required by the deterministic calculation.
Geometry separately supplies the exact ray length and physical-boundary
classification. The direct and shell-held projections consume the same
resolved packet, so a coordinate-transform difference cannot be counted as
shell error.

The cache/fact owner begins at the geometry-resolved query packet. It maps
`distanceFromSource` to `u` and the resolved atmosphere coordinate to `v`; it
does not own a model-to-world transform, subtract the finite-source position,
or reconstruct boundary facts from fact-table dimensions. A changed source
or geometry configuration changes the geometry transform and, when it changes
`r_min`, `r_max`, or another retained identity fact, requires a newly
fingerprinted shell layout. The transient transform adds zero resident bytes
to the factorized fact block.

For an in-domain physical position `P`, define:

```text
S3d  = finite Sun position
Sxy  = S3d.horizontal
z    = altitude(P)
rSun = length(P - S3d)
rMap = length(P.horizontal - C)
```

Given the fixed source height, `(z, rSun)` also determines horizontal distance
from the Sun's subpoint. Adding `rMap` distinguishes positions that have equal
source distance but lie under different parts of the map-centered dome.
Together, `(z, rSun, rMap)` carry the same generic two-center information as
the canonical axial/transverse half-domain, up to the selected joint
reflection symmetry.

More formally, let $\mathbf{s}$ be the three-dimensional Sun position,
$\mathbf{c}$ the horizontal map center, and
$\mathbf{p}=(\mathbf{p}_{xy},z)$ an atmospheric sample. Define:

$$
\begin{aligned}
r_s &= \lVert \mathbf{p}-\mathbf{s} \rVert, \\
r_m &= \lVert \mathbf{p}_{xy}-\mathbf{c} \rVert, \\
\rho_s
&=
\lVert\mathbf{p}_{xy}-\mathbf{s}_{xy}\rVert.
\end{aligned}
$$

$r_s$ is full three-dimensional source distance, $r_m$ is horizontal
map-center distance, and $\rho_s$ is horizontal distance from the source
subpoint. Analytically:

$$
\rho_s^2=r_s^2-(z-s_z)^2,
$$

but executable canonicalization computes the horizontal norm directly rather
than obtaining a small $\rho_s$ by subtracting two large squared distances.

Let:

$$
a=\lVert \mathbf{s}_{xy}-\mathbf{c} \rVert.
$$

When $a>0$, choose the horizontal axis from $\mathbf{c}$ toward the source
subpoint. The canonical axial and nonnegative transverse coordinates are then:

$$
\begin{aligned}
x
&=
\frac{r_m^2+a^2-\rho_s^2}{2a}, \\
y
&=
\sqrt{\max(0,r_m^2-x^2)}.
\end{aligned}
$$

This inverse-distance equation is a coordinate-sufficiency proof, not the
preferred runtime canonicalizer. Before using it, a caller must prove:

$$
r_-(z,r_m)\leq r_s\leq r_+(z,r_m),
\qquad
r_m^2-x^2\geq-\epsilon_{\mathrm{roundoff}}.
$$

Only a negative value within the frozen roundoff allowance may be replaced by
zero. A genuinely invalid triple is rejected.

At runtime, when $a>0$, geometry instead projects the known physical position
directly onto the fixed axis and side vectors. That avoids the division by
$2a$ in the proof equation and remains the required path as $a$ becomes
small. Exact $a=0$ uses the rotationally collapsed chart. Binary64/binary32
tests must cover near-coincident centers, source-axis cancellation, and both
sides of every validity boundary.

Thus $(z,r_s,r_m)$ determines the canonical physical position
$(z,x,\lvert y\rvert)$. When $a=0$, source and map centers coincide and the
horizontal domain reduces to the expected rotationally symmetric
$(z,r_m)$ case.

The $\lvert y\rvert$ reduction is valid only when the complete
cache-construction model is invariant under reflection through the vertical
plane containing $\mathbf{c}$ and $\mathbf{s}$. That includes the atmosphere
boundary and medium, ground boundary/profile, source emission and distance
law, and every construction-path participant. Atmosphere symmetry alone is
not sufficient. Likewise, the $a=0$ rotational collapse requires the complete
transport model to be rotationally symmetric. A non-axisymmetric ground,
source, or blocker invalidates the reduction rather than becoming an
unmodeled cache approximation.

Because the selected atmosphere is axisymmetric about $\mathbf{c}$, every
azimuth at fixed valid $(z,r_m)$ is physically in the same boundary slice.
The feasible source-distance interval on that slice is:

$$
\begin{aligned}
r_-(z,r_m)
&=
\sqrt{(z-s_z)^2+(a-r_m)^2}, \\
r_+(z,r_m)
&=
\sqrt{(z-s_z)^2+(a+r_m)^2}.
\end{aligned}
$$

At $a=0$ or $r_m=0$, this interval collapses as required by rotational or
map-center symmetry.

Equal `rSun` does not imply equal final scattering values. In the current
fact-driven design, however, it intentionally implies equal source-light and
shell-boundary facts. Atmosphere facts come from `v`, while exact query ray
length and boundary classification preserve the map-relative integration
extent. The representation therefore does not equate complete final values
merely because it omits an around-shell cache coordinate.

### Baseline Inverse-Square Shell Coordinate

The selected local source evaluates:

$$
r_{\mathrm{safe}}
=
\max(r_s,r_{\mathrm{radius}},\epsilon_d),
$$

and, when distance falloff is enabled:

$$
E(r_s)=\frac{K}{r_{\mathrm{safe}}^2},
$$

where $K$ contains the source's spectral power and squared reference-distance
normalization. This shell design requires a frozen source configuration with:

$$
\text{distanceFalloff}=\mathrm{true},
\qquad
0<r_{\min}<r_{\max},
\qquad
r_{\min}\geq\max(r_{\mathrm{radius}},\epsilon_d).
$$

The complete atmosphere domain is therefore outside the source's radius and
epsilon clamps, so its exact selected source law reduces to
$E(r_s)=K/r_s^2$ without changing the source. If this precondition fails, the
inverse-square coordinate below is not valid; a replacement design must be
derived from the exact clamped source law rather than modifying the clamp or
pretending the plateau is inverse-square.

Define:

$$
A=r_{\min}^{-2}-r_{\max}^{-2},
$$

and the normalized inverse-square coordinate:

$$
u_0(r_s)
=
\frac{r_{\min}^{-2}-r_s^{-2}}
     {r_{\min}^{-2}-r_{\max}^{-2}}
=
\frac{r_{\min}^{-2}-r_s^{-2}}{A}.
$$

$r_{\min}$ and $r_{\max}$ are derived from the selected physical source and
atmosphere domain. They are not artificial ray or cache limits. The mapping
is monotone, with $u_0=0$ at $r_{\min}$ and $u_0=1$ at $r_{\max}$.

For selected atmosphere volume $\mathcal{D}$:

$$
r_{\min}
=
\min_{\mathbf{p}\in\mathcal{D}}
\lVert\mathbf{p}-\mathbf{s}\rVert,
\qquad
r_{\max}
=
\max_{\mathbf{p}\in\mathcal{D}}
\lVert\mathbf{p}-\mathbf{s}\rVert.
$$

Solving the definition for irradiance gives:

$$
E(u_0)
=
K\left(r_{\min}^{-2}-A u_0\right),
$$

and therefore:

$$
\frac{dE}{du_0}=-K A.
$$

Equal increments in $u_0$ consequently represent equal absolute changes in
unattenuated direct irradiance. The corresponding physical sample density is:

$$
\frac{du_0}{dr_s}
=
\frac{2}{A r_s^3}.
$$

Phase 1 tested the frozen increasing count sequence through the first passing
tested count, `N = 2,048`, in run `000234`; accepted closeout `000237`
records the `perceptual-limit-reached` stop. Perceptual accuracy did not alter
the boundaries. The spectral source constant cancels when boundaries are
expressed in $u_0$, so no wavelength-specific radial count is introduced.

This density is high near the source and falls as $r_s^{-3}$. Constant-$u_0$
surfaces are exactly constant-source-distance shells. The inverse-square law
therefore defines the baseline shell geometry and spacing, but it does not by
itself define the full atmospheric scattering field.

### Fixed Radial Bands And Deciding Separation

The inverse-square coordinate is the radial coordinate for the baseline method:

$$
u(r_s)=u_0(r_s).
$$

For a chosen integer shell count \(N\), baseline radial bands are exactly
\(u\in[i/N,(i+1)/N]\), \(0\leq i<N\). Their source-distance boundaries are
the inverse-square boundaries already defined above. No atmosphere-density,
source-path, boundary, wavelength, direction, monitor, or observed field
value may move a boundary, add a radial band, or give one payload component a
different radial partition.

The deciding study constructs and scores no physical-driver vector,
atmosphere-coverage monitor, or `W_D` metric. At each frozen sample it
compares continuous direct available light with `shellHeldLightLevel`. The
fixed spectrum, canonical atmosphere, whole-world geometry, and five ray
roles are evaluated into one normalized direct-primary response bank per
source case. The identical response is scaled by each light level, so those
fixed facts introduce no independent shell approximation error.

The 48-row atmosphere representation remains part of modeled cache resource
accounting only. Its coordinates and lookup are the already selected
production Native-48 contract described below. They do not participate in
the light-only deciding comparison, add local-arc rows, or add
physical-boundary feature rows. The radial band identities remain the exact
\(N\) inverse-square intervals.

The baseline method therefore has a simple testable separation:

$$
\text{radial resolution}=N,\qquad
\text{modeled atmosphere rows}=48,\qquad
\text{physical extent}=\text{exact query ray length}.
$$

If a future attenuation-aware radial deformation is desired, it is a
different shell method and a new characterization family with a fresh
holdout. It is not a correction to this baseline.

### Factorized Base-Fact Tables And Resident-Memory Model

Status: selected spatial dimensionality and provisional executable schema.
The family uses two independent one-dimensional tables. Any `U * V`
materialization or around-shell table is a different representation and fresh
family.

#### Radial Boundary Table

For source case `c` and `N` inverse-square shell intervals, use
`U_c = N + 1` shared radial boundaries derived from that case's physical
`r_min,c` and `r_max,c`:

```text
u_i = i / N, 0 <= i <= N
r_i,c = inverseSquareRadius(r_min,c, r_max,c, u_i)
```

Adjacent intervals share their common boundary. Available source light is a
function of radius, and each shell's inner and outer bounds are adjacent
entries in this one table. The retained radial record is one binary64
`radiusMeters`. Available light is derived exactly from that radius and the
shared reference source spectrum:

```text
incidentScale =
    referenceSpectralIncidentScale
  * (referenceDistanceMeters / radiusMeters)^2
```

Ordinary lookup uses half-open normalized intervals:

```text
0 <= u < 1: shellIndex = floor(N * u)
u = 1:      shellIndex = N - 1
```

An exact internal boundary therefore belongs to the higher-index, farther
shell. Characterization additionally retains both one-sided boundary limits
under distinct `(sourceCase, shellIndex, side)` identities; they share direct
light but intentionally use the held value of their respective shell.

The complete atmosphere domain is outside the source-radius clamp, as required
by this family. Storing another light scalar or 15-value spectrum at each
boundary would duplicate information and is not part of this schema.

The experiment's source cases are alternative cache configurations, not
simultaneously resident sources. It constructs and scores one `U_c` at a
time. Therefore `B_fact(N)` describes one configured cache and is not
multiplied by the source-case count.

#### Atmosphere Table

The selected `V = 48` contract reuses the existing production Native-48
numeric altitude coordinates and actual-neighbor lookup rule. This is not an
open coordinate selection.

For flat geometry, each reused coordinate is interpreted as altitude in
meters above the selected flat ground:

```text
vAltitudeMeters[0] = 2

for 1 <= i < 48:
    vAltitudeMeters[i] =
        ((i + 0.5) / 48) * 60,000
```

The expression retains the existing JavaScript binary64 operation order. It
produces `1,875 m` at index 1 and `59,375 m` at index 47, including the exact
binary64 values already retained by `NATIVE_48_POSITION_NODES`.

Lookup reuses the existing
`linear-actual-neighboring-nodes-v1` rule:

```text
altitude <= vAltitudeMeters[0]:
    one tap at row 0

altitude >= vAltitudeMeters[47]:
    one tap at row 47

altitude exactly equals row i:
    one tap at row i

vAltitudeMeters[i] < altitude < vAltitudeMeters[i + 1]:
    upperWeight =
        (altitude - vAltitudeMeters[i])
      / (vAltitudeMeters[i + 1] - vAltitudeMeters[i])

    rows = [i, i + 1]
    weights = [1 - upperWeight, upperWeight]
```

Thus the selected 100 km flat atmosphere clamps altitude queries above
`59,375 m` to row 47 and queries below `2 m` to row 0. No rescaling to the
flat atmosphere height is implied. The retained construction-only
`retained-legacy-altitude-bin-nearest-v1` rule is not borrowed.

The reused numerical contract is owned by
[`SphericalNativePositionDomain.js`](../../../../src/algorithm32/domains/SphericalNativePositionDomain.js)
and
[`SphericalEarthGeometry.resolveScatteringCachePositionStencil`](../../../../src/algorithm32/geometries/SphericalEarthGeometry.js).
Its existing descriptor identity is `algorithm32-native-48-position-v1` with
content hash
`sha256:4607a46195252a09df23c6b1684921146fcd3a0beaf68ac40da5ce228ae8428e`.
The family manifest must pin those source identities and explicitly record
the flat-altitude semantic adaptation.

These selected rows and lookup do not participate in the light-only
shell-count characterization because the same atmosphere is supplied to both
comparison sides.

This is one global atmosphere table, not 48 rows repeated inside every shell.

Each packed binary64 atmosphere row contains exactly:

```text
coordinate
rayleighDensity
mieDensity
```

The selected canonical profile has zero absorption density. Its native-15
extinction and scattering packets are derived from these two densities and
the one shared atmosphere/spectral owner. They are not copied into every row.

Changing the `V` count, reused coordinates, lookup, flat-altitude semantic
mapping, or packed row schema changes cache identity and requires a fresh
resource model. This light-only output cannot reselect or validate that
already fixed `V` contract. Atmosphere facts are invariant around a shell at
a fixed atmosphere row; local world validity does not create another stored
atmosphere record.

#### No Around-Shell Axis

The current representation has no `s` rows. Around-shell position can change
where a physical query ray meets ground, atmosphere exit, rim, or the
whole-world border, but geometry already expresses that change as an exact
boundary classification and ray length:

```text
rayLength = distance from the query to its first selected physical boundary
```

The eventual calculation integrates the shared shell/light and atmosphere
facts only over that physical length. The direct and shell-held projections
receive the same exact ray length, so it is neither interpolated from shell
nodes nor stored once for each around-shell position.

This distinction also limits the earlier coordinate-sufficiency evidence.
That evidence proves that source distance alone is insufficient for a
complete position-keyed `J` field. It does not prove that an around-shell
axis is needed when the cache stores only invariant base facts and exact
query geometry remains an input to their deterministic calculation. The
current light-only characterization tests only the radial light
approximation; it does not validate the eventual `v` lookup or full combined
cache calculation.

In an eventual implementation, radial and atmosphere lookup are independent.
The deterministic calculation combines their results with exact query
geometry; there is no bilinear position record or four-tap spatial stencil.

#### Resident-Byte Equation

The cache-specific packed binary64 block is:

```text
header:
  schemaRevision: uint32
  shellCount:     uint32                         8 bytes

uRadiusMeters[N + 1]: float64                   8 * (N + 1)

vRows[48]:
  coordinate:       float64
  rayleighDensity:  float64
  mieDensity:       float64                    24 * 48
```

Therefore:

```text
B_fact(N)
  = 8 + 8 * (N + 1) + 24 * 48
  = 8N + 1,168 bytes
```

There is no `U * V` term, row map, feature table, alias table, direction chart,
or resident ray-length table. Exact query geometry is transient. The shared
source spectrum, atmosphere constants, spectral basis, and identity
descriptors remain owned once outside this cache-specific block. Any later
implementation that copies one must add that copy explicitly.

Directly filling the final binary64 arrays requires no table-sized staging
copy, so packed numeric construction peak equals packed resident bytes plus
constant implementation overhead. Experiment result records are offline
evidence, not resident cache memory.

| `N` | `B_fact(N)` |
| ---: | ---: |
| 1 | 1,176 bytes |
| 10 | 1,248 bytes |
| 100 | 1,968 bytes |
| 1,000 | 9,168 bytes |
| 10,000 | 81,168 bytes |

Using the distant-Sun resident-field size `12,597,120` bytes as a comparison
guide:

```text
N_memory_max
  = floor((12,597,120 - 1,168) / 8)
  = 1,574,494
```

At that count the block is exactly `12,597,120` bytes, but the selected
family-wide `1.5 m` floor binds first. The centered controlling case permits
`N_width_max = 1,484,977`, using `11,880,984` bytes and leaving `716,136`
bytes below the guide. The accepted perceptual-success stop occurred at
`N = 2,048`. If the future implementation chooses R32 facts, omits procedurally
generated coordinates, or recomputes densities, that is a separately
accounted representation rather than an undocumented reduction.

For scale only, packing the same records as R32 would give:

```text
B_fact_R32(N) = 8 + 4 * (N + 1) + 12 * 48
                = 4N + 588 bytes

N_memory_max_R32 = 3,149,133
```

R32 is not the deciding precision of the current characterization. If an R32
result and its binary64 staging tables coexist during construction, their
packed numeric peak is `12N + 1,748` bytes; that lifecycle must be selected
and measured by the later implementation.

### Shell-Held Light Calculation And Perceptual Error

The deciding `u` audit verifies every shared boundary radius and its derived
available-light level, then compares continuous direct light at each interior
sample with the one light level used to generate that shell's cached result.
This is the intended shell-count-dependent error.

The selected perception projection is
`fixed-direct-primary-response-bank-v1`, owned in executable detail by the
[shell-cache characterization plan](../experiments/local-sun-shell-cache-experiment-plan.md#selected-fixed-response-perception-projection).
For each source case it evaluates the selected whole-world direct-primary
radiance at `[0, 0, 5] m` under the five retained local-Sun response roles and
the Stage 2 `15`/`15` endpoint-trapezoid controls. Dividing each radiance by
the anchor's positive source light level produces a unit response. Both the
continuous and shell-held light levels scale that same typed radiance
response before the accepted E8 spectral-to-display boundary and E2
`Delta E_ITP` comparison.

The `V = 48` representation is counted in modeled resident bytes without
being queried or scored by this characterization. No physical world position
is paired with each radial sample, and the response anchor's source distance
never replaces the sampled shell radius.

The deciding comparison is:

```text
unitResponse =
    fixedResponseBank[sourceCase][responseRole]

directComparisonValue =
    E2(
        E8(unitResponse * directLightLevel(sampleRadius))
    )

calculatedComparisonValue(N) =
    E2(
        E8(
            unitResponse
          * calculateShellLightLevel(
                adjacentShellRadii,
                lightLevelsDerivedFromThoseRadii
            )
        )
    )
```

Only the difference between continuous direct light and the frozen
shell-generation light level may create `N`-dependent error. Samples at
multiple inverse-square phases across each selected shell and all five fixed
response roles characterize that difference. The strict selected gate is:

```text
observed Delta E ITP
  + 0 reference uncertainty
  + 1.485163121927885e-10 display-transform uncertainty
  < 1
```

This is a potential-indistinguishability result under the fixed response bank
and E2 display conditions, not a universal whole-world or complete-render
perception claim. Raw light-level errors remain part of every retained record.
Query-geometry contexts remain nondeciding qualification fixtures.

## Selected Source Cases And Local-Light Evaluation

The first fact family's source characteristics and light evaluator are reused
directly from the retained local-Sun experiment behavior in
archive-internal `scripts/algorithm32-star/cases/local-sun-basic.js`
and
[`LocalPointSun.js`](../../../../scripts/algorithm32-star/src/model/LocalPointSun.js).
They are not independently reselected by this cache study. The fixed
characteristics retain the Flat32 native-15 production irradiance,
`referenceDistance = 4,800,000 m`, reference spectral scale `1`,
`radius = 25,749.504 m`, and enabled inverse-square distance falloff. The
source height is `4,800,000 m`; the selected whole-world map center is
`C = [0, 0] m` and its radius is `R = 20,015,114.442035925 m`.

For sample position `P` and case-specific source origin `S`, the reused
evaluator computes:

```text
toSource = S - P
distanceFromSource = length(toSource)
safeDistance = max(radius, distanceFromSource, Number.EPSILON)
sourceTerm =
    referenceSourceSpectrum
  * referenceSpectralScale
  * (referenceDistance / safeDistance)^2
```

The source origin is the only source-owned fact that varies between cases.
The selected initial cases vary its horizontal offset `a` while retaining the
fixed source height. Their source positions are `[a, 0, 4,800,000] m`:

| `sourceCaseId` | `a` (m) | Coverage intent |
| --- | ---: | --- |
| `centered` | `0` | Rotationally collapsed source/map-center case. |
| `near-center-east-1m` | `1` | Nonzero near-coincident center. |
| `near-center-west-1m` | `-1` | Reflection partner of the near-coincident case. |
| `production-east-4800km` | `4,800,000` | Current Flat32/retained-Star nominal local-Sun placement. |
| `production-west-4800km` | `-4,800,000` | Reflection partner of the nominal placement. |
| `outer-east-16000km` | `16,000,000` | Strong off-center in-world configuration. |
| `outer-west-16000km` | `-16,000,000` | Reflection partner of the strong off-center configuration. |
| `rim-near-east` | `19,915,114.442035925` (`R - 100,000`) | High-asymmetry source subpoint near, but not on, the rim. |
| `rim-near-west` | `-19,915,114.442035925` (`-(R - 100,000)`) | Reflection partner of the rim-near configuration. |

Every noncentered case has an explicit east/west mirror. Each response-bank
pair is compared under the declared joint source-and-response-direction
reflection, not merely by comparing untransformed scalar positions. Complete
ground/cap/rim/tangent/source-axis/two-center geometry coverage remains in the
nondeciding harness qualification. A ground-to-cap vertical slice may remain
a focused diagnostic, but it is not a resident or deciding dimension.

For the retained source height and the selected 100 km atmosphere apex, the
minimum atmosphere-to-source distance is `4,700,000 m`; it is therefore well
outside the `25,749.504 m` source-radius clamp. Step 1 content-pins the
binary64 evaluator and this clamp proof. Binary32 feature classification is
deferred to a later implementation study and is not an input choice for this
binary64 characterization.

Step 1 has content-pinned the fixed source characteristics, evaluator,
enumerated origins, analytic case matrix, and clamp-proof record in the
active family manifest. This remains identity and provenance evidence rather
than another decision about how available light is calculated.

## Frozen Manifest Contract

The scientific inputs below are encoded and content-pinned by
`base-fact-family-v1`. Step 2 accepted them in run `000222`; Step 3 completed
the frozen deciding matrix one count per immutable run and reached its first
passing tested count at `N = 2,048` in run `000234`:

- the enumerated source origins, physical `r_min`/`r_max`,
  geometry-to-source-relative transform, and source-clamp proof; the fixed
  source characteristics and evaluator above require content pinning rather
  than further selection;
- the packed `u` and `v` fact schemas, which values are analytic, the complete
  resident-byte equation, construction-peak equation, and distant-Sun sizing
  comparison; the already selected Native-48 coordinates, adjacent lookup,
  descriptor hash, and flat-altitude interpretation require content pinning,
  not further selection;
- the selected arithmetic-mean shell-generation light-level rule as a
  content-pinned manifest input;
- the geometry-owned source-relative query packet and exact ray-length and
  ground/cap/rim/world-exit contracts used by qualification and normalized
  response construction;
- `fixed-direct-primary-response-bank-v1`, including the `[0, 0, 5] m`
  anchor, five reflected response roles, selected whole-world `15`/`15`
  transport, E8 projection, E2 display conditions, zero reference
  uncertainty, `1.485163121927885e-10` display-transform uncertainty, and
  strict `totalDelta < 1` gate;
- the exact radial generator, integer uniform-index rule, semantic
  deduplication, response-role cross-product, stable identities, qualification
  fixtures, untouched deciding set, and `41,670` per-count workload bound;
- the selected `w_inner_min = 1.5 m`, family-wide width calculation, derived
  `N_width_max`, increasing count order, the two scientific terminal
  conditions, per-count record, and final-five summary rule; and
- the fresh fact-only family identity, complete source/input closure,
  immutable run sequence, and terminal disposition.

No deciding physical characterization output existed before the accepted Step
2 harness qualification. Step 3 completed without changing these
content-addressed inputs: runs through `N = 1,024` are complete rejected
characterizations, and `N = 2,048` is the first passing tested count. Accepted
closeout run `000237` verifies the complete lineage and claim boundary.

The exact Native-48 coordinates, clamped actual-neighbor linear lookup, and
flat-altitude interpretation above are selected, content-pinned inputs. They
remain outside the light-only deciding calculation.

The selected perceptual rule and sample matrix are specified by the active
plan and frozen manifest; their exact values are not left to runner
discretion. The derived `r_min`/`r_max`, source hashes, encoded manifest, and
validation runner are retained Step 1 provenance. The distant-Sun resident
size is a comparison guide, not an additional stopping condition.

Application profile resolution is downstream of the fact characterization. Its
separate state, lifecycle, fingerprint handoff, evidence, and feature-policy
prerequisites are owned by the
[Flat32 application design](../production/flat32-migration-inventory.md#future-application-cache-quality-profiles-and-feature-policies)
and are not executable-study inputs here.

## Ownership And Promotion Boundary

This document is the canonical design owner for the scattering-aligned
local-Sun shell index and the characterization outputs that may expose its
shell count as a later tuning lever. The
[Flat32 application design](../production/flat32-migration-inventory.md#future-application-cache-quality-profiles-and-feature-policies)
owns profile registry, resolution, controls, and feature lifecycle. The
[local-Sun shell-cache characterization plan](../experiments/local-sun-shell-cache-experiment-plan.md)
owns the new family's execution sequence, freeze boundaries, and immutable
evidence. The
[flat-world boundary decision](../experiments/flat-world-atmosphere-boundary-decision.md)
owns the selected physical dome input. The
[selected cache contract](cache-contract.md) owns the field quantity,
recurrence, spectral and directional domains, and shared runtime contract.

The selected production flat/local cache remains unchanged. Promotion would
require an accepted independent numerical study, CPU/GPU conformance, complete
resource and lifecycle evidence, application cases, the required architecture
authority amendment, and an explicit production decision.
