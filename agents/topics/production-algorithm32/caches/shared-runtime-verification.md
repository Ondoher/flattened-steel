# Shared Runtime Verification

P6 integrates the shared packet shader, stable cache attachment, and Flat32
observation updates. P7 owns complete rendered-control comparison, live route
timing, fault injection, target admission, and the final review ledger before
any deployment selection changes.

The shader preserves the four hardware-filtered RGBA reads and Native15
arithmetic. Only altitude-ledger and packed-row addressing change. A stable
attachment supplies complete opaque texture bindings and scene/dark uniforms.
Flat32 prepares the next cache and receiver-light measurement while the prior
scene remains visible. At one frame boundary it publishes the cache, physical
Sun and geometry, celestial observation, receiver and endpoint lighting, and
shadow refresh. Observation-only changes reuse the mode and installed shader;
other application configuration changes retain ordinary runtime replacement.
Prediction refills after publication when obsolete visible pins constrained
the next window. Failure and cancellation preserve the previous publication.

## Resolved Internal Conflicts

The catalog's ordinal 108 represents input angles in `[107.5,108)`, so it must
remain illuminated. Darkness begins at the input angle 108, represented by an
explicit `null` scene selection. P6 corrects the earlier P1/P5 ordinal boundary.

WebGL validates active sampler types even when the dark shader branch skips
their reads. A stable program therefore retains 36 bytes of typed zero sampler
placeholders in darkness. The dark publication itself contains no cache-data
atlas or metadata; the previous data allocations are released. This preserves
the intended zero-scattering result without recompilation or retaining a
429,981,696-byte data atlas.

## Focused Evidence

- One Chrome GPU probe passes exact Native15 values through row 63/layer 23
  for ordinals 0 and 108, then proves zero dark output and no GL error after
  releasing data textures. Program count remains unchanged.
- Fifteen focused Flat32 checks pass, including actual source/geometry
  staging, one-runtime observation changes, configuration replacement,
  failure preservation, cancellation, frame publication before rendering,
  and the existing affected context lifecycle.
- Eleven controller checks pass, including the final illuminated ordinal.
- The immutable P2 metadata graph authenticates all 114 artifacts and
  2,374,864 bytes. An independent coordinate oracle accepts all 70,756 rows
  across 109 ready scenes plus explicit darkness in 2.09 seconds.
- Flat32 type checking passes, including its Algorithm32 dependencies.
- One focused changed-code review reports no actionable defects. Complete
  cross-cutting review and integration evidence remain in P7.

The numerical generator and authenticated spectral representation are
unchanged. Reuse [P2's all-control evidence](shared-generation-qualification.md).
