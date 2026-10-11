# P4 Current-Contract Experimental Application

Behavior qualification is accepted in the
[00577 application report](../../../../../tmp/experiments/local-sun-cache-reuse/runs/00577-p45-app-report/result.json).
P4 implementation completion additionally requires matching exit-0 CLEAN
primary/audit validation for the P3-E–P5 review unit in
`.codex-tmp/review-standards/session-przBnI/validation.json`.
A missing, stale or non-CLEAN receipt keeps implementation completion open.
The coverage-expansion replacement misses its original latency target. The
[current owner timing disposition](plan.md#p5--qualify-defensibility-motion-and-benefit)
makes timing observations informative rather than completion gates.

## Application Boundary

The P4/P5-qualified experiment builds the pinned 00478 field on the GPU and publishes
one complete frame containing its cache, live horizontal placement, source,
exact-state receiver lighting and ordinary six-object shadow
lighting. The production application and public API are unchanged. Production
collaborators are consumed read-only through contained adapters.

That phase's experimental profile leaves its celestial roster unset. Its atmospheric
Sun and scene illumination are integrated, but the visible Sun disc and stars
are not enabled. Their later integration and visual checks are recorded by
[P5-Celestial](p5-celestial.md).
The earlier source-disk description overstated the completed application;
sealed P4/P5 results remain unchanged and do not qualify celestial rendering.

The view and receiver use the same cumulative N4 field, Native15 spectra and
runtime transport. Black physical ground and disabled ozone remain explicit
model assumptions. The visual scene's green surface and colored materials do
not introduce reflected-ground energy into atmospheric scattering. The film's
shared-shadow adapter and one-second lighting interpolation are absent here.

## Sealed Proofs

| Capture             | Resource guard       | Required behavior                                                                                                |
| ------------------- | -------------------- | ---------------------------------------------------------------------------------------------------------------- |
| 00560-p3-shell-move | 00559-resource-bound | Compile failure, cancellation, admission rejection, supersession and disposal with a live frame lease            |
| 00567-p3-shell-move | 00566-resource-bound | Source height +10 km, Mie albedo ×0.9 and source power ×1.1 replacements                                         |
| 00570-p3-shell-move | 00569-resource-bound | Observer movement within coverage, rejection outside the old cylinder and construction of a covering replacement |

Every job selected a ten-minute timeout, 8 GiB aggregate owned-memory ceiling,
8 GiB machine reserve and exclusive heavy-job ownership. Each accepted run
retains commands, executable/source closure, contract inputs, browser/GPU
identity, spectra, direct PNGs and sampled telemetry. Disposable profiles were
removed before sealing. Initial 45-minute-guard pilots remain immutable and
are excluded from this qualification.

All required complete frames passed 96-ray CPU/GPU radiance/transmission
checks across 15 channels, endpoint precision, coverage and receiver/shadow
identity checks. Six ordinary 4096×4096 maps used the published receiver's
direct spectrum and current source direction. Replacement construction kept
the old complete pixels bit-identical until publication. Failed or superseded
work preserved the old frame; final lease release retired numeric resources.
The power replacement also passed the independent ×1.1 linearity invariant.

The observer exit was rejected at radius 33,379 km against the old 33,378 km
domain. Its replacement expanded the cylinder to 35,307 km. No unsupported
query was admitted by clamping. The new layout retained six omitted bands.

## Costs And Reviewable Images

Height, medium and power replacements took 18.541, 17.912 and 18.478 seconds,
inside the 30-second replacement limit. The coverage expansion took 34.135
seconds and **missed that original target**. Its new view and receiver shader identities
required overlapping preparations of 29.591 and 30.678 seconds; those stage
times are not additive. The original observation is preserved; current
owner-directed timing relaxation removes its completion-gate role.

Maximum page pulse gap was 23.6 ms. Maximum logical numeric application
payload was 1,184,978,512 bytes against the 1.2 GB limit. Maximum sampled owned
private allocation was 7,055,155,200 bytes; the smallest machine free-memory
sample was 9,822,818,304 bytes. Logical payload excludes driver/JS overhead and
is not physical VRAM telemetry; the guard separately measured owned processes.

The [replacement stack](../../../../../tmp/experiments/local-sun-cache-reuse/runs/00577-p45-app-report/replacement-stack.png)
copies unchanged captures vertically: canonical, height, medium, power.
The primary agent inspected it. Direct before/after PNGs and the bit-identity
check of the old frame during preparation remain in each capture. The complete
five-state colored-box cadence belongs to P5, alongside its sky-only cadence.

These proofs establish application consistency and lifecycle ownership under
the stated model. They do not establish absolute physical error or production
readiness. P6 recording remains unselected.
