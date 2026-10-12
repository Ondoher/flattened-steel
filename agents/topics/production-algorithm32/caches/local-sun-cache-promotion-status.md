# Local-Sun Cache Production Port Status

Current disposition, 2026-10-12: the owner selected independent P0 execution for
the production local-Sun cache port. The
[plan](local-sun-cache-promotion-plan.md) owns scope, production responsibilities,
evidence requirements and execution order. The accepted experiment remains ended;
ordinary production/default/deployed selections are unchanged. The bounded
P1 slices now implement geometry-owned compact positions/support, explicit
source-distance bounds, independently compared held source amplitudes and the
selected incoming quadrature, per-tap directional support and cache-owned
geometric-density normalization/restoration. Field, transport and GPU paths
remain open. The
[P0 contract](local-sun-cache-p0-contract.md) owns the prepared contracts,
parameter applicability, first-capability controls and resource admission.

The owner selected [shared production parameter alignment](local-sun-cache-promotion-plan.md#shared-production-parameters)
on 2026-10-12: local-cache parameters follow the distant cache wherever applicable.
P0 now owns that mapping and the source/geometry reasons for local-only differences;
the [experiment-selected compact cache shape](local-sun-cache-promotion-plan.md#experiment-selected-cache-shape)
is fixed for the port. Shared distant parameters apply within that shape, and the
frozen experiment remains the independent comparison control.

## Phase Disposition

| Work | Status |
| --- | --- |
| Topic and planning setup | Prepared: current source mapping, architectural assessment, scope, phase sequence and minimal reload route. The setup-review receipt below determines documentation-review completion. |
| P0 — contracts and controls | Delivered contract/control unit: independent topology and analytic-bound fixture, offline proof/type checks, profile/support/publication and resource policies. Completion requires the matching P0 review receipt below. |
| P1 — compact domain and CPU | Bounded compact-domain, held-amplitude, incoming-quadrature, per-tap directional-support and normalization slices implemented and independently compared. Their matching review receipts below own completion. Remaining P1 field/transport work is open. |
| P2 — GPU construction/runtime | Planned; not started. |
| P3 — reuse and frame publication | Planned; not started. |
| P4 — Flat32/celestial consumers | Planned; not started. |
| P5 — qualification/adoption preparation | Planned; no default switch, deployment or publication selected by setup. |

## Next Work

After the matching slice receipts validate, continue P1 from the
[plan](local-sun-cache-promotion-plan.md#p1--port-compact-domain-source-bounds-and-cpu-reference)
with selected column transport and complete profile/domain integration.
Capture a new baseline and select
independent field/ray outputs before implementing and accepting
those affected numerical capabilities. Automatic band/altitude seed-policy
derivation for changed profiles/heights is also open; this first slice accepts
explicit physical controls rather than claiming a complete profile builder.
Preserve existing production defaults as controls.

The first slice implements `CompactLocalCacheTopology` through the flat geometry
factory, with real ragged offsets/counts, stable radius excess, medium-derived
cylinder-edge refinement, positive spatial stencils and explicit rejection. A
narrow `SourceDistanceBounds` value flows through shell facts/provider; explicit
support rejects outside distances while the named ordinary Flat32 control retains
its existing lookup behavior. No ragged domain is silently fed to the current
rectangular field/transport pipeline.

The selected incoming measure is now available through the sampling-domain
facade as `FlatHorizonPartitionedDirectionDomain`. Its standalone domain proof
does not activate a compact construction profile or qualify per-node transforms.

Shared Native15, W27, physical coefficients, phase, order meanings and scalar
precision align. The [applicability inventory](local-sun-cache-p0-contract.md#parameter-applicability)
preserves geometry-dependent horizon/cylinder quadrature and optical-column
policies, including per-tap angular selection despite the missing independent
Sun-angle position axis. Source/geometry coupling redesign remains deferred.

Current runtime findings addressed by the prospective P0 contracts, to be
implemented and qualified in P1-P4:

- Rectangular position-domain assumptions cannot honestly describe the selected
  1,049-node ragged topology. The new factory implements actual compact positions;
  field/transport selection and packing adaptation still require the rest of P1/P2.
- Source-axis interpolation needs direction support per spatial tap; normalization
  uses actual spectral/medium/source inputs rather than fixed experiment constants.
- Local cache identity currently includes observation/placement, source and geometry
  enforce one-time placement, and geometry shaders embed live placement constants.
- Controller build cancellation is already present, but cache publication alone
  does not stage a complete shader/receiver/celestial frame or borrower lifetime.
- Flat32's fast time/location path is currently spherical-only; local scene-light
  values need the accepted exact-state receiver path.

The [closed experiment handoff](../../poc-experiments/engineering-studies/local-sun-cache-reuse/handoff.md)
and [P7 findings](../../poc-experiments/engineering-studies/local-sun-cache-reuse/p7-closeout.md)
route the unchanged source and evidence. The
[initial transfer assessment](local-sun-transfer-assessment.md) remains an earlier
investigation, not the new implementation authority. No experimental runner,
generated bundle or historical Star evidence becomes a production dependency.

## Verification And Handoff

The first bounded P1 comparison is preserved in a new immutable
[production run](../../../../tmp/production-local-sun-cache-promotion/runs/00002-compact-domain/comparison.json).
The maintained entrypoint is
`node scripts/algorithm32/local-sun-cache/compact-domain/LocalSunCompactDomainProof.js`;
`--out <new-plan-run-directory>` preserves a fresh comparison and rejects an
existing run. The copied P0 authority/manifest retains independent parents and
derivation; exact implementation/tool/configuration identities accompany results.
All 1,049 nodes/exact-node stencils, 22 rows, 61 bands, 2,049 source boundaries and
11 independent sentinels compare under the P0 limits. All four outside-support
sentinels and explicit source-distance endpoints reject correctly. Horizontal
source placement leaves explicit amplitude bounds identical; this is not full
cache reuse qualification. Engine/proof type checks and seven focused existing
source regressions pass. No held-amplitude, field, GPU or application acceptance
is claimed by this slice.

The second bounded P1 slice independently qualifies the selected held source
strength and Native15 construction/direct-light meaning, as owned by the
[source qualification](local-sun-held-amplitude-qualification.md). Its new
immutable `00006-held-amplitude` comparison covers all 2,048 held bands, 4,097
continuous queries and 122,910 held/continuous spectral comparisons. Largest
observed scalar discrepancy is 4.440892098500626e-16, and irradiance discrepancy
is 8.881784197001252e-16 W m^-2 nm^-1, within predeclared binary64 limits.
This accepts the existing source component under the frozen input only;
scattering fields, transport, other profiles, GPU and complete frames remain open.
The construction adapter now validates unknown collaborator metadata before using
its physical distance/scale, with explicit failures and metre normalization.
Engine/proof type checks and nine focused source regressions pass after this fix.

The [held-amplitude review receipt](../../../../.codex-tmp/review-standards/session-nG2yqa/validation.json)
owns this source/proof/current-state unit; only matching `CLEAN` primary/audit
evidence establishes slice completion. This slice retains the 45-minute limit.

The third bounded P1 slice ports and compares the selected incoming measure,
owned by [incoming qualification](local-sun-incoming-quadrature-qualification.md).
All 1,920 ordered vectors and positive weights match the retained independent
historical controls exactly; full/half-sphere measure, horizon partitions and
80 analytic band moments pass. The domain and its arrays are immutable. New run
`00008-incoming-quadrature` preserves the copied authority and current tool/source
identities. Engine/proof type checks and the two focused existing F68 regressions
pass; per-tap transforms, fields, transport, GPU and activation remain open.

The [incoming-quadrature review receipt](../../../../.codex-tmp/review-standards/session-G5Hn1i/validation.json)
owns this implementation/control/proof/current-state unit; only its matching
`CLEAN` primary/audit result establishes slice completion. This execution retains
the 45-minute limit and stops after the selected unit.

The fourth bounded P1 slice implements geometry-owned compact spatial support
with separate ordinary/axis angular selection at every tap, as owned by
[directional qualification](local-sun-directional-qualification.md). New immutable
`00011-directional-support` compares independent spatial/angular gold, all W27
exact nodes and positive joint weights. Engine/proof type checks and six focused
existing W27 regressions pass. Spectral normalization, physical fields, transport,
GPU, complete profiles and horizontal reuse remain open.

The [directional-support review receipt](../../../../.codex-tmp/review-standards/session-3qZKlE/validation.json)
owns this implementation/control/proof/current-state unit; only its matching
`CLEAN` primary/audit aggregate establishes slice completion. This execution
retains the 45-minute limit and stops after this selected unit.

The fifth bounded P1 slice implements cache-owned geometric-density interpolation
and geometry-owned canonical node placement, as owned by
[normalization qualification](local-sun-normalization-qualification.md). Existing
physical models and stored J remain unchanged. New immutable `00012-normalization`
compares all node factors, independent ratios and restored synthetic physical J;
engine/proof type checks, the directional proof and fifteen existing CPU-cache/W27
regressions pass. Field construction/accuracy, transport, GPU, full profiles and
reuse remain open.

The [normalization review receipt](../../../../.codex-tmp/review-standards/session-xgtjTu/validation.json)
owns this implementation/control/proof/current-state unit; only its matching
`CLEAN` primary/audit aggregate establishes slice completion. Execution retains
the 45-minute limit and stops after this selected unit.

The [first P1 slice review receipt](../../../../.codex-tmp/review-standards/session-ZSL45I/validation.json)
owns its complete implementation/proof/current-state unit; only matching `CLEAN`
primary/audit evidence establishes slice completion. The 45-minute execution limit
applies to this slice, not completion of all P1.

P0 derives a production-owned fixture from authenticated immutable contract/layout/
gate parents and retains their complete original derivation record. Offline proof
checks every node/band/row, all 2,049 analytic amplitude boundaries and 11 stencil/
rejection sentinels. Parent-authenticated and portable proofs, different-working-
directory invocation, invalid-option rejection, local strict JavaScript type check
and targeted formatting pass. A bounded ingress parser rejects missing derivation,
geometry, units and row support before typed use; focused damaged-copy proofs pass.
These verify control preparation, not production
numerical outputs. No field generation, GPU/render, reuse, application or resource
measurement is claimed.

The P7 closeout and this production-planning setup form the documentation
handoff. Resume at P1 above after the active topic's minimal reload and reviewer
readiness checks; preserve the ended experiment and its immutable evidence.

The [initial setup review receipt](../../../../.codex-tmp/review-standards/session-AccVDt/validation.json)
records the planning unit's primary/audit outcome before this handoff clarification.
The [handoff review receipt](../../../../.codex-tmp/review-standards/session-TC8g9C/validation.json)
owns this follow-up documentation unit's outcome; only its matching `CLEAN` result
establishes that review's completion. Earlier experiment and P7 receipts retain
their original frozen scopes.

The [checkpoint continuity review receipt](../../../../.codex-tmp/review-standards/session-PmkpgA/validation.json)
owns the refreshed active-topic and status wording for this handoff. Only its
matching `CLEAN` result establishes that documentation unit's review completion;
production implementation remains at the P0 boundary above.

The [cache-shape clarification review receipt](../../../../.codex-tmp/review-standards/session-wHMI2B/validation.json)
owns the earlier plan/status wording, including preservation of the prior
parameter-alignment decision. Its matching `CLEAN` result establishes only this
documentation unit's review completion. The earlier
[parameter-alignment receipt](../../../../.codex-tmp/review-standards/session-5itZyQ/validation.json)
retains its original scope.

The [P0 review receipt](../../../../.codex-tmp/review-standards/session-xlu2SC/validation.json)
owns the complete current contract/control unit, including new authored JavaScript,
ambient contracts and fixture. Only its matching `CLEAN` primary/audit aggregate
establishes P0 completion. Earlier documentation and experiment receipts retain
their original scopes; no numerical implementation acceptance is inferred.

Production reviewer context is refreshed through `review-standards` for the
new route. No temporary standards changes are selected. The permanent experiment
mapping remains intact, and ordinary 8 GiB reserve/owned-process and ten-minute
host controls apply. P6's expired resource exceptions do not carry into this port.
