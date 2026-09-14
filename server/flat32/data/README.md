# Flat32 Distant-Sun Cache Data

This directory owns the extracted runtime data served by
`features/shared-cache/DistantSunSharedCachePackageService`. Large generated packages are ignored by
Git; this README is the tracked contract for their location and provenance.

It also owns the local-only Color Reset P5 stellar package at
`brightest-2000-stellar-package-v1/`. Run
`npm run materialize:algorithm32:brightest-2000-stars` once from an unchanged
copy of accepted CR6B run `000047`, CR6F run `000055`, and CR6G run `000057`;
then run `npm run verify:algorithm32:brightest-2000-stars`. The package retains
the exact double-precision roster and Native15 packets plus the accepted
`2000x1 RGBA32F` member and `2000x15 R32F` spectrum payloads. It is ignored and
must not enter a public repository or release package until the source and
redistribution gaps named by the production Color Reset design close.

The local-only P7 human-vision package lives at
`human-vision-filter-package-v1/`. Run
`npm run materialize:algorithm32:human-vision-filters` from the retained CIE
scotopic sensitivity payload, then run
`npm run verify:algorithm32:human-vision-filters`. The package contains the
15 Native15 scotopic integration weights used by the optional mesopic filter.
It is authenticated by the browser loader, remains ignored, and must not enter
a public repository or release package until the CIE source and redistribution
rows in the
[project-wide research register](../../../references/followup.md#missing-third-party-sources-or-canonical-registrations)
close.

The selected immutable shared package lives at:

```text
server/flat32/data/shared-block/2243c1ab2c2d529131759b32d72cee2a2e4b32098e1cc450c0d48cf34ed4edc7/
```

Run `npm run publish:algorithm32:shared-runtime` to copy and authenticate the
generated immutable parent. The tracked server selection pins the report identity;
there is no dense rollout switch. The selected ozone-free package is
505,753,993 bytes and the
server serves only its allowlisted, authenticated complete artifacts.
[Original rollout evidence](../../../archives/topics/production-algorithm32-release-20260911/agents/topics/production-algorithm32/caches/shared-runtime-rollout.md)
is preserved by the production cache topic.

## Operational Numerical Reference

`one-degree-bin-covered-runtime-packages-20260830-1/` retains the 109 original
dense controls as the shared generator's scene-coverage, selection, coordinate,
and ledger controls. Regenerated physical values are verified from the new
shared blocks rather than compared with those ozone-enabled payload values. The
control inventory is not served and is not a second deployed cache inventory;
deleting it would break the generator. The original pre-color-reset archive and index remain intact,
including `extraterrestrial-production-adoption-runtime-active-output-2026-08-31.zip`.

The active offline command is `npm run build:algorithm32:distant-sun-cache:shared`.
Common numerical compiler/input owners remain under
`scripts/algorithm32/solar-zenith-cache/`. Former dense inventory commands are
retired; their exact source bytes and restoration instructions are under that
folder's `retired/` directory. All new generated qualification output belongs
under the ignored production shared-cache output root, never a sealed experiment.
