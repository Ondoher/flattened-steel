# Flat/Local GPU Transport Offload Plan

Focus: Engine conformance and production benchmark export.

Related owners: [caches](../caches/gpu-transport-offload-plan.md), [interaction-prototypes](../../poc-flat32/interaction-prototypes/gpu-transport-offload-plan.md), [execution-profiles](../execution-profiles/gpu-transport-offload-plan.md).

## Resource Reporting

Expected invariant resource facts after cutover:

| Resource                                       |            Expected value |
| ---------------------------------------------- | ------------------------: |
| Local shell facts                              |            `32,776` bytes |
| Local shell boundary texture                   |             `8,196` bytes |
| Flat packed transport data                     |                 `0` bytes |
| Resident final W27/z19/rho15/native-15 J field |        `74,795,400` bytes |
| Peak logical field storage                     |       `224,386,200` bytes |
| Peak packed fact-data storage                  | Recorded diagnostic value |
| Peak tracked storage                           | Recorded diagnostic value |

The zero Flat packed-transport fact is an observed required structural outcome
of this offload. The remaining resource values are default-preset diagnostics.

The old 164,652,480-byte transport payload and approximately
389,675,392-byte tracked peak are baselines to eliminate. Executor
`peakPackedDataStorage` is not required to be zero because it also counts
legitimate small wavelength, position, direction, and source-fact data.
Completion requires that no binding or allocation contains Flat/local
transport sources or coefficients and that every retained plan/source metric
for that payload reports exactly zero bytes.

Record all other cold and warm resource observations for future optimization
without comparing them against a limit.


## Verification Commands

Run focused scopes throughout the transaction, then the complete gates:

```text
npm run typecheck:algorithm32
npm run typecheck:flat32
npm run test:algorithm32
npm run karma
npm run test:algorithm32:three
npm run test:ui:flat32
npm run build
npx prettier --check <changed authored files>
git diff --check
```

Browser capability evidence must use hardware acceleration on a real GPU.
Software-renderer runs establish conformance only and cannot establish the
required GPU capability contract.


## Exit Boundary

This work is complete only when all of the following are true:

- `createBuildPlan()` performs no Flat transport table construction;
- `J2 -> L2` and `J3 -> L3` use the fused GPU contributor;
- shared executor, assembler, backend, atmosphere, and transport code contain
  no local-Sun algorithm-selection branch;
- distant-Sun transport remains behaviorally unchanged;
- the default maximum-quality preset passes its frozen numerical and visual
  authority comparisons;
- production allocates zero CPU or GPU packed Flat transport bytes.
