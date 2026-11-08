# TzDate

## Summary

`TzDate` is the repository's timezone-aware day and calendar helper. It is used to convert between timestamps, JavaScript `Date` objects, and plain date structures of the form `{ year, month, day }` while respecting a target IANA timezone and its DST behavior.

This topic exists because `TzDate` is important infrastructure for stats and show calculations, but its current implementation is custom, somewhat heavy, and a likely future refactor candidate.

## Purpose

`TzDate` is solving a real business problem:
- derive local calendar dates from timestamps in a target timezone
- find the real start of a day in that timezone
- iterate day boundaries across a range
- avoid mistakes around DST, non-24-hour days, and unusual offsets

Current known call sites:
- [server/features/stats/StatsRunner.js](../../server/features/stats/StatsRunner.js)
- [server/features/stats/StatsRegistry.js](../../server/features/stats/StatsRegistry.js)
- [server/features/shows/ShowsHandler.js](../../server/features/shows/ShowsHandler.js)

## Current State

Primary implementation:
- [server/common/TzDate.js](../../server/common/TzDate.js)

Related types:
- [server/common/date-types.js](../../server/common/date-types.js)
- [server/common/TzDateTypes.d.ts](../../server/common/TzDateTypes.d.ts)

Primary tests:
- [server/common/_tests/TzDateSpec.js](../../server/common/_tests/TzDateSpec.js)

### Public behavior in practice

The class currently provides:
- timezone-aware parsing of a `Date` into date/time parts
- conversion from timestamp to `{ year, month, day }`
- conversion from `{ year, month, day }` to a UTC timestamp representing that local day start
- date comparison helpers
- calendar math helpers like `nextDay`, `addDays`, `addMonths`, `addYears`, and `normalizeDate`
- range generation via `getDayStarts(start, end)`

### Implementation notes

The current implementation is based on `Intl.DateTimeFormat(..., { timeZone })` plus custom search logic.

Important internal characteristics:
- `makeParts(date)` converts a `Date` into timezone-local parts
- there is a special-case fast path for the machine's local timezone
- several caches exist: `midnights`, `dateStamps`, `dateDetails`, and `parts`
- `findMidnight(date)` walks backwards an hour at a time until the local date changes
- `findTimeWithinDate(dateDetails)` uses a search helper to locate some timestamp inside the target local date
- `getTimestampForDay(dateDetails)` finds a timestamp within the day, then resolves the day's actual midnight

## Strengths

- It handles real DST edge cases instead of assuming every day is 24 hours.
- The test coverage is valuable and includes:
  - normal timezone conversion
  - positive and negative offsets
  - half-hour offsets
  - DST transitions in and out
  - midnight and 1:00 boundary changes
- The public model of `{ year, month, day }` is a good fit for reporting and calendar logic.
- It avoids adding a heavyweight date dependency.
- It already supports core use cases needed by stats and shows.

## Problems

### Design and maintenance

- `TzDate` mixes several concerns:
  - timezone conversion
  - search logic
  - cache management
  - plain calendar math
- Some methods are more implementation-oriented than domain-oriented, which makes the class harder to reason about.
- The local-time fast path and the generic timezone path behave differently internally, increasing maintenance burden.

### Performance and complexity

- `Intl.DateTimeFormat` objects appear to be created repeatedly instead of being reused.
- Cache growth is currently unbounded.
- `findMidnight` uses an hour-by-hour backward scan, which is simple but brute-force.
- The `parts` cache uses a half-hour bucket strategy, which is a pragmatic optimization but also a subtle correctness risk.

### Correctness and risk

- The implementation is custom enough that correctness depends heavily on tests and maintainer understanding.
- Search behavior is not especially defensive; it relies on invariants that are not strongly documented.
- Some date math helpers use plain JavaScript `Date` rollover behavior on the local machine, which is okay for plain calendar math but conceptually mixed with timezone-aware logic.

## Open Questions

- Which `TzDate` methods are truly public and relied upon, versus just being convenient internals?
- Should the local-timezone fast path continue to exist, or should all code go through one consistent path?
- Is the half-hour cache worth the correctness risk and mental overhead?
- What are the actual performance hotspots in production usage:
  - formatter construction
  - repeated timestamp-to-date conversion
  - midnight discovery
  - day range generation
- Should the next refactor preserve exact current behavior, or simplify the API while adding compatibility shims?
- Is a `Temporal`-backed implementation acceptable in this repo today, or should it remain optional only?
- Would an adapter pattern make future migration safer than editing `TzDate` in place?

## Options

### Option 1: Improve the current implementation only

Keep `TzDate` as one class and modernize internals.

Likely changes:
- reuse `Intl.DateTimeFormat` instances
- switch caches to bounded `Map`-based structures
- harden the search code
- remove or reduce the half-hour cache shortcut
- separate pure calendar helpers into standalone utilities

Pros:
- lowest migration risk
- no runtime or dependency changes
- easiest to land incrementally

Cons:
- still leaves a custom timezone engine to maintain
- architecture remains less future-friendly

### Option 2: Keep the `TzDate` API but split implementations behind an engine layer

Make `TzDate` a facade over interchangeable backends.

Suggested shape:
- `TzDate`
- `IntlTzDateEngine`
- `TemporalTzDateEngine`
- factory selection logic

Pros:
- preserves current call sites
- allows an improved fallback implementation now
- makes optional `Temporal` support possible later
- makes behavior contract testing easier

Cons:
- more files and abstraction
- requires a thoughtful test restructure

### Option 3: Add optional `Temporal` support

Use `Temporal` when available, otherwise fall back to improved `Intl` logic.

Important constraint:
- native `Temporal` should not be assumed across all Node/browser environments today
- a polyfill may be available, but should likely be treated as opt-in infrastructure rather than a hard requirement

Pros:
- cleaner timezone semantics
- better conceptual alignment with the problem
- potential long-term simplification

Cons:
- runtime availability is uneven
- polyfill reliance introduces dependency and compatibility concerns
- migration should be controlled and tested heavily

### Option 4: Full migration to a Temporal-first abstraction

Create a new internal date service centered on `Temporal` concepts and phase out `TzDate`.

Pros:
- best long-term API shape
- strongest semantic clarity

Cons:
- highest migration cost
- unnecessary if current use cases are limited
- not a good first move without proving value

## Preferred Direction So Far

The current best-looking direction is:
- keep the public `TzDate` API stable
- refactor the current implementation into an improved `Intl` backend
- optionally support a `Temporal` backend behind the same facade
- default to the improved `Intl` backend first
- add contract tests that can run against both engines

This gives the repo:
- short-term safety
- long-term flexibility
- a migration path that does not force immediate dependency or runtime changes

## Temporal Notes

Relevant conclusions from exploration so far:
- `Temporal` is intended to become a standard JavaScript built-in, not just a third-party package
- it is not yet safe to assume universal native availability across Node.js and browsers
- a polyfill exists and appears promising, but is not yet "boring infrastructure"
- if used here, `Temporal` should likely be introduced behind an internal abstraction and not assumed globally

## Testing Guidance For Future Work

If `TzDate` is refactored, preserve and expand the current DST-focused test coverage.

Recommended test shape:
- define a shared behavioral contract for `TzDate`
- run that contract against:
  - the improved `Intl` implementation
  - the `Temporal` implementation when enabled
  - the public facade selection logic

Additional future test ideas:
- repeated calls to verify caching does not change results
- explicit tests around year/month/day arithmetic
- tests proving the same input returns the same result across both engines

## References

Repository references:
- [server/common/TzDate.js](../../server/common/TzDate.js)
- [server/common/_tests/TzDateSpec.js](../../server/common/_tests/TzDateSpec.js)
- [server/features/stats/StatsRunner.js](../../server/features/stats/StatsRunner.js)
- [server/features/stats/StatsRegistry.js](../../server/features/stats/StatsRegistry.js)
- [server/features/shows/ShowsHandler.js](../../server/features/shows/ShowsHandler.js)

External references discussed:
- Temporal proposal: https://tc39.es/proposal-temporal/
- Temporal proposal repo: https://github.com/tc39/proposal-temporal
- Temporal polyfill repo: https://github.com/js-temporal/temporal-polyfill
- Temporal polyfill package: https://www.npmjs.com/package/@js-temporal/polyfill

## Suggested Next Steps

1. Decide whether this topic should remain a note or become an active refactor proposal.
2. If active, define a minimal public `TzDate` contract based on actual call sites.
3. Extract an improved `Intl` backend without changing behavior.
4. Rework tests so multiple implementations can share the same behavioral suite.
5. Revisit `Temporal` only after the fallback path is cleaner and easier to compare.

