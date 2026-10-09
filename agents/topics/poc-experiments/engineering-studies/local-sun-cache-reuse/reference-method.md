# Independent Reference Method

The [gate fixture](../../../../../experiments/local-sun-cache-reuse/gates.json)
freezes project engineering limits before a reuse candidate is implemented.
Its inherited normalized spatial metrics retain the old policy's definitions
and bounds. That policy's Fibonacci34/W3, 4.8 Mm diagnostic configuration is
different from today's reflection-completed68/W27, 4.828032 Mm control;
its old pass does not qualify this workload. The controls run records the
policy hash and actual new physical axes.

## Continuous Primary Calculation

Use binary64 continuous coordinates and the pinned Native15 wavelength centers,
source irradiance and canonical atmosphere constants. For a segment of length
L from altitude z with vertical direction w, integrate each exponential density
analytically:

```text
D(H,z,w,L) = exp(-z/H) * (-expm1(-w*L/H)) * H/w  (w != 0)
D(H,z,0,L) = exp(-z/H) * L
tau(lambda) = betaR(lambda)*D(HR,...) + betaMext(lambda)*D(HM,...)
T = exp(-tau)
betaR = 1.24062e-6 * wavelengthMicrometers^-4
betaMext = 0.04/1200 * wavelengthMicrometers^-0.8
```

Clip segments at physical ground/top and the declared construction cylinder;
do not integrate a below-ground exponential or use a cache lookup. For a point
x and finite source s, incident irradiance is the source's calibrated spectrum
times `(4800000/|s-x|)^2`, multiplied by analytic source-path transmittance.
Use the accepted Rayleigh and Cornette–Shanks phase equations and Mie single
scattering albedo 0.8 to obtain continuous J1. The finite source disk's surface
radiance and view visibility remain separate source-owned quantities; a
center-ray direct-light calculation does not validate disk rasterization.

Verify zero-length transmission, reciprocal endpoints, segment composition,
finite/nonnegative values, inverse-square scaling and horizontal rigid-motion
invariants. Compare numerical quadrature to the analytic exponential result.
Sharing physical constants and equations is necessary; sharing candidate
spatial sampling, textures or field values is prohibited for this reference.

## Higher Orders And Complete Rays

The independently refined reference uses readable binary64 recurrence:

```text
Lk(x,omega,lambda) = integral_path T(x,x+t*omega,lambda)
                                      * Jk(x+t*omega,omega,lambda) dt
J(k+1)(x,omega,lambda) = integral_sphere phaseScatter(x,omega,omega',lambda)
                                      * Lk(x,omega',lambda) domega'
Jthrough4 = J1 + J2 + J3 + J4
viewRadiance = integral_view T * Jthrough4 dt + transmitted endpoint radiance
diffuseHorizontal = integral_upperHemisphere viewRadiance * cos(theta) domega
```

Use an independently generated Gauss–Legendre/product angular domain, not the
candidate's incoming/outgoing quadrature. Build independent binary64 spatial
grids with every production interval bisected, then bisected again. Continuous
J1 is evaluated at those coordinates; higher-order transport evaluates the
reference interpolant at continuous quadrature points. This is an independently
refined numerical reference with measured interpolation error, not an exact
continuous solution. It never reads candidate textures or resident fields.
Black physical ground contributes zero. Keep the source's finite-size shell
approximation out of the analytic primary oracle and report its difference.

Separate path, spatial and angular refinement, then measure their combined
change. Require the fixture's three-level convergence rule for every channel
and quantity. The ten-percent uncertainty budget includes each measured
refinement contribution; summing their absolute estimates must fit the budget.
If convergence fails at the declared cap, the cell is inconclusive. Increase
the reference budget only by improving its numerical resolution, never by
loosening candidate acceptance after inspecting a result.

Higher-order reference implementation and convergence evaluation belong to the
candidate proof/qualification phases. P1 freezes this derivation and its
limits; it does not claim those future cells have passed. A failing production
control remains visible and cannot excuse a candidate physical-accuracy failure.

## P3 Reference Refinement

The shell-layout diagnosis retains the physical equations and all original
acceptance, convergence and uncertainty limits. New immutable runs identify
each numerical operation and preserve earlier inconclusive references.
The continuous-primary policy `binary64-primary-simpson-square-coordinate-v2`
uses composite Simpson after `t=L*u^2`, including its `2*L*u` Jacobian.
Analytic optical columns remain exact. The optical-depth-32 tail cutoff is
explicit; its positive-source tail contribution must be bounded in full
qualification rather than omitted from the uncertainty claim.

Independently generated Gaussian polar nodes may use
`mu=sinh(k*u)/sinh(k)`, with Jacobian `k*cosh(k*u)/sinh(k)` and k=5 or 10.
This concentrates resolution around the flat horizon without importing the
candidate's partitioned polar rule. Product levels may extend through
128/256/512 polar nodes and twice as many azimuth taps. Transformed weights
are checked against the known sphere mass and corrected only for their small
numerical integration residual, which remains a reference uncertainty obligation.
Near the cylinder boundary, independently generated Gaussian azimuth nodes
within four quadrants refine the tangent meridians. These are explicit new
reference policies, not relaxed candidate limits.

At a source-axis point, rotational symmetry permits one continuous L1 evaluation
per polar node. At points on the source meridian, reflection permits shared L1
for paired azimuths. Every physical phase tap and integration weight remains
in the sum. The allocation-light primary implementation combines source/view
extinction exponents and wavelength-independent phase terms; run 00080 separately
checks numerical equivalence to the original readable formulation.

Compatible independent values may be copied from a sealed rejected comparison
run after complete inventory authentication. Compatibility requires exact
source calibration/spectrum, height, slab, cylinder, reference operation and
physical query identities. Retain each cell's original convergence flag and
uncertainty. An inconclusive cell never supplies physical acceptance.

## Independent Native Recurrence

The experiment-owned `ShellReference.cs` implements the binary64 recurrence
on independently bisected physical rho/altitude axes. Its outgoing polar
support includes both poles; azimuth is cyclic. It interpolates the source
function `J/extinction`, with physical extinction restored at the query.
It imports neither candidate fields nor candidate incident-decay normalization
or Euclidean shell stencils. Withheld J2/J3/J4 are direct scattering integrals
of independently computed incoming transport at the exact physical query.
The separately reported `gridJ` quantities diagnose reference interpolation.

Periodic discrete phase convolution uses a radix-two Fourier transform;
direct scalar summation checks its result independently. Source-meridian
reflection preserves every integration weight while avoiding duplicate
transport. Query grouping and tensor-lookup acceleration have separate
numerical equivalence evidence. The optional spectral-packet mode shares
continuous columns and wavelength-independent phase across three channels.
Its retained path reaches optical depth 32 in every batch channel, so it has
a distinct discrete integration policy and requires fresh path convergence.

The current bounded audit sums every incoming tap directly at pole, horizon
and midlatitude cyclic-azimuth sentinels, after the full outgoing field has been
computed by Fourier convolution. It also reports independently transported L4
at every withheld query. This reduces audit cost without reducing incoming
integration support. Current convergence requires identical native source across
each three-level family and matching L4 inventory; old nine-quantity runs cannot
be relabeled as current ten-quantity qualification.

The developmental `piecewise-gauss-v1` policy instead splits paths at the
independent rho, altitude and cyclic azimuth interpolation knots, closest
approach, and physical density/optical-depth scales. Independently generated
positive Gaussian rules refine each resulting physical-distance interval.
Incoming midpoint azimuth taps have a half-step offset from outgoing support;
complex Fourier kernels retain that offset, with direct scalar phase sums as
their independent check. Run 00141 passes its three-level path check for all
nine quantities at the coarse spatial/angular setting. Higher-resolution
spatial, angular and combined-path uncertainty remain separate obligations.

Boundary-support refinement may augment the independently defined original rho
seeds with physical ground-extinction offsets inward from the vacuum cylinder,
then bisect the complete independent rho/altitude tensor. The current seed
offsets use 0.125, 0.25, 0.5, 1, 2, 4, 8, 16, 32 and 64 shortest ground spectral
extinction lengths. They do not copy candidate shells, row-specific samples or
field values. This addresses a coarse reference boundary layer; it is a new
resolution identity and requires its own spatial/angular/path convergence.
Three-level proofs also authenticate identical native implementation hashes.

The positive attenuation kernel integrates to at most one. Bound the angular
operator by quadrature sphere mass times the maximum accepted phase; use this
global bound rather than the largest mass at sampled outgoing nodes when
propagating tails to withheld directions. Continuous incident amplitude is
bounded by the source's calibrated inverse-square maximum above the slab.
Native tail and numerical-roundoff records do not replace spatial/angular/path
refinement. Sum those contributions before accepting any physical comparison;
one-dimensional convergence alone cannot qualify the reference.

For the implementation that computes roundoff records before withheld L4
queries, conservatively multiply every recorded roundoff bound by
`max(1, finalMaximumPathSamples / inputIntervals)`. The original path multiplier
is at least `inputIntervals`, and the final maximum includes all subsequent
withheld paths. This increases the budget to cover any later larger path count,
including propagated terms; it does not alter native values, excuse unresolved
convergence or relax acceptance limits. Preserve this operation in each derived
qualification record.

The candidate's experimental optical-depth-64 prefix has a separate bound in
run 00127. Its factor-aware spatial interpolation can amplify a source-function
bound by at most `Emax/Emin`, so that amplification is retained through each
transport/scattering recurrence. The removed-tail bound is below one tenth of
every absolute physical limit. This preserves the original physical boundary
and coverage; it does not qualify the candidate's path quadrature or runtime
views. Uniform-120 and squared-path candidate attempts remain separate runs.

## Independent Complete Views And Receiver Irradiance

The native recurrence can export all fifteen binary64 `J2/extinction`,
`J3/extinction` and `J4/extinction` grids. Their schema identifies altitude,
horizontal radius, polar cosine, cyclic azimuth, address order and little-endian
encoding. Every consumed field retains its sealed parent artifact/hash and
native source identity. Exporting is a side effect after recurrence, not a
different physical calculation; run 00230 verifies all 44,100 shared scalars
bit-for-bit against the matching pre-export calculation. This parity does not
waive convergence or relabel historical native source hashes.

The complete-view consumer uses only captured physical ray directions and
geometry as ingress. It restores physical extinction to the independent
positive tensor reconstruction, adds continuous analytic J1, and integrates
each radiance order over the independently solved finite observer-dome/slab/
cylinder path. This finite camera path differs from incoming recurrence paths
that reach the full physical cylinder. Neither candidate field values nor its
shell stencil enter the reference. Piecewise positive Gaussian rules split at
independent tensor knots and physical density/optical scales. All ninety-six
views retain L1-L4, total radiance, exact analytic transmission and endpoints.

An analytic constant-source-function proof uses `J/extinction=k` with primary
source power zero; each order must equal `k*(1-T)` on every captured ray and
wavelength. Coarser rules retain their measured errors; the finest invariant
is a developmental integrator check, distinct from frozen reference convergence.
Run 00229 passes that invariant and the independent 0.01-metre endpoint gate.

Receiver irradiance retains cosine-weighted Hammersley and Gaussian/product
controls and the same independent complete-view integration. A distinct
positive composite product rule uses `mu=sinh(5*u)/sinh(5)`, uniform `u` steps
and periodic midpoint azimuth. Trapezoid weights include the Jacobian and
`mu`; the zero-weight horizon endpoint is omitted. Positive weights are
normalized to the exact constant-irradiance mass `pi`, independently of any
candidate or sky values. This nested rule is selected to resolve horizon
variation without the nonnested Gaussian-node shifts observed in unresolved
receiver convergence. Its 8/16/32 positive polar nodes times 32 azimuths remain
within the unchanged 256/512/1024 direction levels. The correction requires
fresh same-source polar/azimuth/path convergence; existing unresolved controls
remain immutable and no budget or reduction criterion changes. Its world-frame
mapping preserves the flat physical vertical. Keep receiver-direction uncertainty
separate from native angular construction uncertainty and view-path uncertainty.
Three successive doubled levels must satisfy the frozen decreasing-difference
and budget rules for every radiance order, total and spectral channel. Sum all
native spatial/angular/construction-path, view-path and receiver-direction
uncertainties with positive tail and roundoff bounds before physical acceptance.
Raw agreement alone cannot close that gate.

A reference-only primary phase control variate may reuse authenticated receiver
rays. Within each constant-polar row, fit the observer's known Rayleigh and
Cornette-Shanks phase functions to the maximum/minimum scattering-cosine primary
samples, subtract that model from the raw weighted primary measurements, and
restore its azimuth integral. The Rayleigh mean is analytic; Mie uses positive
128/256-point Gaussian phase-only integration, with twice the difference and
summation roundoff retained as uncertainty. This adds no transport directions,
uses no candidate values, preserves every raw order, and records signed correction
and row coefficients. Receiver L1 and total comparisons include the correction;
its positive uncertainty is combined once with the horizon bound. The same-source
polar and azimuth families must share their finest physical receiver grid.

The horizon-focused Gaussian receiver successor uses the same sinh5 variable
and Jacobian with positive Gaussian rather than composite trapezoid weights;
its exact constant-irradiance normalization and direction cap are identical.
The composite control remains unqualified after its measured polar refinement.
Native construction additionally evaluates a separately identified polar rule
that splits the full integral at zero before mapping each Gaussian hemisphere
with sinh5. This treats the different ground/top transport branches explicitly;
it is independent of candidate values. Three successive refinements and the
unchanged budgets are required before this rule can supply physical authority.

The receiver's composite polar rule may split at a frozen independent native
32-node polar support. Full-domain variants retain positive analytic cosine
mass. A distinct bounded variant integrates above the first positive knot,
retaining the omitted interval's upper bound separately, without normalization:
`delta E_n <= pi*mu_min^2*max(S_n)`. Positive tensor reconstruction bounds the
higher-order normalized source function by its largest authenticated native
coefficient. Continuous primary incidence is bounded by the inverse-square
maximum above the slab, the physical phase maximum, attenuation by one and
scattering/extinction ratio by one. Add this positive angular-tail term once
when summing all reference axes; each individual axis check also accounts for
it conservatively. This concerns only independent receiver integration, not
candidate cache coverage or silent query exclusion.

Composite midpoint/Gaussian refinements retain their exact polar interval and
actual direction counts. A Sun-aligned azimuth variant integrates both half
circles with positive Gaussian weights, using the exact horizontal direction
towards the source. It assumes no equality between the halves and preserves
their full mass. Source geometry selects the direction; candidate values never
select weights, nodes or normalization. A common finest receiver grid is needed
before combining its polar and azimuth budgets. Historical disjoint finest-grid
checks remain separate evidence, not a complete receiver authority.

A further Gaussian product control maps `mu=u^2` on the positive hemisphere.
The Jacobian is `2u`, giving positive cosine-weighted mass proportional to
`u^3`; ordinary Gaussian rules integrate its constant-light mass exactly.
This resolves small horizon cosines while retaining more support through the
interior than the exponential mapping. Its source, rule identity and separate
polar/azimuth refinements are recorded; the 1,024-direction cap and every
convergence/physical gate stay unchanged. Any normalization uses only analytic
constant mass, never observed or candidate spectra.

Snapshot the consumer's executable source closure before lengthy parent
authentication, field decoding or integration. A late snapshot during concurrent
edits does not reliably identify executed code; run 00231 is preserved as a
diagnostic only and is excluded from qualification. Run 00233 repeats the check
with the corrected early snapshot. Native parent authentication checks the full
sealed inventory once per invocation; every later artifact read rechecks the
unchanged manifest, contained path, byte length and hash. This is a proof-scoped
reader, never a durable verification cache or permission to alter a parent.

## Endpoint Support And Primary Path Independence

The matched horizon-sinh5 angular family remains inconclusive in run 00394,
with its largest budget error at the near-ground point beneath the source.
The next independently selected control maps each Gaussian hemisphere parameter
`u` to `mu=sin(pi*u/2)^2`, with Jacobian `(pi/2)*sin(pi*u)`. This concentrates
positive support at both the horizon and polar endpoints. Its distinct
`hemisphere-sine2-v1` identity requires fresh three-level construction and
complete-view refinement; earlier families remain immutable and separate.

Primary transport evaluates an analytic physical source rather than an
interpolated field. Its path partition should depend on physical density,
optical depth, closest approach and endpoints, without unused reference-field
rho/z/azimuth knots. Removing those unused cuts makes primary query integration
independent of the spatial/angular grid. Higher-order transport still splits
at all required interpolation knots. The changed native source receives a
new hash and fresh calibration/refinement evidence; old runs are never relabeled.
All candidate equations, withheld queries, limits and uncertainty gates remain
unchanged. This is a reference-integration correction unit, not candidate tuning.

An optional `nested-sine2-v1` outgoing field support separates interpolation
nodes from the Gaussian incoming integration nodes. For `N` incoming polar
nodes, use `n=N/2` outgoing intervals on each hemisphere and
`mu_k=sin(pi*k/(2*n))^2`, `k=0..n`, reflected about zero. The outgoing field
therefore has `N+1` strictly ordered nodes including the horizon and both poles.
Successive doubled levels retain every previous node exactly. Incoming nodes,
weights, azimuth integration, positive tensor interpolation and physical
equations remain unchanged. This addresses moving interpolation knots rather
than assuming the incoming quadrature is converged. Its optional explicit
outgoing array is part of the native input and provenance; native and complete
view angular proofs verify exact nested bisection in addition to their original
three-level uncertainty and reduction checks. A new native source hash requires
fresh matched families. Geometric nesting alone supplies no physical authority.

The distinct `nested-sine4-v1` control uses the fourth power of that sine
instead of its square. It preserves the same node count, exact nested
bisection, horizon and poles while placing more support near horizontal
directions. At N=64 its first positive cosine is approximately 5.797e-6,
compared with the squared control's 0.002408 and the incoming quadrature's
4.618e-6. Incoming integration and frozen C# helpers are unchanged. Record the
new rule and complete source closure in every run; families cannot mix these
rules. Calibrate geometry and nesting before a bounded 8/16/32 construction
family, and inspect it before larger refinements. This is an independent
interpolation-resolution hypothesis, not a claim that direct J2 integration
or any physical gate has converged.

## Finite Native Operator Bounds

The separate primary-angular diagnostic preserves every helper in an
authenticated frozen native source and substitutes only its entry. Reproduce
seven declared parent scalar J2 quantities before independently refining polar
and azimuth integration to a common finest grid. Polar rules are derived through
a fixed eight-azimuth product and checked against their analytic mass, so their
normalization does not vary with azimuth count. The optional existing positive
quadrant-Gaussian rule clusters azimuth samples at the physical cylinder tangent
meridians. Its direct weighted sum uses unchanged continuous primary transport
and physical Rayleigh/Mie phase factors. Inputs retain every angle, weight,
case, parent, source transformation and transitive generator implementation.
Passing these selected diagnostics cannot replace complete field, higher-order,
view, combined-uncertainty or candidate acceptance gates. The original
uniform controls remain immutable evidence.

The separate `prove-native-operators.js` proof reads an authenticated exported
native run. It preserves every numerical helper in that run's frozen C# source
and substitutes only a new entry between unique checked anchors. The derived
program replays every grid packet, distinct exact-query incoming ray and explicit
query transport case for primary and higher-order partitions, without using
source-function values. Verify its complete case/position/query inventory.
Retain the maximum per-channel positive attenuation/extinction kernel mass and
the maximum finite phase-row mass. These measure the executed discretization;
they do not establish continuous spatial or angular accuracy.

For each channel, bound the continuous normalized primary source by intervals
of 125 metres in altitude. Above the flat atmosphere, axial incidence
`I0*scale*(referenceDistance/(H-z))^2*exp(-tauVertical(z,top))` is an upper bound
at every horizontal distance and increases with altitude. The Rayleigh/Mie
fraction is monotone when `HM<HR`; its phase-peak mixture is therefore bounded
by the larger endpoint mixture. Multiply upper-end incidence by that mixture,
then take the maximum interval bound. No sampled or candidate maximum enters
this analytic primary envelope.

Read each authenticated J2/J3/J4 binary64 field separately and retain its
maximum absolute coefficient. Let `P` be the finite phase norm, `K1` the primary
transport norm, `K` the higher-order transport norm including the admitted
two-micrometre spatial-coordinate roundoff allowance, `A_n` the normalized
source envelopes and `B_1=K1*A_1`, `B_n=K*A_n`. Use the existing conservative
64-epsilon arithmetic model with the actual path sample count `s` and incoming
angular count `q`:

```text
delta L1 = 64*eps*s*B1
delta S_n = P*(delta L_(n-1) + 64*eps*q*B_(n-1))
delta L_n = K*(delta S_n + 64*eps*s*A_n)
tail L1 = A1*exp(-32)
tail S_n = P*tail L_(n-1)
tail L_n = K*tail S_n + A_n*exp(-32)
```

These rederived finite-construction bounds preserve the original arithmetic
model; they are not a formal proof of every framework transcendental operation.
Record original/derived source hashes, exact substitution, tools, input/field
parents, equations and maxima. Multiply normalized source bounds by physical
extinction for J comparisons. View/receiver arithmetic and all empirical
spatial/angular/path uncertainties remain separate and must be included before
any complete physical acceptance. A smaller arithmetic estimate cannot qualify
an unresolved integration axis.
