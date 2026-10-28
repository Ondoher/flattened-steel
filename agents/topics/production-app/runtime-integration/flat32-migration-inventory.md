# `flat32` Stage 11 Migration Inventory

Focus: Application attachment, lifecycle, state, and asset delivery.

Related owners: [product-behavior](../product-behavior/flat32-migration-inventory.md).

Scope: this inventory describes the Flat32 integration test bed and its earlier
Stage 11 migration. The [application roles](../README.md#application-roles-and-current-status)
own the distinction from the finished deployable app. Existing owner maps and
verification do not prescribe the finished application's source structure.

## Source And Local Baseline

The application-behavior source inspected for this inventory is:

- `C:\dev\poly-gc-react\src\flat32\index.js`;
- 94,661 bytes and 2,945 lines; and
- SHA-256
  `c58f9050a077567dbc7c2fb6e14f0538a0dabbce18dc2b626a51cacd6e90ca35`.

That file is an import-time monolith. It owns DOM creation, Three setup,
Algorithm32 configuration and attachment, both supported atmospheric modes,
mode and camera state, location and time controls, scene objects, diagnostics,
performance tooling, the render loop, and partial cleanup.

The local `src/flat32` baseline during the read-only 11.1 inspection was the
migration stub:

- `index.js` starts the Polylith registry;
- `spec.js` imports the Polylith test entry;
- `templates/index.html` supplies `#main-content`; and
- `README.md` records the replacement boundary.

That stub has now been replaced by the runnable Stage 11 application. The
active entry composes focused view, scene, direct-render, mode, and Algorithm32
runtime owners. Its Three renderer fills the host viewport at the browser
device-pixel ratio. It renders the source application's matte ground and six
review-object shapes with the complete initial flat/local Three light topology:
one ambient light, six per-review-object source directionals, and all six
directional targets. It also retains the matching six isolated
4096-by-4096 PCF-soft shadow maps through the exact recast focus points and
orthographic cameras, six review-object caster layers, and the ground receiver.
It owns context/frame and cleanup behavior, retains direct rendering throughout
atmosphere setup, and installs a full-domain ordinary-N4 spherical/distant
Algorithm32 pass only after a real composed-frame preflight.


## Dependency And Build Inventory

### Direct imports

| Source dependency                                          | Observed use                                                                 | Migration disposition                                                                                                                     |
| ---------------------------------------------------------- | ---------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| `three`                                                    | Renderer, scene, camera, materials, geometry, lights, math, and disposal     | Retain from this repository's installed `three` dependency.                                                                               |
| `PointerLockControls`                                      | Mouse-look interaction                                                       | Migrate in 11.4, not in the first slice.                                                                                                  |
| `EffectComposer` and `RenderPass`                          | Solid-scene pass followed by Algorithm32 composition                         | Retain from local Three examples; `ThreeSceneRuntime` creates them lazily for the Stage 11.2 attachment while preserving direct fallback. |
| Eleven modules under `../../shared/algorithm32/production` | The former Algorithm32 facade, owners, constants, profiles, and synchronizer | Do not migrate or import. Adapt the application directly to `src/algorithm32`.                                                            |
| `PocStars.js`                                              | Only supplies the magnitude range used by synthetic-star diagnostics         | Defer with the synthetic-star work to Stage 12. It is not an 11.2 dependency.                                                             |

The old application imports no image, model, shader, JSON, or generated
artifact and performs no runtime `fetch` or dynamic import. Its first slice
therefore needs no migrated asset tree.

At inventory time, the old and local `builds/flat32.json` files were
byte-identical, with SHA-256
`21307ee5a63634d80920cad9014535330aef78318f2113006a468ab0366f54a7`.
The local build now additionally owns the focused browser test group and the
`assets/css` stylesheet copy path. The two HTML templates remain equivalent.
No build file resolves through the source repository.

`npm run build:flat32` first removes only the generated `dist/flat32` and
`tests/flat32` trees through the repository-local cleaner. This prevents old
atmosphere/composer chunks from surviving a scene-only rebuild; both
directories are regenerated outputs and are excluded from Git.

The old `spec.js` contains only `import '@polylith/tests'`; it is not
application-behavior or browser-render evidence by itself. The local Polylith
test group now bundles the observable application spec, and the focused
Karma/Chrome lane runs that generated bundle against the built application.

### Engine adaptation boundary

The former engine imports are behavioral clues, not migration inputs. The
application must use the current:

- `Algorithm32`;
- `CanonicalAtmosphere`;
- `SphericalEarthGeometry` and, beginning in 11.3, `FlatEarthGeometry`;
- `DistantSunLightSource` and, beginning in 11.3,
  `LocalSunLightSource`;
- native production profile and unit-bearing quantities;
- `BrunetonColorDisplayModel`;
- `ThreeCacheBackend`;
- the composer read-buffer scene-color binding; and
- source-owned GPU cache controller and runtime sampler.

Do not translate the former config at runtime. In particular, the former
scalar unit-suffixed fields, quality-profile controls, hand-selected local
cache bins, and old shader-setup request are not current contracts.


## Destination Owner Map

Create an owner only when its vertical increment begins. The target ownership
is nevertheless fixed before migration. Owners now exist for the entry,
application, view, Three runtime, endpoint scene, lighting, Algorithm32
runtime, both supported modes, transactional mode switching, pointer-look,
location/time state, constants, type-check support, CSS, and browser lanes.
The proposed `ReviewSceneContent` extraction remains absent pending the 11.6
ownership reconciliation. The temporary `MatteEndpointTexture` owner was
deleted when the Star compositor was restored.

| Target file                                               |               First stage | Sole responsibility                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| --------------------------------------------------------- | ------------------------: | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `src/flat32/index.js`                                     |                      11.2 | Thin Polylith/startup composition entry; no application algorithms or scene helpers.                                                                                                                                                                                                                                                                                                                                                                                                             |
| `src/flat32/Flat32Application.js`                         |                      11.2 | Top-level start, owner composition, setup state, failure routing, and reverse-order disposal. Exports only `Flat32Application`.                                                                                                                                                                                                                                                                                                                                                                  |
| `src/flat32/Flat32View.js`                                |                      11.2 | DOM shell, canvas access, progress/ready/error presentation, and later control presentation. Exports only `Flat32View`.                                                                                                                                                                                                                                                                                                                                                                          |
| `src/flat32/ThreeSceneRuntime.js`                         | scene checkpoint and 11.2 | Host-sized renderer, scene, camera, direct fallback, lazy composer/base pass, source shadow-map policy and capability gate, frame/context/resize listeners, render-operation replacement, and Three disposal. Exports only `ThreeSceneRuntime`.                                                                                                                                                                                                                                                  |
| `src/flat32/Algorithm32Runtime.js`                        |                      11.2 | Current facade/backend setup, live bindings, installed-handle publication, cancellation, and engine-resource disposal. Exports only `Algorithm32Runtime`.                                                                                                                                                                                                                                                                                                                                        |
| `src/flat32/SphericalDistantMode.js`                      |                      11.2 | Fixed native-production spherical geometry and distant-Sun config/description. Exports only `SphericalDistantMode`.                                                                                                                                                                                                                                                                                                                                                                              |
| `src/flat32/EndpointScene.js`                             |          scene checkpoint | Matte ground/review-object composition, fixed caster/receiver layers, installation, observable scene facts, and object/material/geometry disposal. Exports only `EndpointScene`.                                                                                                                                                                                                                                                                                                                 |
| `src/flat32/LocalSunSceneLighting.js`                     |          scene checkpoint | Recast the source application's initial one-ambient/six-directional light topology, targets, exact shadow focuses/cameras, and per-light map policy; report aggregate observable facts; and dispose owned lights/maps. It does not own atmosphere transport. Exports only `LocalSunSceneLighting`.                                                                                                                                                                                               |
| `src/flat32/ModeController.js`                            |                      11.3 | Supported-pair selection and prepare/publish/rollback lifecycle. Exports only `ModeController`.                                                                                                                                                                                                                                                                                                                                                                                                  |
| `src/flat32/FlatLocalMode.js`                             |                      11.3 | Complete production flat geometry/local-Sun config/description using the selected 100 km, scaled 19-by-15 / paired-Fibonacci-34 / W27 / native-15 realization and ordinary N4 request. Each control-derived candidate preserves the physical Sun and scales the 15 radial fractions to at least the observer's source-subpoint rho, with 4.8 Mm as the minimum. Only the measured 4.8 Mm realization is convergence-qualified. Exports only `FlatLocalMode`.                                     |
| `src/flat32/PointerLookController.js`                     |                      11.4 | Implemented first independent interaction slice: pointer-lock listeners, migrated look sensitivity/polar bounds, camera rotation, lock-state reporting, and cleanup. Supported-mode pose persistence remains with the later mode controller. Exports only `PointerLookController`.                                                                                                                                                                                                               |
| `src/flat32/LocationTimeController.js`                    |                      11.5 | Substantially implemented location/time selection, source-app-compatible time resolution, globe offsets, and `FlatSynchronizer` distant-direction/finite-local-position derivation. `Flat32Application` submits the resulting active-pair candidate transactionally with requested-versus-published state and a 450 ms latest-state delay. Reconcile any location/source-specific failure assertion and remaining interaction behavior before acceptance. Exports only `LocationTimeController`. |
| `src/flat32/ReviewSceneContent.js`                        |                      11.6 | Extract mode-aware review boxes, dynamic ground/shadow projection requests, invalidation, and associated owned Three resources from the fixed checkpoint. Exports only `ReviewSceneContent`.                                                                                                                                                                                                                                                                                                     |
| `src/flat32/consts.js`                                    |                      11.2 | Application-owned constants only. No class exports.                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| `src/flat32/types.d.ts`                                   |                      11.2 | Shared application contracts used by more than one owner.                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| `src/flat32/assets/css/flat32.css`                        |          scene checkpoint | Built application-shell and state styling.                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| `src/flat32/jsconfig.json` and Polylith declaration shims |          scene checkpoint | Focused JavaScript type-check boundary without importing unchecked Polylith package source.                                                                                                                                                                                                                                                                                                                                                                                                      |
| `src/flat32/_tests/flat32-application.browser.js`         |                      11.2 | Observable browser setup, actual shadow allocation/configuration, output, WebGL state, responsiveness, and disposal checks; no class-shape assertions.                                                                                                                                                                                                                                                                                                                                           |
| `spec/support/karma-flat32.conf.cjs`                      |                      11.2 | Focused real-Chrome application lane and browser-test entry.                                                                                                                                                                                                                                                                                                                                                                                                                                     |

Class-specific helpers remain private methods, including pure helpers. Private
fields and methods follow the canonical single-underscore convention selected
by the [standards manifest](../../standards/manifest.md);
ECMAScript hash-private names are not used.
Reusable pure operations move to a focused utility file or namespace owner.
Class modules export only their class. Constants live in `consts.js`;
non-class filenames use kebab-case; and namespace-style method owners, if any
are later justified, use their PascalCase namespace name.
