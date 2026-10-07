# Repository Standards Overlay

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
