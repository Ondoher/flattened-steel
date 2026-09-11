# Shared-Inventory Generator Qualification

The current generator incorporates the expanded point-local compiler. Its
[consolidation and complete deployed-payload compatibility proof](../../../../archives/topics/production-algorithm32-release-20260911/agents/topics/production-algorithm32/caches/point-local-compiler-promotion-plan.md#production-compiler-consolidation)
qualify that successor. The P2 release evidence below remains immutable.

P2 is implemented and numerically qualified. The production generator computes
one common field per Native15 wavelength, preserves the existing J1-J4 arithmetic,
and writes bounded 64-row readbacks directly into 89 canonical `8x8` blocks.
It authenticates the immutable controls, round-trips every compressed block,
reopens the persisted metadata graph, and reconstructs all 109 controls exactly.

## Accepted Run

The immutable run is
`tmp/production-algorithm32/distant-sun-shared-block-cache/runs/2026-09-10T14-57-40-947Z-f747d2ec-9571-474f-89e6-b0783bbf3752/`.
Its `sealed.json` authenticates `acceptance.json`, whose parents authenticate
the source snapshot, parameters, GPU execution, and complete verification.

| Measurement | Result |
| --- | --- |
| Complete package bytes | 505,724,079 (limit 600,000,000) |
| Generation including final verification | 286,678.8677 ms (limit 900,000) |
| Exact control reconstructions | 109 / 109 |
| Canonical blocks / populated coordinates | 89 / 5,494 |
| Authenticated persisted metadata artifacts | 114 |
| Canonical staging | 1,337,679,120 bytes |
| Working disk before publication | 1,909,953,832 bytes (limit 2,147,483,648) |
| Avoided duplicate scene staging | 17,227,670,880 bytes |
| Peak Node RSS | 257,142,784 bytes (limit 1,073,741,824) |
| Peak Node ArrayBuffers | 131,154,877 bytes |
| Maximum tile readback | 1,119,744 bytes |
| Browser common-field accumulator | 192,246,048 bytes |
| Compression and metadata | 50,010.8707 ms |
| Final verification | 149,144.6968 ms |

Package-set identity:
`7e80317f53c79d0d5a30ebc006630213a2e758008c62a3abb14d2534a8cc2b99`.
Root report SHA-256:
`eee22091d2f1deb8e992f22be47243a07e7f4bc9462d25ee89683352cca19069`.
Verification artifact SHA-256:
`3724f6809e7ebae710be0cbc5deddff67755263b5df113054aac616ebd8c9fd0`.
Source snapshot SHA-256:
`b3807771c5875f4630e9a6df8157bd93f697d8c4741f06b60f158ead6f7254fe`.

The measured direct-scatter strategy qualifies the lower-disk alternative to
duplicate scene staging. Node RSS excludes the Chrome process and driver;
browser/driver and runtime GPU peaks remain P7 qualification obligations.
Earlier numerical trials remain immutable and are not the final P2 authority.

## Execution And Failure Evidence

Run `npm run build:algorithm32:distant-sun-cache:shared` with the installed
Chrome executable, optionally selected through `CHROME_PATH`. Every invocation
allocates a new ignored run. Publication atomically renames the complete
candidate inside that run; it does not change deployed selection.

`npm run test:algorithm32:shared-generation` covers exact codec bit patterns,
truncation and allocation bounds, tile sequencing and direct offsets, invalid
spectra and seam disagreement, path containment, pre-cancellation, and
deterministic cancellation after staging allocation. Five additional real
Chrome/Node host cases exercise post-launch cancellation, deadline, browser
exit, rejected completion, and malformed HTTP input. Each proves child-process,
server-port, and abort-listener cleanup. All ten tests pass.
`npm run typecheck:algorithm32:shared-generation` passes.
The Algorithm32 suite passes all 622 tests.

`npm run verify:algorithm32:shared-publication-failure` completed a separate
full generation at
`tmp/production-algorithm32/distant-sun-shared-block-cache/runs/2026-09-10T14-39-30-162Z-92af6c4a-bb61-4234-a39d-6bfad7db3699/`.
Its injected observer failure follows the atomic publication rename. The proof
authenticates the published graph and all-scene verification, preserves the
published package, and reports the precise published-but-unsealed state without
claiming an unpublished failure. `publication-fault-proof.json` has SHA-256
`5b36f089d733bd2a58533c81f1608d8b17d4a42e6eff77c0251dc4f72def3b13`.
The runner-source snapshot and provenance companion identify the exact proof
implementation. This fault run remains diagnostic evidence, not an accepted
release candidate.

A separate immutable metadata-fault proof at
`tmp/production-algorithm32/distant-sun-shared-block-cache/runs/metadata-fault-proof-da32d5be-300f-4452-b0dd-be2d29667004/`
reopens all 114 metadata artifacts and rejects modified root and child bytes.
Its provenance companion identifies the full immutable parent path.

P3 owns browser transport and Worker preparation. This generator qualification
does not qualify the future renderer, activate the package, or satisfy P7/P8.
