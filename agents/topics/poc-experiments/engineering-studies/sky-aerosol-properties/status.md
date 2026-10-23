# Sky aerosol properties Experiment Status

Status: active; first campaign complete and verified.

The [follow-up refinement plan](refinement-plan.md) is ready after its independent
plan critique and is now selected for independent execution. It covers N1–4 confirmation, fixed-column
vertical/spectral changes, finer loading and SSA, followed by conditional finalists.

## Current State

The owner selected a contained aerosol-properties experiment. Source, topic and
ignored output roots are established. The first campaign isolates SSA, loading
and Cornette–Shanks shape with independent N1 spectra and hardware GPU images.
Production source/settings and suspended studies remain read-only. The combined
25% loading/SSA0.95/g0.85 setting is a promising noon N1 lead, not a production
selection. Lower-Sun checks of simpler settings also show that reducing aerosols
can make the horizon warmer, so absorption is not a complete explanation.
[Results](results.md) owns all milestone reports, values, image links and limitations.

Standards restoration provenance: inherited `experiments/` -> `experiment` set;
no more-specific folder assignment, temporary set or overlay was added. There is
nothing experiment-specific to remove on suspension. Dedicated reviewers/audits
are disabled; checkpoint-advisor monitoring remains active.

## Latest Verification

- Scaffold structure created.
- Type-check configuration: `experiments/sky-aerosol-properties/jsconfig.json`.
- Output root: `tmp/experiments/sky-aerosol-properties/`.
- Accepted transport: `runs/00001-property-refine/` below the output root.
- Accepted verification: `runs/00002-verify-report/`.
- Accepted image/spectrum report: `runs/00003-visual-report/`.
- Preserved pilot: `runs/00000-property-screen/`, deliberately interrupted and failed.
- Local type check passes; 420 ray spectra and 42 GPU fields are qualified.

## Refinement execution boundary

The owner selected independent execution. Runs 00004 and 00005 completed the
two-ray external and single-band cache pilots. Run 00006 retains an invalidated
multi-band observation: its experimental view shader incorrectly retained the
first wavelength's attenuation constants. Production recurrence was unchanged.
The query shader is now recreated for each band. The affected observations will
be repeated in a new run; no multi-band conclusion uses 00006.

Run 00007 is collecting repeated Native15 spherical libRadtran spectra. Run 00008
is collecting eleven fixed-column N1 configurations, including actual GPU fields
and tangent-frame halo checks. Initial H=1800/2400 m measurements brighten the N1
horizon without meaningful solar-glow loss; full-scattering interpretation and
independent N4 qualification remain pending. The next GPU task repeats the corrected
cache observations, then runs the independent higher-order probe. New code type checks.

## Blockers

None recorded.

## Next Action

Execute the saved follow-up plan. Its first step authenticates
the existing evidence, registers complete `combo025` inputs and pilots two
higher-order reference rays before building the first N1–4 cache. No confirmation
campaign or production promotion has been executed here.
