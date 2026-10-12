import {existsSync, lstatSync, readFileSync, realpathSync, writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

/** Offline authoring owner for immutable historical polar40/midpoint-azimuth48 controls. */
export class LocalSunIncomingControls {
	/** Maintained repository identity, independent of working directory. @type {string} */
	_root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../../..');
	/** Intended checked fixture destination. @readonly @type {string} */
	fixturePath =
		'src/algorithm32/sampling-domains/direction/horizon-partitioned/fixtures/local-sun-incoming-controls.json';

	/** Call this method to resolve source/control and output paths under the exact repository identity.
	 *
	 * @param {string} relative - Normalized repository-relative path.
	 * @returns {string} - Checked absolute destination, which may not yet exist.
	 * @throws {Error} - The path escapes or crosses a symbolic link/junction.
	 */
	checkedPath(relative) {
		if (realpathSync(this._root) !== this._root) throw new Error('Linked repository rejected.');
		let parts = relative.split('/');
		if (
			path.isAbsolute(relative) ||
			relative.includes('\\') ||
			parts.some((part) => !part || part === '.' || part === '..')
		)
			throw new Error('Normalized repository-relative path required.');
		let target = this._root;
		for (let part of parts) {
			target = path.join(target, part);
			if (existsSync(target) && lstatSync(target).isSymbolicLink())
				throw new Error('Linked evidence path rejected.');
		}
		return target;
	}

	/** Call this method to identify complete checked artifact bytes.
	 *
	 * @param {string} relative - Repository-relative artifact path.
	 * @returns {string} - SHA-256 of complete bytes.
	 */
	hash(relative) {
		return createHash('sha256')
			.update(readFileSync(this.checkedPath(relative)))
			.digest('hex');
	}

	/** Call this method to authenticate independent historical inputs and project their already-recorded samples.
	 * No historical source is executed, no live production implementation is imported, and no old run is reopened.
	 * The authenticated diagnostic helper identity matches the later immutable source snapshot and selected policy.
	 *
	 * @returns {LocalSunIncomingQuadratureFixture} - Complete ordered control and original derivation chains.
	 * @throws {Error} - A historical parent or selected policy has changed or the projected sample count is invalid.
	 */
	derive() {
		let prefix = 'tmp/experiments/local-sun-cache-reuse/runs/';
		let parents = [
			{
				path: prefix + '00093-p3-angular-diag/result.json',
				sha256: '5c4d4c01b3601302f0f1ac49f645d64b952d3e0abe7a07cd303fe7aed04d05cb',
			},
			{
				path: prefix + '00093-p3-angular-diag/inputs.json',
				sha256: '420f579f270e3db851b28d81eab42134a85a1dc02c3ba4e3d5b9f24d31d0a329',
			},
			{
				path: prefix + '00093-p3-angular-diag/manifest.json',
				sha256: '24bdd32272df29474cd617daa5409ce9ac090193049d1d1fd85a365561e793aa',
			},
			{
				path: prefix + '00478-p3-contract/contract.json',
				sha256: '186b8be60929276c1208dbd72d2c648a3782cd4346c59f4a0c74efcc9826a704',
			},
			{
				path: prefix + '00478-p3-contract/provenance.json',
				sha256: 'f78daa724ce71199e7679cda54059fe56f6532cc81ba104a899f7518989b766d',
			},
			{
				path: prefix + '00529-p3-frame-policy/source-shell-angular.js',
				sha256: 'a6ebe7d1e75d2df3bee4f23b50851cdf8521d647a5754c108b6d96eac6eb3bd3',
			},
			{
				path: prefix + '00529-p3-frame-policy/inputs.json',
				sha256: '224e3fa047894f71c91ee57b592dd54c5d6c3a326cf5391175f76664f75b7e24',
			},
			{
				path: prefix + '00529-p3-frame-policy/manifest.json',
				sha256: '502673df1109ce395b5f5909ac52f25c0d9a8af22eda7a53a8502cac760b62d6',
			},
		];
		for (let parent of parents)
			if (this.hash(parent.path) !== parent.sha256) throw new Error('Historical quadrature parent changed.');
		let text = parents.map((parent) => readFileSync(this.checkedPath(parent.path), 'utf8'));
		// Exact predeclared byte identities authenticate these known historical records before typed projection.
		let diagnostic = /** @type {LocalSunIncomingDiagnosticArtifact} */ (JSON.parse(text[0]));
		if (diagnostic.schema !== 'shell-angular-diagnosis-v1' || diagnostic.shiftedNodes.length !== 1920)
			throw new Error('Historical incoming projection is incompatible.');
		let inputs = JSON.parse(text[1]);
		let contract = JSON.parse(text[3]);
		if (
			inputs.inputs.find((input) => input.path === 'shell-angular.js')?.sha256 !== parents[5].sha256 ||
			contract.numericalPolicy.incoming !== 'partitioned-polar40-midpoint-azimuth48-v1'
		)
			throw new Error('Selected policy and historical source identities differ.');
		let producer = 'scripts/algorithm32/local-sun-cache/incoming-quadrature/LocalSunIncomingControls.js';
		return {
			schema: 'local-sun-incoming-quadrature-controls-v1',
			policy: 'partitioned-polar40-midpoint-azimuth48-v1',
			coordinateMeaning: 'flat-radial-tangent-vertical; positive Z is slab up; geometry owns physical transforms',
			weightUnits: 'steradians',
			edges: [-1, -0.1, -0.01, -0.001, 0, 0.001, 0.01, 0.1, 1],
			polarCounts: [8, 4, 4, 4, 4, 4, 4, 8],
			azimuthCount: 48,
			azimuthOffset: 0.5,
			samples: diagnostic.shiftedNodes,
			limits: {directionAbsolute: 1e-12, weightAbsolute: 1e-14, massAbsolute: 1e-11, momentAbsolute: 1e-12},
			derivation: {
				parents,
				diagnosticInputs: text[1],
				diagnosticManifest: text[2],
				selectedContract: text[3],
				selectedProvenance: text[4],
				sourceSnapshot: text[5],
				snapshotInputs: text[6],
				snapshotManifest: text[7],
				operation:
					'Project all 1920 ordered shiftedNodes from authenticated immutable 00093 result; preserve original ancestor/tool records. Its shell-angular.js hash equals immutable 00529 source snapshot. Selected 00478 contract retains polar40/midpoint-azimuth48. Eight cosine partitions, Gaussian orders 8 at poles/4 elsewhere, azimuth phi=2*pi*(a+0.5)/48; weights w_polar*bandHalf*2*pi/48. Binary64 agreement and analytic band moments only; no field or physical-accuracy claim.',
				producer: {path: producer, sha256: this.hash(producer)},
				node: process.version,
			},
		};
	}

	/** Call this method to author a new intended fixture; existing authority files are never overwritten.
	 * Run targeted repository formatting before freezing its exact byte identity for candidate scoring.
	 *
	 * @returns {void} - No value.
	 */
	write() {
		writeFileSync(this.checkedPath(this.fixturePath), `${JSON.stringify(this.derive(), null, '\t')}\n`, {
			flag: 'wx',
		});
	}
}

if (process.argv[1] && realpathSync(process.argv[1]) === fileURLToPath(import.meta.url)) {
	if (process.argv.length !== 3 || process.argv[2] !== '--derive')
		throw new Error('Use --derive to author a new quadrature control.');
	let controls = new LocalSunIncomingControls();
	controls.write();
	console.log(JSON.stringify({fixture: controls.fixturePath, sha256: controls.hash(controls.fixturePath)}));
}
