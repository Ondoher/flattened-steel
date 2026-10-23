# Original Bruneton atmosphere restoration

Status: complete. Original Bruneton medium and matching cache are the local app
default in both modes as of 2026-10-22; served GPU verification passes. The owner rejected the live
H2400 appearance. No further atmosphere search or experiment reopening is selected.

Current cache coverage and deployment are owned by the [10 km elevation record](ten-km-elevation.md).
The restoration package below remains preserved; its physical/numerical values
are unchanged by that extension.

## Physical selection and unchanged behavior

Both modes use the canonical Bruneton atmosphere: aerosol scale height 1200 m,
Angstrom alpha 0.8 and beta 0.04, single-scattering albedo 0.8 and Cornette-Shanks g 0.7.
Molecular properties remain canonical. Cache construction and live transport share
the same factory. H2400, zero-aerosol and all experiment evidence remain intact.

Globe Native48/F68/Native15/N4, corrected60-sun035, anchored-radial geometry,
monotone-cubic solar lookup, Q30 view integration, display behavior and on-demand
rendering remain unchanged. Compact flat retains its existing Native15/N1 default
and transport policies. Complete observer support through 2 km and cubic halo rows
are retained. The older full-aerosol package predates this horizon coverage fix,
so a new complete package was generated. Removed policy-only gates stay removed.

[Input proof](../../../../.codex-tmp/flat32-bruneton-restore/input-proof.json)
requires exact canonical constants and all 15 coefficient channels. It verifies
unchanged numerical inputs, domains and complete 5607-row coverage after only the
medium is substituted. No new Bruneton RMSE measurement is claimed.

## Restoration build and local activation evidence

Package `1edb5237d6ecaa161225e4b76892e996071acba47a524a82dc34e584e2931ec7`
contains 729387605 bytes, 90 blocks and 109 verified solar scenes. Generation,
compression and complete reconstruction verification took 404556 ms (6.74 minutes)
on the RTX 2060; measured peak Node RSS was 275107840 bytes. Report 3682 bytes,
SHA-256 `d995b259539895acadefe2fcdc0c29a14fe429214ec5f80f78e5e4eb4d511445`.
The full accepted run is
`tmp/production-algorithm32/distant-sun-shared-block-cache/runs/2026-10-23T04-34-30-381Z-5e74ebc2-8377-445d-a004-beae4186f097/`.
The UTC run identifier does not change the local 2026-10-22 decision date.

[Package result](../../../../.codex-tmp/flat32-bruneton-restore/package-result.json)
and [activation](../../../../.codex-tmp/flat32-bruneton-restore/activation.json)
retain generation, publication, installed app and matching server selection
identities. The app built through maintained Polylith tools; the existing Worker
format and implementation remain unchanged. All 9 compiler checks, 14 focused
browser checks and 8 server checks pass. App and compiler type checks pass.
[Final verification](../../../../.codex-tmp/flat32-bruneton-restore/final-verification.json)
authenticates the installed app files and actual HTTP-selected package. All nine
served GPU captures pass with canonical constants in both modes, zero page/WebGL
errors and stable idle frame counts. The globe views cover noon and sunset at
5 m/2 km, including a clean 2 km sunset horizon without the old black strip. Flat views
cover San Jose at 5 m/2 km and Union Glacier low Sun. Native app display adaptation is
retained in every capture.

[Scene gallery](../../../../.codex-tmp/flat32-bruneton-restore/live-scenes-02/comparison.html)
and [scene observations](../../../../.codex-tmp/flat32-bruneton-restore/live-scenes-02/result.json)
retain the exact controls and GPU state. The first capture attempt hit the tool's
default 30-second navigation timeout without an app page error; the successful
retry waits for document/app readiness. Earlier output is preserved. The owned
verification browser and server are closed. Standards reviewer calibration remains
stale; no standards-compliance result is claimed or used to block this update.

## Preservation and rollback

Sky Aerosol Properties remains ended; ARM Spectral Validation and Sky Accuracy
Dials remain suspended. Previous packages and protected evidence are unchanged.
Evidence and rollback sources are below `.codex-tmp/flat32-bruneton-restore/`.
To restore H2400, restore both saved source files to their original app-atmosphere
and server-selection paths, rebuild the app, restart the local server and verify
the loaded package. Preserve old package bytes and always pair the cache with its
matching medium. No remote deployment or push occurred.
