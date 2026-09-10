# Shared Cache Calculation Reuse Experiment Status

Status: first candidate E0-E6 and Bruneton verification R0 complete; original runtime-improvement objective remains open at R1.

## Current State

The existing-data inventory found 70,756 requested rows and 5,494 unique rows
across 109 application caches. That sharing is already implemented. The new
planner reconstructs every control exactly and handles empty, repeated,
reordered, overlapping, changed-configuration, and 10,000-request inputs.
The first effort checkpoint supports continuing with lifecycle savings:
the qualified generator issues 21,600 per-zenith completion waits over 120
field passes. Cross-wavelength arithmetic reuse remains unproven.

## Latest Verification

### Bruneton Reverification Using Existing Data

Run: `runs/2026-09-10T23-21-50-177Z-bruneton-verification-d920ef95-faba-4834-b2de-ec70f0ff9c7f/`
below the experiment output root. Execution took 17.9 seconds with zero new GPU
calculations. All 17 new cache payloads equal their authenticated canonical
parents byte-for-byte, permitting reuse of the prior final-view measurements.
Unchanged B1, B2, and B3 scorers reproduce every prior score and classification.
The derivation pins scorer revision `8abbadd581ca95317f7f4b850246c0fbe619017b`
and verifies the scorer/dependency/reference worktree is clean before execution.
Focused review confirms the result and provenance boundaries; the local
experiment typecheck passes. Earlier attempts remain immutable, including the
first numerical verification and a sandbox-denied Git subprocess attempt.
The sealed run and copied figures pass independent artifact verification in
`runs/2026-09-10T23-22-51-566Z-verification-b3c0e782-fc7f-4460-8dcd-20ce9bbce50f/`.

| Result | Verified value | Disposition |
| --- | --- | --- |
| B1 aggregate RMSE | 11.831044211622888 mW m^-2 sr^-1 nm^-1 | favorable classification; exceeds unchanged 11.820391604126252 closeout ceiling |
| B2 aggregate RMSE | 2.834261691366828 W m^-2 | favorable |
| B3 same-run difference | 0.00000021162288810216978 mW m^-2 sr^-1 nm^-1 | consistent within 0.000001; favorable with all five mismatch fields |

The run contains `b1-result.md`, `b2-result.md`, `b3-result.md`,
`benchmark-verification.json`, and `derivation.json`. All six original figures
are authenticated and copied under their original basenames into this run:
`b1-aggregate-rmse.svg`, `b1-per-time-rmse.svg`,
`b1-figure5-relative-error-domes.svg`, and the three
`b1-figure5-algorithm32-*.png` panels. They are reused exact figures, not a new
render or new final-view measurement. Verification passes; benchmark closeout
remains rejected. The separate ground-contact investigation owns the historical
ceiling conflict; no benchmark authority decision is made here.

### First Candidate Evidence

All run paths below are relative to the declared output root.

- Focused exact GPU run: `runs/2026-09-10T22-19-50-366Z-application-b4c661e5-62fe-49d2-a1b3-dffaa8896e07/`.
- Full 15-channel exact GPU run: `runs/2026-09-10T22-20-27-162Z-application-96ad80bd-facf-410b-a6e5-50c5d4dc3e0b/`. Every unique value matches the qualified shared inventory. Together with E2 this establishes exact reconstruction of all 109 controls.
- Residency proof: `runs/2026-09-10T22-29-57-435Z-residency-7e00c345-f3d1-47da-a602-d7300fb40837/`. Eviction/reload and invalidation pass with two resident rows (32,464 bytes). Requests of size 1, 17, 109, and 10,000 reuse three stored rows without new calculations.
- Host lifecycle proof: `runs/2026-09-10T22-31-39-319Z-lifecycle-9dde2428-f184-4fbf-bfc9-a96cf4b08ba2/`. Real GPU pool reuse, eviction, budget and normal release pass; cancellation, deadline and rejection prove server/main-browser termination. They do not independently measure driver memory reclamation under failure.
- Active-session error proof: `runs/2026-09-10T22-34-51-953Z-lifecycle-1ebd56f3-5f2a-4782-bf7c-844eed2f79b6/`. After an injected error, the real GPU texture is deleted and retained bytes are zero before the host handles rejection and closes.
- Accepted direct-40 run: `runs/2026-09-10T22-23-13-107Z-direct40-321ad547-9fd1-4443-b89a-d5ad5b8a576d/`. All 17 scenes match their original payloads exactly across 40 spectra, preserving the authenticated profile, build request, and grass ground contribution. Its browser interval is 2,528,795.8 ms (42.15 minutes) in one retained context. There are 10 texture allocations, 8,830 texture reuses, 3,414 program compilations, and 666 program reuses; retained texture storage peaks at 2,630,240 bytes and is zero after close. Program eviction permits recompilation within the fixed residency budget.
- Direct-40 artifact verification: `runs/2026-09-10T23-05-40-015Z-verification-089185a2-8de5-426e-8d77-fd0ab64c9470/`. All sealed scientific artifacts and captured implementation identities pass independent hashing. The earlier accepted application/lifecycle verification was reused.
- Aggregate artifact verification: `runs/2026-09-10T22-39-51-269Z-verification-8e2e4de6-1099-433e-9604-1a789f569250/`. Independently verifies sealed scientific artifacts and captured implementation identities for the inventory, full application, residency, host lifecycle, and active-session error proofs. Additional workspace hashes inventory retained files without retroactively extending scientific acceptance.
- Focused consolidated review found no actionable calculation, inventory, lifecycle, containment, or verifier issues. The active-session error proof resolves its requested cleanup-evidence distinction. The full standards-compliance ledger was explicitly omitted under the owner's waiver.
- Core experiment typecheck and repository/local formatting checks pass. The local typecheck excludes the generated-module browser entry and direct-40 runner's legacy profile import; both are covered by real execution rather than a claim of complete static checking.

Application GPU counters: 9 texture allocations and 186 reuses instead of 195
allocations; 76 program compilations and 14 reuses instead of 90 compilations.
Retained textures peak at 348,273,816 bytes and return to zero at session close.
Field completion waits fall from 21,600 to 120 by the guarded derivation.
Recorded field time is 2,530.6 ms versus the prior 19,879.7 ms, but the broader
browser interval is 101,404.1 ms versus 81,602.7 ms. Different comparison/transfer
workloads and execution conditions prevent an overall speedup claim.

- Scaffold helper creation and `--check` pass.
- Folder resolution passes: source inherits `code` with the proof-host `proof-tools` mapping; topic documentation inherits `base`.
- Git ignores the output root; the source root contains only authored implementation and controls.
- Repository formatting check and local documentation-link checks pass.
- Output root: `tmp/experiments/00000-shared-cache-calculation-reuse/`.
- Accepted E1/E2 run: `runs/2026-09-10T22-13-07-905Z-inventory-0a9b7509-fab4-478e-9a5b-f7d5c16ff9e3/` below the output root.
- All 109 new inventory-map reconstructions match authenticated original payload SHA-256 identities exactly.

## Review And Execution Scope

Normalization and the planned proof-host folder mapping were reconciled under
the owner's execution authorization. Eligibility gates pass and architecture
context is refreshed. The adviser still requires the full compliance ledger;
the owner's explicit consolidated-review waiver governs this experiment, so
parent-directed checkpoints will not claim that ledger or full compliance.

An initial browser attempt exited in the restricted sandbox. A fresh run uses
the authorized browser execution permission; the failed run remains preserved.

## First Candidate Disposition And Next Gate

Retain the candidate and its immutable proof evidence. Exact results, reduced
allocation/compilation counts, fewer explicit waits, bounded active resources,
persisted reload, and complete input-driven requests satisfy this candidate's
pinned acceptance criteria. No additional mathematical sharing beyond the
existing common-field calculation has been proved. Metadata, disk inventory,
and total work still grow with distinct inputs; there is no fixed scene ceiling.

Overall end-to-end speedup is not established by these measurements. A future
performance claim needs equivalent host workloads; additional mathematical
reuse needs its own dependency and oracle proof. Those are unfinished parts of
the owner's original objective, now explicitly tracked at R1. The next effort
checkpoint is a small reusable-program proof before any further full run.
No production promotion was performed, and the
separate production B1 benchmark acceptance remains unchanged.
