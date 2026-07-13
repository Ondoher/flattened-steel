# Algorithm32 Short-Name Migration Map

Status: Steps 8.1-8.5 and all of [reconciliation Step 8](./reconciliation-plan.md#8-replace-unclear-short-variable-names) are complete on 2026-08-04. This document and its three appendices are the canonical migration and closure evidence.

## Exact Scope And Method

The reproducible TypeScript-AST scan covers variable, parameter, binding-element, and import bindings in every Algorithm32 JavaScript, JSX, and ambient-declaration file. A syntax-aware literal scan covers GLSL declarations in authored string and template-literal source. The scan is fixed to source identity `sha256:b523e1ed23e5d77fc768f53d3d35184d248d02816e716ccf0fd7d889c92387c5`.

The one-to-three-character seed contains 302 JavaScript/JSX/declaration bindings and 28 authored-shader declarations (330 total). Manual review of all 2311 four-to-six-character declarations adds 118 context-review rows. The audit universe therefore contains 448 unique declarations: 198 are excluded as accepted unambiguous conventions. The migration surface contains the remaining 250 declarations: 242 renames and 8 retained formula symbols.

The appendices own every exact declaration, its semantic role, replacement or exception, symbol-resolved references or authored-source literal, implementation batch, and focused gate:

- [Step 8.2 map](./short-variable-migration-map-8.2.md): 55 migration/formula declarations.
- [Step 8.3 map](./short-variable-migration-map-8.3.md): 107 migration/formula declarations.
- [Step 8.4 map](./short-variable-migration-map-8.4.md): 88 migration/formula declarations.

These migration ownership sets are exact and non-overlapping. Accepted conventions are intentionally absent from the migration appendices: they require no source action and are not formula exceptions. The scan deliberately does not treat external property or method keys as local bindings. A destructuring rename aliases the external key to the mapped local name; it does not change the key. `config` and `props` are accepted standard abbreviations. `id`, `row`, `key`, `min`, `max`, and `sum` remain only where the lexical context has one role of that kind and implies its type. Coordinate `x`, `y`, and `z`, including their already descriptive index/range derivatives, remain only where one coordinate system is present. No test may assert that an old name disappeared or that a rename occurred. Existing tests are updated only where their current positive behavior contract uses an affected binding or authored shader string, and type checking owns stale-reference rejection.

| Accepted exclusion family | Declarations excluded from migration appendices |
| --- | ---: |
| Standard abbreviations `config` and `props` | 27 |
| Unambiguous `id`, `row`, `key`, `min`, `max`, and `sum` | 89 |
| Single-system coordinates and clear coordinate derivatives | 82 |
| **Total** | **198** |

## Formula Exceptions

Only `a` through `h` at `src/algorithm32/utils/identity/CanonicalValueHash.js:88` survive. They are the eight 32-bit SHA-256 working variables used directly by the compression loop. NIST FIPS 180-4 section 2.2.1 names `a` through `h` as hash-computation working variables, and section 6.2.2 initializes and updates those exact symbols [6]. Preserving the symbols makes the implementation-to-standard correspondence clearer. Step 8.2 added the adjacent code citation without changing the formula.

No other formula candidate qualifies. In particular, phase-function `g`, `nu`, and `k`; quadratic `a`, `b`, `c`, and `halfB`; ambiguous coordinates; scattering-order `J*`/`L*` shorthand; and SHA helper names `sigma0`, `sigma1`, `sum0`, and `sum1` receive descriptive names. Familiar notation, an internal convention, or resemblance to a formula is not external-formula evidence.

## Batch Gates

| Gate | Required focused evidence before the batch closes |
| --- | --- |
| `FAR` | Affected adapter, assembler, GPU runtime/backend, ground, profile, quantity, reference, runtime-rendering, identity, and math specifications; `npm run typecheck:algorithm32`; `npm run typecheck:flat32`; affected Prettier check. |
| `ACDG` | Affected canonical-atmosphere, Bruneton color, cubed/Fibonacci direction, flat/spherical geometry, cache-domain, shader-source, and Three endpoint specifications; both type checks; affected Prettier check; Three/WebGL lane when authored shader source changes. |
| `ELT` | Affected Sun synchronization, distant/local/shared light-source, cache-controller/provider/evaluator, field-packing, transport, and spectral-calculator specifications; both type checks; affected Prettier check; Three/WebGL lane when lighting or shader source changes. |

Every source batch also runs `git diff --check`, exact import resolution, and a focused post-edit AST/literal rescan of its ownership set. Step 8.5 owns the complete Node, Three/WebGL, Flat32 UI, policy-integrity, formatter, type, current-name, import, and hygiene closure. The naming scan is current-state analysis only; it does not preserve retired identifiers as tests, aliases, fixtures, or negative assertions.

## Independent Closure

Step 8.5 independently reproduced all 242 descriptive migrations at completed source identity `sha256:cb9ee9cc20b896b2ca504fe74063859b6e32bc41d27dea1635b9f9af4aa5825d`. Its current-state scan covers all 287 code/declaration files and 7,948 AST bindings. The 161 remaining one-to-three-character bindings are exactly 153 accepted contextual conventions plus the eight cited SHA-256 working variables; 690 authored-shader declarations contain no one-to-three-character name. Review of all 2,190 current four-to-six-character AST declarations (222 unique names) and 26 unique shader names found no unexplained opaque binding. Thirteen representative external/public-key aliases remain exact, and all 597 relative clauses resolve with zero cycle or production-to-test edge.

Both type checks and the complete formatter scope pass; Node passes 456/456 in 89.031 seconds; approved browser reruns pass Three/WebGL 5/5 and Flat32 UI 3/3 after sandboxed Chrome launch returned `spawn EPERM`; policy integrity passes 1/1; and whitespace, final-newline, and diff hygiene pass. No implementation correction, historical rename test, compatibility artifact, ambiguity, or exception remains.
