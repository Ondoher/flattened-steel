# Globe cache deployment runbook

Build locally from Git on a GPU-equipped machine, copy the completed cache to
Ubuntu, and activate it under the deployed Flat app. **The Ubuntu web host does
not need Chrome or a GPU.** Flat's separate local-Sun cache is generated in each
browser and is not part of this transfer.

Run these commands in the **Flattened Steel app repository**, not the parent
Polylith host repository. Build from the intended release sources; a matching
cache-input fingerprint permits reuse across UI-only Git revisions.
The operator owns SSH access, release directories and the parent-host restart.
No remote deployment is performed by authoring or reading this runbook.

## Files supplied here

- [GlobeCacheDeployment.js](GlobeCacheDeployment.js): prepare, GPU probe, local
  reuse check/build, copied-package activation and installed-package verification.
- [cache-build-settings.json](cache-build-settings.json): settings used by both
  the build and its fingerprint; [GlobeCacheInputs.js](GlobeCacheInputs.js)
  calculates the portable input identity.
- [cache-control-seed.manifest.json](cache-control-seed.manifest.json): input
  identities and derivation; [compressed seed](cache-control-seed.json.gz).
- [make-control-seed.py](make-control-seed.py): maintainer-only seed regeneration.
  Deployment uses Node and does not require Python.
- [deployment.test.js](deployment.test.js): focused deployment regressions.

The seed contains **328 small control files, 2.82 MB unpacked, about 1.32 MB
compressed**. It contains scene manifests, geometry ledgers and direction
indices, not atmospheric radiance/scattering cache values. This removes the
old generator's dependency on an untracked local control directory after a
fresh checkout. The existing compiler still reads those exact metadata paths
under `server/flat32/data/`; that build-time name does not expose Flat32.

## Check before rebuilding or transferring

On the local build machine:

```text
node agents/topics/deploy/GlobeCacheDeployment.js check
```

On Ubuntu, to check the installed cache against the pulled source:

```text
node agents/topics/deploy/GlobeCacheDeployment.js check --installed
```

These are informational JSON checks and require no Chrome or GPU. `state` is
`unchanged`, `changed`, `missing` or `unrecorded`; `inputsMatch` distinguishes
source changes from absent output. `reusable: true` means the available package
matches the desired input fingerprint. An installed matching package may also
report `activationRequired: true` after a fresh release checkout resets the
server selection; reapply its preserved activation without rebuilding it.

The fingerprint covers selected build settings, exact control-metadata file
identities, engine/generator source and deployment build logic. Source line
endings are normalized for Windows/Ubuntu comparison. App UI, README files,
test files, generated caches and Git commit identity are excluded. The source
scope is conservative: an engine/build-code change can request a new build even
when its numerical effect would be negligible. Browser, operating-system and
GPU versions remain build provenance rather than automatic invalidators.

The check reads source text and small package metadata, then checks payload
file presence/length. It does **not** rehash the 700 MiB of block contents;
`verify` remains the explicit full-integrity check.

When both builder and host have matching available output, skip rebuilding and
copying. When only the builder has it, skip rebuilding and copy that package.
Missing or older fingerprint receipts report `unrecorded`; they do not disable
an already installed cache, but cannot establish that its inputs are unchanged.

## 1. Prepare the local build machine

Use a fresh checkout or an isolated build checkout at the intended release
revision. Pull changes there; do not overwrite an unrelated working tree.

```text
git pull --ff-only
```

Use Node 25, the runtime used for the local checks, and an installed Chrome or
Chromium executable. The encoder requires Node's built-in Zstandard APIs. Keep
development dependencies installed on the build machine: the compiler probe
uses the repository's Puppeteer package. Run Chrome as an ordinary user with
the GPU driver/device accessible to that account.

On the current Windows build machine, in PowerShell:

```powershell
$env:PUPPETEER_SKIP_DOWNLOAD = 'true'
npm ci --include=dev
$env:CHROME_PATH = 'C:/Program Files/Google/Chrome/Application/chrome.exe'
$env:FLAT_CACHE_BROWSER_BACKEND = 'd3d11'
node agents/topics/deploy/GlobeCacheDeployment.js prepare
node agents/topics/deploy/GlobeCacheDeployment.js probe
```

`PUPPETEER_SKIP_DOWNLOAD` avoids an additional browser download because the
installed Chrome executable is supplied explicitly.

The probe must report the intended hardware renderer, `software: false`,
successful WebGL2 float rendering/readback, and no GL error. GPU discovery by
an operating-system utility alone is insufficient. Fix a failed probe before
starting the full build. Probe/browser profiles are disposable and removed on
success and failure; JSON results remain below `.codex-tmp/flat-cache-deployment`.

For a Linux **build machine**, select `CHROME_PATH` and a working hardware ANGLE
backend (`gl`, `vulkan`, or `auto`) in its environment, then run the same probe.
Linux graphics support must be checked on that machine. D3D11 is Windows-only.
Explicit `swiftshader` software rendering exists for diagnostics, but is not
the recommended full-build path. Its build time has not been measured here.
The launcher keeps Chrome's process sandbox enabled. See the
[Chromium graphics guidance](https://chromium.googlesource.com/chromium/src/+/HEAD/docs/gpu/swiftshader.md)
and [ANGLE backend switches](https://github.com/google/angle/blob/main/doc/DebuggingTips.md).

## 2. Build the selected Globe package locally

```text
node agents/topics/deploy/GlobeCacheDeployment.js build
```

This command first checks its saved input fingerprint and sealed output. If
unchanged and available, it prints `phase: "cache-reused"` and skips the GPU
probe and compiler. Otherwise it restores/verifies the seed, probes hardware,
and invokes the existing production compiler using `cache-build-settings.json`:

- Canonical original Bruneton atmosphere.
- Anchored-radial numerics and `corrected60-sun035` scattering.
- Monotone-cubic solar interpolation and observer coverage through 40,000 m.
- The existing Native48/F68/Native15/N4 domains and production control scenes.

The compiler creates a **new** run below
`tmp/production-algorithm32/distant-sun-shared-block-cache/runs/`, emits progress,
generates/compresses blocks, verifies reconstructed scenes, and seals its result.
The helper records the successful result in
`.codex-tmp/flat-cache-deployment/last-build.json`.

This portable receipt includes the input fingerprint separately from the sealed
compiler run; no immutable acceptance/seal files are modified. Source inputs
are checked again before recording a successful build. Preserve the receipt
and its recorded run on the builder so subsequent pulls can reuse it.
To deliberately rebuild matching output:

```text
node agents/topics/deploy/GlobeCacheDeployment.js build --force
```

Expect approximately **700 MiB of published output**, plus larger temporary
working files. Actual capacity must accommodate the compiler's allocations and
staging. A historical RTX 2060 build of the current 40 km selection took about
12.45 minutes; that is a recorded example, not a deadline or a timing promise for
another machine. A failed/interrupted run is not a deployment artifact. Keep
the previous installed cache available and rerun into a fresh compiler run.

## 3. Copy only the completed deployment subset to Ubuntu

Read `publishedRoot` from `last-build.json`. Its layout is:

```text
<run-relative-path>/
  acceptance.json
  sealed.json
  published/
    <generated-package-identity>/
      package-set.json
      configurations/...
      blocks/...
      ...all other published files...
```

Copy **acceptance.json, sealed.json and the entire published directory**,
preserving these paths below the Ubuntu app checkout. The published package is
already Zstandard-compressed. Do not transfer the run's staging files, raw
accumulators, browser profile or unrelated historical runs.

Also copy `.codex-tmp/flat-cache-deployment/last-build.json` to the same relative
path on Ubuntu. That small receipt associates the input fingerprint with the
exact transferred package. It is outside the immutable compiler run.

Example PowerShell commands from the local builder; replace the SSH account and
Ubuntu app directory with your installation values:

```powershell
$buildResult = Get-Content .codex-tmp/flat-cache-deployment/last-build.json -Raw | ConvertFrom-Json
$runRelative = $buildResult.publishedRoot -replace '/published/[a-f0-9]+$', ''
$deployTarget = 'deploy@example.org'
$remoteAppRoot = '/srv/apps/flattened-steel'
$remoteRun = "$remoteAppRoot/$runRelative"
ssh $deployTarget "mkdir -p '$remoteRun' '$remoteAppRoot/.codex-tmp/flat-cache-deployment'"
scp "$runRelative/acceptance.json" "$runRelative/sealed.json" "${deployTarget}:${remoteRun}/"
scp -r "$runRelative/published" "${deployTarget}:${remoteRun}/"
scp .codex-tmp/flat-cache-deployment/last-build.json "${deployTarget}:${remoteAppRoot}/.codex-tmp/flat-cache-deployment/last-build.json"
$runRelative
```

Record the printed run-relative path for activation. If transfers fail, complete
them before activation. Receiving a directory does not activate it.

## 4. Install and select the copied package on Ubuntu

The host needs Node and the app's installed dependencies, but no build browser.
Run as the deployment account with write access to the **new release checkout**.
Serialize cache activation for that installation.

```bash
cd /srv/apps/flattened-steel
# Replace the value with the run-relative path printed by the local builder.
RUN_RELATIVE_PATH='tmp/production-algorithm32/distant-sun-shared-block-cache/runs/REPLACE_WITH_RUN_ID'
node agents/topics/deploy/GlobeCacheDeployment.js activate "$RUN_RELATIVE_PATH"
node agents/topics/deploy/GlobeCacheDeployment.js verify
node agents/topics/deploy/GlobeCacheDeployment.js check --installed
```

Activation checks the sealed receipt and generated report, copies the package
through a new staging directory, and installs it at the exact default location:

```text
<Ubuntu app checkout>/server/flat/data/distant-sun-shared/<generated-package-identity>/
```

It then verifies the installed files and updates **the deployed copy of**
`server/common/distant-sun-package.js`: package identity, report length and report
hash. This is necessary because another build may have a different identity;
do not rename its files to the old identity or disable content authentication.
The tool does not change the atmosphere, create a Git commit or modify the
parent repository. Use a clean release checkout on the next deployment rather
than pulling Git changes over this generated selection edit.

Activation stores `installed-build.json` beside the transferred receipt.
Preserve that record with the installed cache across releases; it enables the
next `check --installed` to determine whether another transfer/build is needed.

The activation result prints the installed path and an activation-record
directory containing `previous-selection.js` for rollback. Older cache
directories remain intact. Do not overwrite or delete the source build run.

If the parent sets `FLAT_DISTANT_SUN_CACHE_ROOT`, point it to the newly printed
**package directory**, not its parent or the incoming run, or remove the override
to use the default location. Preserve the Flat data directory across release
cleanup where appropriate. A symlink/junction deployment root is not supported
by the current filesystem contract.

## 5. Build/start the alpha and check actual delivery

Let the parent host perform its ordinary Polylith app build and restart with
`NODE_ENV=prod`, matching the host's environment name. The base app catalog
advertises only Flat with either `prod` or `production`; no production-specific
overlay is required. The Flat32 development launcher rejects both values.
Flat's build generates its browser worker in the parent's
selected deployment output. Cache activation must precede process startup;
editing the selection module does not replace an already-loaded Node module.

From an account that can reach the deployed site:

```bash
APP_URL='https://example.org/flat'
curl --fail "$APP_URL/"
curl --fail "$APP_URL/shared-cache-worker.js" -o /dev/null
curl --fail "$APP_URL/api/distant-sun-scene-cache?solarZenithDegrees=90"
```

The API must return a ready descriptor for the **newly generated identity**.
In a browser, select Globe, wait for its scene, change time and elevation, and
open a second view. Confirm selected block requests succeed through the app's
actual mount. Check that the parent does not expose stale Flat32 routes/output.
The stellar catalog and vision-filter packages are included in the app's Git
checkout at their default server locations. The
[alpha handoff](../production-app/release/alpha-status.md) owns their optional
directory overrides and remaining source/redistribution status.

## Reuse, rollback and verification limits

- A normal UI-only deployment need not regenerate unchanged physical cache
  content. Preserve its build subset and reinstall/verify the compatible package
  in the new release checkout. Rebuild after relevant physical, numerical,
  compiler or coverage changes.
- If activation or verification fails, do not restart into the candidate. The
  current running process retains its previous selection. Keep its cache files.
- To roll back an activated release, restore the activation record's
  `previous-selection.js` to `server/common/distant-sun-package.js`, restore any
  previous environment override, and restart the owning host. Prefer the
  installation's ordinary complete-release rollback when one exists.
- Local GPU preflight and deployment fixture tests do not establish a full
  regenerated package's scientific equivalence on every GPU. The full builder
  verifies its own output and retains actual build identities. Do not claim
  that this runbook itself ran a complete new cache build or deployed a host.

To verify the support code locally:

```text
node --test agents/topics/deploy/deployment.test.js
node node_modules/typescript/bin/tsc -p agents/topics/deploy/jsconfig.json
```

The seed producer is a maintenance tool for a developer who already has the
original control metadata: `python agents/topics/deploy/make-control-seed.py`.
Regeneration must preserve/review its per-file identities. It is not a required
step on a fresh build machine; the seed is supplied in Git with this runbook.

Authoring verification on 2026-11-09: the three deployment tests pass on Windows
and on Ubuntu WSL2's native Linux filesystem. The Linux activation test uses a
small package-reader fixture to test paths, copying, selection updates and
rollback records; it does not generate physical cache data. The real installed
209-file package was also authenticated by the `verify` command on Windows.
The production inventory resolves to 109 scenes, 5,847 coordinates and 95 blocks.
The local RTX 2060 passed the WebGL2 float hardware probe with no software
fallback. All 13 maintained shared-generation tests pass, including explicit
profile-removal assertions after compiler failure/cancellation. Deployment and
compiler type checks pass. A full new cache generation,
Ubuntu GPU build and remote deployment were not run for this documentation task.
Reuse regression coverage includes skipping GPU work, source/settings/control
changes, missing payload files, Windows/Linux line endings, and unchanged
UI/documentation edits.
