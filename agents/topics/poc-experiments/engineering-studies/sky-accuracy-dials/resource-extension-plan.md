# Prospective Allocation For Angular Qualification

This bounded `compensation-attribution-v1` amendment supports continued
scientific attribution under the owner's authorization to adjust the plan.
It does not change production code or reopen any historical record.

After `00210`, C5 retains 107,588,604 bytes of its 109,051,904-byte allowance.
Its remaining 1,463,300 bytes cannot admit the next reference job. Existing
C3 and C6 allocations retain unused capacity. Transfer that capacity explicitly
before starting further C5 execution:

| Phase | Existing allocation | New allocation |  Change |
| ----- | ------------------: | -------------: | ------: |
| C3    |              40 MiB |         28 MiB | -12 MiB |
| C5    |             104 MiB |        124 MiB | +20 MiB |
| C6    |              20 MiB |         12 MiB |  -8 MiB |

Every other phase cap and every construction/full-capture slot is unchanged.
Preserve the 256 MiB new-evidence limit, 512 MiB total retained limit, 1 GiB
scratch limit, 40 GiB free-space floor, 8 CPU-job hours, 18 GPU-job hours and
all existing failure reserves. The sum of phase bytes is unchanged. No file
is deleted, and no additional GPU construction is planned.

Derive actual phase usage from authenticated immutable seals, including failed
records. Before accepting the transfer, prove that each reduced cap covers
all already retained evidence and that C6 also covers the amendment record.
Charge the amendment to C6 under its existing pre-transfer admission. Cap
this record at 2 MiB and five CPU-job minutes with a 30-second finalization
reserve; keep a source snapshot and focused allocation proof. Preserve at
least 3 MiB of unspent C6 capacity after this record for reporting.

The existing C0/C2-to-C3 amendment remains unchanged. A new, distinct extension
schema consumes its exact seal and the unchanged original C0. Future jobs
must explicitly retain the new extension seal, whose derivation includes the
earlier amendment. The ledger must reject duplicate, reordered, unparented,
nonconserving, overspent or resource-cap-changing extensions. The original
amendment verifier and all historical evidence remain unchanged.

Implementation is confined to a new `continuation/resource-extension/`
module, its necessary ledger dispatch and resource-counter type. This shares
the deferred attribution baseline `871690d334b4339f7aaee516dcc140dd00a3edaf`.
Run focused manufactured accounting checks and the complete POC type check.
Formal review remains deferred under the owner's scheduling instruction.

This amendment provides resource admission only. Each subsequent atmospheric
sampling test still needs a concrete scientific prediction, independently
checked reference, measured cost forecast and stopping conditions. It does
not qualify a dial, expand the physical domain, loosen accuracy tolerances or
authorize an unbounded sweep.
