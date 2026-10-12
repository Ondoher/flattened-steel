import {existsSync, lstatSync, readFileSync, realpathSync, writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {CANONICAL_SPECTRAL_CHANNELS} from '../../../../src/algorithm32/profiles/native-15/consts.js';

/** Offline independent midpoint-in-inverse-square authority, using only frozen geometry and calibration data. */
export class LocalSunAmplitudeControls {
	/** Maintained repository identity, independent of process working directory. @type {string} */
	_root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../../..');
	/** Intended checked authority destination. @type {string} */
	fixturePath = 'src/algorithm32/implementation/local-sun/cache/fixtures/local-sun-held-amplitude-controls.json';

	/** Called by source/control ingress and output allocation to enforce the repository's no-link boundary.
	 *
	 * @param {string} relative - Normalized repository-relative path.
	 * @returns {string} - Checked absolute path, which may be a new destination.
	 * @throws {Error} - A path escapes or crosses a symlink/junction.
	 */
	checkedPath(relative) {
		if (realpathSync(this._root) !== this._root) throw new Error('Linked repository rejected.');
		let segments = relative.split('/');
		if (
			path.isAbsolute(relative) ||
			relative.includes('\\') ||
			segments.some((part) => !part || part === '.' || part === '..')
		)
			throw new Error('Normalized repository path required.');
		let target = this._root;
		for (let part of segments) {
			target = path.join(target, part);
			if (existsSync(target) && lstatSync(target).isSymbolicLink())
				throw new Error('Linked evidence path rejected.');
		}
		return target;
	}

	/** Called by evidence assembly to authenticate exact artifact bytes.
	 *
	 * @param {string} relative - Checked repository-relative source or authority path.
	 * @returns {string} - SHA-256 of complete file bytes.
	 */
	hash(relative) {
		return createHash('sha256')
			.update(readFileSync(this.checkedPath(relative)))
			.digest('hex');
	}

	/** Call this method to derive authority without evaluating any production source or shell routine.
	 * The shared Native15 literal calibration is input data, not numerical output. Outside the finite radius,
	 * equal inverse-square boundaries make the held endpoint mean exactly the affine inverse-square midpoint.
	 * The radius clamp is inactive for this frozen source/support; other profiles are not qualified here.
	 *
	 * @returns {LocalSunAmplitudeFixture} - Independent predeclared vector and complete derivation identities.
	 * @throws {Error} - A frozen parent or Native calibration has changed.
	 */
	derive() {
		let parentPath = 'src/algorithm32/implementation/local-sun/cache/fixtures/local-sun-compact-p0-controls.json';
		let calibrationPath = 'src/algorithm32/profiles/native-15/consts.js';
		let parentHash = this.hash(parentPath);
		let calibrationHash = this.hash(calibrationPath);
		if (
			parentHash !== '74a7cb03fd646d6ec4754e45e46f7ed622c815d09cd82ceeef174819c3513db6' ||
			calibrationHash !== '2f223b4aef4d2bd8f940b523b735489b14ebaace722b6085923eb749d75ca4ba'
		)
			throw new Error('Frozen source-control input changed.');
		// Exact parent identity authenticates its previously reviewed complete ingress and derivation record.
		let parent = /** @type {LocalSunP0Fixture} */ (JSON.parse(readFileSync(this.checkedPath(parentPath), 'utf8')));
		let h = parent.controls.geometry.sourceHeight.value;
		let top = parent.controls.geometry.atmosphereTop.value;
		let radius = parent.controls.geometry.coverageRadius.value;
		let minimum = h - top;
		let maximumSquared = h * h + radius * radius;
		let count = 2048;
		let reference = 4800000;
		let nearInverseSquare = 1 / (minimum * minimum);
		let farInverseSquare = 1 / maximumSquared;
		let heldScales = Array.from({length: count}, (_, index) => {
			let fraction = (index + 0.5) / count;
			return reference * reference * ((1 - fraction) * nearInverseSquare + fraction * farInverseSquare);
		});
		let producer = 'scripts/algorithm32/local-sun-cache/source-amplitude/LocalSunAmplitudeControls.js';
		return {
			schema: 'local-sun-held-amplitude-controls-v1',
			source: {
				position: {coordinates: [0, 0, h], units: 'meters'},
				referenceDistance: {value: reference, units: 'meters'},
				referenceSpectralIncidentScale: 1,
				radius: {value: 25749.504, units: 'meters'},
				distanceFalloff: true,
			},
			bounds: {
				minimumDistance: {value: minimum, units: 'meters'},
				maximumDistance: {value: Math.sqrt(maximumSquared), units: 'meters'},
			},
			bandCount: count,
			heldScales,
			packet: {
				quantity: 'spectral-irradiance-density',
				units: 'W m^-2 nm^-1',
				semantics: 'contiguous-wavelength-bin-average',
				channels: CANONICAL_SPECTRAL_CHANNELS.map((channel) => ({
					id: channel.name,
					center: channel.wavelength.value,
					width: channel.wavelengthBinWidth.value,
					value: channel.sourceIrradiance.value,
				})),
			},
			// Analytic binary64 comparison bounds, selected before candidate scoring; not physical error limits.
			limits: {absoluteScale: 1e-14, absoluteIrradiance: 1e-14, relative: 1e-12},
			derivation: {
				parents: [
					{path: parentPath, sha256: parentHash},
					{path: calibrationPath, sha256: calibrationHash},
				],
				p0Derivation: parent.derivation,
				operation:
					'For h=4828032,H=100000,R=33378000, dmin=h-H and dmax^2=h^2+R^2. For i=0..2047, a_i=4800000^2*((1-(i+0.5)/2048)/dmin^2+((i+0.5)/2048)/dmax^2). Expected irradiance channel equals the authenticated Native15 bin-average irradiance density times dimensionless a_i; no total-power or bandwidth conversion.',
				producer: {path: producer, sha256: this.hash(producer)},
				node: process.version,
			},
		};
	}

	/** Call this method to authenticate the frozen vector before typed use.
	 *
	 * @returns {LocalSunAmplitudeFixture} - Complete control, verified against independent derivation.
	 * @throws {Error} - Stored content differs from the frozen independent derivation.
	 */
	verify() {
		let expected = this.derive();
		let stored = JSON.parse(readFileSync(this.checkedPath(this.fixturePath), 'utf8'));
		// Tool version records original authoring, rather than rejecting a compatible consumer runtime.
		expected.derivation.node = stored?.derivation?.node;
		if (typeof expected.derivation.node !== 'string' || JSON.stringify(stored) !== JSON.stringify(expected))
			throw new Error('Held-amplitude control failed independent derivation verification.');
		return expected;
	}

	/** Call this explicit authoring method only to create a new checked authority; existing controls are immutable.
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
	let args = process.argv.slice(2);
	if (!(args.length === 0 || (args.length === 1 && args[0] === '--derive')))
		throw new Error('Use no arguments or --derive.');
	let controls = new LocalSunAmplitudeControls();
	if (args.length) controls.write();
	else controls.verify();
	console.log(
		JSON.stringify({status: 'PASSED', fixture: controls.fixturePath, sha256: controls.hash(controls.fixturePath)}),
	);
}
