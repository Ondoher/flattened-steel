# Type Conventions

Status: repository-wide starting standard for JavaScript type contracts. This
document owns ambient type usage, general type placement, class-related types,
and interface types. See [JSDoc](jsdoc.md) for how runtime code refers to these
contracts.

## Ambient Types

Shared JavaScript contracts live as top-level aliases and interfaces in
included ambient `types.d.ts` files. Refer to those types directly from JSDoc.
Do not use `declare`, `declare global`, `import(...)` type expressions,
`import type`, local type-import aliases, or duplicated inline typedefs for an
ambient contract. Type-check configuration includes the ambient declaration
files and excludes `node_modules` from the local contract surface.

## General Types

- Complex shared parameters and return values have one canonical ambient type
  rather than repeated structural object literals.
- Document a type's purpose and every property it exposes.
- A class or component type that shares the name of its exported symbol belongs
  in the nearest `types/` folder, in a `PascalCase` file named for that symbol.
  Interface contracts follow the interface-placement rule below.
- Express readonly intent in JSDoc and type contracts; do not use
  `Object.freeze` as an immutability mechanism.
- A changed production contract replaces its canonical declaration and
  consumers directly. Do not retain shadow types, aliases, fallback readers,
  or old/new switches without an explicit accepted compatibility requirement.

## Class Types

Class implementation modules export only the class. A class type that shares
the exported class name belongs in `types/<ClassName>.d.ts`.

Every type exposed by a class public method or public property belongs in the
nearest included ambient `types.d.ts` file, even when the type is named for or
otherwise specific to that class. This includes constructor requests,
snapshots, results, and collaborator contracts when callers provide, receive,
or observe them through the class API. The class JSDoc names that ambient type
directly.

An internal type used only by the class implementation may be defined in that
class's dedicated `types/<ClassName>.d.ts` file. Do not expose that internal
type through a public method or property, and do not create a class-name
type-import bridge.

Error classes follow the class-contract rules, except that their declarations
and documentation may be grouped in the nearest `errors.d.ts` file. This is a
permitted exception to one-class-per-type-file placement; it does not change
the rule that types exposed through a public class API belong in `types.d.ts`.

## Interface Types

By default, an interface type is defined in the nearest included ambient
`types.d.ts` file owned by its contract. A domain API may instead designate one
declaration-only global interface layer when that is its explicit public
architecture. Such a layer contains behavioral interfaces and the public data
types necessary to express them; it contains no executable implementation,
concrete class, cache, adapter, controller, factory, or implementation
selector. Implementation-private interfaces and types remain with their
implementation owner. Do not create a dedicated
`types/<InterfaceName>.d.ts` file for an interface contract. Service interfaces
document public service methods while excluding framework lifecycle methods.

Specify a substitutable behavior or independently implementable capability as
an interface. Callers depend on that interface rather than a particular class,
and any class may implement one or more compatible capability interfaces. Do
not create an interface merely to rename an immutable value, configuration
record, discriminated union, or other data-only shape; those remain ambient
type aliases.

Every JavaScript class intended to implement an ambient interface declares
that relationship in its class-level JSDoc with one
`@implements {InterfaceName}` tag per interface. The tag records and type-checks the intended
contract; incidental structural compatibility without that intent does not
make a class an implementation owner. See [Implemented
Interfaces](jsdoc.md#implemented-interfaces).

Component types that share their exported component's name likewise belong in
`types/<ComponentName>.d.ts`. Component props or other differently named
contracts follow the general ambient-type placement rule.

## String Unions

Every string union has its own named ambient type. Do not repeat a literal
union inline in a property, parameter, return, or JSDoc tag. Document the type
purpose, then add a Markdown list immediately below it with one item for every
allowed literal. Each item uses the form `- **"value"** - description of the
value`. A union represents a closed contract: add or remove a member only
through the canonical type and its consumers.

## Ambiguities To Resolve

No unresolved policy remains in this document's current scope. Update this
document explicitly before adopting a new type-placement or declaration rule.
