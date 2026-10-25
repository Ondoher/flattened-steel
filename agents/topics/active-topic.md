# Active Topic

Current active topic: poc-experiments/engineering-studies/clean-horizon-profiles.
Focus: execute actual ARM-informed atmosphere scene comparisons for San Jose noon
and sunset at 5 m, 100 m, 500 m, 2 km and 40 km, with matched Bruneton images.

Canonical entry: [Measured Clean Horizon Profiles](poc-experiments/engineering-studies/clean-horizon-profiles/README.md).
All ten requested ARM-informed conditions and matched Bruneton views are rendered.
The scene report records reference discrepancies and physical assumptions; these
are illustrative images, not a fully validated measured-profile replacement.
Final evidence verification00057 passes; scene-results.md is the current report.
Owner-review follow-up00062 diagnoses bright/gray horizon bands. The authorized
58/76-height test is complete in00072-height-results; the final scene-results.md
section owns findings. Height lookup affects the band but is not a sufficient fix;
the upper gray ray samples the1875-3125m interval. Direct ground/sphere alignment
test00074 covers mesh/helper alignment. The owner's clarified actual shader
branch test is complete in00079-analytic-results: emitted compiler geometry and
consistent live termination were exercised; the continuous rim is unchanged.
Scene-results.md owns exact scope and remaining cache-boundary hypotheses.
Production is unchanged.

## Minimal Reload Sources

1. [Repository instructions](../../AGENTS.md).
2. [Experiment entry](poc-experiments/engineering-studies/clean-horizon-profiles/README.md).
3. [Design](poc-experiments/engineering-studies/clean-horizon-profiles/design.md).
4. [Scene plan](poc-experiments/engineering-studies/clean-horizon-profiles/scene-plan.md).
5. [Status](poc-experiments/engineering-studies/clean-horizon-profiles/status.md).
