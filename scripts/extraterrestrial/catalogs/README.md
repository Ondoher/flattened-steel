# Bright Star Catalog V/50 source input

`bright-star-catalog-v50.tsv` is a checked-in source input obtained from the
CDS/VizieR **Bright Star Catalogue, 5th Revised Edition** (`V/50/catalog`) on
2026-07-31. It contains the VizieR TSV projection of all 9,110 records with
`HR`, `Name`, J2000 RA/Dec, `Vmag`, its provenance/uncertainty flags, `B-V`,
and spectral type.

- Source: <https://cdsarc.cds.unistra.fr/viz-bin/ReadMe/V/50?format=html&tex=true>
- Query: `https://vizier.cds.unistra.fr/viz-bin/asu-tsv?-source=V/50/catalog&-out=HR,Name,RAJ2000,DEJ2000,Vmag,n_Vmag,u_Vmag,B-V,SpType&-out.max=10000`
- SHA-256: `d79223194f938533b4a4b7d832249d8661cf7adda088a8a0ec44039d3baab759`

`bright-star-catalog-v50.js` parses this source and chooses exactly 500 valid
J2000-positioned entries by ascending visual magnitude, then HR number. The
resulting `latitudeRadians` is declination and `longitudeRadians` is right
ascension mapped into `[-pi, pi)`. It follows `celestial-rh-v1` directly.

`Vmag` produces only a relative V-band flux ranking. It is not a physical
native-15 source spectrum and is not passed to atmospheric transport until a
separate spectral-photometry policy supplies such packets.

## Stellar spectral-photometry inputs

- `pickles-v1998/dat.tar.gz`: public Pickles (1998) normalized stellar-template
  archive; SHA-256 `d25a74fe853d4b343c56fc936b18ebaf640b4946f5776f0797b66a44890a6130`.
- `svo-johnson/generic-johnson-b.xml`: SVO `Generic/Johnson.B`; SHA-256
  `887af6b6164fd2e41c5b17d450286819a4758b83e7a6b89bfe9bad73a28ee197`.
- `svo-johnson/generic-johnson-v.xml`: SVO `Generic/Johnson.V`; SHA-256
  `bbbbef8da2f3d074f2ab12307f6c85320d12e1a3306a27086c4564c227abacc6`.

The candidate packet builder uses a Pickles template only for spectral shape,
then normalizes its native-15 representation through the SVO Johnson-V
response and Vega zero point to each BSC apparent V magnitude. This input path
has no stellar luminosity or inverse-square reconstruction.
