# Elevated Horizon Validation Experiment Design

## Objective

Determine whether the low-contrast elevated globe horizon is justified by the selected atmosphere or arises from numerical transport or rendering, starting with matched libRadtran calculations.

## Acceptance Question

At a matched 10 km observer and current Bruneton profile, can independent spherical radiative transfer explain the spectral brightness and contrast across the ground-sky boundary, and what evidence distinguishes profile effects from implementation errors?

## Isolation Boundary

Authored experiment work remains below `experiments/elevated-horizon-validation/`. Generated output remains below `tmp/experiments/elevated-horizon-validation/`. Production and other experiment trees are read-only inputs unless their write scope is separately authorized.

## Output and run rules

- `elevated-horizon-validation` is the unnumbered `<slug>` identity defined by the skill's [folder-identity contract](../../../../../.agents/skills/start-experiment/SKILL.md#folder-identity).
- The experiment source root is `experiments/elevated-horizon-validation/`. Authored implementation, fixtures, harnesses, runner source, configuration, and dependency manifests belong there.
- The experiment source root owns `jsconfig.json` with `allowJs`, `checkJs`, and `noEmit` enabled. Run its type check after authored code changes and self-review against the folder-mapped standards, including `types.md`. Dedicated standards reviewers, independent audits, and compliance-ledger gates are disabled under the repository experiment policy. Keep checkpoint-advisor monitoring active and complete the experiment's own scientific and evidence checks. A more-specific folder assignment may add standards guidance without enabling reviewers.
- The generated-output root is `tmp/experiments/elevated-horizon-validation/`. Builds, caches, browser profiles, reports, captures, diagnostics, renders, logs, progress records, temporary files, and other generated intermediates belong only there and must remain ignored by Git.
- Derive repository, source, and output roots from the location of a checked-in repository marker rather than `process.cwd()`.
- Real-path-check every read and write boundary. Reject symlinks, junctions, reparse points, and any resolved path outside its declared root.
- Use a new `runs/<sequence>-<name>/` directory for each evidence-bearing execution. `sequence` is exactly five decimal digits followed by `-`; `name` is descriptive kebab-case and is limited to 16 characters, excluding the `#####-` sequence string. Allocate the next sequence within this experiment only, never fill a gap or reuse a sequence, and reject malformed prefixed entries. Never overwrite or reopen a completed run. Copy or derive reused material into the new run and retain its source identity.
- Record the command, inputs, relevant configuration, implementation revision or hashes, tool/runtime versions, environment facts that affect the result, parent artifacts, derivation operation, and resulting artifact identities.
- Finalize a run with an explicit terminal state: `accepted`, `rejected`, `failed`, or `interrupted`. Publish its terminal manifest only after all artifacts are closed and hashed.
- A verifier may read the run it validates but must not mutate it. Corrections and retries create a new run.
- Keep production and other experiment trees read-only during experiment execution unless the engineer explicitly expands the write scope.

## Monitorable progress

Every operation expected to run longer than one minute writes UTF-8 JSON Lines to:

```text
tmp/experiments/elevated-horizon-validation/runs/<sequence>-<name>/progress.jsonl
```

Append one event at process start, every phase transition, at least once every 30 seconds while active, and at terminal completion or failure. Flush each event so another process can tail the file while the operation runs. Each event contains:

```json
{
	"timestamp": "2026-09-04T12:00:00.000Z",
	"phase": "compute",
	"completed": 24,
	"total": 100,
	"message": "Processing sample batch 24 of 100."
}
```

`timestamp`, `phase`, and `message` are always required. Include `completed` and `total` when work is countable. Terminal events additionally include `state` with one of the allowed terminal states. Do not place secrets, credentials, or unnecessary personal data in progress records.

## Baseline and questions

Starting production revision: `e4b21c447598e783de22108f1afb73a5a47b1361`.
Selected 10 km cache:
`f2c37c079d41f212a3905b4cccb18c0da84766ad374324c9ae8734b4ba1b4b42`.
Authenticate both at execution; changed source or package invalidates any claim
that an old capture is the current executable baseline.

Initial case: spherical Earth, distant Sun, observer 10000 m, San Jose solar
noon on 2024-06-20 (`2024-06-20T20:08:46.261Z`), 50 degree vertical FOV.
These are the reproducible recent capture settings, provisionally representing
the owner's screenshots. Register the actual look direction before comparison;
if a screenshot setting differs, retain this as a labelled reference case rather
than claim pixel correspondence. Baseline scene metadata and images are at
`.codex-tmp/flat32-elevation-10km/live-scenes-03/`. They are inputs, never writable
execution destinations. The user-provided images have no original file metadata;
new captures, rather than reconstructed pixels, supply quantitative evidence.

Use original Bruneton physics, including R=6360000 m, top=6420000 m,
Rayleigh scale height 8000 m, aerosol scale height 1200 m, Angstrom alpha .8,
beta .04, SSA .8 and Cornette-Shanks g .7. Export actual executable coefficients
and source spectra; these prose values are checks, not an alternate implementation.
Production uses corrected60-sun035/N4 and its existing display model. Pin the exact
cache, numerical policy, channel/bin semantics and live display configuration.

Distinguish three questions:

1. Does independent transport with these same physical assumptions predict low
   ground/sky contrast at the elevated horizon?
2. Does production reproduce those predictions through transport and display?
3. Does this atmosphere represent desired or observed clear-sky conditions?

Agreement on questions 1 and 2 does not answer question 3. No objective here
requires a sharp horizon, a white horizon or an improvement in appearance.

## Matched external reference

Use the existing libRadtran 2.0.1-MYSTIC installation through `scripts/libradtran/`.
Do not install or compile a solver. Verify its executable/data identities and WSL
availability when execution starts. Use fully spherical `mc_spherical 1D`, backward
radiance and `zout 10`; plane-parallel or pseudo-spherical results are not a
near-horizon reference. The retained 2.0.1 option documentation defines viewing
and Sun directions relative to this elevated sensor. Verify the installed solver's
actual resolved options, output convention and ray signs in a pilot, rather than
rely only on documentation. Keep refraction disabled in both matched calculations.
Retain the previously qualified VROOM-off configuration and run new elevation
convergence/seed controls; prior 5 m checks do not qualify 10 km tangent rays.

Match the solar spectrum/irradiance, radius, upper boundary, vertical molecular
and aerosol extinction/scattering profiles, absorption, SSA and full phase shape.
Do not substitute an HG lobe for Cornette-Shanks, use default aerosol models, or
silently add standard-atmosphere gases/ozone. Include the observer altitude as an
explicit vertical-grid level. Refine lower-atmosphere and tangent-path layering,
then quantify remaining export discretization error. Record exact input units.

Keep native-15 band-integrated radiance distinct from monochromatic samples.
Cheap 450/550/650 nm pilots check operation and geometry only. Final scores use
matched band integrals, or independently bounded spectral quadrature error; a
center sample is never silently treated as a band integral. Compare spectra and
absolute photometric quantities before applying a common display conversion.
A separately labelled early three-wavelength strip may reveal gross spatial or
color differences; its approximate color never establishes photometric agreement.

## Ground, geometry and appearance

Capture the actual mesh/depth hit mask, camera pixel rays, render resolution,
antialiasing and angular footprint alongside the analytic sphere. Measure the
rendered silhouette against the analytic one before asserting pixel correspondence.
Derive the geometric horizon as elevation `-acos(R/(R+h))`, about -3.21 degrees
at 10 km. Compute sphere hits/distances in binary64 and retain the per-ray
classification. Directions slightly below local horizontal can still be sky rays;
the sign of elevation alone does not determine a ground hit. Exclude the exact
tangent from primary error metrics because a boundary convention or finite angular
aperture can dominate it; retain tangent behavior as a separate diagnostic.

First compare controlled black ground, then a documented neutral Lambertian
reflectance (initial value .2). Both solvers must represent the same boundary,
including any surface reflection feeding multiple scattering. Audit whether the
production cache supports that boundary. If it does not, use an experiment-local
controlled calculation or restrict the claim to common components; never label
mismatched ground feedback as a production error.

Regardless of whether controlled black-ground transport agrees, inspect actual
app compositing for a few rays below and above the limb: scene input/depth, T,
L_path and final display. Independently integrate optical depth for the selected
finite ground segments. This limited direct integral is a component check, not a
substitute for the libRadtran-first multiple-scattering reference.

The app's green RGB Lambert material and scene-light rig are not automatically a
measured spectral surface reflectance or an externally matched illumination model.
For the actual app, retain ground/depth input, atmospheric path radiance,
transmittance and final display as distinct stages. Compare ground lighting
separately from atmospheric transport. Do not invent spectral reflectance by
inverting RGB and then claim exact physical equivalence.

For finite ground rays, use `L_observed = T * L_surface + L_path` wavelength by
wavelength. Obtain T only through a supported, qualified solver output or a clearly
labelled independent direct optical-depth integral; do not relabel total sky
radiance as finite-segment scattering or transmittance. Account for surface
contributions to L_path when interpreting albedo controls. libRadtran's spherical
1D case validates a horizontally uniform atmosphere and spherical surface, not
the scene's cubes. Known object distances may later provide endpoint controls.

All comparison images use identical rays, angular pixel footprints, exposure,
white point, color mapping, ground assumptions and numeric ranges. Mark pixels
containing direct Sun separately. Show a vertical horizon strip, using independent
rows at registered angles; do not add smoothing that manufactures a transition.
Any interpolation for presentation must be declared and excluded from metrics.
Publish geometric masks and angular coordinates beside appearance results.

## Interpretation and extension

Track full-scattering spectral residuals, absolute luminance, signed cross-boundary
contrast and the angular brightness profile. Separate N4-versus-all-orders tail,
Monte Carlo uncertainty, layer/spectral discretization and display differences.
Changing a profile, solver, phase representation or source adds a new comparison;
it does not rewrite the baseline or retrospectively change its criteria.

Evidence can earn independent direct probes, denser view/cache convergence,
compositing diagnostics, controlled aerosol perturbations, other heights/times,
other solvers or observational references. Each branch records a distinct
mechanism, prediction, cheapest discriminating test and comparison to protect.
No production writes or implicit resumption of old experiments are authorized.

Prefer the GPU for production probes, direct integration and rendering where
available. The existing external MYSTIC solve may remain CPU-based; report that
cost rather than replace it with a less independent calculation. Use JS/Python
helpers and existing runtimes only. Do not create an experimental test-framework
tree; use self-verifying proof runners, ambient contracts and local type checking.

## Tool output integration

All generated material for this lane belongs below its declared ignored output
root. The current shared CLI has no output-root override: both the Node launcher
and Python worker enforce `.codex-tmp/libradtran/runs/`; even doctor allocates a
run. Before invoking either, make a source-contained adaptation of both under
this experiment, retaining upstream hashes and a precise delta. Adapt repository
identity discovery, source-copy identities, ignore/path checks and worker output
validation together. Keep algorithm/executable/data authentication and safe launch
semantics intact; do not modify the shared tool or add dependencies. The wrapper
is transport, not an independent atmospheric solver implementation.

Each tool invocation is a new child directory within the enclosing experiment
run. Its internal worker manifest remains a separate artifact; the experiment's
terminal manifest is finalized only after worker and host receipt close and all
artifacts are hashed. Inspect resolved input, solver stderr and manifests as well
as exit status. Do not restart WSL/services automatically or kill unrelated work.

## Standards lifetime

The existing permanent `experiments/` -> `experiment` assignment supplies base,
project-foundation and types guidance. No new assignment, waiver, overlay or
standards-set definition is introduced. Suspension/closure therefore has no
temporary standards changes to restore. Dedicated standards reviewers/audits are
disabled; the plan's one scoped critique is not a standards-compliance review.
Keep checkpoint-advisor monitoring active.
