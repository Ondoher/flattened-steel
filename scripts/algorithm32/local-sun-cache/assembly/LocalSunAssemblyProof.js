import {createHash} from 'node:crypto';
import {existsSync, mkdirSync, readFileSync, realpathSync, writeFileSync} from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {performance} from 'node:perf_hooks';
import os from 'node:os';
import {LocalSunAssemblyControls} from './LocalSunAssemblyControls.js';
import {FlatEarthGeometry} from '../../../../src/algorithm32/implementation/flat-earth/FlatEarthGeometry.js';
import {LocalSunLightSource} from '../../../../src/algorithm32/implementation/local-sun/LocalSunLightSource.js';
import {CanonicalAtmosphere} from '../../../../src/algorithm32/implementation/canonical-atmosphere/CanonicalAtmosphere.js';
import {LocalSunCompactCpuAssembly} from '../../../../src/algorithm32/implementation/local-sun/cache/LocalSunCompactCpuAssembly.js';
import {SharedModel} from '../../../../src/algorithm32/implementation/algorithm32/model/SharedModel.js';
import {SpectralCalculator} from '../../../../src/algorithm32/atmospheric-transport/spectral/SpectralCalculator.js';
import {createNativeExecutionProfile} from '../../../../src/algorithm32/profiles/native-15/native-15-profile.js';
import {CUBED_SPHERE_W27_DIRECTION_DOMAIN_OWNER} from '../../../../src/algorithm32/sampling-domains/direction/cubed-sphere/consts.js';
import FlatHorizonPartitionedDirectionDomain from '../../../../src/algorithm32/sampling-domains/direction/horizon-partitioned/FlatHorizonPartitionedDirectionDomain.js';
import {SpectralPacket} from '../../../../src/algorithm32/spectral-values/index.js';
import DistanceMath from '../../../../src/algorithm32/math/DistanceMath.js';

/** Portable selected compact construction proof and bounded cost pilot, with complete-field/recurrence claims excluded. */
export class LocalSunAssemblyProof {
	/** Independent authority and checked paths. @type {LocalSunAssemblyControls} */
	_controls = new LocalSunAssemblyControls();

	/** Called by proof gates to compare candidate output with predeclared independent bounds.
	 *
	 * @param {number} actual - Candidate scalar.
	 * @param {number} expected - Independent scalar.
	 * @param {number} absolute - Original absolute allowance.
	 * @param {number} relative - Original relative allowance.
	 * @returns {number} - Absolute residual.
	 * @throws {Error} - Nonfinite or excessive discrepancy.
	 */
	_near(actual, expected, absolute, relative) {
		let residual = Math.abs(actual - expected);
		if (!Number.isFinite(actual) || residual > absolute + relative * Math.abs(expected))
			throw new Error('Assembly scalar differs: ' + actual + ' versus ' + expected);
		return residual;
	}

	/** Call this method to authenticate exact formatted control bytes and producer before candidate construction.
	 *
	 * @returns {LocalSunAssemblyFixture} - Complete typed independent authority.
	 * @throws {Error} - Byte, schema or producer identity differs.
	 */
	readAuthority() {
		let control = this._controls;
		if (
			control.paths.hash(control.fixturePath) !==
			'e0f024d545af75e3e2156c4c9067b1c1324d0b38bdb45eee0064bce1863a8960'
		)
			throw new Error('Frozen assembly authority changed.');
		let fixture = /** @type {LocalSunAssemblyFixture} */ (
			JSON.parse(readFileSync(control.paths.checkedPath(control.fixturePath), 'utf8'))
		);
		if (
			fixture.schema !== 'local-sun-assembly-controls-v1' ||
			control.paths.hash(fixture.derivation.producer.path) !== fixture.derivation.producer.sha256
		)
			throw new Error('Assembly control compatibility changed.');
		return fixture;
	}

	/** Call this method to build actual physical owners from P0 input configuration, excluding expected outputs.
	 * The existing native profile supplies the shared calculator's spectral facts only; it is not represented as a complete compact compiler profile.
	 *
	 * @returns {LocalSunCompactCpuAssemblyDefinition} - Bound physical source, compact topology, medium and genuine shared calculator.
	 * @throws {Error} - Physical P0 authority differs.
	 */
	createPhysicalDefinition() {
		let input = 'src/algorithm32/implementation/local-sun/cache/fixtures/local-sun-compact-p0-controls.json';
		if (this._controls.paths.hash(input) !== '74a7cb03fd646d6ec4754e45e46f7ed622c815d09cd82ceeef174819c3513db6')
			throw new Error('P0 authority changed.');
		let p0 = /** @type {LocalSunP0Fixture} */ (
				JSON.parse(readFileSync(this._controls.paths.checkedPath(input), 'utf8'))
			),
			spatial = p0.controls;
		let geometry = new FlatEarthGeometry({
			topAltitude: DistanceMath.inMeters(spatial.geometry.atmosphereTop.value),
			localLightSourceHeight: DistanceMath.inMeters(spatial.geometry.sourceHeight.value),
			projectionRadius: DistanceMath.inMeters(6360000),
		});
		let lightSource = new LocalSunLightSource({
			sourceKey: 'compact-assembly-proof',
			referenceDistance: DistanceMath.inMeters(4800000),
			referenceSpectralIncidentScale: 1,
			radius: DistanceMath.inMeters(25749.504),
			distanceFalloff: true,
		});
		let observation = {
			instant: '2024-12-14T17:27:41.487Z',
			location: {
				latitude: {value: 0, units: /** @type {const} */ ('degrees')},
				longitude: {value: 0, units: /** @type {const} */ ('degrees')},
			},
		};
		geometry.configureLightSource({
			lightSource,
			observation,
			placement: {
				kind: 'finite-position',
				position: {coordinates: [0, 0, spatial.geometry.sourceHeight.value], units: 'meters'},
			},
		});
		let atmosphere = new CanonicalAtmosphere();
		let topology = geometry.createCompactLocalSunCacheTopology({
			sourceHeight: DistanceMath.inMeters(spatial.geometry.sourceHeight.value),
			atmosphereTop: DistanceMath.inMeters(spatial.geometry.atmosphereTop.value),
			coverageRadius: DistanceMath.inMeters(spatial.geometry.coverageRadius.value),
			altitudes: spatial.rows.map((row) => DistanceMath.inMeters(row.altitude.value)),
			bandRadii: [
				DistanceMath.inMeters(spatial.bands[0].innerRadius.value),
				...spatial.bands.map((band) => DistanceMath.inMeters(band.outerRadius.value)),
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
			provenanceIdentity: 'p0:74a7cb03:selected-assembly-controls',
		});
		let profile = createNativeExecutionProfile({
			geometry,
			atmosphere,
			lightSource,
			groundBoundary: null,
			observation,
			execution: {},
			domains: {
				positions: geometry.createLocalSunCachePositionDomain(),
				incomingDirections: new FlatHorizonPartitionedDirectionDomain(),
				outgoingDirections: CUBED_SPHERE_W27_DIRECTION_DOMAIN_OWNER,
			},
		});
		let calculator = new SpectralCalculator({model: new SharedModel({profile, version: 1})});
		return {geometry, atmosphere, topology, lightSource, calculator};
	}

	/** Call this method to compare real primary construction, selected primary transport and a separate manufactured full-measure J2 step.
	 * Timings are measured facts, not authorization or accuracy for complete fields. No 1920-ray physical recurrence is executed.
	 *
	 * @returns {LocalSunAssemblyReport} - Selected numerical comparisons, semantic gates and cost samples.
	 * @throws {Error} - Any authority, resource, comparison or semantic gate fails.
	 */
	verify() {
		let fixture = this.readAuthority(),
			freeBefore = os.freemem(),
			started = performance.now();
		if (freeBefore < 8 * 1024 ** 3) throw new Error('Eight GiB free-memory reserve required.');
		let setup = this.createPhysicalDefinition(),
			candidate = new LocalSunCompactCpuAssembly(setup),
			setupMilliseconds = performance.now() - started;
		let domains = candidate.domains;
		if (
			domains.topology.positionCount !== 1049 ||
			domains.incomingDirections.directionCount !== 1920 ||
			domains.outgoingDirections.directionCount !== 4374 ||
			domains.radiancePacking.positionCount !== 1049 ||
			domains.scatteringPacking.positionCount !== 1049
		)
			throw new Error('Compact assembly domains are not the qualified real extents.');
		let maximumPrimaryError = 0,
			maximumRadianceError = 0,
			maximumScatterError = 0,
			primaryComparisons = 0;
		let primaryStarted = performance.now();
		let directPosition = setup.geometry.resolveCompactLocalSunCacheNodePosition({
			topology: setup.topology,
			positionIndex: 400,
		});
		let directRequest = {
			sourceRelativePosition: setup.geometry.resolveSourceRelativePosition({position: directPosition}),
		};
		let directBefore = setup.lightSource.sampleDirectLighting(directRequest),
			sourcePacketHash = setup.lightSource.configuration.sourceIrradiance.contentHash;
		for (let node of fixture.primary) {
			for (let [i, direction] of fixture.directions.entries()) {
				let packet = candidate.samplePrimaryScatteringDensity({
					positionIndex: node.positionIndex,
					directionIndex: direction.index,
				});
				if (packet.quantity !== 'spectral-scattering-density' || packet.units !== 'W m^-3 sr^-1 nm^-1')
					throw new Error('Physical primary J interpretation differs.');
				for (let c = 0; c < 15; c++) {
					maximumPrimaryError = Math.max(
						maximumPrimaryError,
						this._near(
							packet.values[c],
							node.samples[i][c],
							fixture.limits.primaryAbsolute,
							fixture.limits.primaryRelative,
						),
					);
					primaryComparisons++;
				}
			}
		}
		let primaryMilliseconds = performance.now() - primaryStarted,
			rayMilliseconds = [];
		for (let ray of fixture.rays) {
			let direction = fixture.directions.find((d) => d.index === ray.directionIndex);
			if (!direction) throw new Error('Independent ray direction missing.');
			let rayStarted = performance.now(),
				result = candidate.transportPrimaryRay({
					position: setup.geometry.resolveCompactLocalSunCacheNodePosition({
						topology: setup.topology,
						positionIndex: ray.positionIndex,
					}),
					physicalDirection: /** @type {UnitVector3} */ (direction.vector),
					maximumDistance: DistanceMath.inMeters(ray.length),
				});
			rayMilliseconds.push(performance.now() - rayStarted);
			for (let c = 0; c < 15; c++)
				maximumRadianceError = Math.max(
					maximumRadianceError,
					this._near(
						result.radiance.values[c],
						ray.radiance[c],
						fixture.limits.radianceAbsolute,
						fixture.limits.radianceRelative,
					),
				);
		}
		let scatterStarted = performance.now();
		let result = candidate.buildScatteringStep({
			positionIndices: fixture.scatterPositions,
			outgoingDirectionIndices: fixture.scatterDirections,
			provenanceIdentity: 'independent-anisotropic-manufactured-L1',
			sampleIncomingRadiance: ({directionIndex}) => {
				let direction = domains.incomingDirections.unitVectors[directionIndex];
				return new SpectralPacket({
					basis: domains.spectralBasis,
					quantity: 'spectral-radiance-density',
					units: 'W m^-2 sr^-1 nm^-1',
					values: Array.from(
						{length: 15},
						(_unused, c) => (c + 1) * 1e-6 * (1 + 0.2 * direction[2] + 0.1 * direction[0]),
					),
					provenanceIdentity: 'independent-anisotropic-manufactured-L1',
				});
			},
		});
		let scatterMilliseconds = performance.now() - scatterStarted,
			reader = result.field.createReader();
		if (
			!result.field.isSealed ||
			reader.order.kind !== 'pure' ||
			reader.order.value !== 2 ||
			reader.scalarCount !== 90 ||
			result.allocatedSpectralBytes.value !== 461520
		)
			throw new Error('Selected physical field/order/allocation differs.');
		for (let control of fixture.scatter) {
			let positionIndex = result.positionIndices.indexOf(control.positionIndex),
				directionIndex = result.outgoingDirectionIndices.indexOf(control.directionIndex);
			for (let wavelengthIndex = 0; wavelengthIndex < 15; wavelengthIndex++)
				maximumScatterError = Math.max(
					maximumScatterError,
					this._near(
						reader.readScalar({positionIndex, directionIndex, wavelengthIndex}),
						control.values[wavelengthIndex],
						fixture.limits.scatterAbsolute,
						fixture.limits.scatterRelative,
					),
				);
		}
		let directAfter = setup.lightSource.sampleDirectLighting(directRequest);
		if (
			JSON.stringify(directAfter.sourceIrradiance.values) !==
				JSON.stringify(directBefore.sourceIrradiance.values) ||
			setup.lightSource.configuration.sourceIrradiance.contentHash !== sourcePacketHash
		)
			throw new Error('Continuous direct/source packet was altered by cache construction.');
		let memoCount = candidate.primaryMemoUsage.spectra;
		candidate.samplePrimaryScatteringDensity({positionIndex: 0, directionIndex: 364});
		if (candidate.primaryMemoUsage.spectra !== memoCount)
			throw new Error('Repeated primary sample allocated another spectrum.');
		let zero = candidate.buildScatteringStep({
			positionIndices: [0],
			outgoingDirectionIndices: [364],
			provenanceIdentity: 'zero-manufactured-L1',
			sampleIncomingRadiance: () =>
				new SpectralPacket({
					basis: domains.spectralBasis,
					quantity: 'spectral-radiance-density',
					units: 'W m^-2 sr^-1 nm^-1',
					values: new Array(15).fill(0),
					provenanceIdentity: 'zero-manufactured-L1',
				}),
		});
		let zeroReader = zero.field.createReader();
		for (let wavelengthIndex = 0; wavelengthIndex < 15; wavelengthIndex++)
			if (zeroReader.readScalar({positionIndex: 0, directionIndex: 0, wavelengthIndex}) !== 0)
				throw new Error('Zero incoming radiance produced nonzero J2.');
		let negative = candidate.buildScatteringStep({
			positionIndices: [0],
			outgoingDirectionIndices: [364],
			provenanceIdentity: 'signed-manufactured-L1',
			sampleIncomingRadiance: ({directionIndex}) => {
				let direction = domains.incomingDirections.unitVectors[directionIndex];
				return new SpectralPacket({
					basis: domains.spectralBasis,
					quantity: 'spectral-radiance-density',
					units: 'W m^-2 sr^-1 nm^-1',
					values: Array.from(
						{length: 15},
						(_unused, c) => -(c + 1) * 1e-6 * (1 + 0.2 * direction[2] + 0.1 * direction[0]),
					),
					provenanceIdentity: 'signed-manufactured-L1',
				});
			},
		});
		let negativeReader = negative.field.createReader();
		for (let wavelengthIndex = 0; wavelengthIndex < 15; wavelengthIndex++)
			this._near(
				negativeReader.readScalar({positionIndex: 0, directionIndex: 0, wavelengthIndex}),
				-fixture.scatter[0].values[wavelengthIndex],
				fixture.limits.scatterAbsolute,
				fixture.limits.scatterRelative,
			);
		let rejected = 0;
		for (let operation of [
			() => candidate.samplePrimaryScatteringDensity({positionIndex: 1049, directionIndex: 364}),
			() => candidate.samplePrimaryScatteringDensity({positionIndex: 0, directionIndex: 4374}),
			() =>
				candidate.buildScatteringStep({
					positionIndices: [0, 0],
					outgoingDirectionIndices: [364],
					provenanceIdentity: 'invalid',
					sampleIncomingRadiance: () => {
						throw new Error('Must reject before input sampling.');
					},
				}),
		]) {
			try {
				operation();
			} catch (error) {
				if (!(error instanceof RangeError)) throw error;
				rejected++;
			}
		}
		if (rejected !== 3) throw new Error('Selected construction ingress accepted unsupported addresses.');
		return {
			status: 'PASSED',
			primaryComparisons,
			primaryNodes: fixture.primary.length,
			rayComparisons: fixture.rays.length * 15,
			scatterComparisons: fixture.scatter.length * 15,
			incomingCount: 1920,
			selectedFieldScalars: reader.scalarCount,
			selectedSpectralBytes: result.allocatedSpectralBytes.value,
			memoSpectra: candidate.primaryMemoUsage.spectra,
			memoSpectralBytes: candidate.primaryMemoUsage.spectralPayload.value,
			maximumPrimaryError,
			maximumRadianceError,
			maximumScatterError,
			rejected,
			setupMilliseconds,
			primaryMilliseconds,
			rayMilliseconds,
			scatterMilliseconds,
			elapsedMilliseconds: performance.now() - started,
			freeBeforeBytes: freeBefore,
			rssAfterBytes: process.memoryUsage().rss,
			fullFieldsQualified: false,
			fullRecurrenceQualified: false,
			directSourceUnchanged: true,
			zeroAndSignedInputsPreserved: true,
		};
	}

	/** Call this method to preserve a new immutable selected assembly comparison and complete ancestry.
	 *
	 * @param {string} directory - New normalized plan-owned ignored run directory.
	 * @returns {LocalSunAssemblyReport} - Passed selected proof and cost pilot.
	 * @throws {Error} - Existing/unsupported output, proof failure or evidence-write failure.
	 */
	writeComparison(directory) {
		if (!directory.startsWith('tmp/production-local-sun-cache-promotion/runs/'))
			throw new Error('Plan-owned assembly output required.');
		let destination = this._controls.paths.checkedPath(directory);
		if (existsSync(destination)) throw new Error('Existing immutable assembly comparison rejected.');
		let report = this.verify(),
			fixture = this.readAuthority();
		let sources = [
			'scripts/algorithm32/local-sun-cache/assembly/LocalSunAssemblyControls.js',
			'scripts/algorithm32/local-sun-cache/assembly/LocalSunAssemblyProof.js',
			'src/algorithm32/implementation/local-sun/cache/LocalSunCompactCpuAssembly.js',
			'src/algorithm32/implementation/local-sun/cache/LocalSunCompactTransport.js',
			'src/algorithm32/implementation/local-sun/cache/LocalSunCompactReconstruction.js',
			'src/algorithm32/implementation/local-sun/cache/LocalSunConstructionLightSource.js',
			'src/algorithm32/implementation/local-sun/cache/LocalSunShellFactCache.js',
			'src/algorithm32/implementation/local-sun/cache/LocalSunFieldPacking.js',
			'src/algorithm32/light-source-support/cache/CpuDirectionalSpectralField.js',
			'src/algorithm32/atmospheric-transport/later-order-scattering-density.js',
			'src/algorithm32/atmospheric-transport/spectral/SpectralCalculator.js',
			'src/algorithm32/implementation/canonical-atmosphere/CanonicalAtmosphere.js',
			'src/algorithm32/implementation/canonical-atmosphere/cache/CanonicalExponentialCacheColumn.js',
			'src/algorithm32/implementation/flat-earth/FlatEarthGeometry.js',
			'src/algorithm32/implementation/flat-earth/FlatScatteringCacheGeometry.js',
			'src/algorithm32/implementation/flat-earth/CompactLocalCacheTopology.js',
			'src/algorithm32/implementation/local-sun/LocalSunLightSource.js',
			'src/algorithm32/sampling-domains/direction/horizon-partitioned/FlatHorizonPartitionedDirectionDomain.js',
			'src/algorithm32/sampling-domains/direction/cubed-sphere/CubedSphereDirectionDomain.js',
			'src/algorithm32/spectral-values/SpectralPacket.js',
		];
		let comparison =
			JSON.stringify(
				{
					schema: 'local-sun-selected-assembly-comparison-v1',
					report,
					derivation: {
						parents: [
							{artifact: 'authority.json', sha256: this._controls.paths.hash(this._controls.fixturePath)},
							...fixture.derivation.parents,
						],
						operation:
							'Compose actual compact domains/packings, shell-held source, geometry/atmosphere cache columns, lazy physical J1 and selected transport; compare independent primary and vertical transported J1 controls. Build a distinct manufactured full-measure L-to-J2 subset through the existing physical scattering kernel and genuine field readers/writers. Measure selected costs/allocations only; no full physical recurrence/field/profile/GPU/runtime acceptance.',
						implementation: sources.map((relative) => ({
							path: relative,
							sha256: this._controls.paths.hash(relative),
						})),
						configuration: {
							primaryPositions: fixture.primary.map((n) => n.positionIndex),
							directions: fixture.directions,
							rays: fixture.rays.map((r) => ({
								positionIndex: r.positionIndex,
								directionIndex: r.directionIndex,
								lengthMeters: r.length,
							})),
							scatterPositions: fixture.scatterPositions,
							scatterDirections: fixture.scatterDirections,
							limits: fixture.limits,
						},
						tools: {node: process.version},
						command:
							'node scripts/algorithm32/local-sun-cache/assembly/LocalSunAssemblyProof.js --out ' +
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
					schema: 'local-sun-selected-assembly-run-v1',
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
	let proof = new LocalSunAssemblyProof();
	console.log(JSON.stringify(args.length ? proof.writeComparison(args[1]) : proof.verify(), null, 2));
}
