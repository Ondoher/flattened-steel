# New Animation Prompt

Status: draft; goal, rendering rules, and creative direction recorded.

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

## Scene and Creative Direction

Exercise creative control over the scene and populate it with any suitable
objects. Downloaded models, textures, shaders, and other helpful Three.js
objects are allowed. Supplementary assets and shaders must respect the
Algorithm32 rendering and lighting requirements above.

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
