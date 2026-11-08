# Spherical Cache Deployment

Flat owns its distant-Sun resolver, immutable artifact delivery and module Worker.
The neutral server implementation is in `server/common/`; neither the browser
nor server imports a Flat32 application implementation at runtime.

## Data

Stage the existing immutable production package before running Flat:

`npm run stage:flat:spherical-cache -- <existing-package-directory>`

The selected report and package identities live in
[the neutral package selection](../../../common/distant-sun-package.js).
The current package contains 209 files and 734,130,872 bytes. Staging authenticates
the input and copied artifacts. The original package is read-only input. Output
is ignored under `server/flat/data/distant-sun-shared/<package-identity>/`.
Do not commit a second dataset or rebuild it at browser startup.

Alternatively, set `FLAT_DISTANT_SUN_CACHE_ROOT` to a complete operational package
directory. This can be outside the repository. Declared relative artifact names,
complete file length/hash authentication and ordinary-file/no-alias checks still
apply. Deploy that package directory independently of the Flat32 application.
A missing or incompatible package returns HTTP 503 and the page offers retry.

The staging command normally publishes by renaming a verified staging directory.
If Windows refuses directory rename, it copies verified files to the final
location and publishes the report last, then authenticates the published files.
The staging copy remains available for diagnosis. An interrupted staging directory
can be supplied as the optional second argument to authenticate and finish it.

## Build And Routes

`npm run build:flat` builds the normal app and emits its pinned module Worker at
`dist/flat/shared-cache-worker.js`. The worker build also preserves Flat32 output.
Ordinary all-app builds run the same worker build.

The effective app mount owns:

- `api/distant-sun-scene-cache?solarZenithDegrees=<degrees>`
- `spherical-cache/<package-identity>/<declared-relative-path>`
- `shared-cache-worker.js`

The application I/O service and document base resolve these paths after direct
page refresh or nested mounting. M1 authenticates the metadata graph and decodes
one required block to prove delivery; full scene block selection/attachments and
rendering are M2 work. A cache-ready page explicitly says rendering is pending.
