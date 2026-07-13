import {createHash} from 'node:crypto';
import {existsSync, mkdirSync, readFileSync, writeFileSync} from 'node:fs';
import {dirname, join, relative, resolve} from 'node:path';
import {fileURLToPath, pathToFileURL} from 'node:url';

import {CAPTURE_TIMES, SCORE_SAMPLE_INDICES, parseSpectraTsv} from './b1-directional-sky-radiance/benchmark.js';
import {MODEL_LABELS, PUBLISHED_MODELS, PUBLISHED_RMSE_ORACLE} from './b1-directional-sky-radiance/published-oracle.js';
import {
	FIGURE5_SCENES,
	loadPublishedFigure5Panels,
	renderAlgorithm32Figure5Panel,
	renderFigure5ComparisonSvg,
} from './b1-directional-sky-radiance/figure5.js';
import {
	PAPER_PHYSICAL_PROFILE_CONTENT_HASH,
	PAPER_PHYSICAL_PROFILE_ID,
} from './b1-directional-sky-radiance/candidate-provenance.js';
import {
	HemisphericalFunction,
	integrateHemisphericalRadiance,
	integrateSourcePacket,
	reproduceFigure8ModelCurves,
	reproduceFigure8PublishedModelCurves,
} from './b2-hemispherical-sky-irradiance/benchmark.js';
import {readCube, readMeasurementBoundary, scoreCubes} from './b3-matched-atmosphere-solver/cube.js';
import {PUBLISHED as B3_PUBLISHED} from './b3-matched-atmosphere-solver/contract.js';

const SCRIPT_DIRECTORY = dirname(fileURLToPath(import.meta.url));
const REPOSITORY_ROOT = resolve(SCRIPT_DIRECTORY, '..', '..');
const RESULT_ROOT = join(REPOSITORY_ROOT, 'references', 'results', 'experiments');
const ALGORITHM32_STROKE_WIDTH = 2;

const DEFAULT_MEASUREMENTS = join(RESULT_ROOT, 'b1-directional-sky-radiance', 'measurement-boundary.tsv');
const DEFAULT_REFERENCE_CUBE = join(RESULT_ROOT, 'b3-matched-atmosphere-solver', 'libRadtran-reference-cube.json');
const DEFAULT_ALGORITHM32_SPECTRA = join(RESULT_ROOT, 'b1-directional-sky-radiance', 'algorithm32-proposed.tsv');
const DEFAULT_ALGORITHM32_CUBE = join(RESULT_ROOT, 'b3-matched-atmosphere-solver', 'algorithm32-proposed-cube.json');
const DEFAULT_ALGORITHM32_PROVENANCE = join(
	RESULT_ROOT,
	'b1-directional-sky-radiance',
	'algorithm32-boundary-provenance.json',
);
const DEFAULT_ALGORITHM32_J2_SPECTRA = join(RESULT_ROOT, 'b1-directional-sky-radiance', 'algorithm32-j2-proposed.tsv');
const DEFAULT_ALGORITHM32_J2_CUBE = join(
	RESULT_ROOT,
	'b3-matched-atmosphere-solver',
	'algorithm32-j2-proposed-cube.json',
);
const DEFAULT_ALGORITHM32_J2_PROVENANCE = join(
	RESULT_ROOT,
	'b1-directional-sky-radiance',
	'algorithm32-j2-boundary-provenance.json',
);
const DEFAULT_ALGORITHM32_J3_SPECTRA = join(RESULT_ROOT, 'b1-directional-sky-radiance', 'algorithm32-j3-proposed.tsv');
const DEFAULT_ALGORITHM32_J3_CUBE = join(
	RESULT_ROOT,
	'b3-matched-atmosphere-solver',
	'algorithm32-j3-proposed-cube.json',
);
const DEFAULT_ALGORITHM32_J3_PROVENANCE = join(
	RESULT_ROOT,
	'b1-directional-sky-radiance',
	'algorithm32-j3-boundary-provenance.json',
);
const DEFAULT_ALGORITHM32_J4_SPECTRA = join(RESULT_ROOT, 'b1-directional-sky-radiance', 'algorithm32-j4-proposed.tsv');
const DEFAULT_ALGORITHM32_J4_CUBE = join(
	RESULT_ROOT,
	'b3-matched-atmosphere-solver',
	'algorithm32-j4-proposed-cube.json',
);
const DEFAULT_ALGORITHM32_J4_PROVENANCE = join(
	RESULT_ROOT,
	'b1-directional-sky-radiance',
	'algorithm32-j4-boundary-provenance.json',
);
const DEFAULT_ALGORITHM32_J5_SPECTRA = join(RESULT_ROOT, 'b1-directional-sky-radiance', 'algorithm32-j5-proposed.tsv');
const DEFAULT_ALGORITHM32_J5_CUBE = join(
	RESULT_ROOT,
	'b3-matched-atmosphere-solver',
	'algorithm32-j5-proposed-cube.json',
);
const DEFAULT_ALGORITHM32_J5_PROVENANCE = join(
	RESULT_ROOT,
	'b1-directional-sky-radiance',
	'algorithm32-j5-boundary-provenance.json',
);
const DEFAULT_MODEL_CANDIDATES = Object.freeze([
	join(RESULT_ROOT, 'b1-directional-sky-radiance', 'published-models.tsv'),
	join(SCRIPT_DIRECTORY, 'b1-directional-sky-radiance', 'published-models.tsv'),
]);

function resultCandidatePath(directory, filename) {
	return join(RESULT_ROOT, directory, filename);
}

const ALGORITHM32_FIGURE_FAMILIES = Object.freeze({
	native: Object.freeze({
		profileNames: Object.freeze({default: 'default', j2: 'j2', j3: 'j3', j4: 'j4', j5: 'j5'}),
		labels: Object.freeze({
			default: 'Algorithm32',
			j2: 'Algorithm32 J2',
			j3: 'Algorithm32 J3',
			j4: 'Algorithm32 J4',
			j5: 'Algorithm32 J5',
		}),
		paths: Object.freeze({
			algorithm32Spectra: DEFAULT_ALGORITHM32_SPECTRA,
			algorithm32Cube: DEFAULT_ALGORITHM32_CUBE,
			algorithm32Provenance: DEFAULT_ALGORITHM32_PROVENANCE,
			algorithm32J2Spectra: DEFAULT_ALGORITHM32_J2_SPECTRA,
			algorithm32J2Cube: DEFAULT_ALGORITHM32_J2_CUBE,
			algorithm32J2Provenance: DEFAULT_ALGORITHM32_J2_PROVENANCE,
			algorithm32J3Spectra: DEFAULT_ALGORITHM32_J3_SPECTRA,
			algorithm32J3Cube: DEFAULT_ALGORITHM32_J3_CUBE,
			algorithm32J3Provenance: DEFAULT_ALGORITHM32_J3_PROVENANCE,
			algorithm32J4Spectra: DEFAULT_ALGORITHM32_J4_SPECTRA,
			algorithm32J4Cube: DEFAULT_ALGORITHM32_J4_CUBE,
			algorithm32J4Provenance: DEFAULT_ALGORITHM32_J4_PROVENANCE,
			algorithm32J5Spectra: DEFAULT_ALGORITHM32_J5_SPECTRA,
			algorithm32J5Cube: DEFAULT_ALGORITHM32_J5_CUBE,
			algorithm32J5Provenance: DEFAULT_ALGORITHM32_J5_PROVENANCE,
		}),
	}),
	paper: Object.freeze({
		profileNames: Object.freeze({
			default: 'paper',
			j2: 'paper-j2',
			j3: 'paper-j3',
			j4: 'paper-j4',
			j5: 'paper-j5',
		}),
		labels: Object.freeze({
			default: 'Algorithm32 Paper',
			j2: 'Algorithm32 Paper J2',
			j3: 'Algorithm32 Paper J3',
			j4: 'Algorithm32 Paper J4',
			j5: 'Algorithm32 Paper J5',
		}),
		paths: Object.freeze({
			algorithm32Spectra: resultCandidatePath('b1-directional-sky-radiance', 'algorithm32-paper-proposed.tsv'),
			algorithm32Cube: resultCandidatePath(
				'b3-matched-atmosphere-solver',
				'algorithm32-paper-proposed-cube.json',
			),
			algorithm32Provenance: resultCandidatePath(
				'b1-directional-sky-radiance',
				'algorithm32-paper-boundary-provenance.json',
			),
			algorithm32J2Spectra: resultCandidatePath(
				'b1-directional-sky-radiance',
				'algorithm32-paper-j2-proposed.tsv',
			),
			algorithm32J2Cube: resultCandidatePath(
				'b3-matched-atmosphere-solver',
				'algorithm32-paper-j2-proposed-cube.json',
			),
			algorithm32J2Provenance: resultCandidatePath(
				'b1-directional-sky-radiance',
				'algorithm32-paper-j2-boundary-provenance.json',
			),
			algorithm32J3Spectra: resultCandidatePath(
				'b1-directional-sky-radiance',
				'algorithm32-paper-j3-proposed.tsv',
			),
			algorithm32J3Cube: resultCandidatePath(
				'b3-matched-atmosphere-solver',
				'algorithm32-paper-j3-proposed-cube.json',
			),
			algorithm32J3Provenance: resultCandidatePath(
				'b1-directional-sky-radiance',
				'algorithm32-paper-j3-boundary-provenance.json',
			),
			algorithm32J4Spectra: resultCandidatePath(
				'b1-directional-sky-radiance',
				'algorithm32-paper-j4-proposed.tsv',
			),
			algorithm32J4Cube: resultCandidatePath(
				'b3-matched-atmosphere-solver',
				'algorithm32-paper-j4-proposed-cube.json',
			),
			algorithm32J4Provenance: resultCandidatePath(
				'b1-directional-sky-radiance',
				'algorithm32-paper-j4-boundary-provenance.json',
			),
			algorithm32J5Spectra: resultCandidatePath(
				'b1-directional-sky-radiance',
				'algorithm32-paper-j5-proposed.tsv',
			),
			algorithm32J5Cube: resultCandidatePath(
				'b3-matched-atmosphere-solver',
				'algorithm32-paper-j5-proposed-cube.json',
			),
			algorithm32J5Provenance: resultCandidatePath(
				'b1-directional-sky-radiance',
				'algorithm32-paper-j5-boundary-provenance.json',
			),
		}),
	}),
});

function resolveFigureFamily(family = 'native') {
	if (family === 'paper-reflection-completed-ordinary-68') {
		return Object.freeze({
			...ALGORITHM32_FIGURE_FAMILIES.paper,
			profileNames: Object.freeze({
				default: 'paper-reflection-completed-ordinary-68',
				j2: 'paper-j2',
				j3: 'paper-j3',
				j4: 'paper-j4-reflection-completed-ordinary-68',
				j5: 'paper-j5',
			}),
			labels: Object.freeze({
				...ALGORITHM32_FIGURE_FAMILIES.paper.labels,
				default: 'Algorithm32 Paper Reflection-Completed Ordinary Fibonacci-68',
				j4: 'Algorithm32 Paper J4 Reflection-Completed Ordinary Fibonacci-68',
			}),
		});
	}
	if (family === 'paper-reflection-completed-136') {
		return Object.freeze({
			...ALGORITHM32_FIGURE_FAMILIES.paper,
			profileNames: Object.freeze({
				default: 'paper-reflection-completed-136',
				j2: 'paper-j2',
				j3: 'paper-j3',
				j4: 'paper-j4-reflection-completed-136',
				j5: 'paper-j5',
			}),
			labels: Object.freeze({
				...ALGORITHM32_FIGURE_FAMILIES.paper.labels,
				default: 'Algorithm32 Paper Reflection-Completed 136',
				j4: 'Algorithm32 Paper J4 Reflection-Completed 136',
			}),
		});
	}
	const value = ALGORITHM32_FIGURE_FAMILIES[family];
	if (!value) throw new RangeError(`Unknown candidate profile family: ${family}`);
	return value;
}

const COLORS = Object.freeze({
	nishita93: '#0072b2',
	nishita96: '#56b4e9',
	preetham: '#d55e00',
	oneal: '#e69f00',
	haber: '#009e73',
	bruneton: '#cc79a7',
	elek: '#6f4c9b',
	hosek: '#a58b00',
	libradtran: '#222222',
	measurements: '#111111',
	algorithm32: '#b00020',
	algorithm32J2: '#005a9c',
	algorithm32J3: '#d55e00',
	algorithm32J4: '#6a3d9a',
	algorithm32J5: '#00897b',
});

const DASHES = Object.freeze({
	nishita93: '',
	nishita96: '9 4',
	preetham: '',
	oneal: '3 3',
	haber: '',
	bruneton: '10 3',
	elek: '2 3',
	hosek: '12 4 2 4',
	libradtran: '7 3',
	measurements: '',
	algorithm32: '',
	algorithm32J2: '6 4',
	algorithm32J3: '10 3 2 3',
	algorithm32J4: '2 3',
	algorithm32J5: '1 3',
});

function paperProfileContract(order = null) {
	const suffix = order == null ? '' : ` J${order}`;
	const controls = {
		pathIntervalCount: 40,
		sourceTransmittanceIntervalCount: 20,
		incidentDirectionCount: 68,
		incidentAltitudeBinCount: 48,
	};
	if (order != null) {
		Object.assign(controls, {
			incomingDirectionDomain: 'algorithm32-reflection-completed-fibonacci-68-incoming-v1',
			scatteringOutputDomain: 'source-aligned-boundary-inclusive-gnomonic-cubed-sphere-w27',
			scatteringOutputFaceWidth: 27,
			scatteringOutputDirectionCount: 4374,
			positionNodeCount: 48,
			positionLookup: 'view-only-linear-physical-altitude-over-actual-nodes',
			maximumScatteringOrder: order,
		});
	}
	return Object.freeze({
		label: `Algorithm32 Paper${suffix}`,
		presentationName: `Algorithm32 Paper${suffix}`,
		profileId: order == null ? 'paper' : `paper-j${order}`,
		spectralChannelCount: 40,
		spectralProjection: 'identity-direct-40',
		physicalProfileId: PAPER_PHYSICAL_PROFILE_ID,
		physicalProfileContentHash: PAPER_PHYSICAL_PROFILE_CONTENT_HASH,
		controls: Object.freeze(controls),
	});
}

function paperReflectionCompleted136ProfileContract({defaultProfile = false} = {}) {
	const base = paperProfileContract(4);
	return Object.freeze({
		...base,
		label: defaultProfile
			? 'Algorithm32 Paper Reflection-Completed 136'
			: 'Algorithm32 Paper J4 Reflection-Completed 136',
		presentationName: defaultProfile
			? 'Algorithm32 Paper Experimental Reflection-Completed 136'
			: 'Algorithm32 Paper J4 Experimental Reflection-Completed 136',
		profileId: defaultProfile ? 'paper-reflection-completed-136' : 'paper-j4-reflection-completed-136',
		controls: Object.freeze({
			...base.controls,
			incidentDirectionCount: 136,
			incomingDirectionDomain: 'b1-reflection-completed-paired-rotated-fibonacci-136-v1',
		}),
	});
}

function paperReflectionCompletedOrdinary68ProfileContract({defaultProfile = false} = {}) {
	const base = paperProfileContract(4);
	return Object.freeze({
		...base,
		label: defaultProfile
			? 'Algorithm32 Paper Reflection-Completed Ordinary Fibonacci-68'
			: 'Algorithm32 Paper J4 Reflection-Completed Ordinary Fibonacci-68',
		presentationName: defaultProfile
			? 'Algorithm32 Paper Experimental Reflection-Completed Ordinary Fibonacci-68'
			: 'Algorithm32 Paper J4 Experimental Reflection-Completed Ordinary Fibonacci-68',
		profileId: defaultProfile
			? 'paper-reflection-completed-ordinary-68'
			: 'paper-j4-reflection-completed-ordinary-68',
		controls: Object.freeze({
			...base.controls,
			incidentDirectionCount: 68,
			incomingDirectionDomain: 'b1-reflection-completed-ordinary-fibonacci-68-v1',
		}),
	});
}

const ALGORITHM32_PROFILE_CONTRACTS = Object.freeze({
	default: Object.freeze({
		label: 'Algorithm32',
		presentationName: 'Algorithm32 — production Default 40/20/68/48, native 15-channel packet',
		profileId: 'default',
		legacyProfileId: undefined,
		controls: Object.freeze({
			pathIntervalCount: 40,
			sourceTransmittanceIntervalCount: 20,
			incidentDirectionCount: 68,
			incidentAltitudeBinCount: 48,
		}),
	}),
	j2: Object.freeze({
		label: 'Algorithm32 J2',
		presentationName:
			'Algorithm32 J2 - W27 cumulative scattering through order 2 with view-only physical-altitude interpolation, native 15-channel packet',
		profileId: 'j2',
		controls: Object.freeze({
			pathIntervalCount: 40,
			sourceTransmittanceIntervalCount: 20,
			incidentDirectionCount: 68,
			incidentAltitudeBinCount: 48,
			incomingDirectionDomain: 'algorithm32-reflection-completed-fibonacci-68-incoming-v1',
			scatteringOutputDomain: 'source-aligned-boundary-inclusive-gnomonic-cubed-sphere-w27',
			scatteringOutputFaceWidth: 27,
			scatteringOutputDirectionCount: 4374,
			positionNodeCount: 48,
			positionLookup: 'view-only-linear-physical-altitude-over-actual-nodes',
			maximumScatteringOrder: 2,
		}),
	}),
	j3: Object.freeze({
		label: 'Algorithm32 J3',
		presentationName:
			'Algorithm32 J3 - W27 cumulative scattering through order 3 with view-only physical-altitude interpolation, native 15-channel packet',
		profileId: 'j3',
		controls: Object.freeze({
			pathIntervalCount: 40,
			sourceTransmittanceIntervalCount: 20,
			incidentDirectionCount: 68,
			incidentAltitudeBinCount: 48,
			incomingDirectionDomain: 'algorithm32-reflection-completed-fibonacci-68-incoming-v1',
			scatteringOutputDomain: 'source-aligned-boundary-inclusive-gnomonic-cubed-sphere-w27',
			scatteringOutputFaceWidth: 27,
			scatteringOutputDirectionCount: 4374,
			positionNodeCount: 48,
			positionLookup: 'view-only-linear-physical-altitude-over-actual-nodes',
			maximumScatteringOrder: 3,
		}),
	}),
	j4: Object.freeze({
		label: 'Algorithm32 J4',
		presentationName:
			'Algorithm32 J4 - W27 cumulative scattering through order 4 with view-only physical-altitude interpolation, native 15-channel packet',
		profileId: 'j4',
		controls: Object.freeze({
			pathIntervalCount: 40,
			sourceTransmittanceIntervalCount: 20,
			incidentDirectionCount: 68,
			incidentAltitudeBinCount: 48,
			incomingDirectionDomain: 'algorithm32-reflection-completed-fibonacci-68-incoming-v1',
			scatteringOutputDomain: 'source-aligned-boundary-inclusive-gnomonic-cubed-sphere-w27',
			scatteringOutputFaceWidth: 27,
			scatteringOutputDirectionCount: 4374,
			positionNodeCount: 48,
			positionLookup: 'view-only-linear-physical-altitude-over-actual-nodes',
			maximumScatteringOrder: 4,
		}),
	}),
	j5: Object.freeze({
		label: 'Algorithm32 J5',
		presentationName:
			'Algorithm32 J5 - W27 cumulative scattering through order 5 with view-only physical-altitude interpolation, native 15-channel packet',
		profileId: 'j5',
		controls: Object.freeze({
			pathIntervalCount: 40,
			sourceTransmittanceIntervalCount: 20,
			incidentDirectionCount: 68,
			incidentAltitudeBinCount: 48,
			incomingDirectionDomain: 'algorithm32-reflection-completed-fibonacci-68-incoming-v1',
			scatteringOutputDomain: 'source-aligned-boundary-inclusive-gnomonic-cubed-sphere-w27',
			scatteringOutputFaceWidth: 27,
			scatteringOutputDirectionCount: 4374,
			positionNodeCount: 48,
			positionLookup: 'view-only-linear-physical-altitude-over-actual-nodes',
			maximumScatteringOrder: 5,
		}),
	}),
	paper: paperProfileContract(),
	'paper-j2': paperProfileContract(2),
	'paper-j3': paperProfileContract(3),
	'paper-j4': paperProfileContract(4),
	'paper-j5': paperProfileContract(5),
	'paper-reflection-completed-ordinary-68': paperReflectionCompletedOrdinary68ProfileContract({
		defaultProfile: true,
	}),
	'paper-j4-reflection-completed-ordinary-68': paperReflectionCompletedOrdinary68ProfileContract(),
	'paper-reflection-completed-136': paperReflectionCompleted136ProfileContract({defaultProfile: true}),
	'paper-j4-reflection-completed-136': paperReflectionCompleted136ProfileContract(),
});

function xml(value) {
	return String(value)
		.replaceAll('&', '&amp;')
		.replaceAll('<', '&lt;')
		.replaceAll('>', '&gt;')
		.replaceAll('"', '&quot;')
		.replaceAll("'", '&apos;');
}

function number(value, digits = 6) {
	return Number(value.toFixed(digits)).toString();
}

function sha256(bytes) {
	return createHash('sha256').update(bytes).digest('hex');
}

function sourcePath(path) {
	return relative(REPOSITORY_ROOT, path).replaceAll('\\', '/');
}

export function validateAlgorithm32ProfileProvenance(provenance, profileName) {
	const expected = ALGORITHM32_PROFILE_CONTRACTS[profileName];
	if (!expected) throw new TypeError(`Unknown Algorithm32 profile ${profileName}.`);
	if (!provenance || typeof provenance !== 'object') {
		throw new TypeError(`${expected.label} provenance must be an object.`);
	}
	const validProfileId =
		provenance.profileId === expected.profileId ||
		(Object.hasOwn(expected, 'legacyProfileId') && provenance.profileId === expected.legacyProfileId);
	const legacyBoundary = provenance.productionSource?.calculationBoundary;
	const currentBoundary = provenance.executionBoundary;
	const validSchemaAndBoundary =
		(provenance.schema === 'algorithm32-kider-boundary-provenance-v1' &&
			typeof legacyBoundary === 'string' &&
			legacyBoundary.length > 0) ||
		(provenance.schema === 'algorithm32-current-production-b1-provenance-v2' &&
			typeof currentBoundary === 'string' &&
			currentBoundary.length > 0);
	if (
		!validSchemaAndBoundary ||
		provenance.modelNameInBenchmarkTables !== 'proposed' ||
		provenance.presentationName !== expected.presentationName ||
		!validProfileId
	) {
		throw new Error(`${expected.label} provenance does not identify the required production boundary.`);
	}
	const spectralBoundary = provenance.spectralBoundary ?? provenance.nativeSpectralBoundary;
	const expectedChannelCount = expected.spectralChannelCount ?? 15;
	if (spectralBoundary?.channelCount !== expectedChannelCount) {
		throw new Error(
			`${expected.label} provenance spectral channel count must be ` +
				`${expectedChannelCount}; received ${spectralBoundary?.channelCount}.`,
		);
	}
	if (expected.spectralProjection != null && spectralBoundary?.projection !== expected.spectralProjection) {
		throw new Error(
			`${expected.label} provenance spectral projection must be ` +
				`${expected.spectralProjection}; received ${spectralBoundary?.projection}.`,
		);
	}
	if (expected.physicalProfileId != null && provenance.physicalProfileId !== expected.physicalProfileId) {
		throw new Error(
			`${expected.label} provenance physicalProfileId must be ` +
				`${expected.physicalProfileId}; received ${provenance.physicalProfileId}.`,
		);
	}
	if (
		expected.physicalProfileContentHash != null &&
		provenance.physicalProfileContentHash !== expected.physicalProfileContentHash
	) {
		throw new Error(
			`${expected.label} provenance physicalProfileContentHash must be ` +
				`${expected.physicalProfileContentHash}; received ${provenance.physicalProfileContentHash}.`,
		);
	}
	for (const [name, value] of Object.entries(expected.controls)) {
		if (provenance.numericalControls?.[name] !== value) {
			throw new Error(
				`${expected.label} provenance ${name} must be ${value}; ` +
					`received ${provenance.numericalControls?.[name]}.`,
			);
		}
	}
	return Object.freeze({
		label: expected.label,
		identity: expected.presentationName,
		controls: expected.controls,
		runId: provenance.runId,
	});
}

function loadAlgorithm32ProfileProvenance(path, profileName) {
	const bytes = readFileSync(path);
	let provenance;
	try {
		provenance = JSON.parse(bytes.toString('utf8'));
	} catch (error) {
		throw new Error(`${path} is not valid JSON: ${error.message}`);
	}
	const identity = validateAlgorithm32ProfileProvenance(provenance, profileName);
	return Object.freeze({
		path: sourcePath(path),
		sha256: sha256(bytes),
		...identity,
	});
}

function metadata(payload) {
	return `<metadata id="provenance">${xml(JSON.stringify(payload))}</metadata>`;
}

function svgDocument({width, height, title, description, provenance, body}) {
	return [
		'<?xml version="1.0" encoding="UTF-8"?>',
		`<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" role="img" aria-labelledby="title description">`,
		`<title id="title">${xml(title)}</title>`,
		`<desc id="description">${xml(description)}</desc>`,
		metadata(provenance),
		'<style>',
		'text{font-family:Arial,Helvetica,sans-serif;fill:#202124}',
		'.title{font-size:24px;font-weight:700}',
		'.subtitle{font-size:14px;fill:#4d5156}',
		'.panel-title{font-size:16px;font-weight:700}',
		'.axis{stroke:#303134;stroke-width:1}',
		'.grid{stroke:#dadce0;stroke-width:1}',
		'.tick{font-size:11px;fill:#5f6368}',
		'.axis-label{font-size:13px;font-weight:600}',
		'.legend{font-size:12px}',
		'.note{font-size:11px;fill:#5f6368}',
		'</style>',
		'<rect width="100%" height="100%" fill="#ffffff"/>',
		body,
		'</svg>',
		'',
	].join('\n');
}

function niceAxisMaximum(maximum, targetTickCount = 5) {
	if (!(maximum > 0)) return Object.freeze({maximum: 1, step: 0.2});
	const roughStep = maximum / targetTickCount;
	const magnitude = 10 ** Math.floor(Math.log10(roughStep));
	const normalized = roughStep / magnitude;
	const factor = normalized <= 1 ? 1 : normalized <= 2 ? 2 : normalized <= 5 ? 5 : 10;
	const step = factor * magnitude;
	return Object.freeze({maximum: Math.ceil(maximum / step) * step, step});
}

function linePath(values, xScale, yScale) {
	return values
		.map((value, index) => `${index === 0 ? 'M' : 'L'}${number(xScale(index), 3)},${number(yScale(value), 3)}`)
		.join(' ');
}

function marker(cx, cy, color, radius = 2.5, fill = color, opacity = 1) {
	return `<circle cx="${number(cx, 3)}" cy="${number(cy, 3)}" r="${radius}" fill="${fill}" stroke="${color}" stroke-width="1.5" opacity="${opacity}"/>`;
}

function renderLinePlot({
	x,
	y,
	width,
	height,
	labels,
	series,
	yMaximum,
	yStep,
	yLabel,
	xLabel,
	xTickEvery = 2,
	xTickFormatter = (label) => label,
	pointRadius = 2.2,
}) {
	const xScale = (index) => x + (index * width) / Math.max(labels.length - 1, 1);
	const yScale = (value) => y + height - (value * height) / yMaximum;
	const pieces = [];

	for (let tick = 0; tick <= yMaximum + yStep * 0.25; tick += yStep) {
		const py = yScale(tick);
		pieces.push(
			`<line class="grid" x1="${x}" y1="${number(py, 3)}" x2="${x + width}" y2="${number(py, 3)}"/>`,
			`<text class="tick" x="${x - 10}" y="${number(py + 4, 3)}" text-anchor="end">${xml(number(tick, 4))}</text>`,
		);
	}
	pieces.push(
		`<line class="axis" x1="${x}" y1="${y}" x2="${x}" y2="${y + height}"/>`,
		`<line class="axis" x1="${x}" y1="${y + height}" x2="${x + width}" y2="${y + height}"/>`,
	);
	labels.forEach((label, index) => {
		if (index % xTickEvery !== 0 && index !== labels.length - 1) return;
		const px = xScale(index);
		pieces.push(
			`<line class="axis" x1="${number(px, 3)}" y1="${y + height}" x2="${number(px, 3)}" y2="${y + height + 5}"/>`,
			`<text class="tick" x="${number(px, 3)}" y="${y + height + 19}" text-anchor="middle">${xml(xTickFormatter(label))}</text>`,
		);
	});
	pieces.push(
		`<text class="axis-label" x="${x + width / 2}" y="${y + height + 43}" text-anchor="middle">${xml(xLabel)}</text>`,
		`<text class="axis-label" transform="translate(${x - 61} ${y + height / 2}) rotate(-90)" text-anchor="middle">${xml(yLabel)}</text>`,
	);

	for (const item of series) {
		const dash = item.dash ? ` stroke-dasharray="${item.dash}"` : '';
		const opacity = item.opacity ?? 1;
		pieces.push(
			`<path d="${linePath(item.values, xScale, yScale)}" fill="none" stroke="${item.color}" stroke-width="${item.width ?? 2}" opacity="${opacity}"${dash}/>`,
		);
		item.values.forEach((value, index) => {
			pieces.push(marker(xScale(index), yScale(value), item.color, pointRadius, item.color, opacity));
		});
	}
	return Object.freeze({svg: pieces.join('\n'), xScale, yScale});
}

function renderLegend(series, x, y, columns = 1, rowHeight = 22, columnWidth = 160) {
	const rows = Math.ceil(series.length / columns);
	return series
		.map((item, index) => {
			const column = Math.floor(index / rows);
			const row = index % rows;
			const px = x + column * columnWidth;
			const py = y + row * rowHeight;
			const dash = item.dash ? ` stroke-dasharray="${item.dash}"` : '';
			return [
				`<line x1="${px}" y1="${py}" x2="${px + 28}" y2="${py}" stroke="${item.color}" stroke-width="${item.width ?? 2}"${dash}/>`,
				marker(px + 14, py, item.color, 2.5),
				`<text class="legend" x="${px + 36}" y="${py + 4}">${xml(item.label)}</text>`,
			].join('');
		})
		.join('\n');
}

export function parseMeasurementPacketBoundary(text, sourceName = '<memory>') {
	const lines = text.split(/\r?\n/).filter(Boolean);
	const expectedHeader = ['time', 'grid_x', 'grid_y', ...Array.from({length: 40}, (_, index) => `lambda_${index}`)];
	if (lines.length === 0 || lines[0].split('\t').join('\0') !== expectedHeader.join('\0')) {
		throw new Error(`${sourceName} does not have the canonical B1 measurement header.`);
	}
	const conditions = new Map(
		CAPTURE_TIMES.map((time) => [time, Array.from({length: 9}, () => Array(9).fill(undefined))]),
	);
	for (let lineIndex = 1; lineIndex < lines.length; lineIndex += 1) {
		const fields = lines[lineIndex].split('\t');
		if (fields.length !== 43) {
			throw new Error(`${sourceName}:${lineIndex + 1} has ${fields.length} columns; expected 43.`);
		}
		const time = fields[0];
		const x = Number(fields[1]);
		const y = Number(fields[2]);
		const packet = fields.slice(3).map(Number);
		if (
			!conditions.has(time) ||
			!Number.isInteger(x) ||
			!Number.isInteger(y) ||
			x < 0 ||
			x > 8 ||
			y < 0 ||
			y > 8 ||
			packet.some((value) => !Number.isFinite(value))
		) {
			throw new Error(`${sourceName}:${lineIndex + 1} has an invalid condition, coordinate, or value.`);
		}
		const grid = conditions.get(time);
		if (grid[x][y] !== undefined) {
			throw new Error(`${sourceName} repeats ${time} (${x},${y}).`);
		}
		grid[x][y] = Object.freeze(packet);
	}
	for (const [time, grid] of conditions) {
		for (let x = 0; x < 9; x += 1) {
			for (let y = 0; y < 9; y += 1) {
				if (!Array.isArray(grid[x][y]) || grid[x][y].length !== 40) {
					throw new Error(`${sourceName} is missing ${time} (${x},${y}).`);
				}
			}
		}
	}
	return conditions;
}

export function computeB1Scores(measurements, models, modelNames = PUBLISHED_MODELS) {
	const result = new Map();
	for (const model of modelNames) {
		const byTime = models.get(model);
		if (!byTime) throw new Error(`Published spectra table is missing ${model}.`);
		const conditions = CAPTURE_TIMES.map((time) => {
			const measuredGrid = measurements.get(time);
			const modelGrid = byTime.get(time);
			if (!measuredGrid || !modelGrid) throw new Error(`Missing B1 grid for ${model}/${time}.`);
			let squareSum = 0;
			let count = 0;
			for (let x = 0; x < 9; x += 1) {
				for (let y = 0; y < 9; y += 1) {
					for (const wavelengthIndex of SCORE_SAMPLE_INDICES) {
						const residual = modelGrid[x][y][wavelengthIndex] - measuredGrid[x][y][wavelengthIndex];
						squareSum += residual * residual;
						count += 1;
					}
				}
			}
			return Object.freeze({
				time,
				sampleCount: count,
				rmseMilliwatt: Math.sqrt(squareSum / count) * 1000,
			});
		});
		const aggregate = Math.sqrt(
			conditions.reduce((sum, condition) => sum + condition.rmseMilliwatt ** 2, 0) / conditions.length,
		);
		result.set(
			model,
			Object.freeze({
				model,
				conditions: Object.freeze(conditions),
				aggregateRmseMilliwatt: aggregate,
			}),
		);
	}
	return result;
}

export function computeB2MeasurementCurve(measurements) {
	return Object.freeze(
		CAPTURE_TIMES.map((time) => {
			const packets = measurements.get(time);
			if (!packets) throw new Error(`Missing B2 measurement grid for ${time}.`);
			const bandGrid = packets.map((row) => row.map((packet) => integrateSourcePacket([...packet])));
			const field = new HemisphericalFunction(bandGrid);
			const integration = integrateHemisphericalRadiance((zenith, azimuth) => field.sample(zenith, azimuth));
			return Object.freeze({
				localTime: time,
				diffuseSkyIrradiance: integration.irradiance,
			});
		}),
	);
}

export function computeB3ResidualSummary(measurementCube, referenceCube) {
	const score = scoreCubes(measurementCube, referenceCube);
	const spectral = referenceCube.wavelengthsNm.map((wavelengthNm, wavelengthIndex) => {
		let squareSum = 0;
		let measuredSum = 0;
		let referenceSum = 0;
		let count = 0;
		for (let conditionIndex = 0; conditionIndex < referenceCube.values.length; conditionIndex += 1) {
			for (let directionIndex = 0; directionIndex < referenceCube.directions.length; directionIndex += 1) {
				const measured = measurementCube.values[conditionIndex][directionIndex][wavelengthIndex];
				const reference = referenceCube.values[conditionIndex][directionIndex][wavelengthIndex];
				const residual = reference - measured;
				squareSum += residual * residual;
				measuredSum += measured;
				referenceSum += reference;
				count += 1;
			}
		}
		return Object.freeze({
			wavelengthNm,
			sampleCount: count,
			measuredMeanWatt: measuredSum / count,
			referenceMeanWatt: referenceSum / count,
			rmseMilliwatt: Math.sqrt(squareSum / count) * 1000,
		});
	});

	const zenithGroups = new Map();
	referenceCube.directions.forEach((direction, directionIndex) => {
		const key = number(direction.viewZenithDeg, 6);
		if (!zenithGroups.has(key)) {
			zenithGroups.set(key, {
				viewZenithDeg: direction.viewZenithDeg,
				directionIndices: [],
			});
		}
		zenithGroups.get(key).directionIndices.push(directionIndex);
	});
	const angular = [...zenithGroups.values()]
		.sort((left, right) => left.viewZenithDeg - right.viewZenithDeg)
		.map((group) => {
			let squareSum = 0;
			let count = 0;
			for (let conditionIndex = 0; conditionIndex < referenceCube.values.length; conditionIndex += 1) {
				for (const directionIndex of group.directionIndices) {
					for (
						let wavelengthIndex = 0;
						wavelengthIndex < referenceCube.wavelengthsNm.length;
						wavelengthIndex += 1
					) {
						const residual =
							referenceCube.values[conditionIndex][directionIndex][wavelengthIndex] -
							measurementCube.values[conditionIndex][directionIndex][wavelengthIndex];
						squareSum += residual * residual;
						count += 1;
					}
				}
			}
			return Object.freeze({
				viewZenithDeg: group.viewZenithDeg,
				directionCount: group.directionIndices.length,
				sampleCount: count,
				rmseMilliwatt: Math.sqrt(squareSum / count) * 1000,
			});
		});
	return Object.freeze({score, spectral: Object.freeze(spectral), angular: Object.freeze(angular)});
}

export function renderB1PerTimeFigure(scores, algorithm32Score, provenance = {}) {
	const candidateLabel = provenance.candidateLabel ?? 'Algorithm32';
	const algorithmProfiles = [['algorithm32', candidateLabel, algorithm32Score]];
	if (
		algorithmProfiles.some(
			([, , score]) =>
				!score || !Array.isArray(score.conditions) || score.conditions.length !== CAPTURE_TIMES.length,
		)
	) {
		throw new TypeError('B1 figure rendering requires the complete selected order-4 Algorithm32 score.');
	}
	const localSeries = PUBLISHED_MODELS.map((model) => ({
		key: model,
		label: MODEL_LABELS[model],
		color: COLORS[model],
		dash: DASHES[model],
		opacity: 0.52,
		width: 1.7,
		values: scores.get(model).conditions.map((condition) => condition.rmseMilliwatt),
	}));
	const algorithmSeries = algorithmProfiles.map(([key, label, score]) => ({
		key,
		label,
		color: COLORS[key],
		dash: DASHES[key],
		opacity: 1,
		width: ALGORITHM32_STROKE_WIDTH,
		values: score.conditions.map((condition) => condition.rmseMilliwatt),
	}));
	const series = [...localSeries, ...algorithmSeries];
	const axis = niceAxisMaximum(Math.max(...series.flatMap((item) => item.values)), 5);
	const plot = renderLinePlot({
		x: 92,
		y: 118,
		width: 820,
		height: 470,
		labels: CAPTURE_TIMES,
		series,
		yMaximum: axis.maximum,
		yStep: axis.step,
		yLabel: 'Spectral-radiance RMSE (mW m^-2 sr^-1 nm^-1)',
		xLabel: 'Local time on 2013-05-27',
		xTickEvery: 2,
	});
	const oracleTimes = Object.keys(PUBLISHED_RMSE_ORACLE.perTime);
	const oraclePoints = [];
	for (const model of PUBLISHED_MODELS) {
		for (const time of oracleTimes) {
			const index = CAPTURE_TIMES.indexOf(time);
			const value = PUBLISHED_RMSE_ORACLE.perTime[time][model];
			const px = plot.xScale(index);
			const py = plot.yScale(value);
			oraclePoints.push(
				`<path d="M${number(px, 3)},${number(py - 6, 3)} L${number(px + 6, 3)},${number(py, 3)} L${number(px, 3)},${number(py + 6, 3)} L${number(px - 6, 3)},${number(py, 3)} Z" fill="#ffffff" stroke="${COLORS[model]}" stroke-width="2.5"/>`,
			);
		}
	}
	const legendX = 950;
	const legendY = 126;
	const legendRowHeight = 25;
	const publishedValueKeyY = legendY + series.length * legendRowHeight + 18;
	const body = [
		'<text class="title" x="60" y="42">B1 - Algorithm32 profile directional spectral-radiance error</text>',
		'<text class="subtitle" x="60" y="70">Algorithm32 is the selected cumulative-through-order-4 result. Open diamonds are paper Figure 5 values; faint lines are optional local model cross-checks.</text>',
		plot.svg,
		oraclePoints.join('\n'),
		renderLegend(series, legendX, legendY, 1, legendRowHeight, 210),
		`<g data-role="published-value-key" data-y="${publishedValueKeyY}" transform="translate(0 ${publishedValueKeyY})">`,
		'<path d="M954,-6 L960,0 L954,6 L948,0 Z" fill="#ffffff" stroke="#303134" stroke-width="2.5"/>',
		'<text class="legend" x="968" y="5">Published value (primary)</text>',
		'</g>',
		'<text class="note" x="60" y="677">Algorithm32 is scored against the same Kider measurements at all 17 times. Paper model values are numeric only at the three displayed Figure 5 times.</text>',
	].join('\n');
	return svgDocument({
		width: 1200,
		height: 710,
		title: 'B1 Algorithm32 profile directional spectral-radiance error over time',
		description:
			'Selected order-4 Algorithm32 per-time RMSE against Kider directional spectral radiance, shown with published Figure 5 values and optional local model cross-checks.',
		provenance: {
			generator: 'scripts/experiments/generate-benchmark-figures.js',
			observable: 'B1 per-time spectral-radiance RMSE',
			status: 'Algorithm32 is the selected J4 result and is shown on all 17 conditions; published Figure 5 values remain the primary external model reference',
			...provenance,
		},
		body,
	});
}

export function renderB1AggregateFigure(scores, algorithm32Score, provenance = {}) {
	const candidateLabel = provenance.candidateLabel ?? 'Algorithm32';
	const algorithmProfiles = [['algorithm32', candidateLabel, algorithm32Score, '#fff5f6']];
	if (algorithmProfiles.some(([, , score]) => !score || !Number.isFinite(score.aggregateRmseMilliwatt))) {
		throw new TypeError('B1 aggregate figure rendering requires the selected order-4 Algorithm32 aggregate score.');
	}
	const width = 1200;
	const height = 980;
	const plotX = 180;
	const plotWidth = 770;
	const plotTop = 116;
	const rowHeight = 52;
	const rowCount = PUBLISHED_MODELS.length + algorithmProfiles.length;
	const comparedValues = PUBLISHED_MODELS.flatMap((model) => [
		PUBLISHED_RMSE_ORACLE.aggregate[model],
		scores.get(model).aggregateRmseMilliwatt,
	]);
	comparedValues.push(...algorithmProfiles.map(([, , score]) => score.aggregateRmseMilliwatt));
	const axis = niceAxisMaximum(Math.max(...comparedValues), 5);
	const maximum = axis.maximum;
	const xScale = (value) => plotX + (value * plotWidth) / maximum;
	const pieces = [
		'<text class="title" x="60" y="42">B1 - Algorithm32 profile aggregate RMSE beside published models</text>',
		'<text class="subtitle" x="60" y="70">Colored diamonds are paper values; open circles are optional local reproductions; the colored square is Algorithm32 at cumulative order 4.</text>',
	];
	for (let tick = 0; tick <= maximum + axis.step * 0.25; tick += axis.step) {
		const px = xScale(tick);
		pieces.push(
			`<line class="grid" x1="${px}" y1="94" x2="${px}" y2="${plotTop + rowHeight * rowCount - 10}"/>`,
			`<text class="tick" x="${px}" y="104" text-anchor="middle">${number(tick, 4)}</text>`,
		);
	}
	PUBLISHED_MODELS.forEach((model, index) => {
		const local = scores.get(model).aggregateRmseMilliwatt;
		const published = PUBLISHED_RMSE_ORACLE.aggregate[model];
		const y = plotTop + index * rowHeight + 17;
		pieces.push(
			`<text class="legend" x="${plotX - 16}" y="${y + 4}" text-anchor="end">${xml(MODEL_LABELS[model])}</text>`,
			`<line x1="${number(xScale(published), 3)}" y1="${y - 5}" x2="${number(xScale(local), 3)}" y2="${y + 5}" stroke="#9aa0a6" stroke-width="1.5"/>`,
			`<path d="M${number(xScale(published), 3)},${y - 11} L${number(xScale(published) + 6, 3)},${y - 5} L${number(xScale(published), 3)},${y + 1} L${number(xScale(published) - 6, 3)},${y - 5} Z" fill="${COLORS[model]}" stroke="${COLORS[model]}" stroke-width="1.5"/>`,
			marker(xScale(local), y + 6, '#202124', 4, '#ffffff'),
			`<text class="tick" x="982" y="${y + 4}">${number(published, 1)} / ${number(local, 4)} / ${local - published >= 0 ? '+' : ''}${number(local - published, 4)}</text>`,
		);
	});
	const algorithm32Y = plotTop + PUBLISHED_MODELS.length * rowHeight + 17;
	algorithmProfiles.forEach(([key, label, score, background], index) => {
		const y = algorithm32Y + index * rowHeight;
		pieces.push(
			`<rect x="${plotX - 162}" y="${y - 20}" width="1115" height="42" rx="5" fill="${background}"/>`,
			`<text class="legend" x="${plotX - 16}" y="${y + 4}" text-anchor="end" font-weight="700">${label}</text>`,
			`<rect x="${number(xScale(score.aggregateRmseMilliwatt) - 5, 3)}" y="${y - 5}" width="10" height="10" fill="${COLORS[key]}"/>`,
			`<text class="tick" x="982" y="${y + 4}">${number(score.aggregateRmseMilliwatt, 6)} / scored against Kider</text>`,
		);
	});
	const footerY = plotTop + rowHeight * rowCount + 54;
	pieces.push(
		`<text class="axis-label" x="${plotX + plotWidth / 2}" y="${footerY - 23}" text-anchor="middle">Aggregate spectral-radiance RMSE (mW m^-2 sr^-1 nm^-1)</text>`,
		`<path d="M184,${footerY} L190,${footerY + 6} L184,${footerY + 12} L178,${footerY + 6} Z" fill="#0072b2" stroke="#0072b2" stroke-width="1.5"/>`,
		`<text class="legend" x="198" y="${footerY + 10}">Published display value (primary)</text>`,
		marker(425, footerY + 6, '#202124', 4, '#ffffff'),
		`<text class="legend" x="439" y="${footerY + 10}">Local cross-check</text>`,
		`<text class="note" x="600" y="${footerY + 10}">published / local / difference; Algorithm32 is scored directly against Kider</text>`,
		`<text class="note" x="60" y="${footerY + 36}">Paper aggregates are displayed to one decimal except the separately reported 11.48 libRadTran fit; Algorithm32 uses the unchanged published scoring metric.</text>`,
	);
	return svgDocument({
		width,
		height,
		title: 'B1 aggregate spectral-radiance RMSE with Algorithm32 profiles',
		description:
			'Selected order-4 Algorithm32 aggregate RMSE against Kider measurements beside the nine displayed aggregate values in the Bruneton comparison paper and optional local cross-checks.',
		provenance: {
			generator: 'scripts/experiments/generate-benchmark-figures.js',
			observable: 'B1 aggregate spectral-radiance RMSE',
			status: 'Algorithm32 is the selected J4 result and is included beside primary published aggregate values and optional local cross-checks',
			...provenance,
		},
		body: pieces.join('\n'),
	});
}

export function renderB2Figure(measurementCurve, modelCurves = null, algorithm32Curve = null, provenance = {}) {
	const candidateLabel = provenance.candidateLabel ?? 'Algorithm32';
	const algorithmProfiles = [['algorithm32', candidateLabel, algorithm32Curve]];
	if (
		algorithmProfiles.some(
			([, , curve]) =>
				!curve || !Array.isArray(curve.conditions) || curve.conditions.length !== measurementCurve.length,
		)
	) {
		throw new TypeError('B2 figure rendering requires the complete selected order-4 Algorithm32 curve.');
	}
	const measurementSeries = {
		key: 'measurements',
		label: 'Measurements',
		color: COLORS.measurements,
		dash: DASHES.measurements,
		width: 3.2,
		values: measurementCurve.map((item) => item.diffuseSkyIrradiance),
	};
	const series = [measurementSeries];
	if (modelCurves) {
		for (const model of PUBLISHED_MODELS) {
			series.push({
				key: model,
				label: MODEL_LABELS[model],
				color: COLORS[model],
				dash: DASHES[model],
				values: modelCurves.conditions.map((condition) => condition.diffuseSkyIrradiance[model]),
			});
		}
	}
	for (const [key, label, curve] of algorithmProfiles) {
		series.push({
			key,
			label,
			color: COLORS[key],
			dash: DASHES[key],
			width: ALGORITHM32_STROKE_WIDTH,
			values: curve.conditions.map((condition) => condition.diffuseSkyIrradiance.proposed),
		});
	}
	const axis = niceAxisMaximum(Math.max(...series.flatMap((item) => item.values)), 8);
	const plot = renderLinePlot({
		x: 92,
		y: 118,
		width: 820,
		height: 470,
		labels: measurementCurve.map((item) => item.localTime),
		series,
		yMaximum: axis.maximum,
		yStep: axis.step,
		yLabel: 'Diffuse sky irradiance, 360-720 nm (W m^-2)',
		xLabel: 'Local time on 2013-05-27',
		xTickEvery: 2,
	});
	const body = [
		'<text class="title" x="60" y="42">B2 - Algorithm32 profile diffuse-sky irradiance</text>',
		'<text class="subtitle" x="60" y="70">Algorithm32 is the selected cumulative-through-order-4 result. Bruneton Figure 8 is the primary published plot.</text>',
		plot.svg,
		renderLegend(series, 950, 120, 1, modelCurves ? 27 : 24, 210),
		`<text class="note" x="60" y="676">${modelCurves ? 'The nine comparison-model curves are optional local regenerations from the pinned published code, not source-authored numeric Figure 8 values.' : 'No optional local comparison-model spectra table was available.'}</text>`,
		'<text class="note" x="60" y="694">Measurement and Algorithm32 use the same B1 directional field integration and exclude direct Sun. B2 is an integral transform of B1, not independent evidence.</text>',
	].join('\n');
	return svgDocument({
		width: 1200,
		height: 720,
		title: 'B2 hemispherical diffuse-sky irradiance',
		description: `Selected order-4 Algorithm32 plus the measured seventeen-condition 360 to 720 nanometer diffuse-sky irradiance curve${modelCurves ? ', with nine optional regenerated comparison-model curves' : ''}.`,
		provenance: {
			generator: 'scripts/experiments/generate-benchmark-figures.js',
			observable: 'B2 360-720 nm diffuse-sky hemispherical irradiance',
			status: `Algorithm32 is the selected J4 result; published Figure 8 plot is primary; local measurement aggregate${modelCurves ? ' and comparison-model curves' : ''} are derived from the B1 directional field`,
			...provenance,
		},
		body,
	});
}

function renderSmallLinePanel({
	x,
	y,
	width,
	height,
	title,
	labels,
	series,
	xLabel,
	yLabel,
	xTickEvery,
	xTickFormatter,
}) {
	const axis = niceAxisMaximum(Math.max(...series.flatMap((item) => item.values)), 4);
	const plot = renderLinePlot({
		x,
		y: y + 32,
		width,
		height: height - 70,
		labels,
		series,
		yMaximum: axis.maximum,
		yStep: axis.step,
		yLabel,
		xLabel,
		xTickEvery,
		xTickFormatter,
		pointRadius: 2.5,
	});
	return `<text class="panel-title" x="${x}" y="${y + 16}">${xml(title)}</text>\n${plot.svg}`;
}

export function renderB3Figure(algorithm32Summary, algorithm32Cube, localReferenceSummary = null, provenance = {}) {
	const candidateLabel = provenance.candidateLabel ?? 'Algorithm32';
	if (!algorithm32Summary?.score || !Array.isArray(algorithm32Cube?.conditions)) {
		throw new TypeError('B3 figure rendering requires the selected order-4 Algorithm32 cube and summary.');
	}
	const variants = Object.freeze([
		Object.freeze({
			label: candidateLabel,
			color: COLORS.algorithm32,
			dash: DASHES.algorithm32,
			summary: algorithm32Summary,
		}),
	]);
	const diagnosticSeries = (selector) =>
		variants.map((variant) => ({
			label: variant.label,
			color: variant.color,
			dash: variant.dash,
			values: selector(variant.summary),
			width: ALGORITHM32_STROKE_WIDTH,
		}));
	const aggregateLines = variants.map((variant, index) => {
		const rmse = variant.summary.score.rmseMilliwatt;
		const difference = rmse - B3_PUBLISHED.coarse.rmseMilliwatt;
		const ratio = rmse / B3_PUBLISHED.coarse.rmseMilliwatt;
		return `<text class="panel-title" x="76" y="${136 + index * 22}" fill="${variant.color}">${variant.label} RMSE: ${number(rmse, 6)}  |  coarse difference ${difference >= 0 ? '+' : ''}${number(difference, 6)}  |  ratio ${number(ratio, 6)}</text>`;
	});
	const body = [
		'<text class="title" x="48" y="42">B3 - Algorithm32 profile scores beside published libRadtran</text>',
		'<text class="subtitle" x="48" y="70">Aggregate values share the Kider metric. Algorithm32 is cumulative through order 4. Diagnostics are not pointwise libRadtran comparisons.</text>',
		'<rect x="48" y="88" width="1304" height="176" rx="6" fill="#f8f9fa" stroke="#dadce0"/>',
		`<text class="panel-title" x="76" y="116">Published libRadtran RMSE: ${number(B3_PUBLISHED.coarse.rmseMilliwatt, 2)} coarse; ${number(B3_PUBLISHED.refined.rmseMilliwatt, 2)} refined (primary external results)</text>`,
		...aggregateLines,
		`<text class="note" x="76" y="244">${localReferenceSummary ? `Optional local fixed-libRadtran cross-check: ${number(localReferenceSummary.score.rmseMilliwatt, 8)}.` : 'No optional local fixed-libRadtran cube was supplied.'}</text>`,
		renderSmallLinePanel({
			x: 82,
			y: 286,
			width: 570,
			height: 310,
			title: 'A. RMSE by measurement time',
			labels: algorithm32Cube.conditions.map((condition) => condition.id.replace('h', ':')),
			series: diagnosticSeries((summary) => summary.score.conditions.map((condition) => condition.rmseMilliwatt)),
			xLabel: 'Local time',
			yLabel: 'RMSE (mW m^-2 sr^-1 nm^-1)',
			xTickEvery: 2,
		}),
		renderSmallLinePanel({
			x: 782,
			y: 286,
			width: 570,
			height: 310,
			title: 'B. RMSE by wavelength',
			labels: algorithm32Summary.spectral.map((item) => item.wavelengthNm),
			series: diagnosticSeries((summary) => summary.spectral.map((item) => item.rmseMilliwatt)),
			xLabel: 'Wavelength (nm)',
			yLabel: 'RMSE (mW m^-2 sr^-1 nm^-1)',
			xTickEvery: 5,
			xTickFormatter: (value) => number(value, 2),
		}),
		renderSmallLinePanel({
			x: 415,
			y: 666,
			width: 570,
			height: 300,
			title: 'C. RMSE by view-zenith ring',
			labels: algorithm32Summary.angular.map((item) => item.viewZenithDeg),
			series: diagnosticSeries((summary) => summary.angular.map((item) => item.rmseMilliwatt)),
			xLabel: 'View zenith angle (degrees)',
			yLabel: 'RMSE (mW m^-2 sr^-1 nm^-1)',
			xTickEvery: 1,
			xTickFormatter: (value) => number(value, 1),
		}),
		`<line x1="48" y1="995" x2="76" y2="995" stroke="${COLORS.algorithm32}" stroke-width="${ALGORITHM32_STROKE_WIDTH}"/><text class="legend" x="84" y="999">${xml(candidateLabel)}</text>`,
		`<text class="note" x="48" y="1026">All diagnostics use ${algorithm32Summary.score.sampleCount.toLocaleString('en-US')} Kider comparisons; maximum absolute residuals: ${variants.map((variant) => `${variant.label} ${number(variant.summary.score.maximumAbsoluteResidualWatt, 6)}`).join(', ')} W m^-2 sr^-1 nm^-1.</text>`,
		'<text class="note" x="48" y="1046">The paper supplies aggregate libRadtran scores, not the decomposed curves below. B3 reuses B1 measurements and does not constitute independent or out-of-sample validation.</text>',
	].join('\n');
	return svgDocument({
		width: 1400,
		height: 1070,
		title: 'B3 Algorithm32 profile aggregate scores beside published libRadtran',
		description:
			'Selected order-4 Algorithm32 aggregate spectral-radiance RMSE beside the published libRadtran coarse and refined values, with Kider residual diagnostics by time, wavelength, and view-zenith ring.',
		provenance: {
			generator: 'scripts/experiments/generate-benchmark-figures.js',
			observable: 'B3 Algorithm32 profile spectral-radiance scores and Kider residual diagnostics',
			status: 'Algorithm32 is the selected J4 result and is compared with published libRadtran coarse and refined scores; detailed panels compare it with Kider measurements',
			...provenance,
		},
		body,
	});
}

export function parseArguments(argv) {
	const options = {};
	const names = new Map([
		['--published-models', 'publishedModels'],
		['--measurements', 'measurements'],
		['--reference-cube', 'referenceCube'],
		['--algorithm32-spectra', 'algorithm32Spectra'],
		['--algorithm32-cube', 'algorithm32Cube'],
		['--algorithm32-provenance', 'algorithm32Provenance'],
		['--algorithm32-j2-spectra', 'algorithm32J2Spectra'],
		['--algorithm32-j2-cube', 'algorithm32J2Cube'],
		['--algorithm32-j2-provenance', 'algorithm32J2Provenance'],
		['--algorithm32-j3-spectra', 'algorithm32J3Spectra'],
		['--algorithm32-j3-cube', 'algorithm32J3Cube'],
		['--algorithm32-j3-provenance', 'algorithm32J3Provenance'],
		['--algorithm32-j4-spectra', 'algorithm32J4Spectra'],
		['--algorithm32-j4-cube', 'algorithm32J4Cube'],
		['--algorithm32-j4-provenance', 'algorithm32J4Provenance'],
		['--algorithm32-j5-spectra', 'algorithm32J5Spectra'],
		['--algorithm32-j5-cube', 'algorithm32J5Cube'],
		['--algorithm32-j5-provenance', 'algorithm32J5Provenance'],
		['--output-root', 'outputRoot'],
	]);
	for (let index = 0; index < argv.length; index += 1) {
		if (argv[index] === '--backend') {
			const backend = argv[index + 1];
			if (!['cpu', 'gpu'].includes(backend)) {
				throw new Error('--backend requires cpu or gpu.');
			}
			options.resultSubdirectory = backend;
			index += 1;
			continue;
		} else if (argv[index] === '--profile-family') {
			if (!argv[index + 1]) {
				throw new Error('--profile-family requires native or paper.');
			}
			options.profileFamily = argv[++index];
			resolveFigureFamily(options.profileFamily);
			continue;
		}
		const key = names.get(argv[index]);
		if (!key || !argv[index + 1]) {
			throw new Error(`Unknown or incomplete argument: ${argv[index]}`);
		}
		options[key] = resolve(argv[++index]);
	}
	return options;
}

function resolvePublishedModels(explicitPath) {
	if (explicitPath) return explicitPath;
	return DEFAULT_MODEL_CANDIDATES.find((candidate) => existsSync(candidate)) ?? null;
}

function writeFigure(path, content) {
	mkdirSync(dirname(path), {recursive: true});
	if (Buffer.isBuffer(content)) {
		writeFileSync(path, content);
	} else {
		writeFileSync(path, content, 'utf8');
	}
	const bytes = readFileSync(path);
	return Object.freeze({
		path,
		relativePath: sourcePath(path),
		byteLength: bytes.byteLength,
		sha256: sha256(bytes),
	});
}

export function generateBenchmarkFigures(options = {}) {
	const b1Only = options.b1Only === true;
	const profileFamilyId = options.profileFamily ?? 'native';
	const profileFamily = resolveFigureFamily(profileFamilyId);
	const familyPaths = profileFamily.paths;
	const measurementPath = options.measurements ?? DEFAULT_MEASUREMENTS;
	const referenceCubePath = options.referenceCube ?? DEFAULT_REFERENCE_CUBE;
	const algorithm32SpectraPath = options.algorithm32Spectra ?? familyPaths.algorithm32Spectra;
	const algorithm32CubePath = options.algorithm32Cube ?? familyPaths.algorithm32Cube;
	const algorithm32ProvenancePath = options.algorithm32Provenance ?? familyPaths.algorithm32Provenance;
	const selectedAlgorithm32SpectraPath = options.singleCandidate
		? algorithm32SpectraPath
		: (options.algorithm32J4Spectra ?? familyPaths.algorithm32J4Spectra);
	const selectedAlgorithm32CubePath = options.singleCandidate
		? algorithm32CubePath
		: (options.algorithm32J4Cube ?? familyPaths.algorithm32J4Cube);
	const selectedAlgorithm32ProvenancePath = options.singleCandidate
		? algorithm32ProvenancePath
		: (options.algorithm32J4Provenance ?? familyPaths.algorithm32J4Provenance);
	const publishedModelsPath = resolvePublishedModels(options.publishedModels);
	const outputRoot = options.outputRoot ?? RESULT_ROOT;
	const resultSubdirectory = options.resultSubdirectory ?? null;
	if (resultSubdirectory !== null && !['cpu', 'gpu'].includes(resultSubdirectory)) {
		throw new Error('Figure result subdirectory must be cpu or gpu.');
	}
	if (!existsSync(measurementPath)) throw new Error(`Measurement boundary not found: ${measurementPath}`);
	if (!b1Only && !existsSync(referenceCubePath)) throw new Error(`B3 reference cube not found: ${referenceCubePath}`);
	if (!existsSync(algorithm32SpectraPath)) {
		throw new Error(`Algorithm32 B1/B2 spectra boundary not found: ${algorithm32SpectraPath}`);
	}
	if (!b1Only && !existsSync(algorithm32CubePath)) {
		throw new Error(`Algorithm32 B3 cube not found: ${algorithm32CubePath}`);
	}
	if (!existsSync(algorithm32ProvenancePath)) {
		throw new Error(`Algorithm32 provenance not found: ${algorithm32ProvenancePath}`);
	}
	if (!existsSync(selectedAlgorithm32SpectraPath)) {
		throw new Error(`Selected Algorithm32 J4 spectra boundary not found: ${selectedAlgorithm32SpectraPath}`);
	}
	if (!b1Only && !existsSync(selectedAlgorithm32CubePath)) {
		throw new Error(`Selected Algorithm32 J4 cube not found: ${selectedAlgorithm32CubePath}`);
	}
	if (!existsSync(selectedAlgorithm32ProvenancePath)) {
		throw new Error(`Selected Algorithm32 J4 provenance not found: ${selectedAlgorithm32ProvenancePath}`);
	}
	if (!publishedModelsPath || !existsSync(publishedModelsPath)) {
		throw new Error(
			'A complete B1 published-model spectra table is required to generate the mandatory B1 figures.',
		);
	}

	const measurementBytes = readFileSync(measurementPath);
	const measurements = parseMeasurementPacketBoundary(measurementBytes.toString('utf8'), measurementPath);
	const publishedModels = parseSpectraTsv(publishedModelsPath);
	const b1Scores = computeB1Scores(measurements, publishedModels);
	const algorithm32Models = parseSpectraTsv(selectedAlgorithm32SpectraPath);
	if (algorithm32Models.size !== 1 || !algorithm32Models.has('proposed')) {
		throw new Error('Algorithm32 spectra boundary must contain exactly one model named proposed.');
	}
	const b1Algorithm32Score = computeB1Scores(measurements, algorithm32Models, ['proposed']).get('proposed');
	const algorithm32Profile = loadAlgorithm32ProfileProvenance(
		selectedAlgorithm32ProvenancePath,
		options.singleCandidate ? profileFamily.profileNames.default : profileFamily.profileNames.j4,
	);
	const boundarySamplingIdentity = profileFamilyId.startsWith('paper')
		? 'direct 40-coordinate point-sample transport; no native-15 projection'
		: 'native output projected by predeclared half-open bins';
	const commonProvenance = {
		measurements: {
			path: sourcePath(measurementPath),
			sha256: sha256(measurementBytes),
		},
		publishedModels: {
			path: sourcePath(publishedModelsPath),
			sha256: sha256(readFileSync(publishedModelsPath)),
		},
		algorithm32Boundary: {
			path: sourcePath(selectedAlgorithm32SpectraPath),
			sha256: sha256(readFileSync(selectedAlgorithm32SpectraPath)),
			provenance: algorithm32Profile,
			identity: `${algorithm32Profile.identity}; ${boundarySamplingIdentity}`,
		},
	};
	const figureProvenance = Object.freeze({
		profileFamily: profileFamilyId,
		candidateLabel: 'Algorithm32',
		selectedMaximumScatteringOrder: 4,
		measurements: commonProvenance.measurements,
		publishedModels: commonProvenance.publishedModels,
		algorithm32Boundary: commonProvenance.algorithm32Boundary,
	});

	const artifacts = [];
	const b1Directory = join(
		outputRoot,
		'b1-directional-sky-radiance',
		...(resultSubdirectory ? [resultSubdirectory] : []),
		'figures',
	);
	artifacts.push(
		writeFigure(
			join(b1Directory, 'b1-per-time-rmse.svg'),
			renderB1PerTimeFigure(b1Scores, b1Algorithm32Score, figureProvenance),
		),
	);
	artifacts.push(
		writeFigure(
			join(b1Directory, 'b1-aggregate-rmse.svg'),
			renderB1AggregateFigure(b1Scores, b1Algorithm32Score, figureProvenance),
		),
	);

	const figure5PublishedPanels = loadPublishedFigure5Panels(options.figure5Assets);
	const algorithm32J4ByTime = algorithm32Models.get('proposed');
	const b1Figure5Panels = FIGURE5_SCENES.map((scene) => {
		const panel = renderAlgorithm32Figure5Panel(
			algorithm32J4ByTime.get(scene.time),
			measurements.get(scene.time),
			scene,
		);
		if (
			profileFamilyId === 'native' &&
			scene.algorithm32J4RgbaSha256 &&
			panel.rgbaSha256 !== scene.algorithm32J4RgbaSha256
		) {
			throw new Error(
				`Algorithm32 Figure 5 ${scene.time} RGBA SHA-256 ${panel.rgbaSha256} ` +
					`does not match the selected J4 value ${scene.algorithm32J4RgbaSha256}.`,
			);
		}
		artifacts.push(
			writeFigure(
				join(b1Directory, `b1-figure5-algorithm32-${scene.fileTime}-z${scene.roundedSolarZenithDegrees}.png`),
				panel.png,
			),
		);
		return panel;
	});
	artifacts.push(
		writeFigure(
			join(b1Directory, 'b1-figure5-relative-error-domes.svg'),
			renderFigure5ComparisonSvg(figure5PublishedPanels, b1Figure5Panels, {
				generator: 'scripts/experiments/generate-benchmark-figures.js',
				observable: 'B1 Figure 5 directional 360-720 nm band-integrated relative error',
				publishedPaper: {
					path: 'references/downloads/bruneton-clear-sky-models-paper-1612.04336/paper.pdf',
					sha256: 'a1220d40bc0ed6fd35e8fe728365fb5b371a615051d505dcd611f61ff22dd5c5',
					pageIndex: 7,
					printedPage: 8,
					imageXObjects: 'Im158-Im184',
				},
				renderingAuthority: [
					'references/downloads/bruneton-clear-sky-models-4df2ec6/comparisons.cc',
					'references/downloads/bruneton-clear-sky-models-4df2ec6/hemispherical_function.h',
				],
				...figureProvenance,
			}),
		),
	);
	if (b1Only) {
		return Object.freeze({
			profileFamily: profileFamilyId,
			candidateLabel: 'Algorithm32',
			selectedMaximumScatteringOrder: 4,
			candidateLabels: profileFamily.labels,
			artifacts: Object.freeze(artifacts),
			b1Scores,
			b1Algorithm32Score,
			b1Figure5PublishedPanels: figure5PublishedPanels,
			b1Figure5Panels: Object.freeze(b1Figure5Panels),
			b1Figure5J4Panels: Object.freeze(b1Figure5Panels),
		});
	}

	const b2Measurement = computeB2MeasurementCurve(measurements);
	let b2Models = null;
	try {
		b2Models = reproduceFigure8PublishedModelCurves(publishedModelsPath);
	} catch (error) {
		if (options.requireB2Models) throw error;
	}
	const b2Algorithm32 = reproduceFigure8ModelCurves(selectedAlgorithm32SpectraPath, ['proposed']);
	const b2Directory = join(
		outputRoot,
		'b2-hemispherical-sky-irradiance',
		...(resultSubdirectory ? [resultSubdirectory] : []),
		'figures',
	);
	artifacts.push(
		writeFigure(
			join(b2Directory, 'b2-diffuse-sky-irradiance.svg'),
			renderB2Figure(b2Measurement, b2Models, b2Algorithm32, figureProvenance),
		),
	);

	const measurementCube = readMeasurementBoundary(measurementPath);
	const referenceCube = readCube(referenceCubePath);
	const algorithm32Cube = readCube(selectedAlgorithm32CubePath);
	const b3LocalSummary = computeB3ResidualSummary(measurementCube, referenceCube);
	const b3Algorithm32Summary = computeB3ResidualSummary(measurementCube, algorithm32Cube);
	const b3Directory = join(
		outputRoot,
		'b3-matched-atmosphere-solver',
		...(resultSubdirectory ? [resultSubdirectory] : []),
		'figures',
	);
	artifacts.push(
		writeFigure(
			join(b3Directory, 'b3-fixed-baseline-residuals.svg'),
			renderB3Figure(b3Algorithm32Summary, algorithm32Cube, b3LocalSummary, {
				profileFamily: profileFamilyId,
				candidateLabel: 'Algorithm32',
				selectedMaximumScatteringOrder: 4,
				measurements: commonProvenance.measurements,
				algorithm32Cube: {
					path: sourcePath(selectedAlgorithm32CubePath),
					sha256: sha256(readFileSync(selectedAlgorithm32CubePath)),
				},
				referenceCube: {
					path: sourcePath(referenceCubePath),
					sha256: sha256(readFileSync(referenceCubePath)),
				},
			}),
		),
	);
	return Object.freeze({
		profileFamily: profileFamilyId,
		candidateLabel: 'Algorithm32',
		selectedMaximumScatteringOrder: 4,
		candidateLabels: profileFamily.labels,
		artifacts: Object.freeze(artifacts),
		b1Scores,
		b1Algorithm32Score,
		b1Figure5PublishedPanels: figure5PublishedPanels,
		b1Figure5Panels: Object.freeze(b1Figure5Panels),
		b1Figure5J4Panels: Object.freeze(b1Figure5Panels),
		b2Measurement,
		b2Models,
		b2Algorithm32,
		b3Algorithm32Summary,
		b3LocalSummary,
	});
}

/** Generate the complete original B1 figure family without requiring B2 or B3 inputs. */
export function generateB1Figures(options = {}) {
	return generateBenchmarkFigures({...options, b1Only: true});
}

function renderGenerationReport(run) {
	return [
		'# B1-B3 benchmark figures',
		'',
		`Figures generated: ${run.artifacts.length}`,
		'',
		'| figure | bytes | SHA-256 |',
		'| --- | ---: | --- |',
		...run.artifacts.map(
			(artifact) => `| ${artifact.relativePath} | ${artifact.byteLength} | ${artifact.sha256} |`,
		),
		'',
		`B1 Algorithm32 aggregate RMSE: ${run.b1Algorithm32Score.aggregateRmseMilliwatt.toFixed(6)} mW m^-2 sr^-1 nm^-1 (selected cumulative order 4).`,
		`B1 Figure 5 Algorithm32 panels: ${run.b1Figure5Panels.map((panel) => `${panel.time} ${panel.score.rmseMilliwatt.toFixed(6)}`).join('; ')} mW m^-2 sr^-1 nm^-1.`,
		`B2 Algorithm32 curve: ${run.b2Algorithm32.conditions.length} conditions; Figure 8 remains the primary published plot.`,
		`B3 Algorithm32 aggregate RMSE: ${run.b3Algorithm32Summary.score.rmseMilliwatt.toFixed(6)} mW m^-2 sr^-1 nm^-1; published libRadtran coarse/refined ${B3_PUBLISHED.coarse.rmseMilliwatt}/${B3_PUBLISHED.refined.rmseMilliwatt}.`,
		`B3 optional local fixed-libRadtran cross-check: ${run.b3LocalSummary.score.rmseMilliwatt.toFixed(6)} mW m^-2 sr^-1 nm^-1.`,
		'',
		'The figures add no threshold. Algorithm32 denotes the selected cumulative-through-order-4 boundary. B2 is an integral transform of B1. B3 compares Algorithm32 with published libRadtran only at aggregate scalar level; its detailed panels are Algorithm32-versus-Kider diagnostics. Historical Default and other order results remain retained by the experiment runners but are intentionally omitted from the active figure set.',
		'',
	].join('\n');
}

const invoked = process.argv[1] && pathToFileURL(process.argv[1]).href;
if (invoked === import.meta.url) {
	try {
		const run = generateBenchmarkFigures(parseArguments(process.argv.slice(2)));
		process.stdout.write(renderGenerationReport(run));
	} catch (error) {
		console.error(error instanceof Error ? error.stack : error);
		process.exitCode = 1;
	}
}
