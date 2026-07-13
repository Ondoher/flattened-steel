# Code Conventions

Status: repository-wide starting standard. This document owns code formatting,
file and identifier naming, placement, class and utility modules, validation
boundaries, and diagnostics conventions. Domain standards may add a narrower
rule only by linking here and recording the exception.

## Formatting

Indent code with tabs, not spaces. The conventional single space before the
leading `*` in a JSDoc block is comment syntax, not code indentation. Use
semicolons wherever JavaScript syntax or a statement boundary requires them.
Use the repository-pinned Prettier installation for supported authored files.
The root [Prettier configuration](../../../.prettierrc.json) is the canonical
owner of mechanical formatting such as wrapping, spacing, quotes, trailing
commas, parentheses, and line endings; do not duplicate those settings in a
narrower standard. Prettier does not reorder imports, so preserve the
established local import order unless its owner records a different rule.
Verify formatted scopes with Prettier's check mode and `git diff --check`.
Source review remains responsible for unsupported formats and non-mechanical
organization.

## File Naming And Placement

- A file containing one class uses that class's `PascalCase` name.
- Interface and React component files use the interface or component's
  `PascalCase` name.
- Files that are not classes, interfaces, or components use `kebab-case`.
- A namespace-style method owner is the exception: it uses the namespace's
  `PascalCase` filename, exports that namespace as its sole public symbol, and
  has a genuine cohesive method-set contract.
- Service implementation filenames use `kebab-case` unless the service is a
  class or an established namespace convention has a documented exception.
- Module-level named constants belong in the owning scope's `consts.js`; do
  not export constants from a class implementation file.
- CSS and image filenames use `kebab-case`.
- Place lower-level helper operations before composed callers; public
  orchestration methods generally appear last.
- Prefix an intentionally unused parameter with `_`.

## Identifier Naming

Use descriptive variable and parameter names that state the value's role.
Single-letter and other short names are not justified by a small scope,
familiar loop pattern, callback convention, or nearby type information alone.

`config` and `props` are accepted standard abbreviations. `id`, `row`, `key`,
`min`, `max`, and `sum` are acceptable when the lexical context contains only
one value with that role and makes its type unambiguous. Coordinate `x`, `y`,
and `z` are acceptable when the lexical context uses only one coordinate
system. Rename these identifiers when multiple identities, row/key kinds,
ranges, accumulations, or coordinate systems would make the short name
ambiguous.

A different short name is permitted only when the implementation directly
expresses an externally documented formula and preserving that formula's
symbol makes the code clearer than a descriptive name. Record the external
formula authority in the owning documentation or an adjacent comment, and
make the code-to-formula mapping unambiguous. Outside the accepted unambiguous
conventions above, rename the binding descriptively without that evidence.
This rule applies to
module and local variables, parameters, loop and catch bindings, destructured
aliases, and identifiers embedded in authored shader source. It does not
require renaming a property or method owned by an external API.

## Test Scope

Tests assert current observable behavior and positive public contracts. Do not
add tests whose purpose is to prove that an implementation variable, property,
method, module, or other identifier was removed or renamed, and do not retain a
retired name as a negative assertion. Update typed consumers to the current
contract and let type checking reject stale references. Source review and
current-state static analysis may enforce naming rules without preserving old
identifiers as test artifacts.

## File Size

Keep class implementation files below 1,000 lines. Flag and plan a split as a
class approaches that boundary; split by coherent ownership or responsibility,
not merely by arbitrary line count. Specification files may exceed the class
limit when their cases require it, but flag them as they approach 1,200 lines.
Existing larger files are cleanup candidates, not evidence that the limit does
not apply to new or materially changed code.

## Class Files

- A class implementation module exports exactly one symbol: its class.
- Do not additionally export constants, helper functions, factories, or
  unrelated types from that module.
- Class-specific support operations belong on the class as private instance
  methods, including pure operations that do not read instance state.
- Do not use private static methods or module-local functions for support that
  belongs only to that class.
- Private fields and methods use one leading underscore, such as `_cache` or
  `_buildCache()`. Do not use ECMAScript hash-private names.
- Source review and static analysis own class-shape rules. Tests exercise
  observable behavior, numerical results, and lifecycle behavior rather than
  parsing or asserting implementation shape.

## Utility Files

Move a pure operation to a utility only when it has a genuine reusable
contract beyond one class. Favor namespace-style utility modules by collecting
reusable methods with a similar domain under one cohesive owner. A
namespace-style utility uses a `PascalCase` filename, exports only that
namespace, and does not become a container for unrelated helpers. Use an ordinary
`kebab-case` utility module only when a namespace method-set would misstate the
contract. Shared constants belong in the owning `consts.js` file.

Do not separate an operation from a class merely to populate a namespace. Its
inputs, outputs, semantics, and lifecycle must demonstrate broad applicability
independent of that class's responsibility. Purity, similar naming, or
hypothetical future reuse alone is insufficient; class-specific support stays
on the class.

Consolidate similar-domain utility methods into their nearest namespace owner
instead of distributing them across ordinary function modules. Do not create
single-function modules or combine unrelated operations merely to form a
namespace.

Evaluate an existing multi-function module at the function level; current
co-location does not prove that every export has the same owner. After each
function satisfies the class-independent applicability rule, move it to an
existing namespace when that namespace owns its domain. Otherwise, collect it
with other qualifying methods in a new cohesive namespace. One ordinary module
may therefore distribute its exports across several namespace owners rather
than survive as an arbitrary grouping.

## Factories And Profiles

Factories add indirection and complexity; avoid them unless construction has a
real independent lifecycle or reusable orchestration contract. A caller
supplies optional types and choices rather than relying on a factory to infer
or conceal them.

A profile is a named type with one documented default and caller-supplied
overrides. It includes every configurable option relevant to the profile, such
as scattering depth, and identifies each difference from the paper or other
reference configuration it represents.

## Generated Files

Generated files are files produced by utility code, not files authored by an
agent. Keep utility-generated files to the minimum necessary. They follow the
standard filename convention for the content type they contain: class,
interface/component, namespace, or ordinary module. Generated output remains
subject to the repository's ownership and containment rules. Agent-authored
files follow the ordinary file naming and placement conventions.

## Validation

JSDoc, ambient types, and the type checker own JavaScript object shape,
required members, unions, and assignability. Runtime validation occurs only at
a genuine ingress: an external caller, configuration source, serialized
payload, renderer, operating environment, or other untrusted provider.

At ingress, validate and normalize semantic facts that static typing cannot
prove, including supported values, finite physical inputs, resource bounds,
live runtime capabilities, cancellation, resource ownership, and lifecycle
state. After acceptance, internal code trusts the contract and repository
constants; it does not repeat JavaScript type or shape checks at downstream
seams. Descriptors are identity, fingerprinting, reporting, and diagnostic
metadata, never runtime validation inputs.

## Diagnostics

Descriptors may report identity, fingerprinting, reporting, and diagnostics,
but may not validate executable facts, select algorithms, calculate indexing
or packing, or recover an executable fact. A repository-wide diagnostic/logging
standard is deferred: do not add a general severity, structured-payload,
retention, redaction, or public-diagnostic API policy until its owner is
explicitly designed. Algorithm32 experimental diagnostics remain governed by
its dedicated standard.

## Remaining Ambiguities

No unresolved policy remains in this document's initial scope. The
repository-pinned Prettier installation and root configuration resolve the
formatting-tool decision. A future change to that formatter or configuration,
the file-size thresholds, or the deferred diagnostic policy requires an
explicit update here before broad adoption.
