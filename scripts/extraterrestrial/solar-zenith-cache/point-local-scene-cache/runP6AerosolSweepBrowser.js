import {executeZp3GpuRecurrence} from './P6AerosolGpuRecurrence.js';
import {
	P6_AEROSOL_VARIANTS, createP6AerosolBuildRequest,
} from './p6AerosolBuildRequest.js';
import {renderP6RadialDiagnostic} from './P6RadialDiagnosticRenderer.js';

const WAVELENGTHS = [375.6666666666667,407,438.3333333333333,469.66666666666663,501,532.3333333333333,563.6666666666666,595,626.3333333333333,657.6666666666666,689,720.3333333333333,751.6666666666666,783,814.3333333333333];

function makeQueries(traces) {
	return traces.flatMap((trace) => trace.samples.map((sample) => {
		const taps = [];
		for (const altitude of sample.altitudeStencil) for (const zenith of sample.zenithStencil) {
			for (let index = 0; index < sample.outgoingIndices.length; index += 1) {
				taps.push({sourceRow: zenith.index * 48 + altitude.index,
					directionIndex: sample.outgoingIndices[index],
					weight: altitude.weight * zenith.weight * sample.outgoingWeights[index]});
			}
		}
		return {id: `${trace.label}:${sample.sampleIndex}`, taps};
	}));
}

function packedRow(ledger, sourceRow) {
	const altitudeIndex = sourceRow % 48;
	const zenithIndex = Math.floor(sourceRow / 48);
	const row = ledger.rows[altitudeIndex];
	if (zenithIndex < row.retainedZenith.firstIndex
		|| zenithIndex > row.retainedZenith.lastIndex) {
		throw new RangeError('Aerosol diagnostic query escaped the packed ledger.');
	}
	return row.packed.firstRow + zenithIndex - row.retainedZenith.firstIndex;
}

function samplePayload(payload, ledger, query, channel) {
	const height = ledger.retainedBlockCount;
	return query.taps.reduce((sum, tap) => sum + tap.weight
		* payload[(channel * height + packedRow(ledger, tap.sourceRow)) * 9126
			+ tap.directionIndex], 0);
}

function ozoneCrossSection(table, channel) {
	const coordinate = (WAVELENGTHS[channel] - table.minimumNanometers)
		/ table.spacingNanometers;
	const lower = Math.floor(coordinate);
	const upper = Math.min(table.values.length - 1, lower + 1);
	const fraction = coordinate - lower;
	return table.values[lower] * (1 - fraction) + table.values[upper] * fraction;
}

function extinction(altitudeMeters, channel, atmosphere) {
	const micrometers = WAVELENGTHS[channel] / 1000;
	const rayleigh = atmosphere.rayleighCoefficientScalePerMeter * micrometers ** -4
		* Math.exp(-altitudeMeters / atmosphere.rayleighScaleHeightMeters);
	const mie = (atmosphere.mieAngstromBeta / atmosphere.mieScaleHeightMeters)
		* micrometers ** -atmosphere.mieAngstromAlpha
		* Math.exp(-altitudeMeters / atmosphere.mieScaleHeightMeters);
	const ozoneScale = altitudeMeters <= 10000 || altitudeMeters >= 40000 ? 0
		: altitudeMeters <= 25000 ? (altitudeMeters - 10000) / 15000
			: (40000 - altitudeMeters) / 15000;
	return rayleigh + mie + 5.374e18
		* ozoneCrossSection(atmosphere.ozone.crossSectionTable, channel) * ozoneScale;
}

function analyzeTrace({trace, queries, density, payload, ledger, atmosphere}) {
	const path = Array.from({length: 4}, () => ({
		rayleigh: new Array(15).fill(0), mie: new Array(15).fill(0),
	}));
	const referenceNative15 = new Array(15).fill(0);
	const transmittance = new Array(15).fill(1);
	let maximumDensityRelativeResidual = 0;
	for (const sample of trace.samples) {
		const id = `${trace.label}:${sample.sampleIndex}`;
		const query = queries.get(id);
		const components = density.get(id);
		for (let channel = 0; channel < 15; channel += 1) {
			const referenceDensity = samplePayload(payload, ledger, query, channel);
			const componentDensity = components.reduce((sum, order) =>
				sum + order.rayleigh[channel] + order.mie[channel], 0);
			maximumDensityRelativeResidual = Math.max(maximumDensityRelativeResidual,
				Math.abs(componentDensity - referenceDensity)
				/ Math.max(Math.abs(referenceDensity), 1e-30));
			const ext = extinction(sample.altitudeMeters, channel, atmosphere);
			transmittance[channel] *= Math.exp(-0.5 * ext * trace.stepMeters);
			referenceNative15[channel] += transmittance[channel]
				* referenceDensity * trace.stepMeters;
			for (let order = 0; order < 4; order += 1) {
				path[order].rayleigh[channel] += transmittance[channel]
					* components[order].rayleigh[channel] * trace.stepMeters;
				path[order].mie[channel] += transmittance[channel]
					* components[order].mie[channel] * trace.stepMeters;
			}
			transmittance[channel] *= Math.exp(-0.5 * ext * trace.stepMeters);
		}
	}
	const reconstructedNative15 = Array.from({length: 15}, (_unused, channel) =>
		path.reduce((sum, order) => sum + order.rayleigh[channel] + order.mie[channel], 0));
	const total = reconstructedNative15.reduce((sum, value) => sum + value, 0);
	const shares = path.map((order, index) => {
		const rayleigh = order.rayleigh.reduce((sum, value) => sum + value, 0) / total;
		const mie = order.mie.reduce((sum, value) => sum + value, 0) / total;
		return {order: index + 1, rayleigh, mie, total: rayleigh + mie};
	});
	const residuals = reconstructedNative15.map((value, channel) =>
		Math.abs(value - referenceNative15[channel])
		/ Math.max(Math.abs(referenceNative15[channel]), 1e-30));
	return {label: trace.label, screen: trace.screen,
		referenceNative15, reconstructedNative15, pathComponents: path, shares,
		rayleighShare: shares.reduce((sum, order) => sum + order.rayleigh, 0),
		mieShare: shares.reduce((sum, order) => sum + order.mie, 0),
		maximumDensityRelativeResidual,
		maximumPathRelativeResidual: Math.max(...residuals)};
}

async function postImage(path, dataUrl) {
	const bytes = await fetch(dataUrl).then((response) => response.arrayBuffer());
	const response = await fetch(path, {method: 'POST', body: bytes});
	if (!response.ok) throw new Error(`Aerosol render upload failed: ${path}.`);
}

export async function runP6AerosolSweepBrowser() {
	const [traceResponse, ledgerResponse] = await Promise.all([
		fetch('/p6diag/evidence/path-traces.json'),
		fetch('/p3/cache/solar-noon-packed-row-ledger.json'),
	]);
	if (!traceResponse.ok || !ledgerResponse.ok) throw new Error('P6 aerosol inputs are unavailable.');
	const sourceTraces = (await traceResponse.json()).control;
	const ledger = await ledgerResponse.json();
	const componentQueries = makeQueries(sourceTraces);
	const queryMap = new Map(componentQueries.map((query) => [query.id, query]));
	const canvas = document.createElement('canvas');
	const gl = canvas.getContext('webgl2', {alpha: false, antialias: false,
		depth: false, stencil: false, preserveDrawingBuffer: true,
		powerPreference: 'high-performance'});
	if (!gl) throw new Error('WebGL2 is unavailable.');
	const debug = gl.getExtension('WEBGL_debug_renderer_info');
	const variants = [];
	for (const definition of P6_AEROSOL_VARIANTS) {
		const buildRequest = createP6AerosolBuildRequest(definition);
		const layerLength = ledger.retainedBlockCount * 9126;
		const payload = new Float32Array(layerLength * 15);
		const density = new Map(componentQueries.map((query) => [query.id,
			Array.from({length: 4}, () => ({rayleigh: new Array(15), mie: new Array(15)}))]));
		const schedules = [];
		for (let wavelengthIndex = 0; wavelengthIndex < 15; wavelengthIndex += 1) {
			await globalThis.pointLocalProgress?.(`p6-aerosol-${definition.id}-wavelength-${wavelengthIndex}`);
			const result = await executeZp3GpuRecurrence({gl, buildRequest, wavelengthIndex,
				compileSceneCaches: true,
				sceneCacheRequests: [{cacheIdentity: `p6-${definition.id}`, ledger}],
				componentQueries,
				reportProgress: async (stage) => globalThis.pointLocalProgress?.(stage),
				onSceneCacheLayer: async ({values}) => payload.set(values, wavelengthIndex * layerLength),
				onOrderComponents: async ({order, records}) => {
					for (const record of records) {
						density.get(record.id)[order - 1].rayleigh[wavelengthIndex] = record.rayleigh;
						density.get(record.id)[order - 1].mie[wavelengthIndex] = record.mie;
					}
				},
			});
			schedules.push({wavelength: result.wavelength,
				compiledCache: result.compiledCaches[0],
				peakLiveFieldBytes: result.peakLiveFieldBytes,
				finalLiveFieldBytes: result.finalLiveFieldBytes});
		}
		const rendered = renderP6RadialDiagnostic({gl, canvas, buildRequest,
			payload, ledger, luminanceLiftGamma: 1, displayMode: 'retained'});
		await postImage(`/artifact/${definition.id}.png`, rendered.imagePngDataUrl);
		delete rendered.imagePngDataUrl;
		const analyses = sourceTraces.map((trace) => analyzeTrace({trace,
			queries: queryMap, density, payload, ledger,
			atmosphere: buildRequest.transportSpec.atmosphere}));
		variants.push({id: definition.id, multiplier: definition.multiplier,
			mieAngstromBeta: buildRequest.transportSpec.atmosphere.mieAngstromBeta,
			rendered, analyses, schedules});
	}
	return {schemaId: 'point-local-p6-aerosol-sweep-browser-result-v1',
		gpu: {api: gl.getParameter(gl.VERSION),
			renderer: debug ? gl.getParameter(debug.UNMASKED_RENDERER_WEBGL)
				: gl.getParameter(gl.RENDERER)},
		isolatedControls: {changed: 'Mie Angstrom beta; scattering and extinction together',
			retained: 'Native48, Z180, F68, W39, N4, Rayleigh, ozone, alpha 0.8, albedo 0.8, g 0.7, camera, geometry, black ground, display'},
		variants};
}

