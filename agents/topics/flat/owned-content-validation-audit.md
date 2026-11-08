# Owned-content Validation Audit

Status: investigation complete on 2026-11-08. No additional production code was
changed. This follows the owner's request to find further instances of checking
content we created, after the [full-profile hash removal](sun-slider-performance.md).

Scope: the production Flat Earth retained observation path and its Algorithm32
collaborators, with source searches of Flat's remaining validation/hash calls.
This is a focused audit, not an exhaustive repository inventory or a standards
compliance result. Experiments and historical evidence were not modified.

These findings describe the preserved pre-cleanup baseline. Every identified
item is now resolved by the [cleanup execution](owned-content-cleanup-execution.md),
which owns current implementation, verification and remaining-cost measurements.

## Measured Calls

A real served app, MUI pointer interaction and GPU rendering exercised three
warmed Full-mode Sun-position updates in one view after a separate warmup.
Every measured update had these same counts:

| Operation | Calls per update |
| --- | ---: |
| Scan all 2,000 catalog members (`acceptStars`) | 2 |
| `SpectralPacket.assert` | 4,150 |
| `SpectralBasis.assertCompatible` | 4,031 |
| `SpectralBasis.assert` | 8,382 |
| `combineReceiverLight` | 4 |
| Receiver-irradiance channel scans | 12 |
| Adopt a complete receiver measurement | 1 |
| Frame-content validation | 2 |
| Compute live-frame identity | 3 |
| Compare stellar observation hashes | 4 |

These counters overlap: catalog checks call packet assertions, which call basis
compatibility checks, which call basis assertions. They must not be added as
independent work. Packet and basis assertions do not recompute their content
hashes; basis compatibility compares stored hashes.

Evidence: `.codex-tmp/owned-content-audit/report.json`, `counts.mjs`, `counts.log`
and `counts.result.json`. The report records bundle SHA-256, each sample,
Chrome 156, RTX 2060/ANGLE and the 1100-by-800 viewport. No browser page errors
occurred; disposable browser profile data was removed. Wrappers counted real
calls without changing numerical outputs or skipping work. Instrumented timings
are not a savings estimate. Other modes, locations and comparison views were
not measured in this audit.

## Findings

### The unchanged star catalog is accepted twice per update

[`StellarCatalog.load`](../../../src/flat/features/flat-earth/models/StellarCatalog.js:49)
retains the loaded source. Flat's
[`_stageUpdate`](../../../src/flat/features/flat-earth/runtime/FlatEarthRuntime.js:599)
supplies that same `this.stars` while changing the local Sun and observation.

[`_createExecutionProfile`](../../../src/algorithm32/implementation/local-sun/cache/LocalSunCompactConstructionProfile.js:393)
calls roster acceptance and then roster identity description. Both call
[`acceptStars`](../../../src/algorithm32/celestial-source-support/CelestialSourceRoster.js:231).
Each scan repeats member-id uniqueness, direction shape/unit length, spectral
compatibility and nonnegative channel checks, and allocates member identity facts.
The identity method explicitly describes its input as a previously accepted
roster, but accepts the star content again.

This accounts for 4,000 of the 4,150 packet assertions per update. The source
already stores its definition identity in
[`StellarPointSetSource`](../../../src/algorithm32/implementation/star-field/StellarPointSetSource.js:36).
Accept static catalog content once and retain its accepted identity facts;
changing the Sun does not change that content. Genuine new-source acceptance
and pairing a new Sun with its geometry remain distinct obligations.

### Adopting a prepared light measurement rebuilds it

[`adoptPreparedMeasurement`](../../../src/algorithm32/implementation/scene-lighting/ReceiverEnvironmentLightController.js:53)
calls `combineReceiverLight` on the completed measurement's component packets.
This rescans those packets, recreates total irradiance and its hash, and repeats
photopic projections already produced by `build`.

The measured four combinations are two constructor-created dark placeholders,
one actual receiver measurement, and one adoption recombination. The placeholder
controllers are constructed by
[`prepareReceiverEnvironmentLight`](../../../src/algorithm32/implementation/algorithm32/Algorithm32ShaderHandle.js:278)
and [`_createPreparedConfig`](../../../src/algorithm32/implementation/algorithm32/Algorithm32.js:694).
The latter placeholder is immediately superseded by the prepared measurement.
These placeholders are avoidable construction, rather than repeated integrity
checks, but compound the work in the same path. The actual changed-observation
receiver measurement still needs to be calculated.

[`combineReceiverLight`](../../../src/algorithm32/implementation/scene-lighting/LocalLightLevelCalculator.js:164)
also repeats packet/basis checks through explicit compatibility assertions,
spectral addition and photopic measurement. Its public input validation should
be distinguished from trusted internal reuse of its completed output.

### Frame staging and publication recheck the same local aggregate

[`_validateContents`](../../../src/algorithm32/implementation/local-sun/cache/frames/LocalSunFrameController.js:413)
checks packet metadata, receiver identity, adaptation values and staged function
shapes, then hashes actual and expected celestial input objects. It runs after
staging and again at publication. Flat's
[`_frameContents`](../../../src/flat/features/flat-earth/runtime/FlatEarthRuntime.js:675)
creates these inputs directly from the same request/profile and prepared light.

Separately, `_frameIdentity` runs three times: initial identity creation and two
subsequent recomputations to detect mutations of the live request. These are
smaller objects than the construction-profile hashes already removed, but still
recheck owned content. The generic stage callback can also be supplied by other
callers; any cleanup must identify the owned path rather than trusting every
external callback. Generation, cancellation, lease and retirement checks address
changing operational state and remain necessary independently.

### Stellar geometry hashes the supplied and configured observation repeatedly

[`createStellarGenerationShaderContribution`](../../../src/algorithm32/implementation/flat-earth/FlatEarthGeometry.js:70)
hashes both observation objects to check equality. It is called four times per
measured update: eight small observation hashes. Retained stellar generation
passes its candidate profile's geometry and observation through source-stage,
uniform and generation-identity preparation. Within this owned path the pairing
comes from the execution profile itself. Keep genuine incompatible-owner/program
checks separate from repeatedly proving that unchanged paired content matches.

### Receiver sample consumers repeat metadata checks

[`ReceiverEnvironmentLightGpuReducer.reduce`](../../../src/algorithm32/implementation/scene-lighting/ReceiverEnvironmentLightGpuReducer.js:39)
asserts the first radiance packet, then asserts every packet including that first
one again. Sky-median calculation later asserts all 32 packets again and scans
their channels. These packets have already been constructed by the engine's
sampler. Repeated shape/basis checks are candidates for cleanup. Checks for
nonfinite or physically invalid newly computed numerical results have a concrete
purpose and should be evaluated separately.

## Boundaries And Follow-up

The clearest first cleanup is the static catalog scan and identity rebuilding,
followed by adoption of completed receiver measurements. Frame/observation
hashing is another confirmed instance, with an explicit generic callback boundary
to preserve. No per-finding time savings have been established.

Do not classify every hash or assertion as redundant. Initial identity creation
for newly constructed values, download-byte authentication, input date/coordinate
validation, new physical-result validation, program compatibility, cancellation
and resource-lifetime checks serve different purposes. Live-profile construction
still creates a new profile and its initial identity; reuse of its unchanged
construction metadata is a separate optimization from removing revalidation.

This task changes documentation and adds ignored diagnostic evidence only.
No further removal, implementation plan or source change is authorized by the
audit itself. Engineering standards reviewers remain cancelled.
