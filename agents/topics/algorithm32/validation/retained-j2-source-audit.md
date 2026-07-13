# Retained J2 Source Audit

Status: audit and bounded causation proof complete. The retained/current J2
drift is not caused by a continuous-versus-cached final-view algorithm. The
benchmark/world-frame orientation change explains 98.06% of the bounded
value-level RMS, while the same-backend proper-rotation control agrees at RMS
`3.94e-18` and maximum `5.55e-17`.

## Retained Authority

The retained direct-40 J2 table is the promoted output of archived run
`000167-algorithm32-paper-n-order-j2-kider-b1-b2-b3-boundary`. The run and
retained table both record SHA-256
`d996ac3fc150143adb70287482e616a255a11540374d1372af48d11956f204f5`.
It used binary64 CPU construction at 40 view/cache-transport intervals, 20
source-transmittance intervals, 34 ordinary source-oriented Fibonacci incoming
directions, 48 altitude nodes, W27 outgoing storage, cumulative J2, and
view-only linear interpolation over the actual altitude nodes.

The retained sequence was:

```text
L1 = direct-primary radiance on 48 x Fibonacci-34
J1 = direct-primary scattering density on 48 x W27
J2 = phase integral of L1 on 48 x W27, including direct grass reflection
Jthrough2 = J1 + J2
result = integrate reconstructed Jthrough2 along each final view ray
```

The retained evaluator therefore did not evaluate J1 continuously at the
requested final-view direction. Both implementations reconstruct cumulative
`J1 + J2` from W27 during final-view integration.

## Stage Map

| Stage      | Retained run 167                                       | Current production                                | Result                                                 |
| ---------- | ------------------------------------------------------ | ------------------------------------------------- | ------------------------------------------------------ |
| Inputs     | Direct-40 paper profile                                | Benchmark-owned direct-40 profile                 | Same declared profile; some executable literals differ |
| Positions  | 48 nodes, first construction node at 0 m               | Profile-selected; application now defaults to 0 m | Production selects retained 0 m                        |
| Incoming   | Source-oriented ordinary Fibonacci-34, `4*pi/34`       | Same local vectors and weights                    | Physical orientation relative to observer differs      |
| L1         | Direct-primary integration, 40 intervals, binary64     | Same recurrence; GPU stores R32F                  | Precision differs                                      |
| J1         | Direct source/local medium/phase on W27                | Same physical expression on W27                   | Same recurrence                                        |
| J2         | Exact-node L1, 34 weighted directions, grass term, W27 | Same generic recurrence and ground term           | No structural difference found                         |
| Final view | Linear altitude plus W27 reconstruction of J1+J2       | Same lookup and cumulative query                  | Same representation                                    |

## Concrete Differences

### Packet rounding

The retained profile rounded the solar irradiance, Penndorf table, and grass
albedo arrays with `Math.fround` before binary64 calculation. The current
profile supplies the decimal literals directly. This is the earliest data
difference. Its binary32-ulp scale is not a credible explanation for the
measured 4.673% relative J2 boundary RMS by itself, but exact parity must
measure it. The retained source also declared zero solar angular radius while
the current distant source declares `0.004675` radians; no audited cache
operation uses that radius to broaden the phase sample.

### Benchmark and source frame

The retained benchmark converted zenith/azimuth to a +Z-up vector:

```text
[sin(z) cos(a), sin(z) sin(a), cos(z)]
```

The current benchmark uses +X up:

```text
[cos(z), sin(z) sin(a), sin(z) cos(a)]
```

Mapping retained components to current components swaps X and Z. Its
determinant is `-1`, so this is a reflection rather than a proper rotation.

Both source-frame implementations prefer fixed global +Z, fall back to +Y,
and form `Y = cross(Z, X)`. In the retained +Z-up benchmark the preferred
reference is observer-up; in the current +X-up benchmark it is horizontal.
The ordinary Fibonacci-34 samples therefore have a different physical
rotation/handedness around the Sun relative to the observer and 81 view rays,
despite identical source-local vectors and weights.

This is the first concrete difference large enough in mechanism to explain a
changed J2 result. The current-production-only counterfactual restored the
retained Z-up/handedness arrangement for `09:30`, `11:15`, and `13:30`. It
reduced current-to-retained RMS by 98.17%, 97.31%, and 98.37%, respectively;
the combined RMS fell from `0.0019823750` to `0.0000385537`. Maximum residuals
fell by 97.60-98.62%. This establishes numerical causation for the dominant
retained/current J2 delta. The residual remains unattributed pending literal
rounding and backend-detail checks.

### Lower-boundary node

The retained paper run places its first construction node at exactly `0 m`,
whereas the current native 48-node position domain places it at `2 m`. This
distinction was previously recorded incorrectly as a shared 2 m lattice. It
is negligible for most B1 conditions but explains the isolated retained-frame
`12:45` strip. A current-production binary64 CPU counterfactual using the
retained `0 m` node and zero-distance ground-hit semantics matches all 3,240
retained J2 values at RMS `1.5634247e-9` and maximum `9.5259050e-9`.

The first GPU zero/near-zero counterfactuals were invalid. The completed fix
derives the discrete exact-ground incoming-direction classifications with the
same binary64 geometry rule used by the CPU and passes them as build data to
GPU transport and reflection. The sensitive production-ground J2 comparison
now passes at RMS `1.7170e-7` and maximum `7.6079e-7`.

### Precision

Run 167 used binary64 CPU fields. The current published boundary uses R32F GPU
cache passes and a GPU final-view shader. Current direct-40 J1 CPU/GPU evidence
has RMS `6.38e-8` and maximum absolute residual `4.51e-7`, far below the
retained/current J2 boundary RMS `0.001862`. Precision is real but is not the
leading observed cause.

## Corrected Diagnostic Meaning

The exact-J1 replacement and W27/W39/W55/W81 score sweep are current-path
representation diagnostics only. Run 167 also cached J1 on W27, so those
measurements cannot establish or reject retained parity. No recurrence change
was found in `L1 -> J2`, and no continuous-versus-cached final-view split was
found.

## Remaining Decision And Residual

The proper-rotation control is complete. A 90-degree rotation around global Z
agrees with the unchanged current binary64 CPU boundary at RMS `3.9449924e-18`
and maximum `5.5511151e-17`. The matching current GPU boundary differs from
the CPU control by RMS `2.3394116e-7` and maximum `1.4072916e-6`, isolating the
mixed-backend residual from the frame result.

The isolated retained-frame remainder is attributed to the lower-boundary
node change above. Literal rounding accounts only for residual numerical
scale after the executable boundary facts match. Retained numerical
orientation is now a selected production contract. The bounded B1 scores
becoming slightly worse under that orientation remains evidence that
historical parity and measured physical accuracy are distinct questions.

The three-condition retained-frame test already reports value RMS, maximum and
location, signed mean, floored relative RMS, and per-condition B1 score. Do
not expand to all 17 conditions merely to repeat the demonstrated mechanism.
The audit itself authorized no production change; the later explicit promotion
decision selected the retained frame and exact-ground node without changing
the quadrature.
