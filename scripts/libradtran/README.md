# Independent libRadtran Tool

Repository-owned access to the existing libRadtran installation for independent
radiative-transfer calculations. The Node CLI stages inputs on Windows; a copied
Python worker executes `uvspec` inside WSL. Neither imports Algorithm32 or an
experimental transport implementation. No installation, compilation or service
restart occurs automatically.

## Commands

From the repository root:

```powershell
npm run libradtran -- doctor
npm run libradtran -- smoke
npm run libradtran -- run --case path/to/my-case --timeout-seconds 120
npm run typecheck:libradtran
npm run verify:libradtran
```

The CLI also works from another directory when invoked by its absolute script
path. The repository and output root come from the installed script location;
explicit relative case/config paths come from the caller's working directory.
Use `--help` for the compact command shape.

- `doctor` checks the executable's expected SHA-256 and exact version, reads all
  installed data files and records their identities. It runs no atmospheric solve.
- `smoke` runs the bundled 450/550/650 nm directional-radiance case. It requires
  three finite positive outputs with the declared wavelength labels. This is an
  operational check, not a physical accuracy or paper-score qualification.
- `run` executes a self-contained, explicitly described case bundle. Output
  interpretation and scientific comparison remain owned by that case's author.

Every invocation allocates a new directory under the ignored
`.codex-tmp/libradtran/runs/` root and prints its absolute path. No command accepts
an existing run as a write destination. Preserve prior directories; a retry is a
new invocation. Other experiments may copy/read this output as reference input
while retaining its manifest, derivation and compatibility identities.

## Existing Installation

[installation.json](installation.json) selects the tested libRadtran 2.0.1-MYSTIC
build in Ubuntu as user `ondoher`. Its executable hash is pinned to the existing
[build provenance](../../references/downloads/libradtran-2.0.1/BUILD-PROVENANCE.md).
The source distribution and archives stay read-only.

Select a different **already installed** build with `--installation FILE`. Its
JSON must supply `distribution`, `user`, absolute Windows `wslExecutable`, absolute
Linux `executable` and `dataDirectory`, `expectedVersion`, and lowercase
`expectedSha256`. This is an explicit selection, not a fallback. The current host
requires Windows Node, WSL with default `/mnt/<drive>` mounts, and Python 3 inside
the selected distribution. No extra Node or Python packages are required.

The executable's version flag is **`-v`** in this release. `--version` is not its
supported flag. Windows launch uses an argument array and Linux execution calls
the executable directly with `-i input.inp`; no shell command is assembled from
case or configuration values.

If launch times out, inspect `Get-Service WSLService`. A service stuck in
`StopPending` must recover before another run can start. The tool does not force
stop services or distributions. The owner recovered the observed stuck service
in Administrator PowerShell with `taskkill /F /IM wslservice.exe`, then
`Start-Service WSLService`. This affects WSL as a whole; close Linux work first.

## Case Bundle

Copy [cases/smoke](cases/smoke) as an operational starting point, then supply:

- `input.inp`: the libRadtran input deck.
- `case.json`: nonempty `purpose`, `geometry`, `quantity`, `units` strings and a
  `limitations` array of strings describing the intended calculation.
- Every additional case dependency, using paths relative to the bundle root.

Case source must be within this repository and cannot contain the tool's output
root. Symbolic links, junctions and nonregular entries are rejected. Case and
installation sources are copied before launch. Original case bytes are retained
under `case/`; execution uses a separate `execution/` copy.

`run --case` accepts **trusted repository-authored scientific configuration**,
with the same local authority as invoking `uvspec` manually. It is not a job
service for untrusted or uploaded input. The CLI validates metadata and a nonempty
UTF-8 deck without NUL; the native solver owns input-language and physical-option
validation. Do not run a third-party deck until its complete contents and file
references have been reviewed as executable configuration.

In `.inp` files only, the literal **`@LIBRADTRAN_DATA@`** is replaced with the
selected installation's verified data directory. This operation and the resolved
deck are retained. Quote the token/path in the deck if the installation path
contains spaces. No other automatic deck edits, atmosphere defaults, unit changes,
white balance, resampling or color conversion occur.

The bundle author owns dependency closure: all file references must be bundle
relative or point into that configured data tree. This tool is not a sandbox or
a complete parser of libRadtran's input language. An undeclared external file or
output-writing option invalidates the self-contained-case claim. Do not put
external write destinations in a deck. Any comparison must inspect the resolved
input, selected solver options and stderr, not merely the exit code.

The official [usage guide](https://www.libradtran.org/doku.php?id=basic_usage)
describes solver selection, source/atmosphere options and radiance geometry.
For observer rays, `umu < 0` looks upward; `phi - phi0 = 180` looks away from the
Sun. The bundled `output_user lambda uu` case reports wavelength in nm and
spectral radiance in mW m^-2 sr^-1 nm^-1. Other output quantities and units must
be stated by their case metadata; raw output is never silently converted.

## Evidence And Limits

Each completed worker record contains the following artifacts (case, execution
and raw solver streams are present only for a solve):

- `request.json`, selected `installation.json`, original `case/`, and copies of
  `cli.js`/`worker.py` with their exact SHA-256 and byte identities.
- `version.json` and `data-files.json`, identifying the executable and all files
  in the configured data tree. Executable/data identities are checked again
  after execution; changing inputs make the run fail.
- `execution/`, retaining the actual input deck and copied support files used
  as the solver working directory; `stdout.txt`/`stderr.txt` retain raw streams.
- `started.json` and `progress.jsonl` for monitoring; `manifest.json` records
  success/failure, timestamps, physical metadata, command and artifact hashes.
- `launch.json`, finalized by Windows after the worker exits, records launcher
  output, exit/signal, timeout error and elapsed time. It is a separate host
  receipt and is not included in the earlier worker manifest's artifact list.

The default solver limit is 120 seconds and can be set with `--timeout-seconds`.
WSL startup has a separate 30-second deadline. Linux owns solver-group cleanup
and a total worker deadline; Windows has a final launch deadline. Ctrl+C requests
cooperative Linux cancellation, normally noticed within five seconds during a
solve. An unresponsive WSL bridge can prevent receipt of cancellation until its
deadlines expire. Failed or interrupted runs remain evidence; a missing worker
manifest means execution never finalized and must not be consumed as a result.
The tool records failures rather than restarting WSL or retrying automatically.

**Execution success is not an accuracy verdict.** Before a scientific comparison,
match source spectrum, atmosphere/optical properties, observer altitude, geometry,
view/Sun directions, surface reflection, wavelength basis and output units. State
scattering-order and numerical-convergence limits. A DISORT plane-parallel or
pseudo-spherical setup must not be described as a fully spherical near-horizon
oracle or as validation of a finite local source. The paper-profile RMSE gate for
full caches remains separate from these isolated solver checks.

The captured executable/data tree and Python/platform identity support provenance;
this is not a hermetic OS/library image. The tool retains full spectra for later
case-owned scoring/color processing rather than assigning one global score.

## Setup Verification

Live `doctor`, `smoke` and generic `run` execution passed against the selected
installation. Focused CLI proofs cover malformed/duplicate arguments, missing
case metadata, executable identity mismatch, retained artifact identities,
unchanged earlier runs, solver timeout and cooperative cancellation. Timeout and
cancellation use a contained Python fixture rather than an expensive atmosphere
solve, and verify that its Linux process no longer exists after failure.

The [setup review directory](../../.codex-tmp/review-standards/session-Hj5CLj/)
retains the source baseline, proof results and separate standards-review gate.
Operational qualification here does not select any new atmosphere or execute the
matched horizon comparison. That remains a future, explicitly authored case.

`npm run verify:libradtran` is the maintained one-shot proof lane. It requires
the configured WSL installation, runs live smoke/generic cases, then checks ingress,
artifact preservation and bounded failure/cancellation using a temporary Python
fixture. It writes a new record under `.codex-tmp/libradtran/verification/` and
exits nonzero on any failed assertion. Its discovery target is `verify.js`; no
browser harness or experimental unit-test tree is involved.
