# Distant-Sun Cache Optimization Experiment Status

Status: C0 accepted; E1 is ready.

## Current State

C0 is complete. Immutable run `000022-c0-production-control` pins the deployed
inventory, completed measurement contract, implementation identities,
environment, and current production browser behavior. The read-only verifier
recomputed every artifact identity and the canonical artifact-set identity.

The control authenticated 109 packages totaling 17,230,339,148 package bytes
and 17,230,493,726 complete deployed bytes across 438 artifacts, with
70,756 row occurrences and 5,494 distinct coordinates. Its browser control ran
all ten scenarios on Chrome 153 and an RTX 2060 D3D11 WebGL2 path. Cold load
was 2,732.4 ms and 4 requests / 161,208,219 bytes; exact reuse was 0.1 ms and
no request; adjacent replacement was 2,446.2 ms and 4 requests / 161,208,253
bytes; nonadjacent replacement was 3,888.1 ms and 4 requests / 161,208,249
bytes; warm replacement was 2,415.2 ms and 1 unique request / 161,183,760 bytes.
Failure preservation, supersession, cancellation, context restoration, and
the dark boundary all passed. Cancellation owns its one aborted request and
zero completed response bytes; context restoration independently owns its one
payload request and 161,183,760 completed bytes.

## Latest Verification

- `start-experiment` scaffold create and check modes pass.
- Output root: `tmp/experiments/distant-sun-cache-optimization/`.
- The output root is ignored by Git; the source root contains only authored
  experiment instructions and no generated artifact.
- Normalization attestation:
  `sha256:48e285217b8a224caae6e1a43d44cacc59e1acf215c1417a773ddd9604c88791`.
- Folder standards: `proof-tools` for experiment source and `base` for topic
  documents; no repository overlay entry applies. The proof-tools mapping adds
  server-boundary review for the contained loopback browser host.
- Topic-refresh and applicable review eligibility gates pass under the current
  folder mapping; lifecycle fingerprints remain session evidence rather than
  self-referential topic state.
- Formatting and topic-link validation pass except for the known missing link
  in protected historical Algorithm32-Star documentation.
- Accepted production-control run: `000022-c0-production-control`.
- Artifact-set SHA-256:
  `0cbe7d12045136623a254852c19eb3eddc0e36127d404d8c63169c4147ee24a7`.
- Read-only sealed-run verification: 16/16 artifacts and the artifact-set
  identity passed.
- Accepted infrastructure proof: `000020-c0-infrastructure-proof`, 35 checks,
  artifact-set SHA-256
  `2b3225ea042e46db3a356d7b6887b13120a145d5dc797a1b4f08e004865c68e4`.
- Accepted sealed infrastructure subject: `000021-c0-infrastructure-subject`,
  artifact-set SHA-256
  `f8cf84fe13d8d0767bbb7f50cb47145284623351c68eb899aba335c167418ece`.
- Complete deployed storage: 438 artifacts / 17,230,493,726 bytes.
- Peak sampled browser heap: 1,899,805,773 bytes; peak Node resident set:
  225,333,248 bytes; peak Node heap: 18,030,840 bytes; peak logical GPU
  transition: 370,652,760 bytes.

## Blockers

None recorded.

## Next Action

Execute E1 against the accepted C0 contract by comparing the four tile layouts
and pinned Zstandard profiles with exact reconstruction of all 109 scenes.
