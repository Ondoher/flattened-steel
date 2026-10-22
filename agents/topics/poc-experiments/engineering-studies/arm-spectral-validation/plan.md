# ARM Spectral Validation Plan

Planning method: [create-plan](C:/Users/gande/.codex/skills/create-plan/SKILL.md).
Mode: exploratory validation with contained adapter/tooling work.
Authority: independent execution requested on 2026-10-21 for M1-M4 within the
existing gates and adaptive scope. No deployment or production edits. The status
owns completed work and the current access dependency.

## Outcome and completion

Compare production distant-Sun spectral radiance with recent ARM observations
under independently constrained matched atmospheric profiles. Include libRadtran
as the required independent second comparison. No production defect or expected
color is presumed. The [design](design.md) owns sources, physical matching,
representations and evidence contracts; [status](status.md) owns execution.

Completion is a documented feasibility disposition or an authenticated spectral
comparison with per-case residuals/scores, input and measurement uncertainty,
numerical sensitivity and attribution limits. A missing suitable case or an
unsupported production profile is a useful negative result, not a fabricated
accuracy verdict. Report excluded candidates and conditional work not triggered.

## M1 - A usable measured case before expensive computation

Purpose: establish actual joint coverage. First executable step: inventory ARM
SGP 2023 spectral product availability/quality against profile observations.

1. Check 2023 SGP, including22 August as a lead. Inspect calibrated TWST/SASZe
   availability, wavelength response, timestamps, uncertainty, calibration
   notices and cloud screening. Prefer routine calibrated data; explicitly
   check prototype changes/stray-light history for the selected TWST epoch.
   Cross-instrument agreement does not rule out common systematic errors.
2. Build a native table of colocated radiosonde, lidar extinction, aerosol
   optical properties, solar spectrum, relevant gases and ground albedo. Record
   sampling support, quality and measured/retrieved/assumed status. Choose and
   justify temporal/spatial windows from instrument cadence and observed
   variability before inspecting prediction errors.
3. After execution begins, download only a small candidate interval in a fresh
   run. Retain raw/versioned files, selection commands, checksums, calibration
   metadata, decoding and provider requirements without storing credentials.
4. Reserve an unconsumed evaluation interval before deriving mappings or choosing
   numerical settings. If only one usable interval exists, label it exploratory
   and do not imply independent confirmation after tuning. Document interval
   eligibility/separation from observed variability. Adjacent intervals establish
   repeatability, with shared calibration/atmospheric errors, rather than
   independent calibration validation or broad generalization.
5. Freeze a case definition and uncertainty/coverage table. Quantify gaps by
   altitude/wavelength and whether plausible bounds are attainable. Show first
   spectral/profile plots where essential shape or layering needs a visual.

Deliverable: M1 report with product/file identities, selected/reserved UTC
intervals, geometry, valid bands, missing inputs and data-quality disposition.

Gate: advance with calibrated visible directional spectra and sufficiently
constrained inputs to bound interpretation. A missing parameter can be bounded;
missing calibrated spectra or an unbounded dominant input rejects that case.
Search nearby 2023 dates, then SGP 2020-2024; another ARM site needs a documented
coverage advantage. If none qualifies, report feasibility limits without cache
building. Zenith measurements establish a zenith comparison only.

Estimate: 60-120 minutes for inventory/small-file feasibility, with authentication
or archive issues the dominant unknown. Review at 60 minutes and continue useful
progress. No bulk archive acquisition merely to establish overlap.

## M2 - Matched production and libRadtran contracts

Purpose: separate atmospheric representation from numerical errors.

1. Freeze source revision, production compiler/lookup policy and numerical
   controls. Primary is integrated Corrected60/Mie normalization/outgoing k=.35;
   deployed legacy is a distinct control. Recheck deployment state at run time.
   Generate ARM-specific experimental inputs rather than reuse default assets
   under a matched-atmosphere label.
2. Inventory production input support and installed libRadtran wrapper/solver
   read-only. Run a small smoke proof after execution starts. Pin executable,
   data, solver and geometry, phase, gas/ozone, molecular scattering, SSA,
   surface reflectance, solar source and polarization assumptions. Before cache
   building, demonstrate directional-radiance and solar-elevation geometry
   support or quantify an adequate approximation. Add cheap explicit witnesses
   for units, viewing-direction conventions and solar-source normalization.
   Unsuitable geometry restricts the selected case or leaves it inconclusive.
3. Derive any necessary production-profile projection from atmospheric data
   alone. Retain full and projected profiles. Use libRadtran for both to measure
   representation sensitivity. Expose analytic-phase approximations separately;
   do not equate phase-shape parameters with measured angular moments. An
   adapter that changes a solver is a labeled research variant, not production.
4. Freeze the common measurement operator: radiance units, wavelength convention,
   response/bandpass, field of view and time averaging. Resolve significant gas
   bands compatibly or declare continuum-only scores and an exclusion list;
   also retain a display of unscored residuals. Freeze masks before inspecting residuals.
5. Freeze absolute RMSE/bias, low-signal relative-error handling, uncertainty
   treatment and convergence targets based on actual instrumental uncertainty.
   Aim for numerical changes below one-third of relevant observational
   uncertainty where known; otherwise report sensitivity and limit attribution.
6. Rank uncertainties and specify coherent low/high perturbations or a bounded
   small ensemble for the dominant two to four inputs. Retain spectral/vertical
   correlation and physical/column constraints. Include selected joint changes
   where coupling matters, or disclose the missing combined bound. Use measured
   pilot costs to size the ensemble. Freeze bounds independently of residuals;
   unsupported distributions do not justify statistical confidence claims.

Required outputs distinguish corrected/ARM, legacy/ARM when run,
libRadtran-full-profile/ARM, libRadtran-projected-profile/ARM,
production/libRadtran-projected-profile and full-minus-projected libRadtran.
Identical full/projected profiles reuse one authenticated result with that fact
recorded; do not duplicate computation or label solver variants ambiguously.

Deliverable: M2 compatibility report and machine-readable case/solver requests,
including full/projected atmosphere, masks, every mismatch and small explicit
unit-conversion/measurement-operator proof witnesses.

Gate: claim fully matched algorithm accuracy only where supported. Unsupported
profile details may permit a represented-atmosphere comparison, not relabeling
that approximation as observational truth. If required libRadtran is unavailable,
diagnose the maintained route and retain progress; no silent solver substitution
or external installation modification.

Estimate: 60-120 minutes for contract and smoke pilot after M1. Profile/solver
support and numerical refinement costs remain unknown until measured. Update
the estimate before broad numerical work.

## M3 - Small complete three-way spectral comparison

Purpose: deliver early results on the same measured quantity.

1. Implement only necessary contained acquisition/normalization/probe/report
   adapters. Type-check authored code and use self-verifying proofs. Validate
   real paths, pin source hashes and production requests, and preserve raw data.
   Do not reimplement scattering under a production label.
2. Build corrected and legacy-control production cache/probe outputs for the
   pilot atmosphere, favoring GPU. Record spectral basis/order count and actual
   cache lookup; direct ray tracing is not a substitute. Use observed supported
   bands. Retain per-order contributions if already available cheaply, without
   implying measured total spectra establish individual scattering orders.
   Legacy is mandatory for this first pilot only. Later legacy builds require a
   recorded interpretation benefit and measured value/cost decision.
3. Generate mandatory libRadtran predictions for the same observations under
   the represented atmosphere and the best measured full profile where relevant.
   Pin geometry and spectral resolution. N1 diagnostics, if needed, stay
   distinct from full scattering; libRadtran full is not automatically N1-N4.
4. Apply identical measurement operators. Promptly publish absolute spectra and
   residual plots, with selectable TSV/JSON scores for the explicit M2 tracks
   and solver differences. Use common-transform swatches
   only where visible coverage supports honest color. No invented dome/horizon.
5. Refine dominant production and libRadtran numerical controls separately to
   bound sensitivity without fitting observations. Verify finite/nonnegative
   outputs, provenance, uncertainty assumptions and hashes read-only. Measure
   stage time and resource use separately from scientific accuracy.

Deliverable: M3 report with first complete comparison, convergence bounds,
representation/input sensitivity and actual costs, linked as soon as ready.

Gate: advance if data/operator/evidence checks pass and differences are
interpretable. Repair a failed derivative in a fresh run, preserving completed
computation. Dominant unbounded calibration/profile uncertainty makes accuracy
inconclusive, not a failed algorithm.

Estimate: unknown before M2 pilot. Use actual cache/probe/libRadtran timings to
estimate expansion before adding wavelengths/timestamps. Report cache-build
complexity; it is not by itself a scientific rejection threshold.

## M4 - Held-out confirmation, attribution and final report

Purpose: determine what generalizes beyond the pilot.

1. Apply frozen mappings/operators/settings to the reserved interval. Include
   all eligible cases under the declared rule. Add a second aerosol loading or
   solar elevation only if coverage supports it; no obligatory full-day sweep.
2. Report per-case and aggregate errors; show wavelength/solar-angle patterns
   only where supported. Keep systematic calibration and input uncertainty
   separate; an aggregate must not hide case/spectral failures.
3. Use full/projected and solver/control results to distinguish shared input,
   phase/gas mismatch, representation and numerical sensitivity. Label tentative
   attributions rather than select a preferred solver as truth by agreement.
   Stable differences outside supported measurement/input/numerical bounds
   support a discrepancy under those assumptions; overlapping bounds support
   compatibility only. Unbounded dominant errors or unstable numerical results
   require an inconclusive disposition with the resolving evidence identified.
4. Follow promising evidence within this lane: record supporting evidence,
   mechanism, falsifiable prediction, smallest test, cost and protected cases
   before a branch. At most two active branches. Prioritize calibration/operator,
   profile projection, then numerical mechanisms. Preserve original frozen gates
   and confirm on held-out data. No atmosphere/exposure/mask fitting for scores.
5. Final report: answer original question with artifact links, uncertainty,
   corrected-versus-legacy differences, libRadtran comparison, supported
   conditions, unresolved limitations and follow-on proposals. Successful
   validation setup need not establish production superiority.

Gate: conclude supported agreement, supported discrepancy or inconclusive for
sampled observations. Retain negative evidence and what would justify resumption.
No automatic production edits, deployment, B1 replacement or promotion.

Estimate: conditional on M3. Estimate the smallest confirmation set from pilot
costs before proceeding; 60-minute reviews assess progress/value rather than
force a stop while useful work continues within authority.

## Reporting, recovery and review

Every milestone ends with a concise status section or linked Markdown report:
completed work/evidence, observations versus interpretation, limitations/checks,
disposition and next action. Link useful evidence promptly. Generated artifacts
belong to immutable runs; topic prose links to them. Operations exceeding one
minute follow the design's flushed 30-second progress contract. On interruption
retain completed results and diagnose/repair only the affected portion in a new
run. Do not blindly repeat failures or impose a blanket retry ban.

No dedicated standards reviewers/audits. One initial read-only create-plan
critique applies; primary incorporates feedback. Checkpoint-advisor monitoring,
self-review, local types and scientific/immutable-evidence verification remain
active. No further discretionary review is planned. Any new review request must
state trigger, smallest scope, question, completion condition and gating effect;
disabled standards reviews cannot be reintroduced by this plan.

## Initial plan critique

One read-only critique by `arm_plan_critique` completed on 2026-10-21. It covered
only this plan/design against the owner's ARM/profile/libRadtran goals; no
acquisition, numerical run or standards-compliance assessment occurred.

Incorporated all recommendations: executable correlated-input uncertainty
evaluation and disposition rules; explicit full/projected libRadtran score
tracks; pre-cache geometry/unit/source witnesses; a separation rule and limits
on held-out independence; pilot-only mandatory legacy control with value/cost
gates for expansion; and corrected scaffold-contract linking/prose spacing.
No recommendation was rejected. No additional review is required by this record.
