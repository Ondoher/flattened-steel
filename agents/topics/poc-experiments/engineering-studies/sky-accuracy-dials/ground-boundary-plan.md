# J2 Ground Boundary And Altitude Interaction

Extension: `compensation-attribution-v1`. This prospectively registers two
contained raw N4 interventions: `ground-j2-p48-raw`, followed by
`ground-j2-p55-raw`. It supplies the boundary control required by the
[altitude convergence plan](altitude-convergence-plan.md). Neither corrected
target has been observed at registration. Production and historical evidence
remain read-only; no Kider improvement is presumed.

## Question And Exact Intervention

The stored original L1 field is zero at the exact ground knot for inward
receiver-local rays. Its atmospheric-side limit instead contains direct
Lambertian ground radiance. Test that boundary convention by changing only
the input value read by the J2 scatter pass at position index zero and
incoming local cosine strictly below zero. Substitute the boundary value;
do not add it to an already nonzero value, alter stored L1, move the ground
point by an epsilon, or change the other hemisphere.

For ground point x, source direction s and outward normal n, use

```text
B0 = groundAlbedo * sourceIrradianceDensity
     * sourceTransmittance(x) * max(0, dot(n,s)) / pi
```

The source quantity is the channel's
`sourceIrradianceDensityWattsPerSquareMeterPerNanometer`, supplied to the
shader as `SOURCE_IRRADIANCE`. Transmittance multiplies it. B0 is spectral
radiance in W m^-2 sr^-1 nm^-1. Use the original S80 source-transmittance
routine, visibility and anchored representative ground geometry. The
receiver-to-ground transmission tends to one in this boundary limit.

The new experiment adapter must select a separately identified scatter
fragment only for J2. Preserve original I512 direction/weight packing,
phase functions, arithmetic order, medium coefficients and raw combined
source representation. Use the unchanged original scatter and transport
paths to regenerate L2, J3, L3 and J4 from the changed J2. This is a J2-only
boundary intervention; later orders' own exact-ground source conventions
remain unchanged.

The added path is direct sunlight, ground reflection, then atmospheric
scattering. Existing transport ground reflection integrates outward-looking
previous-order sky radiance with positive incidence cosine; preserve that
separate term exactly once. The original outward surface viewing rays have
no direct ground endpoint contribution. Do not add B0 separately to their
view integral or change stored L1 to implement the intervention.

## Matched Controls And Admission Invariants

Use original H S80, T160, I512 (16 radial by 32 azimuth), W27, Z180 and N4.
P48 retains its original altitude nodes; P55 adds the original seven nodes
below 1875 m. Change no physical inputs or other accuracy controls. Capture
channels 0/8, all forty original C0 probes, original seven-method fixed-field
view envelopes and each parent's original screen selectors. This is an
explicit partial spectral diagnostic.

Historical H and P55 retain J1-J4 hashes on their exact sparse unions:
197,690 and 225,878 taps respectively. They contain no full-field L1 hash
or full non-ground J2 hash. Authenticate these actual inventories and their
original spectra/envelopes without describing them as full-field evidence.
Reconstruct each original union exactly and retain any new proof support as
a separately addressed extension.

Use a new experiment-owned ground-boundary driver copied from the stable
`orders/driver.js` structure, declaring actual N1-N4 and exactly one additional
J2 shadow scatter pass per channel. Generate J1 and L1 once. From this unchanged
L1, run the original scatter into a temporary unmodified J2 shadow. Capture
its original-union J2 hash, complete non-ground hash and selected ground values.
Then run the corrected J2 scatter against the same L1, compare its complete
non-ground hash with the shadow, and continue the ordinary L2/J3/L3/J4
recurrence using corrected J2. Do not perform a second whole cache construction.

Require J1 and unmodified shadow J2 to match the corresponding historical
hashes exactly on the original sparse union. There is no requirement to match
a nonexistent historical full J1/L1 hash. Record a full L1 hash immediately
before and after the J2 passes, or an explicit structural texture proof that
both passes borrow the same L1 object, neither output aliases it, and no
upload/draw targets it between creation and release. The selected alternative
and complete operation ledger must be frozen before execution. Require the
shadow/corrected non-ground J2 full-field hashes to agree exactly; sparse
parity cannot replace this check. Stream hashes in a fixed recorded row/column
order without retaining full texture packages. Stop on any failed invariant.

J1 is generated only once and remains immutable; its historical comparison
is restricted to the exact sparse union. A full before/after J1 comparison
would require an additional independently budgeted J1 evaluation and is not
required here. Original parent N2-N4 spectra/envelopes supply the unchanged
comparison values. New L2/J3/L3/J4 and their spectra are expected regenerated
outcomes, not unchanged-prefix witnesses. Preserve the original pass schedule
apart from the J2 shadow, and prove ground reflection executes exactly once
at each original transport stage.

At shared selected ground nodes, retain shadow and corrected raw J2 values.
Compute the expected separated additions from independently reconstructed
B0, coefficients and the actual packed angular operands, then compare the
observed raw total difference with their sum:

```text
deltaJ2Rayleigh = betaRayleigh * B0 / 2
deltaJ2Mie = betaMie * B0
            * sum(incomingLocalZ < 0, weight * miePhase(outgoing,incoming))
correctedJ2 - shadowJ2 = deltaJ2Rayleigh + deltaJ2Mie
```

The Mie sum uses actual I512 representatives and Float32-packed operands;
it is not replaced by one-half or a different angular reference. Rayleigh's
normalized even quadratic phase supplies the independent one-half check.
These are CPU component predictions for one observed raw difference; no
separate species shader executions are required, and the raw propagated
field is not relabeled as split.

Freeze proof allowances before target execution. Use Float32 unit roundoff
u=2^-24 and gamma(m)=m*u/(1-m*u), with an explicit conservative operation
count m from the actual accumulation path. Bound old-minus-new subtraction
using both absolute term sums, not the small correction alone. Add propagated
operand uncertainties for encoded directions/weights, B0, coefficients and
phase evaluation. For the Rayleigh analytic check, separately include the
computed packed-quadrature deviation from one-half. Any elementary-function
error allowance must come from a declared independent local primitive proof
or established implementation bound frozen before the target, never a
multiple fitted to its observed residual. Do not apply binary64 epsilon to
GPU operands. Missing operand/error evidence leaves the check unresolved;
no tolerance is enlarged after a failed result.

## Frozen Predictions And Separate Assessments

For each grid p, let Fp be the effective grouped P2 increment E2-E1 from
admitted original view envelopes, and Fp+ its corrected counterpart.
Retain these as effective grouped increments, distinct from independently
viewing pure J2. With per-cumulative-envelope allowances U, define

```text
deltaP2(p) = Fp+ - Fp
Udelta(p) = U(E2+) + U(E1+) + U(E2) + U(E1)
```

For both grids, predict `deltaP2(p) > Udelta(p)` at each of
`p-0930-5-7` and `p-1230-3-5`, channels 0/8: eight separate directional
predictions. Every required envelope and implementation invariant must pass.
An unresolved envelope leaves the associated directional prediction unresolved.
Shared exact N1 terms may be reported as a supplementary cancellation-aware
comparison, while the primary test keeps the conservative allowance above.

A sharper numerical magnitude forecast requires a separately sealed
prediction before its target is evaluated, using controlled CPU reconstruction
with complete authenticated stencils or explicitly held targets. This
registration supplies no 25% magnitude-success criterion. Known endpoint
ground-density captures alone lack the upper-row and along-path supports
needed for an exact nonlinear reconstruction patch.

The boundary knot influences a finite interval through interpolation. Its
missing positive contribution can oppose a positive smooth interpolation
bias, producing nonmonotone altitude response. P55's first interval is
234.375 m instead of P48's 1875 m, suggesting a smaller boundary correction;
retain that as a descriptive hypothesis, not a frozen ordering or one-eighth
bound. Geometry, transmission, source variation, cubic reconstruction and
regenerated higher fields prevent a justified universal magnitude bound here.
Report deltaP2(55)-deltaP2(48) with the sum of comparison allowances, preserving
its sign, and report full regenerated N2-N4 changes separately.

Where an independently admitted adequate physical P2 reference R exists for
the exact ray/channel, report Fp-R and Fp+-R, their absolute errors and
propagated candidate/reference allowances. Preserve reference source, inner,
outer, angular and adequacy admissions. Missing or unqualified reference
groups remain unresolved; this intervention cannot qualify its own oracle.
The current morning reference does not automatically qualify the noon case.

Keep numerical accuracy distinct from measurement agreement. Any optional
frozen-component residual/SSE comparison retains the original measurement
identity, units, substituted orders, omitted orders and cancellation cross
term. Regenerated N4 spectra are a separate outcome from frozen substitution.
Neither brighter P2 nor improved measurement agreement establishes a more
accurate solver, a repaired all-order boundary or a full Kider qualification.

## Immutable Evidence And Resources

The exact accepted parent seals are:

| Parent run              | Seal bytes | Seal SHA-256                                                       |
| ----------------------- | ---------: | ------------------------------------------------------------------ |
| `00099-c0-registration` |     143375 | `fe2345baefe4c7c3ad20f969bd1c98579b7e3d651d167d6e372c930cb15c3b95` |
| `00103-c-r0-scr`        |     214683 | `162a0214b66c7576d3ee245c53cb826030ef393a660c6d4287f59cb8fa0aea24` |
| `00132-c-d55-raw`       |     714702 | `df4eb32c020fbc2fe14b7c68a6d0b64292fd21d7fb349ba9793ae20dd9aff95c` |

These runs live below `tmp/experiments/sky-accuracy-dials/runs/`. Verify
their complete sealed inventories before reuse. Freeze this plan's raw bytes,
parent control/artifact schemas and hashes, source snapshots, shader-transform
anchors, original/new numerical identities, runtime/driver identities,
verification domains and exact equations. Each derivative records its parent
artifacts, operation, parameters and resulting identity. Preserve failed
attempts and predicates as new immutable evidence; never reopen a parent.

Reserve two GPU targets within the existing 36-attempt ceiling; 30 attempts
are consumed at registration. Recheck the actual shared ledger before each
admission, including competing altitude targets. Each boundary target is
capped at 6 MiB and fifteen GPU-job minutes, including the shadow/proof work,
with two minutes reserved for finalization. Start with P48 and use measured
cost to admit P55. Each separate CPU prediction/assessment record is capped
at 3 MiB and five CPU-job minutes with a thirty-second sealing reserve.

The scalar recurrence cap remains 1,073,741,824 bytes. With W27=4374 outgoing
directions and I512, one J field costs 151,165,440 bytes at P48 or 173,210,400
at P55; one L field costs 17,694,720 or 20,275,200 bytes. Keeping shadow J2,
corrected J2 and L1 simultaneously would require 320,025,600 or 366,696,000
scalar bytes, below that cap. Prefer hashing/capturing and releasing shadow
J2 before allocating corrected J2: the original J+2L recurrence peaks remain
186,554,880 and 213,760,800 bytes. Freeze the chosen lifetimes and count actual
extra scatter, full-field readback/hash work, direction textures, readback
buffers, sparse arrays and host memory separately; scalar estimates are not
total process-memory guarantees. No budget assumes full fields are retained.

All work debits existing C5, 18 GPU-job-hour, 8 CPU-job-hour, retained-storage,
scratch, host-headroom and 40 GiB free-space ceilings. This plan raises none
of them and counts no future deletion as available capacity. Reconstructible
scratch must be owned, authenticated and cleaned within the existing contract.
Use new contained adapter paths, local self-verifying proofs and the full
experiment type check; no experimental unit-test tree. Formal source review
remains deferred under the owner's instruction. Source implementation and
execution admission remain separate from this prospective registration.
