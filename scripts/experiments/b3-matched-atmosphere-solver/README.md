# B3 - Matched-Atmosphere Solver Benchmark

Current production B3 consumes the 31-channel cube derived from the same
asset-backed J4 B1 run and its same-run B1 report. Use the combined
`score:algorithm32:b1-b3-production` command with a fresh P8 `--output-root`.
The [2026-09-10 result](../../../agents/topics/poc-experiments/benchmarks/production-b-family-c1-9-result.md)
is favorable and consistent for B3; the separate B1 closeout ceiling fails,
so no accepted combined score record was published.

This experiment adopts the published libRadtran result from Eric Bruneton's
clear-sky comparison, with comparison source revision
`4df2ec6609bc0127a478bd34fff29c94352579cc` pinned as pedigree. It is independent
of production Algorithm32. No libRadtran execution is required. The runner can
optionally reconstruct the matched boundary with a user-supplied libRadtran
2.0.1 `uvspec` executable as a diagnostic cross-check; it does not link,
import, or redistribute libRadtran code.

The benchmark has five scientific stages which are intentionally not
interchangeable:

1. contract verification checks the pinned atmosphere, geometry, axes,
   inherited libRadtran defaults, scoring formula, and 550-case grid;
2. published-reference adoption records the paper's 550-case minimum and
   refined result as the external authority;
3. optional fixed-case execution generates or consumes all 17 published-parameter
   libRadtran results at `alpha=0.8`, `beta=0.04`, and `g=0.7`;
4. optional coarse-search cross-check consumes all 550 externally computed RMSE rows
   and checks that the published parameter triple is the published minimum;
5. candidate scoring independently compares the unchanged Algorithm32 Default
   cube and the Algorithm32 J2, J3, J4, and J5 n-order-cache cubes with the same Kider
   measurement boundary, placing each RMSE beside the paper's published
   libRadtran score after that candidate's mismatch map and pre-result judgment
   record are supplied.

The paper and pinned comparison source are sufficient authority for the
published result; rerunning 9,350 solver conditions is not an acceptance gate.
B3 is accepted after the published reference is pinned and the proposed method
has been scored against the shared measurements under predeclared rules. A
sample-by-sample locally regenerated libRadtran cube is not required. Optional
local solver runs remain useful provenance and regression cross-checks.
Acceptance records the proposed score; it does not mean the score was favorable.

Algorithm32 Default remains the unchanged comparison baseline. Algorithm32 J2,
J3, J4, and J5 are separately generated and scored n-order-cache candidates. B3
verifies each candidate against its exact candidate-labelled B1 aggregate
within the predeclared `0.000001` tolerance and checks that candidate's nine
required mismatch declarations. The canonical closeout requires all five
candidates.

## Commands

For a current-production run, use the combined scorer documented by B1. The
standalone equivalent binds all five candidate cubes from one backend-identified
generation manifest and the B1 report produced from that same run:

```powershell
node scripts/experiments/b3-matched-atmosphere-solver/run.js `
  --production-run references/results/experiments/b1-directional-sky-radiance/cpu `
  --b1-result references/results/experiments/b1-b3-production-scores/cpu/NNNNNN-current-production-b1-b3-cpu-reference/b1-result.md
```

The production cubes are deterministic 31-wavelength reductions of the exact
40-channel tables consumed by B1 and B2; they are not a separately generated
candidate boundary.

Run the contract and harness tests:

```powershell
node --test --test-isolation=none scripts/experiments/b3-matched-atmosphere-solver/run.test.js
```

Write the current staged status without inventing unavailable inputs:

```powershell
node scripts/experiments/b3-matched-atmosphere-solver/run.js --save
node scripts/experiments/b3-matched-atmosphere-solver/run.js --canonical --save --require-complete
```

Run all 17 fixed cases with a native executable:

```powershell
node scripts/experiments/b3-matched-atmosphere-solver/run.js `
  --uvspec C:\path\to\uvspec.exe `
  --save
```

A POSIX path is treated as a WSL executable path. Use `--wsl-user` only when
the executable is deliberately installed for a named non-privileged WSL user:

```powershell
node scripts/experiments/b3-matched-atmosphere-solver/run.js `
  --uvspec /home/user/libRadtran-2.0.1/bin/uvspec `
  --wsl-user user `
  --save
```

Instead of running the solver, `--external-output DIR` consumes raw files named
`09h30.out` through `13h30.out`, and `--reference-cube FILE` consumes an already
normalized cube. `--require-complete` makes an incomplete scientific run exit
with a nonzero status; malformed or inconsistent supplied data always fails.

When a complete fixed reference is available, `--save` writes both `result.md`
and `libRadtran-reference-cube.json` to the durable B3 result directory. The
report records the cube's SHA-256 digest. `--reference-result FILE` overrides
that artifact path. With `--production-run`, the result directory is selected
as `references/results/experiments/b3-matched-atmosphere-solver/cpu/` or its
`gpu/` counterpart from the validated manifest. `--output-root PATH` changes
the experiment-tree parent without removing the backend subdivision.

## Cube contract

Measurement, libRadtran, and proposed cubes use JSON schema
`b3-directional-spectral-radiance-cube-v1` and units
`W m^-2 sr^-1 nm^-1`. Each cube contains:

- the 17 conditions from 09:30 through 13:30 on 2013-05-27;
- the 81 pinned Shirley-Chiu directions in source order;
- the 31 Bruneton samples in the 360--720 nm scoring interval; and
- `values[condition][direction][wavelength]` with shape `17 x 81 x 31`.

The runner rejects changed axes rather than silently resampling them. Its RMSE
is exactly
`sqrt(sum((candidate-reference)^2)/(17*81*31))`; per-condition rows use the
same formula over `81*31` samples.

For measurements, `--measurements` also accepts B1's independently processed
tab-separated boundary file: `time`, `grid_x`, `grid_y`, followed by the 40
Bruneton wavelengths. B3 consumes the first 31 columns selected by the paper's
360--720 nm predicate and does not import B1 runner code.

## Coarse-search and proposed inputs

`--coarse-results FILE` optionally cross-checks the published search. It expects
either an array or `{ "cases": [...] }`. Every row contains `alpha`, `beta`,
`g`, and `rmseMilliwatt`; all 550 unique grid points are required for that
cross-check.

`--proposed-cube FILE` additionally requires:

- `--measurements FILE`, containing the complete Kider boundary on the same
  axes; the proposed RMSE is computed against these measurements and compared
  with the paper's published libRadtran RMSE;
- `--mismatch-map FILE`, whose JSON object has a `mismatches` array with a
  `field` and `disposition` for each mismatch. The Algorithm32 closeout
  requires the nine declared model-difference fields and rejects omissions,
  duplicates, or blank dispositions; and
- `--judgment-rules FILE`, whose JSON object has
  `declaredBeforeProposedResults: true` and a nonempty `rules` array.
- `--b1-result FILE` for closeout classification, containing the durable B1
  candidate-labelled aggregate used to verify the required B1/B3 consistency.

Algorithm32 J2 through J5 use parallel order-labelled flags: for order `N`,
`--proposed-jN-cube`, `--jN-mismatch-map`, and `--jN-judgment-rules`. The same
`--b1-result` report must contain the exact stable lines
`Candidate aggregate RMSE [Algorithm32]`,
`Candidate aggregate RMSE [Algorithm32-J2]`, and
`Candidate aggregate RMSE [Algorithm32-J3]`,
`Candidate aggregate RMSE [Algorithm32-J4]`, and
`Candidate aggregate RMSE [Algorithm32-J5]`. The historical
`Proposed aggregate RMSE` line remains a Default-only compatibility fallback;
it is never accepted for an order-labelled candidate.

These inputs prevent unsupported physical mappings and post-result threshold
selection from being hidden by a single aggregate number. `--reference-cube`
is optional and is used only to cross-check the locally reproduced libRadtran
score; it is not an input to proposed-method acceptance.

The proposed and published libRadtran values are both RMSEs against the same
Kider measurements. They are not a pointwise residual between the two models.
The paper fitted the reported aerosol parameters to those measurements, so the
comparison is in-sample and does not establish out-of-sample accuracy. When B1
uses the same proposed cube, B3 repeats its aggregate observable; B3's distinct
role is to preserve the fuller-solver pedigree and the matched-input/mismatch
analysis.

The `--canonical` closeout command supplies all five durable candidate cubes,
the shared measurement boundary, all five mismatch maps, all five rule
records, and the B1 result; no libRadtran execution or 550-case rerun is
required.
