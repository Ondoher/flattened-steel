import { SpectralCalculator } from
	'../../implementation/SpectralCalculator.js';
import {
	buildLocalSunCpuCache,
} from '../../light-sources/local-sun-cpu-cache-build.js';
import {
	LOCAL_SUN_CPU_RECURRENCE_PROVENANCE_IDENTITY,
	LOCAL_SUN_TRANSPORT_INTERVAL_COUNT,
} from '../../light-sources/local-sun-consts.js';
import {
	createLocalSunLaterOrderScatteringKernel,
} from
	'../../light-sources/local-sun-later-order-scattering-density.js';
import {
	buildLocalSunCpuTransportedRadiance,
} from
	'../../light-sources/local-sun-scattering-density-transport.js';
import LocalSunConstructionLightSource from
	'../../light-sources/LocalSunConstructionLightSource.js';
import {
	DEFAULT_NATIVE_PRODUCTION_PROFILE,
	NATIVE_15_SPECTRAL_BASIS,
} from '../../profiles/native-15-profile.js';
import {
	createLocalSunGpuParityGroundBoundary,
	createLocalSunGpuParityOwners,
} from './local-sun-gpu-parity-support.js';

/**
 * Build one current production binary64 N4 result for a ground case.
 *
 * @param {ReturnType<typeof createLocalSunGpuParityOwners>} owners - Supplies the fixed production owners.
 * @param {GroundBoundaryModel | null} groundBoundary - Supplies omitted or reflective ground.
 * @returns {LocalSunCpuCacheResult} The complete pure and cumulative result.
 */
function buildCpuN4(owners, groundBoundary) {
	const calculator = new SpectralCalculator({
		geometry: owners.geometry,
		atmosphere: owners.atmosphere,
		lightSource: owners.physicalSource,
		spectralBasis: NATIVE_15_SPECTRAL_BASIS,
		executionControls: {
			pathIntervalCount:
				LOCAL_SUN_TRANSPORT_INTERVAL_COUNT,
			sourceTransmittanceIntervalCount: 15,
		},
	});
	const primaryLightSource =
		new LocalSunConstructionLightSource({
			source: owners.physicalSource,
			shellFactCache: owners.shellFactCache,
		});
	const operations = {
		createScatteringKernel: ({
			scatteringOrder,
			groundIlluminationRadiance,
		}) => createLocalSunLaterOrderScatteringKernel({
			geometry: owners.geometry,
			atmosphere: owners.atmosphere,
			domainSelection: owners.domainSelection,
			calculator,
			scatteringOrder,
			groundIlluminationRadiance,
			groundBoundary,
			lightSource: owners.physicalSource,
			sourceTransmittanceIntervalCount: 15,
		}),
		buildTransportedRadiance: ({
			scatteringDensity,
			scatteringOrder,
			id,
		}) => buildLocalSunCpuTransportedRadiance({
			scatteringDensity,
			scatteringOrder,
			geometry: owners.geometry,
			atmosphere: owners.atmosphere,
			calculator,
			domainSelection: owners.domainSelection,
			pathIntervalCount:
				LOCAL_SUN_TRANSPORT_INTERVAL_COUNT,
			id,
		}),
		scatteringProvenanceIdentity:
			LOCAL_SUN_CPU_RECURRENCE_PROVENANCE_IDENTITY,
	};

	return buildLocalSunCpuCache({
		atmosphere: owners.atmosphere,
		geometry: owners.geometry,
		profile: DEFAULT_NATIVE_PRODUCTION_PROFILE,
		constructionIdentities: {
			source: {
				id: 'stage-9.6.3-local-source',
				contentHash: 'stage-9.6.3-local-source',
			},
			atmosphere: {
				id: 'stage-9.6.3-atmosphere',
				contentHash: 'stage-9.6.3-atmosphere',
			},
			geometry: {
				id: 'stage-9.6.3-flat-geometry',
				contentHash: 'stage-9.6.3-flat-geometry',
			},
		},
		spectralBasis: NATIVE_15_SPECTRAL_BASIS,
		maximumScatteringOrder: 4,
		lightSource: primaryLightSource,
		calculator,
		domainSelection: owners.domainSelection,
		sourceTransmittanceIntervalCount: 15,
		operations,
		groundBoundary,
	});
}

/**
 * Extract one sealed CPU field in layer/position/direction order.
 *
 * @param {CpuDirectionalSpectralField} field - Supplies the field.
 * @returns {number[]} The complete canonical scalar sequence.
 */
function extractCpuField(field) {
	const reader = field.createReader();
	const values = new Array(reader.scalarCount);
	for (let offset = 0; offset < values.length; offset += 1) {
		values[offset] = reader.readScalarAtOffset(offset);
	}
	return values;
}

/**
 * Map a production CPU N4 result onto logical GPU field ids.
 *
 * @param {LocalSunCpuCacheResult} result - Supplies the completed CPU build.
 * @returns {Record<string, number[]>} Field values keyed by GPU field id.
 */
function extractCpuN4Fields(result) {
	return {
		'local-sun-j1':
			extractCpuField(result.pureScatteringDensityByOrder[0]),
		'local-sun-l1':
			extractCpuField(result.pureRadianceByOrder[0]),
		'local-sun-j2':
			extractCpuField(result.pureScatteringDensityByOrder[1]),
		'local-sun-l2':
			extractCpuField(result.pureRadianceByOrder[1]),
		'local-sun-j3':
			extractCpuField(result.pureScatteringDensityByOrder[2]),
		'local-sun-l3':
			extractCpuField(result.pureRadianceByOrder[2]),
		'local-sun-j4':
			extractCpuField(result.pureScatteringDensityByOrder[3]),
		'local-sun-j-through-4':
			extractCpuField(result.cumulativeScatteringDensity),
	};
}

/**
 * Build and report one ground case without blocking the Karma main thread.
 *
 * @param {ReturnType<typeof createLocalSunGpuParityOwners>} owners - Supplies the fixed owners.
 * @param {string} caseId - Supplies the diagnostic case identity.
 * @param {GroundBoundaryModel | null} groundBoundary - Supplies the ground case.
 * @returns {{ fields: Record<string, number[]>, buildMilliseconds: number }} The case projection.
 */
function projectCase(owners, caseId, groundBoundary) {
	const startedAt = performance.now();
	const fields = extractCpuN4Fields(
		buildCpuN4(owners, groundBoundary),
	);
	const buildMilliseconds = performance.now() - startedAt;
	self.postMessage({
		type: 'progress',
		caseId,
		buildMilliseconds,
	});
	return { fields, buildMilliseconds };
}

self.onmessage = (event) => {
	try {
		const owners = createLocalSunGpuParityOwners();
		const zeroGround =
			createLocalSunGpuParityGroundBoundary(
				event.data.explicitZeroAlbedo,
				'stage-9.6.3-zero-ground',
			);
		const nonzeroGround =
			createLocalSunGpuParityGroundBoundary(
				event.data.nonzeroAlbedo,
				'stage-9.6.3-nonzero-ground',
			);
		const startedAt = performance.now();
		const cases = {
			omitted: projectCase(owners, 'omitted', null),
			zero: projectCase(owners, 'zero', zeroGround),
			nonzero: projectCase(
				owners,
				'nonzero',
				nonzeroGround,
			),
		};
		self.postMessage({
			type: 'complete',
			projection: {
				cases,
				buildMilliseconds: performance.now() - startedAt,
			},
		});
	} catch (error) {
		self.postMessage({
			type: 'error',
			error: {
				name: error instanceof Error ? error.name : 'Error',
				message: error instanceof Error
					? error.message
					: String(error),
				stack: error instanceof Error
					? error.stack
					: undefined,
			},
		});
	}
};
