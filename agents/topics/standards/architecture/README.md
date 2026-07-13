# Architecture

These documents define the repository's starting architecture standard and the
direction for imported and new application code. They are a target for new
work and cleanup, not a claim that every extracted file already conforms.

## Documents

- [Overview](overview.md): the compact architecture context card.
- [REMVC](remvc.md): registry, executor, model, service, controller, view, and
  React presentation boundaries.
- [Feature Mechanics](feature-mechanics.md): feature ownership, layout, and
  activation. Repository coding and contract rules are owned by the focused
  standards above this architecture topic.
- [Build And Assets](build-and-assets.md): Polylith configuration layers,
  build inclusion, copied assets, runtime paths, and generated output.

## Reading Order

1. Start with [Overview](overview.md).
2. Open [REMVC](remvc.md) when dependency ownership, service lifecycle, or
   controller/view boundaries matter.
3. Open [Feature Mechanics](feature-mechanics.md) when creating, moving, or
   activating application code.
4. Open [Build And Assets](build-and-assets.md) when changing manifests,
   feature inclusion, assets, test bundles, or `dist` behavior.

## Applying The Standard

When code is imported, first record its actual structure and behavior. Preserve
working behavior while moving it toward these boundaries deliberately. Do not
invent compatibility aliases or duplicate facts merely to make old and new
structures coexist; choose a canonical owner and update its consumers when the
contract changes.
