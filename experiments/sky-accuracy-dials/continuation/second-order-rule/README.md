# Independent final-view quadrature rules

`secondOrderOuterRule(registration, spec, probeId, kind, count)` constructs
`{kind, count, nodes, groundEndpointAnalyticZero}` without evaluating radiation
or writing files. Both frozen original views, `p-0930-5-7` and `p-1230-3-5`, use
the unchanged world origin/direction and physical height intervals
`[0, 1875, 8000, 24000, 60000]` metres.

| Kind             | Coordinate                               | Meaning of count                            |
| ---------------- | ---------------------------------------- | ------------------------------------------- |
| `gauss-height`   | Square root of radial height             | 4, 8 or 16 Gaussian nodes per interval      |
| `gauss-distance` | Physical distance along the original ray | 4, 8 or 16 Gaussian nodes per interval      |
| `simpson-height` | Square root of radial height             | 4, 8 or 16 even Simpson panels per interval |

The Gaussian height rule delegates to the existing viewing geometry constructor,
preserving all original node identities, coordinates and weights for exact reuse.
The distance rule independently recovers radial height with
`delta / (sqrt(R * R + delta) + R)`, where `delta = s * (s + 2 * projection)`.
Both transformations retain the original surface-ray geometry admission.

Simpson interval endpoints snap to their exact declared heights. Every shared
positive endpoint remains two distinct interval terms with different ids and its
own interval weight, even though its physical coordinates are identical. The
dyadic 4/8/16 placements preserve exact nested physical geometry. A caller may
reuse an identical physical solve while retaining each term in the outer sum.

At the exact ground endpoint, the square-root-height Jacobian is zero. Simpson
omits only that zero-weight term and sets `groundEndpointAnalyticZero: true`.
This metadata describes the analytic transformed endpoint for a bounded source;
there is no near-ground substitution and no physical inward-zero convention is
applied. The top endpoint remains a finite, positive-weight physical query.
Gaussian rules have no endpoint nodes and report this metadata as false.

The focused `secondOrderOuterProof` checks polynomial moments, interval weights,
physical geometry, snapped and shared endpoints, exact nested Simpson geometry,
and constant-extinction analytic integrals. It retains coarse approximation
errors as observations. An independent proof-only 256/512-panel Simpson
construction checks convergence at a strict analytic tolerance; these panel
counts are not exposed for scientific execution. No atmospheric radiance or
immutable run is produced. Run the local proof with:

```powershell
& 'C:/Users/gande/AppData/Roaming/nvm/v25.4.0/node.exe' 'experiments/sky-accuracy-dials/continuation/second-order-rule/proof.mjs' 'tmp/experiments/sky-accuracy-dials/runs/00099-c0-registration'
```
