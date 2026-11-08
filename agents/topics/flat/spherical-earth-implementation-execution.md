# Spherical Earth Implementation Execution

Status: M1-M3 complete; M4 verification is in progress under the owner's request
of 2026-11-08 to independently execute the remainder of the saved
[plan](spherical-earth-implementation-plan.md). Current scratch/evidence:
.codex-tmp/spherical-earth/m2-m4-20261108/. M1 checkpoint: 3f9a1be5.

## Current Position

Spherical Earth renders the canonical atmosphere, shader Sun and brightest-2,000
stars above curved green ground. Shared location/time drives both views. The
feature contributes Sky, elevation, FOV and Center on Sun icon controls and its
Camera/sky settings. Pointer look uses the promoted shared native adapter.
Cameras, GPU resources and view lifetimes remain independent.

The stellar catalog service, declaration, ambient types and tests are app-owned
under src/flat/services/. Both Earth features resolve stellar-catalog; neither
imports the other's implementation. Operational stellar/cache data remains
ignored and unchanged. The existing Flat startup cache still warms eagerly.

## M2-M3 Milestone Report

Real installed-Chrome captures show day horizon/Sun, low-Sun sky, a dark source
with stars, 40 km horizon curvature, two spherical views and a mixed workspace.
The first complete scene loaded 29 selected blocks and 244,905,838 response bytes,
including metadata; the full 734 MB package was not downloaded. The initial atlas
is 519,561,216 bytes. Two spherical atlases plus the retained 293,819,992-byte Flat
startup field total about 1.33 GB of known cache payload, excluding compositor,
celestial, metadata and driver storage.

Retained time edits preserve the scene, atmosphere program set and atlas.
Six integration samples took 80-125 ms including automation/polling; these are
not GPU-completion timings. The second isolated run independently confirms no
new atmosphere programs or packet uploads across six ordinary time edits.
The source, geometry and receiver measurements update coherently. At 40 km,
view integration changes to 120 intervals through a binding; the scene is not
rebuilt. Lower heights use 30 intervals. Warm GPU-completed measurements remain
part of M4.

Pure engine checks: 709 specifications pass. Flat: 230 browser tests pass after
the retained-retry case; engine and Flat types pass. Server suites pass 21 plus
7 cases. A targeted real GPU lane passes 10 selected cache/Worker/receiver/stellar
cases; 26 unrelated cases were intentionally filtered. Normal production builds
for Flat and the reference Flat32 app pass. No standards reviewers were started.
The primary reread React/ReMVC/local authoring rules and owns self-review.

### Consequential Decisions

1. Adapt production spherical/source/cache APIs into a feature-owned rendering
   aggregate, keeping the workspace generic. Reuse the same selected numerical,
   exposure and human-star policies as the current reference.
2. Add a bounded reversible host installer to shared cache publication. A failing
   installer restores prior facade/protection; geometry, light, camera and prior
   rendering restore together. Retired resources are released after successful
   installation, and post-commit cleanup errors are distinct from failed commit.
   Both new engine cases pass, and original callers preserve their API behavior.
3. Retain the displayed scene during a retryable cache failure. A lost graphics
   context triggers a fresh runtime after recovery; a usable context retries
   preparation without discarding its last frame. The new session test passes.
4. The first integration report retains a probe failure: its program-equality
   assertion included the first Shader-off draw, which legitimately compiles a
   standard Three output variant. Separate time-only sampling proves unchanged
   atmosphere programs; the raw variant is created on first use, not each edit.
5. Keep page-specific time editing Flat-owned. Spherical controls use global
   date/time through the frame and do not duplicate degrees-from-closest.
6. Preserve all historical/experimental source, the original operational inputs,
   the suspended dome experiment and deferred timezone/parser work. Profiles are
   disposable and removed after browser success/failure.

### Current Evidence

- [Initial day horizon](../../../.codex-tmp/spherical-earth/m2-m4-20261108/first-render/day-horizon.png)
- [Initial Sun](../../../.codex-tmp/spherical-earth/m2-m4-20261108/first-render/day-sun.png)
- [Sunset](../../../.codex-tmp/spherical-earth/m2-m4-20261108/integration/low-sun.png)
- [Night](../../../.codex-tmp/spherical-earth/m2-m4-20261108/integration/night.png)
- [40 km](../../../.codex-tmp/spherical-earth/m2-m4-20261108/integration-r2/40km-horizon.png)
- [Two spherical views](../../../.codex-tmp/spherical-earth/m2-m4-20261108/integration-r2/two-spherical.png)
- [Mixed views](../../../.codex-tmp/spherical-earth/m2-m4-20261108/integration-r2/mixed-views.png)
- [Passing retained integration report](../../../.codex-tmp/spherical-earth/m2-m4-20261108/integration-r2/report.json)

These captures were inspected as real rendering/interaction evidence. They do
not establish numerical equivalence by themselves. M4 still owns matching
reference comparisons, GPU-completed timings, boundary/failure/context/app-stop
checks and real discovered-app deployment with a separate parent output root.
No external publishing or push is authorized. Checkpoints cover the whole repo.

## Historical M1 Report

The following report records the M1-only state at checkpoint 3f9a1be5. Its
placeholder/cache-ready presentation is superseded by the real render above.

### Completed Outcome

Spherical Earth registers through app-pages and mounts feature-owned class React
presentation in either workspace view. Its controller, view and registered model
service consume shared location/time. Missing location, loading, error/retry and
cache-ready are actual states; the page explicitly says scene rendering follows
in the next milestone. No spherical atmosphere, ground or GPU atlas is claimed.
The workspace still starts with no selected page at the app root.

Flat independently owns its package service/routes and built module Worker. The
server implementation and wire constants have neutral ownership; Flat32's live
consumers were migrated. The existing immutable package was authenticated and
copied into Flat's ignored deployment directory. The
[deployment contract](../../../server/flat/features/spherical-earth-cache/README.md)
owns staging, operational-root configuration, build commands and routes.
No browser/server runtime import points into a Flat32 application implementation.

### Decisions And Recovery

1. Preserve the immutable production package as deployment input. It contains
   209 files, 95 encoded blocks and 734,130,872 bytes. Selected package/report
   identities are owned by the neutral package-selection module, linked from the
   deployment contract. No replacement generation or duplicate Git dataset. The copied server constructor
   no longer rejects informational memory evidence above its historical target;
   complete file authentication and valid numerical inputs still apply.
2. Authenticate metadata once per accepted report/application lifetime, with
   changed-report invalidation and failed-load retry. M1 decodes one required
   selected-scene block; complete interpolation/scene attachment is M2 work.
   Cache readiness is deliberately separate from rendered-scene readiness.
3. Use an explicit application acquire/release protocol for a genuinely shared
   engine transport. Flat and Flat32 both participate; stopping the original
   creator does not terminate a surviving app. Independently bundled engine
   modules retain their own singleton scope. Per-view requests remain cancellable
   subscribers, and app restart invalidates old results.
4. Keep the owner-requested eager Flat Earth warming. Include its detached
   context/cache in accounting rather than making spherical-only measurements
   omit existing allocations.
5. Windows rejected directory rename after staging. Reused the complete staged
   copy, authenticated it, and published by authenticated copy with the report
   last. Final published files were authenticated too. The source and staging
   copy remain intact. Failure/recovery logs are below the task scratch root.
6. Two early browser probes ran against output missing the feature during
   concurrent build/test activity. Those probes are failed evidence. The final
   production build and isolated standalone/nested probes pass; no runtime
   behavior was weakened to make them pass. An earlier byte-count assertion also
   misclassified the direction map as a compressed block and was corrected.
7. The date/time design notes already present at baseline remain design-only.
   They belong in the whole-repository checkpoint together with this milestone.

### Verification

The maintained production build and pinned worker build pass. Flat client,
server, engine and Flat32 type checks pass. Passing suites:

- Flat: 229 browser tests, including spherical registration, missing location,
  real solar-angle derivation, independent views, stale-result cancellation,
  repeated readiness, failure/retry and actual Flat/Flat32 borrower/start-order/
  original-creator-stop/restart integration.
- Algorithm32: 707 specifications, including new ownership lifetime checks and
  existing shared transport coalescing/subscriber cancellation/decode coverage.
- Server/shared Flat32: 21 tests; Flat: 7 server tests, including independently
  mounted metadata/artifacts, invalid query/path, missing-data 503 and nested
  mounts. Existing whole-file integrity and alias/traversal checks remain.
- Flat32 browser: 72 passing, one existing skipped case. This is the normal
  maintained suite, not the optional full-cache rendering campaign.

A real Polylith host deployed only Flat at /flat and /group/flat. Installed
Chrome loaded direct spherical-page routes with correct base URLs/styles.
Standalone two-view preparation used exactly one module Worker and one encoded
block request. Closing the optional view left the primary ready. The nested run
loaded metadata/block/Worker through its own mount, injected an HTTP 503, displayed
Retry, and returned to cache-ready through the actual button. Retry reused the
retained decoded packet (one decode, one cache hit). No unhandled page errors.
The injected 503 and controller diagnostic were expected, recorded failures.
Every task browser profile was removed; captures and measurements retain no
browser cookies or cache directories. Standard Karma launchers also retire their
temporary profiles.

Primary self-review applied the selected React/ReMVC boundaries, local authoring
rules, adjacent service contracts and ambient types. Engineering standards
reviewers remain cancelled; no independent standards-compliance claim is made.
Changed source formatting and Git whitespace diagnostics pass. No numerical
requalification or heavy spherical rendering was run in M1.

### Measured Delivery And Resources

At 37.33939 N, -121.89496 E and 2024-06-20T19:00:00Z, the geometry selected solar
zenith 20.2605937845 degrees. Metadata transfer was 3,098,407 bytes; the selected
encoded block was 8,876,917 bytes. Total metadata plus block was 11,975,324 bytes,
about 1.63% of deployed package size. The direction map is metadata. Two requests
coalesced into one preparation; decoded retained packet: 17,915,904 bytes, with
zero remaining pins after the connection proofs released their leases. The
selected scene declares 28 required blocks; this one-block proof is not full
scene residency.

The standalone block fetch took about 146 ms. Recorded Worker stages were about
25 ms authentication, 30 ms decode, 127 ms inverse/validation and 135 ms packet
construction. These are one cold integration sample, not stable latency targets.
The decoder reported the pinned WASM fallback. Nested retry caused no re-decode.

The eager Flat Earth context retained 7 textures and a measured cache entry of
293,819,992 bytes (about 280 MiB). Warming completed in about 20.6 seconds in the
standalone final probe. Device limits: 16,384 texture size and 2,048 array layers;
backend reports Three r180/WebGL2, R32F and float sampling. M1 allocates no
spherical GPU atlas. Existing package estimates remain approximately 519,561,216
bytes per worst-case spherical atlas. Two steady atlases plus the measured Flat
cache are approximately 1.33 GB; simultaneous two-atlas transitions in both views
plus that cache are approximately 2.37 GB, excluding render targets, other engine
resources and driver overhead. These are estimates, not measured allocations or
admission limits. M2/M4 must observe actual allocation/transition behavior.

### Evidence And Captures

Scratch/baseline and command logs: .codex-tmp/spherical-earth/m1/. The saved baseline
includes the pre-existing tracked diff and untracked plan. Useful current evidence:

- [Standalone browser report](../../../.codex-tmp/spherical-earth/m1/browser/report.json)
- [Nested cache/retry report](../../../.codex-tmp/spherical-earth/m1/browser/nested-report.json)
- [Missing location](../../../.codex-tmp/spherical-earth/m1/browser/missing-location.png)
- [Two cache-ready views](../../../.codex-tmp/spherical-earth/m1/browser/two-views-cache-ready.png)
- [Single cache-ready view](../../../.codex-tmp/spherical-earth/m1/browser/single-view-cache-ready.png)
- [Nested failure/retry](../../../.codex-tmp/spherical-earth/m1/browser/nested-error-retry.png)
- [Nested cache-ready view](../../../.codex-tmp/spherical-earth/m1/browser/nested-cache-ready.png)

Captures were visually inspected as page/cache status evidence; they are not
spherical shader renders. Current command result files identify exact durations
and exit codes. Earlier failed logs remain separate from passing final results.

### Checkpoint And Resumption

The M1 local checkpoint includes the whole repository state, including prior
Temporal/user-locale/IntlDate design notes. Its exact identifier is reported in
the final handoff and Git history; nothing is pushed or deployed externally.
The [whole-repository checkpoint advice](../../../.codex-tmp/spherical-earth/m1/checkpoint-advice.md)
recommends this completed unit. Advice is separate from standards review and test
outcomes.

M1 checkpoint: 3f9a1be5. The owner has now authorized the remaining plan. Begin M2: promote the
stellar capability to app ownership and assemble the real spherical geometry,
curved ground, distant-Sun shader/cache attachment and stars with exact shared
inputs. Reuse this deployment and ownership layer. Rendering controls, retained
scene updates and full mixed/two-spherical GPU/deployment measurements remain
M2-M4, including an actual parent/discoverable deployment rather than just local
nested mounts. The suspended dome-cache experiment remains suspended.
