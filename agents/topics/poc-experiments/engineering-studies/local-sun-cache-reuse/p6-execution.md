# Creative P6 Film Execution

Preserved v4 delivery: the continuous 90-second 1080p film is recorded and passes
its full decoded-media qualification. The owner liked v4 and selected the
[current shadow revision](p6-shadow-revision.md), whose v5 native 4K delivery is
media-qualified and accepted by the owner. This record retains v4's
measurements, decisions, recipe and review scope; the current plan and revision
own subsequent composition changes. v4 implementation completion is governed
by the source-review receipt below;
neither an accepted media run nor this document substitutes for that gate.

## Delivery

- [Native 1080p MP4](../../../../../tmp/experiments/local-sun-cache-reuse/runs/00754-p6-film/native.mp4): 121.57 MB, 90 seconds, 30 fps, silent AVC.
- [Compact 960 by 540 review copy](../../../../../tmp/experiments/local-sun-cache-reuse/runs/00756-p6-film-report/review.mp4): 4.71 MB.
- Lossless controls: [opening](../../../../../tmp/experiments/local-sun-cache-reuse/runs/00754-p6-film/milestone-0.png), [far Sun](../../../../../tmp/experiments/local-sun-cache-reuse/runs/00754-p6-film/milestone-300.png), [near Sun](../../../../../tmp/experiments/local-sun-cache-reuse/runs/00754-p6-film/milestone-1350.png), [return](../../../../../tmp/experiments/local-sun-cache-reuse/runs/00754-p6-film/milestone-2400.png), [exact endpoint](../../../../../tmp/experiments/local-sun-cache-reuse/runs/00754-p6-film/endpoint90.png).
- [Frozen recipe](../../../../../tmp/experiments/local-sun-cache-reuse/runs/00754-p6-film/recipe.json), [capture inventory and hashes](../../../../../tmp/experiments/local-sun-cache-reuse/runs/00754-p6-film/manifest.json), [decoded qualification](../../../../../tmp/experiments/local-sun-cache-reuse/runs/00756-p6-film-report/result.json), and [resource report](../../../../../tmp/experiments/local-sun-cache-reuse/runs/00753-resource-bound/result.json).

The native file is the reference for disc detail. The compact copy is for
convenient review. Selected stills show the actual film frames without overlays.

## Questions And Decisions

1. **Continuous take or cuts?** The owner selected one continuous shot.
2. **Overlays?** The owner selected a purely cinematic film with no overlays.
3. **Duration?** The owner allowed one to two minutes; select 90 seconds for
   a clear full circuit plus an establishing move and closing reveal.
4. **Location?** Select the permitted San Jose winter-solstice alternative.
   It lies inside the model source orbit and gives a full apparent bearing
   winding; Union Glacier lies outside and offers only a partial sky-bearing arc.
5. **Scene and lens?** Adapt the observatory vocabulary into a new circular
   court with distinctive unlabeled landmarks. Initially selected a 12-degree lens
   through the complete 70-second source circuit. First stills showed excessive
   architecture cropping; revised to 18 degrees at 1920 by 1080, retaining
   approximately 21 near / 9 far pixels. Wide opening/closing moves preserve scenery.
6. **Physical source?** Retain the fixed 16-mile radius and current source
   policies. No artificial disc gain or variable physical radius is selected.
7. **Resource latitude?** The owner is AFK and resource use is not a concern.
   Select a P6-only 4 GiB machine reserve, 12 GiB owned ceiling and a bounded
   45-minute final capture on the inspected approximately 32 GiB machine.
   Retain telemetry, one heavy job, cleanup and JavaScript-only execution.
8. **Recording implementation?** Reuse existing deterministic recording and
   bounded streamed MP4 output. Author a persistent experiment-owned scene and
   exact-frame borrower rather than retaining a full in-memory movie.
9. **Temporary output?** The experiment's declared immutable-run output root
   takes precedence over independent-execution's generic scratch location.
10. **Architecture in the narrow view?** Use an authored monumental skyline
    below the actual Sun trajectory, with four distinct landmark groups.
    This keeps spatial cues visible at the fixed lens without changing the Sun.
11. **Guard defaults?** Align the wrapper's actual default with the documented
    ten-minute limit. The longer 45-minute allowance is explicit and limited
    to the selected P6 final capture.
12. **First composition revision?** Run 00736 confirmed the actual size contrast
    and clear disc, but only the tops of the landmarks appeared in the central
    view. Widen the fixed lens, select a 16:9 native raster, raise the skyline,
    bevel stone edges and use a 6 m opening/closing height. Retain actual
    measured backlighting, sky and source size; no fabricated illumination.
13. **Floor artifacts?** Revised stills exposed self-shadowing and overlapping
    paving. Separate receive-only floor batches from shadow-casting monuments,
    replace thin overlapping wedges with solid paving, and retain column shadows.
14. **Subpixel preview check?** The 640 by 360 preview's wide opening has an
    approximately 1.17-pixel Sun. A fixed 50% maximum-coverage assertion rejected
    that valid subpixel case in 00745. Use the radius-aware quarter-area lower
    bound with the existing 50% cap; native circuit resolution gates stay unchanged.
15. **Residual floor seams?** The v3 preview still showed distracting dark marks
    in the raised paving. Select a continuous stone court with three flush brass
    bands, shared boundaries and no hidden overlapping cap. Final-raster v4
    stills confirm a clean floor while retaining architectural shadows.
16. **Proof clock agreement?** A focused cross-check found that the CPU proof
    rounded milliseconds while the recorder's Date construction truncated them.
    Align the proof to the recorder and rerun it; the difference was one
    millisecond in 989 encoded slots and did not change the geometric conclusions.
17. **Review findings in existing collaborators?** Required review identified
    forbidden import-type expressions in the included celestial adapter and
    declaration file. Replace them with documented ambient capabilities and
    existing imported class names. Preserve the accepted film and prove the
    changed JavaScript has identical executable syntax; declarations are outside
    the captured executable closure. Two initially reported documentation
    findings were independently disproved and corrected in the review reports.
18. **Parser compatibility for that proof?** The root Acorn 5.7.4 parser could
    not handle the selected modern syntax/options and stalled. Stop the owned
    process, preserve interrupted run 00757, then use installed Acorn 8.17.0
    from Terser's dependencies with explicit ECMAScript 2022. Install nothing.
19. **Tool identity through the Node installation junction?** Run 00758 proved
    syntax equivalence but failed the provenance path check. Record both the
    invocation path and canonical real Node executable, hashing the latter.
    Keep repository source/output alias rejection unchanged; retry in 00759.

## Execution Evidence

- Completed: read-only source/geometry feasibility; selected film parameters;
  current plan and topic context refreshed; pre-implementation baseline saved.
- Reviewer readiness refreshed for all five initialized lanes; applicable P6
  source review will follow a stable implementation and preview milestone.
- Implemented: persistent scene/camera, exact-frame recorder adapter and
  bounded host/qualification controls, with separate file ownership.
- Initial CPU clock/geometry proof: 00734, 2,701 sampled states, approximately
  359.921 degrees of apparent bearing winding with actual seasonal drift,
  geometric diameter ratio 2.2977. Revised proof 00739 passes all 2,701 states,
  59,422 compact-stencil queries and finite-ray coverage with at least 13,014 km
  radial margin. New predicted diameters are 21.169 / 9.213 pixels.
- Initial final-raster stills: 00736 under guard 00735, seven images, one reused
  atmospheric cache, zero GL errors and complete disposal. Browser time 114.2 s;
  peak owned private memory 4.37 GB, minimum machine free memory 15.62 GB.
- Revised 1080p stills 00738 (guard 00737) pass disc visibility and disposal:
  315 created and 315 disposed celestial targets. Rendered inspection prompted
  the floor correction recorded above.
- Native 10-second motion 00741 (guard 00740), independently decoded and
  qualified by 00743 (guard 00742): all 300 frames, exact cadence, zero repeated
  pixel frames, zero GL errors, 2,073 targets created/disposed. Capture 102.5 s;
  peak private memory 4.48 GB. This excerpt covers about 91.68 degrees near the
  closest approach; it does not qualify the complete circuit.
- Full low-resolution preview attempt 00745 (guard 00744) is preserved as failed
  at its overly strict subpixel coverage assertion. Corrected preview 00747
  (guard 00746), qualified by 00749 (guard 00748), passes all 540 frames across
  90 seconds: 359.921-degree winding, no repeated pixel frames, one cache,
  zero GL errors and 3,519 targets created/disposed. Capture took 175.6 seconds;
  peak owned private memory was 4.94 GB and minimum free memory 16.06 GB.
- Final scene stills 00751 (guard 00750) confirm the v4 floor correction across
  seven native images. Near, far, intermediate views and the wide opening were
  inspected. Peak owned private memory was 4.98 GB, minimum free memory 15.84 GB.
- Exact recorder-clock CPU proof 00752 supersedes 00739 for slot identity:
  2,701 states and 59,422 admitted stencil queries pass, with unchanged
  approximately 21.17 / 9.21 pixel geometric diameters and 359.921-degree winding.
- Native final capture 00754 (guard 00753) completed from the frozen v4 source:
  2,700 encoded states plus the exact endpoint, 91 measured lighting endpoints,
  one reused cache, zero GL errors and all 16,479 celestial targets disposed.
  Browser capture took 608.47 seconds; sampled peak private memory was 5.63 GB,
  peak working set 1.73 GB and minimum machine free memory 15.71 GB.
- Qualification 00756 (guard 00755) independently decoded all 2,700 frames:
  exactly 90 seconds, 1920 by 1080 AVC, zero timestamp error and zero repeated
  pixel frames. Measured bright-core diameters are 22 / 10 pixels (ratio 2.2),
  consistent with the geometric ratio 2.2977 under the declared edge tolerance.
  Minimum measured Sun contrast is 44.58 byte levels. The decode/review-copy job
  took approximately 257 seconds and peaked at 1.13 GB private memory.
- Capture and qualification are sealed; the heavy-job lock and disposable
  browser profile are absent. Standard resource defaults apply to ordinary
  subsequent work; P6 limits require an explicit scoped launch flag.
- [Contract-remediation proof 00759](../../../../../tmp/experiments/local-sun-cache-reuse/runs/00759-p6-contracts/result.json)
  authenticates both accepted parent inventories and all 366 captured inputs.
  Of these, 365 remain byte-identical. The sole changed module is
  `shell-celestial.js`: its captured Git-original bytes are authenticated, and
  its complete original/current executable ASTs match after removing only node
  location fields. The raw source hashes intentionally differ. The proof records
  current declarations separately, parser/tool identities and preserved source
  snapshots. This supports reuse of the delivered media after annotation-only
  remediation; it does not relabel original source hashes or weaken the capture
  qualifier's freshness gate. Interrupted 00757 and failed 00758 remain preserved.

## Verification And Delivery

Local type checks and the repository formatting check pass. Exact-slot CPU
coverage, GPU visibility/lifecycle and complete native media checks above pass.
The source unit's baseline is
`.codex-tmp/review-standards/session-fFecAL/baseline.json`.
Its [machine-readable source-review receipt](../../../../../.codex-tmp/review-standards/session-fFecAL/validation-p6.json)
owns the aggregate mapped primary-review and independent-audit outcome and must
be `CLEAN` for implementation completion. Historical receipts are not relabeled
for this unit. The reviewed request records relevant unchanged collaborators.
The initial validated request reported two type-contract findings; the final
request reviews their remediation and the supporting source-equivalence proof.

The plan's composition controls, beginning/end lens transitions, intermediate
views, close approach and returning gateway were inspected as rendered PNGs;
the decoder checks supplement that inspection with complete cadence and Sun-edge
measurements. Final creative acceptance belongs to the owner after watching.
No empirical flat-Earth validation or quantified atmospheric error bound is
claimed. Scene shadows use the documented local directional approximation
(maximum scene-direction difference approximately 0.028 degrees); diffuse and
adaptation lighting use measured one-second endpoints. The physical Sun, direct
light and sky remain exact-state consumers. Broader error-bar, gray-horizon and
production-promotion work remains deferred; no experimental unit-test suite was
created.

## Reproduction And Checkpoint

```powershell
node --max-old-space-size=1024 experiments/local-sun-cache-reuse/prove-film.js
node experiments/local-sun-cache-reuse/run-resource-bounded.js --p6-film -- run-film.js --stage=final
node experiments/local-sun-cache-reuse/run-resource-bounded.js --p6-film -- qualify-film.js <new-film-run> <matching-capture-guard-run>
```

Each command creates new immutable evidence; never reopen the delivered runs.
The pre-film checkpoint is `bea65881` ("Checkpoint local-Sun cache qualification
and celestial follow-ups"). The delivery checkpoint contains this record and
is identified by Git history for this path; its message is preapproved through
the independent-execution workflow. No push or publication is selected.
Use the native video and this record as immutable comparison evidence for the
selected [shadow revision](p6-shadow-revision.md). Its new recipe, runs and review
unit do not alter v4's evidence. The subsequent [P7 closeout](p7-closeout.md)
records the ended experiment.
