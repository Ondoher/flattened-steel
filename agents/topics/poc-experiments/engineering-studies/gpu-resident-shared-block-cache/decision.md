# GPU-Resident Shared-Block Cache Decision

## Decision

The contained experiment is accepted and closed. Recommend a separately
authorized production design for GPU-resident shared-block distant-Sun cache
animation.

The experiment demonstrated exact spectral sample retrieval, safe publication
and failure behavior, bounded residency, meaningful adjacent-scene reuse,
production-compatible RGBA packet lookup, whole-route preconstruction on the
reference GPU, real native-4K animation timing, and trace-faithful viewable
evidence. Project-owner review accepts the resulting native-4K animation as
smooth enough for the intended large-display experience.

This decision does not modify production or select final production
architecture. A promotion requires its own production-owned design,
implementation plan, compatibility policy, and qualification boundary.

## Canonical Evidence

- S4 exactness and lifecycle: `1788887946682-s4-exact-atlas`.
- S5 switching and resources: `1788907211015-s5-animation-measurement`.
- S9.1 whole-route capacity: `1788913194598-s9-whole-route-capacity`, artifact
  set `593c0fff94f60c98a9e3b18f6d3a60f1483ae4bfb4d4cd288e228e23f9597fc0`.
- S9.2 production-compatible packet renderer:
  `1788917159050-s9-shared-packet-renderer`, artifact set
  `1af5b56c38b4ba1e94cdfed27eedb587912a5a5c3e02d55588a0756026835b36`.
- S9.3 native-4K traces: `1788918482263-s9-animation-trace` at 78 degrees and
  `1788919164368-s9-animation-trace-fov55` at 55 degrees.
- S9.4 deterministic replay: `1788919958694-s9-presentation-replay`, artifact
  set `db3b6283a0e37c9ddeb79be0f447b22367e25499e71aa928ec2c9ff423419105`.
- S9.5 deterministic 4K videos: `1788923711177-s9-deterministic-video`,
  artifact set
  `07c014ba6d0e029b4dc0c35721e013a5b4d662d585bd1c17fbea10fe6d745b01`.
- S9.6 published evidence: `1788926658377-s9-published-evidence`, artifact set
  `2d9411657a439dd3691235b11a6b715dcce5d89a19b896fcd90ec701fbab25a3`.
- S6 independent final audit: `1788926996374-s6-final-audit`, artifact set
  `6c47921957ff4903fce20105bd5a655c2a6d92c1484ebd479e24a29518fdbf7f`.

## Required Production Conditions

- Keep compressed/shared spectra as storage and transfer data, then publish
  authenticated resident blocks as production-compatible RGBA spectral
  packets.
- Use explicit row-to-slot metadata and frame-boundary publication. Never
  publish missing, corrupt, stale, or partially uploaded state; preserve the
  last-good publication on failure.
- Retain a declared residency strategy. The 24-layer sliding window is the
  portable bounded path; a 62-layer whole-route packet atlas may be selected
  only after target capability and memory qualification.
- Use predictive fetch and preconstruction outside the timed animation path.
- Do not promote the scalar `R32F` manual-bilinear lookup. It failed the
  bounded native-4K workload.
- Preserve measured trace timing separately from recording or encoding work.

## Performance Boundary

The accepted native-4K Q10 traces measured approximately 22.68 FPS at 78
degrees and 23.39 FPS at 55 degrees, with mean shader GPU time near 37 ms.
Trace-faithful 60 Hz videos deliberately repeat the latest completed state in
unfilled presentation slots. Owner acceptance means those measured holds are
smooth enough for the intended experience; it is not a sustained-60-FPS claim
or a cross-device guarantee.

## Deferred Work

- Sunrise and sunset look somewhat off overall in the live renderer; the
  often-too-gray horizon is the clearest symptom. Cache selection/data, shader
  consumption, and presentation response remain to be separated.
- S9.7 temporal cache interpolation is deferred.
- S8 spectral qualification, lower-resolution reconstruction, packetized path
  integration, quality presets, and Auto policy remain retained but incomplete.
- Exact physical-display scanout evidence would require external capture and
  is outside this experiment.
- Additional recordings may be created later only as new contained derivative
  runs with read-only sealed parents and complete provenance.

## Next Experimental Direction

After any requested derivative recordings, apply the same staged method to the
local-Sun cache: freeze immutable parents and addressing, prove exact spectral
lookup and lifecycle safety, measure bounded predictive residency and switching,
then establish real animation timing and trace-faithful viewable evidence. That
work requires a new contained experiment and does not reopen this decision.
