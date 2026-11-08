# Spherical Earth Implementation Execution

Status: M1 complete on 2026-11-08 under the owner's independent-execution request.
M2-M4 remain unstarted and outside this invocation. The
[plan](spherical-earth-implementation-plan.md) owns acceptance criteria.

## Completed Outcome

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

## Decisions And Recovery

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

## Verification

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

## Measured Delivery And Resources

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

## Evidence And Captures

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

## Checkpoint And Resumption

The M1 local checkpoint includes the whole repository state, including prior
Temporal/user-locale/IntlDate design notes. Its exact identifier is reported in
the final handoff and Git history; nothing is pushed or deployed externally.
The [whole-repository checkpoint advice](../../../.codex-tmp/spherical-earth/m1/checkpoint-advice.md)
recommends this completed unit. Advice is separate from standards review and test
outcomes.

Next authorized work ends here. On a later owner request, begin M2: promote the
stellar capability to app ownership and assemble the real spherical geometry,
curved ground, distant-Sun shader/cache attachment and stars with exact shared
inputs. Reuse this deployment and ownership layer. Rendering controls, retained
scene updates and full mixed/two-spherical GPU/deployment measurements remain
M2-M4, including an actual parent/discoverable deployment rather than just local
nested mounts. The suspended dome-cache experiment remains suspended.
