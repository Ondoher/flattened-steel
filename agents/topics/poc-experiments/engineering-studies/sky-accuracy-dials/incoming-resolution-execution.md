# H60 Incoming Resolution Execution

Status: bounded findings preserved and closure checks complete. Further incoming
builds were stopped after clarifying the intended N1 repair needs outgoing
interpolation changes. The experiment remains open; no next build is selected.
Baseline Git348f3550. Production and prior evidence remain unchanged.
The [results](incoming-resolution-results.md) own findings, metrics and images;
the [plan](incoming-resolution-plan.md) preserves registration and its correction.

## Evidence And Verification

- 00383: accepted complete-domain screen at68/128/256/512/1024 directions and
  407/501/642nm. Fresh F68 pure/cumulative spectra replay H59 exactly.
- 00384: accepted interim error/cost image, inspected visually.
- 00385: accepted all40-band GL256 confirmation; original N1 exact, three screen
  packets reused byte-for-byte, final native field bytes zero.
- 00386: GL512 stopped by closing only its ownership-checked browser via its
  own DevTools endpoint.17 channel packets are preserved, including3 reused
  screen packets. The runner sealed failed after Target closed and removed
  owned scratch. A47.0-second startup heartbeat gap also rejects qualification.
  No full GL512 result is claimed and no retry is selected.
- 00387: immutable interim report with intact outputs/cleanup; post-run verifier
  rejected a45.8-second progress gap. It is not final qualified evidence.
- 00388: accepted replacement report from unchanged completed numerical inputs,
  with explicit progress/yielding during reduction. Accuracy/cost, all40-band
  swatches, spectra and pure-order brightness errors were inspected.
- 00389: accepted same24-batch reference sampling-band reduction, preserving
  within-batch order covariance. Pointwise95% bands are not simultaneous RMSE
  confidence intervals;256 versus512 is not a statistically established optimum.
- 00390: accepted post-run proof authenticates383/385/388/389, checks exact N1,
  outgoing layout, normalized incoming weights, finite fields, exact screen reuse,
  cancellation closure below1.01e-16 and absence of leftover scratch.

Local source type checking passes, including the final report, uncertainty
reduction and verifier. Self-review and git diff --check pass. Dedicated
standards reviews/audits remain disabled under the owner-directed experiment
policy; no standards-compliance verdict is claimed. Checkpoint adviser
recommends preserving this coherent contained unit. Its suggested local message
is preapproved under independent-execution; no push is authorized.

Final retained evidence is640.84MiB under656MiB; scratch is zero and free disk
is over99GiB. GL256 completed in526.3s before sealing;40-channel timing includes
three reused observations and a single82s outlier. See results for timing limits.
No new GPU/production memory constraint was introduced.

## Questions And Decisions

1. What should stay fixed? Original N1 lookup, physical packet, outgoing W27,
   native51 positions, Z180, Q30/cubic view, source20, transport60 and Mie mass
   normalization remain fixed so only incoming integration changes.
2. How to change incoming resolution? Use the existing normalized60 compiler
   and rebuild complete J1/L1/J2/L2/J3/L3/J4 fields with positive normalized GL
   rules; change every native incoming use, including later ground sums.
3. How to bound work? Screen three wavelengths and reuse exact packets when
   expanding at most two rules to40. Retain only three witness spectra, not full
   textures. No full B1 or production/twilight campaign is selected.
4. Which candidates? The registered5% higher-only criterion selects256;
   select512 as a nearby count check.1024 costs more and has worse screened
   higher-only fit, so do not extend the ladder.
5. Why does total fit worsen? Preserve separate N1, higher-only and cumulative
   errors. Unchanged dim N1 was partly offset by old higher-order excess; do not
   disguise this as a total improvement or mix H59's N1 replacement into H60.
6. Are slow channels compilation cost? Deferred driver work and scheduling can
   enter field timing. Report medians, ranges, per-pass sums and observation
   counts, without assigning all outliers to compilation or claiming universal
   timing ratios.
7. How to compare full scores fairly? Use exactly replayed all40-band H59 F68
   spectra for full accuracy; label fresh H60 F68 timing as only3 observations.
   Never compare three-band baseline RMSE with31-band candidate RMSE.
8. What about different rules by order? Record the owner's idea as later work.
   Freshly transport prior radiance at every required direction; do not enlarge
   a sparse incoming texture by interpolation and call it fresh sampling.
9. Can reporting/source work overlap builds? Keep all snapshotted source fixed
   during an active run. Only new unreferenced files and topic documents were
   authored concurrently; they cannot alter the already bundled GPU job.
10. How to recover reporting errors? Local checking caught Unicode pipe damage
    to report operators before execution. Repair using ASCII/Unicode escapes.
    Preserve rejected00387 and repair progress/yielding in new00388, without
    rerunning numerical work. A too-long uncertainty run name failed before
    allocation; shorten it to the supported16-character limit.
11. Does incoming refinement address the N1 problem? No. The primary agent had
    conflated incoming integration with outgoing cache interpolation in the
    preceding discussion. Clarify the distinction and stop the remaining GL512
    build; preserve useful completed evidence without declaring the originally
    intended alternative demonstrated. No retries or further builds follow.
12. Can outgoing samples be denser near the Sun? Yes: a nonuniform/warped outgoing
    domain or dense Sun patch is a possible next experiment. Construction,
    interpolation, physical frames and higher-order reuse must share the mapping.
    This is discussion only; no such implementation or campaign is started.

## Reproduction And Resumption

From repository root with the existing Node runtime:

```text
node experiments/sky-accuracy-dials/incoming-resolution/run.mjs screen
node experiments/sky-accuracy-dials/incoming-resolution/run.mjs full GL256 <screen-root>
node experiments/sky-accuracy-dials/incoming-resolution/report.mjs <00383-root> <00385-root>
node experiments/sky-accuracy-dials/incoming-resolution/uncertainty.mjs <00383-root> <00385-root>
node experiments/sky-accuracy-dials/incoming-resolution/verify.mjs <00383-root> <00385-root> <00388-root> <00389-root>
node node_modules/typescript/bin/tsc -p experiments/sky-accuracy-dials/jsconfig.json
```

New executions always allocate new runs. Do not modify or reopen any saved run.
Chrome launches use the owned run profile and hardware GPU where applicable.
Outstanding scope is deliberately stopped, not silently completed: full GL512,
full B1, outgoing-grid refinement and variable-per-order integration. A future
owner selection is needed before starting a new numerical campaign.
