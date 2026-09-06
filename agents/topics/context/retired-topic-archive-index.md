# Retired Topic Archive Index

Status: owner-directed local archival of retired topic material. This index
records source identities and restoration paths; it is not an active work topic.

## Archive Set

- ZIP: [retired-topics.zip](../../../archives/topics/retired-20260906/retired-topics.zip).
- ZIP SHA-256: `19c3a2477941f8310ccccd7a15705a5e78c4521124647bd10839eaecd41b0e60`.
- Contents: 89 files, 4,216,731 uncompressed bytes; 66 protected historical
  documents, metadata files, and pointers, plus 23 retired reference stubs.
- Readable root: `archives/topics/retired-20260906/`.
- Local manifest: [manifest.json](../../../archives/topics/retired-20260906/manifest.json).
- Removed topic roots: `algorithm32/`, `extraterrestrial/`,
  `initialization/`, `references/`, and `testing/`. The last three were empty.
- Every ZIP entry was fully read and checked against source length and SHA-256
  before relocation. Readable entries are verified against the same inventory.
- Existing archives, sealed experiment sources, and generated runs are not
  rewritten. The new ZIP is immutable; never replace or modify it.

Archives live only below repository-root `archives/`, remain local and
Git-ignored, and are excluded from the current tracked tree. Previously committed
versions remain available in Git history; no history rewrite is performed.
Carry local archives separately when transferring this workspace.

## Restoration And Historical References

For every source path below, the ZIP entry uses that exact repository-relative
path. Its readable copy is `archives/topics/retired-20260906/<source path>`.
Restore to `<separate restore workspace>/<source path>`, not over current
documents. Verify hashes before using restored evidence.

The 23 former reference stubs are retired too; no compatibility topic directory
is retained. Immutable experiment controls, historical runners, source inventories,
and archived relative links can still name the former paths. Those names are
historical identities, not live context dependencies. Resolve them through this
index and the [original-document archive](topic-migration-archive-index.md).
Reproducing a historical workflow that requires original paths requires a
separate restored workspace; do not rewrite frozen records to make them current.

For a full pre-migration document behind a retired stub, use the original-topic
ZIP or its readable copies recorded by the migration index. The new ZIP preserves
the final stub bytes as well as existing historical material.

Current work starts at the [five-topic index](../README.md). The
[file ledger](topic-file-disposition.md) records current successor ownership;
archival does not complete or reactivate any open scientific or product gate.

## Entry Identities

| Source path / ZIP entry / restoration path | Bytes | SHA-256 |
| --- | ---: | --- |
| `agents/topics/algorithm32/archive/algorithm32-star/README.md` | 814 | `a2c6af3a7b8fa010930f7150250258804f7e6e748fa639e7c4a606f0f1296f01` |
| `agents/topics/algorithm32/archive/algorithm32-star/cache/local-sun-cache-design.md` | 53633 | `8a25c1e419d78ec8a24ebb1bcaaa3f727dce24aeb1adabe02cb40ac9db380b5c` |
| `agents/topics/algorithm32/archive/algorithm32-star/experiments/flat-world-atmosphere-boundary-decision.md` | 9360 | `723919abd6dd43c5ea6a1bec498b4a8be3a117824b7a42fef524dccf3045a5c6` |
| `agents/topics/algorithm32/archive/algorithm32-star/experiments/local-sun-shell-cache-experiment-plan.md` | 64510 | `441c6463615bff96a54e39c21cc75fdd5e71cf848b808a3a79070592a5d1088a` |
| `agents/topics/algorithm32/archive/algorithm32-star/experiments/local-sun-shell-cache-phase2-status.md` | 44137 | `d6ccafc9bb3432be103b77214cc586bff487c6516058537db209710876a6da30` |
| `agents/topics/algorithm32/archive/algorithm32-star/experiments/star-flat-local-cache-plan.md` | 43711 | `5f6a7cffe6c8bc0e0ef3c7c8b08325587eccf0b4e220d5c8079ad0a6cbf3905f` |
| `agents/topics/algorithm32/archive/algorithm32-star/experiments/local-sun-shell-cache-inputs/base-fact-family-v1.json` | 26150 | `72cf2dd8cc9cf0b9c6388331202c0d4c354eb6c77feb4b0743e3557703bb3160` |
| `agents/topics/algorithm32/archive/algorithm32-star/experiments/local-sun-shell-cache-inputs/base-fact-family-v1.json.sha256` | 91 | `136f552b04b436cc0d1adc4ffae55c78e6c88171447cd7ebc6320a314afea095` |
| `agents/topics/algorithm32/archive/algorithm32-star/experiments/local-sun-shell-cache-inputs/local-sun-shell-cache-implementation-v1.json` | 6679 | `367aed89db4f734415463ee0f4d177e46b8553b09d815fcd40b35f2006cdd33a` |
| `agents/topics/algorithm32/archive/algorithm32-star/experiments/local-sun-shell-cache-inputs/local-sun-shell-cache-implementation-v1.json.sha256` | 111 | `d19d1ee2251600ae291b3d88b30e52e0b8c3f4beb9080c43a64f82d617c1e17a` |
| `agents/topics/algorithm32/archive/algorithm32-star/experiments/local-sun-shell-cache-inputs/local-sun-shell-cache-physical-implementation-v2.json` | 5522 | `5d2ec18f3b45716267011d2f272461c5833ed1ca354736e1788a1244fb3c8fe2` |
| `agents/topics/algorithm32/archive/algorithm32-star/experiments/local-sun-shell-cache-inputs/local-sun-shell-cache-physical-implementation-v2.json.sha256` | 120 | `1b6a5556cc74f71301c7f36a5bd8555ffde7ec61cee6d91da5196eb2aade1dbc` |
| `agents/topics/algorithm32/archive/algorithm32-star/experiments/local-sun-shell-cache-inputs/p0-dense-linear-control-freeze-v1.md` | 1025 | `71ed8ed3de0deccc431d0d1a847b89eb864c8972b104c85fdcf2dc2d14eb9d9e` |
| `agents/topics/algorithm32/archive/algorithm32-star/experiments/local-sun-shell-cache-inputs/p0-direct-packet-freeze-v1.md` | 2678 | `48cd157d2001c4195913b60d1f194e0d2859e50b62f0374a232a3b80835e1899` |
| `agents/topics/algorithm32/archive/algorithm32-star/experiments/local-sun-shell-cache-inputs/p0-family-run-policy-v1.md` | 894 | `3946b90bc43abce4406b3380ed481caa80ccc6eaa2539fcfb83dc85df5aeae3d` |
| `agents/topics/algorithm32/archive/algorithm32-star/experiments/local-sun-shell-cache-inputs/p0-freeze-verification-v1.md` | 1327 | `c7be2e867a28470608b3e0f7aff0e70800beb7d2d01f873526ae352a8e747810` |
| `agents/topics/algorithm32/archive/algorithm32-star/experiments/local-sun-shell-cache-inputs/p0-holdout-measurement-freeze-v1.md` | 2018 | `5b12046c27b31dec05a8f462d4f96ebf38fb59768091b0ebce2d1809ad6704a5` |
| `agents/topics/algorithm32/archive/algorithm32-star/experiments/local-sun-shell-cache-inputs/p0-monitor-metric-freeze-v1.md` | 2686 | `71101d16e8c211283c20e155a33832be1a8efb480d45165fe48593e1ce7f26df` |
| `agents/topics/algorithm32/archive/algorithm32-star/experiments/local-sun-shell-cache-inputs/p0-shell-ladder-freeze-v1.md` | 1705 | `d9a1f71a01275791c333c90aeb851ef2ce90f10bee96d09a5b71950cabf3f135` |
| `agents/topics/algorithm32/archive/algorithm32-star/experiments/local-sun-shell-cache-inputs/p0-source-boundary-freeze-v1.md` | 2808 | `9a24089e2ae3547f6914cd2c761e6516d2b3f9df7dbce40f48d75003064f561f` |
| `agents/topics/algorithm32/archive/algorithm32-star/experiments/local-sun-shell-cache-inputs/p0-structured-slice-representation-v1.md` | 2574 | `e840856a925660698501eb6abf8766342eae9869c9a50230af078c9129d38fae` |
| `agents/topics/algorithm32/archive/algorithm32-star/experiments/local-sun-shell-cache-inputs/p1-representation-source-closure-v1.md` | 1438 | `ef4d380666bbab7803cb6a53209ed0c4914bce98b57d4b4d3f78cc66000c1f95` |
| `agents/topics/algorithm32/archive/algorithm32-star/production/star-parity-data-set.md` | 43353 | `a19e16a4dc953e081fe73152f8118898199b00f8accb16ae4f35addf82aca5a9` |
| `agents/topics/algorithm32/archive/feature-implementation-reorganization-2026-08-06/implementation-feature-contracts.md` | 34304 | `62d038758d6846829ee1f76d5f3d1c42673c435ed4d54ddb31aff67b3b754673` |
| `agents/topics/algorithm32/archive/feature-implementation-reorganization-2026-08-06/implementation-feature-inventory.md` | 438076 | `aab1b3574c874a391cb4933bae78eb9d99f9f51ee9608b6e21d8e14bc21ac086` |
| `agents/topics/algorithm32/archive/feature-implementation-reorganization-2026-08-06/implementation-feature-reorganization-plan.md` | 39779 | `80ed9ccc644dca5cdb661ea102644d309471e0f84a7ef6af4a44df4173130a21` |
| `agents/topics/algorithm32/archive/feature-implementation-reorganization-2026-08-06/implementation-feature-target-map.md` | 116986 | `ab0f13d1ece8179f49f4fa85e751ad05b2dee03b4bc01c460aa45f34f5b0af38` |
| `agents/topics/algorithm32/archive/feature-implementation-reorganization-2026-08-06/implementation-feature-transaction-plan.md` | 140789 | `e17cd9587bc37c8120207ed72cb78a653b4511242646e3fcf1995a65c7d8ecc8` |
| `agents/topics/algorithm32/archive/reconciliation-2026-08-04/README.md` | 1732 | `22d504c402e3d082e628a5385d9f8319ddc1f4d413bc1d68a3488fce23028187` |
| `agents/topics/algorithm32/archive/reconciliation-2026-08-04/algorithm32/descriptor-reconciliation-analysis.md` | 9847 | `4f4f74117f6349bad93975faf85275290bb3badda9fc8d1622437b0c899252eb` |
| `agents/topics/algorithm32/archive/reconciliation-2026-08-04/algorithm32/documentation-inventory-declarations.md` | 533438 | `8b44f96a8b45185c87ba90aad9eb22dfb20c3fe81dfc261b10c2a2b8a4080360` |
| `agents/topics/algorithm32/archive/reconciliation-2026-08-04/algorithm32/documentation-inventory-production.md` | 398433 | `4a83f8f27d8d8d2f71f6f9d6c990b01f4c40a2fd4730e13b32224599642f5cbd` |
| `agents/topics/algorithm32/archive/reconciliation-2026-08-04/algorithm32/documentation-inventory-test-browser.md` | 309255 | `7d0891bebcf4c959a47e10c29535c04d78f8f51564eedaf2ef2eaafc1c48c94b` |
| `agents/topics/algorithm32/archive/reconciliation-2026-08-04/algorithm32/documentation-inventory.md` | 5772 | `7d10f97016a5c1ef1392629cb82f2594741e2299b17608c0ee183dc93af3b001` |
| `agents/topics/algorithm32/archive/reconciliation-2026-08-04/algorithm32/helper-ownership-classification-foundation.md` | 55067 | `a4fe28d6113d8b93c681c289928c8ebd70b0af93846671b410ab7b7d0daed1a3` |
| `agents/topics/algorithm32/archive/reconciliation-2026-08-04/algorithm32/helper-ownership-classification-physical.md` | 122172 | `c5931e0e411baf18aebdb9fc8bd5d5f1eb2745998f0d98c987a2218c68f2335e` |
| `agents/topics/algorithm32/archive/reconciliation-2026-08-04/algorithm32/helper-ownership-classification-runtime.md` | 61663 | `f8a2434be029abb65efdfd6ad6dd71f62b7fca6ae9cea718fac19975bfcfe262` |
| `agents/topics/algorithm32/archive/reconciliation-2026-08-04/algorithm32/helper-ownership-classification-support.md` | 5537 | `65f211ea631b0a261161b05b17838bff97e3afb84aa7f453a91ff5d71c5cd50a` |
| `agents/topics/algorithm32/archive/reconciliation-2026-08-04/algorithm32/helper-ownership-classification.md` | 8688 | `6401a01c608077cf267379f9bc177fe3e7b7802dcb7e9064db06887997ca7a46` |
| `agents/topics/algorithm32/archive/reconciliation-2026-08-04/algorithm32/helper-ownership-inventory-foundation.md` | 77514 | `70f0c4215ba730f6f2bb28ccae2d59f08dba4a3a40b5ca1d4f3adf0e5b996947` |
| `agents/topics/algorithm32/archive/reconciliation-2026-08-04/algorithm32/helper-ownership-inventory-physical.md` | 113076 | `658ab3cb2af44fb4cff96c1f186bf9131c2a9be9631d6da3d8beeb2202e1223b` |
| `agents/topics/algorithm32/archive/reconciliation-2026-08-04/algorithm32/helper-ownership-inventory-runtime.md` | 58898 | `8c7f89a733c6c2789dec9320ce1598ad7cb85e1bd595d48ba1e8801bc73c1212` |
| `agents/topics/algorithm32/archive/reconciliation-2026-08-04/algorithm32/helper-ownership-inventory.md` | 36986 | `5d09fe5ca3b8b7bf2ba1e98b71512042b9dc7c1429d6e7086c1b979622f20fd4` |
| `agents/topics/algorithm32/archive/reconciliation-2026-08-04/algorithm32/helper-ownership-target-plan-foundation.md` | 64542 | `ce5b8e18cb8353f2adb2f72d607d46851c6c89f08b89a28113db33f9169c0096` |
| `agents/topics/algorithm32/archive/reconciliation-2026-08-04/algorithm32/helper-ownership-target-plan-physical.md` | 120173 | `d6c6ca713a8d039493baab5e2c873aaf79edae8514353206a63c10d1c924f42f` |
| `agents/topics/algorithm32/archive/reconciliation-2026-08-04/algorithm32/helper-ownership-target-plan-runtime.md` | 143915 | `52323ef08ee34bde1a9cba6b344db8e6142ae347d4c6f994d7a8442d7ca926af` |
| `agents/topics/algorithm32/archive/reconciliation-2026-08-04/algorithm32/helper-ownership-target-plan-support.md` | 19663 | `cf77d65da5aa79a0555aa902e7a186fb579bfa71af954b8de406426dbd1dc6bf` |
| `agents/topics/algorithm32/archive/reconciliation-2026-08-04/algorithm32/helper-ownership-target-plan.md` | 19896 | `e939e4e897a2e171ded44a93a25eedd07cca9719f8e96aecd36d4fecf9a1d7f4` |
| `agents/topics/algorithm32/archive/reconciliation-2026-08-04/algorithm32/reconciliation-inventory.md` | 34272 | `45e39ae9246e3d541139c20c57b0e33ab33163c8cd50e701d67ba787c2e68178` |
| `agents/topics/algorithm32/archive/reconciliation-2026-08-04/algorithm32/reconciliation-plan.md` | 98953 | `a8d6e327de1467f3c268b8b56d4f379b1fc4fa4aa290055971f13a866203d807` |
| `agents/topics/algorithm32/archive/reconciliation-2026-08-04/algorithm32/short-variable-migration-map-8.2.md` | 19102 | `e5ef3563ff4effd30f569474e5b79dee8bb07053a412a2d69f7ceeb730e63a1d` |
| `agents/topics/algorithm32/archive/reconciliation-2026-08-04/algorithm32/short-variable-migration-map-8.3.md` | 36002 | `2f870d384f9ae306326e4a48b09ff913a56e3f50c30d02d22b03707595adeda9` |
| `agents/topics/algorithm32/archive/reconciliation-2026-08-04/algorithm32/short-variable-migration-map-8.4.md` | 37390 | `7d9e15d7a6b4ef6dd07a16c4de27d43ec26c019159ae665450c94577502ad8ea` |
| `agents/topics/algorithm32/archive/reconciliation-2026-08-04/algorithm32/short-variable-migration-map.md` | 6289 | `7b628fc64d191bfb666a2004f2015cfc7ff607a69a91c5fda2ef0012eeeb0ae5` |
| `agents/topics/algorithm32/archive/reconciliation-2026-08-04/algorithm32/source-organization-plan.md` | 129092 | `7e0fb8aab5a92293fdb44d5ade48fd454cba27ac26df68da2171e4ed818fb9f9` |
| `agents/topics/algorithm32/archive/reconciliation-2026-08-04/algorithm32/unit-bearing-name-inventory.md` | 7836 | `0131e594aba672a25b7d06ef12c57f9939646290372cecfc46bf2c120b5b50a0` |
| `agents/topics/algorithm32/archive/reconciliation-2026-08-04/algorithm32/validation-inventory.md` | 16354 | `e046daeeccde39ba8ec7951cf0f9a192b668a3c27374dd9cdf464f5f232d5360` |
| `agents/topics/algorithm32/archive/reconciliation-2026-08-04/algorithm32/validation-reconciliation-analysis.md` | 20088 | `8cf4f4630baf7a2956e34d0f4a6cc4fa6a502633f281ca166283e8cf53624841` |
| `agents/topics/algorithm32/archive/reconciliation-2026-08-04/extraterrestrial/reconciliation.md` | 108595 | `04f4a55a8e454522540daae89e787c7dfccd12f95ecfd554ec44fb8c79cdc266` |
| `agents/topics/algorithm32/cache/cache-contract.md` | 3305 | `a9423c2e3260a862bdaef8ed266157eb59a44c339b7a753f9ad220458761d024` |
| `agents/topics/algorithm32/cache/distant-sun-solar-zenith-cache-plan.md` | 7296 | `de75885edf45d2be828e1b98482c8fca05d49f7b22b53d2786326dd4dd9c9611` |
| `agents/topics/algorithm32/cache/local-sun-cache-design.md` | 345 | `03bee0b63b7eb1007d6fc6d5c49191d70f87c7ac5ed40c5c96a5463e587a779f` |
| `agents/topics/algorithm32/cache/solar-zenith-cache-design.md` | 5076 | `3601f188bbfa4143aeb4693bc6f8b5903c5ad18f1bdc053b952189a9321a689f` |
| `agents/topics/algorithm32/cache/solar-zenith-cache-poc-plan.md` | 6462 | `a4a11c74a541008e8221da7b17fed6087b226d7fd6a76a51c74089158d97576d` |
| `agents/topics/algorithm32/experiments/flat-world-atmosphere-boundary-decision.md` | 359 | `d8ba7a40bd1be9e7bbe4a61f46cbd34153f11e21a8f3de0d5cc14e98713a7155` |
| `agents/topics/algorithm32/experiments/local-sun-shell-cache-experiment-plan.md` | 341 | `6301673aae518cb71b0e88529102546cb57559b7e94fe05312c6dc308106f6f8` |
| `agents/topics/algorithm32/experiments/local-sun-shell-cache-phase2-status.md` | 352 | `7c34d65d39cad0f44132336482a9ff46c71640ce06c2ced3d04d349910d326c3` |
| `agents/topics/algorithm32/experiments/star-flat-local-cache-plan.md` | 324 | `b36b466c398b5deeeebad811fbf53887a6297c6ab964f1b854778e89c4bff4d6` |
| `agents/topics/algorithm32/experiments/archive/local-sun-shell-cache-experiment-plan-sparse-topology-v1.md` | 291718 | `9bab1d4f3ea49e8c8b344d3bb75058894d02cd183da78b604456b64be461eda3` |
| `agents/topics/algorithm32/production/README.md` | 1073 | `b05aa8df45b7469234c795d33683267b788e3ce0d57f59505896ad5c03e29474` |
| `agents/topics/algorithm32/production/star-parity-data-set.md` | 370 | `02330c01133bf54ea4810f035571ac911acb6b1501430a797ec4ae05da8ca3f1` |
| `agents/topics/extraterrestrial/camera-control-test-inventory.md` | 5215 | `bbcd713763e3cb198bd38e0e1f257c70ccfd6a4280ff3d961c2e90b9e4716f5b` |
| `agents/topics/extraterrestrial/camera-controls-development-plan.md` | 4698 | `7d652fe312c338845d3a1e1ad92b7436e2bc3d15f01d826a97e821d492b04ef2` |
| `agents/topics/extraterrestrial/camera-controls-testing-plan.md` | 8566 | `c0d238adda0e2c2118b6bc07b96c965928d4fc95d3862710102236ce5ac4bcc9` |
| `agents/topics/extraterrestrial/camera-spectral-color-prior-art-research.md` | 6203 | `395db87bc1970fbdd9eb49d03495a1c441da405fe19ca5d7633011f9d1b20fb1` |
| `agents/topics/extraterrestrial/celestial-contribution-cache-design.md` | 13087 | `93396c7e21c83a7dfdeeb622b0f28ba1479278d40c595179a83752fcee1a3725` |
| `agents/topics/extraterrestrial/color-reset-design.md` | 9059 | `d62c96d16db96d6477b5d6c96e5ba3cae8ad3503d06c67860c909baa701d2b50` |
| `agents/topics/extraterrestrial/color-reset-experiment-plan.md` | 10850 | `6585ab57ec9a7502a8eb2c0e45c0d80b31b4c961c021ac75353c7a897e5c58db` |
| `agents/topics/extraterrestrial/normal-color-stage2b-reference-research.md` | 4756 | `bc74c347e7d9e3be12d6227003628e7546bf58300f37e8c249d8c107172ec65c` |
| `agents/topics/extraterrestrial/normal-mode-test-plan.md` | 6825 | `7ae25f277e3ca08bb3a459c12b105cf4a98d6cf425d11c4b7058b0e5523ff74a` |
| `agents/topics/extraterrestrial/promotion-plan.md` | 7743 | `e687880222e31d95e3971d6df7170bd2d8c8157ad85040e482ca1b0c901e535f` |
| `agents/topics/extraterrestrial/receptor-response-parameter-research.md` | 2134 | `ad81b2e9d0b6206667d016bb8b1b3a4fb9ae8253f5e85f432a918254b83ebd66` |
| `agents/topics/extraterrestrial/spectral-color-transform-experiment-plan.md` | 6501 | `c7223812282110123f8d16cb65408e695189aa11b0aaee86c1d080a113fdc302` |
| `agents/topics/extraterrestrial/stage-12-implementation-topic.md` | 3949 | `0ef7e39aa09acf196cb463f62c5810100d2e2a7e36c5de630287c0720ced542a` |
| `agents/topics/extraterrestrial/stellar-rendering-plan.md` | 6844 | `0c874322d5d634ed1247fadee2f2c5cbf464cab5a8f9abd958a870a1e26da976` |
| `agents/topics/extraterrestrial/stellar-screen-palette-design.md` | 6216 | `8655c76cd464175fbe5c627564eef7358468e312e1861144bb1bbd737be0581e` |
| `agents/topics/extraterrestrial/stellar-screen-palette-production-port-plan.md` | 12018 | `4b8de53c8dfbdb03abfdf50ceff04021558912845ea796d1ad338004755c4899` |
| `agents/topics/extraterrestrial/sun-disk-appearance-design.md` | 6537 | `df6bc1759da0e1e82dd98ad2a57a0caa962d613c7dd7f836aebc03a28632895e` |
| `agents/topics/extraterrestrial/sun-disk-appearance-implementation-plan.md` | 10991 | `4ddbc8469c58753e0ae929b45f68d7cc0c445cdc2ed4c93b3f2fdacaca83f2a9` |
