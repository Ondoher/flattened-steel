import {existsSync, mkdirSync, readFileSync, realpathSync, writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {LocalSunIncomingControls} from './LocalSunIncomingControls.js';
import {FlatHorizonPartitionedDirectionDomain} from '../../../../src/algorithm32/sampling-domains/index.js';

/** Portable selected incoming-domain comparison against authenticated historical vector/weight controls. */
export class LocalSunIncomingQuadratureProof {
	/** Offline authority/path owner, without production numerical imports. */
	_controls = new LocalSunIncomingControls();

	/** Called by proof gates to reject an unmet selected capability condition.
	 *
	 * @param {boolean} condition - Required comparison result.
	 * @param {string} message - Failed condition.
	 * @returns {void} - No value.
	 * @throws {Error} - The condition fails.
	 */
	_require(condition, message) {
		if (!condition) throw new Error(message);
	}

	/** Called by binary64 comparisons to apply limits fixed before candidate scoring.
	 *
	 * @param {number} actual - Executable candidate scalar.
	 * @param {number} expected - Independent historical or analytic scalar, in identical units.
	 * @param {number} tolerance - Absolute allowance in the scalar's units.
	 * @returns {number} - Observed absolute error.
	 * @throws {Error} - A nonfinite scalar or excessive error is observed.
	 */
	_near(actual, expected, tolerance) {
		let error = Math.abs(actual - expected);
		this._require(Number.isFinite(actual) && error <= tolerance, 'Incoming quadrature comparison failed.');
		return error;
	}

	/** Call this method to authenticate the complete predeclared fixture before typed use.
	 * Portable comparison reads no historical generated tree; original provenance is retained inside the fixture.
	 *
	 * @param {string} [relative] - Checked read-only authority path; exact frozen bytes remain mandatory at any location.
	 * @returns {LocalSunIncomingQuadratureFixture} - Exact accepted fixture with known complete structure.
	 * @throws {Error} - Fixture identity, schema, units or producer identity differs.
	 */
	readAuthority(relative = this._controls.fixturePath) {
		this._require(
			this._controls.hash(relative) === 'c7a90b1462678980f64dbc46627327d3e3a2281941937391cafb2efb740f1579',
			'Predeclared incoming authority bytes changed.',
		);
		// Exact asset identity is checked before this known complete serialized structure is given its contract.
		let fixture = /** @type {LocalSunIncomingQuadratureFixture} */ (
			JSON.parse(readFileSync(this._controls.checkedPath(relative), 'utf8'))
		);
		this._require(
			fixture.schema === 'local-sun-incoming-quadrature-controls-v1' &&
				fixture.weightUnits === 'steradians' &&
				fixture.samples.length === 1920 &&
				fixture.derivation.producer.sha256 === this._controls.hash(fixture.derivation.producer.path),
			'Incoming authority compatibility differs.',
		);
		return fixture;
	}

	/** Call this method to compare every selected vector/weight and independent full-sphere/band moments.
	 * This tests immutable geometry-specific incoming measure and the public sampling-domain export. It does not
	 * select a runtime profile, transform per-node directions, evaluate scattering fields or qualify GPU output.
	 * The historical authority and analytic limits were frozen before constructing the production candidate.
	 *
	 * @returns {LocalSunIncomingQuadratureReport} - Successful selected-domain comparison.
	 * @throws {Error} - Any authentication, sample, ordering, conservation or immutability gate fails.
	 */
	verify() {
		let fixture = this.readAuthority();
		let domain = new FlatHorizonPartitionedDirectionDomain();
		this._require(
			domain.directionCount === fixture.samples.length &&
				domain.unitVectors.length === domain.directionCount &&
				domain.integrationWeights.values.length === domain.directionCount,
			'Incoming domain dimensions differ.',
		);
		this._require(
			domain.integrationWeights.units === fixture.weightUnits &&
				domain.coordinateMeaning === fixture.coordinateMeaning &&
				domain.azimuthCount === fixture.azimuthCount &&
				domain.azimuthOffset === fixture.azimuthOffset &&
				JSON.stringify(domain.polarBandEdges) === JSON.stringify(fixture.edges) &&
				JSON.stringify(domain.polarBandCounts) === JSON.stringify(fixture.polarCounts),
			'Selected local incoming policy differs.',
		);
		let maximumDirectionError = 0;
		let maximumWeightError = 0;
		let mass = 0;
		let upperMass = 0;
		let firstMoments = [0, 0, 0];
		let secondMoments = [0, 0, 0];
		for (let [index, expected] of fixture.samples.entries()) {
			let vector = domain.unitVectors[index];
			let weight = domain.integrationWeights.values[index];
			this._require(
				weight > 0 && vector[2] !== 0 && Math.abs(vector[2]) < 1,
				'Invalid horizon/pole or positive measure support.',
			);
			for (let component = 0; component < 3; component++) {
				maximumDirectionError = Math.max(
					maximumDirectionError,
					this._near(vector[component], expected.direction[component], fixture.limits.directionAbsolute),
				);
				firstMoments[component] += weight * vector[component];
				secondMoments[component] += weight * vector[component] ** 2;
			}
			maximumWeightError = Math.max(
				maximumWeightError,
				this._near(weight, expected.weight, fixture.limits.weightAbsolute),
			);
			this._near(Math.hypot(...vector), 1, fixture.limits.directionAbsolute);
			mass += weight;
			if (vector[2] > 0) upperMass += weight;
		}
		this._near(mass, 4 * Math.PI, fixture.limits.massAbsolute);
		this._near(upperMass, 2 * Math.PI, fixture.limits.massAbsolute);
		this._near(mass - upperMass, 2 * Math.PI, fixture.limits.massAbsolute);
		for (let component = 0; component < 3; component++) {
			this._near(firstMoments[component], 0, fixture.limits.momentAbsolute);
			this._near(secondMoments[component], (4 * Math.PI) / 3, fixture.limits.momentAbsolute);
		}
		let offset = 0;
		let bandMoments = 0;
		for (let [band, count] of fixture.polarCounts.entries()) {
			let lower = fixture.edges[band];
			let upper = fixture.edges[band + 1];
			for (let local = 0; local < count * fixture.azimuthCount; local++) {
				let mu = domain.unitVectors[offset + local][2];
				this._require(mu > lower && mu < upper, 'Incoming sample lies outside its ordered polar band.');
			}
			// n-point Gaussian measure integrates band polynomials through degree 2n-1.
			for (let degree = 0; degree < 2 * count; degree++) {
				let moment = 0;
				for (let local = 0; local < count * fixture.azimuthCount; local++)
					moment +=
						domain.integrationWeights.values[offset + local] *
						domain.unitVectors[offset + local][2] ** degree;
				let expected = (2 * Math.PI * (upper ** (degree + 1) - lower ** (degree + 1))) / (degree + 1);
				this._near(moment, expected, fixture.limits.momentAbsolute);
				bandMoments++;
			}
			offset += count * fixture.azimuthCount;
		}
		this._require(
			offset === domain.directionCount &&
				Object.isFrozen(domain) &&
				Object.isFrozen(domain.unitVectors) &&
				domain.unitVectors.every(Object.isFrozen) &&
				Object.isFrozen(domain.integrationWeights.values) &&
				Object.isFrozen(domain.polarBandEdges) &&
				Object.isFrozen(domain.polarBandCounts),
			'Selected incoming domain is not complete immutable data.',
		);
		this._require(
			Reflect.set(domain.unitVectors[0], 0, 2) === false &&
				Reflect.set(domain.integrationWeights.values, 0, -1) === false,
			'A caller mutated the selected incoming measure.',
		);
		return {
			status: 'PASSED',
			domainId: domain.id,
			authoritySha256: this._controls.hash(this._controls.fixturePath),
			directions: domain.directionCount,
			solidAngle: mass,
			maximumDirectionError,
			maximumWeightError,
			bandMoments,
			fieldsQualified: false,
		};
	}

	/** Call this method to preserve a new immutable production comparison without reopening prior evidence.
	 * Existing destinations reject before proof execution. Failed partial writes remain inspectable without a passed
	 * manifest. Copied authority retains complete historical derivation; all current producer identities accompany output.
	 *
	 * @param {string} directory - New normalized plan-owned ignored run directory.
	 * @returns {LocalSunIncomingQuadratureReport} - Successful comparison saved in that new run.
	 * @throws {Error} - Destination support/identity, proof or output writing fails.
	 */
	writeComparison(directory) {
		this._require(
			directory.startsWith('tmp/production-local-sun-cache-promotion/runs/'),
			'Plan-owned incoming comparison output required.',
		);
		let destination = this._controls.checkedPath(directory);
		this._require(!existsSync(destination), 'Comparison run already exists and is immutable.');
		let report = this.verify();
		let fixture = this.readAuthority();
		let sourcePaths = [
			'scripts/algorithm32/local-sun-cache/incoming-quadrature/LocalSunIncomingControls.js',
			'scripts/algorithm32/local-sun-cache/incoming-quadrature/LocalSunIncomingQuadratureProof.js',
			'src/algorithm32/sampling-domains/direction/horizon-partitioned/FlatHorizonPartitionedDirectionDomain.js',
			'src/algorithm32/sampling-domains/index.js',
		];
		let result = `${JSON.stringify({schema: 'local-sun-incoming-quadrature-comparison-v1', report, derivation: {parent: {artifact: 'authority.json', sha256: report.authoritySha256}, operation: 'Construct selected fixed incoming measure through the public production sampling-domain export; compare every ordered unit vector and positive steradian weight with immutable historical controls; independently check horizon bands, full/half-sphere measure, first/second moments, 80 exact Gaussian band moments and immutable publication. No fields, per-node transforms, transport, GPU or profile/default activation.', implementation: sourcePaths.map((relative) => ({path: relative, sha256: this._controls.hash(relative)})), configuration: {policy: fixture.policy, coordinateMeaning: fixture.coordinateMeaning, edges: fixture.edges, polarCounts: fixture.polarCounts, azimuthCount: fixture.azimuthCount, azimuthOffset: fixture.azimuthOffset, limits: fixture.limits}, tools: {node: process.version}, command: `node scripts/algorithm32/local-sun-cache/incoming-quadrature/LocalSunIncomingQuadratureProof.js --out ${directory}`}}, null, '\t')}\n`;
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
					schema: 'local-sun-incoming-quadrature-comparison-run-v1',
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
	let args = process.argv.slice(2);
	if (!(args.length === 0 || (args.length === 2 && args[0] === '--out')))
		throw new Error('Use no arguments or --out <new-plan-run-directory>.');
	let proof = new LocalSunIncomingQuadratureProof();
	console.log(JSON.stringify(args.length ? proof.writeComparison(args[1]) : proof.verify(), null, 2));
}
