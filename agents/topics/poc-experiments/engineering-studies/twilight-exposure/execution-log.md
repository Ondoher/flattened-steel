# Twilight Exposure Execution Log

## 2026-10-23 ? M1 launch

Owner invoked independent-execution for the reviewed plan. No production promotion
is authorized. Production and all earlier evidence remain read-only.

Decision: capture RGBA32F at the pre-gain encoding boundary in an isolated owned
browser, retaining the original scene-input precision and native material. Reuse
that same linear data for display-only comparisons only after native re-encoding
passes the registered parity gate. Extract transported/filtered stellar and
atmosphere-only layers where needed; do not infer HDR from clipped PNGs.

Decision: use the already built production app and authenticated operational
assets read-only, avoiding an app rebuild or duplicate scattering calculation.
An experiment-owned server and private browser profile are generated under the
new run. The ephemeral profile/cache is removed only from the current unsealed
run after browser.close(); all scientific capture artifacts are retained and hashed.

Implementation: checked-root run allocator, heartbeat and exclusive artifact
writer, production-derived image probe, baseline capture runner and display
re-encoding helpers. Local JavaScript type checking passes before launch.

## M1/M2 evidence and decisions

00000-baseline failed the strict replay comparison (max5 bytes;11.54% of channels
more than one).00001 retained direct-GPU controls but revealed that equal gain
still differed over ground. Inspection found the probe's wrong composer input:
ShaderRuntimePass.needsSwap=false means the actual input is readBuffer, not
writeBuffer. No production change was made.00002 asserts sampler identity and
all five captures pass maximum one-byte replay error; earlier runs are preserved.
This restores the planned efficient HDR route rather than relaxing a gate.

00003-calibrate failed during sandbox Git spawn before measurements. Recovery
sealed only that uncompleted run;00004-calibrate succeeds via the host route.
Run initialization now resolves its read-only Git metadata before allocation.

00005-curve-screen registers parameter values before producing candidate images.
The curve family adds a smooth virtual input lift in the low-light response,
scaled from the measured p30/p50 illuminance gap. A very low activation threshold
retains the zero-input genuine-night anchor; a smooth high-light taper restores
exact native response by385 lux. Half and matched lift pass all pilot guards.
Double lift is too dark at+30. P90/RMS atmosphere-visible meters over-darken the
lower scene; the highlight-only shoulder changes daylight and loses band contrast.

Decision: advance the two successful curve variants to the full registered M3
regressions before adding another mechanism. This is cheaper and more faithful
to the owner request than expanding the rejected metering/shoulder branches now.
No physical spectrum or cache changes are contemplated. Exact all-view and
lower-height behavior remains to be measured.
