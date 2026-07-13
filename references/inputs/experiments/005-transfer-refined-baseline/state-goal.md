# Finite object transfer refined baseline

Status: accepted

## State Goal

Promote the doubled-sample transfer run shape to a refined baseline after the original baseline failed the 5x convergence-margin gate.

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

- Criteria passed: 14
- Criteria failed: 0
- Criteria unresolved: 1

## Next

Run `node scripts/flat/atmosphere-environment/run.js --step=transfer-refined-convergence` to test the refined baseline against the next doubled sample counts.
