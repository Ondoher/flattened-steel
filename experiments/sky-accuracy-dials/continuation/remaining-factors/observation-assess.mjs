import assert from 'node:assert/strict';

/** Compare the fixed GPU scenarios without selecting offsets or altering measurements.
 * @param {SkyObservationPayload} payload @param {SkyTargetedGpuResult} gpu
 * @param {SkyTargetedAssessment} previous @param {SkyRemainingAssessment} accounting
 * @returns {SkyObservationAssessment}
 */
export function assessObservation(payload, gpu, previous, accounting) {
	assert.equal(gpu.width, 4);
	assert.equal(gpu.height, payload.rowLayout.length);
	/** @type {SkyObservationScalar[]} */ const rows = [];
	/** @type {SkyTargetedParity[]} */ const parity = [];
	const variants = [...new Set(payload.rowLayout.map((r) => r.variant))];
	for (const original of previous.rows.filter((r) => r.mode === 7 && r.sourceCount === 160)) {
		const channelIndex = payload.channels.indexOf(original.channel);
		/** @param {string} variant @param {number} level @returns {number} */
		function value(variant, level) {
			let value = 0,
				weight = 0;
			for (const [y, row] of payload.rowLayout.entries())
				if (row.probeId === original.probeId && row.variant === variant && row.subdivisions === level) {
					const index = (y * gpu.width + channelIndex) * 4;
					assert.ok(gpu.values[index] >= 0 && Number.isFinite(gpu.values[index]));
					assert.equal(gpu.values[index + 1], row.sampleCount);
					value += row.weight * gpu.values[index];
					weight += row.weight;
				}
			assert.ok(Math.abs(weight - 1) < 1e-14);
			return value;
		}
		const first = value('ideal', 16),
			first8 = value('ideal', 8);
		const guardW = original.guardW + Math.max(1e-8, 32 * 2 ** -23 * Math.abs(first));
		parity.push({
			probeId: original.probeId,
			channel: original.channel,
			differenceW: first - original.first16W,
			guardW,
			withinGuard: Math.abs(first - original.first16W) <= guardW && Math.abs(first8 - original.first8W) <= guardW,
		});
		const lower =
			accounting.rows.find(
				(r) => r.probeId === original.probeId && r.channel === original.channel && r.candidate === 'H',
			)?.physicalLowerBound ?? null;
		const originalResidual = first + original.higherW - original.measuredW;
		for (const variant of variants) {
			const first16 = value(variant, 16),
				earlier = value(variant, 8),
				delta = first16 - first;
			rows.push({
				probeId: original.probeId,
				time: original.time,
				channel: original.channel,
				variant,
				first8: earlier,
				first16,
				originalFirst: first,
				delta,
				residual: first16 + original.higherW - original.measuredW,
				residual8: earlier + original.higherW - original.measuredW,
				originalResidual,
				physicalLowerBound: lower,
				shiftedLowerDiagnostic: lower === null ? null : lower + delta,
			});
		}
	}
	assert.equal(parity.length, 160);
	assert.ok(
		parity.every((p) => p.withinGuard),
		'Original-direction GPU control mismatch',
	);
	/** @type {SkyObservationGroup[]} */ const groups = [];
	const selectors = ['all', ...new Set(rows.map((r) => r.time)), ...payload.channels.map((c) => 'channel-' + c)];
	for (const group of selectors)
		for (const variant of variants) {
			const selected = rows.filter(
				(r) =>
					r.variant === variant && (group === 'all' || group === r.time || group === 'channel-' + r.channel),
			);
			const original = selected.map((r) =>
				rows.find((x) => x.variant === 'ideal' && x.probeId === r.probeId && x.channel === r.channel),
			);
			const rmseMw = (1000 * Math.hypot(...selected.map((r) => r.residual))) / Math.sqrt(selected.length),
				rmse8Mw = (1000 * Math.hypot(...selected.map((r) => r.residual8))) / Math.sqrt(selected.length);
			groups.push({
				group,
				variant,
				count: selected.length,
				deltaRmsMw: (1000 * Math.hypot(...selected.map((r) => r.delta))) / Math.sqrt(selected.length),
				deltaMeanMw: (1000 * selected.reduce((s, r) => s + r.delta, 0)) / selected.length,
				rmseMw,
				rmse8Mw,
				gainMw: (1000 * Math.hypot(...original.map((r) => r.residual))) / Math.sqrt(selected.length) - rmseMw,
				gain8Mw:
					(1000 * Math.hypot(...original.map((r) => r.residual8))) / Math.sqrt(selected.length) - rmse8Mw,
				unstableSigns: selected.filter(
					(r, i) =>
						Math.abs(r.delta) > 1e-8 && Math.sign(r.delta) !== Math.sign(r.first8 - original[i].first8),
				).length,
			});
		}
	const envelopes = rows
		.filter((r) => r.variant === 'ideal')
		.map((original) => {
			const selected = rows.filter((r) => r.probeId === original.probeId && r.channel === original.channel);
			const minimumDelta = Math.min(...selected.map((r) => r.delta)),
				maximumDelta = Math.max(...selected.map((r) => r.delta));
			return {
				probeId: original.probeId,
				time: original.time,
				channel: original.channel,
				residual: original.residual,
				minimumDelta,
				maximumDelta,
				spansResidual: original.residual + minimumDelta <= 0 && original.residual + maximumDelta >= 0,
			};
		});
	return {rows, groups, parity, envelopes};
}
