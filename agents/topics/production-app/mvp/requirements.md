# Production MVP Completion Requirements

Status: deferred until MVP closure; not started as one coordinated work unit.

This document is the canonical owner for production work deliberately deferred
from the current Algorithm32 compiler, benchmark, and release-closeout path but
still required before the first MVP can be declared complete.

## M1 — Compatible Time And Location Animation

Both supported geometry/source families must animate time and location through
the Algorithm32 facade without constructing a complete replacement facade,
scene, and cache set for every compatible clock tick.

- Define the external clock/configuration ingress and facade-mediated update
  contract. Geometry remains the sole owner of time/location interpretation and
  every source/receiver-to-model transform.
- Select and prove cache transforms or an equivalent reusable parameterization
  for both spherical/distant and flat/local families.
- Compare transformed or reused cache results with independent full rebuilds
  across representative locations, times, elevations, azimuths, and
  near-horizon cases under predeclared tolerances.
- Retain the facade, scene, GPU backend, compiled programs, and valid cache
  resources across compatible ticks. Publish geometry state, cache bindings,
  endpoint lighting, shadows, and displayed time atomically.
- Coalesce rapid updates, cancel superseded preparation, preserve the last
  published state on failure, and expose requested-versus-published time.
- Define the continuous or discrete Sun-update and cache-swap policy required
  by the supported product cadence.

**Gate:** both MVP geometry/source families pass rebuild-oracle parity, avoid a
complete cache rebuild on compatible ticks, publish atomically, implement
latest-request-wins and failure preservation, and pass CPU, browser, lifecycle,
resource, and supported-cadence acceptance.

## M2 — Algorithm32 Production Hardening

The exact production build selected for the MVP must close the remaining
conformance, provenance, implementation, and performance work.

- Complete the imported-source revision, file, fixture, test, hash, and
  standalone-parity manifest; retain no runtime dependency on research or an
  external source repository.
- Complete direct-40 CPU-reference reporting with CPU and GPU provenance kept
  distinct, audit the complete source-fallback inventory, and regenerate the
  native-N4 WebGL fixture made stale by reflected-68 promotion.
- Complete CPU/GPU ray parity, former-altitude-boundary continuity, lifecycle,
  invalidation, dome-sanity, and rebuild-boundary coverage.
- Verify that the source-owned GPU cache and runtime sampler remain the sole
  production strategy. Retain only the independent CPU oracle and its fixtures;
  remove obsolete sampler fields, aliases, fallback readers, translation
  bridges, and old/new switches.
- Clear the production package's applicable JSDoc and static-type baseline and
  complete the implementation-side source, fixture, and reference citations
  required by this hardening gate. M3 owns the broader Color Reset research
  and official-experiment authority register.
- Measure cold and rebuild time, peak and resident memory, frame and lookup
  cost, and staged-build responsiveness on the supported hardware matrix.
  Declare release budgets before judging readiness.
- Run the complete production verification ladder, including sealed native-15
  and direct-40 reproduction and the official B1/B2/B3 scoring and figures.

The release closeout's current C1 run remains owned by its independent
benchmark plan. M2 consumes that accepted evidence and repeats the complete
ladder for the exact MVP build; it does not delay or replace current C1
acceptance.

**Gate:** the standalone production package and supported application build
pass the complete conformance and lifecycle suite; the single-strategy audit is
clean; source and evidence identities are complete; declared resource budgets
pass on the supported matrix; and the official experiment ladder is accepted
for the exact MVP build.

## M3 — Color Reset Scientific Authority

Complete the research-authority and distribution-clearance work deferred from
release closeout items C4 and C5 as one complete reference pass.
The [Color Reset Research Register](../../../../references/followup.md#color-reset-research-register)
remains the detailed action ledger for all 12 `SRC-CR` and 12 `EXP-CR`
identities; this requirement owns their first-MVP completion gate.

- Resolve each applicable third-party source, payload identity, provenance,
  transformation, exact locator, and consumer citation, or explicitly remove
  the claim that requires it.
- Promote each retained first-party result that remains necessary into an
  official standalone experiment under the repository
  [official-experiment policy](../../../../references/citation-and-retention-policy.md#official-experiments),
  or explicitly remove the dependent claim.
- Preserve every stated uncertainty, mismatch, qualitative-only boundary,
  adverse result, and non-claim. A contained run, plausible value, or current
  implementation cannot substitute for independent authority.
- Update the canonical bibliography, working facts, official experiment
  register, retained-payload records, production consumers, and research
  register together as each authority closes.
- Establish license and redistribution clearance for the BSC, Pickles,
  Johnson/SVO, Vega, CIE, and every derived production payload selected for
  public distribution. Source authority or experiment acceptance does not
  itself grant a license to redistribute a payload.
- Retain affected payloads as local-only and exclude their bytes from public
  artifacts until clearance is recorded. If clearance cannot be established,
  remove the payload and every dependent public claim from the distributable
  set.

Deferral permits the current release to claim only its recorded engineering
qualification. Until M3 closes, it must not claim final scientific or numerical
authority for any unresolved Color Reset row or public redistribution rights
for any uncleared payload.

**Gate:** every applicable `SRC-CR-001–012` and `EXP-CR-001–012` row is closed
through canonical authority and exact consumer citations, or its dependent
claim is explicitly removed from the production and reference surfaces. Every
payload selected for public distribution also has recorded license and
redistribution clearance, or is excluded from the distributable first MVP.

## Scheduling Boundary

M1, M2, and M3 are outside the current production compiler and release-closeout
critical path. They may be planned independently, but none may be removed from
MVP completion through silence or by calling its present implementation state
complete. Any removal requires an explicit product claim reduction in this
document and the release record.
