# Workspace Comps Execution

Status: M1 complete; M2/M3 working desktop slice; M4 pending. Execution was
authorized through independent-execution on 2026-11-05.
The [plan](workspace-comps-implementation-plan.md) owns scope and completion.
Evidence root: `.codex-tmp/flat-workspace-comps/2026-11-05/implementation/`.

## Decisions

- Preserve the dirty baseline (hashes plus existing Flat source copies and Git
  diff). Existing related implementation is a dependency, not permission to
  discard unrelated files. `transfer/` stays outside implementation/checkpoints.
- The latest user invocation authorizes execution and local checkpoints with
  checkpoint-adviser messages. No pushing or deployment. Engineering reviewers
  remain cancelled.
- Use the closest occurrence nearest the accepted instant as the editor's
  reference. Resolve candidates through production geometry across adjacent UTC
  dates, then offset signed degrees from that selected occurrence. Freeze it
  during an edit gesture. ±180 are opposite ends, twelve hours before/after that
  occurrence; a subsequent external read chooses its nearest occurrence again.
  This is an editor occurrence policy, not a new astronomy calibration.
- External location/time changes invalidate an active slider gesture. Numeric
  text survives external updates and resolves against the current reference on
  fresh acceptance. Location changes preserve accepted time. No retained angle
  mode or new clock.

## Milestone Reports

### M1 — Complete

Baseline105 dirty files saved. Public geometry resolves the nearest daily closest
occurrence and signed offsets. `time-proof.json` checks independently fixed
-180/-45/0/+45/+180 expected instants plus readback across UTC/seasonal date
boundaries and longitudes -180/0/+180. Generic sections use contribution identity
separately from mount tokens. Client and engine types pass.

### M2/M3 — First Working Slice

The frame hosts accepted-value summaries, registered shared/view sections,
per-view Camera entry and shared Time slider/numeric presentation. Real Chrome
loads the renderer at the fixed +45 sample, with no browser errors; captures and
report are under `browser-pilot2/`. `tests-third.log` records111 passing browser
tests, including normal slider/numeric model paths. Full interaction and
responsive completion are not yet claimed.

The first browser run exposed a readiness ordering bug in the always-mounted
summary. It now reads/subscribes during React mount rather than provider
registration. A native-browser sandbox startup failure was retried through the
authorized installed Chrome lane. Earlier captures/logs remain preserved.

Open: camera labels truncate in the compact selectors; M4 sizes and shared-input
interaction verification remain. Camera configuration needs layout refinement.

Checkpoint adviser recommends preserving this coupled tested slice before more
polish: `Build Flat workspace settings and shared-time control slice`. Its scope
includes related preexisting Flat dependencies; `transfer/`, `.prettierignore`
and unrelated governance changes remain outside. The execution skill preapproves
the suggested local message. No compliance or final acceptance is implied.

## Resumption

Next: checkpoint the working slice, correct Camera labels/configuration layout,
then verify shared writes, interruption behavior and all four responsive targets.
Continue from the isolated build/proof artifacts and preserve previous evidence.
