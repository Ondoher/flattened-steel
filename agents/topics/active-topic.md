# Active Topic

Current active topic: sky-accuracy-dials, completed H56 B1 regression diagnosis.
Focus: explain the paper regression while preserving independently justified Toronto corrections.

Canonical entry: [Sky Accuracy Dials](poc-experiments/engineering-studies/sky-accuracy-dials/README.md).

## Immediate Focus

Completed [H56 diagnosis](poc-experiments/engineering-studies/sky-accuracy-dials/paper-b1-diagnosis-results.md) owns accepted runs 00348-00351. The fixed paper factorial scores baseline40=11.622914, transport60=11.639938, normalized40=11.643406, joint=11.668482. Both numerical effects contribute; score interaction adds 17.77% of net SSE increase. Normalization's second-order change helps the final fit, while its third/fourth-order changes outweigh it. Cumulative reconstruction/rounding is negligible. The 12.1-degree scored ring carries 95.70% of the net penalty; Toronto's 0.05-degree witness is outside the scored B1 grid. Retained published-model agreement and its qualification limits remain distinct from paper RMSE and independent component accuracy.

Both new Direct40 captures and final ledgers/plots verify. Local types, J1/N1 invariance, all score/reference/order identities, image inspection and resource cleanup pass. No numerical jobs remain. The underlying pre-existing radiance deficit and a converged corrected scattering tail remain unisolated; no automatic follow-on campaign is selected. Production and prior evidence are unchanged. The experiment remains open with 592 MiB retained evidence, 1 GiB scratch and 40 GiB free-disk limits. Dedicated experiment reviewers/audits remain disabled; checkpoint advice remains active.

## Minimal Reload Sources

1. [Repository instructions](../../AGENTS.md).
2. [Experiment entry](poc-experiments/engineering-studies/sky-accuracy-dials/README.md).
3. [H56 diagnosis results](poc-experiments/engineering-studies/sky-accuracy-dials/paper-b1-diagnosis-results.md).
