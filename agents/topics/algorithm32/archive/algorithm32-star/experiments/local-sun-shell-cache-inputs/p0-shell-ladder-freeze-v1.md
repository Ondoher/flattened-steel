# P0 Inverse-Square Shell Ladder Freeze v1

Status: approved design input for P0 F3. It freezes the first baseline method
and a finite shell-count ladder. It authorizes no physical evaluation.

## Method

Method id: pure-inverse-square-baseline-v1.

For every source case, rMin and rMax are the analytic extrema of source
distance over the complete ground-to-cap slice. For i=0 through N:

    1 / r[i]^2 =
      1 / rMin^2 - (i / N) * (1 / rMin^2 - 1 / rMax^2)

The N intervals are the radial band identities. Their endpoints are derived
per source case from the selected geometry, never rounded into a shared
distance table.

## Ladder

| levelId | N | Role |
| --- | ---: | --- |
| n004 | 4 | intentionally coarse lower endpoint |
| n008 | 8 | refinement |
| n016 | 16 | refinement |
| n032 | 32 | refinement |
| n064 | 64 | refinement |
| n128 | 128 | refinement |
| n256 | 256 | predeclared dense practical saturation reference |

Every level is evaluated. No result can insert, delete, reorder, or extend a
level. N=256 is a finite descriptive saturation reference only; it cannot
select an acceptable N or replace DirectJ2 as error authority. If it fails to
show diminishing returns, the next ladder is a new family with a fresh
holdout.

## Within-Band Rule

The structured slice row formula in
p0-structured-slice-representation-v1.md determines angular nodes from the
fixed band width. It may add only declared feature rows. It never changes a
radial boundary or makes a wavelength- or direction-specific radial ladder.

## Approved Scope

This file closes F3. P1 must calculate and verify each source case's analytic
rMin/rMax values and every derived boundary before cache-node construction.

