import {existsSync, mkdirSync, readFileSync, realpathSync, writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {LocalSunDirectionalControls} from './LocalSunDirectionalControls.js';
import {FlatEarthGeometry} from '../../../../src/algorithm32/implementation/flat-earth/FlatEarthGeometry.js';
import {CanonicalAtmosphere} from '../../../../src/algorithm32/implementation/canonical-atmosphere/CanonicalAtmosphere.js';
import {LocalSunLightSource} from '../../../../src/algorithm32/implementation/local-sun/LocalSunLightSource.js';

/** Portable angular-support comparison against independent analytic and preserved spatial controls. */
export class LocalSunDirectionalProof {
	/** Checked offline authority/path owner. */
	_controls = new LocalSunDirectionalControls();

	/** Called to reject an unmet gate.
	 *
	 * @param {boolean} condition - Required result.
	 *
	 * @param {string} message - Failure description.
	 * @returns {void} - No value.
	 * @throws {Error} - A gate fails.
	 */
	_require(condition, message) {
		if (!condition) throw new Error(message);
	}

	/** Called to check finite absolute scalar error in dimensionless interpolation weights.
	 *
	 * @param {number} actual - Candidate weight.
	 *
	 * @param {number} expected - Independent expected weight.
	 *
	 * @param {number} limit - Predeclared allowance.
	 * @returns {number} - Absolute error.
	 */
	_near(actual, expected, limit) {
		let error = Math.abs(actual - expected);
		this._require(
			Number.isFinite(actual) && error <= limit,
			`Directional weight differs: ${actual} versus ${expected}.`,
		);
		return error;
	}

	/** Called to adapt an authenticated metre control to the production unit contract.
	 *
	 * @param {LocalSunP0Distance} value - Frozen metre quantity.
	 * @returns {Distance} - Unit-bearing physical input.
	 */
	_distance(value) {
		return {value: value.value, units: 'meters'};
	}

	/** Call this method to authenticate exact frozen authority before assigning its known serialized type.
	 *
	 * @param {string} [relative] - Optional checked location of the identical authority bytes.
	 * @returns {LocalSunDirectionalFixture} - Authenticated complete angular controls.
	 * @throws {Error} - Authority bytes, schema or producer identity differs, or the checked path is unavailable.
	 */
	readAuthority(relative = this._controls.fixturePath) {
		this._require(
			this._controls.hash(relative) === '3950f22be0b4a43ed1237ecde3cf00219a201a9648bace1306bd6dc2fd6413b1',
			'Directional authority bytes changed.',
		);
		let fixture = /** @type {LocalSunDirectionalFixture} */ (
			JSON.parse(readFileSync(this._controls.checkedPath(relative), 'utf8'))
		);
		this._require(
			fixture.schema === 'local-sun-directional-controls-v1' &&
				fixture.cases.length === 65 &&
				this._controls.hash(fixture.derivation.producer.path) === fixture.derivation.producer.sha256,
			'Directional authority compatibility differs.',
		);
		return fixture;
	}

	/** Called by comparisons to canonicalize duplicate seam addresses using independent cube-face coordinates.
	 *
	 * @param {number} index - W27 logical address.
	 * @returns {string} - Exact unnormalized cube lattice key, independent of production domain data.
	 */
	_key(index) {
		let face = Math.floor(index / 729),
			local = index % 729;
		let u = 2 * (local % 27) - 26,
			v = 2 * Math.floor(local / 27) - 26;
		return [
			[26, u, v],
			[-26, -u, v],
			[-u, 26, v],
			[u, -26, v],
			[u, v, 26],
			[-u, v, -26],
		][face].join(',');
	}

	/** Called to compare physical W27 support, retaining equivalent seam aliases rather than requiring one face address.
	 *
	 * @param {ScatteringCacheDirectionStencil} actual - Candidate positive angular support.
	 *
	 * @param {ScatteringCacheDirectionStencil} expected - Frozen analytic support.
	 *
	 * @param {number} limit - Predeclared weight error allowance.
	 * @returns {number} - Maximum error.
	 */
	_compare(actual, expected, limit) {
		this._require(
			actual.indices.length >= 1 &&
				actual.indices.length <= 4 &&
				actual.indices.length === actual.weights.length &&
				actual.weights.every((w) => w > 0 && Number.isFinite(w)) &&
				actual.indices.every((i) => Number.isSafeInteger(i) && i >= 0 && i < 4374),
			'Invalid complete angular support.',
		);
		let gold = new Map(expected.indices.map((i, j) => [this._key(i), expected.weights[j]]));
		let maximum = 0;
		for (let [j, i] of actual.indices.entries()) {
			let key = this._key(i);
			this._require(gold.has(key), 'Angular support address differs.');
			maximum = Math.max(maximum, this._near(actual.weights[j], gold.get(key) ?? NaN, limit));
			gold.delete(key);
		}
		this._require(gold.size === 0, 'Missing angular support.');
		this._near(
			actual.weights.reduce((a, b) => a + b, 0),
			1,
			limit,
		);
		return maximum;
	}

	/** Call this method to compare all physical nodes, mixed/cross-row controls, axis limits and exact W27 reconstruction.
	 * Geometry owns physical transforms; no generated implementation or experiment code is imported.
	 * Synthetic continuity checks qualify interpolation only, not physical field accuracy or density restoration.
	 *
	 * @returns {LocalSunDirectionalReport} - Selected capability result and measured residuals.
	 * @throws {Error} - Authentication, independent support comparison or any declared proof gate fails.
	 */
	verify() {
		let fixture = this.readAuthority();
		let spatialPath = 'src/algorithm32/implementation/local-sun/cache/fixtures/local-sun-compact-p0-controls.json';
		this._require(
			this._controls.hash(spatialPath) === '74a7cb03fd646d6ec4754e45e46f7ed622c815d09cd82ceeef174819c3513db6',
			'Spatial authority changed.',
		);
		let spatial = /** @type {LocalSunP0Fixture} */ (
			JSON.parse(readFileSync(this._controls.checkedPath(spatialPath), 'utf8'))
		).controls;
		let geometry = new FlatEarthGeometry({
			topAltitude: this._distance(spatial.geometry.atmosphereTop),
			localLightSourceHeight: this._distance(spatial.geometry.sourceHeight),
			projectionRadius: {value: 6360000, units: 'meters'},
		});
		let source = new LocalSunLightSource({
			sourceKey: 'compact-directional-proof',
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
			altitudes: spatial.rows.map((r) => this._distance(r.altitude)),
			bandRadii: [
				this._distance(spatial.bands[0].innerRadius),
				...spatial.bands.map((b) => this._distance(b.outerRadius)),
			],
			boundaryExtinction: spatial.rows.map((r) => ({
				value: Math.max(
					...atmosphere.sampleMedium(
						geometry.resolveAtmosphereCoordinate({coordinates: [0, 0, r.altitude.value], units: 'meters'}),
					).extinction.values,
				),
				units: 'm^-1',
			})),
			boundaryExtinctionLengthMultiples: [0.25, 0.5, 1, 2, 4, 8, 16],
			provenanceIdentity: 'p0:74a7cb03:directional-native15-controls',
		});
		let comparisons = 0,
			maximumSpatialWeightError = 0,
			maximumAngularWeightError = 0,
			mixedQueries = 0;
		let queries = [
			...spatial.nodes.map((n) => ({
				horizontalDistance: n.horizontalDistance,
				altitude: n.altitude,
				admitted: true,
				expectedIndices: [n.index],
				expectedWeights: [1],
			})),
			...spatial.queries.filter((q) => q.admitted),
		];
		for (let [queryIndex, query] of queries.entries())
			for (let control of fixture.cases) {
				// Every node uses all 13 canonical-frame directions; selected queries additionally use all five frames.
				if (queryIndex < spatial.nodes.length && control.angle !== 0) continue;
				let rho = query.horizontalDistance.value;
				// Exact cylinder controls retain their representable canonical position; rotating binary64 components
				// can place their hypot a few ulps outside support, which must remain a rejection rather than a clamp.
				if (rho === spatial.geometry.coverageRadius.value && control.angle !== 0) continue;
				let position = /** @type {Position} */ ({
					coordinates: [rho * Math.cos(control.angle), rho * Math.sin(control.angle), query.altitude.value],
					units: /** @type {const} */ ('meters'),
				});
				let taps = geometry.resolveCompactLocalSunCacheStencil({
					topology,
					position,
					physicalOutgoingDirection: control.direction,
				});
				if (queryIndex >= spatial.nodes.length)
					this._require(
						JSON.stringify(taps.map((t) => t.positionIndex)) === JSON.stringify(query.expectedIndices),
						`Spatial support differs at query ${queryIndex}, angle ${control.angle}.`,
					);
				else
					this._require(
						taps.some(
							(t) =>
								t.positionIndex === query.expectedIndices[0] &&
								Math.abs(t.positionWeight - 1) <= fixture.limits.exactNodeAbsolute,
						),
						'Exact spatial node weight differs.',
					);
				let axisCount = 0,
					productSum = 0;
				for (let [i, tap] of taps.entries()) {
					let isAxis = spatial.nodes[tap.positionIndex].horizontalDistance.value === 0;
					if (isAxis) axisCount++;
					let gold = isAxis ? control.axis : control.normal;
					maximumSpatialWeightError = Math.max(
						maximumSpatialWeightError,
						this._near(
							tap.positionWeight,
							queryIndex < spatial.nodes.length
								? tap.positionIndex === query.expectedIndices[0]
									? 1
									: 0
								: query.expectedWeights[i],
							fixture.limits.exactNodeAbsolute,
						),
					);
					maximumAngularWeightError = Math.max(
						maximumAngularWeightError,
						this._compare(tap.directionStencil, gold, fixture.limits.weightAbsolute),
					);
					for (let weight of tap.directionStencil.weights) productSum += tap.positionWeight * weight;
				}
				this._near(productSum, 1, fixture.limits.weightSumAbsolute);
				if (axisCount > 0 && axisCount < taps.length) mixedQueries++;
				comparisons++;
			}
		this._require(mixedQueries > 0, 'Mixed axis and ordinary tap controls were absent.');
		let exactAngularNodes = 0;
		let ordinaryNode = spatial.nodes.find((n) => n.horizontalDistance.value > 0);
		this._require(ordinaryNode !== undefined, 'Ordinary node absent.');
		for (let index = 0; index < 4374; index++) {
			let vector = this._key(index).split(',').map(Number),
				norm = Math.hypot(...vector);
			let direction = /** @type {UnitVector3} */ ([vector[0] / norm, vector[1] / norm, vector[2] / norm]);
			let taps = geometry.resolveCompactLocalSunCacheStencil({
				topology,
				position: {
					coordinates: [
						ordinaryNode?.horizontalDistance.value ?? NaN,
						0,
						ordinaryNode?.altitude.value ?? NaN,
					],
					units: 'meters',
				},
				physicalOutgoingDirection: direction,
			});
			let ownTap = taps.find((tap) => tap.positionIndex === ordinaryNode?.index);
			this._require(
				ownTap !== undefined && ownTap.directionStencil.indices.length === 1,
				'Exact angular node did not reconstruct exactly.',
			);
			if (ownTap === undefined) throw new Error('Exact spatial tap absent.');
			this._near(ownTap.positionWeight, 1, fixture.limits.exactNodeAbsolute);
			this._compare(ownTap.directionStencil, {indices: [index], weights: [1]}, fixture.limits.exactNodeAbsolute);
			exactAngularNodes++;
		}
		let maximumContinuityDifference = 0;
		for (let control of fixture.cases) {
			let taps = geometry.resolveCompactLocalSunCacheStencil({
				topology,
				position: {
					coordinates: [0.001 * Math.cos(control.angle), 0.001 * Math.sin(control.angle), 50000],
					units: 'meters',
				},
				physicalOutgoingDirection: control.direction,
			});
			// Bounded arbitrary synthetic data at ordinary taps and fixed axis value test the vanishing fan contribution.
			let value = taps.reduce(
				(sum, tap) =>
					sum +
					tap.positionWeight *
						(topology.positionAt(tap.positionIndex).horizontalDistance.value === 0 ? 1 : -1),
				0,
			);
			maximumContinuityDifference = Math.max(
				maximumContinuityDifference,
				this._near(value, 1, fixture.limits.continuityAbsolute),
			);
		}
		let rejected = 0;
		for (let position of /** @type {readonly UnitVector3[]} */ ([
			[spatial.geometry.coverageRadius.value + 1, 0, 0],
			[0, 0, -1],
			[0, 0, spatial.geometry.atmosphereTop.value + 1],
		])) {
			try {
				geometry.resolveCompactLocalSunCacheStencil({
					topology,
					position: {coordinates: position, units: 'meters'},
					physicalOutgoingDirection: [1, 0, 0],
				});
			} catch (error) {
				if (!(error instanceof RangeError)) throw error;
				rejected++;
			}
		}
		try {
			geometry.resolveCompactLocalSunCacheStencil({
				topology,
				position: {coordinates: [0, 0, 0], units: 'meters'},
				physicalOutgoingDirection: [0, 0, 0],
			});
		} catch (error) {
			if (!(error instanceof RangeError)) throw error;
			rejected++;
		}
		/** Substitutable public topology with equivalent kilometre pairing facts; no concrete class identity.
		 * @type {FlatCompactTopology} */
		let structural = {
			...topology,
			positionCount: topology.positionCount,
			sourceHeight: {value: topology.sourceHeight.value / 1000, units: 'kilometers'},
			atmosphereTop: {value: topology.atmosphereTop.value / 1000, units: 'kilometers'},
			positionAt: (index) => topology.positionAt(index),
			resolvePositionStencil: (query) => topology.resolvePositionStencil(query),
		};
		let structuralTaps = geometry.resolveCompactLocalSunCacheStencil({
			topology: structural,
			position: {coordinates: [0, 0, 0], units: 'meters'},
			physicalOutgoingDirection: [0, 1, 0],
		});
		this._require(
			structuralTaps.length === 1 &&
				structuralTaps[0].positionIndex === 0 &&
				structuralTaps[0].positionWeight === 1,
			'Substitutable topology rejected.',
		);
		this._compare(structuralTaps[0].directionStencil, fixture.cases[2].axis, fixture.limits.weightAbsolute);
		try {
			geometry.resolveCompactLocalSunCacheStencil({
				topology: {...structural, sourceHeight: {value: topology.sourceHeight.value + 1, units: 'meters'}},
				position: {coordinates: [0, 0, 0], units: 'meters'},
				physicalOutgoingDirection: [1, 0, 0],
			});
		} catch (error) {
			if (!(error instanceof RangeError)) throw error;
			rejected++;
		}
		this._require(rejected === 5, 'Unsupported physical query or topology pairing admitted.');
		return {
			status: 'PASSED',
			spatialNodes: spatial.nodes.length,
			angularControls: fixture.cases.length,
			comparisons,
			mixedQueries,
			exactAngularNodes,
			maximumSpatialWeightError,
			maximumAngularWeightError,
			maximumContinuityDifference,
			rejected,
			fieldsQualified: false,
			substitutableTopology: true,
		};
	}

	/** Call this method to preserve a new plan-owned immutable comparison with full input/tool/source derivation.
	 *
	 * @param {string} directory - New normalized ignored run directory.
	 * @returns {LocalSunDirectionalReport} - Saved selected capability result.
	 * @throws {Error} - Destination exists, is unsupported, or comparison fails.
	 */
	writeComparison(directory) {
		this._require(
			directory.startsWith('tmp/production-local-sun-cache-promotion/runs/'),
			'Plan-owned output required.',
		);
		let destination = this._controls.checkedPath(directory);
		this._require(!existsSync(destination), 'Immutable comparison already exists.');
		let report = this.verify(),
			fixture = this.readAuthority();
		let sourcePaths = [
			'scripts/algorithm32/local-sun-cache/directional/LocalSunDirectionalProof.js',
			'scripts/algorithm32/local-sun-cache/directional/LocalSunDirectionalControls.js',
			'src/algorithm32/implementation/flat-earth/FlatEarthGeometry.js',
			'src/algorithm32/implementation/flat-earth/FlatScatteringCacheGeometry.js',
			'src/algorithm32/implementation/flat-earth/CompactLocalCacheTopology.js',
			'src/algorithm32/sampling-domains/direction/cubed-sphere/CubedSphereDirectionDomain.js',
		];
		let sources = sourcePaths.map((p) => ({path: p, sha256: this._controls.hash(p)}));
		let result = `${JSON.stringify({schema: 'local-sun-directional-comparison-v1', report, derivation: {parents: [{artifact: 'authority.json', sha256: this._controls.hash(this._controls.fixturePath)}, fixture.derivation.parents.at(-1)], operation: 'Geometry facade resolves complete compact support, selecting ordinary query-frame or canonical-meridian W27 independently at each spatial tap. Compare with frozen analytic angular gold and independent P0 spatial gold, exact W27 nodes and positive joint weight sums. Near-axis bounded synthetic fan continuity only; no physical fields, density restoration, transport, GPU or default activation.', implementation: sources, configuration: {sourceHeightMeters: 4828032, topMeters: 100000, coverageMeters: 33378000, outgoing: 'W27', limits: fixture.limits}, tools: {node: process.version}, command: `node scripts/algorithm32/local-sun-cache/directional/LocalSunDirectionalProof.js --out ${directory}`}}, null, '\t')}\n`;
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
					schema: 'local-sun-directional-run-v1',
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
	let proof = new LocalSunDirectionalProof();
	console.log(JSON.stringify(args.length ? proof.writeComparison(args[1]) : proof.verify(), null, 2));
}
