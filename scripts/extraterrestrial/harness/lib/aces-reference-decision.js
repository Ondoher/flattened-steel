import {deflateSync} from 'node:zlib';

export const FIXED_SCENE_SCALE = 0.00029282576866764276;
export const PROOF_ID = 'aces2-sun-appearance-reference-decision-v1';
export const DECISION_SEAM_DELTAS = Object.freeze([2 ** -8, 2 ** -12, 2 ** -16]);
export const CTL_OCIO_ABSOLUTE_TOLERANCE = 7e-6;

const XYZ_TO_LINEAR_REC709 = Object.freeze([
	Object.freeze([3.2406, -1.5372, -0.4986]),
	Object.freeze([-0.9689, 1.8758, 0.0415]),
	Object.freeze([0.0557, -0.204, 1.057]),
]);
const LINEAR_REC709_TO_XYZ = Object.freeze([
	Object.freeze([0.4123907992659595, 0.35758433938387796, 0.1804807884018343]),
	Object.freeze([0.21263900587151036, 0.7151686787677559, 0.07219231536073371]),
	Object.freeze([0.01933081871559185, 0.11919477979462599, 0.9505321522496607]),
]);
const OFFICIAL_SRGB_GAMMA = 2.4;
const OFFICIAL_SRGB_OFFSET = 0.055;

function requireCondition(condition, message) {
	if (!condition) throw new Error(message);
}

function finiteRgb(value, label) {
	requireCondition(Array.isArray(value) && value.length >= 3, `${label} is missing.`);
	const result = value.slice(0, 3).map(Number);
	requireCondition(result.every(Number.isFinite), `${label} is not finite.`);
	return result;
}

function maximumMagnitude(rgb) {
	return Math.max(...rgb.map(Math.abs));
}

function finiteMetric(value) {
	return Number.isFinite(value) ? value : null;
}

function sampleKey(conditionId, viewportId, sampleId, lane) {
	return `${conditionId}|${viewportId}|${sampleId}|${lane}`;
}

function fixtureConditions(fixture) {
	return [...(fixture.distant?.conditions ?? []), ...(fixture.flat?.conditions ?? [])];
}

/** Extract every sealed GPU sample needed by the offline reference decision. */
export function collectMeasuredSamples(browserEvidence, fixture) {
	const partitions = new Map(fixtureConditions(fixture).map((entry) => [entry.id, entry.partition]));
	const samples = [];
	for (const condition of browserEvidence.conditions ?? []) {
		const partition = partitions.get(condition.id);
		requireCondition(
			partition === 'calibration' || partition === 'holdout',
			`Condition ${condition.id} has no frozen calibration/holdout partition.`,
		);
		for (const viewport of condition.viewports ?? []) {
			for (const sample of viewport.samples ?? []) {
				for (const lane of ['cpu', 'gpu']) {
					const laneSample = sample[lane];
					const label = `${condition.id}/${viewport.id}/${sample.id}/${lane}`;
					const sceneRgb = finiteRgb(laneSample?.signedLinearRgb, `${label} signed linear RGB`);
					const rawY = Number(laneSample?.directY);
					requireCondition(Number.isFinite(rawY), `${label} raw Y is invalid.`);
					samples.push({
						key: sampleKey(condition.id, viewport.id, sample.id, lane),
						conditionId: condition.id,
						family: condition.family,
						partition,
						viewportId: viewport.id,
						sampleId: sample.id,
						lane,
						orientation: sample.orientation,
						angularOffsetRadians: Number(sample.angularOffsetRadians),
						rawY,
						sceneRgb,
					});
				}
			}
		}
	}
	requireCondition(samples.length > 0, 'Paired evidence contains no measured signed-linear samples.');
	return samples;
}

/** Extract every sealed GPU-only sample needed by the first-view reference decision. */
export function collectGpuMeasuredSamples(browserEvidence, fixture) {
	const partitions = new Map(fixtureConditions(fixture).map((entry) => [entry.id, entry.partition]));
	const samples = [];
	for (const condition of browserEvidence.conditions ?? []) {
		const partition = partitions.get(condition.id);
		requireCondition(
			partition === 'calibration' || partition === 'holdout',
			`Condition ${condition.id} has no frozen calibration/holdout partition.`,
		);
		for (const viewport of condition.viewports ?? []) {
			for (const sample of viewport.samples ?? []) {
				const label = `${condition.id}/${viewport.id}/${sample.id}/gpu`;
				const sceneRgb = finiteRgb(sample.gpu?.signedLinearRgb, `${label} signed linear RGB`);
				const rawY = Number(sample.gpu?.directY);
				requireCondition(Number.isFinite(rawY), `${label} raw Y is invalid.`);
				samples.push({
					key: sampleKey(condition.id, viewport.id, sample.id, 'gpu'),
					conditionId: condition.id,
					family: condition.family,
					partition,
					viewportId: viewport.id,
					sampleId: sample.id,
					lane: 'gpu',
					orientation: sample.orientation,
					angularOffsetRadians: Number(sample.angularOffsetRadians),
					rawY,
					sceneRgb,
				});
			}
		}
	}
	requireCondition(
		samples.length === fixture.sampling?.requiredSampleCount,
		`GPU evidence contains ${samples.length} samples; expected ${fixture.sampling?.requiredSampleCount}.`,
	);
	return samples;
}

function parseSpectralTable(text, selectedModel, label) {
	const lines = text.trim().split(/\r?\n/u);
	const header = lines.shift().split('\t');
	const indices = {
		model: header.indexOf('model'),
		time: header.indexOf('time'),
		gridX: header.indexOf('grid_x'),
		gridY: header.indexOf('grid_y'),
		channels: Array.from({length: 40}, (_, index) => header.indexOf(`lambda_${index}`)),
	};
	requireCondition(
		indices.model >= 0 &&
			indices.time >= 0 &&
			indices.gridX >= 0 &&
			indices.gridY >= 0 &&
			indices.channels.every((index) => index >= 0),
		`${label} schema is incomplete.`,
	);
	const rows = new Map();
	for (const line of lines) {
		const fields = line.split('\t');
		if (fields[indices.model] !== selectedModel) continue;
		const time = fields[indices.time];
		const gridX = Number(fields[indices.gridX]);
		const gridY = Number(fields[indices.gridY]);
		const spectrum = indices.channels.map((index) => Number(fields[index]));
		requireCondition(
			Number.isInteger(gridX) && Number.isInteger(gridY) && spectrum.every(Number.isFinite),
			`${label} contains a malformed row.`,
		);
		const key = `${time}/${gridX}/${gridY}`;
		requireCondition(!rows.has(key), `${label} repeats ${key}.`);
		rows.set(key, {key, time, gridX, gridY, spectrum});
	}
	requireCondition(rows.size === 1377, `${label} must contain exactly 1,377 selected rows.`);
	return rows;
}

function parseCieTable(text) {
	const values = new Map();
	for (const line of text.trim().split(/\r?\n/u)) {
		const fields = line.split(',').map(Number);
		if (fields.length === 4 && fields.every(Number.isFinite)) values.set(fields[0], fields.slice(1));
	}
	return values;
}

function cieAt(cie, wavelength) {
	const lower = Math.floor(wavelength);
	const upper = Math.ceil(wavelength);
	const low = cie.get(lower);
	const high = cie.get(upper);
	requireCondition(low && high, `CIE table does not bracket ${wavelength} nm.`);
	const fraction = wavelength - lower;
	return low.map((value, index) => value + fraction * (high[index] - value));
}

function projectSpectrum(spectrum, cie) {
	const xyz = [0, 0, 0];
	for (let channel = 0; channel < 40; channel += 1) {
		const matching = cieAt(cie, 360 + channel * 11.75);
		for (let axis = 0; axis < 3; axis += 1) xyz[axis] += spectrum[channel] * matching[axis] * 11.75 * 683;
	}
	return {
		xyz,
		sceneRgb: XYZ_TO_LINEAR_REC709.map((row) => row.reduce((sum, value, axis) => sum + value * xyz[axis], 0)),
	};
}

/** Parse and project the exact checksum-sealed run-235 input pairing. */
export function collectBrunetonNonRegressionInputs({brunetonText, productionText, cieText}) {
	const reference = parseSpectralTable(brunetonText, 'bruneton', 'Bruneton spectral input');
	const production = parseSpectralTable(productionText, 'proposed', 'Production GPU spectral input');
	const cie = parseCieTable(cieText);
	const records = [];
	const pairs = [];
	for (const [key, referenceRow] of reference) {
		const productionRow = production.get(key);
		requireCondition(productionRow, `Production GPU spectral input is missing ${key}.`);
		const referenceProjection = projectSpectrum(referenceRow.spectrum, cie);
		const productionProjection = projectSpectrum(productionRow.spectrum, cie);
		const referenceId = `bruneton-reference:${key}`;
		const productionId = `bruneton-production:${key}`;
		records.push({
			id: referenceId,
			kind: 'bruneton-reference',
			sceneRgb: referenceProjection.sceneRgb,
		});
		records.push({
			id: productionId,
			kind: 'bruneton-production',
			sceneRgb: productionProjection.sceneRgb,
		});
		pairs.push({
			key,
			referenceId,
			productionId,
			referenceXyz: referenceProjection.xyz,
			productionXyz: productionProjection.xyz,
			referenceSceneRgb: referenceProjection.sceneRgb,
			productionSceneRgb: productionProjection.sceneRgb,
		});
	}
	return {records, pairs};
}

function hsvUnit(hue) {
	const h = ((hue % 1) + 1) % 1;
	const segment = h * 6;
	const x = 1 - Math.abs((segment % 2) - 1);
	if (segment < 1) return [1, x, 0];
	if (segment < 2) return [x, 1, 0];
	if (segment < 3) return [0, 1, x];
	if (segment < 4) return [0, x, 1];
	if (segment < 5) return [x, 0, 1];
	return [1, 0, x];
}

function addSeam(records, id, center, direction) {
	for (const deltaMultiplier of DECISION_SEAM_DELTAS) {
		const delta = deltaMultiplier * Math.max(1, maximumMagnitude(center));
		for (const sign of [-1, 1]) {
			const normalizedRgb = center.map((value, index) => value + sign * delta * direction[index]);
			records.push({
				id: `${id}:${deltaMultiplier}:${sign}`,
				kind: 'continuity-seam',
				seamId: id,
				deltaMultiplier,
				sign,
				normalizedRgb,
				sceneRgb: normalizedRgb.map((value) => value / FIXED_SCENE_SCALE),
			});
		}
	}
}

/** Build the frozen measured plus synthetic grid in normalized pre-ACES units. */
export function buildReferenceGrid({measuredSamples, frameProbes, frameMaximumNormalized, brunetonInputs, fixture}) {
	const records = [];
	for (const sample of measuredSamples) {
		records.push({
			id: `measured:${sample.key}`,
			kind: 'measured-sample',
			sampleKey: sample.key,
			partition: sample.partition,
			normalizedRgb: sample.sceneRgb.map((value) => value * FIXED_SCENE_SCALE),
			sceneRgb: sample.sceneRgb,
		});
	}
	for (const probe of frameProbes) {
		records.push({
			id: `frame:${probe.id}`,
			kind: 'measured-frame-probe',
			normalizedRgb: probe.sceneRgb.map((value) => value * FIXED_SCENE_SCALE),
			sceneRgb: probe.sceneRgb,
		});
	}
	for (const record of brunetonInputs.records) {
		records.push({
			...record,
			normalizedRgb: record.sceneRgb.map((value) => value * FIXED_SCENE_SCALE),
		});
	}
	const measuredMaximum = Math.max(
		frameMaximumNormalized,
		...measuredSamples.map((sample) => maximumMagnitude(sample.sceneRgb) * FIXED_SCENE_SCALE),
		...brunetonInputs.records.map((record) => maximumMagnitude(record.sceneRgb) * FIXED_SCENE_SCALE),
		2 ** -16,
	);
	const twoM = 2 * measuredMaximum;
	const neutralMaximumPower = Math.max(11, Math.ceil(Math.log2(twoM)));
	records.push({id: 'neutral:zero', kind: 'neutral', neutralLevel: 0, normalizedRgb: [0, 0, 0], sceneRgb: [0, 0, 0]});
	records.push({
		id: 'neutral:middle-gray',
		kind: 'neutral',
		neutralLevel: 0.18,
		normalizedRgb: [0.18, 0.18, 0.18],
		sceneRgb: [0.18, 0.18, 0.18].map((value) => value / FIXED_SCENE_SCALE),
	});
	for (let quarterStop = -64; quarterStop <= neutralMaximumPower * 4; quarterStop += 1) {
		const level = 2 ** (quarterStop / 4);
		records.push({
			id: `neutral:${quarterStop}`,
			kind: 'neutral',
			neutralLevel: level,
			normalizedRgb: [level, level, level],
			sceneRgb: [level, level, level].map((value) => value / FIXED_SCENE_SCALE),
		});
	}
	for (const level of [1024 * (1 - 2 ** -16), 1024, 1024 * (1 + 2 ** -16), twoM]) {
		records.push({
			id: `neutral:special:${level}`,
			kind: 'neutral',
			neutralLevel: level,
			normalizedRgb: [level, level, level],
			sceneRgb: [level, level, level].map((value) => value / FIXED_SCENE_SCALE),
		});
	}
	for (const redMultiplier of [-2, -1, 0, 1, 2]) {
		for (const greenMultiplier of [-2, -1, 0, 1, 2]) {
			for (const blueMultiplier of [-2, -1, 0, 1, 2]) {
				const normalizedRgb = [
					redMultiplier * measuredMaximum,
					greenMultiplier * measuredMaximum,
					blueMultiplier * measuredMaximum,
				];
				records.push({
					id: `signed-cube:${redMultiplier}:${greenMultiplier}:${blueMultiplier}`,
					kind: 'signed-cube',
					normalizedRgb,
					sceneRgb: normalizedRgb.map((value) => value / FIXED_SCENE_SCALE),
				});
			}
		}
	}
	const levels = [2 ** -8, 0.18, 1, 16, 256, 1024, twoM];
	const saturations = fixture.syntheticReferenceGrid?.saturationMultipliers ?? [
		0, 0.25, 0.5, 0.75, 1, 1.25, 1.5, 2, 4,
	];
	for (let hueDegrees = 0; hueDegrees < 360; hueDegrees += 1) {
		const hueRgb = hsvUnit(hueDegrees / 360);
		for (const level of levels) {
			for (const saturation of saturations) {
				const normalizedRgb = hueRgb.map((component) => level * (1 + saturation * (component - 1)));
				records.push({
					id: `hue:${hueDegrees}:${level}:${saturation}`,
					kind: 'hue-saturation',
					hueDegrees,
					hueLevel: level,
					saturation,
					normalizedRgb,
					sceneRgb: normalizedRgb.map((value) => value / FIXED_SCENE_SCALE),
				});
			}
		}
	}
	addSeam(records, 'black-crossing', [0, 0, 0], [1, -0.5, 0.25]);
	addSeam(records, 'negative-blue', [0.18, 0.05, 0], [0, 0, 1]);
	addSeam(records, 'official-forward-limit', [1024, 1024, 1024], [1, 1, 1]);
	addSeam(records, 'upper-gamut-color', [1024, 512, 64], [1, 0.2, -0.1]);
	for (const hue of [0, 60, 120, 180, 240, 300, 359.999]) {
		addSeam(
			records,
			`hue-knot-${hue}`,
			hsvUnit(hue / 360).map((value) => value * measuredMaximum),
			[0.2, -0.1, 0.15],
		);
	}
	requireCondition(
		records.every((record) => record.sceneRgb.every(Number.isFinite)),
		'Reference grid overflowed.',
	);
	requireCondition(
		records.every((record) => record.sceneRgb.every((value) => Number.isFinite(Math.fround(value)))),
		'Reference grid is not representable as float32.',
	);
	return {records, measuredMaximumNormalized: measuredMaximum, twoM};
}

/** Select the frozen bounded set for authoritative CTL versus OCIO parity. */
export function buildCtlOracleGrid(records) {
	const maximumHueLevel = Math.max(
		...records.filter((record) => record.kind === 'hue-saturation').map((record) => record.hueLevel),
	);
	const selected = records.filter((record) => {
		if (
			record.kind === 'measured-sample' ||
			record.kind === 'continuity-seam' ||
			record.kind === 'bruneton-reference' ||
			record.kind === 'bruneton-production'
		)
			return true;
		if (record.kind === 'signed-cube') return true;
		if (record.kind === 'neutral') {
			return (
				record.neutralLevel === 0 ||
				record.neutralLevel === 0.18 ||
				[2 ** -16, 1, 16, 256].some((level) => Math.abs(record.neutralLevel - level) <= 1e-12) ||
				Math.abs(record.neutralLevel - 1024) <= 1024 * 2 ** -15 ||
				record.id.startsWith('neutral:special:')
			);
		}
		return (
			record.kind === 'hue-saturation' &&
			record.hueDegrees % 30 === 0 &&
			(record.hueLevel === 0.18 || record.hueLevel === 1024 || record.hueLevel === maximumHueLevel) &&
			[1, 2, 4].includes(record.saturation)
		);
	});
	requireCondition(selected.length > 0, 'Bounded CTL oracle grid is empty.');
	return selected;
}

/** Encode one record per pixel as little-endian float32 RGBA. */
export function encodeReferenceGrid(records) {
	const bytes = Buffer.allocUnsafe(records.length * 16);
	for (let index = 0; index < records.length; index += 1) {
		const offset = index * 16;
		for (let channel = 0; channel < 3; channel += 1) {
			const value = Math.fround(records[index].sceneRgb[channel]);
			requireCondition(Number.isFinite(value), `Record ${records[index].id} is not float32-representable.`);
			bytes.writeFloatLE(value, offset + channel * 4);
		}
		bytes.writeFloatLE(1, offset + 12);
	}
	return bytes;
}

/** Decode exact RGBA float32 output, rejecting a byte-count mismatch. */
export function decodeRgba32f(bytes, expectedPixelCount) {
	requireCondition(bytes.byteLength === expectedPixelCount * 16, 'RGBA32F byte count is invalid.');
	const result = new Array(expectedPixelCount);
	for (let index = 0; index < expectedPixelCount; index += 1) {
		const offset = index * 16;
		result[index] = [
			bytes.readFloatLE(offset),
			bytes.readFloatLE(offset + 4),
			bytes.readFloatLE(offset + 8),
			bytes.readFloatLE(offset + 12),
		];
	}
	return result;
}

function officialSrgbDecode(value) {
	const slope =
		((OFFICIAL_SRGB_GAMMA - 1) / OFFICIAL_SRGB_OFFSET) *
		((OFFICIAL_SRGB_OFFSET * OFFICIAL_SRGB_GAMMA) / ((OFFICIAL_SRGB_GAMMA - 1) * (1 + OFFICIAL_SRGB_OFFSET))) **
			OFFICIAL_SRGB_GAMMA;
	const breakpoint = OFFICIAL_SRGB_OFFSET / (OFFICIAL_SRGB_GAMMA - 1);
	return value >= breakpoint
		? ((value + OFFICIAL_SRGB_OFFSET) / (1 + OFFICIAL_SRGB_OFFSET)) ** OFFICIAL_SRGB_GAMMA
		: value * slope;
}

function officialSrgbEncode(value) {
	const breakpoint =
		((OFFICIAL_SRGB_OFFSET * OFFICIAL_SRGB_GAMMA) / ((OFFICIAL_SRGB_GAMMA - 1) * (1 + OFFICIAL_SRGB_OFFSET))) **
		OFFICIAL_SRGB_GAMMA;
	const reciprocalSlope =
		((OFFICIAL_SRGB_GAMMA - 1) / OFFICIAL_SRGB_OFFSET) ** (OFFICIAL_SRGB_GAMMA - 1) *
		((1 + OFFICIAL_SRGB_OFFSET) / OFFICIAL_SRGB_GAMMA) ** OFFICIAL_SRGB_GAMMA;
	return value >= breakpoint
		? (1 + OFFICIAL_SRGB_OFFSET) * value ** (1 / OFFICIAL_SRGB_GAMMA) - OFFICIAL_SRGB_OFFSET
		: value * reciprocalSlope;
}

function targetY(encodedRgb) {
	return LINEAR_REC709_TO_XYZ[1].reduce(
		(sum, weight, index) => sum + weight * officialSrgbDecode(encodedRgb[index]),
		0,
	);
}

function quantizedCodes(encodedRgb) {
	return encodedRgb.map((value) =>
		Number.isFinite(value) ? Math.round(255 * Math.min(1, Math.max(0, value))) : null,
	);
}

/** Quantize final encoded RGB with the frozen normalized RGBA8 rule. */
export function quantizeFinalRgba8(encodedRgba) {
	requireCondition(
		Array.isArray(encodedRgba) && encodedRgba.length === 4,
		'Final RGBA8 quantization requires four channels.',
	);
	return encodedRgba.map((value) =>
		Number.isFinite(value) ? Math.round(255 * Math.min(1, Math.max(0, value))) : null,
	);
}

function codeTargetY(codes) {
	if (!codes.every((value) => Number.isInteger(value) && value >= 0 && value <= 255)) return null;
	return targetY(codes.map((value) => value / 255));
}

/** Build exact pinned-moncurve and Q8 branch probes in display-linear units. */
export function buildEncodingBranchProbes(fixture) {
	const sentinels = fixture.outputContract?.sentinelLinearValues;
	requireCondition(Array.isArray(sentinels) && sentinels.length > 0, 'Encoding sentinels are missing.');
	const records = sentinels.map((value, index) => {
		requireCondition(Number.isFinite(value) && value >= 0, `Encoding sentinel ${index} is invalid.`);
		return {
			id: `encoding-sentinel:${index}`,
			kind: 'encoding-sentinel',
			linearValue: value,
			expectedEncoded: officialSrgbEncode(value),
			sceneRgb: [value, value, value],
		};
	});
	const encodedDelta = 2 ** -16;
	for (let code = 0; code < 255; code += 1) {
		const threshold = (code + 0.5) / 255;
		for (const branch of [-1, 1]) {
			const expectedEncoded = threshold + branch * encodedDelta;
			const linearValue = officialSrgbDecode(expectedEncoded);
			records.push({
				id: `quantizer-branch:${code}:${branch}`,
				kind: 'quantizer-branch',
				code,
				branch,
				linearValue,
				expectedEncoded,
				expectedCode: branch < 0 ? code : code + 1,
				sceneRgb: [linearValue, linearValue, linearValue],
			});
		}
	}
	return records;
}

/** Gate the official CTL moncurve and the exact declared Q8 branch rule. */
export function evaluateEncodingBranchProbes(records, output, tolerance = 2e-6) {
	requireCondition(records.length === output.length && records.length > 0, 'Encoding branch output is incomplete.');
	let nonFiniteCount = 0;
	let encodingMismatchCount = 0;
	let quantizerMismatchCount = 0;
	let maximumAbsoluteError = 0;
	for (let index = 0; index < records.length; index += 1) {
		const actual = output[index][0];
		if (!Number.isFinite(actual)) {
			nonFiniteCount += 1;
			continue;
		}
		const error = Math.abs(actual - records[index].expectedEncoded);
		maximumAbsoluteError = Math.max(maximumAbsoluteError, error);
		if (error > tolerance) encodingMismatchCount += 1;
		if (records[index].kind === 'quantizer-branch') {
			const actualCode = quantizedCodes([actual])[0];
			if (actualCode !== records[index].expectedCode) quantizerMismatchCount += 1;
		}
	}
	let exactHalfFailureCount = 0;
	for (let code = 0; code < 255; code += 1) {
		const threshold = (code + 0.5) / 255;
		if (quantizedCodes([threshold])[0] !== code + 1) exactHalfFailureCount += 1;
	}
	return {
		passed:
			nonFiniteCount === 0 &&
			encodingMismatchCount === 0 &&
			quantizerMismatchCount === 0 &&
			exactHalfFailureCount === 0,
		probeCount: records.length,
		encodingSentinelCount: records.filter((record) => record.kind === 'encoding-sentinel').length,
		quantizerBranchCount: records.filter((record) => record.kind === 'quantizer-branch').length,
		exactHalfCount: 255,
		tolerance,
		maximumAbsoluteError: finiteMetric(maximumAbsoluteError),
		nonFiniteCount,
		encodingMismatchCount,
		quantizerMismatchCount,
		exactHalfFailureCount,
		encoding: 'Pinned ACES moncurve_inv/moncurve_fwd with gamma 2.4 and offset 0.055.',
		quantizer: 'Q8(x)=round(255*clamp(x,0,1)); exact half thresholds round upward.',
	};
}

function float32OrderedBits(value) {
	const buffer = new ArrayBuffer(4);
	const view = new DataView(buffer);
	view.setFloat32(0, Math.fround(value), false);
	const bits = view.getUint32(0, false);
	return (bits & 0x80000000) !== 0 ? 0x80000000 - (bits & 0x7fffffff) : 0x80000000 + bits;
}

/** Compare the exact CTL result with the pinned OCIO built-in implementation. */
export function evaluateOcioParity(ctl, ocio, fixture) {
	requireCondition(ctl.length === ocio.length, 'CTL and OCIO grids differ in length.');
	const fixtureTolerance = fixture.diagnosticTolerances?.cpuReferenceTransform ?? {};
	const tolerance = {
		absolute: Math.max(Number(fixtureTolerance.absolute ?? 0), CTL_OCIO_ABSOLUTE_TOLERANCE),
		relative: Number(fixtureTolerance.relative ?? 2e-5),
		maximumUlp: Number(fixtureTolerance.maximumUlp ?? 256),
	};
	const absolute = Number(tolerance.absolute);
	const relative = Number(tolerance.relative);
	const maximumUlpAllowed = Number(tolerance.maximumUlp ?? 256);
	const waiverMultiplier = Number(fixture.diagnosticTolerances?.nearZeroUlpWaiverMultiplier ?? 8);
	let maximumAbsoluteError = 0;
	let maximumRelativeError = 0;
	let maximumUlp = 0;
	let valueFailures = 0;
	let ulpFailures = 0;
	let nonFiniteValueCount = 0;
	for (let index = 0; index < ctl.length; index += 1) {
		for (let channel = 0; channel < 3; channel += 1) {
			const left = ctl[index][channel];
			const right = ocio[index][channel];
			if (!(Number.isFinite(left) && Number.isFinite(right))) {
				nonFiniteValueCount += 1;
				valueFailures += 1;
				continue;
			}
			const error = Math.abs(left - right);
			const scale = Math.max(Math.abs(left), Math.abs(right));
			const permitted = absolute + relative * scale;
			const ulp = Math.abs(float32OrderedBits(left) - float32OrderedBits(right));
			maximumAbsoluteError = Math.max(maximumAbsoluteError, error);
			maximumRelativeError = Math.max(maximumRelativeError, scale > 0 ? error / scale : 0);
			maximumUlp = Math.max(maximumUlp, ulp);
			if (error > permitted) valueFailures += 1;
			if (
				ulp > maximumUlpAllowed &&
				!(Math.abs(left) <= waiverMultiplier * permitted && Math.abs(right) <= waiverMultiplier * permitted)
			) {
				ulpFailures += 1;
			}
		}
	}
	return {
		passed: valueFailures === 0 && ulpFailures === 0,
		absoluteTolerance: absolute,
		relativeTolerance: relative,
		maximumUlpAllowed,
		maximumAbsoluteError: finiteMetric(maximumAbsoluteError),
		maximumRelativeError: finiteMetric(maximumRelativeError),
		maximumUlp,
		nonFiniteValueCount,
		valueFailures,
		ulpFailures,
	};
}

/** Gate bounded official-CTL authority against sealed OCIO floats and Q8 codes. */
export function evaluateCtlOracleParity({records, ctl, ocio, ctlAp1, ocioAp1, fixture}) {
	const finalFloat = evaluateOcioParity(ctl, ocio, fixture);
	const ap1Float = evaluateOcioParity(ctlAp1, ocioAp1, fixture);
	let finalCodeMismatchCount = 0;
	let nonFiniteCodeInputCount = 0;
	const mismatchExamples = [];
	for (let index = 0; index < records.length; index += 1) {
		const ctlCodes = quantizedCodes(ctl[index].slice(0, 3));
		const ocioCodes = quantizedCodes(ocio[index].slice(0, 3));
		if ([...ctlCodes, ...ocioCodes].some((value) => value === null)) {
			nonFiniteCodeInputCount += 1;
			continue;
		}
		if (ctlCodes.some((value, channel) => value !== ocioCodes[channel])) {
			finalCodeMismatchCount += 1;
			if (mismatchExamples.length < 32) mismatchExamples.push({recordId: records[index].id, ctlCodes, ocioCodes});
		}
	}
	return {
		passed: finalFloat.passed && ap1Float.passed && finalCodeMismatchCount === 0 && nonFiniteCodeInputCount === 0,
		recordCount: records.length,
		selection:
			'Every record supplied by the caller is evaluated independently through the official CTL source-identity path and the pinned OCIO implementation; the caller owns and reports the exact frozen grid inventory.',
		finalFloat,
		unclampedAp1Float: ap1Float,
		finalQ8: {
			passed: finalCodeMismatchCount === 0 && nonFiniteCodeInputCount === 0,
			mismatchCount: finalCodeMismatchCount,
			nonFiniteCodeInputCount,
			examples: mismatchExamples,
		},
		claim: 'Official CTL remains the source-identity oracle; pinned OCIO is accepted only where this same-record float and exact-code comparison passes.',
	};
}

/** Evaluate finite/bounded output, official clamp masks, continuity, and tone order. */
export function evaluateSyntheticGrid(records, ctl, ap1, fixture) {
	requireCondition(records.length === ctl.length && ctl.length === ap1.length, 'Reference arrays differ in length.');
	const outputTolerance = 2e-6;
	let nonFiniteOutputCount = 0;
	let outOfBoundsCount = 0;
	let lowerClampComponentCount = 0;
	let upperClampComponentCount = 0;
	let negativeAp1RetainedCount = 0;
	let nonFiniteAp1Count = 0;
	const clampExamples = [];
	const clampMaskRows = [];
	for (let index = 0; index < records.length; index += 1) {
		let lowerMask = 0;
		let upperMask = 0;
		for (let channel = 0; channel < 3; channel += 1) {
			const output = ctl[index][channel];
			const unclampedAp1 = ap1[index][channel];
			if (!Number.isFinite(output)) nonFiniteOutputCount += 1;
			if (!Number.isFinite(unclampedAp1)) {
				nonFiniteAp1Count += 1;
				continue;
			}
			if (output < -outputTolerance || output > 1 + outputTolerance) outOfBoundsCount += 1;
			if (unclampedAp1 < 0) {
				lowerClampComponentCount += 1;
				negativeAp1RetainedCount += 1;
				lowerMask |= 1 << channel;
			}
			if (unclampedAp1 > 1024) {
				upperClampComponentCount += 1;
				upperMask |= 1 << channel;
			}
			if ((unclampedAp1 < 0 || unclampedAp1 > 1024) && clampExamples.length < 32) {
				clampExamples.push({recordId: records[index].id, channel, unclampedAp1});
			}
		}
		if (lowerMask !== 0 || upperMask !== 0) {
			clampMaskRows.push({recordId: records[index].id, lowerMask, upperMask});
		}
	}
	const neutral = records
		.map((record, index) => ({record, index}))
		.filter(({record}) => record.kind === 'neutral' && record.neutralLevel >= 0 && record.neutralLevel <= 1024)
		.sort((left, right) => left.record.neutralLevel - right.record.neutralLevel);
	const uniqueNeutral = neutral.filter(
		(entry, index) => index === 0 || entry.record.neutralLevel !== neutral[index - 1].record.neutralLevel,
	);
	let neutralDecreaseCount = 0;
	let neutralPlateauCount = 0;
	let minimumNeutralDelta = Number.POSITIVE_INFINITY;
	for (let index = 1; index < uniqueNeutral.length; index += 1) {
		const delta = targetY(ctl[uniqueNeutral[index].index]) - targetY(ctl[uniqueNeutral[index - 1].index]);
		if (Number.isFinite(delta)) minimumNeutralDelta = Math.min(minimumNeutralDelta, delta);
		else neutralDecreaseCount += 1;
		if (delta < -outputTolerance) neutralDecreaseCount += 1;
		if (!(delta > 0)) neutralPlateauCount += 1;
	}
	const aboveForwardLimit = records
		.map((record, index) => ({record, index}))
		.filter(({record}) => record.kind === 'neutral' && record.neutralLevel >= 1024)
		.sort((left, right) => left.record.neutralLevel - right.record.neutralLevel)
		.filter(
			(entry, index, entries) =>
				index === 0 || entry.record.neutralLevel !== entries[index - 1].record.neutralLevel,
		);
	let aboveForwardLimitDecreaseCount = 0;
	let minimumAboveForwardLimitDelta = Number.POSITIVE_INFINITY;
	for (let index = 1; index < aboveForwardLimit.length; index += 1) {
		const delta = targetY(ctl[aboveForwardLimit[index].index]) - targetY(ctl[aboveForwardLimit[index - 1].index]);
		if (Number.isFinite(delta)) minimumAboveForwardLimitDelta = Math.min(minimumAboveForwardLimitDelta, delta);
		else aboveForwardLimitDecreaseCount += 1;
		if (delta < -outputTolerance) aboveForwardLimitDecreaseCount += 1;
	}
	const seamGroups = new Map();
	for (let index = 0; index < records.length; index += 1) {
		const record = records[index];
		if (!record.seamId) continue;
		const group = seamGroups.get(record.seamId) ?? new Map();
		const pair = group.get(record.deltaMultiplier) ?? {};
		pair[record.sign < 0 ? 'minus' : 'plus'] = ctl[index];
		group.set(record.deltaMultiplier, pair);
		seamGroups.set(record.seamId, group);
	}
	const continuityObservations = [];
	for (const [seamId, group] of seamGroups) {
		const distances = DECISION_SEAM_DELTAS.map((deltaMultiplier) => {
			const pair = group.get(deltaMultiplier);
			requireCondition(pair?.minus && pair?.plus, `Continuity seam ${seamId} is incomplete.`);
			const distance = Math.max(
				...pair.minus.slice(0, 3).map((value, channel) => Math.abs(value - pair.plus[channel])),
			);
			return {
				deltaMultiplier,
				distance: finiteMetric(distance),
			};
		});
		let passed = distances.every((entry) => entry.distance !== null);
		for (let index = 1; index < distances.length; index += 1) {
			passed &&= distances[index].distance <= 0.5 * distances[index - 1].distance + 4 * outputTolerance;
		}
		continuityObservations.push({seamId, distances, passed});
	}
	const continuityPassed = continuityObservations.every((entry) => entry.passed);
	const officialClamp = {
		passed: nonFiniteAp1Count === 0 && lowerClampComponentCount > 0 && upperClampComponentCount > 0,
		ap1LowerLimit: 0,
		ap1UpperLimit: 1024,
		lowerClampComponentCount,
		upperClampComponentCount,
		negativeAp1RetainedCount,
		nonFiniteAp1Count,
		examples: clampExamples,
		maskEncoding: 'Three low bits are R/G/B; omitted records have zero lower and upper masks.',
		maskRows: clampMaskRows,
		claim: 'Masks are measured before the unchanged official core clamp; negative AP1 proves no project pre-clamp.',
	};
	return {
		passed:
			nonFiniteOutputCount === 0 &&
			nonFiniteAp1Count === 0 &&
			outOfBoundsCount === 0 &&
			officialClamp.passed &&
			neutralDecreaseCount === 0 &&
			neutralPlateauCount === 0 &&
			aboveForwardLimitDecreaseCount === 0 &&
			continuityPassed,
		finiteAndBounded: {
			passed: nonFiniteOutputCount === 0 && outOfBoundsCount === 0,
			nonFiniteOutputCount,
			outOfBoundsCount,
		},
		officialClamp,
		neutralToneOrder: {
			passed: neutralDecreaseCount === 0 && neutralPlateauCount === 0,
			sampleCount: uniqueNeutral.length,
			neutralDecreaseCount,
			neutralPlateauCount,
			minimumNeutralDelta: finiteMetric(minimumNeutralDelta),
			domain: fixture.syntheticReferenceGrid?.strictMonotonicDomain ?? [0, 1024],
		},
		aboveForwardLimitToneOrder: {
			passed: aboveForwardLimitDecreaseCount === 0,
			sampleCount: aboveForwardLimit.length,
			decreaseCount: aboveForwardLimitDecreaseCount,
			minimumDelta: finiteMetric(minimumAboveForwardLimitDelta),
			policy:
				fixture.syntheticReferenceGrid?.aboveOfficialForwardLimitPolicy ??
				'continuous-nondecreasing-plateau-permitted',
		},
		continuity: {passed: continuityPassed, tolerance: outputTolerance, observations: continuityObservations},
	};
}

/** Gate model J, M, and h continuity across complete-core signed-RGB seams. */
export function evaluateModelContinuity(records, modelOutput, outputTolerance = 2e-6) {
	requireCondition(records.length === modelOutput.length, 'Model-stage probe output is incomplete.');
	const groups = new Map();
	let nonFiniteCount = 0;
	for (let index = 0; index < records.length; index += 1) {
		const record = records[index];
		if (!record.seamId) continue;
		if (!modelOutput[index].slice(0, 3).every(Number.isFinite)) nonFiniteCount += 1;
		const group = groups.get(record.seamId) ?? new Map();
		const pair = group.get(record.deltaMultiplier) ?? {};
		pair[record.sign < 0 ? 'minus' : 'plus'] = modelOutput[index];
		group.set(record.deltaMultiplier, pair);
		groups.set(record.seamId, group);
	}
	const requiredSeams = ['negative-blue', 'upper-gamut-color', 'official-forward-limit'];
	const observations = [];
	for (const seamId of requiredSeams) {
		const group = groups.get(seamId);
		requireCondition(group, `Model-stage seam ${seamId} is missing.`);
		const distances = DECISION_SEAM_DELTAS.map((deltaMultiplier) => {
			const pair = group.get(deltaMultiplier);
			requireCondition(pair?.minus && pair?.plus, `Model-stage seam ${seamId} is incomplete.`);
			const components = [
				Math.abs(pair.minus[0] - pair.plus[0]),
				Math.abs(pair.minus[1] - pair.plus[1]),
				circularHueDistance(pair.minus[2], pair.plus[2]),
			];
			return {deltaMultiplier, components: components.map(finiteMetric)};
		});
		let passed = distances.every((entry) => entry.components.every((value) => value !== null));
		for (let index = 1; index < distances.length; index += 1) {
			for (let component = 0; component < 3; component += 1) {
				passed &&=
					distances[index].components[component] <=
					0.5 * distances[index - 1].components[component] + 4 * outputTolerance;
			}
		}
		observations.push({seamId, distances, passed});
	}
	return {
		passed: nonFiniteCount === 0 && observations.every((entry) => entry.passed),
		nonFiniteCount,
		outputTolerance,
		observations,
		claim: 'J, M, and circular h are observed after official AP1 clamping plus RGB_to_JMh and tone/chroma compression, before official gamut compression.',
	};
}

/** Validate all exact display-cusp and reach rows emitted by the pinned core. */
export function evaluateOfficialTableProbe({cuspRows, reachRows}) {
	requireCondition(
		cuspRows.length === 362 && reachRows.length === 362,
		'Official ACES table probe must emit both complete 362-row padded tables.',
	);
	let nonFiniteCount = 0;
	let nonPositiveCount = 0;
	let nonIncreasingCuspHueCount = 0;
	let maximumCuspHueIdentityResidual = 0;
	let maximumReachHueIdentityResidual = 0;
	let maximumLimitJResidual = 0;
	let maximumForwardLimitResidual = 0;
	for (let index = 0; index < cuspRows.length; index += 1) {
		const [hue, cuspJ, cuspM, cuspHue] = cuspRows[index];
		const [reachHue, limitJ, reachM, forwardLimit] = reachRows[index];
		if (![hue, cuspJ, cuspM, cuspHue, reachHue, limitJ, reachM, forwardLimit].every(Number.isFinite)) {
			nonFiniteCount += 1;
		}
		if (!(cuspJ > 0 && cuspM > 0 && limitJ > 0 && reachM > 0 && forwardLimit > 0)) nonPositiveCount += 1;
		if (index > 0 && !(hue > cuspRows[index - 1][0])) nonIncreasingCuspHueCount += 1;
		if ([hue, cuspHue].every(Number.isFinite))
			maximumCuspHueIdentityResidual = Math.max(
				maximumCuspHueIdentityResidual,
				circularHueDistance(hue, cuspHue),
			);
		if (Number.isFinite(reachHue))
			maximumReachHueIdentityResidual = Math.max(
				maximumReachHueIdentityResidual,
				Math.abs(reachHue - (index - 1)),
			);
		if (Number.isFinite(limitJ) && Number.isFinite(reachRows[1][1]))
			maximumLimitJResidual = Math.max(maximumLimitJResidual, Math.abs(limitJ - reachRows[1][1]));
		if (Number.isFinite(forwardLimit))
			maximumForwardLimitResidual = Math.max(maximumForwardLimitResidual, Math.abs(forwardLimit - 1024));
	}
	const rawWrapResidual = Math.max(
		Math.abs(cuspRows[0][1] - cuspRows[360][1]),
		Math.abs(cuspRows[0][2] - cuspRows[360][2]),
		Math.abs(cuspRows[361][1] - cuspRows[1][1]),
		Math.abs(cuspRows[361][2] - cuspRows[1][2]),
		Math.abs(cuspRows[0][0] + 360 - cuspRows[360][0]),
		Math.abs(cuspRows[1][0] + 360 - cuspRows[361][0]),
		Math.abs(reachRows[0][2] - reachRows[360][2]),
		Math.abs(reachRows[361][2] - reachRows[1][2]),
	);
	const maximumWrapResidual = finiteMetric(rawWrapResidual);
	return {
		passed:
			nonFiniteCount === 0 &&
			nonPositiveCount === 0 &&
			nonIncreasingCuspHueCount === 0 &&
			maximumCuspHueIdentityResidual <= 1e-5 &&
			maximumReachHueIdentityResidual <= 1e-5 &&
			maximumLimitJResidual <= 1e-5 &&
			maximumForwardLimitResidual <= 1e-4 &&
			maximumWrapResidual !== null &&
			maximumWrapResidual <= 1e-4,
		rowCount: cuspRows.length + reachRows.length,
		cuspRowCount: cuspRows.length,
		reachRowCount: reachRows.length,
		nominalRowCountPerTable: 360,
		nonFiniteCount,
		nonPositiveCount,
		nonIncreasingCuspHueCount,
		maximumCuspHueIdentityResidual: finiteMetric(maximumCuspHueIdentityResidual),
		maximumReachHueIdentityResidual: finiteMetric(maximumReachHueIdentityResidual),
		maximumLimitJResidual: finiteMetric(maximumLimitJResidual),
		maximumForwardLimitResidual: finiteMetric(maximumForwardLimitResidual),
		maximumWrapResidual,
		cuspHueRange: [finiteMetric(cuspRows[0][0]), finiteMetric(cuspRows.at(-1)[0])],
		reachHueRange: [finiteMetric(reachRows[0][0]), finiteMetric(reachRows.at(-1)[0])],
		limitJMax: finiteMetric(reachRows[1][1]),
		forwardLimit: finiteMetric(reachRows[1][3]),
		claim: 'Rows are read directly from ODTParams.TABLE_hues, TABLE_gamut_cusps, TABLE_reach_M, limit_J_max, and the official tone-scale forward limit.',
	};
}

/** Build two-sided JMh probes at every generated nominal hue/cusp/reach row. */
export function buildOfficialTableBoundaryProbes({cuspRows, reachRows}) {
	requireCondition(
		cuspRows.length === 362 && reachRows.length === 362,
		'Cannot build boundaries without both complete padded tables.',
	);
	const records = [];
	const add = (seamId, center, axis) => {
		for (const deltaMultiplier of DECISION_SEAM_DELTAS) {
			const delta = deltaMultiplier * Math.max(1, Math.abs(center[axis]));
			for (const sign of [-1, 1]) {
				const sceneRgb = [...center];
				sceneRgb[axis] += sign * delta;
				records.push({
					id: `${seamId}:${deltaMultiplier}:${sign}`,
					kind: 'official-table-boundary',
					seamId,
					deltaMultiplier,
					sign,
					sceneRgb,
				});
			}
		}
	};
	for (let index = 1; index <= 360; index += 1) {
		const [hue, cuspJ, cuspM] = cuspRows[index];
		const [reachHue, limitJ, reachM] = reachRows[index];
		add(`table-${index}:hue`, [cuspJ, cuspM, hue], 2);
		add(`table-${index}:cusp-J`, [cuspJ, cuspM, hue], 0);
		add(`table-${index}:cusp-M`, [cuspJ, cuspM, hue], 1);
		add(`reach-${index}:hue`, [limitJ, reachM, reachHue], 2);
		add(`reach-${index}:J`, [limitJ, reachM, reachHue], 0);
		add(`reach-${index}:M`, [limitJ, reachM, reachHue], 1);
	}
	return records;
}

function circularHueDistance(left, right) {
	const raw = Math.abs(left - right) % 360;
	return Math.min(raw, 360 - raw);
}

/** Gate exact table-boundary gamut-core probes for finite continuous behavior. */
export function evaluateOfficialTableBoundaries(records, output, outputTolerance = 2e-6) {
	requireCondition(
		records.length === output.length && records.length > 0,
		'Official boundary probe output is incomplete.',
	);
	const groups = new Map();
	let nonFiniteCount = 0;
	for (let index = 0; index < records.length; index += 1) {
		if (!output[index].slice(0, 3).every(Number.isFinite)) nonFiniteCount += 1;
		const group = groups.get(records[index].seamId) ?? new Map();
		const pair = group.get(records[index].deltaMultiplier) ?? {};
		pair[records[index].sign < 0 ? 'minus' : 'plus'] = output[index];
		group.set(records[index].deltaMultiplier, pair);
		groups.set(records[index].seamId, group);
	}
	const observations = [];
	for (const [seamId, group] of groups) {
		const distances = DECISION_SEAM_DELTAS.map((deltaMultiplier) => {
			const pair = group.get(deltaMultiplier);
			requireCondition(pair?.minus && pair?.plus, `Official boundary ${seamId} is incomplete.`);
			const distance = Math.max(
				Math.abs(pair.minus[0] - pair.plus[0]),
				Math.abs(pair.minus[1] - pair.plus[1]),
				circularHueDistance(pair.minus[2], pair.plus[2]),
			);
			return {
				deltaMultiplier,
				distance: finiteMetric(distance),
			};
		});
		let passed = distances.every((entry) => entry.distance !== null);
		for (let index = 1; index < distances.length; index += 1) {
			passed &&= distances[index].distance <= 0.5 * distances[index - 1].distance + 4 * outputTolerance;
		}
		observations.push({seamId, distances, passed});
	}
	return {
		passed: nonFiniteCount === 0 && observations.every((entry) => entry.passed),
		probeCount: records.length,
		boundaryCount: observations.length,
		nonFiniteCount,
		failedBoundaryCount: observations.filter((entry) => !entry.passed).length,
		outputTolerance,
		observations,
		claim: 'Every generated nominal hue, display cusp J/M, and reach-M row is crossed on both sides through official gamut_compress_fwd.',
	};
}

/** Evaluate complete-target and Q8 ordering for the sealed pair ledger. */
export function evaluatePairDecision({
	records,
	ctl,
	measuredSamples,
	rawOrdering,
	fixture,
	requiredLanes = ['cpu', 'gpu'],
}) {
	requireCondition(
		Array.isArray(requiredLanes) &&
			requiredLanes.length > 0 &&
			requiredLanes.every((lane) => lane === 'cpu' || lane === 'gpu'),
		'Pair decision lanes are invalid.',
	);
	const outputByKey = new Map();
	for (let index = 0; index < records.length; index += 1) {
		if (records[index].sampleKey) outputByKey.set(records[index].sampleKey, ctl[index].slice(0, 3));
	}
	const samplesByKey = new Map(measuredSamples.map((sample) => [sample.key, sample]));
	const designated = new Set(fixture.pairDecision?.designatedLowSunConditionIds ?? []);
	const comparisons = rawOrdering?.observations ?? rawOrdering?.comparisons;
	requireCondition(
		Array.isArray(comparisons) && comparisons.length > 0,
		'Paired evidence has no sealed raw-ordering observations.',
	);
	const observations = [];
	for (const comparison of comparisons) {
		const conditionId = comparison.conditionId;
		const viewportId = comparison.viewportId;
		const lane = comparison.lane;
		requireCondition(requiredLanes.includes(lane), `Sealed pair ${comparison.id} has an unauthorized lane.`);
		const diskKey = sampleKey(conditionId, viewportId, comparison.diskSampleId, lane);
		const skyKey = sampleKey(conditionId, viewportId, comparison.skySampleId, lane);
		const diskOutput = outputByKey.get(diskKey);
		const skyOutput = outputByKey.get(skyKey);
		requireCondition(
			diskOutput && skyOutput,
			`Cannot bind sealed pair ${diskKey} > ${skyKey} to transformed samples.`,
		);
		const diskTargetYRaw = targetY(diskOutput);
		const skyTargetYRaw = targetY(skyOutput);
		const outputFinite = [diskTargetYRaw, skyTargetYRaw, ...diskOutput, ...skyOutput].every(Number.isFinite);
		const diskTargetY = finiteMetric(diskTargetYRaw);
		const skyTargetY = finiteMetric(skyTargetYRaw);
		const diskCodes = quantizedCodes(diskOutput);
		const skyCodes = quantizedCodes(skyOutput);
		const diskCodeTargetY = codeTargetY(diskCodes);
		const skyCodeTargetY = codeTargetY(skyCodes);
		const isDesignated = designated.has(conditionId);
		const targetOrderPassed = outputFinite && diskTargetY > skyTargetY;
		const quantizedPassed =
			outputFinite &&
			(!isDesignated ||
				(diskCodeTargetY !== null &&
					skyCodeTargetY !== null &&
					diskCodes.some((value, index) => value !== skyCodes[index]) &&
					diskCodeTargetY > skyCodeTargetY));
		observations.push({
			id: comparison.id,
			lane,
			conditionId,
			family: comparison.family,
			viewportId,
			diskSampleId: comparison.diskSampleId,
			skySampleId: comparison.skySampleId,
			partition: samplesByKey.get(diskKey)?.partition,
			diskTargetY,
			skyTargetY,
			diskCodes,
			skyCodes,
			designatedLowSun: isDesignated,
			targetOrderPassed,
			quantizedPassed,
			passed: targetOrderPassed && quantizedPassed,
		});
	}
	const radialObservations = [];
	const groups = new Map();
	for (const sample of measuredSamples) {
		const orientations = sample.orientation === 'center' ? ['zenithward', 'equal-elevation'] : [sample.orientation];
		for (const orientation of orientations) {
			const key = `${sample.conditionId}|${sample.viewportId}|${sample.lane}|${orientation}`;
			const group = groups.get(key) ?? [];
			group.push(sample);
			groups.set(key, group);
		}
	}
	const requiredGroups = new Map();
	const circumsolarCount = fixture.sampling?.circumsolarOffsetsDegrees?.length ?? 0;
	for (const condition of fixtureConditions(fixture)) {
		for (const viewport of fixture.viewports ?? []) {
			for (const lane of requiredLanes) {
				for (const orientation of condition.radialOrientations ?? []) {
					const groupId = `${condition.id}|${viewport.id}|${lane}|${orientation}`;
					requiredGroups.set(groupId, 1 + circumsolarCount + (orientation === 'zenithward' ? 1 : 0));
				}
			}
		}
	}
	for (const [groupId, expectedSampleCount] of requiredGroups) {
		const group = groups.get(groupId);
		requireCondition(
			group?.length === expectedSampleCount,
			`Radial group ${groupId} has incomplete sample coverage.`,
		);
		group.sort((left, right) => left.angularOffsetRadians - right.angularOffsetRadians);
		for (let index = 1; index < group.length; index += 1) {
			const inner = group[index - 1];
			const outer = group[index];
			const rawDelta = inner.rawY - outer.rawY;
			const outputDeltaRaw = targetY(outputByKey.get(inner.key)) - targetY(outputByKey.get(outer.key));
			const outputDelta = finiteMetric(outputDeltaRaw);
			const rawPlateau = Math.abs(rawDelta) <= 1e-12;
			const outputTolerance = 2e-6;
			radialObservations.push({
				groupId,
				innerSampleId: inner.sampleId,
				outerSampleId: outer.sampleId,
				rawDelta,
				outputDelta,
				rawPlateau,
				passed:
					outputDelta !== null &&
					(rawPlateau ? outputDelta >= -outputTolerance : Math.sign(outputDelta) === Math.sign(rawDelta)),
			});
		}
	}
	const calibration = observations.filter((entry) => entry.partition === 'calibration');
	const holdout = observations.filter((entry) => entry.partition === 'holdout');
	const pairPassed = observations.every((entry) => entry.passed);
	const radialPassed = radialObservations.every((entry) => entry.passed);
	return {
		passed: pairPassed && radialPassed,
		comparisonCount: observations.length,
		calibration: {count: calibration.length, passed: calibration.every((entry) => entry.passed)},
		holdout: {count: holdout.length, passed: holdout.every((entry) => entry.passed)},
		targetOrdering: {passed: observations.every((entry) => entry.targetOrderPassed)},
		quantization: {
			passed: observations.every((entry) => entry.quantizedPassed),
			quantizer: 'Q8(x)=round(255*clamp(x,0,1))',
			encoding: 'official sRGB piecewise CTL codes stored directly',
		},
		radial: {
			passed: radialPassed,
			groupCount: requiredGroups.size,
			observationCount: radialObservations.length,
			expectedObservationCount: [...requiredGroups.values()].reduce((sum, count) => sum + count - 1, 0),
			observations: radialObservations,
		},
		observations,
	};
}

/** Report the optional matched Bruneton input contract without inventing data. */
export function evaluateBrunetonNonRegression(records, ctl, brunetonInputs, fixture) {
	const outputById = new Map(records.map((record, index) => [record.id, ctl[index].slice(0, 3)]));
	const rgbResiduals = [];
	const physicalUvDistances = [];
	const physicalRelativeYErrors = [];
	const targetUvDistances = [];
	const targetRelativeYErrors = [];
	const channelResiduals = [[], [], []];
	let nonFiniteOutputCount = 0;
	const uv = (xyz) => {
		const denominator = xyz[0] + 15 * xyz[1] + 3 * xyz[2];
		return denominator > 0 ? [(4 * xyz[0]) / denominator, (9 * xyz[1]) / denominator] : [0, 0];
	};
	for (const pair of brunetonInputs.pairs) {
		const reference = outputById.get(pair.referenceId);
		const production = outputById.get(pair.productionId);
		requireCondition(reference && production, `Transformed Bruneton pair ${pair.key} is missing.`);
		const referencePhysicalUv = uv(pair.referenceXyz);
		const productionPhysicalUv = uv(pair.productionXyz);
		physicalUvDistances.push(
			Math.hypot(
				productionPhysicalUv[0] - referencePhysicalUv[0],
				productionPhysicalUv[1] - referencePhysicalUv[1],
			),
		);
		physicalRelativeYErrors.push(
			Math.abs(pair.productionXyz[1] - pair.referenceXyz[1]) / Math.max(pair.referenceXyz[1], Number.EPSILON),
		);
		if (![...reference, ...production].every(Number.isFinite)) {
			nonFiniteOutputCount += 1;
			continue;
		}
		rgbResiduals.push(...production.map((value, channel) => value - reference[channel]));
		for (let channel = 0; channel < 3; channel += 1) {
			channelResiduals[channel].push(production[channel] - reference[channel]);
		}
		const referenceLinear = reference.map(officialSrgbDecode);
		const productionLinear = production.map(officialSrgbDecode);
		const referenceXyz = LINEAR_REC709_TO_XYZ.map((row) =>
			row.reduce((sum, value, channel) => sum + value * referenceLinear[channel], 0),
		);
		const productionXyz = LINEAR_REC709_TO_XYZ.map((row) =>
			row.reduce((sum, value, channel) => sum + value * productionLinear[channel], 0),
		);
		const referenceUv = uv(referenceXyz);
		const productionUv = uv(productionXyz);
		targetUvDistances.push(Math.hypot(productionUv[0] - referenceUv[0], productionUv[1] - referenceUv[1]));
		targetRelativeYErrors.push(
			Math.abs(productionXyz[1] - referenceXyz[1]) / Math.max(referenceXyz[1], Number.EPSILON),
		);
	}
	const mean = (values) =>
		values.length > 0 ? values.reduce((sum, value) => sum + value, 0) / values.length : Number.NaN;
	const metrics = {
		rgbRmse: finiteMetric(Math.sqrt(mean(rgbResiduals.map((value) => value ** 2)))),
		meanUPrimeVPrimeDistance: finiteMetric(mean(physicalUvDistances)),
		maximumUPrimeVPrimeDistance: finiteMetric(Math.max(...physicalUvDistances)),
		meanAbsoluteRelativeLuminanceError: finiteMetric(mean(physicalRelativeYErrors)),
	};
	const transformedTargetMetrics = {
		meanUPrimeVPrimeDistance: finiteMetric(mean(targetUvDistances)),
		maximumUPrimeVPrimeDistance: finiteMetric(Math.max(...targetUvDistances)),
		meanAbsoluteRelativeLuminanceError: finiteMetric(mean(targetRelativeYErrors)),
		maximumDisplayChannelError: finiteMetric(Math.max(...rgbResiduals.map(Math.abs))),
		meanDisplayChannelBias: channelResiduals.map((values) => finiteMetric(mean(values))),
	};
	const limits = fixture.brunetonNonRegression;
	requireCondition(
		limits &&
			[
				limits.rgbRmseMaximum,
				limits.meanUPrimeVPrimeDistanceMaximum,
				limits.meanAbsoluteRelativeLuminanceErrorMaximum,
			].every(Number.isFinite),
		'Frozen Bruneton non-regression limits are missing.',
	);
	const checks = {
		rgbRmse: {
			actual: metrics.rgbRmse,
			maximum: limits.rgbRmseMaximum,
			passed: metrics.rgbRmse !== null && metrics.rgbRmse <= limits.rgbRmseMaximum,
		},
		meanUPrimeVPrimeDistance: {
			actual: metrics.meanUPrimeVPrimeDistance,
			maximum: limits.meanUPrimeVPrimeDistanceMaximum,
			passed:
				metrics.meanUPrimeVPrimeDistance !== null &&
				metrics.meanUPrimeVPrimeDistance <= limits.meanUPrimeVPrimeDistanceMaximum,
		},
		meanAbsoluteRelativeLuminanceError: {
			actual: metrics.meanAbsoluteRelativeLuminanceError,
			maximum: limits.meanAbsoluteRelativeLuminanceErrorMaximum,
			passed:
				metrics.meanAbsoluteRelativeLuminanceError !== null &&
				metrics.meanAbsoluteRelativeLuminanceError <= limits.meanAbsoluteRelativeLuminanceErrorMaximum,
		},
	};
	return {
		passed: nonFiniteOutputCount === 0 && Object.values(checks).every((check) => check.passed),
		evaluated: true,
		pairCount: brunetonInputs.pairs.length,
		nonFiniteOutputCount,
		metrics,
		transformedTargetMetrics,
		checks,
		metricDomains: {
			rgbRmse: 'Final official sRGB-piecewise CTL output; both matched inputs use the identical fixed transform.',
			meanUPrimeVPrimeDistance: 'Physical CIE XYZ projected from the checksum-sealed spectra, matching run 235.',
			meanAbsoluteRelativeLuminanceError:
				'Physical CIE Y projected from the checksum-sealed spectra, matching run 235.',
			transformedTargetMetrics:
				'Decoded final target output, reported without comparison to the physically defined run-235 bounds.',
		},
		claim: 'Both checksum-sealed spectral inputs are independently projected and passed through the identical fixed-scale official CTL; every stored bound is evaluated in its canonical run-235 metric domain.',
	};
}

/** Reproduce and report the tracked strict Bruneton Figure-1 sky-color gate. */
export function evaluateTrackedBrunetonGate(brunetonInputs, strictFixture) {
	requireCondition(
		strictFixture?.schemaId === 'bruneton-b1-sky-color-gate-v1',
		'Strict Bruneton gate fixture is invalid.',
	);
	const requirements = strictFixture.requirements;
	requireCondition(
		requirements && Object.values(requirements).every(Number.isFinite),
		'Strict Bruneton gate limits are invalid.',
	);
	const displayResiduals = [];
	const channelResiduals = [[], [], []];
	const physicalUvDistances = [];
	const physicalRelativeYErrors = [];
	const uv = (xyz) => {
		const denominator = xyz[0] + 15 * xyz[1] + 3 * xyz[2];
		return denominator > 0 ? [(4 * xyz[0]) / denominator, (9 * xyz[1]) / denominator] : [0, 0];
	};
	const figureOne = (rgb) =>
		rgb.map((value) => Math.max(0, Math.min(1, 1 - Math.exp(-Math.max(value, 0) * FIXED_SCENE_SCALE))));
	for (const pair of brunetonInputs.pairs) {
		const referenceDisplay = figureOne(pair.referenceSceneRgb);
		const productionDisplay = figureOne(pair.productionSceneRgb);
		for (let channel = 0; channel < 3; channel += 1) {
			const residual = productionDisplay[channel] - referenceDisplay[channel];
			displayResiduals.push(residual);
			channelResiduals[channel].push(residual);
		}
		const referenceUv = uv(pair.referenceXyz);
		const productionUv = uv(pair.productionXyz);
		physicalUvDistances.push(Math.hypot(productionUv[0] - referenceUv[0], productionUv[1] - referenceUv[1]));
		physicalRelativeYErrors.push(
			Math.abs(pair.productionXyz[1] - pair.referenceXyz[1]) / Math.max(pair.referenceXyz[1], Number.EPSILON),
		);
	}
	const mean = (values) => values.reduce((sum, value) => sum + value, 0) / values.length;
	const metrics = {
		displayRgbRmse: Math.sqrt(mean(displayResiduals.map((value) => value ** 2))),
		maximumDisplayChannelError: Math.max(...displayResiduals.map(Math.abs)),
		meanDeltaUv: mean(physicalUvDistances),
		maximumDeltaUv: Math.max(...physicalUvDistances),
		meanRelativeLuminanceError: mean(physicalRelativeYErrors),
		maximumAbsoluteMeanDisplayChannelBias: Math.max(...channelResiduals.map((values) => Math.abs(mean(values)))),
	};
	const limits = {
		displayRgbRmse: requirements.displayRgbRmseMaximum,
		maximumDisplayChannelError: requirements.maximumDisplayChannelError,
		meanDeltaUv: requirements.meanDeltaUvMaximum,
		maximumDeltaUv: requirements.maximumDeltaUvMaximum,
		meanRelativeLuminanceError: requirements.meanRelativeLuminanceErrorMaximum,
		maximumAbsoluteMeanDisplayChannelBias: requirements.maximumAbsoluteMeanDisplayChannelBias,
	};
	const checks = Object.fromEntries(
		Object.keys(limits).map((key) => [
			key,
			{
				actual: metrics[key],
				maximum: limits[key],
				passed: metrics[key] !== null && metrics[key] <= limits[key],
			},
		]),
	);
	return {
		passed: Object.values(checks).every((check) => check.passed),
		reportedOnly: true,
		affectsOfflineCandidateAcceptance: false,
		pairCount: brunetonInputs.pairs.length,
		metrics,
		checks,
		claim: 'This exactly reproduces the tracked atmosphere-only Figure-1 gate and is reported separately; the frozen ACES decision uses the canonical three non-regression bounds.',
	};
}

let crcTable = null;
function crc32(bytes) {
	if (crcTable === null) {
		crcTable = Array.from({length: 256}, (_, value) => {
			let current = value;
			for (let bit = 0; bit < 8; bit += 1) current = current & 1 ? 0xedb88320 ^ (current >>> 1) : current >>> 1;
			return current >>> 0;
		});
	}
	let crc = 0xffffffff;
	for (const value of bytes) crc = crcTable[(crc ^ value) & 0xff] ^ (crc >>> 8);
	return (crc ^ 0xffffffff) >>> 0;
}

function pngChunk(type, data) {
	const typeBytes = Buffer.from(type, 'ascii');
	const result = Buffer.alloc(12 + data.length);
	result.writeUInt32BE(data.length, 0);
	typeBytes.copy(result, 4);
	data.copy(result, 8);
	result.writeUInt32BE(crc32(Buffer.concat([typeBytes, data])), 8 + data.length);
	return result;
}

/** Encode final sRGB-piecewise codes as a tagged 8-bit RGB PNG. */
export function encodeCandidatePng(outputRgba, width, height, rowOrigin) {
	requireCondition(outputRgba.length === width * height, 'Candidate frame dimensions are inconsistent.');
	const scanlines = Buffer.alloc(height * (1 + width * 3));
	for (let pngY = 0; pngY < height; pngY += 1) {
		const sourceY = rowOrigin === 'bottom-left' ? height - 1 - pngY : pngY;
		const rowOffset = pngY * (1 + width * 3);
		scanlines[rowOffset] = 0;
		for (let x = 0; x < width; x += 1) {
			const codes = quantizedCodes(outputRgba[sourceY * width + x]);
			for (let channel = 0; channel < 3; channel += 1)
				scanlines[rowOffset + 1 + x * 3 + channel] = codes[channel];
		}
	}
	const header = Buffer.alloc(13);
	header.writeUInt32BE(width, 0);
	header.writeUInt32BE(height, 4);
	header[8] = 8;
	header[9] = 2;
	return Buffer.concat([
		Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
		pngChunk('IHDR', header),
		pngChunk('sRGB', Buffer.from([0])),
		pngChunk('IDAT', deflateSync(scanlines, {level: 9})),
		pngChunk('IEND', Buffer.alloc(0)),
	]);
}

/** Losslessly package a GPU RGBA8 readback as a tagged 8-bit RGB PNG. */
export function encodeGpuRgba8Png(outputRgba8, width, height, rowOrigin) {
	requireCondition(outputRgba8.length === width * height * 4, 'GPU candidate frame dimensions are inconsistent.');
	requireCondition(rowOrigin === 'bottom-left' || rowOrigin === 'top-left', 'GPU candidate row origin is invalid.');
	const scanlines = Buffer.alloc(height * (1 + width * 3));
	for (let pngY = 0; pngY < height; pngY += 1) {
		const sourceY = rowOrigin === 'bottom-left' ? height - 1 - pngY : pngY;
		const rowOffset = pngY * (1 + width * 3);
		scanlines[rowOffset] = 0;
		for (let x = 0; x < width; x += 1) {
			const sourceOffset = (sourceY * width + x) * 4;
			const targetOffset = rowOffset + 1 + x * 3;
			for (let channel = 0; channel < 3; channel += 1) {
				scanlines[targetOffset + channel] = outputRgba8[sourceOffset + channel];
			}
		}
	}
	const header = Buffer.alloc(13);
	header.writeUInt32BE(width, 0);
	header.writeUInt32BE(height, 4);
	header[8] = 8;
	header[9] = 2;
	return Buffer.concat([
		Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
		pngChunk('IHDR', header),
		pngChunk('sRGB', Buffer.from([0])),
		pngChunk('IDAT', deflateSync(scanlines, {level: 9})),
		pngChunk('IEND', Buffer.alloc(0)),
	]);
}
