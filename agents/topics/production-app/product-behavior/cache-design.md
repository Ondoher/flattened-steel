# Algorithm32 Cache Interface Design

Focus: Selected controls and explicit product backlog.

Related owners: [caches](../../production-algorithm32/caches/cache-design.md), [engineering-studies](../../poc-experiments/engineering-studies/cache-design.md), [architecture-contracts](../../production-algorithm32/architecture-contracts/cache-design.md).

## Deferred Follow-Up: Source-Relative Animation And In-Setup Reconfiguration

Status: deferred mandatory MVP follow-up. This work is intentionally later
than the current construction-time implementation, but Algorithm32 MVP cannot
close until it is implemented and qualified. Resume it at production Stage 14
with an explicit cache-transform investigation.

The future MVP stage must animate both supported source/geometry families
without constructing a complete replacement facade and scene for every clock
tick. Its enabling problem is a cache transform or equivalent reusable cache
parameterization that preserves the accepted physical result across supported
time/location changes.

A finite local source approaches a distant source as direction variation,
inverse-square variation, and angular extent across the atmosphere approach
zero. That mathematical limit motivates a later comparison, but does not prove
the two sources share one cache tensor. The active distant plan selects no
local coordinate family; local source state, layout, and residency require a
separate design after distant qualification.

The current application transaction is too broad for source-only
configuration changes. A change within one supported geometry/source pairing
should retain the active composer, GPU backend, executor, compiled cache
programs, and final-view program. When a physical cache input changes, the
same setup should build candidate fields through the retained infrastructure,
preflight their bindings, atomically replace the active cache and uniforms,
then dispose the replaced fields. Failure or supersession must preserve the
published configuration. Pairing, backend-capability, or incompatible
layout/schema changes may still require setup replacement.

The flat/local reuse hypothesis is:

- source height, radius, radiometry, atmosphere, and omitted or horizontally
  uniform ground remain fixed;
- horizontal source translation and bearing are represented by the existing
  source-subpoint-relative `z`/`rho` coordinates and radial/tangent frame;
- one fixed radial domain covers the intended animation trajectory; and
- final-view source position, source subpoint, lighting, and lookup
  coordinates become updateable bindings rather than cache-program identity.

Under those conditions, apparent source elevation changes by sampling a new
`rho`; horizontal translation should not by itself invalidate the cache.
This is a hypothesis requiring direct comparison with independently rebuilt
caches before the reuse-key policy changes. Domain coverage and the
resolution cost of spreading 15 radial nodes over a complete trajectory must
be decided explicitly.

The spherical/distant numerical replacement is owned by the
[distant-Sun solar-zenith scene-cache design](../../production-algorithm32/caches/solar-zenith-cache-design.md).
It selects one point-local cumulative-density Native15 cache per scene,
addressed by altitude, actual local solar zenith, and complete local
source-relative outgoing direction. Geometry retains ray termination and
Algorithm32 retains live path sampling. The
[distant-Sun plan](../../../../archives/topics/topic-consolidation-20260906/agents/topics/algorithm32/cache/distant-sun-solar-zenith-cache-plan.md) owns the contained
phase gates, offline compiler, packed scene residency, and qualification. This
interface document retains only compatible program reuse, loading,
active/staging publication, failure preservation, and disposal mechanics; it
does not independently select the spherical field, local-Sun layout, or a
two-page assumption.

When resumed, the work must:

1. prove the flat translation/rotation and spherical azimuth invariants and
   publish an exact rebuild/non-rebuild matrix;
2. separate compiled program identity from build-specific bindings and retain
   setup infrastructure across compatible configuration updates;
3. select fixed animation-domain coverage without silently weakening spatial
   resolution;
4. compare retained-cache output against independent full rebuilds at
   representative source positions, including near-horizon cases;
5. expose compile, GPU execution, browser-yield, preflight, and publication
   timings plus an observable no-rebuild animation path; and
6. treat animated direct lighting and the six 4096-pixel shadow maps as a
   separate performance problem rather than folding them into atmospheric
   cache identity.

This note changes no accepted direct contract, reuse key, cache domain,
lifecycle, or runtime behavior. The current implementation remains the
authority until a separately planned and evidenced promotion is approved.
