# Production And Candidate Noon Horizon Capture

The Q5 capture completed as accepted `00013-q5-noon-capture`. These are actual images from the unchanged production Flat32 renderer, with a separately GPU-built candidate atlas. They are not swatches or an interpolation of the earlier nine witness rays.

- [Side-by-side comparison](../../../../../tmp/experiments/sky-angular-quadrature/runs/00013-q5-noon-capture/comparison.png): production left, candidate right.
- [Full production image](../../../../../tmp/experiments/sky-angular-quadrature/runs/00013-q5-noon-capture/production-noon.png).
- [Full candidate image](../../../../../tmp/experiments/sky-angular-quadrature/runs/00013-q5-noon-capture/candidate-noon.png).
- [Production facts](../../../../../tmp/experiments/sky-angular-quadrature/runs/00013-q5-noon-capture/production.json) and [candidate facts](../../../../../tmp/experiments/sky-angular-quadrature/runs/00013-q5-noon-capture/candidate.json).

## What The Images Show

At this cross-Sun solar-noon view, the candidate retains the blue-to-gray horizon gradient and appears slightly darker near the horizon. It does not produce the desired whitening in this view. This is a visual observation, not an independent physical accuracy verdict. It does not discard the qualified angular integration or identify the remaining compensating calculation.

## Matched Capture

The ordinary San Jose solar-noon preset resolves to `2024-06-20T20:08:46.261Z`, solar zenith 13.890169 degrees. Each original PNG is 1024 by 768, with a 60-degree horizontal field of view, 46.826449-degree vertical field of view, five-degree upward pitch and camera heading 90 degrees from the Sun. The finite Sun is outside this diagnostic view. The comparison sheet displays the original captures at 768 by 576 each.

The production side consumes deployed package `9a30749c6d4e6c23d7a84839788c068133051fbbd9bd93d07de8b18a6ee432ec`. Its Native48/Native15, W27/Z180, no-ozone, black-ground, anchored-radial, source20/transport15 and monotone-cubic controls are authenticated against the package configuration. The fresh compiler input's numerical identity equals the deployed identity `sha256:afd1ae6a7d3e84a13d82e5f24a1fb8c12e485b7d60b09ec86e0e6a46e0f3ea80`. The shared package generator explicitly uses the receiver-local coordinate contract.

The candidate changes only the incoming direction inventory to the qualified horizon2048 rule, compiling all four orders at all 15 production wavelengths. It retains ordered Float32 accumulation and the canonical exact-seam W27 packet mapping. A separately owned atlas supplies the existing production shader through its cache facade; the original production atlas and all deployed bytes remain untouched. Camera, geometry, ordinary scene, receiver-light generation and P2 display state are held fixed. This isolates atmospheric cache lookup changes; candidate-derived receiver lighting or a new adaptation state is not being evaluated.

This is an adaptation of the angular rule onto production inputs. It is **not the exact Native51/Direct40/grass profile** whose B1 score was 11.785035. The [Q0-Q4 results](results.md) retain that separate benchmark meaning. These noon images neither assign a new B1 score to production nor promote the candidate.

## Checks And Cost

A fresh F68 N4 compilation at Native15 channel 7 reproduced 1,088 required-row source-density probes from the deployed cache with zero absolute or relative discrepancy. This checks one wavelength, not all production values. Candidate channel and packet hashes, required block identities, source graph, original tool identities and served production asset hashes are retained in the run. All output values passed finite/nonnegative checks and the actual shader frames reported zero WebGL errors.

Execution used the NVIDIA GeForce RTX 2060 through ANGLE/D3D11. Candidate computation and publication took 387.234 seconds; the complete run took 423.126 seconds (7.05 minutes), under its ten-minute allowance. The candidate atlas logically owns 429,981,696 bytes (410.06 MiB), separately from the original atlas and transient compute fields. This is not a cache package size or a measured whole-process memory peak.

Additional retained evidence is 8,122,504 bytes (7.75 MiB), within 16 MiB. Total lane evidence is 78,623,286 bytes (74.98 MiB), below 96 MiB. The browser and loopback host closed; the owned profile/scratch tree was removed. Scratch high-water was 252,715,267 bytes, below 1 GiB. The terminal seal and its inventory verify, and the local experiment type check passes.

The first invocation rejected an unnormalized trailing path separator before run allocation. Normalizing the deployment and Chrome paths fixed that ingress error; no failed run was relabelled or numerical result repeated. The completed capture retains its original source snapshots and terminal bytes.

Required mapped primary/audit review for this new capture implementation is owned by `.codex-tmp/review-standards/session-HeYEAL/validation.json`; its actual receipt determines implementation-completion state. Q0-Q4 review evidence retains its earlier scope.

## Twilight And Continuation

The owner wants to preserve **current production** twilight behavior. Keep that as a later adoption requirement; do not revert to a historical pre-angle cache to obtain a whiter noon horizon. This owner-selected run contains only solar noon, so it does not establish candidate twilight quality. Production code and operational assets remain unchanged. The candidate and its mathematical evidence remain available for continued diagnosis, and Sky Accuracy Dials remains suspended.
