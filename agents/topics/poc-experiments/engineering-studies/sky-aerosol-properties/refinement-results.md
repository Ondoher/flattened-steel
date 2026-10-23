# Aerosol refinement execution

Status: active. The owner selected the reviewed refinement plan for independent
execution. Production source, selected cache and earlier evidence remain read-only.

## Current boundary

M1 authenticated the completed N1 screen and executed the two-ray spherical
libRadtran and single-band GPU pilots (00004/00005). The full-band observation
in 00006 exposed an experimental view-shader constant-reuse bug; its multi-band
output is invalidated, preserved and excluded. The corrected observer recreates
its wavelength-dependent shader for each channel. Production recurrence is unchanged.

Run 00007 is collecting repeated external Native15 references. Run 00008 is the
eleven-profile N1 screen. At fixed aerosol column, H=1800/2400 m initially raises
away-horizon N1 luminance by about14%/23%, with negligible near-Sun loss. These are
first-order sensitivities; M1 qualification and conditional M3 remain open.

The frozen controls, numerical gates, glow guard and adaptive scope are owned by
[the plan](refinement-plan.md). The first campaign remains owned by [results](results.md).

## Decisions

- Preserve every earlier run and existing dirty production change.
- Keep new implementation, output and solver work within this experiment's roots.
- Use the installed external solver; its availability does not qualify accuracy.
- Treat order limits, numerical error and atmospheric changes separately.

## Verification and checkpoints

Pending the first milestone. No follow-up execution checkpoint has been made yet.
