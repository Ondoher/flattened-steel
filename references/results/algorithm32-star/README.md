# Production Algorithm32 Comparison Evidence

Status: historical curated index for the complete production Algorithm32
sky-dome comparison, Kider benchmark boundary, and focused deterministic test
lane. The Star working tree and immutable runs are now archive-internal; their
current locator and content manifest are the
[Algorithm32-Star evidence archive](../../../evidence/algorithm32-star/README.md).
Algorithm32* is no longer the active calculation.

The accepted historical evidence uses the complete production CPU Reference, its original
incoming-`L1` cache, and the current Default `40/20/34/48` numerical
controls. The former Bruneton phase-integrated `J2`, flat/local cache, and
GPU paths are abandoned historical research rather than candidate current
implementation evidence.

This index does not replace the independent pre-implementation fact
experiments or the mandatory whole-algorithm benchmarks `B1`, `B2`, and
`B3`.

## Accepted Archived Comparison

Sealed run `000069` (archive path
`scripts/algorithm32-star/runs/000069-production-algorithm32-bruneton-figure1-domes/report.md`)
renders four complete production Algorithm32 domes beside the exact retained
Bruneton Figure 1 panels. It uses the byte-verified standalone
`scripts/algorithm32-star/src/production-reference`
snapshot from clean `poly-gc-react` commit
`514d5f6080d2dd485efdb07b5da9a203357a40c0`.

For each scene, the run constructs the canonical spherical atmosphere and
ideal distant Sun, builds the original 48-altitude by 34-source-oriented-
Fibonacci incoming-radiance cache, evaluates the production `Reference` at
40 view-path and 20 source-path intervals, and crosses the 15-channel
spectral-to-display boundary once. Each cache contains 1,632 coordinates.
The generated domes are untagged 320 by 320 RGBA8 PNGs.

The accepted two-column stack (archive path
`scripts/algorithm32-star/runs/000069-production-algorithm32-bruneton-figure1-domes/images/bruneton-algorithm32-production-default-stack.png`)
is 640 by 1,416 pixels and has decoded RGBA SHA-256
`3153ce0d39e1c03527d1a919e5d0ec0e827b571dd1a68d9621d3aa2c7dde477f`.

| Scene | Production Algorithm32 decoded RGBA SHA-256 |
| --- | --- |
| 06h00 / z87 | `cdfbb18ebd96260f48db5989e5e03556293452222bcb1617081e0e7d0c6dae4f` |
| 10h15 / z41 | `3df789bbdf645183c9bbbaad5c77258da2b7b51566f6a43c2ecc8ddcbaf27876` |
| 11h15 / z31 | `c80e5b73c74ab9d0a5bfbda1cbf34891cbbef38b1b1472a28e96989efe13c0ad` |
| 13h15 / z21 | `70010bfbdf91aff787ef0f0b43505624600c8f82083d1f12d10899ba3509acd5` |

All 11 declared source, input, cache, image, compositor, and container checks
pass. The terminal manifest covers 25 artifacts, verifies without a
discrepancy, and has SHA-256
`d1cc54004a619d86fa8c4bd8a1a494c7edd623f71cbad9fa2b2783d2ea4040a1`.

## Accepted Archived Focused Test Evidence

Sealed run `000073` (archive path
`scripts/algorithm32-star/runs/000073-node-test-suite/report.md`)
passes 34 of 34 current deterministic tests with no failures, cancellations,
or skips. Its explicit allowlist covers the pinned production snapshot,
production transport and output adapter, Figure 1 scene mapping, two-column
compositor, Kider condition/direction mapping, native-to-benchmark spectral
projection, and immutable run-record mechanics. Historical Algorithm32*,
Bruneton-`J2`, flat/local, browser, and GPU tests are intentionally outside
this current suite.

The run's eight-artifact terminal manifest verifies and has SHA-256
`ec5b72e2d879384419adb50aea185fee5f6697c2c299bfa7887b11a0e653dace`.

## Accepted Archived Benchmark Boundary

Sealed run `000074` (archive path
`scripts/algorithm32-star/runs/000074-production-algorithm32-kider-b1-b2-b3-boundary/report.md`)
evaluates the byte-verified production CPU Reference for all 17 Kider
conditions and all 81 canonical Bruneton directions. Each condition uses the
production Default `40/20/34/48` controls and a separately built
48-altitude-by-34-direction incoming-radiance cache. The run preserves 1,377
native 15-channel spectra, applies only the predeclared half-open
piecewise-constant projection to the paper's 40 wavelength coordinates, and
derives the first-31-sample `B3` cube mechanically.

All 11 declared checks pass: snapshot identity, complete condition and
direction coverage, exact row count, cache dimensions, native and projected
packet shape and finiteness, nonnegative radiance, cube shape, and equality of
run-local and promoted artifact hashes. The run's 17-artifact terminal
manifest verifies without discrepancy and has SHA-256
`4ec4f87441d802613c085e797a49fd717c1a207f1de1bb5f25bfce57a3c5ed6c`.

| Promoted artifact | SHA-256 |
| --- | --- |
| [`algorithm32-native-15.tsv`](../experiments/b1-directional-sky-radiance/algorithm32-native-15.tsv) | `b334f91cfcdfb3092a31082b32799e9aaadd13590db391c806187827700783a8` |
| [`algorithm32-proposed.tsv`](../experiments/b1-directional-sky-radiance/algorithm32-proposed.tsv) | `64a4ace30fd712ebdbe6c4386a7bcc495ec3f631f8ad12704e726a24bcbe97e7` |
| [`algorithm32-proposed-cube.json`](../experiments/b3-matched-atmosphere-solver/algorithm32-proposed-cube.json) | `eb9298b777ce5f374726f9c40e33be1b8085df6ed4d9a454518f7c7876d7b6be` |
| [`algorithm32-boundary-provenance.json`](../experiments/b1-directional-sky-radiance/algorithm32-boundary-provenance.json) | `04f9f9787093cf7788a0a0f87e94fb665b3d46d9c4e047cda2359d94042bdc79` |

Run `000074` proves the calculation and boundary identity, not measurement
agreement. `B1`, `B2`, and `B3` independently consume these promoted artifacts
and own their scores and conclusions under the predeclared rules.

## Visual Result And Claim Boundary

Visual inspection found all four rows, both columns, labels, fisheye
boundaries, and source orientations intact. The production Algorithm32 domes
have smoother fields and omit the red source cross and black direction marks
present in the published panels. The two columns follow a similar broad
directional and color progression while retaining visible differences in
brightness, chromatic distribution, and spatial structure.

Run `000069` is accepted as a reproducible qualitative artifact. It does not
claim pixel equivalence, perceptual indistinguishability, agreement with
measured sky radiance, independent physical accuracy, or that Figure 1
validates the 34-direction Default profile. The comparison does not satisfy:

- `B1` Directional Sky-Radiance;
- `B2` Hemispherical Sky-Irradiance; or
- `B3` Matched-Atmosphere Solver Benchmark.

Run `000074` now supplies their production Algorithm32 candidate boundary, but
those mandatory experiments still own their published inputs, metrics,
scoring, and conclusions.

The historical design and output interpretation were owned by archived topic
document
`agents/topics/initialization/algorithm32-star-bruneton-dome-comparison.md`.

## Historical Research Records

The old records remain immutable and auditable, but none is a dependency of
the current production comparison:

| Historical lane | Retained runs | Current claim boundary |
| --- | --- | --- |
| Flat/local Bruneton-derived CPU and GPU caches | `000029` through `000040` | Provisional engineering feasibility and conformance only; abandoned as a current cache design. |
| Flat Algorithm32*/Bruneton visual stack | `000046` archive report | Rejected as a controlled current comparison because it changed geometry, source, controls, cache, and output policy. |
| Historical Step-032 Algorithm32 parity | `000065` archive report | Exact historical `20/10/17/24` fixture preservation; not the production Default profile. |
| Selected Bruneton-`J2` GPU conformance | `000066` archive report | Selected-node binary32 conformance for the abandoned substitution only. |
| Exact-query Algorithm32* probes | `000067` archive report | Demonstrates the isolated historical second-order difference; not current algorithm evidence. |
| Former broad harness suite | `000068` archive report | Historical test coverage superseded by the focused accepted suite in run `000073`. |

Their terminal manifests and reports remain the canonical owners of their
exact inputs, hashes, results, and limitations. They must not be restated as
support for the production `34x48` incoming-radiance cache, run `000069`, or
the Kider boundary in run `000074`.

## Retained External And Source Material

- [Bruneton Figure 1 author-source
  panels](../../downloads/bruneton-clear-sky-models-arxiv-1612.04336/ATTRIBUTION.md)
  and their [metadata](../../downloads/bruneton-clear-sky-models-arxiv-1612.04336/metadata.json)
- [CIE 1931 2-degree color-matching
  data](../../downloads/cie-1931-2deg/CIE_xyz_1931_2deg.csv) with
  [attribution](../../downloads/cie-1931-2deg/ATTRIBUTION.md)
- Commit-pinned production Reference snapshot manifest at archive path
  `scripts/algorithm32-star/src/production-reference/snapshot-manifest.json`

The accepted E8 pre-implementation result remains separately owned by
[E8 Spectral-to-RGB Boundary
Correctness](../experiments/e8-spectral-to-rgb-boundary-correctness/result.md).
