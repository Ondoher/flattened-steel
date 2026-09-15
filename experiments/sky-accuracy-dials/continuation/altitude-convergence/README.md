# Prospective altitude response laws

These pure helpers implement the exact P51 and two competing P63 formulas in
the owning altitude-convergence plan. `predictAltitudeConvergence` accepts four
canonical ray/channel groups, original F1/F8, and F4 only for the P63 stage.
`assessAltitudeConvergence` replays those frozen predictions against four held
targets. No runner, GPU work, evidence writes or physical reference is included.

Predictions retain absolute targets, responses relative to F8, and fitted
coefficients of b+a/n²+d/n. Assessment scores only the new response. The exact
residual coefficients propagate parent and target integration allowances,
including the shared F8 cancellation. Magnitudes within five times that
allowance are unresolved; otherwise the 25% criterion applies independently to
each group and the four-vector L2 norm. Sign comparisons require both values
outside the prescribed allowance plus 1e-10 W. Null allowances stay unresolved.

Arithmetic roundoff is reported separately without modifying the registered
thresholds. The manufactured proof covers both exact rate laws, signed and zero
responses, cancellation, coefficient allowances and invalid inputs. Fitted
coefficients do not establish the proposed boundary mechanism, physical P2
accuracy or measurement improvement. Both P63 models remain in the result.
