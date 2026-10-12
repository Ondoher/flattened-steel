import {createHash} from 'node:crypto';
import {existsSync, lstatSync, readFileSync, realpathSync, writeFileSync} from 'node:fs';
import path from 'node:path';
import {fileURLToPath, pathToFileURL} from 'node:url';

/** Offline derivation and verification owner for independent compact-cache controls. */
export class LocalSunP0Controls {
	/** Repository identity derived from this maintained script. @type {string} */
	_root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');
	/** Checked fixture destination. @type {string} */
	_fixture = 'src/algorithm32/implementation/local-sun/cache/fixtures/local-sun-compact-p0-controls.json';

	/** Called by control verification to reject an unmet evidence condition.
	 *
	 * @param {boolean} condition - Accepted evidence condition.
	 * @param {string} message - Specific failed obligation.
	 * @returns {void} - No value.
	 * @throws {Error} - An evidence obligation failed.
	 */
	_require(condition, message) {
		if (!condition) throw new Error(message);
	}

	/** Called by the owner to retain exact byte identity.
	 *
	 * @param {string | Uint8Array} value - UTF-8 text or artifact bytes.
	 * @returns {string} - Lowercase SHA-256 digest.
	 */
	_hash(value) {
		return createHash('sha256').update(value).digest('hex');
	}

	/** Called by derivation and verification to retain the selected independent authority.
	 *
	 * @returns {readonly LocalSunP0Parent[]} - Exact original contract, layout and gate identities.
	 */
	_parents() {
		let parentRoot = 'tmp/experiments/local-sun-cache-reuse/runs/00478-p3-contract/';
		return [
			{
				path: `${parentRoot}contract.json`,
				sha256: '186b8be60929276c1208dbd72d2c648a3782cd4346c59f4a0c74efcc9826a704',
				schema: 'local-sun-p3-defensibility-contract-v1',
			},
			{
				path: `${parentRoot}layout.json`,
				sha256: 'd1c7dea2b0587474de5930d75e8e91e9fb61d20ed92faefce2ab7a239a290864',
				schema: 'local-sun-shell-layout-v9',
			},
			{
				path: `${parentRoot}gates.json`,
				sha256: 'c5794fb707b7da7c87713e19ebaf77ae7e3816d6cc72e929958e12a4aa33210d',
				schema: 'local-sun-current-correctness-gates-v1',
			},
		];
	}

	/** Called at serialized ingress before reading object fields.
	 *
	 * @param {unknown} value - Untrusted decoded value.
	 * @returns {LocalSunP0SerializedObject} - Checked non-array object; its fields remain untrusted.
	 * @throws {Error} - An object is missing or malformed.
	 */
	_record(value) {
		this._require(typeof value === 'object' && value !== null && !Array.isArray(value), 'Fixture object required.');
		return /** @type {LocalSunP0SerializedObject} */ (value);
	}

	/** Called at serialized ingress before iterating array entries.
	 *
	 * @param {unknown} value - Untrusted decoded value.
	 * @returns {readonly unknown[]} - Checked array; entries remain untrusted.
	 * @throws {Error} - An array is missing or malformed.
	 */
	_list(value) {
		this._require(Array.isArray(value), 'Fixture array required.');
		return /** @type {readonly unknown[]} */ (value);
	}

	/** Called by the fixture parser to accept mandatory textual metadata.
	 *
	 * @param {LocalSunP0SerializedObject} record - Checked object with untrusted fields.
	 * @param {readonly string[]} fields - Required field names.
	 * @returns {void} - No value.
	 * @throws {Error} - A mandatory string is absent or empty.
	 */
	_strings(record, fields) {
		this._require(
			fields.every((field) => typeof record[field] === 'string' && record[field].length > 0),
			'Fixture nonempty strings required.',
		);
	}

	/** Called by the fixture parser to accept mandatory finite scalars.
	 *
	 * @param {LocalSunP0SerializedObject} record - Checked object with untrusted fields.
	 * @param {readonly string[]} fields - Required field names.
	 * @returns {void} - No value.
	 * @throws {Error} - A numeric field is absent or nonfinite.
	 */
	_numbers(record, fields) {
		this._require(
			fields.every((field) => typeof record[field] === 'number' && Number.isFinite(record[field])),
			'Fixture finite numbers required.',
		);
	}

	/** Called by the fixture parser to accept one physical quantity before typed use.
	 *
	 * @param {unknown} value - Untrusted distance wrapper.
	 * @returns {void} - No value.
	 * @throws {Error} - Finite metre magnitude or units are missing.
	 */
	_quantity(value) {
		let quantity = this._record(value);
		this._numbers(quantity, ['value']);
		this._require(quantity.units === 'meters', 'Fixture metre units required.');
	}

	/** Called by the fixture parser to accept compact addresses before typed use.
	 *
	 * @param {unknown} value - Untrusted address array.
	 * @returns {void} - No value.
	 * @throws {Error} - An address is not a nonnegative safe integer.
	 */
	_indices(value) {
		this._require(
			this._list(value).every((index) => typeof index === 'number' && Number.isSafeInteger(index) && index >= 0),
			'Fixture nonnegative integer addresses required.',
		);
	}

	/** Called by verification to validate the complete serialized boundary before typed identity checks.
	 *
	 * @param {string} text - Untrusted UTF-8 fixture contents.
	 * @returns {LocalSunP0Fixture} - Structurally accepted values; physical/identity acceptance follows separately.
	 * @throws {Error} - JSON, a mandatory field, a quantity or a collection is malformed.
	 */
	_parseFixture(text) {
		let parsed = /** @type {unknown} */ (JSON.parse(text));
		let fixture = this._record(parsed);
		this._strings(fixture, ['schema', 'contentHash']);
		let derivation = this._record(fixture.derivation);
		this._strings(derivation, [
			'parentProvenancePath',
			'parentProvenanceHash',
			'parentDerivation',
			'operation',
			'producer',
			'producerSha256',
			'oraclePath',
			'oracleHash',
			'nodeVersion',
			'command',
			'limits',
		]);
		for (let parent of this._list(derivation.parents))
			this._strings(this._record(parent), ['path', 'sha256', 'schema']);
		let controls = this._record(fixture.controls);
		this._strings(controls, [
			'physicalQuantity',
			'coordinateMeaning',
			'precision',
			'interpolation',
			'reconstruction',
		]);
		let geometry = this._record(controls.geometry);
		for (let field of ['sourceHeight', 'atmosphereTop', 'coverageRadius']) this._quantity(geometry[field]);
		for (let value of this._list(controls.bands)) {
			let band = this._record(value);
			this._numbers(band, ['id']);
			this._quantity(band.innerRadius);
			this._quantity(band.outerRadius);
			this._require(typeof band.admitted === 'boolean', 'Fixture band admission required.');
		}
		for (let value of this._list(controls.rows)) {
			let row = this._record(value);
			this._quantity(row.altitude);
			this._indices(row.indices);
			this._require(this._list(row.indices).length > 0, 'Fixture row support required.');
		}
		for (let value of this._list(controls.nodes)) {
			let node = this._record(value);
			this._numbers(node, ['index', 'rowIndex', 'bandId']);
			for (let field of ['altitude', 'horizontalDistance', 'sourceDistance', 'radiusExcess'])
				this._quantity(node[field]);
		}
		this._indices(controls.omittedBands);
		let source = this._record(controls.sourceAmplitude);
		this._numbers(source, ['bandCount']);
		this._strings(source, ['meaning']);
		this._quantity(source.minimumDistance);
		this._quantity(source.maximumDistance);
		for (let boundary of this._list(source.boundaries)) this._quantity(boundary);
		for (let value of this._list(controls.queries)) {
			let query = this._record(value);
			for (let field of ['horizontalDistance', 'altitude', 'expectedSourceDistance'])
				this._quantity(query[field]);
			this._require(typeof query.admitted === 'boolean', 'Fixture query admission required.');
			this._indices(query.expectedIndices);
			this._require(
				this._list(query.expectedWeights).every(
					(weight) => typeof weight === 'number' && Number.isFinite(weight),
				),
				'Fixture finite weights required.',
			);
		}
		let comparison = this._record(controls.comparison);
		this._quantity(comparison.lengthAbsolute);
		this._numbers(comparison, ['weightSumAbsolute', 'nodeWeightAbsolute']);
		this._require(typeof comparison.physicalAccuracyClaim === 'boolean', 'Fixture claim boundary required.');
		return /** @type {LocalSunP0Fixture} */ (parsed);
	}

	/** Called by file ingress to reject traversal and linked source/output paths.
	 *
	 * @param {string} relativePath - Normalized repository-relative artifact path.
	 * @returns {string} - Checked absolute destination.
	 * @throws {Error} - A path escapes repository identity or crosses a link.
	 */
	_path(relativePath) {
		this._require(
			!path.isAbsolute(relativePath) && !relativePath.includes('\\'),
			'Normalized relative path required.',
		);
		let segments = relativePath.split('/');
		this._require(
			segments.every((segment) => segment && segment !== '.' && segment !== '..'),
			'Path traversal rejected.',
		);
		this._require(realpathSync(this._root) === this._root, 'Linked repository root rejected.');
		let current = this._root;
		for (let segment of segments) {
			current = path.join(current, segment);
			if (existsSync(current))
				this._require(!lstatSync(current).isSymbolicLink(), `Linked artifact rejected: ${relativePath}`);
		}
		return current;
	}

	/** Called by parent authentication to read one immutable artifact.
	 *
	 * @param {string} relativePath - Exact repository-relative parent.
	 * @param {string} expectedHash - Predeclared immutable artifact hash.
	 * @returns {string} - Authenticated UTF-8 content.
	 * @throws {Error} - The parent is absent, linked, or has a different identity.
	 */
	_parent(relativePath, expectedHash) {
		let content = readFileSync(this._path(relativePath), 'utf8');
		this._require(this._hash(content) === expectedHash, `Parent identity differs: ${relativePath}`);
		return content;
	}

	/** Called by projection to preserve a physical length.
	 *
	 * @param {number} value - Binary64 length in metres.
	 * @returns {LocalSunP0Distance} - Unit-bearing independent expected value.
	 */
	_distance(value) {
		return {value, units: 'meters'};
	}

	/** Called by fixture ingress to accept one physical length.
	 *
	 * @param {LocalSunP0Distance} distance - Serialized metre quantity.
	 * @returns {number} - Accepted finite local scalar.
	 * @throws {Error} - Missing units or nonfinite physical quantity.
	 */
	_meters(distance) {
		this._require(
			distance?.units === 'meters' && Number.isFinite(distance.value),
			'Finite metre quantity required.',
		);
		return distance.value;
	}

	/** Called by evidence checks to enforce a predeclared length tolerance.
	 *
	 * @param {number} actual - Observed binary64 length.
	 * @param {number} expected - Independent expected length.
	 * @param {string} label - Compared physical quantity.
	 * @returns {void} - No value.
	 * @throws {Error} - The absolute difference exceeds 1e-7 metres.
	 */
	_near(actual, expected, label) {
		this._require(Number.isFinite(actual) && Math.abs(actual - expected) <= 1e-7, `${label} exceeds 1e-7 meters.`);
	}

	/** Called by derivation to project authenticated layout data without production imports.
	 *
	 * @param {LocalSunP0SealedLayout} layout - Trusted hash-pinned v9 parent.
	 * @param {LocalSunP0StencilOracle} oracle - Authenticated production-independent stencil oracle.
	 * @returns {LocalSunP0ControlPayload} - Unit-bearing production-owned control data.
	 */
	_project(layout, oracle) {
		let minimum = Math.min(...layout.nodes.map((node) => node.radius));
		let maximum = Math.max(...layout.nodes.map((node) => node.radius));
		let boundaries = Array.from({length: 2049}, (_, index) =>
			this._distance(
				index === 0
					? minimum
					: index === 2048
						? maximum
						: 1 / Math.sqrt(1 / minimum ** 2 - (index / 2048) * (1 / minimum ** 2 - 1 / maximum ** 2)),
			),
		);
		let queryCoordinates = [
			[0, 0],
			[0, layout.top],
			[0.001, layout.top / 2],
			[1000, layout.top / 2],
			[layout.maximumRho, 0],
			[layout.maximumRho, layout.top],
			[layout.maximumRho, layout.top / 2],
			[-1, 0],
			[layout.maximumRho + 1, 0],
			[0, -1],
			[0, layout.top + 1],
		];
		return {
			physicalQuantity: 'length',
			coordinateMeaning: 'source-centered cylindrical horizontal distance and altitude above flat ground',
			precision: 'binary64 independent control',
			geometry: {
				sourceHeight: this._distance(layout.height),
				atmosphereTop: this._distance(layout.top),
				coverageRadius: this._distance(layout.maximumRho),
			},
			interpolation: layout.interpolation,
			reconstruction: layout.reconstruction,
			bands: layout.bands.map((band) => ({
				id: band.id,
				innerRadius: this._distance(band.inner),
				outerRadius: this._distance(band.outer),
				admitted: band.admitted,
			})),
			rows: layout.rows.map((row) => ({altitude: this._distance(row.z), indices: [...row.indices]})),
			nodes: layout.nodes.map((node) => ({
				index: node.index,
				rowIndex: node.rowIndex,
				bandId: node.band,
				altitude: this._distance(node.z),
				horizontalDistance: this._distance(node.rho),
				sourceDistance: this._distance(node.radius),
				radiusExcess: this._distance(node.excess),
			})),
			omittedBands: [...layout.omittedBands],
			sourceAmplitude: {
				bandCount: 2048,
				minimumDistance: this._distance(minimum),
				maximumDistance: this._distance(maximum),
				boundaries,
				meaning:
					'equal inverse-square source-amplitude bands; distinct from geometric bands and compact positions',
			},
			queries: queryCoordinates.map(([horizontal, altitude]) => {
				let admitted =
					horizontal >= 0 && horizontal <= layout.maximumRho && altitude >= 0 && altitude <= layout.top;
				let stencil = admitted ? oracle(layout, horizontal, altitude) : {indices: [], weights: []};
				return {
					horizontalDistance: this._distance(horizontal),
					altitude: this._distance(altitude),
					admitted,
					expectedSourceDistance: this._distance(Math.hypot(horizontal, layout.height - altitude)),
					expectedIndices: stencil.indices,
					expectedWeights: stencil.weights,
				};
			}),
			comparison: {
				lengthAbsolute: this._distance(1e-7),
				weightSumAbsolute: 1e-12,
				nodeWeightAbsolute: 1e-10,
				physicalAccuracyClaim: false,
			},
		};
	}

	/** Called by verification to inspect every expected node, band, row and source boundary.
	 *
	 * @param {LocalSunP0ControlPayload} controls - Accepted candidate-independent fixture payload.
	 * @returns {void} - No value.
	 * @throws {Error} - Fixture quantities, structural identities or analytic controls are inconsistent.
	 */
	_verifyPayload(controls) {
		this._require(
			controls.physicalQuantity === 'length' && controls.precision === 'binary64 independent control',
			'Quantity or precision differs.',
		);
		this._require(
			this._meters(controls.comparison.lengthAbsolute) === 1e-7 &&
				controls.comparison.weightSumAbsolute === 1e-12 &&
				controls.comparison.nodeWeightAbsolute === 1e-10 &&
				controls.comparison.physicalAccuracyClaim === false,
			'Predeclared comparison policy differs.',
		);
		let height = this._meters(controls.geometry.sourceHeight);
		let top = this._meters(controls.geometry.atmosphereTop);
		let coverage = this._meters(controls.geometry.coverageRadius);
		this._require(height === 4828032 && top === 100000 && coverage === 33378000, 'Frozen geometry differs.');
		this._require(
			controls.interpolation === 'euclidean-radius' && controls.reconstruction === 'geometric-density',
			'Selected reconstruction differs.',
		);
		this._require(
			controls.nodes.length === 1049 && controls.rows.length === 22 && controls.bands.length === 61,
			'Ragged topology differs.',
		);
		this._require(JSON.stringify(controls.omittedBands) === '[0,1,2,3,4,5]', 'Omission identity differs.');
		for (let band of controls.bands) {
			this._require(
				band.admitted === this._meters(band.outerRadius) >= height - top,
				'Tangent/omission decision differs.',
			);
			this._require(
				this._meters(band.innerRadius) < this._meters(band.outerRadius),
				'Band radii are not ordered.',
			);
		}
		let visited = 0;
		for (let [rowIndex, row] of controls.rows.entries()) {
			for (let nodeIndex of row.indices) {
				let node = controls.nodes[nodeIndex];
				this._require(
					nodeIndex === visited && node.index === visited && node.rowIndex === rowIndex,
					'Compact address differs.',
				);
				this._require(controls.bands[node.bandId]?.admitted === true, 'An omitted band owns a position.');
				let altitude = this._meters(node.altitude);
				let horizontal = this._meters(node.horizontalDistance);
				this._require(
					altitude === this._meters(row.altitude) && horizontal >= 0 && horizontal <= coverage,
					'Physical row support differs.',
				);
				this._near(
					this._meters(node.sourceDistance),
					Math.hypot(horizontal, height - altitude),
					'Source distance',
				);
				this._near(
					this._meters(node.radiusExcess),
					horizontal * (horizontal / (Math.hypot(horizontal, height - altitude) + height - altitude)),
					'Stable radius excess',
				);
				visited += 1;
			}
			this._require(
				this._meters(controls.nodes[row.indices[0]].horizontalDistance) === 0,
				'Row axis is missing.',
			);
			this._require(
				this._meters(controls.nodes[row.indices[row.indices.length - 1]].horizontalDistance) === coverage,
				'Outer support is missing.',
			);
		}
		this._require(visited === controls.nodes.length, 'Compact rows leave unaddressed nodes.');
		let source = controls.sourceAmplitude;
		let minimum = this._meters(source.minimumDistance);
		let maximum = this._meters(source.maximumDistance);
		this._near(minimum, height - top, 'Source-centered minimum');
		this._near(maximum, Math.hypot(height, coverage), 'Source-centered maximum');
		this._require(source.bandCount === 2048 && source.boundaries.length === 2049, 'Amplitude-band count differs.');
		for (let [boundaryIndex, boundary] of source.boundaries.entries()) {
			let distance = this._meters(boundary);
			this._require(distance >= minimum && distance <= maximum, 'Amplitude boundary exceeds support.');
			if (boundaryIndex > 0)
				this._require(
					distance > this._meters(source.boundaries[boundaryIndex - 1]),
					'Amplitude boundaries are not ordered.',
				);
			let expectedInverseSquare = (1 - boundaryIndex / 2048) / minimum ** 2 + boundaryIndex / 2048 / maximum ** 2;
			this._require(
				Math.abs(1 / distance ** 2 - expectedInverseSquare) <= 1e-27,
				'Inverse-square amplitude partition differs.',
			);
		}
		for (let query of controls.queries) {
			let horizontal = this._meters(query.horizontalDistance);
			let altitude = this._meters(query.altitude);
			this._require(
				query.admitted === (horizontal >= 0 && horizontal <= coverage && altitude >= 0 && altitude <= top),
				'Admission sentinel differs.',
			);
			this._near(
				this._meters(query.expectedSourceDistance),
				Math.hypot(horizontal, height - altitude),
				'Query source distance',
			);
			this._require(
				query.expectedIndices.length === query.expectedWeights.length,
				'Stencil support/weight lengths differ.',
			);
			if (query.admitted) {
				this._require(
					query.expectedIndices.length > 0 && query.expectedIndices.length <= 4,
					'Admitted stencil is incomplete.',
				);
				let weightSum = 0;
				let radiusMoment = 0;
				let altitudeMoment = 0;
				for (let [tap, nodeIndex] of query.expectedIndices.entries()) {
					let node = controls.nodes[nodeIndex];
					let weight = query.expectedWeights[tap];
					this._require(node !== undefined && weight > 0 && weight <= 1, 'Invalid positive stencil tap.');
					weightSum += weight;
					radiusMoment += weight * this._meters(node.sourceDistance);
					altitudeMoment += weight * this._meters(node.altitude);
				}
				this._require(Math.abs(weightSum - 1) <= 1e-12, 'Stencil does not conserve constant density.');
				this._near(radiusMoment, this._meters(query.expectedSourceDistance), 'Stencil radius moment');
				this._near(altitudeMoment, altitude, 'Stencil altitude moment');
			} else this._require(query.expectedIndices.length === 0, 'Unsupported sentinel has a fallback stencil.');
		}
	}

	/** Call this method to derive a checked production fixture from immutable independent inputs.
	 *
	 * @returns {Promise<LocalSunP0VerificationReport>} - New intended-repository artifact identity.
	 * @throws {Error} - A source identity, boundary, or independent control check fails.
	 */
	async derive() {
		let parents = this._parents();
		let layout;
		for (let parent of parents) {
			let parsed = JSON.parse(this._parent(parent.path, parent.sha256));
			this._require(parsed.schema === parent.schema, 'Parent schema differs.');
			if (parent.schema === 'local-sun-shell-layout-v9') layout = /** @type {LocalSunP0SealedLayout} */ (parsed);
		}
		let oraclePath = 'experiments/local-sun-cache-reuse/shell-layout.js';
		let oracleHash = '6081f726f979c6e221f37d3a715c6b4d52f9b3f8282fd618b6f6a1a2b3471d50';
		this._parent(oraclePath, oracleHash);
		// Authoring-only invocation of the exact retained pure helper; it allocates no run.
		let reference = await import(pathToFileURL(this._path(oraclePath)).href);
		if (!layout) throw new Error('The sealed layout parent is missing.');
		let controls = this._project(layout, reference.shellStencil);
		this._verifyPayload(controls);
		let producer = 'scripts/algorithm32/local-sun-cache/LocalSunP0Controls.js';
		let parentProvenancePath = 'tmp/experiments/local-sun-cache-reuse/runs/00478-p3-contract/provenance.json';
		let parentProvenanceHash = 'f78daa724ce71199e7679cda54059fe56f6532cc81ba104a899f7518989b766d';
		/** @type {LocalSunP0Fixture} */
		let fixture = {
			schema: 'local-sun-production-p0-controls-v1',
			controls,
			contentHash: this._hash(JSON.stringify(controls)),
			derivation: {
				parents,
				parentProvenancePath,
				parentProvenanceHash,
				parentDerivation: this._parent(parentProvenancePath, parentProvenanceHash),
				operation:
					'Project all sealed v9 nodes/bands/rows into metre quantities; derive 2049 inverse-square amplitude boundaries from sealed node-distance extrema and the analytic source-centered cylinder.',
				producer,
				producerSha256: this._hash(readFileSync(this._path(producer))),
				oraclePath,
				oracleHash,
				nodeVersion: process.version,
				command: 'node scripts/algorithm32/local-sun-cache/LocalSunP0Controls.js --derive',
				limits: 'Geometry/admission/source-bound and partition controls only; no physical error, held source values, scattering fields, GPU, reuse or consumer acceptance.',
			},
		};
		writeFileSync(this._path(this._fixture), `${JSON.stringify(fixture, null, '\t')}\n`, 'utf8');
		return this.verify(true);
	}

	/** Call this method to verify checked controls and optionally authenticate their sealed parents.
	 *
	 * @param {boolean} [verifyParents] - Explicit authoring-time parent authentication; runtime tests need no experiment tree.
	 * @returns {Promise<LocalSunP0VerificationReport>} - Geometry/source-control coverage and exact artifact identity.
	 * @throws {Error} - Fixture, producer, parent identity, or analytic consistency differs.
	 */
	async verify(verifyParents = false) {
		let text = readFileSync(this._path(this._fixture), 'utf8');
		let fixture = this._parseFixture(text);
		this._require(fixture.schema === 'local-sun-production-p0-controls-v1', 'Unsupported fixture schema.');
		this._require(
			fixture.derivation.parentProvenancePath ===
				'tmp/experiments/local-sun-cache-reuse/runs/00478-p3-contract/provenance.json' &&
				fixture.derivation.parentProvenanceHash ===
					'f78daa724ce71199e7679cda54059fe56f6532cc81ba104a899f7518989b766d' &&
				this._hash(fixture.derivation.parentDerivation) === fixture.derivation.parentProvenanceHash,
			'Original derivation chain differs.',
		);
		this._require(
			JSON.stringify(fixture.derivation.parents) === JSON.stringify(this._parents()),
			'Independent authority selection differs.',
		);
		this._require(
			fixture.derivation.producer === 'scripts/algorithm32/local-sun-cache/LocalSunP0Controls.js' &&
				fixture.derivation.oraclePath === 'experiments/local-sun-cache-reuse/shell-layout.js' &&
				fixture.derivation.oracleHash === '6081f726f979c6e221f37d3a715c6b4d52f9b3f8282fd618b6f6a1a2b3471d50',
			'Selected derivation implementation differs.',
		);
		this._require(
			this._hash(JSON.stringify(fixture.controls)) === fixture.contentHash,
			'Fixture payload identity differs.',
		);
		this._require(
			this._hash(readFileSync(this._path(fixture.derivation.producer))) === fixture.derivation.producerSha256,
			'Derivation implementation differs.',
		);
		this._verifyPayload(fixture.controls);
		if (verifyParents) {
			this._parent(fixture.derivation.parentProvenancePath, fixture.derivation.parentProvenanceHash);
			for (let parent of fixture.derivation.parents) this._parent(parent.path, parent.sha256);
			let layoutParent = fixture.derivation.parents.find(
				(parent) => parent.schema === 'local-sun-shell-layout-v9',
			);
			if (!layoutParent) throw new Error('The independent layout parent is missing.');
			let layout = /** @type {LocalSunP0SealedLayout} */ (
				JSON.parse(this._parent(layoutParent.path, layoutParent.sha256))
			);
			this._parent(fixture.derivation.oraclePath, fixture.derivation.oracleHash);
			let reference = await import(pathToFileURL(this._path(fixture.derivation.oraclePath)).href);
			this._require(
				JSON.stringify(this._project(layout, reference.shellStencil)) === JSON.stringify(fixture.controls),
				'Fixture differs from independent projection.',
			);
		}
		return {
			status: 'PASSED',
			fixture: this._fixture,
			sha256: this._hash(text),
			nodes: fixture.controls.nodes.length,
			bands: fixture.controls.bands.length,
			amplitudeBoundaries: fixture.controls.sourceAmplitude.boundaries.length,
			queries: fixture.controls.queries.length,
			parentsAuthenticated: verifyParents,
		};
	}
}

if (process.argv[1] && realpathSync(process.argv[1]) === fileURLToPath(import.meta.url)) {
	let argumentsList = process.argv.slice(2);
	if (
		argumentsList.length > 1 ||
		argumentsList.some((argument) => !['--derive', '--verify-parents'].includes(argument))
	) {
		throw new Error('Use no option, --derive, or --verify-parents.');
	}
	let controls = new LocalSunP0Controls();
	console.log(
		JSON.stringify(
			await (argumentsList[0] === '--derive'
				? controls.derive()
				: controls.verify(argumentsList[0] === '--verify-parents')),
			null,
			2,
		),
	);
}
