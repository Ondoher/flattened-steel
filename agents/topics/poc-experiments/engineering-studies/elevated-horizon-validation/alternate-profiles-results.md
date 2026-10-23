# Published Alternate Profile Results

State: execution in progress on 2026-10-23. M1 is complete; the 5 m and 10 km
radiance screen is running. Production and its default profile are unchanged.
The [plan](alternate-profiles-plan.md) owns the sequence and gates; the earlier
[Bruneton baseline result](results.md) remains unchanged.

## M1 - Acquired and qualified data

The initial Node HTTPS connections failed for both OPAC and the optical library.
Run 00022 preserves those errors. A subsequent authoritative Zenodo API route
with Python system HTTPS succeeded, as did the official libRadtran optical-library
endpoint through that transport. No TLS verification was disabled. No repeated
download loop or credential was used. The intermediate direct-directory URL
returned 404 and was skipped. Failures did not stop the remaining work.

[Acquisition manifest](../../../../../tmp/experiments/elevated-horizon-validation/runs/00023-profile-acquire/manifest.json)
retains the original approximately 1 MB OPAC 4.0 ZIP, the 743,391,266-byte official
optical archive, download identities and extracted OPAC tables. Only OPAC entries
were extracted from the combined optical archive. The installed solver data are
read-only. Original OPAC composition and optical data remain available for later
reference; no native program was compiled or executed from the download.

The usable recipes are the published libRadtran OPAC-derived mass-concentration
presets. Their own headers explicitly distinguish them from original OPAC's
number-concentration definitions. They include free-tropospheric and stratospheric
components. This comparison uses those distributed recipes unchanged, not a new
mixture or a claim that they are exact original OPAC profiles.

The direct phase tables, all wavelengths and extinction/SSA entries are retained
exactly when slicing scalar F11 and 50% RH from the official NetCDF data. The
singleton humidity coordinate is an addressing convention, not a claim that the
physical optics represent 0% RH. No HG/CS fit or exponential-density fit replaces
the candidate data. The largest phase integral error of the published compressed
angular tables is about 0.32% across their entire wavelength range; this is retained
as a representation limitation rather than silently renormalized away.

[Property inventory](../../../../../tmp/experiments/elevated-horizon-validation/runs/00024-opac-inventory/inventory.json):

| Profile, 50% RH candidate optics | Aerosol optical depth at 550 nm |
| --- | ---: |
| Production Bruneton | 0.06453 |
| libRadtran continental clean | 0.05326 |
| libRadtran maritime tropical | 0.07581 |
| libRadtran maritime clean | 0.13709 |

Continental clean has about 17% less total aerosol optical depth; the marine
presets are composition/loading controls, not lower-aerosol replacements at these
settings. The values should not be confused with the original OPAC paper's 80% RH
table. Recipe versions, layer treatment, optical-library version and humidity
matter. The inventory also retains absorption, ground/sky path aerosol optical
depth and its independent integration refinement at 5 m and 10 km.

The fully spherical continental-clean pilot at 10 km succeeded on both sides of
the limb: [run 00025](../../../../../tmp/experiments/elevated-horizon-validation/runs/00025-opac-pilot/manifest.json).
This establishes operational compatibility, not final photometric precision.
Current authored-source type checking passes.

Disposition: advance all three documented presets to the bounded radiance screen,
with their lower-loading/control roles explicit. No atmosphere is selected for
production. The owner's added 5 m requirement is part of the initial screen.

## M2 - Horizon screen

In progress. The shared molecular atmosphere, native-bin solar source, black
boundary, spherical geometry and display remain fixed. Candidate spectral optics
vary with wavelength; two-point Gaussian sampling within every source bin is
followed by targeted four-point/layer refinement for promising cases. Luminance
and colors integrate reconstructed radiance against the original CIE table.

## M3 - Other elevations and solar-neighborhood controls

Not yet selected; advancement follows the measured screen and the plan's gates.

## M4 - Scene compatibility and recommendation

Pending. Published layered profiles/full phase functions must be represented
faithfully before a render is called a production-algorithm comparison.
