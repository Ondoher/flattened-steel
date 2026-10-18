# H61 Sun-Focused Outgoing Grid

Status: complete under owner authorization. Baseline05185b92. See
[results](outgoing-focus-results.md) and [execution](outgoing-focus-execution.md).
Production and all earlier evidence remain immutable; the experiment stays open.

## Registration

Test whether redistributing the existing4374 W27 direction slots toward the Sun
reduces the demonstrated outgoing-angle interpolation loss. Keep F68 incoming,
native51/Z180, source20, normalized transport60, paper Direct40 atmosphere and
Q30/cubic final view fixed. No N1 exact-angle replacement is applied.

Use the smooth rotational warp tan(theta_physical/2)=k*tan(theta_grid/2),
centered on the physical Sun direction for each solar cache row. k=1 is identity;
screen k=.75,.5,.35 at407/501/642nm against identity and the saved exact-angle N1.
Apply the inverse in every J lookup and the forward map at every J construction
node, including higher orders. Face slots and seams remain unchanged; Jacobian
weights do not apply because outgoing nodes reconstruct a function rather than
integrate it. Incoming quadrature weights remain exactly unchanged.

First verify analytic invertibility, constant reconstruction, positive tap mass,
unit vectors and seam identities with focused proofs. GPU N1 screen stops after
J1 observation with guarded compiler cleanup; it does not construct later orders.
Compare the same three H59 witnesses against exact-angle N1; select the mildest
warp within10% of best mean residual, requiring at least20% mean residual
reduction and no witness >10% worse than identity. If no rule qualifies, report
that and stop instead of expanding an unhelpful candidate.

For one qualified rule, rebuild complete fields through J4 on the GPU, retaining
pure and cumulative selected-ray results and the full1377 B1 rays. Use identical
warped mapping in recurrence and final readout. A k=1 GPU screen must reproduce
saved native results within5e-6 relative; report CPU/GPU reconstruction rounding
separately. If selected-ray evidence is still useful, expand to all40 bands,
reusing matching screen outputs exactly. Score all17 paper intervals/aggregate
and render Figure5 dome comparisons. Keep the matched independent/libRadtran
selected-ray spectra and H59 N1 replacement as distinct references.

## Evidence And Bounds

GPU-first, one heavy job/wavelength at a time;60minutes is guidance while strong
monitored progress continues. Source:experiments/sky-accuracy-dials/outgoing-focus.
Output:tmp/experiments/sky-accuracy-dials.656MiB retained,1GiB scratch,40GiB free
disk remain. Stream compact spectra and retain no full native textures. GPU-owned
cumulative buffers are temporary and measured separately from compiler fields.
No production integration, new external solver campaign or test-framework suite.

Provide a screen error plot and final common-CIE swatches, spectra/order errors,
interval RMSE table and dome comparisons where qualified. Self-review, local
types, immutable/provenance/cleanup proofs and checkpoint advice remain. Dedicated
reviewers/audits stay disabled. Record decisions and actual failures/recoveries in
outgoing-focus-execution.md. Full B1 must match or improve the original paper
baseline for any future adoption claim; isolated N1 improvement alone is insufficient.
