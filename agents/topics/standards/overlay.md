# Repository Standards Overlay

## ADD: Blank line between type definitions

Extends: types.md#General Types
Scope: repository
Rule: Separate consecutive named type definitions with at least one blank line between the end of the preceding definition and the following definition's JSDoc opening delimiter. Keep each JSDoc block directly attached to the definition it documents, without a blank line between the block and the declaration. This applies to type aliases, interfaces, unions, and other named type declarations, including ambient and exported declarations.
Reason: Owner-selected local rule, pending later canonical promotion. A blank line before each following type's documentation makes definition boundaries clear.

## ADD: Blank line before each following method's JSDoc

Extends: code-conventions.md#Classes And Utilities
Scope: repository
Rule: Separate consecutive class methods with at least one blank line between the preceding method's closing brace and the following method's JSDoc opening delimiter. Keep each JSDoc block directly attached to the method it documents, without a blank line between the block and the method declaration. This applies to constructors, ordinary methods, static methods, getters, and setters.
Reason: Owner-selected local rule, pending later canonical promotion. A blank line before each following method's documentation makes method boundaries clear.

## ADD: Braces for control-flow bodies

Extends: code-conventions.md#Formatting
Scope: repository
Rule: Use curly braces around control-flow bodies, including single-statement if, else, for, while, and do bodies and early returns. Chained else-if branches may retain their conventional form, with braces around each branch body. Enforce this through prettier-plugin-curly in the repository's Prettier configuration so formatting adds braces and formatting checks reject missing braces.
Reason: Owner-selected local rule, pending later canonical promotion. Explicit blocks make control flow consistent and prevent an added statement from accidentally falling outside the intended branch or loop.

## ADD: JSDoc descriptions start on the next line

Extends: jsdoc.md#Descriptions
Scope: repository
Rule: In a JSDoc comment containing a description, put the opening `/**` delimiter on its own line and begin the description on the following line, prefixed with an asterisk and a space. Do not place description text on the opening delimiter line, even for a short description. Retain the canonical blank line between the description and the first JSDoc tag.
Reason: Owner-selected local JSDoc formatting rule, pending later canonical promotion. A consistent description line keeps documentation blocks easy to scan.

## ADD: React computations before JSX

Extends: react.md#Component Shape
Scope: repository
Rule: Compute presentation logic before the JSX that consumes it and assign the result to a named variable. This includes conditional or optional JSX, repeated elements produced by list mapping, and computed attribute values. Build a list of rendered elements in a variable before inserting it, such as `styles` before `<List>{styles}</List>`. The mapping or loop may remain in the same render method; extraction into a separate method is optional. Likewise, use a conditional before the enclosing JSX to assign the chosen JSX element or null to a variable, such as `button` before `<div className="style-button">{button}</div>`. Do not embed conditional expressions, logical rendering expressions, list transformations, or derived-value calculations inside JSX. JSX composes markup using prepared values, named handler references, and calls to named render helpers such as `{this.renderContent()}`. Each render helper computes its own presentation logic before its returned JSX. Apply this within render methods, render helpers, and function components while retaining the canonical side-effect-free rendering and responsibility boundaries.
Reason: Owner-selected local React rule, pending later canonical promotion. Keeping computation before markup makes the JSX structure readable and its presentation decisions explicit.

## ADD: React render helpers own their region wrappers

Extends: react.md#CSS And Layout Ownership
Scope: repository
Rule: When a render helper renders a part of a component, the div or other wrapper carrying the CSS class that defines that region belongs inside that helper's returned JSX. The caller may invoke the helper directly inside JSX or insert its prepared result, without supplying the helper's region wrapper. For example, a viewport-content wrapper around _renderContent() belongs inside _renderContent(). A parent still owns wrappers that define its own layout regions.
Reason: Owner-selected local React rule, pending later canonical promotion. Each semantic render helper should expose and own the markup and class that identify the region it renders.

## ADD: Temporary experiment standards lifetime

Extends: documentation.md#Repository Standards Overlay
Scope: folder:experiments/
Rule: Temporary experiment-specific standards assignments and overlay entries must be scoped to the owning experiment folder, retain types.md, and state the lifecycle event or phase that ends their authorization. Their default lifetime is active execution, ending on suspension or final closure unless the owner explicitly selects another lifetime. Record the exact prior configuration and temporary changes in the experiment status as restoration provenance; that record does not select active standards. On ending or suspending the experiment, restore only the temporary configuration whose authorization ends at that transition, preserving permanent folder mappings and unrelated changes. A suspended experiment retains the deactivated configuration for compatibility checking at a future owner-selected resumption. Production work and promoted source resolve standards from their destination folders.
Reason: Contained experiments need bounded standards differences and an explicit restoration path without weakening production standards or losing resumption context.

## ADD: Production Algorithm32 scientific quantities, provenance, and profile completeness

Extends: types.md#General Types
Scope: folder:src/algorithm32/
Rule: Public and durable Algorithm32 quantities must carry explicit units, physical quantity, spectral basis, point or bin meaning, and provenance identity; durable property names must remain unit-neutral and hold unit-bearing values, normalized local computational scalars may use unit suffixes, and radiometric names must distinguish source irradiance before source-path attenuation, incident irradiance after attenuation, and directional incident radiance. A scientific profile must be a named type with one documented default, caller-supplied overrides, every configurable option relevant to the profile, and every difference from the paper or reference configuration it represents.
Reason: Production Algorithm32 contracts must preserve the meaning, stage, and provenance of scientific values across CPU, GPU, cache, and serialization boundaries. Production Algorithm32 profiles encode selected scientific configurations whose defaults, options, and reference deviations must remain explicit.

## ADD: Production Algorithm32 reference-backed formula symbols

Extends: code-conventions.md#JavaScript And Module Shape
Scope: folder:src/algorithm32/
Rule: A scientific implementation may retain a published formula symbol only when owning documentation or an adjacent comment identifies its external authority and makes the code-to-formula mapping unambiguous.
Reason: Production Algorithm32 source must keep compact scientific notation traceable to its reference authority without weakening the general descriptive-identifier rule.

## ADD: Production Algorithm32 scientific descriptor non-authority

Extends: code-conventions.md#Validation And Failure Policy
Scope: folder:src/algorithm32/
Rule: Scientific descriptors may identify, fingerprint, report, and diagnose evidence but must not validate executable facts, select algorithms, calculate indexing or packing, or recover executable facts.
Reason: Production Algorithm32 must keep executable numerical authority separate from descriptive evidence metadata.
