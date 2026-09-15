# J2 Ground-boundary Diagnostic Compiler

Prepared for the prospective [ground-boundary registration](../../../../agents/topics/poc-experiments/engineering-studies/sky-accuracy-dials/ground-boundary-plan.md).
This compiler evaluates raw N1–N4 at H P48 or P55, channels 0/8, with one extra
unmodified J2 shadow scatter. It changes no stored L1 value or later-order
ground convention. The runner owns authentication, budgets, historical sparse
parity and physical/view assessment.

`compileGroundBoundary(request)` accepts the original `SkySixCompileRequest`
plus `groundProbeCoordinates`: one through 128 unique ground-row addresses.
Provide the exact same original sparse union for J1, J2-shadow and J2–J4.
Callbacks occur in order J1, L1, J2-shadow, J2, L2, J3, L3, J4; transport
callbacks contain no values. The new report schema is
`sky-ground-boundary-wavelength-result-v1`; do not pass it through a host that
has not explicitly admitted this protocol.

The corrected fragment is derived through two exact, unique source anchors.
Only J2 at position index zero substitutes B0 for incoming local z < 0.
B0 is original spectral source irradiance times source transmittance, surface
cosine and ground albedo divided by pi. It is never added as a view endpoint
or written into L1. All other scatter/transport fragments remain original.

The driver hashes every non-ground J2 value in original row order, in 180
bounded solar-block chunks. Its aggregate digest identifies an ordered chunk
manifest, not the concatenated raw-field byte stream. The shadow is captured
and released before corrected J2 allocation, preserving the original J+2L
scalar peak. Digests, dimensions and selected ground values are retained;
full texture values are transient. The reusable readback buffer is below
1 MiB for these controls, with a separate bounded Web Crypto input copy.

L1 preservation is a structural texture-identity proof: one creation, the same
live object borrowed by both scatters, no output/input aliasing, no intervening
uploads or draws targeting L1. The actual ledger records every allocation,
pass, readback/hash and release. This does not claim a nonexistent historical
full-field L1 hash. Historical J1/shadow J2 comparisons belong to the runner
and cover only the exact authenticated original sparse union.

Ground observations include original/corrected raw values, exact packed
outgoing directions, packed I512 directions/weights and original shader
parameters. They support a separate CPU Rayleigh half-space and Mie-sum check;
the compiler leaves that numerical gate explicitly pending. No separate
species shader is executed and no corrected value is labeled reference truth.

Run the local source/hash-coverage/memory/half-space proof after source writes
are released:

```powershell
& 'C:/Users/gande/AppData/Roaming/nvm/v25.4.0/node.exe' 'experiments/sky-accuracy-dials/continuation/ground-boundary/proof.mjs'
```

The proof performs no GPU or physical radiation evaluation and creates no
immutable run. Actual shader numerical checks, historical parity, view envelopes,
adequate physical P2 comparison and formal source review remain separate gates.
