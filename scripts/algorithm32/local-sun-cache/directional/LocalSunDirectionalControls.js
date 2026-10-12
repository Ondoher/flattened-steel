import {existsSync, lstatSync, readFileSync, realpathSync, writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

/** Offline analytic angular controls, independent of production numerical code. */
export class LocalSunDirectionalControls {
	/** Repository identity from this maintained tool. @type {string} */
	_root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../../..');
	/** Intended portable authority. @readonly @type {string} */
	fixturePath = 'src/algorithm32/implementation/flat-earth/fixtures/local-sun-directional-controls.json';

	/** Call this method to check a normalized repository path, rejecting traversal and links.
	 *
	 * @param {string} relative - Repository-relative input or output.
	 * @returns {string} - Checked absolute path.
	 * @throws {Error} - Identity or path is unsupported.
	 */
	checkedPath(relative) {
		if (realpathSync(this._root) !== this._root) throw new Error('Linked repository rejected.');
		let parts = relative.split('/');
		if (path.isAbsolute(relative) || relative.includes('\\') || parts.some((p) => !p || p === '.' || p === '..'))
			throw new Error('Normalized repository-relative path required.');
		let target = this._root;
		for (let part of parts) {
			target = path.join(target, part);
			if (existsSync(target) && lstatSync(target).isSymbolicLink()) throw new Error('Linked evidence rejected.');
		}
		return target;
	}

	/** Call this method to hash all checked artifact bytes.
	 *
	 * @param {string} relative - Repository-relative file.
	 * @returns {string} - SHA-256 identity.
	 */
	hash(relative) {
		return createHash('sha256')
			.update(readFileSync(this.checkedPath(relative)))
			.digest('hex');
	}

	/** Called by offline authoring to evaluate independent face equations and bilinear products.
	 * Face order is +X,-X,+Y,-Y,+Z,-Z, with first-face ties; W27 addresses are face*729+v*27+u.
	 *
	 * @param {readonly number[]} vector - Nonzero local direction; projection ratios are scale invariant.
	 * @returns {ScatteringCacheDirectionStencil} - Analytic normalized support.
	 */
	_angular(vector) {
		let [x, y, z] = vector;
		let projections = [x, -x, y, -y, z, -z];
		let face = projections.indexOf(Math.max(...projections));
		let uv = [
			[y, z],
			[-y, z],
			[-x, z],
			[x, z],
			[x, y],
			[-x, y],
		][face];
		let locations = uv.map((component) => {
			let coordinate = Math.min(26, Math.max(0, 13 * (1 + component / projections[face])));
			let nearest = Math.round(coordinate);
			if (Math.abs(coordinate - nearest) <= 1e-10) return [[nearest, 1]];
			let lower = Math.floor(coordinate);
			return [
				[lower, 1 - (coordinate - lower)],
				[lower + 1, coordinate - lower],
			];
		});
		let indices = [];
		let weights = [];
		for (let [v, vw] of locations[1])
			for (let [u, uw] of locations[0]) {
				indices.push(face * 729 + v * 27 + u);
				weights.push(uw * vw);
			}
		let sum = weights.reduce((a, b) => a + b, 0);
		return {indices, weights: weights.map((w) => w / sum)};
	}

	/** Call this method to author frozen ordinary-frame and axis-limit controls before candidate scoring.
	 * Historical source is read only and never executed. Analytic controls supply angular scalar gold,
	 * while the existing authenticated P0 fixture supplies spatial scalar gold and its original derivation.
	 *
	 * @returns {LocalSunDirectionalFixture} - Portable independently calculated controls.
	 * @throws {Error} - A pinned source/control parent changed.
	 */
	derive() {
		let parents = [
			{
				path: 'tmp/experiments/local-sun-cache-reuse/runs/00529-p3-frame-policy/source-shell-geometry.js',
				sha256: '7009d10ef0e128500bfb308420066942830a0b0164886dabb80f9fa869ef95f6',
			},
			{
				path: 'tmp/experiments/local-sun-cache-reuse/runs/00529-p3-frame-policy/inputs.json',
				sha256: '224e3fa047894f71c91ee57b592dd54c5d6c3a326cf5391175f76664f75b7e24',
			},
			{
				path: 'tmp/experiments/local-sun-cache-reuse/runs/00529-p3-frame-policy/manifest.json',
				sha256: '502673df1109ce395b5f5909ac52f25c0d9a8af22eda7a53a8502cac760b62d6',
			},
			{
				path: 'experiments/local-sun-cache-reuse/shell-axis.js',
				sha256: 'b5e6d4d7c2b2af3bd9bb84a8b2d173cc5f9d4ae6d0c9a9c38ba60aaf1df11c3f',
			},
			{
				path: 'src/algorithm32/implementation/local-sun/cache/fixtures/local-sun-compact-p0-controls.json',
				sha256: '74a7cb03fd646d6ec4754e45e46f7ed622c815d09cd82ceeef174819c3513db6',
			},
		];
		for (let parent of parents)
			if (this.hash(parent.path) !== parent.sha256) throw new Error('Directional parent changed.');
		let vectors = [
			[1, 0, 0],
			[-1, 0, 0],
			[0, 1, 0],
			[0, -1, 0],
			[0, 0, 1],
			[0, 0, -1],
			[1, 1, 1],
			[-1, -1, -1],
			[1, 0.37, -0.23],
			[-0.31, 1, 0.47],
			[0.19, -0.41, 1],
			[1, 1 - 1e-8, 0.23],
			[1 - 1e-8, 1, 0.23],
		];
		let cases = [0, Math.PI / 2, Math.PI, -Math.PI / 2, 0.37].flatMap((angle) =>
			vectors.map((vector) => {
				let norm = Math.hypot(...vector);
				let direction = /** @type {UnitVector3} */ ([vector[0] / norm, vector[1] / norm, vector[2] / norm]);
				let [x, y, z] = direction;
				let local = [x * Math.cos(angle) + y * Math.sin(angle), -x * Math.sin(angle) + y * Math.cos(angle), z];
				return {
					angle,
					direction: /** @type {UnitVector3} */ (direction),
					normal: this._angular(local),
					axis: this._angular([Math.hypot(x, y), 0, z]),
				};
			}),
		);
		let producer = 'scripts/algorithm32/local-sun-cache/directional/LocalSunDirectionalControls.js';
		return {
			schema: 'local-sun-directional-controls-v1',
			cases,
			limits: {
				weightAbsolute: 1e-12,
				weightSumAbsolute: 1e-12,
				exactNodeAbsolute: 1e-10,
				continuityAbsolute: 1e-10,
			},
			derivation: {
				parents,
				historicalInputs: readFileSync(this.checkedPath(parents[1].path), 'utf8'),
				historicalManifest: readFileSync(this.checkedPath(parents[2].path), 'utf8'),
				operation:
					'Independent dominant-face projection and W27 bilinear equations; ordinary local direction=(dx*cos(phi)+dy*sin(phi),-dx*sin(phi)+dy*cos(phi),dz); axis direction=(hypot(dx,dy),0,dz). First-face tie order and 1e-10 exact-grid convention retained. No candidate numerical imports or historical source execution.',
				producer: {path: producer, sha256: this.hash(producer)},
				tools: {node: process.version},
			},
		};
	}
}

if (process.argv[1] && realpathSync(process.argv[1]) === fileURLToPath(import.meta.url)) {
	if (process.argv.length !== 3 || process.argv[2] !== '--derive')
		throw new Error('Use --derive only to author a new immutable fixture.');
	let controls = new LocalSunDirectionalControls();
	writeFileSync(controls.checkedPath(controls.fixturePath), `${JSON.stringify(controls.derive(), null, '\t')}\n`, {
		flag: 'wx',
	});
}
