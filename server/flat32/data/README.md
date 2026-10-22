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
server/flat32/data/shared-block/8d185961cab8beb1e461cd1256be2875bb9a99e9f39e515b9288b92e5d2f6d37/
```

The [sky accuracy promotion status](../../../agents/topics/production-algorithm32/caches/sky-accuracy-promotion-status.md#current-default-and-rollback)
owns the owner-authorized default activation, report identity, publication evidence,
review limitation and immediate rollback. The previous package remains intact.
The server serves only allowlisted authenticated complete files, with the selected
package's construction and runtime lookup policies explicitly paired.
The [prior strobing release](../../../agents/topics/production-algorithm32/caches/distant-sun-strobing-release.md)
retains the preceding deployment's provenance and historical rollout references.

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
