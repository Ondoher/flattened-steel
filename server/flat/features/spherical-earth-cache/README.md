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
`dist/flat/shared-cache-worker.js`. The spherical feature's Polylith build hook
uses the effective application's destination. A discoverable app built by a
separate parent therefore emits the Worker under that parent's output, without
requiring a repository-local npm after-step. Source inputs and the pinned decoder
remain anchored to this repository. Ordinary all-app builds use the same hook;
the maintained explicit Worker command also preserves Flat32 output.

`npm run typecheck:flat:build` checks this Node build boundary separately from
the browser source. `npm run test:flat:build` exercises the actual feature hook
with an independent output directory and verifies its Worker, entry and CSS
registration.

The effective app mount owns:

- `api/distant-sun-scene-cache?solarZenithDegrees=<degrees>`
- `spherical-cache/<package-identity>/<declared-relative-path>`
- `shared-cache-worker.js`

The application I/O service and document base resolve these paths after direct
page refresh or nested mounting. The app service authenticates metadata once per accepted report/lifetime.
Production scenes load complete required/interpolation support through independently
owned GPU attachments. The retained one-block method is an explicit connection
diagnostic; it does not represent complete scene readiness.

The built application entry exports `stopApplication()`. Hosts must await its
completion before restarting or releasing shared providers. It unmounts pages,
awaits current and removed scene sessions and any unclaimed eager Flat cache,
then releases the application's transport/Worker and stellar source. Each live
view retains its own GPU resources. On native context loss, the spherical runtime
retires obsolete native handles before restoration; Retry waits for that exact
release before recreating the renderer on its mounted canvas.
