# P0 Structured Slice Representation Freeze v1

Status: approved design input for the representation portion of P0 F3--F4.
It defines the two-dimensional restriction only and authorizes no cache
construction or physical packet evaluation.

## Radial Coordinate

For source S=(a,0,sz) and slice point p=(x,0,z):

    r = hypot(x - a, z - sz)
    u = (rMin^-2 - r^-2) / (rMin^-2 - rMax^-2)

rMin and rMax are the analytic extrema of r over the complete slice. For
integer shell count N, radial cell i=min(N-1,floor(N*u)) has exact
inverse-square boundaries. No monitor, wavelength, direction, altitude row,
or boundary feature may modify those N identities.

## Slice Along-Shell Coordinate

The second coordinate is source-centered polar angle:

    theta = atan2(z - sz, x - a)

For each radial row, analytic intersection with the selected slice domain
produces ordered valid angular intervals. A row stores its endpoints and a
compact interval id. Within interval j:

    ell = (theta - thetaMin[i,j]) / (thetaMax[i,j] - thetaMin[i,j])

Each interval is a direct structured row. The row id comes from a fixed bounded
analytic interval classifier; it may not use containment search, a tree, or a
variable-length locator. P1 must prove the actual maximum interval count and
freeze that bounded classifier.

## Addressing And Stencils

A valid noncollapsed query brackets two adjacent radial rows. The same
normalized ell selects two adjacent nodes in each row, for a fixed four-tap
bilinear position stencil. Rows may differ in length; each bracketing row
computes its own two ell indices, retaining two taps per row.

Ground, cap, rim, source-axis, and collapsed-angular rows use a declared fixed
one-sided or reduced stencil. Outside-atmosphere queries take the analytic
vacuum/ground path with no lookup. Exact nodes return one tap. Every stencil
has finite nonnegative weights summing to one.

## Deterministic Within-Band Resolution

For shell band i, use midpoint distance rMid, radial width deltaR, and each
valid angular interval length L=rMid*(thetaMax-thetaMin):

    M[i,j] = max(2, ceil(L / deltaR) + 1)

This keeps along-shell spacing no larger than radial width. It is a
deterministic consequence of N and geometry, not a second fitted resolution
ladder. Feature rows may only be added by a frozen boundary rule.

## Open Mechanical Proof

P1 must validate the analytic interval endpoint solver, bounded interval-id
classifier, direct address, and all fixed boundary stencils. These are
implementation proof obligations, not unresolved representation choices.

