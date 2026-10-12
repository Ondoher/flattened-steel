import {existsSync, lstatSync, mkdirSync, readFileSync, realpathSync, writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {LocalSunP0Controls} from '../LocalSunP0Controls.js';
import {FlatEarthGeometry} from '../../../../src/algorithm32/implementation/flat-earth/FlatEarthGeometry.js';
import {CanonicalAtmosphere} from '../../../../src/algorithm32/implementation/canonical-atmosphere/CanonicalAtmosphere.js';
import {LocalSunShellFactCache} from '../../../../src/algorithm32/implementation/local-sun/cache/LocalSunShellFactCache.js';
import {LocalSunLightSource} from '../../../../src/algorithm32/implementation/local-sun/LocalSunLightSource.js';
import LocalSunFieldPacking from '../../../../src/algorithm32/implementation/local-sun/cache/LocalSunFieldPacking.js';

/** Independent P0-output comparison for production compact topology and source-distance partitions. */
export class LocalSunCompactDomainProof {
	/** Maintained-script repository identity, independent of working directory. @type {string} */
	_root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../../..');

	/** Called by the proof to reject an unmet capability gate.
	 *
	 * @param {boolean} condition - Required comparison result.
	 * @param {string} message - Specific failed comparison.
	 * @returns {void} - No value.
	 * @throws {Error} - The independent comparison fails.
	 */
	_require(condition, message) {
		if (!condition) throw new Error(message);
	}

	/** Called by fixture ingress to reject path traversal and linked evidence/control roots.
	 *
	 * @param {string} relativePath - Exact repository-relative fixture path.
	 * @returns {string} - Checked absolute path.
	 * @throws {Error} - A path escapes repository identity or crosses a link.
	 */
	_path(relativePath) {
		this._require(realpathSync(this._root) === this._root, 'Linked repository rejected.');
		let segments = relativePath.split('/');
		this._require(
			!path.isAbsolute(relativePath) &&
				!relativePath.includes('\\') &&
				segments.every((segment) => segment && segment !== '.' && segment !== '..'),
			'Normalized fixture path required.',
		);
		let target = this._root;
		for (let segment of segments) {
			target = path.join(target, segment);
			if (existsSync(target)) this._require(!lstatSync(target).isSymbolicLink(), 'Linked fixture path rejected.');
		}
		return target;
	}

	/** Called by comparison assembly to express an authenticated P0 length in the production contract.
	 *
	 * @param {LocalSunP0Distance} distance - Already verified independent metre quantity.
	 * @returns {Distance} - Accepted unit-bearing input without expected-node data.
	 */
	_distance(distance) {
		return {value: distance.value, units: 'meters'};
	}

	/** Called by independent comparisons to enforce the original declared length bound.
	 *
	 * @param {number} actual - Production metre value.
	 * @param {number} expected - P0 independent metre value.
	 * @returns {void} - No value.
	 * @throws {Error} - The absolute error exceeds 1e-7 metres.
	 */
	_near(actual, expected) {
		this._require(
			Number.isFinite(actual) && Math.abs(actual - expected) <= 1e-7,
			`Length comparison failed: ${actual} versus ${expected}.`,
		);
	}

	/** Called by negative admission proofs to require explicit observable support rejection.
	 *
	 * @param {() => unknown} operation - Public geometry/source lookup.
	 * @returns {void} - No value.
	 * @throws {Error} - The operation admits a rejected input or throws an unexpected failure.
	 */
	_rejects(operation) {
		let rejected = false;
		try {
			operation();
		} catch (error) {
			if (!(error instanceof RangeError)) throw error;
			rejected = true;
		}
		this._require(rejected, 'Unsupported input was admitted.');
	}

	/** Call this method to compare production topology and amplitude bounds against the predeclared independent controls.
	 * Expected nodes/weights are never supplied to production construction. Band endpoints and altitude controls
	 * are explicit configuration; canonical-medium extinction supplies row-local refinement. This proof does not
	 * qualify automatic seed-policy derivation, held amplitudes, fields, directional transport or GPU behavior.
	 * The promise rejects if authentication, a required public lookup or any comparison fails; callers must
	 * retain the failure and must not treat the unaccepted CPU capability as an oracle.
	 *
	 * @returns {Promise<LocalSunCompactDomainProofReport>} - Complete first-slice comparison and evidence identities.
	 */
	async verify() {
		let authority = await new LocalSunP0Controls().verify();
		this._require(
			authority.sha256 === '74a7cb03fd646d6ec4754e45e46f7ed622c815d09cd82ceeef174819c3513db6',
			'Independent P0 authority bytes changed.',
		);
		// The existing ingress owner validates the complete structure and the predeclared byte identity above authenticates it.
		let fixture = /** @type {LocalSunP0Fixture} */ (
			JSON.parse(readFileSync(this._path(authority.fixture), 'utf8'))
		);
		let controls = fixture.controls;
		let geometry = new FlatEarthGeometry({
			topAltitude: this._distance(controls.geometry.atmosphereTop),
			localLightSourceHeight: this._distance(controls.geometry.sourceHeight),
			projectionRadius: {value: 6360000, units: 'meters'},
		});
		let lightSource = new LocalSunLightSource({
			sourceKey: 'compact-p1-proof-source',
			referenceDistance: {value: 4800000, units: 'meters'},
			referenceSpectralIncidentScale: 1,
			radius: {value: 25749.504, units: 'meters'},
			distanceFalloff: true,
		});
		geometry.configureLightSource({
			lightSource,
			observation: {
				instant: '2024-12-14T17:27:41.487Z',
				location: {latitude: {value: 0, units: 'degrees'}, longitude: {value: 0, units: 'degrees'}},
			},
			placement: {
				kind: 'finite-position',
				position: {coordinates: [0, 0, controls.geometry.sourceHeight.value], units: 'meters'},
			},
		});
		let atmosphere = new CanonicalAtmosphere();
		let boundaryExtinction = controls.rows.map((row) => {
			let coordinate = geometry.resolveAtmosphereCoordinate({
				coordinates: [0, 0, row.altitude.value],
				units: 'meters',
			});
			return {
				value: Math.max(...atmosphere.sampleMedium(coordinate).extinction.values),
				units: /** @type {const} */ ('m^-1'),
			};
		});
		/** Complete executable input controls, excluding expected nodes/weights. @type {FlatCompactTopologyRequest} */
		let topologyRequest = {
			sourceHeight: this._distance(controls.geometry.sourceHeight),
			atmosphereTop: this._distance(controls.geometry.atmosphereTop),
			coverageRadius: this._distance(controls.geometry.coverageRadius),
			altitudes: controls.rows.map((row) => this._distance(row.altitude)),
			bandRadii: [
				this._distance(controls.bands[0].innerRadius),
				...controls.bands.map((band) => this._distance(band.outerRadius)),
			],
			boundaryExtinction,
			boundaryExtinctionLengthMultiples: [0.25, 0.5, 1, 2, 4, 8, 16],
			provenanceIdentity: `p0:${authority.sha256}:canonical-native15-no-ozone-boundary-refinement`,
		};
		let topology = geometry.createCompactLocalSunCacheTopology(topologyRequest);
		this._require(
			topology.positionCount === controls.nodes.length &&
				topology.rows.length === controls.rows.length &&
				topology.bands.length === controls.bands.length,
			'Compact dimensions differ.',
		);
		this._require(
			JSON.stringify(topology.omittedBands) === JSON.stringify(controls.omittedBands),
			'Omission identities differ.',
		);
		for (let [index, band] of topology.bands.entries()) {
			let expected = controls.bands[index];
			this._require(
				band.id === expected.id && band.admitted === expected.admitted,
				'Band/tangent admission differs.',
			);
			this._near(band.innerRadius.value, expected.innerRadius.value);
			this._near(band.outerRadius.value, expected.outerRadius.value);
		}
		for (let [rowIndex, row] of topology.rows.entries()) {
			let expected = controls.rows[rowIndex];
			this._require(
				row.offset === expected.indices[0] && row.count === expected.indices.length,
				'Ragged row addresses differ.',
			);
			this._near(row.altitude.value, expected.altitude.value);
		}
		for (let expected of controls.nodes) {
			let actual = topology.positionAt(expected.index);
			this._require(
				actual.index === expected.index &&
					actual.rowIndex === expected.rowIndex &&
					actual.bandId === expected.bandId,
				'Physical/compact node address differs.',
			);
			this._near(actual.altitude.value, expected.altitude.value);
			this._near(actual.horizontalDistance.value, expected.horizontalDistance.value);
			this._near(actual.sourceDistance.value, expected.sourceDistance.value);
			this._near(actual.radiusExcess.value, expected.radiusExcess.value);
			let stencil = topology.resolvePositionStencil({
				horizontalDistance: actual.horizontalDistance,
				altitude: actual.altitude,
			});
			let own = stencil.indices.indexOf(actual.index);
			this._require(
				own >= 0 && Math.abs(stencil.weights[own] - 1) <= 1e-10,
				'Exact-node reconstruction differs.',
			);
		}
		let rejectedQueries = 0;
		for (let query of controls.queries) {
			let request = {
				horizontalDistance: this._distance(query.horizontalDistance),
				altitude: this._distance(query.altitude),
			};
			if (!query.admitted) {
				this._rejects(() => topology.resolvePositionStencil(request));
				rejectedQueries++;
				continue;
			}
			let stencil = topology.resolvePositionStencil(request);
			this._require(
				JSON.stringify(stencil.indices) === JSON.stringify(query.expectedIndices),
				'Independent stencil addresses differ.',
			);
			let sum = 0;
			let radiusMoment = 0;
			let altitudeMoment = 0;
			for (let [tap, index] of stencil.indices.entries()) {
				let weight = stencil.weights[tap];
				let node = topology.positionAt(index);
				this._require(
					weight > 0 && Math.abs(weight - query.expectedWeights[tap]) <= 1e-10,
					'Independent positive stencil weight differs.',
				);
				sum += weight;
				radiusMoment += weight * node.sourceDistance.value;
				altitudeMoment += weight * node.altitude.value;
			}
			this._require(Math.abs(sum - 1) <= 1e-12, 'Constant-density conservation differs.');
			this._near(radiusMoment, query.expectedSourceDistance.value);
			this._near(altitudeMoment, query.altitude.value);
		}
		/** Accepted normalized physical source facts; no expected held amplitudes supplied. @type {LocalSunShellFactSourceConfiguration} */
		let sourceConfiguration = {
			position: {coordinates: [0, 0, topology.sourceHeight.value], units: 'meters'},
			referenceDistance: {value: 4800000, units: 'meters'},
			referenceSpectralIncidentScale: 1,
			radius: {value: 25749.504, units: 'meters'},
			distanceFalloff: true,
		};
		let facts = new LocalSunShellFactCache({
			sourceConfiguration,
			sourceDistanceBounds: topology.sourceDistanceBounds,
		});
		let boundaries = facts.boundaries;
		this._require(
			boundaries.length === controls.sourceAmplitude.boundaries.length,
			'Amplitude partition size differs.',
		);
		for (let [index, expected] of controls.sourceAmplitude.boundaries.entries())
			this._near(boundaries[index], expected.value);
		for (let index of [0, 1, 1024, 2047])
			this._require(
				facts.resolveShell(boundaries[index]).shellIndex === index,
				'Amplitude boundary ownership differs.',
			);
		this._require(facts.resolveShell(boundaries.at(-1)).shellIndex === 2047, 'Final amplitude endpoint differs.');
		this._rejects(() => facts.resolveShell(facts.minimumDistance.value - 1));
		this._rejects(() => facts.resolveShell(facts.maximumDistance.value + 1));
		this._rejects(() => topology.positionAt(-1));
		this._rejects(() => topology.positionAt(topology.positionCount));
		let shifted = new LocalSunShellFactCache({
			sourceConfiguration: {
				...sourceConfiguration,
				position: {coordinates: [10000, -25000, topology.sourceHeight.value], units: 'meters'},
			},
			sourceDistanceBounds: topology.sourceDistanceBounds,
		});
		this._require(
			JSON.stringify([...shifted.boundaries]) === JSON.stringify([...boundaries]),
			'Explicit amplitude bounds depend on horizontal placement.',
		);
		let packing = new LocalSunFieldPacking({
			id: 'compact-p1-position-packing-proof',
			directionCount: 4374,
			positionCount: topology.positionCount,
			wavelengthCount: 15,
		});
		let last = packing.coordinatesAt(packing.scalarCount - 1);
		this._require(
			last.positionIndex === topology.positionCount - 1 &&
				last.directionIndex === 4373 &&
				last.wavelengthIndex === 14,
			'Arbitrary-position packing failed.',
		);
		return {
			status: 'PASSED',
			authority: authority.fixture,
			authoritySha256: authority.sha256,
			topologyId: topology.id,
			positions: topology.positionCount,
			rows: topology.rows.length,
			bands: topology.bands.length,
			amplitudeBoundaries: boundaries.length,
			exactNodeQueries: topology.positionCount,
			sentinelQueries: controls.queries.length,
			rejectedQueries,
			heldAmplitudesQualified: false,
			fieldsQualified: false,
			configuration: topologyRequest,
			sourceFacts: sourceConfiguration,
		};
	}

	/** Call this method to preserve a new immutable production comparison with complete input/tool identities.
	 * Existing run directories are rejected. A failed write leaves its new directory for inspection and is never
	 * represented as a terminal successful record. This operation allocates no fields or GPU resources.
	 *
	 * @param {string} directory - New repository-relative directory below the plan-owned ignored runs root.
	 * @returns {Promise<LocalSunCompactDomainProofReport>} - Successful comparison preserved in the new run.
	 */
	async writeComparison(directory) {
		this._require(
			directory.startsWith('tmp/production-local-sun-cache-promotion/runs/'),
			'Plan-owned comparison output required.',
		);
		let destination = this._path(directory);
		this._require(!existsSync(destination), 'Comparison run already exists and is immutable.');
		let report = await this.verify();
		let authority = readFileSync(this._path(report.authority));
		let implementationPaths = [
			'scripts/algorithm32/local-sun-cache/compact-domain/LocalSunCompactDomainProof.js',
			'src/algorithm32/implementation/flat-earth/CompactLocalCacheTopology.js',
			'src/algorithm32/implementation/flat-earth/FlatScatteringCacheGeometry.js',
			'src/algorithm32/implementation/flat-earth/FlatEarthGeometry.js',
			'src/algorithm32/implementation/local-sun/cache/LocalSunShellFactCache.js',
			'src/algorithm32/implementation/local-sun/cache/LocalSunCacheProvider.js',
			'src/algorithm32/implementation/canonical-atmosphere/CanonicalAtmosphere.js',
			'src/algorithm32/implementation/canonical-atmosphere/consts.js',
			'src/algorithm32/profiles/native-15/consts.js',
		];
		let implementation = implementationPaths.map((relativePath) => ({
			path: relativePath,
			sha256: createHash('sha256')
				.update(readFileSync(this._path(relativePath)))
				.digest('hex'),
		}));
		let evidence = {
			schema: 'local-sun-compact-domain-comparison-v1',
			report,
			derivation: {
				parent: {artifact: 'authority.json', sha256: report.authoritySha256},
				operation:
					'Construct compact physical positions and positive stencils from explicit band/altitude controls and canonical-medium extinction refinement; compare every position/row/band, exact-node lookup, independent sentinels and analytic source-distance partitions. No held-amplitude, field, angular, GPU or reuse acceptance.',
				implementation,
				tools: {node: process.version},
				command: `node scripts/algorithm32/local-sun-cache/compact-domain/LocalSunCompactDomainProof.js --out ${directory}`,
			},
		};
		mkdirSync(path.dirname(destination), {recursive: true});
		mkdirSync(destination);
		writeFileSync(path.join(destination, 'authority.json'), authority, {flag: 'wx'});
		let result = `${JSON.stringify(evidence, null, '\t')}\n`;
		writeFileSync(path.join(destination, 'comparison.json'), result, {flag: 'wx'});
		writeFileSync(
			path.join(destination, 'manifest.json'),
			`${JSON.stringify(
				{
					schema: 'local-sun-compact-domain-comparison-run-v1',
					state: 'passed',
					artifacts: [
						{path: 'authority.json', sha256: report.authoritySha256},
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
	let argumentsList = process.argv.slice(2);
	if (!(argumentsList.length === 0 || (argumentsList.length === 2 && argumentsList[0] === '--out')))
		throw new Error('Use no arguments or --out <new-plan-run-directory>.');
	let proof = new LocalSunCompactDomainProof();
	console.log(
		JSON.stringify(
			await (argumentsList.length ? proof.writeComparison(argumentsList[1]) : proof.verify()),
			null,
			2,
		),
	);
}
