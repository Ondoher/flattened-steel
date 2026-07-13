# P0 Freeze Verification v1

Status: accepted P0 verification. Checked 2026-07-25 without invoking
DirectJ2, constructing a cache, or executing physical calculations.

| Input | SHA-256 |
| --- | --- |
| p0-source-boundary-freeze-v1.md | 9a24089e2ae3547f6914cd2c761e6516d2b3f9df7dbce40f48d75003064f561f |
| p0-structured-slice-representation-v1.md | e840856a925660698501eb6abf8766342eae9869c9a50230af078c9129d38fae |
| p0-shell-ladder-freeze-v1.md | d9a1f71a01275791c333c90aeb851ef2ce90f10bee96d09a5b71950cabf3f135 |
| p0-direct-packet-freeze-v1.md | 48cd157d2001c4195913b60d1f194e0d2859e50b62f0374a232a3b80835e1899 |
| p0-monitor-metric-freeze-v1.md | 71101d16e8c211283c20e155a33832be1a8efb480d45165fe48593e1ce7f26df |
| p0-dense-linear-control-freeze-v1.md | 71ed8ed3de0deccc431d0d1a847b89eb864c8972b104c85fdcf2dc2d14eb9d9e |
| p0-holdout-measurement-freeze-v1.md | 5b12046c27b31dec05a8f462d4f96ebf38fb59768091b0ebce2d1809ad6704a5 |
| p0-family-run-policy-v1.md | 3946b90bc43abce4406b3380ed481caa80ccc6eaa2539fcfb83dc85df5aeae3d |

The source, boundary, method, packet, monitor, control, holdout, measurement,
and lifecycle policies are mutually consistent. The P1 entry condition is an
experiment-owned source-closure manifest covering the new implementation,
tests, commands, reused primitives, and all input files above.

