/** Describe the exact streaming recurrence; every consuming output is distinct.
 * @returns {readonly SkyDensityStage[]} Thirteen ordered passes through N4.
 */
export function densityStages() {
	/** @type {SkyDensityStage[]} */
	const stages = [
		{id: 'direct-base', program: 'direct', layout: 'base', inputs: [], release: [], capture: false},
		{
			id: 'J1',
			program: 'first',
			layout: 'J',
			inputs: ['direct-base'],
			release: ['J1', 'direct-base'],
			capture: true,
		},
		{id: 'L1', program: 'analytic-l1', layout: 'L', inputs: [], release: [], capture: true},
	];
	for (let order = 2; order <= 4; order++) {
		const previous = `L${order - 1}`;
		stages.push({
			id: `J${order}-rayleigh`,
			program: 'scatter-rayleigh',
			layout: 'J',
			inputs: [previous],
			release: order === 4 ? [`J${order}-rayleigh`] : [],
			capture: true,
		});
		if (order < 4)
			stages.push({
				id: `L${order}-rayleigh`,
				program: 'transport-rayleigh',
				layout: 'L',
				inputs: [`J${order}-rayleigh`, previous],
				release: [`J${order}-rayleigh`],
				capture: false,
			});
		stages.push({
			id: `J${order}-mie`,
			program: 'scatter-mie',
			layout: 'J',
			inputs: [previous],
			release: order === 4 ? [`J${order}-mie`, previous] : [],
			capture: true,
		});
		if (order < 4)
			stages.push({
				id: `L${order}`,
				program: 'transport-mie',
				layout: 'L',
				inputs: [`J${order}-mie`, previous, `L${order}-rayleigh`],
				release: [`J${order}-mie`, `L${order}-rayleigh`, previous],
				capture: true,
			});
	}
	return stages;
}

/** Simulate actual field lifetimes without allocating GPU memory.
 * Reject dependency reuse, feedback, premature release and cap violations.
 * @param {number} widthJ - Outgoing scalar texture width.
 * @param {number} widthL - Incoming radiance texture width.
 * @param {number} height - Solar by altitude texture rows.
 * @returns {SkyDensityLifetimeProof} Explicit dependency and memory proof.
 */
export function verifyDensityLifetimes(widthJ, widthL, height) {
	if (![widthJ, widthL, height].every((value) => Number.isSafeInteger(value) && value > 0))
		throw new RangeError('Positive integer density field dimensions required.');
	const stages = densityStages();
	/** @type {Map<string,number>} */ const live = new Map();
	let bytes = 0,
		peakBytes = 0;
	for (const stage of stages) {
		if (live.has(stage.id) || stage.inputs.includes(stage.id) || stage.inputs.some((id) => !live.has(id)))
			throw new Error('Density recurrence has a missing or aliased dependency.');
		const allocated = 4 * height * (stage.layout === 'J' ? widthJ : stage.layout === 'L' ? widthL : 2);
		if (!Number.isSafeInteger(allocated)) throw new RangeError('Density allocation exceeds exact byte accounting.');
		live.set(stage.id, allocated);
		bytes += allocated;
		peakBytes = Math.max(peakBytes, bytes);
		if (peakBytes > 1024 ** 3) throw new RangeError('Density recurrence exceeds the one-GiB scalar-field cap.');
		for (const id of stage.release) {
			const released = live.get(id);
			if (released === undefined) throw new Error('Density recurrence releases an absent field.');
			bytes -= released;
			live.delete(id);
		}
	}
	if (bytes !== 0 || live.size !== 0) throw new Error('Density recurrence retains a terminal field.');
	const samePreviousOrders = [2, 3, 4].filter((order) => {
		const r = stages.find((stage) => stage.id === `J${order}-rayleigh`);
		const m = stages.find((stage) => stage.id === `J${order}-mie`);
		return (
			r.inputs.length === 1 &&
			m.inputs.length === 1 &&
			r.inputs[0] === `L${order - 1}` &&
			r.inputs[0] === m.inputs[0]
		);
	});
	if (samePreviousOrders.length !== 3) throw new Error('Species scatter passes did not share the prior order.');
	return {passCount: stages.length, peakBytes, finalBytes: bytes, samePreviousOrders, groundOrders: [2, 3]};
}
