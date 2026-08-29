import {createPocBuildRequest} from
	'../san-jose-nautical-cache-poc/compiler/createPocBuildRequest.js';
import {SAN_JOSE_SCATTERING_SCENE_SEQUENCE} from
	'../san-jose-nautical-cache-poc/fixtures/sanJoseScatteringSceneSequence.js';
import {executeZp3GpuRecurrence} from './P6ComponentGpuRecurrence.js';

const WAVELENGTHS = [375.6666666666667,407,438.3333333333333,469.66666666666663,501,532.3333333333333,563.6666666666666,595,626.3333333333333,657.6666666666666,689,720.3333333333333,751.6666666666666,783,814.3333333333333];
const COLORS = ['#e63946', '#457b9d', '#2a9d8f', '#f4a261'];

function makeQueries(traces) {
	return traces.flatMap((trace) => trace.samples.map((sample) => {
		const taps = [];
		for (const altitude of sample.altitudeStencil) {
			for (const zenith of sample.zenithStencil) {
				for (let index = 0; index < sample.outgoingIndices.length; index += 1) {
					taps.push({
						sourceRow: zenith.index * 48 + altitude.index,
						directionIndex: sample.outgoingIndices[index],
						weight: altitude.weight * zenith.weight
							* sample.outgoingWeights[index],
					});
				}
			}
		}
		return {id: `${trace.label}:${sample.sampleIndex}`, taps};
	}));
}

function ozoneCrossSection(table, channel) {
	const coordinate = (WAVELENGTHS[channel] - table.minimumNanometers)
		/ table.spacingNanometers;
	const lower = Math.floor(coordinate);
	const upper = Math.min(table.values.length - 1, lower + 1);
	const fraction = coordinate - lower;
	return table.values[lower] * (1 - fraction) + table.values[upper] * fraction;
}

function extinction(altitudeMeters, channel, table) {
	const micrometers = WAVELENGTHS[channel] / 1000;
	const rayleigh = 0.00000124062 * micrometers ** -4 * Math.exp(-altitudeMeters / 8000);
	const mie = (0.04 / 1200) * micrometers ** -0.8 * Math.exp(-altitudeMeters / 1200);
	const ozoneScale = altitudeMeters <= 10000 || altitudeMeters >= 40000 ? 0
		: altitudeMeters <= 25000 ? (altitudeMeters - 10000) / 15000
			: (40000 - altitudeMeters) / 15000;
	return rayleigh + mie + 5.374e18 * ozoneCrossSection(table, channel) * ozoneScale;
}

function analyzeTrace(trace, density, ozoneTable) {
	const path = Array.from({length: 4}, () => ({
		rayleigh: new Array(15).fill(0), mie: new Array(15).fill(0),
	}));
	const transmittance = new Array(15).fill(1);
	let maximumDensityAbsoluteResidual = 0;
	let maximumDensityRelativeResidual = 0;
	for (const sample of trace.samples) {
		const sampleDensity = density.get(`${trace.label}:${sample.sampleIndex}`);
		for (let channel = 0; channel < 15; channel += 1) {
			const componentTotal = sampleDensity.reduce((sum, order) =>
				sum + order.rayleigh[channel] + order.mie[channel], 0);
			const reference = sample.densityNative15[channel];
			const residual = Math.abs(componentTotal - reference);
			maximumDensityAbsoluteResidual = Math.max(maximumDensityAbsoluteResidual, residual);
			maximumDensityRelativeResidual = Math.max(maximumDensityRelativeResidual,
				residual / Math.max(Math.abs(reference), 1e-30));
			const ext = extinction(sample.altitudeMeters, channel, ozoneTable);
			transmittance[channel] *= Math.exp(-0.5 * ext * trace.stepMeters);
			for (let order = 0; order < 4; order += 1) {
				path[order].rayleigh[channel] += transmittance[channel]
					* sampleDensity[order].rayleigh[channel] * trace.stepMeters;
				path[order].mie[channel] += transmittance[channel]
					* sampleDensity[order].mie[channel] * trace.stepMeters;
			}
			transmittance[channel] *= Math.exp(-0.5 * ext * trace.stepMeters);
		}
	}
	const reconstructed = Array.from({length: 15}, (_unused, channel) =>
		path.reduce((sum, order) => sum + order.rayleigh[channel] + order.mie[channel], 0));
	const reference = trace.finalPathRadianceNative15;
	const residuals = reconstructed.map((value, channel) => Math.abs(value - reference[channel]));
	const total = reconstructed.reduce((sum, value) => sum + value, 0);
	const shares = path.map((order, index) => ({order: index + 1,
		rayleigh: order.rayleigh.reduce((sum, value) => sum + value, 0) / total,
		mie: order.mie.reduce((sum, value) => sum + value, 0) / total,
		total: [...order.rayleigh, ...order.mie].reduce((sum, value) => sum + value, 0) / total}));
	return {label: trace.label, screen: trace.screen, pathComponents: path,
		reconstructedNative15: reconstructed, referenceNative15: reference,
		maximumPathAbsoluteResidual: Math.max(...residuals),
		maximumPathRelativeResidual: Math.max(...residuals.map((value, channel) =>
			value / Math.max(Math.abs(reference[channel]), 1e-30))),
		maximumDensityAbsoluteResidual, maximumDensityRelativeResidual, shares,
		rayleighShare: shares.reduce((sum, order) => sum + order.rayleigh, 0),
		mieShare: shares.reduce((sum, order) => sum + order.mie, 0)};
}

function chartDataUrl(analysis) {
	const canvas = document.createElement('canvas');
	canvas.width = 900; canvas.height = 600;
	const context = canvas.getContext('2d');
	context.fillStyle = '#10151d'; context.fillRect(0, 0, canvas.width, canvas.height);
	context.fillStyle = '#f1f5f9'; context.font = '24px sans-serif';
	context.fillText(`P6.2 ${analysis.label}: J1-J4 spectral path contributions`, 35, 42);
	context.font = '16px monospace';
	context.fillText(`Rayleigh ${(analysis.rayleighShare * 100).toFixed(2)}%   Mie ${(analysis.mieShare * 100).toFixed(2)}%`, 35, 72);
	const totals = analysis.pathComponents.map((order) => order.rayleigh.map(
		(value, channel) => value + order.mie[channel]));
	const peak = Math.max(...totals.flat());
	const left = 70, top = 105, width = 790, height = 350;
	context.strokeStyle = '#64748b'; context.strokeRect(left, top, width, height);
	for (let order = 0; order < 4; order += 1) {
		context.beginPath(); context.strokeStyle = COLORS[order]; context.lineWidth = 3;
		for (let channel = 0; channel < 15; channel += 1) {
			const x = left + channel * width / 14;
			const y = top + height - totals[order][channel] / peak * height;
			if (channel === 0) context.moveTo(x, y); else context.lineTo(x, y);
		}
		context.stroke();
		context.fillStyle = COLORS[order]; context.fillRect(80 + order * 180, 485, 20, 12);
		context.fillStyle = '#f1f5f9'; context.font = '15px sans-serif';
		const share = analysis.shares[order];
		context.fillText(`J${order + 1} ${(share.total * 100).toFixed(2)}%`, 108 + order * 180, 497);
	}
	context.fillStyle = '#cbd5e1'; context.font = '13px monospace';
	context.fillText('375.7 nm', left, 475); context.fillText('814.3 nm', left + width - 65, 475);
	for (let order = 0; order < 4; order += 1) {
		const share = analysis.shares[order];
		context.fillText(`J${order + 1}: R ${(share.rayleigh * 100).toFixed(2)}%  M ${(share.mie * 100).toFixed(2)}%`,
			80 + (order % 2) * 390, 535 + Math.floor(order / 2) * 25);
	}
	return canvas.toDataURL('image/png');
}

async function postImage(path, dataUrl) {
	const bytes = await fetch(dataUrl).then((response) => response.arrayBuffer());
	const response = await fetch(path, {method: 'POST', body: bytes});
	if (!response.ok) throw new Error(`Chart upload failed: ${path}.`);
}

export async function runP6ComponentBrowser() {
	const traceResponse = await fetch('/p6diag/evidence/path-traces.json');
	if (!traceResponse.ok) throw new Error('P6.1 path traces are unavailable.');
	const sourceTraces = (await traceResponse.json()).control;
	const componentQueries = makeQueries(sourceTraces);
	const canvas = document.createElement('canvas');
	const gl = canvas.getContext('webgl2', {alpha: false, antialias: false,
		depth: false, stencil: false, powerPreference: 'high-performance'});
	if (!gl) throw new Error('WebGL2 is unavailable.');
	const debug = gl.getExtension('WEBGL_debug_renderer_info');
	const solarNoon = SAN_JOSE_SCATTERING_SCENE_SEQUENCE.find((scene) => scene.id === 'solar-noon');
	const buildRequest = createPocBuildRequest({id: 'p6-component-solar-noon-native48-v1',
		scenePageDefinitions: [{id: 'p6-component-frame', scene: solarNoon}]});
	const density = new Map(componentQueries.map((query) => [query.id,
		Array.from({length: 4}, () => ({rayleigh: new Array(15), mie: new Array(15)}))]));
	const wavelengths = [];
	for (let wavelengthIndex = 0; wavelengthIndex < 15; wavelengthIndex += 1) {
		await globalThis.pointLocalProgress?.(`p6-components-wavelength-${wavelengthIndex}:start`);
		const result = await executeZp3GpuRecurrence({gl, buildRequest, wavelengthIndex,
			componentQueries,
			reportProgress: async (stage) => globalThis.pointLocalProgress?.(stage),
			onOrderComponents: async ({order, records}) => {
				for (const record of records) {
					density.get(record.id)[order - 1].rayleigh[wavelengthIndex] = record.rayleigh;
					density.get(record.id)[order - 1].mie[wavelengthIndex] = record.mie;
				}
			},
		});
		wavelengths.push({wavelength: result.wavelength,
			peakLiveFieldBytes: result.peakLiveFieldBytes,
			finalLiveFieldBytes: result.finalLiveFieldBytes});
	}
	const ozoneTable = buildRequest.transportSpec.atmosphere.ozone.crossSectionTable;
	const analyses = sourceTraces.map((trace) => analyzeTrace(trace, density, ozoneTable));
	for (const analysis of analyses) {
		await postImage(`/artifact/${analysis.label}-components.png`, chartDataUrl(analysis));
	}
	return {schemaId: 'point-local-p6-component-browser-result-v1',
		gpu: {api: gl.getParameter(gl.VERSION),
			renderer: debug ? gl.getParameter(debug.UNMASKED_RENDERER_WEBGL)
				: gl.getParameter(gl.RENDERER)},
		queries: {traceCount: sourceTraces.length, pathSamplesPerTrace: 15,
			queryCount: componentQueries.length, orders: 4, components: ['Rayleigh', 'Mie']},
		wavelengths, analyses};
}

