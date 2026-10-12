import {existsSync, lstatSync, readFileSync, realpathSync, writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {CANONICAL_SPECTRAL_CHANNELS} from '../../../../src/algorithm32/profiles/native-15/consts.js';
import {CANONICAL_ATMOSPHERE_CONSTANTS} from '../../../../src/algorithm32/implementation/canonical-atmosphere/consts.js';

/** Offline analytic geometric-density controls using shared literal physical data, without numerical owner imports. */
export class LocalSunNormalizationControls {
	/** Repository identity from this maintained tool. @type {string} */
	_root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../../..');
	/** Intended immutable portable authority. @readonly @type {string} */
	fixturePath = 'src/algorithm32/implementation/local-sun/cache/fixtures/local-sun-normalization-controls.json';

	/** Call this method to check normalized repository paths and reject links or traversal.
	 *
	 * @param {string} relative - Repository-relative source, control or output path.
	 * @returns {string} - Checked absolute path.
	 * @throws {Error} - Repository identity or path is unsupported.
	 */
	checkedPath(relative) {
		if (realpathSync(this._root) !== this._root) throw new Error('Linked repository rejected.');
		let parts = relative.split('/');
		if (path.isAbsolute(relative) || relative.includes('\\') || parts.some((p) => !p || p === '.' || p === '..'))
			throw new Error('Normalized repository path required.');
		let target = this._root;
		for (let part of parts) {
			target = path.join(target, part);
			if (existsSync(target) && lstatSync(target).isSymbolicLink()) throw new Error('Linked evidence rejected.');
		}
		return target;
	}

	/** Call this method to identify all checked artifact bytes.
	 *
	 * @param {string} relative - Repository-relative artifact.
	 * @returns {string} - SHA-256 identity.
	 * @throws {Error} - Checked source is unavailable or unsupported.
	 */
	hash(relative) {
		return createHash('sha256')
			.update(readFileSync(this.checkedPath(relative)))
			.digest('hex');
	}

	/** Called by independent authoring to evaluate extinction times geometric dilution directly.
	 * This is algebraically independent of the retained log-domain production implementation.
	 *
	 * @param {number} rho - Source-centered horizontal distance in metres.
	 * @param {number} z - Altitude in metres.
	 * @param {number} height - Source height in metres.
	 * @returns {readonly number[]} - Positive Native15 factors in m^-1.
	 */
	_factors(rho, z, height) {
		let a = CANONICAL_ATMOSPHERE_CONSTANTS;
		let squaredDistance = rho * rho + (height - z) ** 2;
		return CANONICAL_SPECTRAL_CHANNELS.map((channel) => {
			let wavelength = channel.wavelength.value / 1000;
			let extinction =
				a.rayleighCoefficientScale * wavelength ** -4 * Math.exp(-z / a.rayleighScaleHeight.value) +
				(a.mieAngstromBeta / a.mieScaleHeight.value) *
					wavelength ** -a.mieAngstromAlpha *
					Math.exp(-z / a.mieScaleHeight.value);
			return (extinction * height * height) / squaredDistance;
		});
	}

	/** Call this method to freeze independent factors and affine normalized-density reconstruction gold.
	 * Historical source is authenticated read-only, never executed. Shared imports contain literal data only.
	 * Node and query physical coordinates/weights come from the independent P0 authority, never the candidate.
	 *
	 * @returns {LocalSunNormalizationFixture} - Complete analytic control and original derivation chain.
	 * @throws {Error} - A pinned parent, physical policy or control has changed.
	 */
	derive() {
		let parents = [
			{
				path: 'src/algorithm32/implementation/local-sun/cache/fixtures/local-sun-compact-p0-controls.json',
				sha256: '74a7cb03fd646d6ec4754e45e46f7ed622c815d09cd82ceeef174819c3513db6',
			},
			{
				path: 'src/algorithm32/profiles/native-15/consts.js',
				sha256: '2f223b4aef4d2bd8f940b523b735489b14ebaace722b6085923eb749d75ca4ba',
			},
			{
				path: 'src/algorithm32/implementation/canonical-atmosphere/consts.js',
				sha256: '963105b88e4cabbc27a53544a4bd185f098ab9d77474c0bf39107483717aceaf',
			},
			{
				path: 'tmp/experiments/local-sun-cache-reuse/runs/00217-p3-layout-v2/source-shell-reconstruction.js',
				sha256: '7c5072fc52e7b03a2d52299d4748db53202fafd255514880b4d25936c6f3a037',
			},
			{
				path: 'tmp/experiments/local-sun-cache-reuse/runs/00217-p3-layout-v2/inputs.json',
				sha256: 'f9d4fcf1d0af035cecc10b826ce18752f129c69b1875247955c87abf12e1fc6b',
			},
			{
				path: 'tmp/experiments/local-sun-cache-reuse/runs/00217-p3-layout-v2/manifest.json',
				sha256: '0275828945bc74c3f5d0cec432564af35c81b8a1ca2c22b8e72e59cc4de04030',
			},
		];
		for (let parent of parents)
			if (this.hash(parent.path) !== parent.sha256) throw new Error('Normalization parent changed.');
		let p0 = /** @type {LocalSunP0Fixture} */ (JSON.parse(readFileSync(this.checkedPath(parents[0].path), 'utf8')));
		if (p0.controls.reconstruction !== 'geometric-density') throw new Error('Unselected reconstruction policy.');
		let height = p0.controls.geometry.sourceHeight.value,
			top = p0.controls.geometry.atmosphereTop.value;
		let nodes = p0.controls.nodes.map((node) => ({
			index: node.index,
			factors: this._factors(node.horizontalDistance.value, node.altitude.value, height),
		}));
		let queries = p0.controls.queries
			.filter((q) => q.admitted)
			.map((query) => {
				let factors = this._factors(query.horizontalDistance.value, query.altitude.value, height);
				return {
					horizontalDistance: query.horizontalDistance.value,
					altitude: query.altitude.value,
					indices: query.expectedIndices,
					weights: query.expectedWeights,
					factors,
					ratios: query.expectedIndices.map((index) =>
						factors.map((value, channel) => value / nodes[index].factors[channel]),
					),
					expectedAffine: factors.map(
						(value, channel) =>
							value *
							(1 + (0.25 * query.expectedSourceDistance.value) / height + query.altitude.value / top) *
							(channel + 1),
					),
				};
			});
		let producer = 'scripts/algorithm32/local-sun-cache/normalization/LocalSunNormalizationControls.js';
		return {
			schema: 'local-sun-normalization-controls-v1',
			policy: 'geometric-density',
			geometry: {
				sourceHeight: height,
				atmosphereTop: top,
				coverageRadius: p0.controls.geometry.coverageRadius.value,
			},
			wavelengthsNanometers: CANONICAL_SPECTRAL_CHANNELS.map((c) => c.wavelength.value),
			nodes,
			queries,
			limits: {
				logAbsolute: 1e-12,
				relative: 1e-12,
				ratioAbsolute: 1e-14,
				scatteringAbsolute: 1e-12,
				exactNodeRelative: 1e-10,
			},
			derivation: {
				parents,
				p0Derivation: p0.derivation,
				historicalInputs: readFileSync(this.checkedPath(parents[4].path), 'utf8'),
				historicalManifest: readFileSync(this.checkedPath(parents[5].path), 'utf8'),
				operation:
					'For Native15, kappa(z)=betaR*exp(-z/8000)+betaM*exp(-z/1200), betaR=0.00000124062*(lambda_nm/1000)^-4, betaM=(0.04/1200)*(lambda_nm/1000)^-0.8; f=kappa*h^2/(rho^2+(h-z)^2). Expected tap ratio=f(query)/f(node). Synthetic stored J_node=f_node*(1+0.25*r_node/h+z_node/H)*(channel+1); positive P0 radius/altitude moments imply exact restored J_query=f_query*(1+0.25*r_query/h+z_query/H)*(channel+1). No direct-beam attenuation, fitted brightness correction, candidate numerical imports or physical-field oracle.',
				producer: {path: producer, sha256: this.hash(producer)},
				tools: {node: process.version},
			},
		};
	}
}

if (process.argv[1] && realpathSync(process.argv[1]) === fileURLToPath(import.meta.url)) {
	if (process.argv.length !== 3 || process.argv[2] !== '--derive')
		throw new Error('Use --derive to author a new fixture.');
	let controls = new LocalSunNormalizationControls();
	writeFileSync(controls.checkedPath(controls.fixturePath), `${JSON.stringify(controls.derive(), null, '\t')}\n`, {
		flag: 'wx',
	});
}
