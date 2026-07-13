# Finite object transfer refined convergence pass

Status: accepted

## State Goal

Compare the refined doubled-sample baseline against an 80/40/68/96 high-sample convergence run.

## Success Definition

The artifact succeeds when hard spectral transfer identities pass on the
recorded wavelength arrays and convergence-sensitive demonstration claims are
either resolved or explicitly carried to the next numbered artifact.

## Attempted

- Generated the fixed 84-case baseline matrix.
- Used experiment 032 atmosphere constants and assumptions.
- Composed caller-provided object radiance with finite-segment atmospheric
  transmittance and path radiance.
- Wrote spectral JSON before display previews.
- Generated a contact sheet from transfer-cases.json.

## Result

- Criteria passed: 15
- Criteria failed: 0
- Criteria unresolved: 0

## Next

State goal reached for the transfer baseline and convergence proof. Optional later tracks are Lambertian surface lighting, local Sun, and flat long-sightline follow-ups.
