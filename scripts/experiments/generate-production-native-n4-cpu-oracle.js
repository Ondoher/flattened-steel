import {mkdirSync, readFileSync, writeFileSync} from 'node:fs';
import {dirname, resolve} from 'node:path';

import {SharedModel} from '../../src/algorithm32/implementation/algorithm32/model/SharedModel.js';
import {CanonicalAtmosphere} from '../../src/algorithm32/implementation/canonical-atmosphere/CanonicalAtmosphere.js';
import {CANONICAL_ATMOSPHERE_CONSTANTS} from '../../src/algorithm32/implementation/canonical-atmosphere/consts.js';
import {DistantSunLightSource} from '../../src/algorithm32/implementation/distant-sun/DistantSunLightSource.js';
import {DEFAULT_DISTANT_SUN_CONSTRUCTION_DOMAIN_SELECTION} from '../../src/algorithm32/implementation/distant-sun/cache/consts.js';
import {SphericalEarthGeometry} from '../../src/algorithm32/implementation/spherical-earth/SphericalEarthGeometry.js';
import {createNativeExecutionProfile} from '../../src/algorithm32/profiles/native-15/native-15-profile.js';

const REPOSITORY_ROOT = resolve(import.meta.dirname, '../..');
const POLICY_PATH = resolve(
	REPOSITORY_ROOT,
	'src/algorithm32/implementation/distant-sun/cache/fixtures/gpu-cache-parity-policy.json',
);
const TEMPLATE_PATH = resolve(
	REPOSITORY_ROOT,
	'src/algorithm32/implementation/distant-sun/cache/fixtures/algorithm32-production-native-n4-cpu-gpu-parity-oracle.json',
);
const DEFAULT_OUTPUT_PATH = resolve(REPOSITORY_ROOT, 'tmp/algorithm32-native-n4-oracle/reflection68/oracle.json');

function createModel() {
	const atmosphere = new CanonicalAtmosphere({constants: CANONICAL_ATMOSPHERE_CONSTANTS});
	const geometry = new SphericalEarthGeometry({
		bottomRadius: CANONICAL_ATMOSPHERE_CONSTANTS.bottomRadius,
		topRadius: CANONICAL_ATMOSPHERE_CONSTANTS.topRadius,
		observerHeight: {value: 2, units: 'meters'},
		observerUpDirection: [1, 0, 0],
		cacheAltitudeBinCount: 48,
		cacheBoundaryAltitude: {value: 2, units: 'meters'},
		sourceTransmittanceIntervalCount: 20,
	});
	const lightSource = new DistantSunLightSource({angularRadius: {value: 0.004675, units: 'radians'}});
	const observation = {
		instant: '2026-03-20T12:00:00.000Z',
		location: {
			latitude: {value: 0, units: 'degrees'},
			longitude: {value: 0, units: 'degrees'},
		},
	};
	geometry.configureLightSource({
		lightSource,
		observation,
		placement: {kind: 'distant-direction', directionToLight: [0, 1, 0]},
	});
	const domains = DEFAULT_DISTANT_SUN_CONSTRUCTION_DOMAIN_SELECTION;
	const nativeProfile = createNativeExecutionProfile({
		lightSource,
		atmosphere,
		geometry,
		groundBoundary: null,
		observation,
		domains: {
			positions: domains.positionDomain,
			incomingDirections: domains.incomingDirectionDomain,
			outgoingDirections: domains.outgoingDirectionDomain,
		},
		execution: {maximumScatteringOrder: 4},
	});
	const profile = {
		...nativeProfile,
		numerical: {
			...nativeProfile.numerical,
			cacheConstruction: {
				...nativeProfile.numerical.cacheConstruction,
				transportIntervalCount: 40,
			},
		},
	};

	return {lightSource, model: new SharedModel({version: 1, profile})};
}

function readValues(reader, query, wavelengthIndices) {
	return wavelengthIndices.map((wavelengthIndex) =>
		reader.readScalar({
			directionIndex: query.directionIndex,
			positionIndex: query.positionIndex,
			wavelengthIndex,
		}),
	);
}

function cumulativeValues(readers, query, wavelengthIndices) {
	return wavelengthIndices.map((wavelengthIndex) =>
		readers.reduce(
			(sum, reader) =>
				sum +
				reader.readScalar({
					directionIndex: query.directionIndex,
					positionIndex: query.positionIndex,
					wavelengthIndex,
				}),
			0,
		),
	);
}

function createFields(template, policy, result) {
	const scatteringReaders = result.pureScatteringDensityByOrder.map((field) => field.createReader());
	const radianceReaders = result.pureRadianceByOrder.map((field) => field.createReader());

	return template.fields.map((fieldTemplate) => {
		const queries =
			fieldTemplate.queryKind === 'radiance' ? policy.radianceQueries : policy.scatteringDensityQueries;
		const pureOrderMatch = /^([JL])(\d+)$/u.exec(fieldTemplate.name);
		const cumulativeMatch = /^Jthrough(\d+)$/u.exec(fieldTemplate.name);
		let valuesForQuery;
		let directionDomainId = fieldTemplate.directionDomainId;
		if (pureOrderMatch?.[1] === 'J') {
			const reader = scatteringReaders[Number(pureOrderMatch[2]) - 1];
			valuesForQuery = (query) => readValues(reader, query, policy.wavelengthIndices);
		} else if (pureOrderMatch?.[1] === 'L') {
			const reader = radianceReaders[Number(pureOrderMatch[2]) - 1];
			valuesForQuery = (query) => readValues(reader, query, policy.wavelengthIndices);
			directionDomainId = result.domainSelection.incomingDirectionDomain.id;
		} else if (cumulativeMatch) {
			const readers = scatteringReaders.slice(0, Number(cumulativeMatch[1]));
			valuesForQuery = (query) => cumulativeValues(readers, query, policy.wavelengthIndices);
		} else {
			throw new Error(`Unsupported oracle field ${fieldTemplate.name}.`);
		}

		return {
			...fieldTemplate,
			directionDomainId,
			queries: queries.map((query) => ({...query, values: valuesForQuery(query)})),
		};
	});
}

function createProgressReporter() {
	let lastReportAt = 0;
	return (progress) => {
		const now = Date.now();
		if (now - lastReportAt < 5000 && progress.completed !== progress.total) return;
		lastReportAt = now;
		console.log(
			`[native N4 CPU oracle] ${progress.phase} J${progress.order} ${progress.completed}/${progress.total}`,
		);
	};
}

function main() {
	const outputPath = resolve(process.argv[2] ?? DEFAULT_OUTPUT_PATH);
	const policy = JSON.parse(readFileSync(POLICY_PATH, 'utf8'));
	const template = JSON.parse(readFileSync(TEMPLATE_PATH, 'utf8'));
	const startedAt = new Date().toISOString();
	const started = performance.now();
	const {lightSource, model} = createModel();
	const result = lightSource.buildCpuScatteringCache({model, onProgress: createProgressReporter()});
	const duration = performance.now() - started;
	const oracle = {
		...template,
		configuration: {
			...template.configuration,
			incomingDirectionDomain: result.domainSelection.incomingDirectionDomain.id,
		},
		buildTiming: {
			startedAt,
			duration: {value: duration, units: 'milliseconds'},
			runtime: process.version,
			platform: process.platform,
			architecture: process.arch,
		},
		wavelengthIndices: policy.wavelengthIndices,
		fields: createFields(template, policy, result),
	};
	mkdirSync(dirname(outputPath), {recursive: true});
	writeFileSync(outputPath, `${JSON.stringify(oracle, null, '\t')}\n`);
	console.log(`[native N4 CPU oracle] complete in ${(duration / 60000).toFixed(2)} minutes: ${outputPath}`);
}

main();
