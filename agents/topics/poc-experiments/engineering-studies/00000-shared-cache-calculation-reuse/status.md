# Shared Cache Calculation Reuse Experiment Status

Status: E1-E4 accepted; E5 compatibility is in progress.

## Current State

The existing-data inventory found 70,756 requested rows and 5,494 unique rows
across 109 application caches. That sharing is already implemented. The new
planner reconstructs every control exactly and handles empty, repeated,
reordered, overlapping, changed-configuration, and 10,000-request inputs.
The first effort checkpoint supports continuing with lifecycle savings:
the qualified generator issues 21,600 per-zenith completion waits over 120
field passes. Cross-wavelength arithmetic reuse remains unproven.

## Latest Verification

All run paths below are relative to the declared output root.

- Focused exact GPU run: `runs/2026-09-10T22-19-50-366Z-application-b4c661e5-62fe-49d2-a1b3-dffaa8896e07/`.
- Full 15-channel exact GPU run: `runs/2026-09-10T22-20-27-162Z-application-96ad80bd-facf-410b-a6e5-50c5d4dc3e0b/`. Every unique value matches the qualified shared inventory. Together with E2 this establishes exact reconstruction of all 109 controls.
- Residency proof: `runs/2026-09-10T22-29-57-435Z-residency-7e00c345-f3d1-47da-a602-d7300fb40837/`. Eviction/reload and invalidation pass with two resident rows (32,464 bytes). Requests of size 1, 17, 109, and 10,000 reuse three stored rows without new calculations.
- Host lifecycle proof: `runs/2026-09-10T22-31-39-319Z-lifecycle-9dde2428-f184-4fbf-bfc9-a96cf4b08ba2/`. Real GPU pool reuse, eviction, budget and normal release pass; cancellation, deadline and rejection prove server/main-browser termination. They do not independently measure driver memory reclamation under failure.
- Active-session error proof: `runs/2026-09-10T22-34-51-953Z-lifecycle-1ebd56f3-5f2a-4782-bf7c-844eed2f79b6/`. After an injected error, the real GPU texture is deleted and retained bytes are zero before the host handles rejection and closes.
- Direct-40 run in progress: `runs/2026-09-10T22-23-13-107Z-direct40-321ad547-9fd1-4443-b89a-d5ad5b8a576d/`.
- Focused consolidated review found no calculation or inventory defects. Its lifecycle follow-up requested precise separation of host termination and active GPU-session cleanup evidence.
- Core experiment typecheck passes.

Application GPU counters: 9 texture allocations and 186 reuses instead of 195
allocations; 76 program compilations and 14 reuses instead of 90 compilations.
Retained textures peak at 348,273,816 bytes and return to zero at session close.
Field completion waits fall from 21,600 to 120 by the guarded derivation.
Recorded field time is 2,530.6 ms versus the prior 19,879.7 ms, but the broader
browser interval is 101,404.1 ms versus 81,602.7 ms. Different comparison/transfer
workloads and execution conditions prevent an overall speedup claim.

- Scaffold helper creation and `--check` pass.
- Folder resolution passes: source inherits `code`; topic documentation inherits `base`.
- Git ignores the output root; the source root contains only authored `AGENTS.md`.
- Repository formatting check and local documentation-link checks pass.
- Output root: `tmp/experiments/00000-shared-cache-calculation-reuse/`.
- Accepted E1/E2 run: `runs/2026-09-10T22-13-07-905Z-inventory-0a9b7509-fab4-478e-9a5b-f7d5c16ff9e3/` below the output root.
- All 109 new inventory-map reconstructions match authenticated original payload SHA-256 identities exactly.

## Blockers

Normalization and the planned proof-host folder mapping were reconciled under
the owner's execution authorization. Eligibility gates pass and architecture
context is refreshed. The adviser still requires the full compliance ledger;
the owner's explicit consolidated-review waiver governs this experiment, so
parent-directed checkpoints will not claim that ledger or full compliance.

An initial browser attempt exited in the restricted sandbox. A fresh run uses
the authorized browser execution permission; the failed run remains preserved.

## Next Action

Finish direct-40 compatibility and consolidate artifact verification and the
retain/reject/promotion decision.
