# H2400 production atmosphere

Status: complete. Sky Aerosol Properties is ended; fixed-column H2400 is now the
local production app default in globe and flat/local modes. The
[completed plan](h2400-atmosphere-plan.md) owns the selected scope. No remote push
or deployment occurred. Refresh the app after its local server has reloaded.

## Selected result and limits

Aerosol scale height 2400 m, alpha 0.8, SSA 0.95, Cornette-Shanks g 0.85, and beta
0.010000000000138879 retain the finite 60 km column of combo025/H1200 beta 0.01.
The [experiment report](../../poc-experiments/engineering-studies/sky-aerosol-properties/refinement-results.md)
owns the physical selection and its scientific limits. Canonical library/paper
atmosphere defaults remain unchanged. This is a profile selection, not a new
numerical correction, paper RMSE result or universal measured-sky accuracy claim.

Globe numerics remain Native48/F68/Native15/N4, corrected60-sun035, anchored-radial,
monotone-cubic solar lookup and Q30 view integration. The compact flat app retains
its existing Native15/N1 default and local transport policies. No scattering-order,
quadrature, grid, display-model or source change was introduced by this promotion.
Both modes use the same selected medium for cache construction and live transport.
Observer support through 2 km and cubic halo rows are retained.

## Profile and configuration consistency ? M1 complete

The experiment closed with all 68 runs sealed, no owned job or scratch remaining,
and no temporary standards entries requiring removal. Permanent experiment
standards mapping and all evidence remain intact. Production topic and generated
standards guide were refreshed.

[Input proof](../../../../.codex-tmp/flat32-h2400/input-proof.json) authenticates the
preceding serialized request and coordinate coverage, compares all 15 spectral
extinction/scattering/absorption channels, phase and finite column with accepted
H2400 run 00063, and proves only aerosol fields change. Maximum relative extinction
residual is 2.22e-16. JSON serialization is the actual compiler boundary, including
signed zero; the earlier live-object/serialized -0 comparison is preserved.
The maintained compiler now accepts the complete aerosol constants; omission and
existing beta-only callers preserve their previous behavior. Finite negative
wavelength exponents are also accepted; an unnecessary nonnegative-exponent
restriction was removed and its focused configuration check passes.

Owner-directed operational policy is recorded in repository instructions. Compact
media are accepted by their actual two-exponential, spectral and geometric
requirements, rather than a list of previously qualified medium/family hashes.
Cache identity still records every actual physical input, preventing incompatible
reuse. Fixed generator disk/RSS/time vetoes are removed; measurements, cancellation
and optional caller-selected deadlines remain. Invalid physical input, unsupported
ozone column integration, malformed/incompatible formats, corrupted data and actual
GPU/IO failures remain operational errors. Review readiness and resource estimates
are reported without becoming arbitrary update vetoes.

## Complete shared-cache package ? M2 complete

Selected package:
`ccd1432c9647feab02f134288a9d2899f8d701182793f12361c1451de9f94970`.
It contains 738148763 bytes (703.95MiB), 90 blocks and 109 verified solar scenes.
Report 3870 bytes, SHA-256
`30545b387b3d66e1f828514af8d28a10ab5f77f1193c6980178bc867ecaa864c`.
[Package result](../../../../.codex-tmp/flat32-h2400/package-result.json) retains
source/tool/input identities and the complete derivation chain. All blocks round
trip exactly and all 109 reconstructions match the retained GPU fields.

The first build took 228891 ms (3.81minutes), including all 15 GPU wavelengths and
compression, then failed metadata validation because the new entry used duplicate
parent-role labels. The entry now uses distinct roles, checked before computation.
Packaging recovered in a new run from authenticated read-only fields using the
maintained finalizer/verifier; recovery took 256147 ms (4.27minutes). The failed run
remains unchanged. Total measured compute/packaging attempts took 8.08 minutes,
excluding app builds and scene checks; this is not a fresh-build benchmark.
The original RTX2060 WebGL2 execution records 155865600 peak live field bytes,
196200144 union accumulator bytes and 1119744 maximum readback bytes separately.

Future complete rebuild:

```text
node scripts/algorithm32/solar-zenith-cache/generate-flat32-shared-cache.js
```

## Activation and served app verification ? M3 complete

The app built through Polylith and the maintained Worker builder. The authenticated
package is published locally and selected by the production server. The
[activation record](../../../../.codex-tmp/flat32-h2400/activation.json) identifies
the installed app files and package selection. The
[final verification](../../../../.codex-tmp/flat32-h2400/final-verification.json)
reauthenticates installed files and the actual HTTP-selected package.

- 22 focused compiler/host tests pass, including early provenance-role validation.
- 7 compact profile tests pass, including varied compatible media and rejection of
  genuinely unsupported ozone columns.
- 14 focused scene-control browser checks and 8 server checks pass.
- Engine, Flat32 and shared-generation type checks and repository formatting pass.
- Nine actual served GPU captures pass with zero page/WebGL errors and stable idle
  frame counts: globe noon and sunset at 5 m/2 km; flat San Jose at 5 m/2 km and Union Glacier
  low Sun. Existing focused checks cover elevation cache/scene reuse.

[Scene gallery](../../../../.codex-tmp/flat32-h2400/comparison.html) includes matched
accepted-experiment/production Sun pairs. The 5 m noon pair is pixel-identical;
the 2 km pair differs by at most one color byte in 22 channels out of 2359296.
Those two pairs share the accepted 117791.53229198244 lux display adaptation.
Other captures retain actual app adaptation. The 2 km sunset view has no black
horizon strip, and flat low Sun retains a visible glow.

The first capture helper completed all six globe views, then incorrectly called
a globe camera method in flat mode. Its corrected flat helper initially inspected
a globe-only configuration property; the final separate helper uses compact
profile configuration and all three flat views pass. These were capture-tool
errors, with no app page errors; earlier attempts remain preserved. The flat-only
helper starts the same app in its existing flat0/N1 diagnostic preset to avoid
reloading a globe cache. No application implementation override was used.

The sandbox denied child-process spawning in initial compiler/server test attempts;
the authorized host runs pass. Standards reviewer startup remains unavailable
because global calibration is stale; no standards-compliance result is claimed.
This reported limitation did not block the owner-authorized compatible update.

## Preservation and rollback

All generated records remain below `.codex-tmp/flat32-h2400/` and the maintained
production generator?s new immutable run root. The experiment and earlier packages
remain unchanged. The [baseline](../../../../.codex-tmp/flat32-h2400/baseline.json)
records the preceding commit, selection and source identities. To restore the
preceding coherent zero-aerosol version, stop the local server, restore
`rollback-atmosphere.js` to `src/flat32/Flat32Atmosphere.js` and
`rollback-selection.js` to `server/flat32/features/shared-cache/selection.js`, rebuild
the app and Worker, then restart and verify the loaded identity. The exact preceding
built app also remains in `rollback-dist/`. Never pair a restored medium with the new
cache, or alter old package bytes. Owned verification browser/server jobs are closed.
