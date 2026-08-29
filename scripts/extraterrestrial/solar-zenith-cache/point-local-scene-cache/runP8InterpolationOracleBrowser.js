import {createB1W27DirectionDomain, resolveB1W27Stencil} from './b1PointLocalInputs.js';
import {executeZp3GpuRecurrence} from './PointLocalGpuRecurrence.js';
import {createSanJoseNauticalPocBuildRequest} from
	'../san-jose-nautical-cache-poc/compiler/createPocBuildRequest.js';
import {
	createCubedSphereW39DirectionDomain,
	flattenW39NodeIndex,
} from '../san-jose-nautical-cache-poc/domains/cubedSphereW39DirectionDomain.js';

const J_FIELDS = Object.freeze(['J1', 'J2', 'J3', 'J4']);
const L_FIELDS = Object.freeze(['L1', 'L2', 'L3']);
const AXIS_WAVELENGTHS = Object.freeze([0, 7, 14]);

function positionStencil(nodes, value) {
	if (value <= nodes[0].altitudeMeters) return [{index: 0, weight: 1}];
	if (value >= nodes.at(-1).altitudeMeters) return [{index: nodes.length - 1, weight: 1}];
	for (let index = 0; index < nodes.length - 1; index += 1) {
		const low = nodes[index].altitudeMeters;
		const high = nodes[index + 1].altitudeMeters;
		if (value <= high) {
			const fraction = (value - low) / (high - low);
			return fraction === 0 ? [{index, weight: 1}] : [
				{index, weight: 1 - fraction}, {index: index + 1, weight: fraction},
			];
		}
	}
	throw new Error('Altitude stencil was not resolved.');
}

function zenithStencil(nodes, value) {
	if (value <= nodes[0].solarZenithDegrees) return [{index: 0, weight: 1}];
	if (value >= nodes.at(-1).solarZenithDegrees) return [{index: nodes.length - 1, weight: 1}];
	for (let index = 0; index < nodes.length - 1; index += 1) {
		const low = nodes[index].solarZenithDegrees;
		const high = nodes[index + 1].solarZenithDegrees;
		if (value <= high) {
			const fraction = (value - low) / (high - low);
			return fraction === 0 ? [{index, weight: 1}] : [
				{index, weight: 1 - fraction}, {index: index + 1, weight: fraction},
			];
		}
	}
	throw new Error('Solar-zenith stencil was not resolved.');
}

function shiftedPositionDomain(base) {
	const nodes = base.nodes.map((node, index) => ({...node, index,
		altitudeMeters: index < base.nodes.length - 1
			? (node.altitudeMeters + base.nodes[index + 1].altitudeMeters) / 2
			: 60000}));
	return {...base, id: `${base.id}-midpoint-heldout-v1`, nodes};
}

function shiftedZenithDomain(base) {
	const nodes = base.nodes.map((node, index) => {
		const solarZenithDegrees = index < base.nodes.length - 1
			? (node.solarZenithDegrees + base.nodes[index + 1].solarZenithDegrees) / 2
			: 180;
		return {...node, index, solarZenithDegrees,
			solarElevationDegrees: 90 - solarZenithDegrees,
			muS: Math.cos(solarZenithDegrees * Math.PI / 180)};
	});
	return {...base, id: `${base.id}-midpoint-heldout-v1`, firstCenterDegrees: nodes[0].solarZenithDegrees,
		lastCenterDegrees: nodes.at(-1).solarZenithDegrees, nodes};
}

function quadraticPositionDomain(base) {
	const nodes = base.nodes.map((node, index) => ({...node, index,
		altitudeMeters: 60000 * (index / (base.nodes.length - 1)) ** 2}));
	return {...base, id: 'quadratic-near-ground-position-48-v1', nodes};
}

function adaptiveTerminatorZenithDomain(base) {
	const values = [];
	for (let value = 0.5; value < 85; value += 1.5) values.push(value);
	for (let value = 85; value <= 105; value += 0.25) values.push(value);
	for (let value = 106; value <= 179.5; value += 1.5) values.push(value);
	if (values.at(-1) !== 179.5) values.push(179.5);
	const nodes = values.map((solarZenithDegrees, index) => ({index, solarZenithDegrees,
		solarElevationDegrees: 90 - solarZenithDegrees,
		muS: Math.cos(solarZenithDegrees * Math.PI / 180)}));
	return {...base, id: 'adaptive-terminator-solar-zenith-v1', count: nodes.length,
		firstCenterDegrees: nodes[0].solarZenithDegrees,
		lastCenterDegrees: nodes.at(-1).solarZenithDegrees, spacingDegrees: null, nodes};
}

function requestWith(base, {id, position = base.transportSpec.domains.position,
	solarZenith = base.transportSpec.domains.solarZenith,
	outgoing = base.transportSpec.domains.outgoing, sourceScale = 1,
	ozoneScale = 1}) {
	const spectrum = {...base.transportSpec.domains.spectrum,
		channels: base.transportSpec.domains.spectrum.channels.map((channel) => ({...channel,
			sourceIrradianceDensityWattsPerSquareMeterPerNanometer:
				channel.sourceIrradianceDensityWattsPerSquareMeterPerNanometer * sourceScale}))};
	const ozone = base.transportSpec.atmosphere.ozone;
	return {id, transportSpec: {...base.transportSpec,
		id: `${base.transportSpec.id}-${id}`,
		domains: {...base.transportSpec.domains, position, solarZenith, outgoing, spectrum},
		atmosphere: {...base.transportSpec.atmosphere, ozone: {...ozone,
			crossSectionTable: {...ozone.crossSectionTable,
				values: ozone.crossSectionTable.values.map((value) => value * ozoneScale)}}}}};
}

function heldoutCases(base, w39) {
	const shiftedPositions = shiftedPositionDomain(base.transportSpec.domains.position);
	const definitions = [
		['near-ground-day', 0, 60, 0, 23, 19],
		['low-day-horizon', 1, 78, 0, 21, 20],
		['near-ground-terminator', 0, 90, 0, 20, 19],
		['upper-terminator', 8, 90, 4, 22, 18],
		['twilight-horizon', 1, 100, 0, 17, 20],
		['weak-blue-night', 12, 108, 4, 16, 22],
	];
	return definitions.map(([id, positionIndex, zenithIndex, face, u, v]) => {
		const outgoingIndex = flattenW39NodeIndex(face, u, v);
		return {id, positionIndex, zenithIndex,
			altitudeMeters: shiftedPositions.nodes[positionIndex].altitudeMeters,
			solarZenithDegrees: zenithIndex, outgoingIndex,
			outgoingDirection: w39.unitVectors[outgoingIndex]};
	});
}

function combinedCandidateProbes(cases, base, w27) {
	const position = base.transportSpec.domains.position.nodes;
	const zenith = base.transportSpec.domains.solarZenith.nodes;
	const probes = [];
	const weights = new Map();
	for (const item of cases) {
		const directions = resolveB1W27Stencil(item.outgoingDirection);
		let tap = 0;
		for (const p of positionStencil(position, item.altitudeMeters)) {
			for (const z of zenithStencil(zenith, item.solarZenithDegrees)) {
				for (let d = 0; d < directions.indices.length; d += 1) {
					const label = `${item.id}:${tap}`;
					probes.push({label, x: directions.indices[d], y: z.index * position.length + p.index});
					weights.set(label, p.weight * z.weight * directions.weights[d]);
					tap += 1;
				}
			}
		}
	}
	return {probes, weights, outgoingDomain: w27};
}

function exactOracleProbes(cases, positionCount) {
	return cases.map((item) => ({label: item.id, x: item.outgoingIndex,
		y: item.zenithIndex * positionCount + item.positionIndex}));
}

function internalCandidateProbes(cases, base, incomingIndex) {
	const position = base.transportSpec.domains.position.nodes;
	const zenith = base.transportSpec.domains.solarZenith.nodes;
	const probes = [];
	const weights = new Map();
	for (const item of cases) {
		let tap = 0;
		for (const p of positionStencil(position, item.altitudeMeters)) {
			for (const z of zenithStencil(zenith, item.solarZenithDegrees)) {
				const label = `${item.id}:${tap}`;
				probes.push({label, x: incomingIndex, y: z.index * position.length + p.index});
				weights.set(label, p.weight * z.weight);
				tap += 1;
			}
		}
	}
	return {probes, weights};
}

function fieldProbeMap(jProbes, lProbes) {
	return Object.fromEntries([...J_FIELDS.map((id) => [id, jProbes]),
		...L_FIELDS.map((id) => [id, lProbes])]);
}

async function executeVariant({gl, request, wavelengths, jProbes, lProbes, progress}) {
	const records = {};
	for (const wavelengthIndex of wavelengths) {
		await globalThis.pointLocalProgress?.(`${progress}-${wavelengthIndex}:start`);
		await executeZp3GpuRecurrence({gl, buildRequest: request, wavelengthIndex,
			fieldProbeCoordinates: fieldProbeMap(jProbes, lProbes),
			onFieldProbes: async ({fieldId, values}) => {
				records[fieldId] ??= {};
				records[fieldId][wavelengthIndex] = values;
			}, reportProgress: async (stage) => globalThis.pointLocalProgress?.(
				`${progress}-${wavelengthIndex}:${stage}`)});
	}
	return records;
}

function weightedValue(records, field, wavelengthIndex, caseId, weights) {
	return records[field][wavelengthIndex]
		.filter((item) => item.label.startsWith(`${caseId}:`))
		.reduce((sum, item) => sum + item.value * weights.get(item.label), 0);
}

function exactValue(records, field, wavelengthIndex, caseId) {
	return records[field][wavelengthIndex].find((item) => item.label === caseId).value;
}

function compareCombined({cases, wavelengths, candidate, oracle, jWeights, lWeights}) {
	return cases.map((item) => {
		const cumulative = wavelengths.map((wavelengthIndex) => ({wavelengthIndex,
			candidate: J_FIELDS.reduce((sum, field) => sum
				+ weightedValue(candidate, field, wavelengthIndex, item.id, jWeights), 0),
			oracle: J_FIELDS.reduce((sum, field) => sum
				+ exactValue(oracle, field, wavelengthIndex, item.id), 0)}));
		const orders = Object.fromEntries(J_FIELDS.map((field) => [field, wavelengths.map((wavelengthIndex) => ({wavelengthIndex,
			candidate: weightedValue(candidate, field, wavelengthIndex, item.id, jWeights),
			oracle: exactValue(oracle, field, wavelengthIndex, item.id)}))]));
		const internal = Object.fromEntries(L_FIELDS.map((field) => [field, wavelengths.map((wavelengthIndex) => ({wavelengthIndex,
			candidate: weightedValue(candidate, field, wavelengthIndex, item.id, lWeights),
			oracle: exactValue(oracle, field, wavelengthIndex, item.id)}))]));
		return {...item, cumulative, orders, internal};
	});
}

function summarizePairs(pairs) {
	let truthSquared = 0;
	let errorSquared = 0;
	let maximumRelative = 0;
	let exactZeroCount = 0;
	for (const {candidate, oracle} of pairs) {
		truthSquared += oracle * oracle;
		errorSquared += (candidate - oracle) ** 2;
		if (oracle === 0) exactZeroCount += candidate === 0 ? 1 : 0;
		else maximumRelative = Math.max(maximumRelative, Math.abs(candidate - oracle) / Math.abs(oracle));
	}
	return {relativeL2: truthSquared === 0 ? (errorSquared === 0 ? 0 : null)
		: Math.sqrt(errorSquared / truthSquared), maximumRelative, exactZeroCount,
		pairCount: pairs.length};
}

export async function runP8InterpolationOracleBrowser() {
	const canvas = document.createElement('canvas');
	const gl = canvas.getContext('webgl2', {alpha: false, antialias: false, depth: false,
		stencil: false, powerPreference: 'high-performance'});
	if (!gl || !gl.getExtension('EXT_color_buffer_float')) throw new Error('Real float WebGL2 is required.');
	const debug = gl.getExtension('WEBGL_debug_renderer_info');
	const base = createSanJoseNauticalPocBuildRequest();
	const w27 = createB1W27DirectionDomain();
	const w39 = createCubedSphereW39DirectionDomain({id: 'p8-heldout-w39-v1',
		frame: 'actual-point-source-relative'});
	const shiftedPosition = shiftedPositionDomain(base.transportSpec.domains.position);
	const shiftedZenith = shiftedZenithDomain(base.transportSpec.domains.solarZenith);
	const cases = heldoutCases(base, w39);
	const incomingIndex = 17;
	const candidateJ = combinedCandidateProbes(cases, base, w27);
	const candidateL = internalCandidateProbes(cases, base, incomingIndex);
	const oracleJ = exactOracleProbes(cases, shiftedPosition.count);
	const oracleL = cases.map((item) => ({label: item.id, x: incomingIndex,
		y: item.zenithIndex * shiftedPosition.count + item.positionIndex}));
	const wavelengths = Array.from({length: base.transportSpec.domains.spectrum.channelCount}, (_unused, index) => index);
	const candidateRequest = requestWith(base, {id: 'p8-canonical-w27', outgoing: w27});
	const oracleRequest = requestWith(base, {id: 'p8-shifted-w39', position: shiftedPosition,
		solarZenith: shiftedZenith, outgoing: w39});
	const candidate = await executeVariant({gl, request: candidateRequest, wavelengths,
		jProbes: candidateJ.probes, lProbes: candidateL.probes, progress: 'p8-candidate'});
	const oracle = await executeVariant({gl, request: oracleRequest, wavelengths,
		jProbes: oracleJ, lProbes: oracleL, progress: 'p8-oracle'});
	const comparisons = compareCombined({cases, wavelengths, candidate, oracle,
		jWeights: candidateJ.weights, lWeights: candidateL.weights});
	const cumulativeSummary = summarizePairs(comparisons.flatMap((item) => item.cumulative));
	const orderSummaries = Object.fromEntries(J_FIELDS.map((field) => [field,
		summarizePairs(comparisons.flatMap((item) => item.orders[field]))]));
	const internalSummaries = Object.fromEntries(L_FIELDS.map((field) => [field,
		summarizePairs(comparisons.flatMap((item) => item.internal[field]))]));
	return {schemaId: 'p8-heldout-shifted-grid-oracle-browser-v1',
		gpu: {api: gl.getParameter(gl.VERSION), renderer: debug
			? gl.getParameter(debug.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER)},
		domains: {candidate: {position: base.transportSpec.domains.position.id,
			solarZenith: base.transportSpec.domains.solarZenith.id, outgoing: w27.id},
			oracle: {position: shiftedPosition.id, solarZenith: shiftedZenith.id, outgoing: w39.id}},
		wavelengths, axisDiagnosticWavelengths: AXIS_WAVELENGTHS, incomingProbeIndex: incomingIndex,
		cases, comparisons, summaries: {cumulative: cumulativeSummary, orders: orderSummaries,
			internalRadiance: internalSummaries},
		claimBoundary: 'Held-out physical-node comparison against an independently rebuilt shifted-altitude, shifted-solar-zenith, W39 N4 GPU field; the oracle is shifted and direction-refined, not a continuum solution.'};
}

/** Isolate the position-grid and outgoing-grid contributions to the sealed combined comparison. */
export async function runP8AxisIsolationBrowser() {
	const canvas = document.createElement('canvas');
	const gl = canvas.getContext('webgl2', {alpha: false, antialias: false, depth: false,
		stencil: false, powerPreference: 'high-performance'});
	if (!gl || !gl.getExtension('EXT_color_buffer_float')) throw new Error('Real float WebGL2 is required.');
	const debug = gl.getExtension('WEBGL_debug_renderer_info');
	const base = createSanJoseNauticalPocBuildRequest();
	const w27 = createB1W27DirectionDomain();
	const w39 = createCubedSphereW39DirectionDomain({id: 'p8-axis-w39-v1',
		frame: 'actual-point-source-relative'});
	const position = shiftedPositionDomain(base.transportSpec.domains.position);
	const solarZenith = shiftedZenithDomain(base.transportSpec.domains.solarZenith);
	const cases = heldoutCases(base, w39);
	const incomingIndex = 17;
	const probes = [];
	const weights = new Map();
	for (const item of cases) {
		const stencil = resolveB1W27Stencil(item.outgoingDirection);
		for (let index = 0; index < stencil.indices.length; index += 1) {
			const label = `${item.id}:${index}`;
			probes.push({label, x: stencil.indices[index],
				y: item.zenithIndex * position.count + item.positionIndex});
			weights.set(label, stencil.weights[index]);
		}
	}
	const lProbes = cases.map((item) => ({label: `${item.id}:0`, x: incomingIndex,
		y: item.zenithIndex * position.count + item.positionIndex}));
	const lWeights = new Map(lProbes.map((item) => [item.label, 1]));
	const wavelengths = Array.from({length: base.transportSpec.domains.spectrum.channelCount},
		(_unused, index) => index);
	const request = requestWith(base, {id: 'p8-shifted-w27-axis-isolation', position,
		solarZenith, outgoing: w27});
	const records = await executeVariant({gl, request, wavelengths, jProbes: probes,
		lProbes, progress: 'p8-axis-shifted-w27'});
	const comparisons = cases.map((item) => ({id: item.id,
		cumulative: wavelengths.map((wavelengthIndex) => ({wavelengthIndex,
			value: J_FIELDS.reduce((sum, field) => sum
				+ weightedValue(records, field, wavelengthIndex, item.id, weights), 0)})),
		orders: Object.fromEntries(J_FIELDS.map((field) => [field,
			wavelengths.map((wavelengthIndex) => ({wavelengthIndex,
				value: weightedValue(records, field, wavelengthIndex, item.id, weights)}))])),
		internal: Object.fromEntries(L_FIELDS.map((field) => [field,
			wavelengths.map((wavelengthIndex) => ({wavelengthIndex,
				value: weightedValue(records, field, wavelengthIndex, item.id, lWeights)}))])),
	}));
	return {schemaId: 'p8-axis-isolation-shifted-w27-browser-v1',
		gpu: {api: gl.getParameter(gl.VERSION), renderer: debug
			? gl.getParameter(debug.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER)},
		domain: {position: position.id, solarZenith: solarZenith.id, outgoing: w27.id},
		wavelengths, cases: comparisons,
		claimBoundary: 'Shifted altitude/solar-zenith W27 field used only to separate position-grid error from W27-to-W39 outgoing-grid error in sealed run 000561.'};
}

function nearestIndex(nodes, key, target) {
	let selected = 0;
	for (let index = 1; index < nodes.length; index += 1) {
		if (Math.abs(nodes[index][key] - target) < Math.abs(nodes[selected][key] - target)) selected = index;
	}
	return selected;
}

/** Qualify the first resolution correction selected from the rejected-axis diagnosis. */
export async function runP8RefinedGridBrowser() {
	const canvas = document.createElement('canvas');
	const gl = canvas.getContext('webgl2', {alpha: false, antialias: false, depth: false,
		stencil: false, powerPreference: 'high-performance'});
	if (!gl || !gl.getExtension('EXT_color_buffer_float')) throw new Error('Real float WebGL2 is required.');
	const debug = gl.getExtension('WEBGL_debug_renderer_info');
	const base = createSanJoseNauticalPocBuildRequest();
	const w27 = createB1W27DirectionDomain();
	const w39 = createCubedSphereW39DirectionDomain({id: 'p8-refined-oracle-w39-v1',
		frame: 'actual-point-source-relative'});
	const candidatePosition = quadraticPositionDomain(base.transportSpec.domains.position);
	const candidateZenith = adaptiveTerminatorZenithDomain(base.transportSpec.domains.solarZenith);
	const oraclePosition = shiftedPositionDomain(candidatePosition);
	const oracleZenith = shiftedZenithDomain(candidateZenith);
	const definitions = [
		['near-boundary-day', 14, 60, 0, 23, 19],
		['low-day-horizon', 1000, 78, 0, 21, 20],
		['near-ground-terminator', 14, 89.9, 0, 20, 19],
		['upper-terminator', 10000, 90.1, 4, 22, 18],
		['twilight-horizon', 2500, 100.1, 0, 17, 20],
		['weak-blue-night', 15000, 108, 4, 16, 22],
	];
	const cases = definitions.map(([id, altitude, zenith, face, u, v]) => {
		const positionIndex = nearestIndex(oraclePosition.nodes, 'altitudeMeters', altitude);
		const zenithIndex = nearestIndex(oracleZenith.nodes, 'solarZenithDegrees', zenith);
		const outgoingIndex = flattenW39NodeIndex(face, u, v);
		return {id, positionIndex, zenithIndex,
			altitudeMeters: oraclePosition.nodes[positionIndex].altitudeMeters,
			solarZenithDegrees: oracleZenith.nodes[zenithIndex].solarZenithDegrees,
			outgoingIndex, outgoingDirection: w39.unitVectors[outgoingIndex]};
	});
	const candidateBase = requestWith(base, {id: 'p8-refined-base', position: candidatePosition,
		solarZenith: candidateZenith, outgoing: w27});
	const candidateJ = combinedCandidateProbes(cases, candidateBase, w27);
	const incomingIndex = 17;
	const candidateL = internalCandidateProbes(cases, candidateBase, incomingIndex);
	const oracleJ = exactOracleProbes(cases, oraclePosition.count);
	const oracleL = cases.map((item) => ({label: item.id, x: incomingIndex,
		y: item.zenithIndex * oraclePosition.count + item.positionIndex}));
	const wavelengths = Array.from({length: base.transportSpec.domains.spectrum.channelCount},
		(_unused, index) => index);
	const oracleRequest = requestWith(base, {id: 'p8-refined-shifted-oracle',
		position: oraclePosition, solarZenith: oracleZenith, outgoing: w39});
	const candidate = await executeVariant({gl, request: candidateBase, wavelengths,
		jProbes: candidateJ.probes, lProbes: candidateL.probes, progress: 'p8-refined-candidate'});
	const oracle = await executeVariant({gl, request: oracleRequest, wavelengths,
		jProbes: oracleJ, lProbes: oracleL, progress: 'p8-refined-oracle'});
	const comparisons = compareCombined({cases, wavelengths, candidate, oracle,
		jWeights: candidateJ.weights, lWeights: candidateL.weights});
	return {schemaId: 'p8-refined-grid-oracle-browser-v1',
		gpu: {api: gl.getParameter(gl.VERSION), renderer: debug
			? gl.getParameter(debug.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER)},
		domains: {candidate: {position: candidatePosition.id, positionCount: candidatePosition.count,
			solarZenith: candidateZenith.id, solarZenithCount: candidateZenith.count, outgoing: w27.id},
			oracle: {position: oraclePosition.id, positionCount: oraclePosition.count,
				solarZenith: oracleZenith.id, solarZenithCount: oracleZenith.count, outgoing: w39.id}},
		wavelengths, incomingProbeIndex: incomingIndex, cases, comparisons,
		claimBoundary: 'Quadratic48/adaptive-terminator/W27 held-out comparison against an independently shifted quadratic48/adaptive-terminator/W39 N4 field; shifted-grid oracle, not continuum truth.'};
}
