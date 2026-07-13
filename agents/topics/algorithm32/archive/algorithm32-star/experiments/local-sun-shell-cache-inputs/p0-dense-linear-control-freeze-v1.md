# P0 Dense Linear Control Freeze v1

Status: approved input for F7. The control is independent of shell rows and
uses the physical slice chart sigma=x/R and v=z/h(abs(x)). It is diagnostic
only.

## Nested Levels

| levelId | sigma nodes | v nodes |
| --- | ---: | ---: |
| linear-033 | 33 | 33 |
| linear-065 | 65 | 65 |
| linear-129 | 129 | 129 |
| linear-257 | 257 | 257 |

Nodes are uniformly spaced in closed [−1,1] sigma and [0,1] v arrays. The
zero-thickness rim has one unique physical node per rim; it does not duplicate
all v values. Interior access is bilinear over actual adjacent coordinates.

The final level is retained as the dense diagnostic control only if its direct
packet-RMS p95 changes by no more than five percent from linear-129 on the
separate control-convergence queries, with identical feature classification.
Otherwise the family is inconclusive and a new control ladder is required.
The control's convergence queries are regression data and cannot enter the
heldout characterization surface.

