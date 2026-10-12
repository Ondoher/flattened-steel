import {existsSync, mkdirSync, readFileSync, realpathSync, writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {LocalSunNormalizationControls} from './LocalSunNormalizationControls.js';
import {FlatEarthGeometry} from '../../../../src/algorithm32/implementation/flat-earth/FlatEarthGeometry.js';
import {CanonicalAtmosphere} from '../../../../src/algorithm32/implementation/canonical-atmosphere/CanonicalAtmosphere.js';
import {LocalSunLightSource} from '../../../../src/algorithm32/implementation/local-sun/LocalSunLightSource.js';
import {LocalSunCompactReconstruction} from '../../../../src/algorithm32/implementation/local-sun/cache/LocalSunCompactReconstruction.js';

/** Portable geometric-density cache lookup proof, without field construction or changes to physical models. */
export class LocalSunNormalizationProof {
	/** Read-only authority/path owner. */
	_controls = new LocalSunNormalizationControls();

	/** Called by the proof to reject an unmet capability gate.
	 *
	 * @param {boolean} condition - Required result.
	 * @param {string} message - Failure description.
	 * @returns {void} - No value.
	 * @throws {Error} - A required gate fails.
	 */
	_require(condition, message) {
		if (!condition) throw new Error(message);
	}

	/** Called by comparisons to enforce predeclared finite scalar limits.
	 *
	 * @param {number} actual - Candidate scalar.
	 * @param {number} expected - Independent scalar in matching units.
	 * @param {number} absolute - Absolute allowance in those units.
	 * @param {number} relative - Dimensionless relative allowance.
	 * @returns {number} - Absolute discrepancy.
	 * @throws {Error} - Comparison exceeds the predeclared allowance or is nonfinite.
	 */
	_near(actual, expected, absolute, relative) {
		let error = Math.abs(actual - expected);
		this._require(
			Number.isFinite(actual) && error <= absolute + relative * Math.abs(expected),
			`Normalization differs: ${actual} versus ${expected}.`,
		);
		return error;
	}

	/** Called by production setup to adapt authenticated metre controls.
	 *
	 * @param {LocalSunP0Distance} value - Known complete metre quantity.
	 * @returns {Distance} - Unit-bearing production input.
	 */
	_distance(value) {
		return {value: value.value, units: 'meters'};
	}

	/** Call this method to authenticate exact portable authority bytes before typed use.
	 *
	 * @param {string} [relative] - Optional checked copy with identical frozen bytes.
	 * @returns {LocalSunNormalizationFixture} - Complete authenticated analytic controls.
	 * @throws {Error} - Schema, bytes, producer identity or checked path differs.
	 */
	readAuthority(relative = this._controls.fixturePath) {
		this._require(
			this._controls.hash(relative) === 'cb1097c038b416023a3f8ca67eee2d7d95c307b3784b70e0cb48ec1f0b81b3df',
			'Frozen normalization authority changed.',
		);
		let fixture = /** @type {LocalSunNormalizationFixture} */ (
			JSON.parse(readFileSync(this._controls.checkedPath(relative), 'utf8'))
		);
		this._require(
			fixture.schema === 'local-sun-normalization-controls-v1' &&
				fixture.policy === 'geometric-density' &&
				fixture.nodes.length === 1049 &&
				fixture.wavelengthsNanometers.length === 15 &&
				this._controls.hash(fixture.derivation.producer.path) === fixture.derivation.producer.sha256,
			'Normalization authority compatibility differs.',
		);
		return fixture;
	}

	/** Called by the proof to build only candidate physical inputs, excluding expected nodes or scalar factors.
	 *
	 * @returns {LocalSunNormalizationSetup} - Geometry, compact topology and unchanged physical-model owners.
	 * @throws {Error} - P0 control identity or executable physical input is invalid.
	 */
	_setup() {
		let input = 'src/algorithm32/implementation/local-sun/cache/fixtures/local-sun-compact-p0-controls.json';
		this._require(
			this._controls.hash(input) === '74a7cb03fd646d6ec4754e45e46f7ed622c815d09cd82ceeef174819c3513db6',
			'P0 spatial authority changed.',
		);
		let p0 = /** @type {LocalSunP0Fixture} */ (JSON.parse(readFileSync(this._controls.checkedPath(input), 'utf8')));
		let spatial = p0.controls;
		let geometry = new FlatEarthGeometry({
			topAltitude: this._distance(spatial.geometry.atmosphereTop),
			localLightSourceHeight: this._distance(spatial.geometry.sourceHeight),
			projectionRadius: {value: 6360000, units: 'meters'},
		});
		let source = new LocalSunLightSource({
			sourceKey: 'compact-normalization-proof',
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
			sourceHeight: this._distance(spatial.geometry.sourceHeight),
			atmosphereTop: this._distance(spatial.geometry.atmosphereTop),
			coverageRadius: this._distance(spatial.geometry.coverageRadius),
			altitudes: spatial.rows.map((row) => this._distance(row.altitude)),
			bandRadii: [
				this._distance(spatial.bands[0].innerRadius),
				...spatial.bands.map((band) => this._distance(band.outerRadius)),
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
				units: 'm^-1',
			})),
			boundaryExtinctionLengthMultiples: [0.25, 0.5, 1, 2, 4, 8, 16],
			provenanceIdentity: 'p0:74a7cb03:geometric-density-native15-controls',
		});
		return {geometry, atmosphere, topology, p0};
	}

	/** Called by synthetic angular controls to evaluate a seam-consistent function of physical W27 cube direction.
	 *
	 * @param {number} index - Logical W27 address.
	 * @returns {number} - Bounded positive dimensionless directional scale.
	 */
	_directionValue(index) {
		let face = Math.floor(index / 729),
			local = index % 729,
			u = 2 * (local % 27) - 26,
			v = 2 * Math.floor(local / 27) - 26;
		let [x, y, z] = [
			[26, u, v],
			[-26, -u, v],
			[-u, 26, v],
			[u, -26, v],
			[u, v, 26],
			[-u, v, -26],
		][face];
		return 1 + (0.1 * (x + 0.5 * y + 0.25 * z)) / Math.hypot(x, y, z);
	}

	/** Call this method to compare node factors, query ratios and restored read-only synthetic physical J.
	 * Synthetic controls prove interpolation algebra and angular selection, not physical-field accuracy.
	 * All gold and tolerances are authenticated before constructing the candidate.
	 *
	 * @returns {LocalSunNormalizationReport} - Selected cache reconstruction capability receipt.
	 * @throws {Error} - Any factor, interpolation, semantics, field-preservation or rejection gate fails.
	 */
	verify() {
		let fixture = this.readAuthority(),
			setup = this._setup();
		let angularPath = 'src/algorithm32/implementation/flat-earth/fixtures/local-sun-directional-controls.json';
		this._require(
			this._controls.hash(angularPath) === '3950f22be0b4a43ed1237ecde3cf00219a201a9648bace1306bd6dc2fd6413b1',
			'Directional authority changed.',
		);
		let angular = /** @type {LocalSunDirectionalFixture} */ (
			JSON.parse(readFileSync(this._controls.checkedPath(angularPath), 'utf8'))
		);
		let candidate = new LocalSunCompactReconstruction(setup);
		let maximumLogError = 0,
			maximumRatioError = 0,
			maximumDensityError = 0,
			ratioComparisons = 0,
			mixedComparisons = 0;
		for (let node of fixture.nodes) {
			let logs = candidate.nodeLogFactors(node.index);
			for (let channel = 0; channel < 15; channel++)
				maximumLogError = Math.max(
					maximumLogError,
					this._near(logs[channel], Math.log(node.factors[channel]), fixture.limits.logAbsolute, 0),
				);
		}
		let logs = /** @type {number[]} */ (candidate.nodeLogFactors(0));
		let original = logs[0];
		logs[0] = 1e20;
		this._near(candidate.nodeLogFactors(0)[0], original, 0, 0);
		let samples = Float64Array.from(
			fixture.nodes.flatMap((node) => {
				let physical = setup.p0.controls.nodes[node.index];
				return node.factors.map(
					(factor, channel) =>
						factor *
						(1 +
							(0.25 * physical.sourceDistance.value) / fixture.geometry.sourceHeight +
							physical.altitude.value / fixture.geometry.atmosphereTop) *
						(channel + 1),
				);
			}),
		);
		let sampleHash = createHash('sha256').update(new Uint8Array(samples.buffer)).digest('hex');
		let reader = /** @type {Pick<CpuDirectionalSpectralFieldReader, 'readScalar'>} */ ({
			readScalar: ({positionIndex, wavelengthIndex}) => samples[positionIndex * 15 + wavelengthIndex],
		});
		for (let node of fixture.nodes) {
			let position = setup.geometry.resolveCompactLocalSunCacheNodePosition({
				topology: setup.topology,
				positionIndex: node.index,
			});
			let packet = candidate.sampleScatteringDensity({
				position,
				physicalOutgoingDirection: [1, 0, 0],
				reader,
				provenanceIdentity: 'independent-synthetic-physical-J',
			});
			for (let channel = 0; channel < 15; channel++)
				maximumDensityError = Math.max(
					maximumDensityError,
					this._near(
						packet.values[channel],
						samples[node.index * 15 + channel],
						fixture.limits.scatteringAbsolute,
						fixture.limits.exactNodeRelative,
					),
				);
		}
		for (let query of fixture.queries) {
			let position = /** @type {Position} */ ({
				coordinates: [query.horizontalDistance, 0, query.altitude],
				units: 'meters',
			});
			let taps = candidate.resolveStencil({position, physicalOutgoingDirection: [0, 1, 0]});
			this._require(
				JSON.stringify(taps.map((tap) => tap.positionIndex)) === JSON.stringify(query.indices),
				'Query spatial support differs.',
			);
			for (let [i, tap] of taps.entries())
				for (let channel = 0; channel < 15; channel++) {
					maximumRatioError = Math.max(
						maximumRatioError,
						this._near(
							tap.spectralScales[channel],
							query.ratios[i][channel],
							fixture.limits.ratioAbsolute,
							fixture.limits.relative,
						),
					);
					ratioComparisons++;
				}
			let packet = candidate.sampleScatteringDensity({
				position,
				physicalOutgoingDirection: [0, 1, 0],
				reader,
				provenanceIdentity: 'independent-synthetic-physical-J',
			});
			this._require(
				packet.quantity === 'spectral-scattering-density' &&
					packet.units === 'W m^-3 sr^-1 nm^-1' &&
					packet.basis.contentHash === setup.atmosphere.spectralBasis.contentHash &&
					packet.semantics === 'contiguous-wavelength-bin-average' &&
					packet.provenanceIdentity === 'independent-synthetic-physical-J',
				'Physical J interpretation changed.',
			);
			for (let channel = 0; channel < 15; channel++)
				maximumDensityError = Math.max(
					maximumDensityError,
					this._near(
						packet.values[channel],
						query.expectedAffine[channel],
						fixture.limits.scatteringAbsolute,
						fixture.limits.relative,
					),
				);
			for (let control of angular.cases.filter((c) => c.angle === 0)) {
				let directionalReader = /** @type {Pick<CpuDirectionalSpectralFieldReader, 'readScalar'>} */ ({
					readScalar: ({positionIndex, directionIndex, wavelengthIndex}) =>
						samples[positionIndex * 15 + wavelengthIndex] * this._directionValue(directionIndex),
				});
				let actual = candidate.sampleScatteringDensity({
					position,
					physicalOutgoingDirection: control.direction,
					reader: directionalReader,
					provenanceIdentity: 'independent-angular-synthetic-J',
				});
				for (let channel = 0; channel < 15; channel++) {
					let expected = 0;
					for (let [i, index] of query.indices.entries()) {
						let direction =
							setup.p0.controls.nodes[index].horizontalDistance.value === 0
								? control.axis
								: control.normal;
						let angularValue = direction.weights.reduce(
							(sum, weight, j) => sum + weight * this._directionValue(direction.indices[j]),
							0,
						);
						expected +=
							query.weights[i] * query.ratios[i][channel] * samples[index * 15 + channel] * angularValue;
					}
					maximumDensityError = Math.max(
						maximumDensityError,
						this._near(
							actual.values[channel],
							expected,
							fixture.limits.scatteringAbsolute,
							fixture.limits.relative,
						),
					);
					mixedComparisons++;
				}
			}
		}
		let zeroReader = /** @type {Pick<CpuDirectionalSpectralFieldReader, 'readScalar'>} */ ({readScalar: () => 0});
		let signedReader = /** @type {Pick<CpuDirectionalSpectralFieldReader, 'readScalar'>} */ ({
			readScalar: (address) => -reader.readScalar(address),
		});
		let axis = /** @type {Position} */ ({coordinates: [0, 0, 0], units: 'meters'});
		let zero = candidate.sampleScatteringDensity({
			position: axis,
			physicalOutgoingDirection: [0, 1, 0],
			reader: zeroReader,
			provenanceIdentity: 'zero-synthetic-J',
		});
		let negative = candidate.sampleScatteringDensity({
			position: axis,
			physicalOutgoingDirection: [0, 1, 0],
			reader: signedReader,
			provenanceIdentity: 'signed-synthetic-J',
		});
		this._require(
			zero.values.every((value) => value === 0) && negative.values.every((value) => value < 0),
			'Zero or signed physical samples were clamped.',
		);
		this._require(
			createHash('sha256').update(new Uint8Array(samples.buffer)).digest('hex') === sampleHash,
			'Stored physical J was modified.',
		);
		let rejected = 0;
		for (let operation of [
			() => candidate.nodeLogFactors(-1),
			() =>
				candidate.resolveStencil({
					position: {coordinates: [fixture.geometry.coverageRadius + 1, 0, 0], units: 'meters'},
					physicalOutgoingDirection: [1, 0, 0],
				}),
			() =>
				candidate.sampleScatteringDensity({
					position: axis,
					physicalOutgoingDirection: [1, 0, 0],
					reader: {readScalar: () => NaN},
					provenanceIdentity: 'invalid-synthetic-J',
				}),
		]) {
			try {
				operation();
			} catch (error) {
				if (!(error instanceof RangeError)) throw error;
				rejected++;
			}
		}
		this._require(rejected === 3, 'Unsupported factor/query/field input admitted.');
		return {
			status: 'PASSED',
			nodeFactors: fixture.nodes.length * 15,
			exactNodeChannels: fixture.nodes.length * 15,
			ratioComparisons,
			mixedComparisons,
			maximumLogError,
			maximumRatioError,
			maximumDensityError,
			physicalValuesUnchanged: true,
			signedSamplesPreserved: true,
			rejected,
			physicalFieldsQualified: false,
		};
	}

	/** Call this method to preserve a new immutable production comparison with complete derivation.
	 *
	 * @param {string} directory - New normalized plan-owned ignored run directory.
	 * @returns {LocalSunNormalizationReport} - Saved selected reconstruction proof.
	 * @throws {Error} - Destination is unsupported/existing, proof fails, or evidence cannot be written.
	 */
	writeComparison(directory) {
		this._require(
			directory.startsWith('tmp/production-local-sun-cache-promotion/runs/'),
			'Plan-owned normalization output required.',
		);
		let destination = this._controls.checkedPath(directory);
		this._require(!existsSync(destination), 'Existing immutable comparison rejected.');
		let report = this.verify(),
			fixture = this.readAuthority();
		let sourcePaths = [
			'scripts/algorithm32/local-sun-cache/normalization/LocalSunNormalizationControls.js',
			'scripts/algorithm32/local-sun-cache/normalization/LocalSunNormalizationProof.js',
			'src/algorithm32/implementation/local-sun/cache/LocalSunCompactReconstruction.js',
			'src/algorithm32/implementation/flat-earth/FlatEarthGeometry.js',
			'src/algorithm32/implementation/flat-earth/FlatScatteringCacheGeometry.js',
			'src/algorithm32/implementation/flat-earth/CompactLocalCacheTopology.js',
			'src/algorithm32/implementation/canonical-atmosphere/CanonicalAtmosphere.js',
			'src/algorithm32/sampling-domains/direction/cubed-sphere/CubedSphereDirectionDomain.js',
			'src/algorithm32/spectral-values/SpectralPacket.js',
		];
		let result = `${JSON.stringify({schema: 'local-sun-normalization-comparison-v1', report, derivation: {parents: [{artifact: 'authority.json', sha256: this._controls.hash(this._controls.fixturePath)}, fixture.derivation.parents[0], {path: 'src/algorithm32/implementation/flat-earth/fixtures/local-sun-directional-controls.json', sha256: '3950f22be0b4a43ed1237ecde3cf00219a201a9648bace1306bd6dc2fd6413b1'}], operation: 'Construct geometry-owned compact positions and cache-owned log factors from existing Native15 medium samples/source-relative distances. Compare all factors and ratios with independent direct-product algebra. Read synthetic physical J through positive per-tap spatial/angular/factor weights; prove affine normalized reconstruction, axis/mixed angular behavior, signed/zero preservation, defensive node-log copies and unchanged stored values. No field construction, beam attenuation, physical-model changes, transport, GPU or default/profile activation.', implementation: sourcePaths.map((relative) => ({path: relative, sha256: this._controls.hash(relative)})), configuration: {geometry: fixture.geometry, policy: fixture.policy, limits: fixture.limits}, tools: {node: process.version}, command: `node scripts/algorithm32/local-sun-cache/normalization/LocalSunNormalizationProof.js --out ${directory}`}}, null, '\t')}\n`;
		mkdirSync(path.dirname(destination), {recursive: true});
		mkdirSync(destination);
		writeFileSync(
			path.join(destination, 'authority.json'),
			readFileSync(this._controls.checkedPath(this._controls.fixturePath)),
			{flag: 'wx'},
		);
		writeFileSync(path.join(destination, 'comparison.json'), result, {flag: 'wx'});
		writeFileSync(
			path.join(destination, 'manifest.json'),
			`${JSON.stringify(
				{
					schema: 'local-sun-normalization-run-v1',
					state: 'passed',
					artifacts: [
						{path: 'authority.json', sha256: this._controls.hash(this._controls.fixturePath)},
						{path: 'comparison.json', sha256: createHash('sha256').update(result).digest('hex')},
					],
				},
				null,
				'\t',
			)}\n`,
			{flag: 'wx'},
		);
		return report;
	}
}

if (process.argv[1] && realpathSync(process.argv[1]) === fileURLToPath(import.meta.url)) {
	let args = process.argv.slice(2);
	if (!(args.length === 0 || (args.length === 2 && args[0] === '--out')))
		throw new Error('Use no arguments or --out <new-plan-run-directory>.');
	let proof = new LocalSunNormalizationProof();
	console.log(JSON.stringify(args.length ? proof.writeComparison(args[1]) : proof.verify(), null, 2));
}
