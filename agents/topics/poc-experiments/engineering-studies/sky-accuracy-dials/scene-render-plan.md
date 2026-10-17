# H53 Matched Scene Capture

Selected by the owner on 2026-10-17: render the complete scene before and after
the combined H51 diagnostic intervention. This extends completed H48-H52; it
does not promote its diagnostic changes or select another numerical campaign.

## Capture Contract

- Use the unchanged Flat32 production renderer, spherical distant Sun, San Jose
  solar noon, a 1024 x 768 viewport, horizontal FOV 60 degrees, camera pitch
  5 degrees and heading 180 degrees away from the Sun.
- Render two separate matched pairs: the actual canonical production atmosphere,
  and the registered Toronto phase/SSA intervention above 440 nm. The latter
  retains original aerosol extinction and is not a complete measured Toronto
  atmosphere. Never compare different atmospheres as a before/after pair.
- Baseline: production F68, Native48/Native15, transport15. Candidate: exactly
  the same controls with transport60 and discrete aerosol phase-mass
  normalization at every higher-order scattering pass. Leave source attenuation
  integration, view integration, all optical inputs within each pair, camera,
  receiver lighting and production display unchanged.
- Build complete recurrence fields for all 15 wavelengths on the hardware GPU,
  extract every required scene-atlas value, and upload separate transient atlases.
  No production source or deployed cache writes. Retain J1 invariance and
  canonical fresh-baseline/deployed-cache parity witnesses.
- Keep atlas packets transient. Retain full-scene PNGs and side-by-side images,
  compiler/control/source identities, packet hashes, progress, tool identity and
  exact derivation in new immutable runs under the experiment's declared output
  root. Preserve all prior runs. One GPU job at a time; 15-minute guidance per
  pair, monitored progress, normal scratch cleanup and storage limits apply.
  The first full pair took about 12 minutes. The Toronto pair uses a 30-minute
  outer execution allowance so steady progress can continue beyond the guidance;
  it also releases baseline totals after packing to reduce retained memory.

## Verification And Handoff

The coherent implementation unit is `distant-horizon/scene-*` and these owning
topic documents, starting from Git `fb394e56`. Reuse the authenticated previous
full-scene capture pattern read-only. Self-review, local type checking, image
inspection, run verification and checkpoint advice remain applicable; no
dedicated standards reviewers or audits.

Inspect both panels, quantify image changes, and link the full-sized captures.
Report canonical and Toronto effects separately. This scene evidence does not
qualify paper RMSE, twilight, other locations, local Sun or production adoption.
