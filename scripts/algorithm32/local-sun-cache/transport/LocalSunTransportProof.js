import {createHash} from 'node:crypto';
import {existsSync, mkdirSync, readFileSync, realpathSync, writeFileSync} from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {LocalSunTransportControls} from './LocalSunTransportControls.js';
import {FlatEarthGeometry} from '../../../../src/algorithm32/implementation/flat-earth/FlatEarthGeometry.js';
import {LocalSunLightSource} from '../../../../src/algorithm32/implementation/local-sun/LocalSunLightSource.js';
import {CanonicalAtmosphere} from '../../../../src/algorithm32/implementation/canonical-atmosphere/CanonicalAtmosphere.js';
import {CanonicalExponentialCacheColumn} from '../../../../src/algorithm32/implementation/canonical-atmosphere/cache/CanonicalExponentialCacheColumn.js';
import {LocalSunCompactTransport} from '../../../../src/algorithm32/implementation/local-sun/cache/LocalSunCompactTransport.js';
import DistanceMath from '../../../../src/algorithm32/math/DistanceMath.js';

/** Portable production comparison against independently frozen flat-ray/column/transport gold. */
export class LocalSunTransportProof {
	/** Independent authority and checked repository paths. @type {LocalSunTransportControls} */
	_controls = new LocalSunTransportControls();

	/** Called by proof gates to compare finite scalars against predeclared authority allowances.
	 *
	 * @param {number} actual - Candidate scalar.
	 * @param {number} expected - Independent scalar.
	 * @param {number} absolute - Predeclared absolute allowance.
	 * @param {number} relative - Predeclared relative allowance.
	 * @returns {number} - Absolute residual.
	 * @throws {Error} - Candidate is nonfinite or outside the gate.
	 */
	_near(actual, expected, absolute, relative = 0) {
		let residual = Math.abs(actual - expected);
		if (!Number.isFinite(actual) || residual > absolute + relative * Math.abs(expected))
			throw new Error('Transport scalar differs: ' + actual + ' versus ' + expected);
		return residual;
	}

	/** Call this method to authenticate final formatted control bytes and the independent producer before candidate setup.
	 *
	 * @returns {LocalSunTransportFixture} - Typed immutable scalar/ray control.
	 * @throws {Error} - Byte, schema or producer identity differs.
	 */
	readAuthority() {
		let control = this._controls;
		if (
			control.paths.hash(control.fixturePath) !==
			'908815a638350a5ddc00d0172282cd81c2ffd79b4d5fa2acd48b22c33bfdc2df'
		)
			throw new Error('Frozen transport control changed.');
		let fixture = /** @type {LocalSunTransportFixture} */ (
			JSON.parse(readFileSync(control.paths.checkedPath(control.fixturePath), 'utf8'))
		);
		if (
			fixture.schema !== 'local-sun-transport-controls-v1' ||
			fixture.policy !== 'column48-tail64' ||
			control.paths.hash(fixture.derivation.producer.path) !== fixture.derivation.producer.sha256
		)
			throw new Error('Transport control compatibility changed.');
		return fixture;
	}

	/** Called by the proof to create candidate collaborators from physical input controls, never expected ray/scalar outputs.
	 *
	 * @returns {LocalSunCompactTransportDefinition} - Actual configured owners and compact topology.
	 * @throws {Error} - Physical P0 authority differs.
	 */
	_setup() {
		let input = 'src/algorithm32/implementation/local-sun/cache/fixtures/local-sun-compact-p0-controls.json';
		if (this._controls.paths.hash(input) !== '74a7cb03fd646d6ec4754e45e46f7ed622c815d09cd82ceeef174819c3513db6')
			throw new Error('P0 authority changed.');
		let p0 = /** @type {LocalSunP0Fixture} */ (
				JSON.parse(readFileSync(this._controls.paths.checkedPath(input), 'utf8'))
			),
			spatial = p0.controls;
		let geometry = new FlatEarthGeometry({
			topAltitude: {value: spatial.geometry.atmosphereTop.value, units: 'meters'},
			localLightSourceHeight: {value: spatial.geometry.sourceHeight.value, units: 'meters'},
			projectionRadius: {value: 6360000, units: 'meters'},
		});
		let source = new LocalSunLightSource({
			sourceKey: 'compact-transport-proof',
			referenceDistance: {value: 4800000, units: 'meters'},
			referenceSpectralIncidentScale: 1,
			radius: {value: 25749.504, units: 'meters'},
			distanceFalloff: true,
		});
		geometry.configureLightSource({
			lightSource: source,
			observation: {
				instant: '2024-12-14T17:27:41.487Z',
				location: {latitude: {value: 0, units: 'degrees'}, longitude: {value: 0, units: 'degrees'}},
			},
			placement: {
				kind: 'finite-position',
				position: {coordinates: [0, 0, spatial.geometry.sourceHeight.value], units: 'meters'},
			},
		});
		let atmosphere = new CanonicalAtmosphere();
		let topology = geometry.createCompactLocalSunCacheTopology({
			sourceHeight: {value: spatial.geometry.sourceHeight.value, units: 'meters'},
			atmosphereTop: {value: spatial.geometry.atmosphereTop.value, units: 'meters'},
			coverageRadius: {value: spatial.geometry.coverageRadius.value, units: 'meters'},
			altitudes: spatial.rows.map((row) => ({value: row.altitude.value, units: /** @type {const} */ ('meters')})),
			bandRadii: [
				{value: spatial.bands[0].innerRadius.value, units: 'meters'},
				...spatial.bands.map((band) => ({
					value: band.outerRadius.value,
					units: /** @type {const} */ ('meters'),
				})),
			],
			boundaryExtinction: spatial.rows.map((row) => ({
				value: Math.max(
					...atmosphere.sampleMedium(
						geometry.resolveAtmosphereCoordinate({
							coordinates: [0, 0, row.altitude.value],
							units: 'meters',
						}),
					).extinction.values,
				),
				units: /** @type {const} */ ('m^-1'),
			})),
			boundaryExtinctionLengthMultiples: [0.25, 0.5, 1, 2, 4, 8, 16],
			provenanceIdentity: 'p0:74a7cb03:transport-controls',
		});
		return {geometry, atmosphere, topology};
	}

	/** Call this method to compare selected policy kernels, all channel samples, physical endpoints and transported synthetic J.
	 * Independent gold is authenticated first; no full physical field or GPU oracle is claimed.
	 *
	 * @returns {LocalSunTransportReport} - Selected capability receipt.
	 * @throws {Error} - Any declared boundary, sampling, scalar, semantics or rejection gate fails.
	 */
	verify() {
		let fixture = this.readAuthority(),
			setup = this._setup(),
			candidate = new LocalSunCompactTransport(setup);
		let column = new CanonicalExponentialCacheColumn(setup.atmosphere),
			limits = fixture.limits;
		let maxColumnError = 0,
			maxWeightError = 0,
			maxSampleError = 0,
			maxRadianceError = 0,
			maxTransmissionError = 0,
			channelComparisons = 0,
			sampleComparisons = 0,
			cutoffPrefixes = 0;
		for (let control of fixture.columns)
			maxColumnError = Math.max(
				maxColumnError,
				this._near(
					DistanceMath.toMeters(
						column.densityColumn({
							startAltitude: DistanceMath.inMeters(control.z),
							endAltitude: DistanceMath.inMeters(control.endAltitude),
							length: DistanceMath.inMeters(control.length),
							scaleHeight: DistanceMath.inMeters(control.scaleHeight),
						}),
					),
					control.expected,
					1e-9,
					limits.columnRelative,
				),
			);
		for (let control of fixture.weights) {
			let weights = candidate.attenuationWeights(control.tau);
			for (let i = 0; i < 2; i++) {
				if (weights[i] < 0) throw new Error('Negative optical weight.');
				maxWeightError = Math.max(
					maxWeightError,
					this._near(weights[i], control.expected[i], limits.weightAbsolute),
				);
			}
		}
		let normalizedPath =
			'src/algorithm32/implementation/local-sun/cache/fixtures/local-sun-normalization-controls.json';
		if (
			this._controls.paths.hash(normalizedPath) !==
			'cb1097c038b416023a3f8ca67eee2d7d95c307b3784b70e0cb48ec1f0b81b3df'
		)
			throw new Error('Independent node factors changed.');
		let factors = /** @type {LocalSunNormalizationFixture} */ (
			JSON.parse(readFileSync(this._controls.paths.checkedPath(normalizedPath), 'utf8'))
		);
		let samples = Float64Array.from(factors.nodes.flatMap((node) => node.factors));
		let before = createHash('sha256').update(new Uint8Array(samples.buffer)).digest('hex');
		let reader = /** @type {Pick<CpuDirectionalSpectralFieldReader, 'readScalar'>} */ ({
			readScalar: ({positionIndex, wavelengthIndex}) => samples[positionIndex * 15 + wavelengthIndex],
		});
		for (let control of fixture.rays) {
			let request = {
				position: DistanceMath.positionInMeters(control.origin),
				physicalDirection: /** @type {UnitVector3} */ (control.direction),
				maximumDistance:
					control.maximumDistance === undefined ? undefined : DistanceMath.inMeters(control.maximumDistance),
				reader,
				provenanceIdentity: 'independent-J:kappa*(h/r)^2',
			};
			let result = candidate.integrate(request),
				plan = result.plan;
			this._near(DistanceMath.toMeters(plan.ray.length), control.full, limits.endpointMeters);
			if (plan.ray.boundary !== control.boundary) throw new Error('Physical boundary kind differs.');
			let endpoint = DistanceMath.toMetersPosition(plan.ray.positionAt(plan.ray.length));
			for (let component = 0; component < 3; component++)
				this._near(
					endpoint[component],
					control.origin[component] + control.direction[component] * control.full,
					limits.endpointMeters,
				);
			for (let [channel, prefix] of plan.channels.entries()) {
				let expected = control.channels[channel];
				this._near(prefix.retainedLength.value, expected.retained, limits.endpointMeters);
				if (prefix.physicalEnd !== expected.physicalEnd || prefix.distances.length !== 49)
					throw new Error('Retained-prefix endpoint meaning differs.');
				if (!prefix.physicalEnd) cutoffPrefixes++;
				for (let [i, distance] of prefix.distances.entries()) {
					maxSampleError = Math.max(
						maxSampleError,
						this._near(distance.value, expected.distances[i], limits.sampleMeters),
					);
					sampleComparisons++;
				}
				maxRadianceError = Math.max(
					maxRadianceError,
					this._near(
						result.radiance.values[channel],
						expected.radiance,
						limits.radianceAbsolute,
						limits.radianceRelative,
					),
				);
				maxTransmissionError = Math.max(
					maxTransmissionError,
					this._near(
						result.transmittance.values[channel],
						expected.transmission,
						limits.transmissionAbsolute,
					),
				);
				channelComparisons++;
			}
			if (
				result.radiance.quantity !== 'spectral-radiance-density' ||
				result.radiance.units !== 'W m^-2 sr^-1 nm^-1' ||
				result.transmittance.quantity !== 'spectral-transmittance' ||
				result.transmittance.units !== '1' ||
				result.radiance.basis.contentHash !== setup.atmosphere.spectralBasis.contentHash ||
				!result.radiance.provenanceIdentity.startsWith(request.provenanceIdentity)
			)
				throw new Error('Transport physical quantity/provenance differs.');
		}
		if (createHash('sha256').update(new Uint8Array(samples.buffer)).digest('hex') !== before)
			throw new Error('Physical J values were rewritten.');
		let signed = candidate.integrate({
			position: {coordinates: [0, 0, 1000], units: 'meters'},
			physicalDirection: [0, 0, 1],
			maximumDistance: DistanceMath.inMeters(10),
			reader: {readScalar: (address) => -reader.readScalar(address)},
			provenanceIdentity: 'negative-J',
		});
		if (!signed.radiance.values.every((v) => v < 0)) throw new Error('Signed physical J was clamped.');
		let rejected = 0;
		for (let operation of [
			() =>
				candidate.createRayPlan({
					position: {coordinates: [fixture.geometry.radius + 1, 0, 0], units: 'meters'},
					physicalDirection: [1, 0, 0],
				}),
			() =>
				candidate.createRayPlan({
					position: {coordinates: [0, 0, 0], units: 'meters'},
					physicalDirection: [1, 0, 0],
					maximumDistance: DistanceMath.inMeters(-1),
				}),
			() => candidate.attenuationWeights(-1),
			() =>
				column.opticalDepth({
					startAltitude: DistanceMath.inMeters(0),
					endAltitude: DistanceMath.inMeters(1),
					length: DistanceMath.inMeters(1),
					wavelengthIndex: 15,
				}),
		]) {
			try {
				operation();
			} catch (error) {
				if (!(error instanceof RangeError)) throw error;
				rejected++;
			}
		}
		if (rejected !== 4 || cutoffPrefixes === 0) throw new Error('Required rejection/cutoff coverage missing.');
		return {
			status: 'PASSED',
			rays: fixture.rays.length,
			channelComparisons,
			sampleComparisons,
			cutoffPrefixes,
			columns: fixture.columns.length,
			weights: fixture.weights.length,
			maxColumnError,
			maxWeightError,
			maxSampleError,
			maxRadianceError,
			maxTransmissionError,
			physicalValuesUnchanged: true,
			signedSamplesPreserved: true,
			rejected,
			physicalFieldsQualified: false,
		};
	}

	/** Call this method to save a new immutable selected production comparison and complete derivation chain.
	 *
	 * @param {string} directory - New normalized plan-owned ignored run directory.
	 * @returns {LocalSunTransportReport} - Passed selected policy receipt.
	 * @throws {Error} - Destination is existing/unsupported, proof fails or evidence writing fails.
	 */
	writeComparison(directory) {
		if (!directory.startsWith('tmp/production-local-sun-cache-promotion/runs/'))
			throw new Error('Plan-owned transport output required.');
		let destination = this._controls.paths.checkedPath(directory);
		if (existsSync(destination)) throw new Error('Existing immutable transport comparison rejected.');
		let report = this.verify(),
			fixture = this.readAuthority(),
			sources = [
				'scripts/algorithm32/local-sun-cache/transport/LocalSunTransportControls.js',
				'scripts/algorithm32/local-sun-cache/transport/LocalSunTransportProof.js',
				'src/algorithm32/implementation/local-sun/cache/LocalSunCompactTransport.js',
				'src/algorithm32/implementation/local-sun/cache/compact-transport-consts.js',
				'src/algorithm32/implementation/local-sun/cache/LocalSunCompactReconstruction.js',
				'src/algorithm32/implementation/canonical-atmosphere/cache/CanonicalExponentialCacheColumn.js',
				'src/algorithm32/implementation/canonical-atmosphere/CanonicalAtmosphere.js',
				'src/algorithm32/implementation/flat-earth/FlatEarthGeometry.js',
				'src/algorithm32/implementation/flat-earth/FlatScatteringCacheGeometry.js',
				'src/algorithm32/implementation/flat-earth/CompactLocalCacheTopology.js',
				'src/algorithm32/sampling-domains/direction/cubed-sphere/CubedSphereDirectionDomain.js',
				'src/algorithm32/spectral-values/SpectralPacket.js',
			];
		let comparison =
			JSON.stringify(
				{
					schema: 'local-sun-transport-comparison-v1',
					report,
					derivation: {
						parents: [
							{artifact: 'authority.json', sha256: this._controls.paths.hash(this._controls.fixturePath)},
							...fixture.derivation.parents,
							{
								path: 'src/algorithm32/implementation/local-sun/cache/fixtures/local-sun-normalization-controls.json',
								sha256: 'cb1097c038b416023a3f8ca67eee2d7d95c307b3784b70e0cb48ec1f0b81b3df',
							},
						],
						operation:
							'Compare production geometry-owned rays, atmosphere-owned cache columns and cache-owned Column48/Tail64 integration against independent frozen physical-ray and expm1/series synthetic-J authority; check complete samples, endpoints, cutoff meanings, units/provenance, positive weights and unchanged/signed stored J. No full-field or GPU/default activation.',
						implementation: sources.map((relative) => ({
							path: relative,
							sha256: this._controls.paths.hash(relative),
						})),
						configuration: {geometry: fixture.geometry, policy: fixture.policy, limits: fixture.limits},
						tools: {node: process.version},
						command:
							'node scripts/algorithm32/local-sun-cache/transport/LocalSunTransportProof.js --out ' +
							directory,
					},
				},
				null,
				'\t',
			) + '\n';
		mkdirSync(path.dirname(destination), {recursive: true});
		mkdirSync(destination);
		writeFileSync(
			path.join(destination, 'authority.json'),
			readFileSync(this._controls.paths.checkedPath(this._controls.fixturePath)),
			{flag: 'wx'},
		);
		writeFileSync(path.join(destination, 'comparison.json'), comparison, {flag: 'wx'});
		writeFileSync(
			path.join(destination, 'manifest.json'),
			JSON.stringify(
				{
					schema: 'local-sun-transport-run-v1',
					state: 'passed',
					artifacts: [
						{path: 'authority.json', sha256: this._controls.paths.hash(this._controls.fixturePath)},
						{path: 'comparison.json', sha256: createHash('sha256').update(comparison).digest('hex')},
					],
				},
				null,
				'\t',
			) + '\n',
			{flag: 'wx'},
		);
		return report;
	}
}

if (process.argv[1] && realpathSync(process.argv[1]) === fileURLToPath(import.meta.url)) {
	let args = process.argv.slice(2);
	if (!(args.length === 0 || (args.length === 2 && args[0] === '--out')))
		throw new Error('Use no arguments or --out <new-plan-run-directory>.');
	let proof = new LocalSunTransportProof();
	console.log(JSON.stringify(args.length ? proof.writeComparison(args[1]) : proof.verify(), null, 2));
}
