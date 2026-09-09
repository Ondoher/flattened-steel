# The Hours — An Observatory of Light

A sixty-second, native-4K journey through a complete astronomical day at a
fictional desert observatory. The [creative prompt](../prompts/new-animation.md)
owns the brief; the experiment's [status](../../../agents/topics/poc-experiments/engineering-studies/distant-sun-shadow-animation-evidence/status.md)
owns the current artifact and verification state.

## Render and inspect

With the existing application server serving `http://127.0.0.1:8081`:

```powershell
node experiments/distant-sun-shadow-animation-evidence/creative/run-creative-animation.js --preview
node experiments/distant-sun-shadow-animation-evidence/creative/run-creative-animation.js --video
node experiments/distant-sun-shadow-animation-evidence/creative/verify-creative-animation.js <completed-video-run-id>
```

Each command allocates a new run below the experiment's ignored output root.
The final video is `captures/creative-full-day.mp4`: 3840 by 2160, 30 frames
per second, 60 seconds, with 1,800 distinct ideal scene states. Encoding is
offline and makes no claim about live animation FPS. The accompanying scene
trace retains the astronomical time, camera, illumination, and cache identity
for every frame. Verification reads the completed parent without modifying it
and writes decoded image checks into a separate run.

## Repeatability

The authored scene, deterministic seed, camera score, astronomical timeline,
lighting procedure, render settings, and verification commands are retained in
the repository. Every run records exact source and dependency hashes, consumed
cache manifests, environment details, all 1,800 scene states, and a terminal
artifact manifest.

A rerun requires the existing application server, the current `dist/flat32`
build, installed root dependencies, Mediabunny 1.55.7 from the shared-block
cache experiment, Chrome with the required WebCodecs support, and the generated
Algorithm32 cache packages identified by the run. Those large binary caches
and installed tools are not copied into the film run. Consequently, the
workflow is deterministic and rerunnable in a compatible prepared repository,
but the accepted run is not by itself a self-contained restoration package.
Hardware encoders may also produce a different MP4 byte stream from the same
frames; compare scene traces and representative decoded frames rather than
requiring a byte-identical movie.

## Existing capabilities and creative adapters

The existing Algorithm32 runtime supplies atmosphere, distant-object
composition, the Sun, stars, astronomical geometry, and direct/diffuse spectral
illumination. The geometry owner supplies the spherical ground object.
`scripts/animation-evidence/` supplies deterministic recording, WebCodecs
selection, bounded byte streaming, and artifact manifests. Installed Three
geometry utilities and SimplexNoise supply batching and surface variation;
`scripts/experiments/Random.js` supplies the recorded deterministic seed.

The new adapters own the observatory geometry, fluid camera score, exact-time
runtime updates, and a separately cloned local-lighting implementation.
Direct light follows the exact Sun direction. Diffuse Native15 spectra are
measured at one-second animation intervals and interpolated for the final
film. One shared Sun shadow map covers the observatory.

The [ground-response note](ground-reflectance.md) describes the illustrative
sand spectrum and local bounce approximation. Existing atmosphere caches keep
their original black-ground boundary; no reflective-ground atmospheric
multiple-scattering claim is made.

Production files, existing lighting files, the RNG, and completed evidence
remain unchanged. The browser launcher exposes existing application objects
only in the intercepted in-memory bundle; it does not rewrite production.
