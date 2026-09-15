# Complete second-order reference report

This runner authenticates the exact complete Gauss4, Simpson4, Gauss8,
Simpson8 and new azimuth64 parents, checks the original plan identities and
numerical implementation, and replays every stored view integral. It invokes
the pure angular assessment and compares eight authenticated existing GPU
controls without building another cache.

The CLI is `C0 gauss4 simpson4 gauss8 simpson8 angularHigh`. Each invocation
creates a new `p2-angular-assess` run under the experiment's ignored output
root, capped at 4 MiB and five CPU-job minutes with terminal headroom. It
preserves exact source bytes, input derivations, outer/angular predicates,
empirical reference allowance terms, matched numerical errors and the frozen
80% density/altitude hypotheses.

The descriptive shared-reference contrast evaluates the extrema of
`abs(control-R)-abs(candidate-R)` over the same empirical reference interval,
then includes both field allowances. This can resolve small same-side effects
whose reference uncertainty cancels. It retains an explicit unresolved state
when reference admission fails and does not change the frozen 80% predicate.

Only admitted references enable numerical-dial qualification. Rejected
scientific predicates remain valid assessment evidence. The measurement
accounting holds original effective J3/J4 fixed; it is a component diagnostic,
not a regenerated N4 result or a full Kider score. The source milestone remains
under the deferred review gate.
