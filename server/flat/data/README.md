# Flat operational stellar data

`brightest-2000-stellar-package-v1/` is Flat's repository-tracked copy of the
exact package used by Flat32. It contains all 2,000 ordered members, Native15
packets and packed float textures, including the existing 1,993/7 supported/proxy
partition. The initial copy was byte-for-byte verified against
`server/flat32/data/brightest-2000-stellar-package-v1/`; Flat does not read that
other application's directory at runtime.

The manifest SHA-256 is
`c0fb3e419ac41c1872890b4b8dcc683f25b36194096e17e41c1cb5618e4b6da7`.
The manifest owns the four artifact hashes; the browser's engine adapter also
pins their production identities. Initial copy verification is retained at
`.codex-tmp/flat-stars/catalog-copy.json`.

The server defaults to this directory. An independent installation can place
the same five files in another ordinary directory and set
`FLAT_STELLAR_CATALOG_ROOT` to its absolute path. The default package is included
in the app's Git checkout; generated client builds do not inline its bytes.
A missing or corrupt package yields an explicit catalog
failure and can be retried after fixing the files.

`human-vision-filter-package-v1/` holds Flat's repository-tracked, byte-identical copy of
Flat32's local-only human presentation data. Its manifest SHA-256 is
`c59eeb0b553ff4e07857cc87e32522e81f501410f027505e268c9e8536980107`.
Its `native15-scotopic-weights.json` artifact SHA-256 is
`85e1d15c93e849550dbe84fdf1df000565eda0f57ac6e10210b5ee200bc91a09`.
The browser checks that artifact and its parent CIE source identity before
enabling Algorithm32's existing mesopic and low-light chroma filters.
Set `FLAT_HUMAN_VISION_ROOT` to use these two files from another ordinary
directory. The exact-copy verification is retained at
`.codex-tmp/flat-human-vision/package-copy.json`. Both operational packages
must be present for a complete stellar scene; neither is copied into public
client build assets.

The owner selected Git tracking of these seven Flat-owned files on 2026-11-09
so new checkouts include the operational packages. Asset bytes, manifests and
their recorded provenance/redistribution status are unchanged. The
[source package](../../flat32/data/README.md) retains its historical status;
[T13](../../../agents/topics/production-app/mvp/requirements.md#t13) still owns
the unresolved source/redistribution work. Repository inclusion does not claim
that clearance has been established.
