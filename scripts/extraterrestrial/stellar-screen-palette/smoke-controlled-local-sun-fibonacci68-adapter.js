import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import path from 'node:path';
import {fileURLToPath, pathToFileURL} from 'node:url';
import {CanonicalAtmosphere} from
	'../candidate/src/algorithm32/atmospheres/CanonicalAtmosphere.js';
import {CANONICAL_ATMOSPHERE_CONSTANTS} from
	'../candidate/src/algorithm32/constants/Algorithm32CanonicalData.js';
import {FlatEarthGeometry} from
	'../candidate/src/algorithm32/geometries/FlatEarthGeometry.js';
import {createLocalSunShellFactCache} from
	'../candidate/src/algorithm32/light-sources/create-local-sun-shell-fact-cache.js';
import {createLocalSunCacheBuildPlan} from
	'../candidate/src/algorithm32/light-sources/local-sun-cache-plan.js';
import {LocalSunCacheController} from
	'../candidate/src/algorithm32/light-sources/LocalSunCacheController.js';
import {LocalSunCacheSource} from
	'../candidate/src/algorithm32/light-sources/LocalSunCacheSource.js';
import {LocalSunLightSource} from
	'../candidate/src/algorithm32/light-sources/LocalSunLightSource.js';
import LocalSunConstructionDomainSelection from
	'../candidate/src/algorithm32/light-sources/LocalSunConstructionDomainSelection.js';
import {
	NATIVE_15_SPECTRAL_BASIS,
	NATIVE_SOURCE_IRRADIANCE_DENSITY,
} from '../candidate/src/algorithm32/profiles/native-15-profile.js';
import {
	CONTROLLED_LOCAL_SUN_FIBONACCI68_POLICY,
	ControlledLocalSunConstructionDomainSelection,
} from './ControlledLocalSunConstructionDomainSelection.js';
import {
	ControlledLocalSunCacheController,
	ControlledLocalSunLightSource,
	createControlledLocalSunCacheBuildPlan,
} from './ControlledLocalSunLightSource.js';
import {
	auditReflectionCompletedFibonacci68Control,
	REFLECTION_COMPLETED_FIBONACCI_68_CONTROL_DOMAIN,
} from './ReflectionCompletedFibonacci68Control.js';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const EXPERIMENT_ROOT = path.resolve(HERE, '..');

function createSourceConfiguration() {
	const sourcePosition = {
		coordinates: [4_800_000, 0, 4_800_000],
		units: 'meters',
	};
	return {
		sourcePosition,
		configuration: {
			sourceKey: 'contained-local-sun-fibonacci68-smoke',
			position: sourcePosition,
			sourceIrradiance: NATIVE_SOURCE_IRRADIANCE_DENSITY,
			referenceDistance: {value: 4_800_000, units: 'meters'},
			referenceSpectralIncidentScale: 1,
			radius: {value: 25_749.504, units: 'meters'},
			distanceFalloff: true,
			sourceTransmittanceIntervalCount: 15,
		},
	};
}

function createOwners() {
	const sourceDefinition = createSourceConfiguration();
	const geometry = new FlatEarthGeometry({
		observerPosition: {coordinates: [0, 0, 5], units: 'meters'},
		sourcePosition: sourceDefinition.sourcePosition,
		topAltitude: {value: 100_000, units: 'meters'},
		cacheRadialMaximum: {value: 4_800_000, units: 'meters'},
	});
	const atmosphere = new CanonicalAtmosphere({
		constants: CANONICAL_ATMOSPHERE_CONSTANTS,
		spectralBasis: NATIVE_15_SPECTRAL_BASIS,
	});
	const physicalSource = new LocalSunLightSource(
		sourceDefinition.configuration,
	);
	const shellFactCache = createLocalSunShellFactCache({
		sourceConfiguration: physicalSource.configuration,
	});
	const source = new LocalSunCacheSource({
		source: physicalSource,
		shellFactCache,
	});
	return {
		geometry,
		atmosphere,
		physicalSource,
		source,
		sourceConfiguration: sourceDefinition.configuration,
	};
}

function passGraph(plan) {
	return plan.passes.map((pass) => ({
		id: pass.id,
		kind: pass.kind,
		order: pass.order,
		inputs: pass.inputs,
		output: pass.output,
		modules: pass.modules.map((module) => ({
			id: module.id,
			owner: module.owner,
			provides: module.provides,
			requires: module.requires,
			blocks: module.blocks,
			bindingSpecs: module.bindings.map(({spec}) => ({
				id: spec.id,
				name: spec.name,
				kind: spec.kind,
				shaderType: spec.shaderType,
				frequency: spec.frequency,
			})),
		})),
	}));
}

function fieldSemantics(field) {
	return {
		id: field.id,
		storage: {
			format: field.storage.format,
			height: field.storage.height,
			layers: field.storage.layers,
			widthRole: field.descriptor.directionRole,
		},
		quantity: field.descriptor.quantity,
		units: field.descriptor.units,
		directionRole: field.descriptor.directionRole,
		sampleSemantics: field.descriptor.sampleSemantics,
		order: field.descriptor.order,
		precision: field.descriptor.precision,
		provenanceIdentity: field.descriptor.provenanceIdentity,
		basisContentHash: field.descriptor.basis.contentHash,
		positionDomainContentHash:
			field.descriptor.positionDomain.contentHash,
	};
}

function sum(values) {
	return values.reduce((total, value) => total + value, 0);
}

function importSpecifiers(source) {
	const matches = [];
	const expression = /\bfrom\s*['"]([^'"]+)['"]|\bimport\s*\(\s*['"]([^'"]+)['"]\s*\)|\bimport\s*['"]([^'"]+)['"]/g;
	for (const match of source.matchAll(expression)) {
		matches.push(match[1] ?? match[2] ?? match[3]);
	}
	return matches;
}

function auditContainedRuntimeDependencyClosure(entryPaths) {
	const pending = [...entryPaths];
	const visited = new Set();
	const outsideExperimentImports = [];
	while (pending.length > 0) {
		const filename = path.resolve(pending.pop());
		if (visited.has(filename)) continue;
		visited.add(filename);
		const source = readFileSync(filename, 'utf8');
		for (const specifier of importSpecifiers(source)) {
			if (!specifier.startsWith('.')) continue;
			const resolved = path.resolve(path.dirname(filename), specifier);
			const relative = path.relative(EXPERIMENT_ROOT, resolved);
			if (relative.startsWith('..') || path.isAbsolute(relative)) {
				outsideExperimentImports.push({filename, specifier, resolved});
				continue;
			}
			pending.push(resolved);
		}
	}
	assert.deepEqual(outsideExperimentImports, []);
	return {
		entryCount: entryPaths.length,
		moduleCount: visited.size,
		outsideExperimentImportCount: outsideExperimentImports.length,
	};
}

export function smokeControlledLocalSunFibonacci68Adapter() {
	const owners = createOwners();
	const selectionOptions = {zCount: 2, rhoCount: 2};
	const baseline = LocalSunConstructionDomainSelection.fromGeometry(
		owners.geometry,
		selectionOptions,
	);
	const control =
		ControlledLocalSunConstructionDomainSelection.fromGeometry(
			owners.geometry,
			selectionOptions,
		);

	assert.notEqual(control.id, baseline.id);
	assert.equal(control.zCount, baseline.zCount);
	assert.equal(control.rhoCount, baseline.rhoCount);
	assert.equal(control.positionCount, baseline.positionCount);
	assert.deepEqual(control.zNodes, baseline.zNodes);
	assert.deepEqual(control.rhoNodes, baseline.rhoNodes);
	assert.deepEqual(control.positionNodes, baseline.positionNodes);
	assert.equal(
		control.positionDomain.contentHash,
		baseline.positionDomain.contentHash,
	);
	assert.equal(
		control.outgoingDirectionDomain.contentHash,
		baseline.outgoingDirectionDomain.contentHash,
	);
	assert.equal(control.outgoingDirectionCount, baseline.outgoingDirectionCount);
	assert.deepEqual(
		control.outgoingPositiveFaceCenterIndices,
		baseline.outgoingPositiveFaceCenterIndices,
	);
	assert.deepEqual(control.outgoingUnitVectors, baseline.outgoingUnitVectors);
	assert.equal(control.spectralBasis.contentHash, baseline.spectralBasis.contentHash);
	assert.equal(control.spectralChannelCount, 15);
	assert.equal(
		control.outgoingDirectionDomain.id,
		'algorithm32-cubed-sphere-w27-outgoing-v1',
	);
	assert.equal(control.outgoingDirectionCount, 4_374);
	assert.equal(
		control.spectralBasis.id,
		'algorithm32-native-15-spectral-basis-v1',
	);

	assert.equal(baseline.incomingDirectionCount, 34);
	assert.equal(control.incomingDirectionCount, 68);
	assert.equal(
		control.incomingDirectionDomain,
		REFLECTION_COMPLETED_FIBONACCI_68_CONTROL_DOMAIN.descriptor,
	);
	assert.notEqual(
		control.incomingDirectionDomain.contentHash,
		baseline.incomingDirectionDomain.contentHash,
	);
	assert.ok(Math.abs(sum(baseline.incomingIntegrationWeights.values)
		- 4 * Math.PI) < 1e-12);
	assert.ok(Math.abs(sum(control.incomingIntegrationWeights.values)
		- 4 * Math.PI) < 1e-12);
	const incomingAudit = auditReflectionCompletedFibonacci68Control();
	assert.equal(incomingAudit.reflectionMismatchCount, 0);
	assert.equal(incomingAudit.partnerWeightMismatchCount, 0);
	assert.equal(incomingAudit.nonFiniteWeightCount, 0);
	assert.equal(incomingAudit.nonPositiveWeightCount, 0);

	assert.equal(control.radiancePacking.directionCount, 68);
	assert.equal(
		control.radiancePacking.positionCount,
		baseline.radiancePacking.positionCount,
	);
	assert.equal(
		control.radiancePacking.wavelengthCount,
		baseline.radiancePacking.wavelengthCount,
	);
	assert.equal(
		control.radiancePacking.scalarCount,
		baseline.radiancePacking.scalarCount * 2,
	);
	assert.equal(
		control.scatteringDensityPacking.scalarCount,
		baseline.scatteringDensityPacking.scalarCount,
	);
	const terminalCoordinates = {
		directionIndex: control.incomingDirectionCount - 1,
		positionIndex: control.positionCount - 1,
		wavelengthIndex: control.spectralChannelCount - 1,
	};
	assert.equal(
		control.radiancePacking.offset(terminalCoordinates),
		control.radiancePacking.scalarCount - 1,
	);
	assert.deepEqual(
		control.radiancePacking.coordinatesAt(
			control.radiancePacking.scalarCount - 1,
		),
		terminalCoordinates,
	);

	const orderAudits = [];
	for (const maximumScatteringOrder of [1, 2, 4]) {
		const baselinePlan = createLocalSunCacheBuildPlan({
			...owners,
			groundBoundary: null,
			maximumScatteringOrder,
			domainSelection: baseline,
		});
		const controlledBuild = createControlledLocalSunCacheBuildPlan({
			...owners,
			groundBoundary: null,
			maximumScatteringOrder,
			domainSelection: control,
		});
		const controlPlan = controlledBuild.plan;

		assert.equal(controlledBuild.domainSelection, control);
		assert.deepEqual(passGraph(controlPlan), passGraph(baselinePlan));
		assert.deepEqual(
			controlPlan.fields.map(fieldSemantics),
			baselinePlan.fields.map(fieldSemantics),
		);
		assert.equal(controlPlan.result, baselinePlan.result);
		assert.notEqual(
			controlPlan.identity.contentHash,
			baselinePlan.identity.contentHash,
		);
		assert.equal(
			controlPlan.descriptorDefinition.incomingDirectionDomain,
			control.incomingDirectionDomain,
		);
		for (let index = 0; index < controlPlan.fields.length; index += 1) {
			const controlField = controlPlan.fields[index];
			const baselineField = baselinePlan.fields[index];
			if (controlField.descriptor.directionRole === 'incoming-radiance') {
				assert.equal(controlField.storage.width, 68);
				assert.equal(baselineField.storage.width, 34);
			} else {
				assert.deepEqual(controlField.storage, baselineField.storage);
			}
		}
		orderAudits.push({
			maximumScatteringOrder,
			passCount: controlPlan.passes.length,
			fieldCount: controlPlan.fields.length,
			result: controlPlan.result,
			baselinePlanIdentity: baselinePlan.identity,
			controlPlanIdentity: controlPlan.identity,
		});
	}

	const controlledPhysicalSource = new ControlledLocalSunLightSource(
		owners.sourceConfiguration,
		{selectionOptions},
	);
	assert.ok(controlledPhysicalSource instanceof LocalSunLightSource);
	assert.ok(
		controlledPhysicalSource.controlledDomainSelectionForGeometry(
			owners.geometry,
		) instanceof ControlledLocalSunConstructionDomainSelection,
	);
	const controller = controlledPhysicalSource.createCacheController({
		backend: {},
	});
	assert.ok(controller instanceof LocalSunCacheController);
	assert.ok(controller instanceof ControlledLocalSunCacheController);
	controller.dispose();

	const dependencyClosure = auditContainedRuntimeDependencyClosure([
		path.join(HERE, 'ControlledLocalSunConstructionDomainSelection.js'),
		path.join(HERE, 'ControlledLocalSunLightSource.js'),
		path.join(HERE, 'ReflectionCompletedFibonacci68Control.js'),
	]);

	return {
		status: 'pass',
		policyId: CONTROLLED_LOCAL_SUN_FIBONACCI68_POLICY.id,
		baselineSelectionId: baseline.id,
		controlSelectionId: control.id,
		position: {
			id: control.positionDomain.id,
			contentHash: control.positionDomain.contentHash,
			zCount: control.zCount,
			rhoCount: control.rhoCount,
			positionCount: control.positionCount,
		},
		outgoing: {
			id: control.outgoingDirectionDomain.id,
			contentHash: control.outgoingDirectionDomain.contentHash,
			count: control.outgoingDirectionCount,
		},
		spectral: {
			id: control.spectralBasis.id,
			contentHash: control.spectralBasis.contentHash,
			channelCount: control.spectralChannelCount,
		},
		incoming: {
			baselineId: baseline.incomingDirectionDomain.id,
			baselineCount: baseline.incomingDirectionCount,
			controlId: control.incomingDirectionDomain.id,
			controlContentHash:
				control.incomingDirectionDomain.contentHash,
			controlCount: control.incomingDirectionCount,
			reflectionAudit: incomingAudit,
		},
		packing: {
			baselineRadianceScalarCount:
				baseline.radiancePacking.scalarCount,
			controlRadianceScalarCount:
				control.radiancePacking.scalarCount,
			scatteringDensityScalarCount:
				control.scatteringDensityPacking.scalarCount,
		},
		orderAudits,
		controller: {
			candidateBaseClassRetained: true,
			controlledSubclassInstalled: true,
		},
		dependencyClosure,
	};
}

const invokedPath = process.argv[1]
	? pathToFileURL(path.resolve(process.argv[1])).href
	: null;
if (invokedPath === import.meta.url) {
	process.stdout.write(
		`${JSON.stringify(smokeControlledLocalSunFibonacci68Adapter(), null, 2)}\n`,
	);
}
