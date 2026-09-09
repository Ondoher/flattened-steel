# D0 Decision: Promote The Proven Mechanism

## Recommendation

Recommend production promotion of the contained candidate's mechanism, subject
to separately authorized work under the production-owned design and plan. The
recommendation is deliberately narrow: adapt the `8x8` shared-coordinate
blocks, `float32-byte-lane-v1` transform, Zstandard level 6, content-addressed
metadata, Worker decoder contract, and bounded wavelength-at-a-time generator.
Do not import this experiment at runtime or treat its scripts as production
implementation.

## Evidence Comparison

| Gate | Control or bound | Accepted evidence | Decision |
| --- | --- | --- | --- |
| Exactness | Every current payload must be byte-identical. | E1 reconstructs all 109 payloads through the published graph; E2 reconstructs and publishes measured scenes exactly; E3 freshly regenerates and reconstructs all 109. | Pass. |
| Complete candidate size | At most 600 MB. | E1 `8x8` / level-6 graph: 506,490,201 bytes, including metadata. | Pass. |
| Storage change | C0: 17,230,493,726 bytes. | Candidate: 506,490,201 bytes (97.0605% smaller). | Material improvement. |
| Generation time | At most 900,000 ms on the comparison machine. | E1 completed in 662,050 ms. E3's durable run record completed its fresh GPU recurrence, staging, compression, and reconstruction in under nine minutes; the recurrence itself was 294,294.1 ms. | Pass. |
| Decoded working bound | Largest decoded block at most 16 MiB; retained target 64 MiB. | Largest block: 15,582,720 bytes. E2 retained 62,330,880 bytes after pins released. | Pass. |
| Browser behavior | No regression of last-good publication, cancellation, corruption, supersession, or texture-free boundary behavior. | E2 exercised four-way scheduling, coalescing, corruption, isolated/final cancellation, stale-response rejection, and last-good publication. | Pass for the contained transport. |
| Fresh generation lifecycle | One recurrence per wavelength, bounded staging, exact publication only. | E3 ran 15 recurrences, used 17,227,670,880 bytes of preallocated scene staging and 1,337,679,120 bytes of canonical staging, produced 89 blocks, and reconstructed all 109 scenes exactly. | Pass, with disk capacity as an operational requirement. |

## Accepted And Rejected Alternatives

- Accepted: `8x8` tiles, byte-lane shuffle, and Zstandard level 6 from E1
  `000041-e1-format-compression`; it is the smallest complete candidate among
  the qualifying alternatives and gives the selected request/reuse profile.
- Accepted: Three r180 `zstddec` WebAssembly fallback from E2
  `000055-e2-browser-transport`; Chrome 153 did not supply native Zstandard.
- Accepted: wavelength-at-a-time, file-scattered generation from E3
  `000064-e3-bounded-generator`.
- Rejected: the alternate E1 layout/codec candidates because they are larger
  or provide an inferior selection outcome under the declared rule. Native
  browser Zstandard is not selected because it was unavailable in the
  qualifying browser.

## Required Production Constraints

- Preserve the exact value, block, hash, and publication contracts; production
  must independently validate them against its own fixtures and architecture.
- Retain the WebAssembly decoder fallback and the 64 MiB decoded-retention
  policy unless a separately qualified replacement is adopted.
- Provision at least the measured 17.23 GB temporary scene-staging capacity
  plus 1.34 GB canonical staging for a comparable full regeneration, or
  separately design and qualify a lower-disk production generator.
- Keep the generator transactional: no partially generated candidate may
  replace a published package.

## Evidence Identities

- C0: `000022-c0-production-control` -
  `0cbe7d12045136623a254852c19eb3eddc0e36127d404d8c63169c4147ee24a7`
- E1: `000041-e1-format-compression` -
  `19d79885512d628ad874501b3c854b86eae2dfc374910bdae1dbc6569c96cf4a`
- E2: `000055-e2-browser-transport` -
  `433594b98968aafe02eee61f77af73be73ca7c0a080122fad88285b6729eeade`
- E3: `000064-e3-bounded-generator` -
  `6f588d42127f92d95985cfc63ec215dd46aa31337215e3fd27ecd22c831b3905`

This decision completes the contained experiment. It does not authorize a
production change.
