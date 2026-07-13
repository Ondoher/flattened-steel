# Active Topic

Current active topic: `algorithm32-solar-zenith-cache-design`.

Canonical entry document:
[Distant-Sun Solar-Zenith Cache Design](algorithm32/cache/solar-zenith-cache-design.md).

Candidate execution plan:
[Candidate Distant-Sun Branch-Integrated Solar-Zenith Cache Plan](algorithm32/cache/distant-sun-solar-zenith-cache-plan.md).

Implemented-baseline authority:
[Selected Scattering Cache Contract](algorithm32/cache/cache-contract.md).

Diagnostic evidence source:
[Spherical twilight cache-coordinate correction][twilight-coordinate].

## Immediate Focus

The project owner has paused the stellar screen-palette production port and
selected the spherical solar-zenith cache as the current architecture question.
The immediate deliverables are the canonical numerical design and its
distant-Sun contained execution plan. No numbered implementation phase has
started and production remains unchanged. One pre-phase contained geometry and
storage census is now accepted as run
`000498-san-jose-nautical-zenith-culling-memory`; it does not select a stored
semantic, grid, packing, or production change.

The focused San Jose nautical-twilight evidence establishes that:

- the current spherical/distant cache is a receiver-column field indexed by
  altitude and source-relative outgoing direction;
- it does not preserve actual-point `mu_s`, the cosine of local solar zenith;
- at the retained `-9.7568-degree` solar elevation every stored first-order
  observer-column node is Earth-shadowed;
- nonzero horizon radiance and the source-axis depression begin at second
  order;
- reflected Fibonacci-68 removes left/right imbalance but not the depression;
- the depression survives the combined F68/W39/ozone configuration, and the
  isolated W39-to-W77 camera-wide outgoing refinement does not materially
  change it;
- ozone changes the expected spectral extinction, while the isolated B1
  comparison and combined twilight evidence do not establish ozone as a
  topology repair; and
- the front/back control makes the strong feature source-facing rather than
  screen-fixed. Because the outgoing cache is itself source-relative, that
  control does not distinguish source physics from a source-relative cache
  defect; the separate W77 refinement only rules down the tested outgoing
  interpolation density; and
- accepted run `000497` preserves the exact ozone/F68/W39/N4 cache and adds
  only actual-point direct first-order radiance. Its converged three-ray
  control closes `97.20795%` of the source-axis center/flank deficit, strongly
  supporting missing solar-zenith/terminator state as the cause. This is a
  hybrid causal control, not a corrected J2--J4 cache.

No successor stored semantic or layout is selected. The documented
branch-integrated checkpoint, canonical-prefix, boundary-total, and
actual-point cumulative-local-density directions remain candidates under
discussion. The owner explicitly deferred a choice until their uncompressed
memory and accuracy consequences are measured.

Run `000498` answers only the first culling question for the exact run-`000493`
San Jose +1h Sun state, current Native48-v2 altitudes, production W27, a
hypothetical 180-center one-degree solar-zenith grid, and Native15 R32F. A
conservative altitude-interpolation-safe geometric ledger retains `617` of
`8,640` altitude/zenith blocks (`154.424171 MiB`, `92.858796%` below the full
`2,162.438965 MiB` rectangular payload), or `713` blocks with one extra angular
node on both sides (`178.451271 MiB`, `91.747685%` below full). If packing can
only retain complete zenith pages, the corresponding sets are 18 pages
(`216.243896 MiB`) or 20 pages (`240.270996 MiB`). These are exact geometry and
logical-byte counts, not spectral interpolation, N4 construction-closure,
physical-packing, universal-asset, or supported-hardware evidence.

Accepted rough screen `000500-native15-base-gain-delta-rough-study` now
measures one global Native15 normalized-shape dictionary with gain, shared
signed deltas, and direct int8/int16 residual controls over 3,991 labeled
downstream path-radiance spectra. It finds meaningful approximate redundancy,
but blocked weak-blue and cross-component transfer errors remain material; the
direct residuals trade much of the saving back and can reconstruct small
negative weak-channel values. The
[canonical design](algorithm32/cache/solar-zenith-cache-design.md#recorded-proxy-basegaindelta-screen)
owns the measurements and memory projections. This is a proxy plausibility
screen, not raw-cache evidence, a codec choice, or plan Phase 9 completion.

The plan is explicitly distant-Sun only. It may create reusable compiler,
Native15, manifest, paging, codec, and lifecycle machinery, but it selects no
finite/local-Sun coordinate shape or asset. Before its provisional layout
choice, it records one shape-impact audit: a fixed-geocentric-radius spherical
point source may preserve the distant tuple's axis count, while the implemented
Flat/dome two-center geometry may require a distinct family. Local
implementation and accuracy still require a later independent design after the
distant field is qualified.

Runtime memory, not offline construction time, is the governing resource
constraint. The design therefore permits higher offline resolution around the
terminator, view horizon, source-relative depression, and near-ground radial
boundary. It keeps Native15 spectral semantics through atmosphere and
celestial composition; RGB is not a cache representation.

The immediate decision remains pre-limit memory quantification. No steady,
transition, construction, disk, or driver-memory ceiling is selected. The next
evidence must determine whether the geometrically culled one-degree zenith
support is spectrally accurate and whether an actual N4 compiler can emit the
same subset, then measure physical packing, staging, and named-hardware driver
allocation before any limit can constrain a layout.

Approximate cross-page, cross-checkpoint, and spectral redundancy remains
plausible. In the recorded proxy census, the only repeated exact vector is the
run-`000471` N1 zero; exact duplicates in a raw successor field remain
unmeasured. Uncompressed Native15 chunks are the correctness baseline. Shared
linear bases, global spectral dictionaries, key-page residuals, symmetry,
seam deduplication, and reduced precision remain separate measured codec
candidates.

The previous active topic remains preserved in the
[Stellar Screen-Palette Production Port Plan](extraterrestrial/stellar-screen-palette-production-port-plan.md).
Its production work does not resume by implication from this cache design.

## Minimal Reload Sources

Read these files in order and no others during bootstrap:

1. [Repository workflow instructions](../../AGENTS.md)
2. [Solar-zenith cache design](algorithm32/cache/solar-zenith-cache-design.md)
3. [Distant-Sun zenith-cache plan](algorithm32/cache/distant-sun-solar-zenith-cache-plan.md)
4. [Algorithm32 scattering-cache topic](algorithm32/cache/README.md)
5. [Implemented cache contract](algorithm32/cache/cache-contract.md)
6. [Twilight cache-coordinate evidence][twilight-coordinate]

[twilight-coordinate]: extraterrestrial/celestial-contribution-cache-design.md#spherical-twilight-cache-coordinate-correction
