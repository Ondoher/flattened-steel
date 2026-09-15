import assert from 'node:assert/strict';
import {gunzipSync} from 'node:zlib';
import {pathToFileURL} from 'node:url';
import {readRepository, resolveRepository, sha256} from '../../io/files.mjs';
import {readRegistration} from '../registration/run.mjs';
import {acceptedMechanismInput, mechanismArtifact, mechanismGroundProbes} from '../mechanisms/registration.mjs';
import {readMatchedOrdersParent} from '../matched-orders/read.mjs';
import {validateChannelDiagnostics} from '../capture/diagnostics.js';
import {checkedEnvelope} from '../ladder/read.mjs';
import {prepareGroundDensityCapture} from '../capture/ground.js';
import {groundBoundaryMemory} from './driver.js';
import {prepareGroundArithmetic, assessGroundArithmetic} from './arithmetic.mjs';
import {assertGroundArithmeticPrecision} from './arithmetic-precision.js';
import {scatterFragment} from '../../orders/kernels.js';
import {groundBoundaryScatterFragment} from './kernels.js';
const commonModuleUrl = pathToFileURL(
	resolveRepository('scripts/algorithm32/solar-zenith-cache/DistantSunSceneCacheGpuCompiler.js'),
).href;
/** @type {SkySixCommonModule} */
const commonModule = await import(commonModuleUrl);

export const groundBoundaryPlanPath =
	'agents/topics/poc-experiments/engineering-studies/sky-accuracy-dials/ground-boundary-plan.md';
export const groundBoundaryMorningRun = 'tmp/experiments/sky-accuracy-dials/runs/00179-p2-ref-assess';

/** Authenticate exact common bytes except tightly bounded cross-engine cosine formatting.
 * Both final fragment hashes must still match the actual retained common bytes exactly.
 * @param {string} actual - Common GLSL actually returned in the browser.
 * @param {string} expected - Independent Node regeneration from authenticated parameters.
 * @returns {SkyGroundBoundaryCommonComparison} Explicit narrow derivation.
 */
export function assertGroundBoundaryCommonSource(actual, expected) {
	assert.ok(typeof actual === 'string' && actual.length > 0 && actual.length <= 65536);
	const expression = /^const float SOLAR_ZENITH_COSINES\[180\] = float\[180\]\(([^;\n]*)\);$/gmu;
	const observed = [...actual.matchAll(expression)],
		baseline = [...expected.matchAll(expression)];
	assert.equal(observed.length, 1);
	assert.equal(baseline.length, 1);
	assert.equal(
		actual.replace(observed[0][0], 'COSINE_DECLARATION'),
		expected.replace(baseline[0][0], 'COSINE_DECLARATION'),
		'Common GLSL changed outside its declared cosine literals.',
	);
	const actualValues = observed[0][1].split(', '),
		expectedValues = baseline[0][1].split(', ');
	assert.equal(actualValues.length, 180);
	assert.equal(expectedValues.length, 180);
	const bits = new DataView(new ArrayBuffer(8));
	/** @type {number[]} */ const differingCosineIndexes = [];
	for (let index = 0; index < 180; index++) {
		for (const literal of [actualValues[index], expectedValues[index]])
			assert.match(literal, /^-?\d\.\d{17}e-?\d+$/u);
		const a = Number(actualValues[index]),
			b = Number(expectedValues[index]);
		assert.ok(Number.isFinite(a) && Number.isFinite(b));
		assert.equal(Math.sign(a), Math.sign(b));
		assert.equal(Math.fround(a), Math.fround(b));
		bits.setFloat64(0, a);
		const actualBits = bits.getBigUint64(0);
		bits.setFloat64(0, b);
		const expectedBits = bits.getBigUint64(0);
		const difference = actualBits > expectedBits ? actualBits - expectedBits : expectedBits - actualBits;
		assert.ok(difference <= 2n, 'Browser cosine literal exceeds the declared two-binary64-ULP derivation bound.');
		if (actualValues[index] !== expectedValues[index]) differingCosineIndexes.push(index);
	}
	return {
		schemaId: 'sky-ground-boundary-common-comparison-v1',
		nodeSha256: sha256(Buffer.from(expected)),
		browserSha256: sha256(Buffer.from(actual)),
		differingCosineIndexes,
	};
}

/** Exact historical raw target parent; other grids and factored representations are rejected.
 * @param {SkyGroundBoundaryCaseId} caseId - Frozen two-case selection.
 * @returns {string} Immutable original parent run.
 */
export function groundBoundaryParentRun(caseId) {
	assert.ok(['ground-j2-p48-raw', 'ground-j2-p55-raw'].includes(caseId));
	return (
		'tmp/experiments/sky-accuracy-dials/runs/' +
		(caseId === 'ground-j2-p48-raw' ? '00103-c-r0-scr' : '00132-c-d55-raw')
	);
}

/** Construct only the explicit browser extension; original sparse-union selectors remain exact.
 * @param {SkyGpuControl} original - Fully authenticated H/P55 control.
 * @param {SkyGroundBoundaryCaseId} caseId - Registered intervention.
 * @param {number} deadlineEpochMilliseconds - Root-owned scientific deadline.
 * @returns {SkyGroundBoundaryTargetControl} Explicit four-order control.
 */
export function groundBoundaryControl(original, caseId, deadlineEpochMilliseconds) {
	groundBoundaryParentRun(caseId);
	assert.ok(Number.isSafeInteger(deadlineEpochMilliseconds) && deadlineEpochMilliseconds > 0);
	return {
		...original,
		channels: [0, 8],
		executionSchemaId: 'sky-ground-boundary-control-v1',
		caseId,
		actualOrders: [1, 2, 3, 4],
		deadlineEpochMilliseconds,
		groundProofProbes: mechanismGroundProbes,
	};
}

/** Authenticate the already adequate morning physical reference without requiring a noon reference.
 * @returns {SkyGroundBoundaryMorningReference} Exact seal/artifact identities and admitted channels.
 */
export function readGroundBoundaryMorningReference() {
	const input = acceptedMechanismInput(groundBoundaryMorningRun);
	assert.equal(input.seal.sha256, '8191227506eb32837359070b3732d157738656c80c15d73ec64c0e74c754f0a1');
	assert.equal(input.seal.byteLength, 238917);
	const artifact = mechanismArtifact(input, 'reference-assessment.json');
	assert.equal(artifact.sha256, '38b9a1f21921539fd6b2a1003d543bdf53835450b92c983a7d118d6a4459aa15');
	const report = /** @type {SkySecondOrderReferenceAssessment} */ (
		JSON.parse(readRepository(artifact.path, artifact).toString())
	);
	assert.deepEqual(
		report.channels.map((row) => row.channel),
		[0, 8],
	);
	assert.ok(
		report.channels.every(
			(row) =>
				row.adequate &&
				row.state === 'passed' &&
				Number.isFinite(row.referenceWatts) &&
				row.allowanceWatts !== null &&
				row.allowanceWatts >= 0,
		),
	);
	return {
		run: input.run,
		identities: [input.seal, artifact],
		channels: report.channels.map((row) => ({
			channel: row.channel,
			referenceWatts: row.referenceWatts,
			allowanceWatts: row.allowanceWatts,
		})),
	};
}

/** Match original J1 and shadow J2 exactly on the complete original sparse union.
 * @param {unknown} value - Browser shadow envelope.
 * @param {readonly SkyGpuFieldCheck[]} fieldChecks - Four actual propagated fields.
 * @param {SkyMatchedOrdersPrefix} expected - Authenticated original union and hashes.
 * @returns {SkyGroundBoundaryShadowProof} Exact validated historical scope.
 */
export function assertGroundBoundaryShadow(value, fieldChecks, expected) {
	const shadow = /** @type {SkyGroundBoundaryShadowProof} */ (value);
	assert.ok(shadow && typeof shadow === 'object');
	assert.equal(shadow.schemaId, 'sky-ground-boundary-shadow-proof-v1');
	assert.equal(shadow.coordinateCount, expected.coordinateCount);
	assert.equal(shadow.coordinateSha256, expected.coordinateSha256);
	assert.deepEqual(
		fieldChecks.map((row) => row.fieldId),
		['J1', 'J2', 'J3', 'J4'],
	);
	assert.ok(fieldChecks.every((row) => row.count === expected.coordinateCount));
	assert.deepEqual(fieldChecks[0], expected.fieldChecks[0], 'Original complete sparse-union J1 changed.');
	const old = expected.fieldChecks[1];
	assert.deepEqual(
		shadow,
		{
			schemaId: 'sky-ground-boundary-shadow-proof-v1',
			coordinateCount: expected.coordinateCount,
			coordinateSha256: expected.coordinateSha256,
			fieldId: 'J2-shadow',
			originalFieldId: 'J2',
			count: old.count,
			minimum: old.minimum,
			maximum: old.maximum,
			pureSha256: old.pureSha256,
		},
		'Original complete sparse-union shadow J2 changed.',
	);
	return shadow;
}

/** Reproduce every manifest address and its canonical inventory digest.
 * @param {SkyGroundBoundaryFieldHash} actual - Browser's complete non-ground manifest.
 * @param {SkyTransportSpec} spec - Original physical domain.
 * @returns {void} Rejects missing chunks, ground inclusion and altered digest metadata.
 */
function validateManifest(actual, spec) {
	const width = spec.domains.outgoing.directionCount,
		altitudeCount = spec.domains.position.count,
		solarCount = spec.domains.solarZenith.count,
		rowCount = altitudeCount - 1;
	assert.equal(actual.schemaId, 'sky-ground-boundary-field-hash-v1');
	assert.equal(actual.width, width);
	assert.equal(actual.altitudeCount, altitudeCount);
	assert.equal(actual.solarCount, solarCount);
	assert.equal(actual.selection, 'all-non-ground-rows');
	assert.equal(actual.encoding, 'float32-little-endian');
	assert.equal(actual.chunks.length, solarCount);
	for (const [solar, chunk] of actual.chunks.entries()) {
		assert.equal(chunk.firstRow, solar * altitudeCount + 1);
		assert.equal(chunk.rowCount, rowCount);
		assert.equal(chunk.byteLength, width * rowCount * 4);
		assert.match(chunk.sha256, /^[a-f0-9]{64}$/u);
	}
	assert.equal(actual.scalarCount, width * rowCount * solarCount);
	assert.equal(actual.maximumReadbackBytes, width * rowCount * 4);
	const manifest = {
		schemaId: actual.schemaId,
		width,
		altitudeCount,
		solarCount,
		selection: actual.selection,
		encoding: actual.encoding,
		chunks: actual.chunks,
	};
	assert.equal(actual.manifestSha256, sha256(Buffer.from(JSON.stringify(manifest))));
}

/** Rebuild exact common-shader parameters rather than trusting browser prediction operands.
 * @param {SkyBuildRequest} buildRequest - Authenticated original raw build.
 * @param {number} wavelengthIndex - Original channel zero or eight.
 * @returns {SkySixCommonParameters} Original parameter composition.
 */
function commonParameters(buildRequest, wavelengthIndex) {
	const spec = /** @type {SkySixBuildRequest} */ (buildRequest).transportSpec,
		domains = spec.domains,
		channel = domains.spectrum.channels[wavelengthIndex],
		ozone = spec.atmosphere.ozone;
	const coordinate =
			(channel.centerNanometers - ozone.crossSectionTable.minimumNanometers) /
			ozone.crossSectionTable.spacingNanometers,
		lower = Math.floor(coordinate),
		upper = Math.min(ozone.crossSectionTable.values.length - 1, lower + 1),
		fraction = coordinate - lower;
	return {
		wavelengthNanometers: channel.centerNanometers,
		sourceIrradiance: channel.sourceIrradianceDensityWattsPerSquareMeterPerNanometer,
		ozoneCrossSection:
			ozone.crossSectionTable.values[lower] * (1 - fraction) + ozone.crossSectionTable.values[upper] * fraction,
		ozoneMaximumDensity: ozone.maximumDensityPerCubicMeter ?? 5.374e18,
		rayleighScattering: channel.rayleighScatteringPerMeter ?? null,
		mieExtinction: channel.mieExtinctionPerMeter ?? null,
		groundAlbedo: channel.groundAlbedo ?? 0,
		bottomRadiusMeters: spec.planet.bottomRadiusMeters,
		topRadiusMeters: spec.planet.topRadiusMeters,
		rayleighScaleHeightMeters: spec.atmosphere.rayleighScaleHeightMeters,
		mieScaleHeightMeters: spec.atmosphere.mieScaleHeightMeters,
		rayleighCoefficientScalePerMeter: spec.atmosphere.rayleighCoefficientScalePerMeter,
		mieAngstromAlpha: spec.atmosphere.mieAngstromAlpha,
		mieAngstromBeta: spec.atmosphere.mieAngstromBeta,
		mieSingleScatteringAlbedo: spec.atmosphere.mieSingleScatteringAlbedo,
		miePhaseFunctionG: spec.atmosphere.miePhaseFunctionG,
		sourcePathTransmittanceIntervalCount: spec.numerical.sourcePathTransmittanceIntervalCount,
		incomingDirectionCount: domains.incoming.directionCount,
		transportIntervalCount: spec.numerical.transportIntervalCount,
		outgoingFaceWidth: domains.outgoing.faceWidth,
		positionAltitudesMeters: domains.position.nodes.map((n) => n.altitudeMeters),
		solarZenithDegrees: domains.solarZenith.nodes.map((n) => n.solarZenithDegrees),
		coordinateContract: spec.shaderProfile?.coordinateContract ?? 'scene-cache-receiver-local-v1',
		sourceDirection: spec.source.directionToLight,
		numericalPolicy: spec.numerical.geometryPolicy,
	};
}

/** Freeze complete original selected ground arithmetic before any target field exists.
 * @param {SkyGroundBoundaryTargetControl} control - Authenticated original raw target.
 * @param {number} channel - Original channel zero or eight.
 * @returns {SkyGroundArithmeticPlan} Prospective source, phase, sampler and accumulation coefficients.
 */
export function groundBoundaryArithmeticPlan(control, channel) {
	assert.ok([0, 8].includes(channel));
	const d = control.buildRequest.transportSpec.domains,
		ground = prepareGroundDensityCapture(control.buildRequest, {
			...control.continuation,
			groundDensityProbes: control.groundProofProbes,
		});
	assert.ok(ground);
	const nodes = ground.coordinates.map((point) => ({
		x: point.x,
		y: point.y,
		outgoingDirectionFloat32: /** @type {SkyVector3} */ ([
			Math.fround(d.outgoing.unitVectors[point.x][0]),
			Math.fround(d.outgoing.unitVectors[point.x][1]),
			Math.fround(d.outgoing.unitVectors[point.x][2]),
		]),
	}));
	return prepareGroundArithmetic(
		{
			commonParameters: commonParameters(control.buildRequest, channel),
			incomingPackedFloat32: Array.from(
				Float32Array.from(
					d.incoming.unitVectors.flatMap((v, i) => [...v, d.incoming.integrationWeightsSteradians[i]]),
				),
			),
			groundHemisphere: 'incomingRecord.z < 0',
			sourceQuantity: 'sourceIrradianceDensityWattsPerSquareMeterPerNanometer',
			sourceTransmittanceOperation: 'multiply',
		},
		nodes,
	);
}

/** Validate structural intervention proof and every retained numerical input; no primitive admission is inferred.
 * @param {unknown} value - Actual compiler report.
 * @param {SkyGroundBoundaryTargetControl} control - Frozen browser target.
 * @param {number} channel - Original spectral channel.
 * @returns {SkyGroundBoundaryTargetCompilerReport} Actual protocol after strict validation.
 */
export function validateGroundBoundaryReport(value, control, channel) {
	const report = /** @type {SkyGroundBoundaryTargetCompilerReport} */ (value);
	assert.ok(report && typeof report === 'object');
	assert.equal(report.schemaId, 'sky-ground-boundary-wavelength-result-v1');
	assertGroundArithmeticPrecision(report.arithmeticPrecision);
	assert.equal(report.wavelength.index, channel);
	const spec = control.buildRequest.transportSpec,
		d = spec.domains,
		b = report.boundary;
	assert.equal(report.wavelength.centerNanometers, d.spectrum.channels[channel].centerNanometers);
	assert.deepEqual(report.fieldLayout, {
		widthJ: d.outgoing.directionCount,
		widthL: d.incoming.directionCount,
		height: d.position.count * d.solarZenith.count,
		scalarBytes: 4,
	});
	assert.equal(b.schemaId, 'sky-ground-boundary-compiler-evidence-v1');
	assert.deepEqual(b.actualOrders, [1, 2, 3, 4]);
	assert.deepEqual(report.actualOrders, [1, 2, 3, 4]);
	assert.equal(b.shadowFieldId, 'J2-shadow');
	assert.deepEqual(b.correctedFieldIds, ['J1', 'J2', 'J3', 'J4']);
	assert.equal(report.coordinateContract, 'scene-cache-receiver-local-v1');
	assert.equal(
		report.groundRecurrence,
		'Ln transports Jn and reflects L(n-1); L1 retains direct ground illumination',
	);
	assert.equal(report.glErrors, 0);
	assert.equal(report.finalLiveFieldBytes, 0);
	assert.deepEqual(report.compiledCaches, []);
	validateManifest(b.nonGroundParity.shadow, spec);
	validateManifest(b.nonGroundParity.corrected, spec);
	assert.deepEqual(b.nonGroundParity.shadow, b.nonGroundParity.corrected);
	assert.equal(b.nonGroundParity.equal, true);
	assert.deepEqual(b.l1Preservation, {
		schemaId: 'sky-ground-boundary-l1-structural-v1',
		fieldId: 'L1',
		createdOnce: true,
		scatterInputFieldIds: ['L1', 'L1'],
		scatterOutputFieldIds: ['J2-shadow', 'J2'],
		sameTextureObject: true,
		outputAliasingRejected: true,
		uploadsAfterCreation: 0,
		drawsTargetingL1AfterCreation: 0,
		shadowReleasedBeforeCorrected: true,
	});
	assert.deepEqual(
		b.memory,
		groundBoundaryMemory(
			d.outgoing.directionCount,
			d.incoming.directionCount,
			d.position.count * d.solarZenith.count,
		),
	);
	assert.equal(report.peakLiveFieldBytes, b.memory.peakScalarBytes);
	assert.ok(Array.isArray(report.ledger) && report.ledger.length <= 64);
	const passes = report.ledger.filter((row) => row.operation === 'pass');
	assert.deepEqual(
		passes.map((row) => row.id),
		['direct-base', 'J1', 'L1', 'J2-shadow', 'J2', 'L2', 'J3', 'L3', 'J4'],
	);
	const expectedInputs = [
		[],
		['direct-base', 'outgoing-directions'],
		['F68-directions'],
		['L1', 'F68-directions', 'outgoing-directions'],
		['L1', 'F68-directions', 'outgoing-directions'],
		['J2', 'F68-directions', 'L1'],
		['L2', 'F68-directions', 'outgoing-directions'],
		['J3', 'F68-directions', 'L2'],
		['L3', 'F68-directions', 'outgoing-directions'],
	];
	for (const [i, pass] of passes.entries()) {
		assert.equal(pass.outputField, pass.id);
		assert.deepEqual(pass.inputFields, expectedInputs[i]);
		assert.ok(!pass.inputFields.includes(pass.id));
	}
	const allocated = new Map();
	let live = 0,
		peak = 0;
	for (const row of report.ledger) {
		assert.ok(['allocate', 'release', 'pass', 'readback-hash'].includes(row.operation));
		if (row.operation === 'allocate') {
			assert.ok(!allocated.has(row.id));
			const expectedBytes =
				row.id === 'direct-base'
					? d.position.count * d.solarZenith.count * 8
					: row.id.startsWith('L')
						? b.memory.lBytes
						: b.memory.jBytes;
			assert.equal(row.bytes, expectedBytes);
			allocated.set(row.id, row.bytes);
			live += row.bytes;
		} else if (row.operation === 'release') {
			assert.equal(allocated.get(row.id), row.bytes);
			allocated.delete(row.id);
			live -= row.bytes;
			assert.equal(row.isTextureAfterDelete, false);
		} else {
			assert.ok(allocated.has(row.id));
			if (row.operation === 'pass')
				for (const id of row.inputFields) if (!id.endsWith('-directions')) assert.ok(allocated.has(id));
		}
		if (row.operation === 'allocate' || row.operation === 'release') assert.equal(row.liveBytes, live);
		peak = Math.max(peak, live);
	}
	assert.equal(live, 0);
	assert.equal(allocated.size, 0);
	assert.equal(peak, b.memory.peakScalarBytes);
	const shadowRelease = report.ledger.findIndex((row) => row.id === 'J2-shadow' && row.operation === 'release'),
		correctedAllocation = report.ledger.findIndex((row) => row.id === 'J2' && row.operation === 'allocate');
	assert.ok(shadowRelease >= 0 && shadowRelease < correctedAllocation);
	assert.deepEqual(
		report.ledger.filter((row) => row.operation === 'readback-hash').map((row) => row.id),
		['J2-shadow', 'J2'],
	);
	assert.ok(Array.isArray(report.timings) && report.timings.length === 11);
	assert.deepEqual(
		report.timings.filter((row) => row.outputField !== null).map((row) => row.id),
		passes.map((row) => row.id),
	);
	for (const timing of report.timings) assert.ok(Number.isFinite(timing.milliseconds) && timing.milliseconds >= 0);
	const parameters = commonParameters(control.buildRequest, channel);
	assert.deepEqual(b.predictionInputs.commonParameters, JSON.parse(JSON.stringify(parameters)));
	assert.equal(b.predictionInputs.groundHemisphere, 'incomingRecord.z < 0');
	assert.equal(b.predictionInputs.sourceTransmittanceOperation, 'multiply');
	assert.equal(b.predictionInputs.sourceQuantity, 'sourceIrradianceDensityWattsPerSquareMeterPerNanometer');
	assert.deepEqual(
		b.predictionInputs.incomingPackedFloat32,
		Array.from(
			Float32Array.from(
				d.incoming.unitVectors.flatMap((v, i) => [...v, d.incoming.integrationWeightsSteradians[i]]),
			),
		),
	);
	const common = report.commonShaderSource;
	assertGroundBoundaryCommonSource(common, commonModule.createDistantSunSceneCacheCommonShaderSource(parameters));
	assert.equal(b.shaderDerivation.originalScatterSha256, sha256(Buffer.from(scatterFragment(common, false))));
	assert.equal(b.shaderDerivation.correctedScatterSha256, sha256(Buffer.from(groundBoundaryScatterFragment(common))));
	assert.equal(b.groundNumericalGate, 'pending-independent-runner-assessment');
	const ground = prepareGroundDensityCapture(control.buildRequest, {
		...control.continuation,
		groundDensityProbes: control.groundProofProbes,
	});
	assert.ok(ground);
	assert.equal(b.groundSamples.length, ground.coordinates.length);
	for (const [i, row] of b.groundSamples.entries()) {
		const expected = ground.coordinates[i];
		assert.equal(row.x, expected.x);
		assert.equal(row.y, expected.y);
		assert.equal(row.y % d.position.count, 0);
		assert.equal(row.solarZenithIndex, row.y / d.position.count);
		assert.deepEqual(row.outgoingDirectionFloat32, d.outgoing.unitVectors[row.x].map(Math.fround));
		for (const value of [row.shadowValue, row.correctedValue]) {
			assert.ok(Number.isFinite(value) && value >= 0);
			assert.equal(value, Math.fround(value));
		}
		assert.equal(row.difference, row.correctedValue - row.shadowValue);
	}
	return report;
}

/** Validate all forty probes, both representations and all four original seven-method envelopes.
 * @param {unknown} value - Browser diagnostic payload.
 * @param {DialContinuationRegistrationRead} registration - Frozen C0 probe/scene owner.
 * @returns {SkyContinuationChannelDiagnostics} Bounded original diagnostic contract.
 */
export function validateGroundBoundaryDiagnostics(value, registration) {
	const diagnostic = validateChannelDiagnostics(value);
	assert.equal(diagnostic.probes.length, 2240);
	for (const probe of registration.probes)
		for (const order of [1, 2, 3, 4])
			for (const representationId of ['cumulative', 'grouped']) {
				const rows = diagnostic.probes.filter(
					(row) =>
						row.probeId === probe.probeId &&
						row.order === order &&
						row.representationId === representationId,
				);
				checkedEnvelope(rows);
				for (const row of rows) {
					assert.equal(row.time, probe.time);
					assert.equal(row.gridX, probe.gridX);
					assert.equal(row.gridY, probe.gridY);
					assert.equal(row.sceneId, registration.probeScenes.find((s) => s.time === probe.time).id);
				}
			}
	return diagnostic;
}

/** Extract only effective grouped P2=E2-E1 and propagate each original envelope separately.
 * @param {SkyContinuationChannelDiagnostics} current - Complete regenerated diagnostics.
 * @param {SkyContinuationChannelDiagnostics} original - Complete authenticated parent diagnostics.
 * @param {number} channel - Original zero/eight channel.
 * @param {SkyGroundBoundaryMorningReference} reference - Already adequate morning physical reference.
 * @returns {SkyGroundBoundaryP2Row[]} Two selected rays at this channel.
 */
export function groundBoundaryP2Rows(current, original, channel, reference) {
	return ['p-0930-5-7', 'p-1230-3-5'].map((probeId) => {
		const pairs = [original, current].map((d) =>
			[1, 2].map((order) =>
				checkedEnvelope(
					d.probes.filter(
						(row) => row.probeId === probeId && row.order === order && row.representationId === 'grouped',
					),
				),
			),
		);
		assert.equal(pairs[0][0].value, pairs[1][0].value, 'J1 view changed despite unchanged original union.');
		const beforeWatts = pairs[0][1].value - pairs[0][0].value,
			afterWatts = pairs[1][1].value - pairs[1][0].value,
			deltaWatts = afterWatts - beforeWatts;
		const beforeAllowanceWatts = pairs[0].some((r) => r.errorAllowance === null)
			? null
			: pairs[0].reduce((sum, r) => sum + r.errorAllowance, 0);
		const afterAllowanceWatts = pairs[1].some((r) => r.errorAllowance === null)
			? null
			: pairs[1].reduce((sum, r) => sum + r.errorAllowance, 0);
		const comparisonAllowanceWatts =
			beforeAllowanceWatts === null || afterAllowanceWatts === null
				? null
				: beforeAllowanceWatts + afterAllowanceWatts;
		const physical = probeId === 'p-0930-5-7' ? reference.channels.find((row) => row.channel === channel) : null;
		assert.ok(probeId !== 'p-0930-5-7' || physical);
		return {
			probeId,
			channel,
			beforeWatts,
			afterWatts,
			deltaWatts,
			beforeAllowanceWatts,
			afterAllowanceWatts,
			comparisonAllowanceWatts,
			state:
				comparisonAllowanceWatts === null
					? 'unresolved'
					: deltaWatts > comparisonAllowanceWatts
						? 'passed'
						: 'failed',
			physical: physical
				? {
						state: 'available',
						referenceWatts: physical.referenceWatts,
						referenceAllowanceWatts: physical.allowanceWatts,
						beforeErrorWatts: beforeWatts - physical.referenceWatts,
						afterErrorWatts: afterWatts - physical.referenceWatts,
					}
				: {
						state: 'unresolved',
						reason: 'An adequate matched noon physical reference is not yet an admitted parent.',
					},
		};
	});
}

/** Read bounded gzip evidence from an authenticated immutable artifact.
 * @param {DialFileIdentity} artifact - Exact parent inventory identity.
 * @returns {unknown} Parsed data, limited to four MiB after decompression.
 */
export function readGroundBoundaryGzip(artifact) {
	return JSON.parse(gunzipSync(readRepository(artifact.path, artifact), {maxOutputLength: 4 * 1024 ** 2}).toString());
}

/** Authenticate a completed target and reproduce its exactness and measurement records.
 * @param {string} run - Immutable boundary target.
 * @returns {SkyGroundBoundaryTargetRead} Four P2 selections plus complete regenerated order evidence.
 */
export function readGroundBoundaryTarget(run) {
	const input = acceptedMechanismInput(run),
		parameters = /** @type {SkyGroundBoundaryRunParameters} */ (
			/** @type {unknown} */ (input.terminal.recipe.parameters)
		);
	assert.equal(parameters.extensionStage, 'ground-boundary-target');
	const registration = readRegistration(parameters.continuationRegistration),
		parent = readMatchedOrdersParent(registration, groundBoundaryParentRun(parameters.caseId)),
		controlId = mechanismArtifact(input, 'control.json'),
		control = /** @type {SkyGroundBoundaryTargetControl} */ (
			JSON.parse(readRepository(controlId.path, controlId).toString())
		),
		reference = readGroundBoundaryMorningReference();
	assert.deepEqual(
		control,
		groundBoundaryControl(parent.control, parameters.caseId, control.deadlineEpochMilliseconds),
	);
	const planId = mechanismArtifact(input, 'arithmetic-plans.json.gz'),
		savedPlans = /** @type {SkyGroundArithmeticChannelPlan[]} */ (readGroundBoundaryGzip(planId));
	assert.deepEqual(
		savedPlans.map((row) => row.channel),
		[0, 8],
	);
	const identities = [input.seal, controlId, planId, ...parent.identities, ...reference.identities];
	const channels = parent.channels.map((authority) => {
		const stem = 'channel-' + String(authority.channel).padStart(2, '0'),
			metadataId = mechanismArtifact(input, stem + '.json'),
			spectraId = mechanismArtifact(input, stem + '.f64'),
			diagnosticId = mechanismArtifact(input, stem + '-diagnostics.json.gz'),
			boundaryId = mechanismArtifact(input, stem + '-boundary.json.gz');
		const metadata = /** @type {SkyGroundBoundaryChannelMetadata} */ (
			JSON.parse(readRepository(metadataId.path, metadataId).toString())
		);
		assert.equal(metadata.schemaId, 'sky-ground-boundary-spectra-v1');
		assert.equal(metadata.channel, authority.channel);
		assert.deepEqual(metadata.shape, authority.expected.shape);
		assert.deepEqual(metadata.spectra, spectraId);
		assert.equal(metadata.spectraSha256, spectraId.sha256);
		assert.deepEqual(metadata.diagnosticArtifact, diagnosticId);
		assert.deepEqual(metadata.boundaryArtifact, boundaryId);
		const report = validateGroundBoundaryReport(readGroundBoundaryGzip(boundaryId), control, authority.channel);
		const shadow = assertGroundBoundaryShadow(report.shadowProof, metadata.fieldChecks, authority.expected);
		const frozenPlan = savedPlans.find((row) => row.channel === authority.channel);
		assert.ok(frozenPlan);
		assert.deepEqual(frozenPlan.plan, groundBoundaryArithmeticPlan(control, authority.channel));
		const arithmetic = assessGroundArithmetic(
				frozenPlan.plan,
				report.arithmeticPrecision,
				report.boundary.groundSamples,
			),
			arithmeticId = mechanismArtifact(input, stem + '-arithmetic.json');
		assert.equal(arithmetic.state, 'passed');
		assert.deepEqual(JSON.parse(readRepository(arithmeticId.path, arithmeticId).toString()), arithmetic);
		identities.push(arithmeticId);
		const diagnostics = validateGroundBoundaryDiagnostics(readGroundBoundaryGzip(diagnosticId), registration),
			original = validateGroundBoundaryDiagnostics(readGroundBoundaryGzip(authority.identities[2]), registration);
		const bytes = readRepository(spectraId.path, spectraId);
		assert.equal(
			bytes.length,
			metadata.shape.representationCount * metadata.shape.viewCount * 4 * metadata.shape.rayCount * 8,
		);
		const values = Float64Array.from({length: bytes.length / 8}, (_, i) => bytes.readDoubleLE(i * 8));
		assert.ok(values.every((v) => Number.isFinite(v) && v >= 0));
		identities.push(metadataId, spectraId, diagnosticId, boundaryId);
		return {
			channel: authority.channel,
			shape: metadata.shape,
			values,
			diagnostics,
			report,
			shadow,
			arithmetic,
			p2: groundBoundaryP2Rows(diagnostics, original, authority.channel, reference),
		};
	});
	const admissionId = mechanismArtifact(input, 'ground-admission.json');
	const groundAdmission = /** @type {SkyGroundBoundaryNumericalAdmission} */ (
		JSON.parse(readRepository(admissionId.path, admissionId).toString())
	);
	assert.equal(groundAdmission.state, 'passed');
	assert.equal(groundAdmission.primitiveBoundsComplete, true);
	assert.equal(groundAdmission.schemaId, 'sky-ground-boundary-numerical-admission-v2');
	assert.deepEqual(
		groundAdmission.channels.map((row) => row.channel),
		[0, 8],
	);
	assert.ok(groundAdmission.channels.every((row) => row.state === 'passed'));
	identities.push(admissionId);
	for (const required of [...parent.identities, ...reference.identities])
		assert.ok(
			input.terminal.recipe.parents.some(
				(p) => p.path === required.path && p.sha256 === required.sha256 && p.byteLength === required.byteLength,
			),
		);
	return {
		run,
		caseId: parameters.caseId,
		identities,
		control,
		channels,
		p2: channels.flatMap((row) => row.p2),
		groundAdmission,
	};
}
