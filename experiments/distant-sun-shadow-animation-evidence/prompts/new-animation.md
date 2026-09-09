# New Animation Prompt

Status: completed as The Hours; accepted film and independent verification
are recorded in the [experiment status](../../../agents/topics/poc-experiments/engineering-studies/distant-sun-shadow-animation-evidence/status.md).

## Goal

Create an animation that begins just before morning twilight, continues through
twilight and sunrise, progresses through the full day and sunset, and ends in
full darkness after evening twilight.

## Rules

1. Use the Algorithm32 shader to render the sky.
2. Use the Algorithm32 shader to color distant objects.
3. Use the Algorithm32 shader to render extraterrestrial light sources.
4. Use the ambient light provided by Algorithm32 for the current time of day,
   updating it as the animation progresses.
5. Prefer the local shadow light provided by Algorithm32. When used, keep it
   aligned with the Sun's location as the animation progresses.
6. A derivative color model may enhance lighting, but keep the result close to
   natural, normal lighting and preserve the Algorithm32 requirements above.
7. Do not modify any existing lighting code. Clone any lighting implementation
   that needs enhancement into separately owned creative-animation code and
   enhance that copy only.
8. Do not modify any production code. Production is a read-only source of
   existing behavior and reusable references, regardless of the broader
   creative freedom granted elsewhere in this prompt.

## Scene and Creative Direction

Exercise creative control over the scene and populate it with any suitable
objects. Downloaded models, textures, shaders, and other helpful Three.js
objects are allowed. Supplementary assets and shaders must respect the
Algorithm32 rendering and lighting requirements above.

The creative brief is: impress the viewer. Aim for a distinctive, polished
composition and a memorable journey through the day's changing light.

## Deterministic Randomness

If deterministic randomness is needed, use the existing repository RNG at
`scripts/experiments/Random.js`. Keep that implementation unchanged; choose
and retain an explicit seed for reproducible scene construction and replay.

## Camera Direction

- Make the Sun's position obvious during the video; continuous camera centering
  on the Sun is not required.
- Center the camera on the Sun for sunrise and sunset.
- Keep stars in view when they are visible.
- Use fluid camera movements. Camera paths and direction are otherwise open to
  creative interpretation, and changes in field of view are allowed.

## Recording and Playback

Use the existing code that records scene details in real time and later replays
those details for video recording. Either preserve the imperfections of a real
execution or construct ideal camera movements and scene parameters for replay,
as best suits the creative result. Extend the recording and replay code if
needed. State which approach was used when delivering the video.

## Duration

The finished video must be between 30 and 90 seconds long.

## Working Approach

Before implementing needed functionality, inspect the available repository
classes and reuse an existing capability when it fits. New scene-specific
code and explicitly requested lighting clones should build on those owners.
Use the geometry-provided ground object as the scene's ground foundation.
Consider a reasonable desert spectral reflectance, keeping local appearance
and bounce distinct from any ground contribution baked into atmosphere caches.

Treat this as a creative animation project. The user authorizes reorganizing
new work across existing experiment boundaries wherever useful. No formal plan
is required. Exercise full creative and implementation freedom within the
requirements in this prompt and carry the animation through to completion.

Do not make intermediate steps contingent on user feedback or approval. Make
reasonable decisions autonomously and use any internal stages that help the
work progress.

Keep all changes within this repository, including source edits, downloaded
assets, supporting tools, previews, and generated recordings.

Render and inspect intermediate output whenever useful, at any stage and as
often as needed to guide visual decisions. These previews do not require a
formal scientific qualification cycle or a separate user approval each time.

Preserve existing historical evidence and completed runs when reusing their
assets or techniques.
