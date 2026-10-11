# Spherical San Jose Sunset At Central FOV

The owner selected a spherical/distant San Jose sunset comparison with the
[central-view framing](central-view-capture.md): 60 degrees horizontally at
1024 by 768. The [00733 image](../../../../../tmp/experiments/local-sun-cache-reuse/runs/00733-globe-sunset/san-jose-sunset.png)
uses the unchanged production `Flat32Application`, its spherical atmosphere,
deployed distant-Sun shared cache, ordinary ground/six-object scene, p2 color
model and human-vision stellar filters. This is a contained caller of existing
production configuration, not a production modification or cache promotion.

## Observation And Camera

The ordinary San Jose sunset preset has June 20, 2024 as its date basis. Its
resolved instant is `2024-06-21T03:26:03.503Z`, or June 20 at 8:26 p.m. PDT.
The source elevation is 0.04208477 degrees. It is the standard sunset preset,
not the earlier local-Sun winter-solstice Flat180 observation.

The camera faces the resolved Sun azimuth at five degrees elevation, retaining
the existing sunset-facing framing convention. Actual measured FOV is
60 degrees horizontal and 46.82644889 degrees vertical at aspect 4/3. The
ordinary application owns the physical scene and lighting; the contained
caller supplies the existing vertical-FOV configuration. Preset selection
uses the ordinary UI handlers, and capture waits for the published observation,
not just immediately updated control labels.

## Evidence And Reproduction

The [00733 result](../../../../../tmp/experiments/local-sun-cache-reuse/runs/00733-globe-sunset/result.json)
records the published observation, actual camera and raster, complete celestial
generation, N4 spherical/distant pairing, p2 model, 151 served cache artifact
identities and zero WebGL/render errors. Browser preparation and capture took
24.326 seconds. The [00732 resource guard](../../../../../tmp/experiments/local-sun-cache-reuse/runs/00732-resource-bound/result.json)
passes with 3.72 GiB sampled peak private memory and 11.81 GiB minimum free memory.
No heavy job, retained browser profile or video remains.

The run retains the executable bundle and production module Worker, precise
source/asset hashes, derivation operations and browser/runtime settings.
The actual source graph and deployed cache identity are recorded in
[inputs](../../../../../tmp/experiments/local-sun-cache-reuse/runs/00733-globe-sunset/inputs.json).
Prior 00727 missing-worker and 00729 premature-publication attempts remain
immutable failed evidence. Accepted 00731 is an earlier capture; 00733 additionally
records the explicit Worker derivation and is the final handoff image.

```text
node experiments/local-sun-cache-reuse/run-resource-bounded.js --minutes=10 -- run-globe-sunset.js
```

Local JavaScript type checking, root formatting and capture checks pass.
Implementation completion requires matching exit-0 CLEAN primary/audit evidence
at `.codex-tmp/review-standards/session-LNzZAs/validation.json`; the baseline
preceded authored changes. This image provides a model comparison, not an
independent physical accuracy measurement. Historical evidence and production
source remain unchanged; video and promotion are unselected.
