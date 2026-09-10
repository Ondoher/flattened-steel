# Shared Runtime Rollout

Status: P8 complete. Published and accepted after local production-router
observation, rollback, bridge removal, and focused final review.
This is the shared-cache P8 promotion, not a claim that the separate Color Reset
application release or outstanding source/redistribution work is complete.

## Selected Package And Observation

The production resolver selects only package
`7e80317f53c79d0d5a30ebc006630213a2e758008c62a3abb14d2534a8cc2b99` under
`server/flat32/data/shared-block/`. The selection owner is
`server/flat32/features/shared-cache/selection.js`; it pins the exact P2 report
accepted by [P7 qualification](shared-runtime-qualification.md).
`npm run publish:algorithm32:shared-runtime` authenticates every source artifact,
copies exclusively, verifies every destination hash, and reauthenticates the
complete graph. The report is published last; an existing report seals the root
and subsequent invocations only verify it. Missing or differing sealed bytes
are rejected rather than repaired or overwritten.

These immutable run roots are relative to
`tmp/production-algorithm32/distant-sun-shared-block-cache/qualification/`:

| Evidence | Run | Result SHA-256 |
| --- | --- | --- |
| Complete 505,724,079-byte publication | `2026-09-10T18-38-45-131Z-d5971e0d-3ed0-4d32-be8f-47e240cc6400` | `1b3165e80e301df2a3a01d19e7cee710ad9be65647e9deb6a03f917e1596882e` |
| Real-router shared → dense rollback → shared | `2026-09-10T18-40-46-239Z-4a5a3286-0246-4051-bad1-3070b7a89499` | `960d0efc1e940f15267d4c1ae6427dd1788187f37df1ca8c5c84a694109b7d0a` |
| Actual shared application through production routes | `2026-09-10T18-40-49-641Z-95e3a388-1bbb-40c8-b063-b25e68a43561` | `4d1390508cd80b2adcdeadc2ff45023a0384b9677fbcaed4f63b83cad49762f2` |
| Initial dark state, daylight reuse, target-qualified seeks, restoration/disposal | `2026-09-10T18-43-54-546Z-a9b2deb2-5095-4545-8463-50317d0a0d2a` | `d2645c52175ea9a14bfdc0c79bb24e869804635741ebfe2b405242c8c6f5d25b` |
| Final production dependency graph | `2026-09-10T18-54-15-964Z-c0fa0069-bc6e-4e6b-bed1-e0e5332ccb23` | `34613a7f188ae20e29db2598f65ef2a86ba5b10fabd80cf06cbce8b8931252f0` |
| Final shared-only router and application lifecycle | `2026-09-10T18-56-13-736Z-cd671efc-049b-4d19-8a40-1cc48dd45796` | `ac07e7e60eaa020610a591c08e0d96be2750e3208a2a5cc6d7c50dcea60d26d7` |
| Complete read-only revalidation of the sealed deployment | `2026-09-10T18-58-17-089Z-d6f21e82-fa17-4262-82cb-68926610859a` | `247e1eb599402694782077ba62446543596a977ef10214f0734d527a27c75606` |

The observation window exercised the real repository router on loopback, exact
deployed identities, complete responses despite Range requests, cache/content
headers, invalid paths and scalars, coherent application transitions, darkness,
and restoration/disposal. It was a local production-host observation; no remote
deployment, public publication, or external traffic soak was performed.
The rollback changed only selection and left both immutable package sets intact.
Its router source is retained in the rollback run. The final acceptance decision
is to activate the qualified shared path and remove the temporary dense switch.

Dark selections retain authenticated metadata and one shader runtime, allocate
no cache-data atlas, and request no encoded blocks. Dual-atlas transitions are
enabled only for the exact qualified package/evidence, RTX 2060, Chrome 153, and
ANGLE D3D11 observation. Other targets use the bounded policy and coherent holds;
allocation failure retains the direct-scene or last-good fallback. The larger
route-resident policies remain unselected.

## Retired Production Surfaces And Preserved Evidence

The production router no longer imports the dense service or exposes its files.
The application and HTTP resolver reject dense selections. The source-owned
runtime no longer constructs a dense asset loader; those two implementations
are retained under the cache's `_tests/reference/` for numerical controls and
celestial fixtures. Only the qualification browser installs the explicit dense
reference adapter; no production module imports it.

The former inventory builder, verifier, assembler, and temporary rollback driver
are preserved byte-for-byte as `.js.txt` records in
`scripts/algorithm32/solar-zenith-cache/retired/`. Their active entry points and
package commands are removed. Shared generation retains its production numerical
compiler and common input owners. Historical PA harness sources remain unchanged;
their obsolete package-script registrations are retired, including PA3-PA6
verification, PA6 scene construction, and PA6 finalization. Reproduce the
unchanged historical harnesses with checkpoint `f1589984` and the recorded immutable
inputs rather than importing their retired loaders into production.

The 109 dense packages at
`server/flat32/data/one-degree-bin-covered-runtime-packages-20260830-1/`
remain an operational **reference-only numerical oracle** for shared generation
and verification. They are absent from the served inventory. Deleting that live
reference would break the current generator/verifier and violate the evidence
preservation boundary. Their original ZIP and restoration index remain unchanged.
The served cache inventory is the single 505.7 MB shared package.

## Final Verification

The production application and Worker build passed. The resolved production
browser dependency graph contains no experiment, external comparison,
reference-test, or retired dense-loader module. All 39 affected Algorithm32
specs, 23 affected Flat32 specs, the additional target-policy browser test, and
three server tests passed. A different GPU, different Chrome major, or missing
renderer identity selects the bounded allocation. Type checking includes the
publication and dependency-verification commands; repository formatting and
Git whitespace checks pass. Consolidated P8 architecture and security/integrity
reviews closed with no remaining findings. No full standards ledger is claimed.

The broader P7 verification and its disclosed pre-existing local-Sun fixture
hash mismatch remain in the [qualification owner](shared-runtime-qualification.md).
