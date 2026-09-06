# Color Reset Runners

This directory owns thin, focused CR0-CR8 entry points. CR1 remains the
accepted shape-matched visual baseline. CR2 is implemented and accepted by
immutable run `000007-available-light-inventory`, with artifact-set SHA-256
`dcd6cdd8146094d05427ad180af7fccefdbaa67e290d1b5f21e6a0d4b03697ba`.
It wrote seven 4096-direction Native15 fields and all four requested figures
before gates, and its 41-record artifact set independently verifies.

CR3 is implemented and accepted by immutable run
`000011-neutral-geometry-ambient-proof`, with artifact-set SHA-256
`6d3c23060973e14e325e1fb87d28d1e61efe9a445f2fe57c101d2db04eb0d8a5`.
Its independently verified 57 artifacts total `52,550,399` bytes and include
all 15 PNGs, four raw linear RGBY fields, and one R8 geometry mask. The first
image completed in `5.988` seconds and the plate in `6.429` seconds. The proof
covered 565 vertices per scene, exact Native15 spectral additivity, a strictly
falling diffuse-and-total plane sequence, exact-zero direct response at sunset
plus ten and sixty minutes, and exact persisted-RGBA sky replay outside the
geometry mask. It introduced no new Color operation. CR4 global achromatic
twilight sweep is the next runner increment.

Run `000006-available-light-inventory` remains sealed and failed solely because
its annotation border changed the immutable parent's last column. CR3 run
`000008` failed during sandbox browser launch, run `000009` failed during
harness initialization, and run `000010` was rejected because its independent
reader used a different float32 tolerance policy than the declared gate. These
four runs make no accepted result claim.

Every runner must:

1. initialize through `../harness/color-reset-run-record.js` before any
   calculation, render, browser launch, or GPU work;
2. derive all roots from repository identity and reject links/reparse points;
3. inventory `src/algorithm32` and `src/flat32` before and after execution;
4. write every requested PNG before evaluating appearance or metric gates;
5. finalize once as accepted, rejected, failed, or interrupted; and
6. leave retries and derivatives to the next automatically allocated number.

Do not place an experimental test tree or test-framework dependency here.
