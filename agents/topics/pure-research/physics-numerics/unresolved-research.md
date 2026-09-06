# Flat/Local Cache Promotion Work

Focus: Physical and numerical claim authority.

Related owners: [caches](../../production-algorithm32/caches/unresolved-research.md), [engineering-studies](../../poc-experiments/engineering-studies/unresolved-research.md).

## Convergence Evidence

The current and preserved reports are:

| Report                                                                                                 |   Bytes | SHA-256                                                            | Result                                                                                                                  |
| ------------------------------------------------------------------------------------------------------ | ------: | ------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------- |
| `archives/algorithm32-flat-local-cache-domain-convergence/report-v1-containing-lower.json`             |  38,475 | `6eab318246a66979245a57cea7138038fff15a8cfe31457ec162662d4da925ab` | rejected the containing-lower implementation and every bounded v1 candidate                                             |
| `archives/algorithm32-flat-local-cache-domain-convergence/failure-diagnostic-v1-containing-lower.json` |  41,607 | `6d1821867b083a4c4964b13797204246184da050c9dfddf3c53284a3386b9690` | attributed the dominant error to coarse spatial lookup and recurrence amplification; no point/direction wiring mismatch |
| `archives/algorithm32-flat-local-cache-domain-convergence/report-v2-bilinear-bounded.json`             |  40,207 | `ec49e9aaf3e5f38322097243b5ff4d3a259c4d718d7cf1530ccc13c052c6bf67` | rejected every 25-126-position bounded v2 candidate                                                                     |
| `archives/algorithm32-flat-local-cache-domain-convergence/report-v3-radial-attribution.json`           |  36,531 | `5b5650a98ff95b8f55e74cb0c48ed57053906cd8db2c8b957347928d9f04da93` | rejected the 171-285-position radial ladder and identified the withheld 50 km and 4.5 Mm radii                          |
| `archives/algorithm32-flat-local-cache-domain-convergence/report-v4-observed-worst-nodes.json`         | 128,109 | `0e656ddd9034a1a2528935a025e1a88de8bcb3da66eef1fd4747f3619c33772e` | selected the combined 19-by-15 candidate under v4's predeclared spatial and resource gates                              |
| `archives/algorithm32-flat-local-cache-domain-convergence/report-post-promotion.json`                  |  37,114 | `4164791f97a67e9d8516c383ced28971f9fb1d9d064a6ab9611cd57097296e19` | verified the promoted default and retained the current production selection                                             |

`report.json` currently duplicates the v4 bytes for the ordinary runner
output. The versioned v1-v4 files are the durable evidence identities.

The resource ceilings did not remain constant across the evidence lineage.
V1's 8 MiB/31-position local cap was rejected as inconsistent with the
accepted spherical W27 cache, which already retains `12,597,120` bytes over
48 positions. V2 predeclared 32 MiB resident and 192 MiB peak tracked limits;
v3 predeclared 80 MiB and 448 MiB to test the bounded 285-position radial
ladder. V4 retained the v3 ceilings unchanged. Each revision and the prior
report it used for attribution were frozen before that revision's candidate
output was observed.

The studies execute production geometry, source, cache, transport, and
recurrence owners. They are not a separately rewritten correctness
implementation and do not claim continuous-field or scientific truth.


## Retained Accuracy And Angular Limits

The project-selected source-transmittance and stored-field transport interval
counts remain 15. Their v4 15-versus-60 characterizations do not pass the
declared numerical limits:

| Study                       | Maximum normalized L-infinity |     p95 normalized RMS | Limit            |
| --------------------------- | ----------------------------: | ---------------------: | ---------------- |
| source transmittance `J1`   |          `0.1383037213124355` | `0.059926328718050564` | `0.02` / `0.005` |
| stored-field transport `L1` |          `2.9966866364064524` |   `0.6023613465061933` | `0.05` / `0.01`  |

V1 and v2 treated these controls as gating and therefore rejected promotion.
After those failures were preserved, v3 and v4 predeclared them as non-gating
selected-control characterizations because the count is an explicit project
selection; that disposition does not turn either result into a pass. They
remain accuracy limitations for future transport-control work.

The W9-to-W27 primary-field supporting study has maximum normalized
L-infinity `0.12356395218299981` and p95 normalized RMS
`0.019647247068740492`; it fails the `0.1` maximum while passing the `0.02`
p95 limit. This rejects W9 as sufficient. It does not reject W27 or establish
beyond-W27 convergence because production has no denser W owner.


## Required Ground And Occlusion Behavior

- Ground-bound incident segments use the selected production ground reflection
  contract and retain atmosphere transport through the hit.
- The completed Stage 8 ground recurrence participates at every applicable
  local-cache order. Omitted, explicit-zero, and nonzero boundaries are covered
  through the CPU/GPU construction and lifecycle seams.
- Atmospheric shadows from scene objects, volumetric shafts, and moving
  blockers are deferred unless explicitly promoted; view-ray shortening alone
  does not imply cache-construction occlusion.
