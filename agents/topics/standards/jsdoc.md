# JSDoc Conventions

Status: repository-wide starting standard. JSDoc documents runtime JavaScript
and names the ambient contracts owned by [Type Conventions](types.md).

## Complex Parameters And Returns

Every complex parameter and return type has a named ambient type in an
included `types.d.ts` file. Do not express a complex shared shape as an inline
JSDoc object literal, repeated typedef, `import(...)` type expression, or
local type alias. Simple primitives and plainly local scalar values may use
their direct JSDoc types.

## Type Documentation

Document every ambient alias and interface with its purpose. Document every
property with its meaning, ownership, optionality, unit/quantity contract when
applicable, and any lifecycle or mutability constraint that callers must
observe. JSDoc refers directly to those named types.

## Entity And Value Descriptions

Describe every non-callable entity or value as what it is, contains, owns, or
represents. This rule applies to types, classes, interfaces, properties,
accessors, fields, constants, parameters, return values, union members, and
similar declarations or values. Use a noun phrase or noun clause that states
what the entity or value is, not an imperative or action-oriented description.
Action-oriented wording belongs to callable documentation. For example:

```ts
/** Unique identifier for the construction-domain selection. */
readonly id: string;
```

Do not write `Identify the exact construction-domain selection` for this
property: reading `id` does not perform the action of identifying something.
Likewise, describe an interface as a contract, a class as the kind of object it
represents, and a type alias as the value or relationship it defines. A class
description follows this entity rule; its constructor separately follows the
callable constructor rule.

## String Unions

Every string union has its own named ambient type. Document the union's general
purpose, then add a Markdown list immediately below it with one item for every
permitted literal. Each item uses the form `- **"value"** - description of the
value`. Do not place a literal union inline in `@param`, `@returns`, a property
declaration, or an object-shape typedef.

## Functions And Methods

Document every function and method, including private support methods. Begin
the general description with an active usage-oriented explanation of the
action and why a caller uses it. Public methods normally begin `Call this
method to ...`; internal methods may begin `Called by <owner> to ...`. Do not
start with an implementation detail or restate the method name.

Document every parameter and the return value. Write parameter and return tags
with a hyphen after the name or type, for example
`@param {CelestialLiveState} state - The geometry-owned live state to publish.`
and `@returns {ConfigSnapshot} - The installed configuration snapshot.` Include
an `@returns` tag for `void` when it helps describe the observable result.
Document thrown errors when they are part of the caller-observable contract.

When complex logic determines which value or variant a method returns, explain
that selection logic in the general description before the tags. Keep the
`@returns` description focused on the returned value itself rather than
repeating the selection logic.

## Constructors And Accessors

Document constructors like methods, but begin their general description with
`Creates ...` to state the instance created and its purpose. Document
accessors under the
[entity-and-value rule](#entity-and-value-descriptions). A getter and setter
for the same property use the same noun-oriented property description; do not
create different descriptions merely because one reads and the other writes.

## Implemented Interfaces

On every JavaScript class intended to implement an ambient behavioral or
capability interface, add one class-level `@implements {InterfaceName}` tag for
each implemented interface. Keep the class's noun-oriented description before
the tags. For example:

```js
/**
 * Finite local-Sun physical source and public integration facade.
 *
 * @implements {LightSourceModel}
 * @implements {FiniteLocalSunCelestialSource}
 */
export class LocalSunLightSource {}
```

`@implements` declares compile-time conformance for the TypeScript language
service used by VS Code; it does not add runtime behavior, inherit member
documentation, or supply missing parameter and return types. Continue to
document and type every implemented property and method under the ordinary
entity, callable, parameter, return, error, and asynchronous-outcome rules. Do
not add `@implements` for accidental structural similarity or for a data-only
type alias.

## Callbacks, Generators, And Overloads

Document a callback like any method, but begin its general description with
`Called by <owner> to ...`. Its parameter and return contracts follow the
ordinary named ambient-type, `@param`, and `@returns` rules.

Document a generator like a method, but begin its general description with
`Iterates over ...` and state precisely when it yields. Use `@yields` to
describe each yielded value. If the generator has a meaningful final return
value, also document it with `@returns`.

Document an overload like any method. JSDoc defines no standard overload tag,
so do not invent one. The method's general description identifies its accepted
call shapes and the named ambient parameter and return types express the
canonical contract.

## Errors And Async Completion

Document an error class like any other class, including its purpose and every
public property. Error-class declarations and their documentation may be
grouped in the nearest `errors.d.ts` file as the exception to ordinary
class-type placement.

For an asynchronous method, define its rejected and cancelled outcomes in the
general description. State the condition that produces each outcome and what
the caller must expect or do; do not hide that contract solely in a throw tag
or the `@returns` description.

Keep JSDoc concise. It explains the contract and ownership, not a line-by-line
restatement of implementation. Lower-level helper operations appear before
the composed methods that call them; public orchestration methods generally
appear last.

## Ambiguities To Resolve

No unresolved policy remains in this document's current scope. Update this
document explicitly before adopting a new JSDoc convention.
