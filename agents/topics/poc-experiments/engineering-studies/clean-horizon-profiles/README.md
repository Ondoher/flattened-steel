# Measured Clean Horizon Profiles Experiment

Status: all ten ARM-informed San Jose scene conditions are rendered, with matched
Bruneton comparisons and targeted uncertainty images. Selected reference checks
expose unresolved numerical errors, especially sunset500m. This is an illustrative
reconstruction result; production is unchanged. The completed58/76-height test
identifies height-lookup sensitivity but rejects it as a sufficient horizon fix. See [scene results](scene-results.md).

## Objective

Render an explicitly ARM-informed low-aerosol reconstruction at San Jose noon and
sunset at 5 m, 100 m, 500 m, 2 km and 40 km, with matched Bruneton comparisons.

## Governing Documents

- [Design](design.md)
- [Current scene plan](scene-plan.md)
- [Earlier qualification plan](plan.md)
- [Status](status.md)
- [Results and color controls](results.md)

Focus: actual scene images from the ARM lead, with reconstruction assumptions
and appearance uncertainty visible. Near-ground clarity remains the motivation;
2 km and 40 km extend the requested image matrix. Lower aerosol loading alone
does not establish clarity. Production profile, cache and display are read-only.

## Repository Surfaces

- Authored source and controls: `experiments/clean-horizon-profiles/`
- Generated output: `tmp/experiments/clean-horizon-profiles/`
- Production and other experiments: read-only unless separately authorized
