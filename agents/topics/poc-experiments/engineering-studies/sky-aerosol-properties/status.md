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

Independent execution is active. [Refinement results](refinement-results.md) owns
all current findings, gate decisions and verification limitations.

- 00008: completed eleven-profile N1 screen and actual GPU fields.
- 00009/00010: corrected68-direction order observations and gallery.
- 00014/00015: completed fixed-material path and angular diagnostics.
- 00016: completed higher-sample independent Native15 order reference.
- 00020/00024: full272-direction baseline observations and gallery.
- 00025/00026: H2400 full272-direction observations and gallery.
- 00018: direct N1 controls across protected conditions.
- 00023: active serial GPU continuation; independent H2400/baseline probes at
  noon5m, noon500m/2km, and15° Sun. It reuses00020 after the00019 orchestration
  attribution failure; the completed baseline was preserved.
- 00007/00021/00022: active external baseline repeats, H2400 confirmation and
  fixed-seed layer refinement. 00017/00028 completed external N1 photon controls.

00006 remains invalidated for its wavelength-constant observation bug;00013
remains failed for the production120-interval admission contract. The executable
diagnostic fixes and all source changes remain inside the experiment boundary.
New code type checks. Recovery checkpoint b00c7f40 preserves the earlier app work,
first campaign and initial follow-up setup. No production setting changed here.

## Blockers

None recorded.

## Next Action

Finish the00023 condition probes and external references. Derive the per-ray
uncertainty/gate report with refinement-analyze.mjs, then run the bounded H1800
compromise check recorded in refinement-results.md. Preserve conditional early
rejections and report every unqualified condition; production promotion is separate.
