# Algorithm32 Documentation Inventory

Status: reconciliation Steps 6.1-6.3 complete on 2026-08-04. This document owns
the complete documentation-inventory scope, schema, closure counts, and handoff
to [Step 7.1](./reconciliation-plan.md#71-classify-unit-suffixed-names).
The row-level record is partitioned into three appendices:

- [Ambient declarations](./documentation-inventory-declarations.md)
- [Production JavaScript and JSX](./documentation-inventory-production.md)
- [Test and browser JavaScript](./documentation-inventory-test-browser.md)

## Scope And Source Identity

The inventory covers every JavaScript, JSX, and ambient-declaration file under
`src/algorithm32` at source identity:

`sha256:7d7810f7b69b7516bfdd25058360d62cd4b586176d7692ca90fd5655f1398832`

The identity is the SHA-256 of each sorted repository-relative path and its
bytes. It fixes all row locations and prevents a later JSDoc rewrite from
silently treating this inventory as a different source snapshot.

The TypeScript AST walk includes every type alias, interface, class, property
signature, class field, explicit accessor, module constant or mutable field,
function, method, callback, explicit constructor, and generator. Callback
coverage includes function types, call signatures, assigned function values,
object methods, production closures, and anonymous Jasmine/browser callbacks.
It excludes imports, exports, local scalar bindings, parameters as standalone
rows, object-literal data keys, and control-flow blocks because none is an
independently documented entity under the current JSDoc standard. Parameter,
return, yield, throw, overload, asynchronous-outcome, error-class, and union
evidence is attached to the owning row.

## Exact Coverage

| Surface | Files | Inventory rows |
| --- | ---: | ---: |
| Ambient declarations | 81 | 3059 |
| Production JavaScript/JSX | 131 | 1742 |
| Test/browser JavaScript | 75 | 1676 |
| **Total** | **287** | **6477** |

Seven re-export-only barrels have zero independently documentable target and
are recorded explicitly in the production appendix. Every other scoped file
has at least one row. All row keys are unique, and all files parse without a
TypeScript syntax diagnostic.

### Rows by entity or callable kind

| Kind | Rows |
| --- | ---: |
| `accessor-get` | 52 |
| `callback` | 1398 |
| `class` | 112 |
| `constant` | 225 |
| `constructor` | 99 |
| `field` | 253 |
| `function` | 405 |
| `interface` | 45 |
| `method` | 1170 |
| `module-field` | 1 |
| `property` | 2060 |
| `type` | 657 |
| **Total** | **6477** |

No generator or error-class declaration exists in this source identity. Their
zero result is explicit rather than an omitted category. Exactly two ambient
method overload groups exist: `setViewport` and `setScissor` on
`ThreeCacheBackendRendererOperations`.

## Documentation Form Inventory

Each row records both its detected current form and its required form. A
`descriptive-other` row has a prose description that does not begin with one
of the standard's exact callable prefixes and is the compliant noun-oriented
entity/value form. `active-other` likewise identifies
action-oriented prose without an exact standard prefix. `Missing` and
`tag-only` are separate so a tag block cannot masquerade as a description.

| Current form | Rows |
| --- | ---: |
| `call-this-method` | 743 |
| `called-by` | 2230 |
| `creates` | 99 |
| `descriptive-other` | 3405 |
| **Documented rows** | **6477** |
| **Missing rows** | **0** |

| Required form | Rows |
| --- | ---: |
| `active-callable` | 743 |
| `called-by` | 2230 |
| `creates` | 99 |
| `entity/value` | 3405 |
| **Total** | **6477** |

`entity/value` applies to non-callable entities and accessors; `creates` to
constructors; `iterates-over` to generators; `called-by` to internal methods,
module-local support, and callbacks; and `active-callable` to public/exported
functions and methods. The appendices preserve the closed descriptions and
contracts without narrowing the inventory surface.

## Callable And Special-Contract Inventory

- The source contains 2734 `@param` tag lines and 0 missing separator hyphens.
- The source contains 2270 `@returns` tag lines and 0 missing separator hyphens.
- 0 callable rows have at least one syntactic parameter without a matching current `@param` tag.
- 0 callable rows contain or declare a value return without a current `@returns` tag.
- 73 callable rows are explicitly async; 0 have no current rejected/cancelled/aborted/superseded-outcome wording.
- The source contains 0 `@yields` tag lines and 288 `@throws` or `@exception` tag lines; 0 throw tags lack the separator.
- All 61 named string unions and their 183 members retain exact member-bullet coverage; the mismatch count is 0.

The independent Step 6.3 contract audit additionally finds 248 callables with
a direct caller-observable throw and zero without an error tag, plus 201
branched or conditional value-return contracts and zero without selection
language. Both overload groups identify their accepted vector and scalar call
shapes. Anonymous callback rows remain visible and complete.

## Completion Checks

- Scoped files: 287 expected, 287 inventoried exactly once by file surface.
- Inventory rows: 6477 total and 0 duplicate row keys.
- Parse diagnostics: 0.
- Files without an independently documentable target: 7, all named re-export-only barrels in the production appendix.
- Named string-union documentation mismatches: 0.
- Stable rows and normalized semantic AST tokens match the pre-Step 6 rewrite
  baseline; implementation behavior and supported contracts are unchanged.

Steps 6.1-6.3 are complete. Step 7.1 is current and must preserve these exact
row keys and the closed documentation surface while classifying unit-suffixed
names.

