# Step 6 Live Distant-Sun Composition Reconciliation

Status: Step 6 is complete. This document records the accepted distant-Sun
live-consumer behavior, its current production ownership, and the exact
live-composition contracts selected by Step 6.2 and implemented through Step
6.10 of the
[Production Integration API Plan](production-integration-api-plan.md).

## Scope

Step 6.1 is a read-only reconciliation. It changes no production shader,
cache, runtime, or application behavior. It selects the production owner for:

- live pixel and sub-pixel ray reconstruction;
- uniform Sun-disk membership and coverage;
- the geometry-owned distant-Sun query stencil;
- one lookup of the completed Step 5 celestial field per supported sample;
- scene visibility evaluated at the matching sample texel;
- accumulation into `celestialRadiance`;
- one `preDisplayRadiance = pathRadiance + celestialRadiance` composition;
- the Color input after composition; and
- camera, viewport, scene, placement, and cache refresh boundaries.

It does not reopen the atmospheric scattering algorithm, change the Step 5
field, introduce stars or the Flat finite Sun, or promote a candidate frame
evaluator.

## Evidence Reviewed

The qualified behavioral evidence is:

- immutable run `000046-g7-live-gpu-consumption-proof`, accepted 6/6, which
  assembled the cache lookup, four-sample live Sun raster, matched scene-hit
  visibility, and pre-display composition in real WebGL2;
- immutable run `000048-g7-visual-capture-proof`, accepted 5/5, which retained
  clear, partial, blocked, horizon, and out-of-domain captures; and
- immutable run `000064-g7-three-atmosphere-integration`, which proved the
  ordinary Algorithm32 facade, ShaderBuilder, EffectComposer, atmospheric
  cache, and distinct celestial binding could operate in one installed path.

Those runs are behavioral evidence only. Their candidate source, harnesses,
generated output, FNV identities, diagnostic scaling, and sidecar evaluators
are not production dependencies or implementation authorities.

The current production seams inspected for reconciliation are:

- `SphericalGeometryShaderContributor`, which already reconstructs model-space
  rays from the live inverse projection/view matrices and camera position;
- `SphericalCelestialContributionDomain`, which owns support classification,
  the 13 by 11 domain, receiver and direction stencils, and the immutable
  query packet;
- `DistantSunLightSource`, which owns the source direction, angular radius,
  uniform surface radiance, and source identity;
- `DistantSunCelestialCacheResource`, which already owns the completed
  `R32F` field binding and two-by-two lookup function;
- `ShaderAssemblyPreparer` and the deterministic assembler, which already
  declare conditional celestial state and the celestial lookup, evaluation,
  and composition slots;
- the Three rendering runtime, which already supplies live camera matrices,
  viewport size, and the captured scene-hit texture; and
- `Algorithm32Transport` and `BrunetonColorDisplayModel`, which currently
  produce and consume `pathRadiance` without live celestial composition.

## Selected Production Flow

```text
live camera matrices + viewport
  -> spherical geometry reconstructs four ordered sub-pixel model rays

configured distant Sun
  -> source-owned center direction and angular radius

construction-time spherical query packet
  -> one validated receiver/Sun-center celestial stencil

completed Step 5 resource
  -> one transported-radiance lookup for each supported, visible sub-sample

matching live scene-hit texels + Sun-disk membership
  -> celestialRadiance

unchanged ordinary Algorithm32 transport
  -> pathRadiance

exactly one spectral addition
  -> preDisplayRadiance = pathRadiance + celestialRadiance

Color
  -> the sole spectral-to-display conversion
```

The cache contains source-to-receiver transported Sun radiance. The live
consumer must not apply atmospheric transmittance again. Its four equal sample
weights are disk/pixel coverage estimates, not another radiometric transport
term.

## Port, Adapt, Reject, And Defer Map

| Qualified or current mechanism                                                                                                     | Disposition                                               | Production owner                                                                                             | Required production treatment                                                                                                                                                                                                                                                                                                                              |
| ---------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Four ordered offsets `(-0.25,-0.25)`, `(0.25,-0.25)`, `(-0.25,0.25)`, `(0.25,0.25)` with weight `0.25`                             | Port as the initial fixed raster policy                   | Feature-private distant-Sun live-raster contribution under `implementation/distant-sun/celestial/`           | Keep the policy immutable and non-public for this tranche. It estimates per-pixel uniform-disk coverage and performs no cache construction.                                                                                                                                                                                                                |
| Candidate `reconstructViewRay(sampleUv)`                                                                                           | Reuse current production behavior                         | `SphericalGeometryShaderContributor`                                                                         | Invoke the existing geometry function for each ordered sample. Do not copy the candidate geometry implementation or introduce renderer coordinate math in the Sun/cache feature.                                                                                                                                                                           |
| Live inverse projection/view matrices, camera position, and viewport                                                               | Reuse                                                     | Existing React/Three bindings and rendering runtime                                                          | Refresh through the current live-uniform path. Camera, projection, FOV, pixel ratio, and resize do not enter celestial field identity or trigger a cache rebuild.                                                                                                                                                                                          |
| Candidate direction-to-Sun evaluation at the sample receiver                                                                       | Reuse current authority                                   | `DistantSunLightSource` shader contribution                                                                  | Use the existing configured atmospheric source direction function. Do not create a second Sun direction, placement adapter, or caller-provided direction.                                                                                                                                                                                                  |
| Uniform-disk cosine membership test using the apparent angular radius                                                              | Adapt                                                     | Angular radius remains owned by `DistantSunLightSource`; the distant-Sun live-raster contribution applies it | Bind or assemble the accepted source-owned radius through a typed setup seam. Apply membership once per reconstructed sample ray.                                                                                                                                                                                                                          |
| Candidate per-sample `resolveCelestialCacheStencil()` search                                                                       | Replace with the production query packet                  | `SphericalCelestialContributionDomain` creates the stencil; ShaderBuilder retains it for enabled assembly    | All four rays share one receiver and one Sun-center direction, so the stencil is identical for all four samples. Publish the already validated receiver/direction indices, weights, and classification rather than repeating node searches in every fragment and sample. Ground-horizon or out-of-domain classifications produce exact zero before lookup. |
| Candidate primary-cache bilinear lookup                                                                                            | Reuse the completed Step 5 implementation                 | `DistantSunCelestialCacheResource`                                                                           | Keep `sampleDistantSunCelestialRadiance(CelestialCacheBilinearStencil)` and the sole `cache.celestial.sunTransport` binding unchanged. Sample only after disk, domain, and visibility acceptance.                                                                                                                                                          |
| Candidate scene-hit lookup at `floor(sampleUv * viewport)`                                                                         | Adapt through the current runtime                         | Three `SceneInputCapture` and the distant-Sun live-raster contribution                                       | Read the scene-hit texel corresponding to the same UV used to reconstruct each Sun sample ray. A hit suppresses only that celestial sub-sample. It does not shorten, replace, or erase ordinary `pathRadiance`.                                                                                                                                            |
| Accumulation into `state.celestialRadiance`                                                                                        | Port                                                      | Feature-private distant-Sun live-raster contribution                                                         | Add each accepted cache result exactly once with its one coverage weight. Unsupported or blocked samples add exact zero.                                                                                                                                                                                                                                   |
| Candidate `CelestialSpectralComposer` one-method class                                                                             | Adapt behavior; reject the class and default export       | Existing `Algorithm32Transport` and `ShaderAssemblyPreparer`, using shared non-public composition vocabulary | Emit exactly one composition hook after ordinary transport and celestial evaluation. No sidecar composer, aggregate cache owner, or second renderer is introduced.                                                                                                                                                                                         |
| Candidate transport assignment of both `pathRadiance` and `preDisplayRadiance`                                                     | Adapt                                                     | `Algorithm32Transport`                                                                                       | Preserve the current `pathRadiance` calculation byte-for-byte. When celestial sources are enabled, complete `preDisplayRadiance` only through the selected one-addition route; do not create two initializers or two compositions.                                                                                                                         |
| Candidate Color conversion of `preDisplayRadiance`                                                                                 | Adapt conditionally                                       | `BrunetonColorDisplayModel`                                                                                  | Enabled celestial assembly converts `preDisplayRadiance`; null-roster assembly retains the existing `pathRadiance` source exactly. Color remains unaware of source, cache, disk, stencil, and visibility semantics.                                                                                                                                        |
| Conditional `celestialRadiance` and `preDisplayRadiance` state members                                                             | Reuse                                                     | `ShaderAssemblyPreparer`                                                                                     | The declarations and exact-zero initialization already exist for enabled rosters and remain absent for a null roster.                                                                                                                                                                                                                                      |
| Celestial lookup/evaluation/composition assembly slots                                                                             | Reuse and complete                                        | `Algorithm32ShaderAssembler` and `ShaderAssemblyPreparer`                                                    | Preserve deterministic slot order. Enabled automatic assembly must require the live evaluation and composition symbols; null-roster required symbols and source remain exact.                                                                                                                                                                              |
| Camera-, viewport-, and scene-only changes                                                                                         | Reuse without field replacement                           | Three runtime                                                                                                | Refresh bindings and capture state only. These changes never rebuild the Step 5 celestial or scattering caches.                                                                                                                                                                                                                                            |
| Time, location, receiver geography, or source placement changes                                                                    | Preserve the current construction-time replacement policy | Algorithm32/application replacement transaction                                                              | This tranche adds no in-place celestial update API. Such a change constructs and atomically installs the successor configured model, query packet, shader, and required caches under the existing contract.                                                                                                                                                |
| Candidate `CelestialFrameEvaluator`                                                                                                | Reject from production                                    | No runtime owner                                                                                             | A fresh private CPU oracle may be authored only for focused production proof. It is not a facade method, ShaderBuilder participant, export, or parallel renderer.                                                                                                                                                                                          |
| Candidate aggregate celestial controller, `Primary` naming, FNV runtime identity, diagnostic irradiance scale, and browser harness | Reject                                                    | No production owner                                                                                          | Retain the current source-family resource/controller, SHA-256 identities, ordinary Color behavior, and standard runtime route.                                                                                                                                                                                                                             |
| Stars, point projection/solid angle, Flat finite Sun, live Earth rotation, context restoration, and HDR adaptation                 | Defer                                                     | Steps 7 through 10 or their owning follow-up                                                                 | Step 6 ports only the qualified spherical distant uniform Sun normal path.                                                                                                                                                                                                                                                                                 |

## Current Readiness And Missing Seams

Already ready and not to be recreated:

- conditional celestial state declarations and zero initialization;
- deterministic `sampleCelestialCache`, `evaluateCelestialRadiance`, and
  `composeSpectralRadiance` slot order;
- spherical view-ray reconstruction and live matrix bindings;
- scene-hit capture, texture installation, viewport binding, and render-time
  uniform refresh;
- source-owned direction and apparent angular radius;
- the CPU-resolved query packet and exact classification;
- the resident Step 5 field, its opaque binding, and its bilinear lookup; and
- the unchanged atmospheric `pathRadiance` route.

Step 6.2 selected the exact typed shape for these formerly missing seams:

1. retaining the enabled query packet or its exact Sun stencil in the shader
   build context instead of discarding it after cache construction;
2. a geometry-owned shader representation of that validated stencil and
   exact-zero classification;
3. a feature-private distant-Sun live-raster contribution that receives only
   trusted model/resource/query facts;
4. the source-owned angular-radius setup value without arbitrary caller data;
5. enabled automatic-assembly required symbols for celestial evaluation and
   one composition;
6. the one conditional transport/composition hook; and
7. the Color input selection that leaves null-roster source exact.

## Exact Contracts Selected In Step 6.2

Step 6.2 adds no live raster or composition behavior. It establishes these
typed seams for the implementation groups that follow:

1. `ShaderBuildContext.celestialQueryPacket` retains either the one complete
   geometry-derived packet used by the enabled build or `null`. The empty and
   null-roster contexts always carry `null`. The packet is not public runtime
   state and is not added to the published shader result.
2. `CelestialCacheShaderContributionRequest` is the generic
   `ShaderContributionRequest` plus exactly one trusted `queryPacket`.
   `CelestialGeometryCapability.createCelestialCacheShaderContribution()` now
   accepts that narrower request.
3. `DistantSunCelestialLiveShaderContributionRequest` extends the geometry
   request with exactly the configured `DistantSunCelestialCacheSource`.
   Consequently, the future live consumer obtains angular radius and source
   identity only from the configured source and obtains stencil facts only
   from geometry. It accepts no caller-authored radius, direction, indices,
   weights, camera, viewport, scene texture, cache binding, or executable
   shader plan.
4. Camera matrices, camera position, viewport size, and scene-hit texture
   remain existing live renderer bindings. They are deliberately absent from
   the setup-time requests above and from celestial resource identity.
5. The existing `sampleCelestialCache`, `evaluateCelestialRadiance`, and
   `composeSpectralRadiance` slots remain the sole lookup, evaluation, and
   composition routes. No additional slot, alternate state field, or
   aggregate contribution contract is introduced.
6. Enabled required-symbol selection will be owned by
   `ShaderAssemblyPreparer`; the one composition implementation remains owned
   by `Algorithm32Transport`. Both already receive the configured model, so no
   second configuration or boolean mode parameter is introduced.
7. Color continues to receive the ordinary `ShaderContributionRequest` and
   selects its spectral input from the profile-owned roster. This is enough to
   use `preDisplayRadiance` only for enabled assembly while leaving the
   null-roster shader source exact; no celestial-aware Color API is added.

ShaderBuilder retains the query packet after constructing the Step 5 resource
and passes that exact object into the geometry contribution request. Assembly
rejects an enabled distant-Sun resource with no matching query packet. The
geometry publishes its validated stencil and per-subray spherical
ground/horizon support; the resource consumes those facts without repeating a
domain search.

The exact method/module implementation split inside
`implementation/distant-sun/celestial/` remains an implementation-detail
choice for 6.3 and 6.4. It must use the selected request and may not move
responsibilities across the established owners or change the qualified
four-sample policy.

Groups 6.3 through 6.9 implement the selected behavior without changing the
atmospheric algorithm. The distant-Sun resource reconstructs the four fixed
ordered sample rays, rejects off-frame and unsupported samples, applies the
source-owned disk radius, reads the matching scene-hit texel, performs one
completed-field lookup for each accepted sample, and accumulates its one
quarter weight only into `celestialRadiance`. `Algorithm32Transport` owns the
single addition into `preDisplayRadiance`; Color remains the sole display
conversion owner and uses the new value only for an enabled roster. Camera,
FOV, viewport, and scene changes refresh live state without replacing either
resident cache.

Final verification passed:

- Algorithm32 type checking;
- all 526 production Node specs;
- all 11 real Three/WebGL specs; and
- the focused live matrix's independent CPU coverage comparison, with maximum
  residual `0.0000016689300537109375`, full/partial/empty and horizon-clipped
  coverage, partial/full scene blocking, off-frame zero, live FOV/viewport
  refresh, and positive path radiance under full celestial blocking.

Step 6.10 is complete. The complete 17-condition production GPU B1 result is
unchanged at aggregate RMSE `11.820392` mW m^-2 sr^-1 nm^-1. The subsequent
Sun-disk appearance work changes only Color's global display boundary; it does
not reopen this step's cache, composition, or atmospheric contracts. Color
writes Bruneton's Figure-1 exponential result directly; the attempted extra
sRGB transfer was rejected. Global exposure/highlight acceptance remains open.

## Step 6.1 Conclusion

The accepted normal path is compatible with current production without an
atmospheric algorithm change or celestial cache redesign. The production delta
retains the existing query stencil for assembly, adds the fixed live Sun
consumer and matched visibility, composes once before Color, and proves the
enabled/null paths. Steps 6.1 through 6.10 are complete.
