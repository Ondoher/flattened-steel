/** Canonical B1 time axis, in local EDT on 2013-05-27. @type {readonly string[]} */
export const CAPTURE_TIMES = Array.from({length: 17}, (_, index) => {
	const minutes = 570 + 15 * index;
	return `${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`;
});
/** Registered physical score channels. @type {readonly number[]} */
export const SCORE_CHANNELS = Array.from({length: 31}, (_, index) => index);
/** Complete Direct40 point samples. @type {readonly number[]} */
export const ALL_CHANNELS = Array.from({length: 40}, (_, index) => index);
/** Canonical directions, indexed gridY * 9 + gridX. @type {readonly number[]} */
export const ALL_RAYS = Array.from({length: 81}, (_, index) => index);
/** Preregistered screen; channel39 remains a numerical diagnostic outside the score interval. @type {DialAnalysisSelection} */
export const SCREEN_SELECTION = {
	times: ['09:30', '11:15', '13:30'],
	channels: [0, 8, 16, 24, 30, 39],
	rayIndices: ALL_RAYS,
};
/** Physical units shared by radiance and signed radiance changes. */
export const RADIANCE_UNITS = 'W m^-2 sr^-1 nm^-1';

/** Validate an identity received from the authenticated IO owner. @param {DialFileIdentity} identity */
export function assertIdentity(identity) {
	if (
		!identity ||
		typeof identity.path !== 'string' ||
		!identity.path ||
		!Number.isSafeInteger(identity.byteLength) ||
		identity.byteLength < 0 ||
		!/^[a-f0-9]{64}$/u.test(identity.sha256)
	)
		throw new TypeError('Expected an exact source file identity.');
}

/** Validate ordered canonical axes. @param {DialAnalysisSelection} selection */
export function assertSelection(selection) {
	for (const [values, allowed] of [
		[selection.times, CAPTURE_TIMES],
		[selection.channels, ALL_CHANNELS],
		[selection.rayIndices, ALL_RAYS],
	]) {
		if (!Array.isArray(values) || !values.length) throw new TypeError('Each selection axis must be nonempty.');
		let previous = -1;
		for (const value of values) {
			const index = /** @type {readonly (string | number)[]} */ (allowed).indexOf(value);
			if (index <= previous) throw new RangeError('Selection coordinates must be canonical, unique and ordered.');
			previous = index;
		}
	}
}

/** Validate shape and finite point values, without reading files. @param {DialAnalysisBoundary} boundary */
export function assertBoundary(boundary) {
	assertSelection(boundary);
	assertIdentity(boundary.sourceIdentity);
	if (!boundary.configId || boundary.units !== RADIANCE_UNITS || !['radiance', 'delta'].includes(boundary.quantity))
		throw new TypeError('Invalid boundary quantity, units or configuration identity.');
	if (
		!(boundary.values instanceof Float64Array) ||
		boundary.values.length !== boundary.times.length * boundary.rayIndices.length * boundary.channels.length ||
		boundary.values.some((value) => !Number.isFinite(value) || (boundary.quantity === 'radiance' && value < 0))
	)
		throw new TypeError('Invalid finite spectral boundary values.');
}

/** Require exactly corresponding scientific coordinates. @param {DialAnalysisBoundary} first @param {DialAnalysisBoundary} second */
export function assertAligned(first, second) {
	assertBoundary(first);
	assertBoundary(second);
	for (const axis of ['times', 'channels', 'rayIndices'])
		if (JSON.stringify(first[axis]) !== JSON.stringify(second[axis]))
			throw new Error(`Boundary ${axis} are not aligned.`);
}

/** Parse either exact measurement lambda headers or exact numeric Direct40 headers, requiring every model to be complete. @param {string} text @param {DialBoundaryParseOptions} options @returns {DialAnalysisBoundary} */
export function parseBoundaryTsv(text, options) {
	assertIdentity(options.sourceIdentity);
	if (typeof text !== 'string' || !options.configId)
		throw new TypeError('A UTF-8 TSV string and configuration identity are required.');
	const lines = text.split(/\r?\n/u);
	while (lines.at(-1) === '') lines.pop();
	const header = lines.shift()?.split('\t') ?? [];
	const offset = header[0] === 'model' ? 1 : 0;
	const prefix = offset ? ['model', 'time', 'grid_x', 'grid_y'] : ['time', 'grid_x', 'grid_y'];
	const spectralHeader = header.slice(prefix.length);
	const validSpectralHeader = [
		ALL_CHANNELS.map((channel) => `lambda_${channel}`),
		ALL_CHANNELS.map((channel) => String(360 + 11.75 * channel)),
	].some((expected) => JSON.stringify(expected) === JSON.stringify(spectralHeader));
	if (!validSpectralHeader || JSON.stringify(header.slice(0, prefix.length)) !== JSON.stringify(prefix))
		throw new Error('Unexpected TSV header; exact Direct40 headers are required.');
	if (offset ? !options.modelId : options.modelId !== undefined)
		throw new Error('Tables with a model column require an explicit modelId; measurements have none.');
	/** @type {Map<string, {values: Float64Array, seen: Set<number>}>} */
	const models = new Map();
	for (const [rowIndex, line] of lines.entries()) {
		const fields = line.split('\t');
		if (fields.length !== header.length || fields.some((value) => !value || value.trim() !== value))
			throw new Error(`Malformed TSV row ${rowIndex + 2}.`);
		const model = offset ? fields[0] : options.configId;
		if (!models.has(model)) models.set(model, {values: new Float64Array(17 * 81 * 40), seen: new Set()});
		const record = models.get(model);
		const timeIndex = CAPTURE_TIMES.indexOf(fields[offset]);
		if (timeIndex < 0 || !/^[0-8]$/u.test(fields[offset + 1]) || !/^[0-8]$/u.test(fields[offset + 2]))
			throw new Error(`Noncanonical TSV coordinates at row ${rowIndex + 2}.`);
		const rayIndex = Number(fields[offset + 2]) * 9 + Number(fields[offset + 1]);
		const coordinate = timeIndex * 81 + rayIndex;
		if (record.seen.has(coordinate)) throw new Error(`Duplicate TSV coordinate at row ${rowIndex + 2}.`);
		record.seen.add(coordinate);
		for (let channel = 0; channel < 40; channel++) {
			const token = fields[offset + 3 + channel];
			const value = Number(token);
			if (!/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:[eE][+-]?\d+)?$/u.test(token) || !Number.isFinite(value) || value < 0)
				throw new Error(`Invalid radiance at row ${rowIndex + 2}, channel ${channel}.`);
			record.values[coordinate * 40 + channel] = value;
		}
	}
	for (const [model, record] of models)
		if (record.seen.size !== 17 * 81)
			throw new Error(`Incomplete model ${model}: requires 17 x 81 complete spectra.`);
	const selected = models.get(options.modelId ?? options.configId);
	if (!selected) throw new Error('Requested model is absent.');
	const result = {
		configId: options.configId,
		quantity: /** @type {DialAnalysisQuantity} */ ('radiance'),
		units: RADIANCE_UNITS,
		times: [...CAPTURE_TIMES],
		channels: [...ALL_CHANNELS],
		rayIndices: [...ALL_RAYS],
		values: selected.values,
		sourceIdentity: {...options.sourceIdentity},
	};
	assertBoundary(result);
	return result;
}

/** Select explicit coordinates without redefining the Direct40 spectral basis. @param {DialAnalysisBoundary} boundary @param {DialAnalysisSelection} selection @returns {DialAnalysisBoundary} */
export function selectBoundary(boundary, selection) {
	assertBoundary(boundary);
	assertSelection(selection);
	const values = new Float64Array(selection.times.length * selection.rayIndices.length * selection.channels.length);
	let output = 0;
	for (const time of selection.times)
		for (const ray of selection.rayIndices)
			for (const channel of selection.channels) {
				const timeIndex = boundary.times.indexOf(time),
					rayIndex = boundary.rayIndices.indexOf(ray),
					channelIndex = boundary.channels.indexOf(channel);
				if (Math.min(timeIndex, rayIndex, channelIndex) < 0)
					throw new Error('Selection requests absent coordinates.');
				values[output++] =
					boundary.values[
						(timeIndex * boundary.rayIndices.length + rayIndex) * boundary.channels.length + channelIndex
					];
			}
	return {
		...boundary,
		times: [...selection.times],
		rayIndices: [...selection.rayIndices],
		channels: [...selection.channels],
		values,
	};
}
