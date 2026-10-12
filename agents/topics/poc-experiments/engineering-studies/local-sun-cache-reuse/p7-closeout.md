# Local-Sun Cache Reuse Closeout

Disposition, 2026-10-11: **ended, accepted as a contained experiment**. The owner
accepted the revised film and selected P7 closeout. P0-P6 and the selected
follow-ups are delivered; P7 records the final findings and lifecycle handoff.
Production adoption, publication and a new execution topic were not selected
at closure; subsequent work is routed by the current active-topic record.
Reopening the experiment requires a new owner selection.

The [status](status.md) owns phase disposition. This document consolidates the
findings by linking their existing evidence owners; it does not revise any
historical run, numerical gate or review receipt.

## Final Findings

| Question | Accepted result and evidence owner |
| --- | --- |
| Selected representation | [P3 contract](p3-contract.md): v9 Euclidean-radius interpolation with geometric-density normalization, 1,049 compact nodes, Native15/W27/N4, scalar R32F, incoming polar40/azimuth48, column48-tail64 construction and column15 runtime. Source height is 4,828,032 m; the source-centered cylinder has radius 33,378,000 m and atmospheric altitude 0-100,000 m. |
| Layout correctness and admission | [P3 layout qualification](p3-layout-qualification.md): five fixed states pass complete field validity, 96 complete spectral rays with all 15 channels, cumulative accounting, CPU/GPU comparisons and support checks. The support proof admits 21,424 queries; compensated endpoint maximum difference is approximately 3.73e-9 m against the unchanged 0.01 m gate. These are consistency and numerical-correctness results, not independent absolute physical error bounds. |
| Omitted work and storage | [P3 layout qualification](p3-layout-qualification.md): six bands are omitted and 55 admitted. Occupied fields are bit-identical to the matched unculled control. Peak construction fields fall from 929,824,920 to 825,898,680 bytes, saving 103,926,240 bytes and 72,028,440 scalar writes. Savings are against that matched control; the selected layout is larger than the historical 285-position grid. |
| Whole-layout cost | [P3 disposition](p3-disposition.md): the retained cumulative field is 275,299,560 bytes; construction fields peak at 825,898,680 bytes, with a separate 33,592,320-byte phase payload. [P5 qualification](p5-qualification.md) records a 1,163,596,276-byte application logical peak and 5,348,098,048-byte sampled private-memory peak. Logical payload and process memory are distinct measurements. |
| Useful reuse region | [P3 movement](p3-movement.md): compatible horizontal translation/rotation under the homogeneous atmosphere and isotropic source, provided every interpolation stencil and complete ray remains admitted by the moving source-centered domain. Fourteen distinct poses include seven rotations, translations through [10,000, 10,000] m, and five orbital states. All ten complete stored fields are byte-identical and paired image differences are zero. This is an admitted domain, not an unlimited observer-displacement guarantee. |
| Sustained exact-state consumers | [P5 qualification](p5-qualification.md): 1,200 matched states from 2,400 captures, zero image-channel differences and maximum spectral absolute difference 4.656612873077393e-10. Full trajectories avoid 119 of 120 hypothetical per-state constructions; two-window paths avoid 118. Cold preparation is 28.001-43.010 s and exact-state preparation p95 is 127.0-194.2 ms. Draw-only timing does not establish live 60-fps operation. |
| Rebuild and failure behavior | [P4 application](p4-application.md) and [P3 movement](p3-movement.md): changes to source height, medium, ground, emission, numerical policy, implementation identity or unsupported coverage require compatible replacement. Placement and viewing direction remain live inputs within admission. Failure, cancellation, supersession, admission rejection and live-lease disposal are qualified; the last complete frame stays coherent while replacement prepares. Unsupported queries reject instead of clamping. |
| Measured replacement limits | [P4 application](p4-application.md): height/medium/power replacement takes 18.541/17.912/18.478 s. The old 33,378 km cylinder rejects an observer at 33,379 km; a 35,307 km replacement takes 34.135 s. That misses the original 30 s target and remains disclosed under the owner's timing relaxation. |
| Cinematic demonstration | [P6 shadow revision](p6-shadow-revision.md): the owner accepted the continuous 90-second, 4K San Jose winter-solstice film. All 2,700 frames and five matched shadow controls qualify, with one reused atmospheric cache. Decoded Sun diameters are 18/8 pixels and the geometric near/far ratio is approximately 2.2977. Capture and qualification measure an offline recording, not live 30-fps performance. |

## Limits And Separately Selectable Follow-Ups

The [abstraction inventory](abstraction-inventory.md) and
[evidence policy](reference-method.md#current-evidence-policy) retain the accepted
basis: defensible transferred mathematics, isolated assumptions and ordinary
correctness. No quantified absolute approximation error, globally converged
independent flat/local reference or empirical validation of that geometry is
claimed. Black physical ground, disabled ozone, the finite atmospheric boundary
and finite scattering-order policy remain explicit assumptions. Visible scene
materials do not restore atmospheric ground reflection.

The [P6 record](p6-shadow-revision.md#verification-limits-and-handoff) additionally
retains the shared directional scene-shadow approximation and measured one-second
diffuse/adaptation interpolation. Sky, physical source/disc and direct illumination
remain exact-state consumers. The dedicated Flat180 lower-band trace was not
completed; its analytic comparison is not a measured trace.

Gray-horizon diagnosis, reflective atmospheric ground, ozone changes, targeted
error bounds and shared-construction optimization are deferred possibilities,
not an active execution queue. Sky Accuracy Dials remains suspended. Production
adoption needs a separately selected adaptation plan under destination-folder
standards; retained experimental source is not a production runtime dependency.

## Evidence And Review Disposition

Keep authored source under `experiments/local-sun-cache-reuse/`, numerical and
media evidence under `tmp/experiments/local-sun-cache-reuse/`, and existing review
records under `.codex-tmp/review-standards/`. The [handoff](handoff.md#evidence-entry-points)
links the accepted milestone owners and their run identities. Final media remains
native run `00781-p6-film` and review/qualification run `00783-p6-film-report`.
The original v4 film, failed diagnostic attempts, manifests and provenance remain
unchanged.

The [P6 completion authority](p6-shadow-revision.md#review-and-execution-boundary)
retains its exact `CLEAN` receipt and original frozen scope. Earlier receipts
likewise retain their recorded units; they are not relabeled as reviews of this
closeout. P7 changes only documentation. Its baseline was captured before
closeout edits at commit `44a710a3b441ee0e239d3d6cc64c615f6f1b781d`, including the
pending owner-acceptance documentation update.

The [historical source-review inventory](../../../../../.codex-tmp/review-standards/session-lBTwwf/evidence-inventory/historical-source-review-inventory.json)
checks 22 linked delivered receipts: all exist, report `CLEAN` and match their
saved request fingerprints. All 88 authored experiment source/configuration
paths have current byte-identical coverage in at least one applicable original
review, including architecture and contracts obligations. The final v5 request's
19 source paths still match; its eight topic documents have changed and belong
to the new closeout documentation review. No historical validator was rerun
against a new HEAD and no receipt or fingerprint was rewritten.

The closeout's mapped primary review and independent audit are recorded by
[its own validation receipt](../../../../../.codex-tmp/review-standards/session-lBTwwf/validation.json).
Only that receipt's matching `CLEAN` outcome establishes closeout-documentation
review completion. It does not expand any scientific claim or prior source scope.

## Resources And Preserved Interruptions

The [runtime inventory](../../../../../.codex-tmp/review-standards/session-lBTwwf/runtime-inventory/inventory.json)
records no identifiable live Node, Chrome or FFmpeg process referencing this
experiment and no allocation or heavy-execution lock. No process needed stopping.
Final runs 00780-00783 are accepted and terminal; capture records zero retained
owned resources, zero cleanup errors and all 16,479 targets disposed. The final
runs retain no browser profile.

The inventory contains 785 historical run directories: 646 accepted, 113 failed,
five rejected and 21 without terminal manifests. Those incomplete interrupted
attempts are preserved unchanged, not reopened or retroactively finalized.
The inventory also retains the duplicate historical 00157 sequence and old
profile directories; no historical cleanup or relocation is selected. The scoped
process census establishes identifiable ownership, not the identity of an
unattributed process elsewhere on the machine.

## Standards Restoration And Topic Handoff

No temporary standards configuration was introduced by this experiment.
Current manifest and overlay hashes match the pre-activation identities in
[status](status.md#standards-restoration-provenance); there is nothing to remove
or restore. The permanent `experiments/ -> experiment` mapping retains
`documentation.md`, `project-foundation.md` and `types.md`. Documentation remains
under `agents/ -> base`; representative production paths retain their broader
destination mappings.

Folder resolution and the durable normalization marker validate, and the
`write-standards-guide` helper reports root `STANDARDS.md` current. P6's resource
exception has expired; ordinary 8 GiB reserve/owned-process and ten-minute
controls apply to any separately selected future work.

The closure returned the [active-topic handoff](../../../active-topic.md) to no
selected execution topic. That record now routes any subsequent owner-selected
work. This experiment's documents remain historical context and reopening guidance.
Reviewer context was refreshed for the idle handoff through `review-standards`;
readiness and the closeout review receipt retain their separate meanings. The
closure itself selected no production task, push or publication.
