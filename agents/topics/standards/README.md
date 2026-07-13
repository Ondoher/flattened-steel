# Repository Standards

This area contains the general engineering conventions used as a starting
point across the repository. They describe preferred boundaries and workflows
for shared work without deciding the detailed architecture or behavior of a
particular algorithm or application.

## Current Standards

- [Architecture](architecture/README.md): Polylith configuration, REMVC
  boundaries, feature mechanics, repository-wide JavaScript contracts,
  validation boundaries, builds, and assets.
- [Code Conventions](code-conventions.md): formatting status, file naming and
  placement, class and utility modules, validation, and diagnostics.
- [Type Conventions](types.md): ambient, general, class, interface, and string
  union contracts.
- [JSDoc Conventions](jsdoc.md): type, class, interface, property, callable,
  parameter, and return documentation rules.
- [React Code](react-code/README.md): presentation boundaries, component
  structure, state, effects, markup, and style ownership.
- [Testing](testing/README.md): durable test principles and the current
  toolchain baseline.

## Coding Standard Authorities

Repository-wide coding rules are owned by [Code Conventions](code-conventions.md),
[Type Conventions](types.md), and [JSDoc Conventions](jsdoc.md). Feature
Mechanics applies those rules to feature structure and runtime activation; it
does not duplicate them.

## Ambiguities To Resolve

No unresolved policy remains in the current focused standards. Update the
owning standard explicitly before adopting a new repository-wide convention.

Domain and application documents may specialize these standards, but should
link to these sections rather than maintaining a duplicate general rule set.

## Adoption Posture

- Treat these documents as defaults for new shared work, not as proof that all
  extracted code already conforms.
- Record the actual structure of imported code before reorganizing it.
- Keep algorithm contracts and domain decisions with their eventual product or
  domain owner.
- Keep application integration, operation, and deliberate exceptions with the
  eventual application owner.
- When a focused contract needs to differ from a general standard, make the
  exception explicit and keep one canonical owner for the decision.
- Update these documents as current standards change; do not append historical
  narratives to them.

## Related Advisory Guidance

[Optional Accessibility and Localization Considerations](optional-accessibility-localization.md)
captures low-cost possibilities for this non-consumer repository. It is not a
release gate or conformance target.
