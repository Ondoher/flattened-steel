# Color Reset Contained Experiment Lane

Status: the contained CR0-CR8 lane is complete. Independently verified run
`000065-color-reset-qualification` closes final qualification at artifact-set
SHA-256 `1f5fa1226d1520847fa900fea14870144e6c07f1cbecd11dc0ff4246d2b8bfe1`.
It exactly retains the accepted B1 score and six figures, preserves basic
Bruneton as an explicit non-aliasing Color option, and replays all eleven CR7
images. Production remains unchanged and promotion is a separate decision.

Historical execution summary: CR4A paper-reference diagnosis is accepted by immutable runs
`000016-paper-sunset-reference-inventory` and
`000019-native15-sunset-paper-visual-comparison`. CR4B's pre-tone achromatic
bracket is accepted as diagnostic evidence by
`000020-sunset-pre-tone-exposure-bracket`; `G = 4096` was selected only as a
provisional CR4C row. Rejected immutable run
`000021-sunset-nautical-pre-tone-sequence` writes all 17 requested images and
passes every integrity and clipping gate, but rejects the response because
plus-10-minute medians rise slightly above sunset. Accepted immutable run
`000022-cr4c-two-scale-sunset-nautical-pre-tone-sequence` changes only the
smooth response shape and restores strict dimming with no black or saturated
twilight pixels. `000025-cr4d-bright-low-sun-preservation-replay` accepts the
daylight/low-Sun Bruneton preservation relationship. Accepted presentation run
`000027-cr4e-six-scene-new-color-bruneton-stack` supplies the complete
chronological owner-review image with new color left and Bruneton right; every
embedded source panel is pixel-exact. Accepted integrity-only run
`000032-cr4f-fine-twilight-cadence` adds exact plus-20, plus-30, and plus-45
minute live scenes and a six-row new-color-only stack. It exposes a sharp
plus-30 to plus-45 brightening at the response's 1-lux nautical term. Its
artifact-set SHA-256 is
`60e01c9cd2b26579f5c83cc0904f29b920493000a497019c5f2b0f6b2cf21042`;
accepted run `000033-cr4g-slope-limited-nautical-response-bracket` replaces
only that term and writes all 30 review images before gates. All three
slope-limited rows pass sampled chronology, clipping, response, CPU/GPU, and
D3D11 gates. Its artifact-set SHA-256 is
`fd180391714f77ba2365d7f9ee487f63a61cb664170016f048caf0cc6c24108a`.
Owner selection is now closed after CR4K: the existing `slope-078/p9` control
is retained without change. Unsampled continuity remains unqualified. CR1
remains the shape-matched visual and numerical baseline,
CR2 the direct/diffuse receiver-light authority, and CR3 the neutral-geometry
ambient bridge.

The bounded CR4H/CR4I follow-up acquired exact sunset-minus-
45/30/20/5-minute fields, then replayed those with CR1/CR4F through unchanged
Bruneton, the exact CR4G control, and three anchor-preserving broader sunset
shoulders. Koomen and Patat measurements remain normalized physical-shape
context only; they do not enter Color.
CR4H is now accepted by immutable run
`000034-cr4h-low-sun-cadence-acquisition`; it retains all four RGBY/mask/
receiver-field sets and all six requested images, with independently verified
artifact-set SHA-256
`92b779126f25e6b0b0bfa43e1efaf6ec684b5776bd708f187959ef977907155f`.
Rejected immutable run `000035-cr4i-smooth-bruneton-shoulder-check` writes all
68 requested images before gates and passes every integrity check, but no
anchor-preserving broader shoulder passes both Bruneton preservation and
all-region chronology. The broad `p=3` row nearly flattens the whole-sky
minus-five-minute-to-sunset step but retains a `3.835883%` upper-sky rise and
misses all three hard preservation scenes. Its independently verified
artifact-set SHA-256 is
`d5d7273e8200bd15070db6bf17d2acefe65908c2762d6e2cff12ca1d859aea38`.
Accepted presentation-only run
`000036-cr4j-slope-078-six-column-cadence` composes all twelve exact
`slope-078` panels into the requested 6-by-2 review grid with zero changed
RGBA channels. Its independently verified artifact-set SHA-256 is
`bbbf09fb3ac9ef4073d3286a5aa79eb6af06fd6ba703cfd3923a6e9149f9f3b0`.
Rejected immutable run `000037-cr4k-minimal-deep-twilight-lift` writes all 43
control/`+0.15`/`+0.30` images before gates. The `+0.15` row passes every
gate; `+0.30` fails only the frozen `0.05` sunset RMSE ceiling while retaining
a one-code maximum difference and passing chronology, clipping, response, and
GPU checks. Its independently verified artifact-set SHA-256 is
`411617368762c3a7f9aa86aa1b0bdb154881addbf67dd9c5f563f358ce7b69bd`.
CR6 stellar contrast onset has now executed through corrected, independently
verified immutable run `000044-cr6-stellar-contrast-onset`. All 38 images
precede gates. Its complete 60,120-scalar palette proof and all 4,000
authoritative GPU member projections are exact; the nine-member fixed cohort,
progressive onset, conditional no-regression, shared Color, collision/mask
ownership, and consecutive-millisecond 108-degree transition all pass. The run
is rejected only because its predeclared dark red and blue color quartiles both
have zero median encoded color-axis delta: two of the three source-red members
remain below one display code. Its independently verified artifact-set
SHA-256 is
`5d36ef15f32e37ef95addf4a3fe38d8ab8ff264c810386876a9d676f3875f2a7`.
CR6A immutable run `000045-cr6a-stellar-presentation-scale-bracket` rendered
the complete replay-only `1x/2x/4x` bracket but is rejected because its GPU
`1x` frame was required to be byte-exact to CR6's CPU-authored parent PNG.
Accepted immutable run
`000046-cr6a-stellar-presentation-scale-bracket-corrected` repairs only that
oracle. All 24 GPU frames are byte-identical to `000045`, CPU `1x` exactly
replays all eight CR6 parent images, and every candidate, progression, color,
transition, containment, and image-order gate passes. It changes no sky,
catalog irradiance, transport, geometry, mask, visibility, collision,
projection, Color relationship, image, or multiplier. Its executable
authority is
[`cr6a-stellar-presentation-scale-bracket-v2.json`](fixtures/cr6a-stellar-presentation-scale-bracket-v2.json).
Run `000046` is independently verified with artifact-set SHA-256
`c27f702e168bc4f7a54da53038b1718c58207b7cb5db5e96cfa294ea649e4dde`.
Owner appearance review rejects `1x`, `2x`, and `4x`. The objective evidence
remains accepted, but no stellar presentation row is selected. The global
scale-only family is closed under that earlier target. The owner's later
one-pixel, brightness-only clarification explicitly authorizes CR6C's corrected
calibration boundary while retaining the architecture.
CR6B catalog-first proof is accepted by independently verified immutable run
`000047-cr6b-brightest-2000-catalog-proof`. It proves the exact brightest-2,000
BSC V/50 roster and leaves spectral materialization, runtime integration, and
appearance unchanged. All four figures preceded gates; the exact production
500 prefix, source, order, endpoints, directions, and containment checks pass.
Its 33-artifact set totals `2,293,026` bytes and has SHA-256
`ce50de53045f1e6f0ef33dcdc2b935a7023d5e28095b3d5f13add4980c370c57`.
CR6C one-pixel brightness calibration is complete. Rejected immutable run
`000048-cr6c-one-pixel-brightness-calibration` preserves the first complete
`1x/16x/32x` bracket; only `16x` misses the corrected HR `1708` plus-30 anchor.
Accepted immutable run
`000049-cr6c-one-pixel-brightness-calibration-narrowed` changes only that row
to `24x`, writes all 30 images before gates, and passes every integrity,
onset, chronology, clipping, color, parity, containment, and transition gate.
Native-scale review selects `q=24` as the lowest satisfactory fixed-viewport
one-pixel row. Its independently verified 65-artifact set totals `8,888,747`
bytes and has SHA-256
`bcd129d7484bbec696c8a3877d9822e4a3cdf89e0d17c3e8614909f4ad62c001`.
The accepted `slope-078/p9` atmosphere remains unchanged; CR4K `+0.15` is
retained only as a separate atmosphere follow-up if the slight nautical
dimness is pursued.
CR6D is accepted by independently verified immutable run
`000052-cr6d-toggleable-low-light-stellar-chroma`. Its minimal stage-aware
registry implements only the source-linear, stellar-targeted,
`human-low-light-chroma-v1` option. The disabled path exactly replays CR6C;
native-scale review recommends moderate `0.65` as the optional enabled state
while retaining physical color. All 67 artifacts total `13,123,366` bytes and
have artifact-set SHA-256
`032ab071dc21477b0cffb2eea7cda1f7378ed736370d7867e443b6ee82f3a089`.
CR6E is accepted by independently verified immutable run
`000054-cr6e-toggleable-mesopic-stellar-luminance`. It adds the ordered
source-linear `human-mesopic-luminance-v1` option using the tracked official
CIE scotopic dataset and authenticated sky adaptation luminance. The owner
approves half strength `maximumRodContribution=0.5` as the optional state; the
full row remains an upper boundary. Physical and CR6D moderate controls replay
exactly,
and `q=24`, one-pixel occupancy, sky, atmosphere, and Color remain unchanged.
All 79 artifacts total `24,029,241` bytes and have artifact-set SHA-256
`2dcbf0fea5bf4edc0d667d437ab853ffbb9401cb8214f4a4e1d2be01c1359df5`.
Reserved stages for later modes such as a solar filter remain unimplemented.

CR4's independently verified 81-artifact set totals `8,155,157` bytes and has
SHA-256
`098add701fdb6af73df7b861e27f57c908293619768f77df1240a08ba111e2fa`.
It wrote all 52 requested images before scientific gates. Every declared gate
passed; `G = 256` and `G = 512` preserve the frozen Bruneton envelope, while
`G = 1024` remains visible diagnostic evidence but fails the sunset envelope.
No appearance row has been selected automatically.

CR3's independently verified 57-artifact set totals `52,550,399` bytes and has
SHA-256
`6d3c23060973e14e325e1fb87d28d1e61efe9a445f2fe57c101d2db04eb0d8a5`.
It contains all 15 declared PNGs, four persisted linear RGBY fields, and one R8
geometry mask. The first image completed in `5.988` seconds and the decision
plate in `6.429` seconds. Across 565 geometry vertices per scene, Native15
direct-plus-diffuse additivity was exact, the horizontal-plane diffuse and
total sequence fell strictly through the four declared scenes, and direct
response was exact zero at both ten minutes and one hour after sunset. The
persisted primary PNGs independently replayed every outside-mask CR1 sky RGBA
code exactly.

Run `000006-available-light-inventory` remains sealed as a failed
parent-image-integrity attempt. Its complete scientific result passed, but an
annotation border changed one pixel per CR1 row; it makes no accepted claim.
CR3 runs `000008` through `000010` also remain sealed and non-authoritative:
`000008` failed during the sandbox browser launch, `000009` failed during
harness initialization, and `000010` was rejected because its independent
reader applied a different float32 tolerance policy than the declared gate.
None makes a result claim.

CR4 run `000012-global-achromatic-twilight-sweep` is likewise sealed and
non-authoritative. Local Chrome could not spawn inside the filesystem sandbox,
so it finalized as failed before rendering; `000013` is the successful
unsandboxed browser execution and does not reinterpret the failed record.

This lane implements the
[Color Reset Design](../../../agents/topics/extraterrestrial/color-reset-design.md)
through the
[Color Reset Incremental Experiment Plan](../../../agents/topics/extraterrestrial/color-reset-experiment-plan.md).
The former color experiments and global immutable runs remain read-only
comparison evidence in the verified
[pre-color-reset archive set](../../../archives/extraterrestrial-pre-color-reset-20260831/README.md).
Restore a needed control into a new derived run with full provenance; do not
recreate an old global run directory.

## Containment

- tracked implementation and control root:
  `scripts/extraterrestrial/color-reset/`;
- qualifying runner root: `scripts/extraterrestrial/color-reset/runners/`;
- generated-output root: `tmp/extraterrestrial/color-reset/`;
- immutable run root:
  `tmp/extraterrestrial/color-reset/runs/NNNNNN-descriptive-kebab-slug/`;
- transient browser profile root:
  `tmp/extraterrestrial/color-reset/browser-profiles/`; and
- production comparison roots: `src/algorithm32` and `src/flat32`, read-only.

The lane uses a separate six-digit allocator sequence beginning at `000001`.
Do not hardcode or reserve that number. The first runner to initialize a run
will allocate it atomically. Every attempt, retry, render, GPU/browser
execution, or evidence run gets one new folder. One experiment never creates a
nested numbered experiment folder.

The local [containment policy](containment-policy.json) and machine-readable
[lane contract](lane-contract.json) narrow the repository and parent
extraterrestrial rules; they do not relax them.

## Runner Pattern

Every runner must use
[`initializeColorResetRunRecord`](harness/color-reset-run-record.js) before
calculation, candidate evaluation, rendering, browser launch, or GPU work. That
wrapper selects the isolated namespace and records the namespace in input and
provenance records. The shared allocator still supplies all canonical initial
records, exclusive numbering, exactly-once finalization, and terminal
manifest behavior.

Terminal runs may be checked read-only with:

```text
node scripts/extraterrestrial/color-reset/runners/verify-color-reset-run.js <run-id>
```

The verifier does not repair or reopen a run.

Each image-producing runner writes all requested PNGs before evaluating
appearance and numerical gates. Rejection preserves the complete render set.
An integrity or rendering failure preserves all partial output and receives a
new number when retried.

## Planned Ownership

- `harness/`: run namespace, containment, browser, image-sheet, and evidence
  orchestration helpers;
- `fixtures/`: fixed scene, viewport, and predeclared candidate inputs;
- `lighting/`: direct/diffuse receiver-light measurement and neutral-scene
  lighting experiments;
- `color/`: source-independent global display candidates;
- `stellar/`: star/background contrast diagnostics and eventual contained
  appearance candidate; and
- `runners/`: thin CR0-CR8 self-verifying entry points.

Create an owner directory only when its first increment needs it. Do not build
a speculative framework before CR0 produces the first control images.

## Immediate Work

No experimental increment remains. Preserve the accepted and rejected runs as
immutable evidence. A production adoption or a future filter, including a
solar mode, requires a separate owner-approved plan and evidence lane.
