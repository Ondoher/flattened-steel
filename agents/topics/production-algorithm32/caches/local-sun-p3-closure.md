# Local-Sun P3 Reuse And Complete Frames

This document records P3's implemented reuse/publication boundary
and its qualification limits; [status](local-sun-cache-promotion-status.md) owns
current disposition. The source unit began from the clean P2 checkpoint
`8863d652a4476ddf16339c3e7c86362a404ffb8a`. Completion requires the matching final
mapped primary review, independent audits and CLEAN validator receipt. P3
completion cannot be inferred from test passes alone.

## Ownership And Publication

`LocalSunFrameController` owns the canonical cache registry and complete live
packets. Each registry entry constructs through the ordinary source-owned
`LocalSunCacheController`; the field is not copied for an admitted horizontal
update. `FlatEarthGeometry` creates independently configured live and canonical
physical geometry/source objects. Its immutable transform maps live positions
and directions into canonical lookup coordinates. The cache contributes those
uniforms and unchanged normalized physical-J lookup through the existing shader
assembly. The local compact topology and its geometry-dependent quadrature and
column policies remain selected; no separate angle-to-Sun axis is introduced.
Source/geometry coupling redesign remains deferred.

Canonical identity includes physical, numerical, domain and implementation facts.
Horizontal source placement is normalized only for the admitted physical family.
Exact observation, source/receiver position, presentation, requested rays and
generation identify the live frame separately. Changed supported physical inputs
construct a different entry; unsupported families cannot borrow qualified fields.
Support admission checks the ordinary geometry's required ray extent rather than
silently shortening it at the compact cylinder. Unsupported input rejects before
replacement publication.

`LocalSunFramePreparer` owns an isolated Algorithm32 facade and actual ordinary
shader/composer preparation. It consumes a borrowed cache-controller capability,
assembles live geometry/source bindings, prepares measured Native15 receiver
spectra and matching celestial inputs, and preflights finite composed output.
The existing production color owner is supplied by a frame-local factory.
Celestial resource generation and ordinary application-controller wiring remain
P4 responsibilities.

The explicit Flat32 bridge publishes at the real scene frame boundary. Source
validation and synchronous renderer installation precede the active-frame commit;
an installation failure retains the earlier complete packet. Shader, receiver,
bindings and celestial inputs commit as one aggregate. Retirement errors after
commit are reported separately and do not misrepresent a successful replacement
as a preparation failure.

## Resource And Recovery Contracts

Generation and context guards reject cancelled or superseded asynchronous results.
Preparation failure retains the earlier complete frame. Owner disposal releases
candidate and active contents while valid borrowers retain their physical entry
until the final lease is released. `whenReleased()` also waits for pending stage
cleanup so an external backend owner can dispose safely. Context loss withdraws
the unusable frame and invalidates all old GPU leases. Restoration explicitly
uses a new backend and stages the last successfully published exact request as
a complete unpublished replacement. Unsupported or failed pending requests
cannot replace that recovery authority. It survives repeated restoration
failure. Failed
restoration leaves a retryable lost-context state.

The original 1,600,000,000-byte logical GPU ceiling includes retained old/new
fields, construction temporaries, auxiliary and program data, and conservative
complete-frame/composer/receiver reservations. The proof observes real backend
allocations and successful disposal without replacing numerical execution.
Logical allocation differs from sampled process working sets and driver memory.

The owner lowered the free-machine-memory guard from 8 GiB to 4 GiB on
2026-10-13 and may interrupt if system responsiveness suffers. This applies to
the whole promotion plan, including subsequent phases and CPU/GPU proof runners.
The owned-process ceiling remains 8 GiB, jobs remain
serialized and bounded to ten minutes, and progress is reported within 30 seconds.
Earlier passed and failed runs retain their original policies and identities.

The app's cache-build memory requirement is a separate open question and, by
owner direction on 2026-10-13, is not a blocker for any plan phase. These proof
jobs construct comparison caches and perform full-field readbacks; their process
working sets do not establish the app's minimum RAM. Preserve their measurements
for the later application-sizing answer.

## Evidence And Limits

The real GPU proof declares seven rotations, four co-translations and five exact
day observations before observing candidate output. Day states come from the
authenticated immutable experiment movement fixture; public production geometry
placement must match it. The comparison controls construct two independent
canonical fields for identical canonical inputs, then stage each exact live pose
independently. Admitted updates must submit no new canonical construction passes.
This is independent canonical reconstruction followed by live staging, not a
world-translated field construction claim.

Every cumulative field is inspected in full and its SHA-256 must match the
independently qualified P2 identity. Each field contains 68,824,890 FP32 scalars.
Ordinary live J/L/T queries also compare against authenticated independently
generated CPU fields. Fresh/reused physical and receiver values retain the
predeclared 0.0001 relative gate and original quantity floors; CPU/GPU retains
0.002, and endpoints retain 0.01 m. Adaptation and actual composed pixels must
match exactly. Negative and nonfinite values are counted, not hidden.

- N1 `00059-p3-reuse`: all 16 poses passed, paired physical/receiver/display
  residuals zero, no negative samples, exact endpoints, and all observed owned
  resources released. Host elapsed 215.841 s; subsequent reuse preparation
  567–647 ms after the initial shader compilation.
- N2 `00060-p3-reuse`: all 16 poses passed with exact paired quantities, no
  negative samples and exact endpoints. Host elapsed 255.627 s; subsequent reuse
  preparation 612–729 ms. Complete observed admission was 1,410,380,088 bytes;
  all observed resources released.
- N4 attempts `00061`–`00064` stopped at the original 8 GiB free-memory guard;
  they are failed immutable evidence and do not qualify N4 P3 behavior.
- N4 `00065-p3-reuse`: all 16 poses passed under the owner-authorized 4 GiB
  reserve, with exact paired physical/receiver/adaptation/composed-output values,
  no negative values and exact endpoints. Both full canonical hashes match P2.
  Host elapsed 310.778 s; subsequent reuse preparation 600–709 ms. Complete
  observed admission was 1,134,915,640 bytes; final observed resources were zero.
  Minimum sampled free RAM was 4,535,623,680 bytes and maximum sampled owned
  working set was 8,343,478,272 bytes. The renderer was NVIDIA RTX 2060/D3D11.
- N1 `00066-p3-reuse`: all 16 poses passed with RGBA16F ordinary composer
  targets and the final owned-copy/readonly snapshot code. Host elapsed 239.160 s;
  subsequent reuse preparation 576–647 ms. Complete observed admission was
  859,616,080 bytes and final observed resources were zero. Removal of runtime
  freezes and formatting did not change the numerical equations or identities.
- The full engine suite passed 664 specs. The latest ten focused frame lifecycle
  specs pass, covering successful publication/reuse, retained borrowers,
  rebuilding, failure/cancellation/supersession/retry, unsupported support,
  context restoration, rejected-request restoration, failed-restoration retry,
  renderer-install rejection and cleanup completion.
- Final core, Flat32, GPU proof and all three affected CPU proof type checks pass.
  The CPU factory's canonical return contract now exposes the full physical
  capabilities already provided by its genuine geometry/source/medium objects.
  Complete-frame staging and restoration share the named ambient
  `LocalSunFrameBackend` capability. Lifecycle specs use nested behavior groups;
  all ten pass after these final declaration/test-organization repairs.
- Production and browser-test builds pass with the known internal module-cycle
  warnings. The basic Flat32 browser suite passes 41 specs, including both new
  publication checks; its existing full-cache spec is skipped in this lane.
  Five focused Three backend regressions pass on software ANGLE; these are
  lifecycle/backend checks and do not substitute for the NVIDIA physical proofs.

Source compliance and phase completion require the matching
[final primary/audit receipt](../../../../.codex-tmp/review-standards/session-KrjnnU/validation.json)
with outcome CLEAN. Earlier numerical evidence retains its original source and
policy identities; no earlier report is relabeled as review of the new source.
The rendering proof uses a 4×4 ordinary scene and declared supported rays. It
does not establish unrestricted near-horizon or coverage-edge camera support,
every physical profile family, or a broad hardware/driver-loss matrix. P4 owns
normal scene and required celestial integration; P5 owns broader qualification
and adoption preparation. Defaults, deployment and adoption have not changed.
