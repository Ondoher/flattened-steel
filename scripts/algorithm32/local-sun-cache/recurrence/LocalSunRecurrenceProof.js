import {createHash} from 'node:crypto';
import {existsSync, mkdirSync, readFileSync, realpathSync, writeFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {performance} from 'node:perf_hooks';
import os from 'node:os';
import {LocalSunAssemblyProof} from '../assembly/LocalSunAssemblyProof.js';
import {LocalSunAssemblyControls} from '../assembly/LocalSunAssemblyControls.js';
import {LocalSunCompactConstructionProfile} from '../../../../src/algorithm32/implementation/local-sun/cache/LocalSunCompactConstructionProfile.js';
import {LocalSunCompactCpuAssembly} from '../../../../src/algorithm32/implementation/local-sun/cache/LocalSunCompactCpuAssembly.js';
import {
	SpectralPacket,
	SPECTRAL_QUANTITIES,
	SPECTRAL_UNITS,
} from '../../../../src/algorithm32/spectral-values/index.js';
import DistanceMath from '../../../../src/algorithm32/math/DistanceMath.js';

/** Bounded common-input physical CPU operator proof against an immutable, independently frozen numerical producer. */
export class LocalSunRecurrenceProof {
	/** Authenticated repository identity and checked source/output paths. */
	_paths = new LocalSunAssemblyControls().paths;
	/** Independently generated physical inputs, retained in a separate immutable run. @readonly */
	_controlRoot = 'tmp/production-local-sun-cache-promotion/runs/00023-physical-recurrence-controls';

	/** Called by physical comparisons to enforce original quantity gates; tolerances never follow candidate residuals.
	 *
	 * @param {number} actual - Production CPU result.
	 * @param {number} expected - Independently frozen producer result.
	 * @param {number} absolute - Original quantity absolute allowance.
	 * @returns {number} - Absolute residual.
	 * @throws {Error} - Nonfinite, negative beyond the allowance, or excessive discrepancy.
	 */
	_near(actual, expected, absolute) {
		let error = Math.abs(actual - expected);
		if (
			!Number.isFinite(actual) ||
			!Number.isFinite(expected) ||
			actual < -absolute ||
			expected < -absolute ||
			error > absolute + 0.002 * Math.abs(expected)
		)
			throw new Error('Physical recurrence comparison failed: ' + actual + ' versus ' + expected);
		return error;
	}

	/** Called by physical qualification to authenticate complete immutable inputs before candidate execution.
	 *
	 * @returns {LocalSunPhysicalControls} - Independent physical field selections.
	 * @throws {Error} - Parent producer, extraction, schema, shape or artifact identities differ.
	 */
	_readControls() {
		if (
			this._paths.hash(this._controlRoot + '/manifest.json') !==
			'e80306d151411c478c6a5486acccf9e6b9b7e135f66baa49393e19b42bf98f7c'
		)
			throw new Error('Independent physical control authority changed.');
		let manifest = /** @type {LocalSunPhysicalControlManifest} */ (
			JSON.parse(readFileSync(this._paths.checkedPath(this._controlRoot + '/manifest.json'), 'utf8'))
		);
		if (manifest.schema !== 'local-sun-physical-controls-run-v1' || manifest.state !== 'passed')
			throw new Error('Passed independent physical control run required.');
		for (let artifact of manifest.artifacts)
			if (this._paths.hash(this._controlRoot + '/' + artifact.path) !== artifact.sha256)
				throw new Error('Immutable physical artifact changed.');
		let result = /** @type {LocalSunPhysicalControls} */ (
			JSON.parse(readFileSync(this._paths.checkedPath(this._controlRoot + '/controls.json'), 'utf8'))
		);
		let historicalIdentities = {
			'local-sun-j1': 'ffaf491fa264b22269bbde0e8588d26910a2ad76ef0c268259bf416870bd351b',
			'local-sun-l1': '2fcfb13f471457293bb6abbe1e4ccbd809dd26d252a61b3255473c35dd807968',
			'local-sun-j2': '9e9276c626aa78eb510beda272b495e23922161b8cc88797f14b7aeb0afe2cc1',
			'local-sun-l2': 'cc9f574bda5cf10d1189d69caff996a40f091b0155492bbc5c880fc590d10f47',
			'local-sun-j3': 'b24f58d6c095525403cd40eb1cc282f74a6cd0615c37fd62bf0dda345cfd722b',
			'local-sun-l3': '3e1952e81f5968b66f31e3366d88c5b866a15e8553dc28d982fb9e5e2edeb58b',
			'local-sun-j4': 'ee5c8cbd0b9a33b9b0e2fc9423a1f0d411b7d998c423dff22fad73fcb23581da',
			cumulative: 'c8d1f0c77fe839a377d5c0ca6a057c52a493601d40351f8fc99b00e17f3ac200',
		};
		if (
			new Set(result.controls.map((field) => field.id)).size !== 8 ||
			result.controls.some((field) => field.observation.sha256 !== historicalIdentities[field.id])
		)
			throw new Error('Physical whole-field identities differ from sealed historical controls.');
		if (
			result.controls.length !== 8 ||
			result.controls.some(
				(field) =>
					field.height !== 1049 ||
					field.layers !== 15 ||
					field.observation.nonfinite !== 0 ||
					field.observation.negativeBeyondAbsolute !== 0,
			)
		)
			throw new Error('Complete valid physical order controls required.');
		return result;
	}

	/** Called by physical qualification to construct a genuine compact profile from P0 inputs with an explicit order.
	 *
	 * @param {SupportedCacheScatteringOrder} maximumScatteringOrder - N1, N2 or N4.
	 * @param {boolean} [zeroSource=false] - Select the analytic black-source physical control.
	 * @returns {LocalSunCompactConstructionProfile} - Bound physical owners and real compact domains.
	 */
	_profile(maximumScatteringOrder, zeroSource = false) {
		let setup = new LocalSunAssemblyProof().createPhysicalDefinition(zeroSource ? 0 : 1);
		let p0 = /** @type {LocalSunP0Fixture} */ (
			JSON.parse(
				readFileSync(
					this._paths.checkedPath(
						'src/algorithm32/implementation/local-sun/cache/fixtures/local-sun-compact-p0-controls.json',
					),
					'utf8',
				),
			)
		);
		return new LocalSunCompactConstructionProfile({
			geometry: setup.geometry,
			atmosphere: setup.atmosphere,
			lightSource: setup.lightSource,
			groundBoundary: null,
			maximumScatteringOrder,
			provenanceIdentity: 'physical-recurrence:P0:74a7cb03',
			topologyControls: {
				coverageRadius: DistanceMath.inMeters(p0.controls.geometry.coverageRadius.value),
				altitudes: p0.controls.rows.map((row) => DistanceMath.inMeters(row.altitude.value)),
				bandRadii: [
					DistanceMath.inMeters(p0.controls.bands[0].innerRadius.value),
					...p0.controls.bands.map((band) => DistanceMath.inMeters(band.outerRadius.value)),
				],
				boundaryExtinctionLengthMultiples: [0.25, 0.5, 1, 2, 4, 8, 16],
			},
		});
	}

	/** Call this method to compare selected real pure/cumulative orders and complete physical construction rays.
	 * The selected reference does not construct full-domain CPU fields.

	 *
	 * @returns {LocalSunRecurrenceReport} - Fixed comparison counts, residuals, isolation and measured cost.
	 * @throws {Error} - Physical comparison, support, isolation, order or resource gate fails.
	 */
	verify() {
		let started = performance.now(),
			freeBefore = os.freemem();
		if (freeBefore < 4 * 1024 ** 3) throw new Error('Four GiB free memory required.');
		let controls = this._readControls();
		/** Locate one independently generated physical pure or cumulative field.
		 *
		 * @param {string} id - Frozen logical field identity.
		 * @returns {LocalSunPhysicalControlField} - Complete selected field input.
		 */
		let fieldById = (id) => {
			let value = controls.controls.find((field) => field.id === id);
			if (!value) throw new Error('Missing physical field ' + id);
			return value;
		};
		let positions = [0, 400],
			directions = [364, 1093, 1822, 2551, 3280, 4009];
		let pureComparisons = 0,
			cumulativeComparisons = 0,
			rayComparisons = 0,
			maximumJError = 0,
			maximumLError = 0;
		let profile = this._profile(4),
			assembly = LocalSunCompactCpuAssembly.fromCompactProfile(profile);
		/** Supply genuine preceding physical L values to the actual full-measure production kernel.
		 *
		 * @param {LocalSunCompactOrderedIncomingRadianceAddress} address - Real full-domain coordinates.
		 * @returns {SpectralPacket} - Immutable physical radiance packet.
		 */
		let sampleIncomingRadiance = ({positionIndex, directionIndex, radianceOrder}) => {
			let field = fieldById('local-sun-l' + radianceOrder),
				sample = field.selected.find((value) => value.positionIndex === positionIndex);
			if (!sample || !Number.isSafeInteger(directionIndex) || directionIndex < 0 || directionIndex >= 1920)
				throw new Error('Unallocated independent incoming sample');
			return new SpectralPacket({
				basis: profile.spectral.basis,
				quantity: SPECTRAL_QUANTITIES.RADIANCE_DENSITY,
				units: SPECTRAL_UNITS.RADIANCE_DENSITY,
				values: sample.values[directionIndex],
				provenanceIdentity: 'immutable-physical-controls:' + field.id,
			});
		};
		/** @type {SupportedCacheScatteringOrder[]} */
		let orders = [1, 2, 4];
		for (let maximum of orders) {
			let selected = LocalSunCompactCpuAssembly.fromCompactProfile(
				maximum === 4 ? profile : this._profile(maximum),
			).buildSelectedOrders({
				positionIndices: positions,
				outgoingDirectionIndices: directions,
				provenanceIdentity: 'frozen-physical-L1-L3',
				sampleIncomingRadiance,
			});
			if (selected.maximumScatteringOrder !== maximum || selected.pureFields.length !== maximum)
				throw new Error('Requested order silently replaced');
			for (let p = 0; p < positions.length; p++)
				for (let d = 0; d < directions.length; d++)
					for (let c = 0; c < 15; c++) {
						let address = {positionIndex: p, directionIndex: d, wavelengthIndex: c},
							expectedSum = 0;
						for (let order = 1; order <= maximum; order++) {
							let expected = fieldById('local-sun-j' + order).selected[p].values[d][c];
							expectedSum += expected;
							maximumJError = Math.max(
								maximumJError,
								this._near(
									selected.pureFields[order - 1].createReader().readScalar(address),
									expected,
									1e-12,
								),
							);
							pureComparisons++;
						}
						let actual = selected.cumulativeField.createReader().readScalar(address);
						maximumJError = Math.max(maximumJError, this._near(actual, expectedSum, 1e-12));
						cumulativeComparisons++;
						if (maximum === 4) this._near(actual, fieldById('cumulative').selected[p].values[d][c], 1e-12);
					}
		}
		// Six predeclared incoming indices cover both hemispheres, horizontal approaches and angular ends.
		let rayIndices = [0, 47, 959, 960, 1872, 1919],
			memoBefore = assembly.primaryMemoUsage.spectra;
		for (let order = 1; order <= 3; order++) {
			let raw = order === 1 ? null : new Map(fieldById('local-sun-j' + order).sparse);
			for (let p = 0; p < positions.length; p++)
				for (let index of rayIndices) {
					let position = profile.models.geometry.resolveCompactLocalSunCacheNodePosition({
						topology: profile.domains.topology,
						positionIndex: positions[p],
					});
					let physicalDirection = profile.models.geometry.expressPhysicalScatteringCacheDirection({
						position,
						cacheDirection: profile.domains.incomingDirections.unitVectors[index],
					});
					let result =
						order === 1
							? assembly.transportDirectRay({position, physicalDirection})
							: assembly.transportScatteringRay({
									position,
									physicalDirection,
									provenanceIdentity: 'frozen-physical-J' + order,
									reader: {
										readScalar: (address) => {
											let offset = profile.domains.scatteringDensityPacking.offset(address);
											if (!raw) throw new Error('Physical field missing');
											let value = raw.get(offset);
											if (value === undefined)
												throw new Error('Unretained independent physical ray support');
											return value;
										},
									},
								});
					let expected = fieldById('local-sun-l' + order).selected[p].values[index];
					for (let c = 0; c < 15; c++) {
						maximumLError = Math.max(
							maximumLError,
							this._near(result.radiance.values[c], expected[c], 1e-9),
						);
						rayComparisons++;
					}
				}
		}
		if (assembly.primaryMemoUsage.spectra !== memoBefore) throw new Error('Continuous direct L1 accessed held J1');
		let zeroProfile = this._profile(4, true),
			zeroAssembly = LocalSunCompactCpuAssembly.fromCompactProfile(zeroProfile);
		let zero = zeroAssembly.buildSelectedOrders({
			positionIndices: positions,
			outgoingDirectionIndices: directions,
			provenanceIdentity: 'analytic-black-source',
			sampleIncomingRadiance: () =>
				new SpectralPacket({
					basis: zeroProfile.spectral.basis,
					quantity: SPECTRAL_QUANTITIES.RADIANCE_DENSITY,
					units: SPECTRAL_UNITS.RADIANCE_DENSITY,
					values: Array(15).fill(0),
					provenanceIdentity: 'analytic-zero-L1-L3',
				}),
		});
		let zeroComparisons = 0;
		for (let field of [...zero.pureFields, zero.cumulativeField])
			for (let p = 0; p < 2; p++)
				for (let d = 0; d < 6; d++)
					for (let c = 0; c < 15; c++) {
						if (
							field
								.createReader()
								.readScalar({positionIndex: p, directionIndex: d, wavelengthIndex: c}) !== 0
						)
							throw new Error('Black-source physical order is nonzero');
						zeroComparisons++;
					}
		return {
			status: 'PASSED',
			pureComparisons,
			cumulativeComparisons,
			rayComparisons,
			maximumJError,
			maximumLError,
			orders,
			directPrimaryMemoReads: 0,
			fullDomainCpuFieldsConstructed: 0,
			zeroComparisons,
			elapsedMilliseconds: performance.now() - started,
			freeBeforeBytes: freeBefore,
			rssAfterBytes: process.memoryUsage().rss,
		};
	}

	/** Call this method to preserve a new immutable numerical proof with complete input and implementation derivation.
	 *
	 * @param {string} directory - New plan-owned run directory.
	 * @returns {LocalSunRecurrenceReport} - Passed fixed controls.
	 * @throws {Error} - Proof, output boundary or existing evidence is invalid.
	 */
	writeComparison(directory) {
		if (!directory.startsWith('tmp/production-local-sun-cache-promotion/runs/'))
			throw new Error('Plan-owned output required');
		let root = this._paths.checkedPath(directory);
		if (existsSync(root)) throw new Error('Immutable output exists');
		let report = this.verify();
		let sources = [
			'scripts/algorithm32/local-sun-cache/recurrence/LocalSunRecurrenceProof.js',
			'scripts/algorithm32/local-sun-cache/assembly/LocalSunAssemblyProof.js',
			'src/algorithm32/implementation/local-sun/cache/LocalSunCompactConstructionProfile.js',
			'src/algorithm32/implementation/local-sun/cache/LocalSunCompactCpuAssembly.js',
			'src/algorithm32/implementation/local-sun/cache/LocalSunCompactTransport.js',
			'src/algorithm32/implementation/local-sun/cache/LocalSunCompactReconstruction.js',
			'src/algorithm32/atmospheric-transport/spectral/SpectralCalculator.js',
			'src/algorithm32/atmospheric-transport/later-order-scattering-density.js',
			'src/algorithm32/atmospheric-transport/ScatteringOrderFieldOperations.js',
		];
		let comparison =
			JSON.stringify(
				{
					schema: 'local-sun-physical-recurrence-comparison-v1',
					report,
					derivation: {
						parents: [
							{
								path: this._controlRoot + '/manifest.json',
								sha256: this._paths.hash(this._controlRoot + '/manifest.json'),
							},
						],
						implementation: sources.map((path) => ({path, sha256: this._paths.hash(path)})),
						operation:
							'Selected common-input physical CPU J1-J4 and cumulative N1/N2/N4; complete continuous-direct L1 and raw physical J2/J3 construction rays against frozen self-contained numerical producer. No full-domain CPU recurrence or production GPU/runtime activation.',
						parameters: {
							positions: [0, 400],
							outgoing: [364, 1093, 1822, 2551, 3280, 4009],
							incomingRays: [0, 47, 959, 960, 1872, 1919],
							absoluteJ: 1e-12,
							absoluteL: 1e-9,
							relative: 0.002,
						},
						tools: {node: process.version},
						command:
							'node scripts/algorithm32/local-sun-cache/recurrence/LocalSunRecurrenceProof.js --out ' +
							directory,
					},
				},
				null,
				'\t',
			) + '\n';
		mkdirSync(root, {recursive: true});
		writeFileSync(root + '/comparison.json', comparison, {flag: 'wx'});
		writeFileSync(
			root + '/manifest.json',
			JSON.stringify(
				{
					schema: 'local-sun-physical-recurrence-run-v1',
					state: 'passed',
					artifacts: [
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
	let proof = new LocalSunRecurrenceProof();
	console.log(JSON.stringify(args.length ? proof.writeComparison(args[1]) : proof.verify(), null, 2));
}
