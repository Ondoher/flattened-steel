# Frozen second-order attribution

`index.mjs` authenticates the existing grouped-order decomposition and computes
the effect of replacing only effective J2 with a supplied physical viewing
estimate. Physical P1 and original effective J3/J4 remain explicit. Algebra
checks retain the signed radiance response, squared-score change and
reinforcement/cancellation cross term.

These helpers create no files or evidence runs. A caller must retain original
parent identities, exact input integrals, this implementation, and the scope of
its numerical-reference qualification in a new immutable run. The diagnostic
never upgrades an incomplete outer integral or a coarse comparison to a
qualified reference. It does not describe a regenerated N4 solver or a complete
Kider score.
