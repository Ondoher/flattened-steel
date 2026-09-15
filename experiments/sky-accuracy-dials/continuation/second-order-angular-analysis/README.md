# Pure second-order angular assessment

These helpers assess the held original morning-view comparisons on channels 0
and 8. They perform no physical solves, authentication, evidence writes or run
allocation. The caller authenticates immutable parents, original C0 geometry,
source compatibility and registered plans before supplying evidence.

- `assessSecondOrderAngularShrinkage(integrals)` returns all ten whole-view
  component/channel predicates, including unresolved records for missing rows.
- `secondOrderMappedPlacementAllowance(nodes, baselinePoints)` returns 50
  interval/view, component and channel records on the complete exact 32-node
  Gaussian-eight baseline. Each mapped/ordinary difference is made absolute
  before its positive path weight and shared transmission are applied.
- `assessSecondOrderReference(input)` returns
  `{outerChecks, angularChecks, placement, channels}`. Its named input contract
  is `SkySecondOrderReferenceInput` in `types.d.ts`. It recomputes the matched
  Gaussian-eight and azimuth64 integrals, all twelve registered outer checks,
  and all ten registered angular checks. Channels retain the available reference,
  empirical allowance, separate terms and explicit adequacy state.

The held angular inequality is

```text
absoluteCorrection <= .2 * earlierAbsoluteResponse
  + correctionIncidentAllowance + correctionViewAllowance
  + .2 * (earlierIncidentAllowance + earlierViewAllowance) + 1e-8 W.
```

The earlier response changes radial and azimuth resolution together. This
predicate is a response-shrinkage envelope, not an isolated convergence exponent.
Incomplete angular points remain unresolved. Malformed or mismatched supposedly
complete baseline geometry, angular policy and numerical values are rejected.

The reference is the complete azimuth64 Gaussian-eight combined value. Its
empirical allowance retains four distinct terms:

```text
U = refinedInner
  + max(abs(G8fine-G4fine) + innerG8 + innerG4,
        abs(S8fine-G8fine) + innerS8 + innerG8)
  + absoluteAngularCorrection + angularIncidentAllowance + angularViewAllowance
  + absoluteMappedDifference + mappedIncidentAllowance + mappedViewAllowance.
```

For mapped placement, the last three terms are `sum(w*T*abs(M-B))`,
`sum(w*T*(Um+Ub))` and `sum(w*Ut*(abs(M-B)+Um+Ub))`. The retained signed path
difference is diagnostic only. Angular comparison uses the equivalent shared-view
propagation already retained by the angular refinement executor.

The formula deliberately repeats overlapping inner allowances. It uses the
specified whole-view outer differences, which can themselves cancel locally;
it is an empirical allowance and does not establish a rigorous error bound or
prove that an unseen outer/angular interaction is bounded. Adequacy additionally
requires complete physical admissions, every frozen outer and angular check,
`U <= 5e-5 W`, and `U <= .2*abs(H-R)`. The last contrast is the specified original
effective source minus refined reference; it is not an uncertainty-adjusted lower
bound. Failing a completed predicate fails adequacy; missing evidence or physical
admission leaves it unresolved.

Run the focused local manufactured proof with the pinned Node executable:

```powershell
& 'C:/Users/gande/AppData/Roaming/nvm/v25.4.0/node.exe' experiments/sky-accuracy-dials/continuation/second-order-angular-analysis/proof.mjs
```

The proof checks independent weight/transmission formulas, positive allowances,
opposite-sign cancellation, exact angular threshold equality, failed and missing
gates, relative adequacy boundaries and rejected malformed inputs. It creates no
immutable run and makes no physical qualification claim.
