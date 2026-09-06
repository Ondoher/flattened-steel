# Repository Standards Overlay

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
