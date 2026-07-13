# Build And Asset Flow

## Purpose

Define how Polylith app selection, application builds, feature contributions,
copied assets, browser-test bundles, and runtime paths fit together.

The rules describe the repository's target build shape. Existing imported
manifests must be audited rather than assumed to comply.

## Configuration Layers

### 1. Repository Configuration

`polylith.json` selects app build definitions and owns repository-wide builder
and server settings such as build location, source root, output root, and React
support.

Each selected app should have a stable name and a build-definition filename.
Keep machine-specific paths, credentials, and certificates out of tracked
shared configuration; supply them through explicit local or environment
overrides.

The schema is coupled to the installed Polylith version. Confirm fields
against the pinned toolchain before adopting configuration from another
repository or major version.

### 2. Application Build Definition

`builds/<app>.json` defines one deployable browser surface. Depending on the
app, it can own:

- app name, source root, and output destination;
- application entry module;
- HTML template and destination;
- app-wide copied resources and CSS;
- explicitly included features;
- server router information;
- browser-test entry, output destination, and app-level test groups.

Adding source files alone does not make them part of a deployable app. The app
must be selected by repository configuration and described by a build
definition.

### 3. Feature Descriptors

A feature-local `build.json` defines what that feature contributes to the app
build. Common contributions are:

- `index`: the feature entry module;
- `css`: copied feature stylesheets;
- `resources`: copied images or other standalone files.

An optional feature-local `test.json` contributes feature-owned browser spec
groups. The app build still owns the browser test entry and generated test
destination.

### 4. Runtime Activation

Build definitions make modules available; entry imports and registry startup
activate behavior. A feature can therefore be included but inert if its
side-effect import chain is incomplete.

## Copied Asset Descriptors

For a copied resource or CSS descriptor:

- `cwd` is the source root for matching files;
- `glob` selects files below that root;
- `dest` is their built runtime directory;
- `keepNest: true` preserves the hierarchy below `cwd` under `dest`.

If a file must physically exist in `dist`, place it under the declared source
tree and include it in a descriptor. Colocation beside a component is not
enough.

## Runtime Path Derivation

Derive runtime URLs from built output:

- JSX and HTML asset references use the path produced by `dest`.
- CSS `url(...)` values are relative to the emitted CSS file's location.
- Never use a source-tree path as a browser URL merely because the source file
  exists there.

Generic example:

```json
{
  "resources": [
    {
      "cwd": "assets/images",
      "glob": "**/*.{png,jpg,svg}",
      "dest": "feature/images",
      "keepNest": true
    }
  ]
}
```

In that feature, `assets/images/icons/status.svg` is emitted beneath
`feature/images/icons/status.svg`. JSX uses the built path; a stylesheet
emitted under `feature/css` reaches it using a relative URL based on that
emitted layout.

## CSS Choices

Use build-copied CSS under an app or feature asset tree as the default for
styles that participate in the shipped asset layout. Module-imported CSS may
be supported by the toolchain, but it should be an explicit exception rather
than an accidental second asset system.

Keep app-wide styling broad. Place component and feature styling with its
owner, and declare any stylesheet that must be copied to output.

## Browser Test Build Boundary

Browser specs are source files, but the browser runner should consume the
Polylith-built test artifact:

1. The app build identifies the browser-test entry and output destination.
2. App and feature test groups select source specs.
3. The app test entry imports the synthetic Polylith test module.
4. Polylith emits a browser-ready bundle under the configured test output.
5. The browser test runner executes that generated bundle.

If a spec is missing, inspect app and feature test-group globs before blaming
the browser runner's discovery.

## Generated Output And Watchers

Treat `dist` and generated browser-test folders as build output, never as
canonical source. When a running watcher misses a newly added copied asset, a
temporary asset-only sync into `dist` can unblock live inspection, but the
source descriptor remains authoritative and the normal builder must reconcile
the output.

Do not use this convenience for source modules or build configuration.

## Verification Checklist

When a build, feature, or asset is missing:

1. Is the app selected in `polylith.json`?
2. Does its build definition point to the intended source, entry, template,
   and output?
3. Is the feature explicitly included in that build?
4. Does the feature `build.json` declare its entry, CSS, and resources?
5. Does each copied file match the descriptor's `cwd` and `glob`?
6. Is the browser URL derived from `dest` and the emitted layout?
7. Is the runtime side-effect import chain intact?
8. For tests, does an app or feature test group match the source spec?

## Common Risks

- Manual feature lists can drift from the source tree.
- Build inclusion and runtime activation can be mistaken for one another.
- Two CSS delivery mechanisms can create conflicting ownership.
- A valid source path can still produce an invalid runtime URL.
- Hand-edited generated output can hide an incomplete descriptor.
- Configuration copied across Polylith versions can appear plausible while
  using incompatible schema or behavior.
