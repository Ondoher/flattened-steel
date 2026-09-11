# Pinned B1 Reference Inputs

The official B1 runner reads `kider-spectra.json.gz` beside the existing Kider
acquisition at
`references/downloads/kider-clear-sky-framework-2014/radiance-2013-05-27-bruneton-subset/`.
The file contains a gzip-compressed JSON map from the original relative filename
to base64-encoded original bytes. It includes exactly the 1,377
`*.asd.rad.txt` spectra selected by the published comparison. No measurement
bytes, wavelength values, or filenames were changed. The manifest in this
directory authenticates the container; the benchmark also checks the
established raw-acquisition and processed-grid fingerprints.

[Kider provenance](KIDER-PROVENANCE.md) retains source revisions, archive hashes,
the Apache-2.0 attribution for the 15 primary-repository captures, and the
separate acquisition status of 13:00 and 13:15. [The original license](KIDER-LICENSE)
is included without extending its scope to those two exceptions.

`figure5/` contains the 27 original published comparison panels. Their
[attribution](figure5/ATTRIBUTION.md) retains the paper identity, extraction
procedure, and source-PDF hash. Each panel is authenticated by the independent
Figure 5 loader. These scholarly comparison excerpts are not relicensed as
project-owned artwork.

The bundle was derived by sorting the existing acquired capture directories
and filenames, selecting `*.asd.rad.txt`, encoding each file with
`Buffer.toString('base64')`, serializing the map with `JSON.stringify`, and
applying Node `gzipSync` at level 9. The source acquisition remains untouched.
The raw and processed benchmark identities, rather than a gzip implementation's
encoding choices, own measurement compatibility.
