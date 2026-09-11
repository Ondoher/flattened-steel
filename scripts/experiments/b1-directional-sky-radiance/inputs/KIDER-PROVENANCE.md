# Kider 2013-05-27 radiance subset provenance

The Kider acquisition under
`references/downloads/kider-clear-sky-framework-2014/radiance-2013-05-27-bruneton-subset/`
contains the 17 directional-sky-radiance captures selected by Bruneton's
published clear-sky comparison: 09:30 through 13:30 local time at 15-minute
intervals. Each capture contributes exactly 81 `*.asd.rad.txt` spectra to B1
and B2, for 1,377 benchmark spectra total. Its authenticated packaged copy,
`kider-spectra.json.gz`, is stored beside those source archives.

## Primary source relationship

Kider's primary data repository is
`spectralskylight/sky-measurements-2014`, pinned here at commit
`f915674fc632593b03edd3068d09902924449bd9` (tree
`c5342f7e4c9f5b201ac3795834cf0f1dc2da0e54`). Its radiance subtree
`95eeaaeeeb928dc00b3f89c7bf3a27c8408aa9e8` is unchanged from Kider's
original data-addition commit
`2156c4165e498e72e8eff30fe9e64f7c4f751486`.

The repository README identifies the payload as the data for Kider et al., _A
Framework for the Experimental Comparison of Solar and Skydome Illumination_.
The repository root applies Apache-2.0 to included files; its LICENSE blob is
`261eeb9e9f8b2b4b0d119366dda99c6fd7d35c64`, with SHA-256
`c71d239df91726fc519c6eb72d318ec65820627232b2f796219e87dcf35d0ab4`.
There is no NOTICE or per-file override at the pinned revision.

The primary repository contains 15 of the 17 archives. Each of those 15 is
byte-identical to the corresponding archive acquired through Bruneton's pinned
Wayback URL:

| Local time |     Bytes | SHA-256                                                            |
| ---------- | --------: | ------------------------------------------------------------------ |
| 09:30      | 1,430,916 | `7d14e0e1667a33e956031f1b77eca97938272e7b42c4c15dcdc99aaad53bdd3a` |
| 09:45      | 1,428,479 | `e950564cd015a48beedc08438ea7322aad3ce37c55f5f2c62373fd0c8962f510` |
| 10:00      | 1,429,046 | `67f6795db4aeb47929ae4f681efbf9ca041733581a153c1f73bfe9a1e03040c8` |
| 10:15      | 1,429,134 | `f05f4800981157af91aa9a7f285353a09516e726803bb0297c955bb35a759d27` |
| 10:30      | 2,252,768 | `d91ab7c575984fba2c571dacfd891f857c8e57b6a62f2828165b09fac6ece894` |
| 10:45      | 1,427,143 | `ba1c87ca833ce7308f1b32c5174c29efa0b61e3fe08daae4d226604424aafba8` |
| 11:00      | 1,428,814 | `4045cb93fd1d6595ba8de720f54669b73e456b936b89c51ca2be1a261a628088` |
| 11:15      | 1,429,944 | `b35bab9e28d08695a313915d3a853d221f60ed90b54e19cbd794c03251673337` |
| 11:30      | 1,428,030 | `9fe37d2a262753f24d6cd133db779a7e0f8d6b694a5ec030c447dff37aad1fdb` |
| 11:45      | 1,426,788 | `14a43c74a8a4c33f91030d9726d8ab298055daa9bbe4fd37c02e49bb0513455f` |
| 12:00      | 1,430,017 | `05ccb29ca34a054cf8018c71cd05a3440e74d2f9620c929987a75642a0bcf378` |
| 12:15      | 2,248,130 | `3a9e26a5d366c978dca1f94924679b0e3c0101de553d147ce60c7b8647a97543` |
| 12:30      | 1,428,329 | `627489da4f4941956186f4d3e10f3defbe41408a310f0fe7b312bf5473caa665` |
| 12:45      | 1,430,225 | `8172248a39f87a6f12c137ac1c0d154575aa58706a303b31ab2d0ca0c0ac4539` |
| 13:30      | 1,426,355 | `2869ab8abfc2e85aedda095e10f0db24b901b747e1cd13d9e6dea716c72b4cde` |

## Two archive exception

The primary GitHub repository omits the 13:00 and 13:15 archives at every
data-containing revision. Its README also mislinks the 13:00 row to the 13:30
archive and has no 13:15 row. These two files therefore retain the Cornell
Wayback URL selected by Bruneton's pinned Makefile as their acquisition and
lineage evidence:

| Local time |     Bytes | SHA-256                                                            |
| ---------- | --------: | ------------------------------------------------------------------ |
| 13:00      | 1,427,584 | `79ef37093b35196a03910c22b6b959af9084f15be09e3afa5d10732c73f30b4b` |
| 13:15      | 1,425,055 | `a46a20b79bdbb9b22cb7fd2343c7b5edbde73b4ea6e58d50142d7484fc9d8806` |

Do not extend the GitHub repository's Apache-2.0 assertion to these two absent
files without author clarification.

## Inventory rule

Benchmark inventory and identity calculations select `*.asd.rad.txt`
explicitly. The 10:30 and 12:15 archives each also contain 81 companion raw
`*.asd.txt` files; counting all extracted files would incorrectly report 1,539
benchmark spectra instead of 1,377.

Primary links:

- `https://github.com/spectralskylight/sky-measurements-2014/tree/f915674fc632593b03edd3068d09902924449bd9`
- `https://github.com/ebruneton/clear-sky-models/blob/4df2ec6609bc0127a478bd34fff29c94352579cc/Makefile`
