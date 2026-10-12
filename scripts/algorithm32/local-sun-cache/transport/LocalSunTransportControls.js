import {existsSync, readFileSync, realpathSync, writeFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {LocalSunNormalizationControls} from '../normalization/LocalSunNormalizationControls.js';
import {CANONICAL_SPECTRAL_CHANNELS} from '../../../../src/algorithm32/profiles/native-15/consts.js';
import {CANONICAL_ATMOSPHERE_CONSTANTS} from '../../../../src/algorithm32/implementation/canonical-atmosphere/consts.js';

/** Offline independent flat-ray and exponential-integral authority; imports only physical literals and path tooling. */
export class LocalSunTransportControls {
	/** Checked repository path/byte identity owner. @type {LocalSunNormalizationControls} */
	paths = new LocalSunNormalizationControls();
	/** Intended checked control. @readonly @type {string} */
	fixturePath = 'src/algorithm32/implementation/local-sun/cache/fixtures/local-sun-transport-controls.json';

	/** Called by independent authoring to integrate one exponential density exactly using expm1.
	 *
	 * @param {number} z - Initial altitude in metres.
	 * @param {number} dz - Segment altitude change in metres.
	 * @param {number} length - Segment length in metres.
	 * @param {number} height - Physical density scale height in metres.
	 * @returns {number} - Integrated density in metres.
	 */
	column(z, dz, length, height) {
		let q = dz / height;
		return length * Math.exp(-z / height) * (q === 0 ? 1 : -Math.expm1(-q) / q);
	}

	/** Called by independent authoring to evaluate the unchanged Native15 exponential extinction integral.
	 *
	 * @param {number} z - Initial altitude in metres.
	 * @param {number} dz - Altitude change in metres.
	 * @param {number} length - Segment length in metres.
	 * @param {number} channel - Native15 channel address.
	 * @returns {number} - Dimensionless optical depth.
	 */
	tau(z, dz, length, channel) {
		let a = CANONICAL_ATMOSPHERE_CONSTANTS,
			wavelength = CANONICAL_SPECTRAL_CHANNELS[channel].wavelength.value / 1000;
		return (
			a.rayleighCoefficientScale * wavelength ** -4 * this.column(z, dz, length, a.rayleighScaleHeight.value) +
			(a.mieAngstromBeta / a.mieScaleHeight.value) *
				wavelength ** -a.mieAngstromAlpha *
				this.column(z, dz, length, a.mieScaleHeight.value)
		);
	}

	/** Called by independent authoring to integrate the endpoint-linear source function in optical depth.
	 * Small depths use the convergent exponential integral series rather than the retained cubic implementation.
	 *
	 * @param {number} tau - Nonnegative dimensionless optical depth.
	 * @returns {readonly number[]} - Lower and upper positive integral weights.
	 */
	weights(tau) {
		if (tau >= 0.1) {
			let upper = (1 - (1 + tau) * Math.exp(-tau)) / tau;
			return [-Math.expm1(-tau) - upper, upper];
		}
		let total = 0,
			upper = 0,
			term = tau;
		for (let n = 0; n < 18; n++) {
			total += term / (n + 1);
			upper += term / (n + 2);
			term *= -tau / (n + 1);
		}
		return [total - upper, upper];
	}

	/** Call this method to freeze ray, cutoff, sampling, column, weight and transported synthetic-density controls.
	 * No production numerical routine or candidate output contributes expected results. Historical policy source is read-only ancestry.
	 *
	 * @returns {LocalSunTransportFixture} - Independent predeclared scalar/ray authority.
	 * @throws {Error} - A pinned physical or historical parent differs.
	 */
	derive() {
		let parents = [
			{
				path: 'experiments/local-sun-cache-reuse/shell-transport.js',
				sha256: 'a237b91f672825c3ea45572a1be3339788779eade58f03cdd719650d1ea2ba5f',
			},
			{
				path: 'tmp/experiments/local-sun-cache-reuse/runs/00132-p3-shell-v3a/inputs.json',
				sha256: 'fef739064fd7287e2a2c4e7fe5a91f865875735579c1a44212372f058d5feb11',
			},
			{
				path: 'tmp/experiments/local-sun-cache-reuse/runs/00132-p3-shell-v3a/manifest.json',
				sha256: '2287cc5908ff93d763130680b04803709d35a7070c24295172edc8d5ef0317ac',
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
				path: 'src/algorithm32/implementation/local-sun/cache/fixtures/local-sun-compact-p0-controls.json',
				sha256: '74a7cb03fd646d6ec4754e45e46f7ed622c815d09cd82ceeef174819c3513db6',
			},
		];
		for (let parent of parents)
			if (this.paths.hash(parent.path) !== parent.sha256) throw new Error('Transport control parent changed.');
		let height = 4828032,
			top = 100000,
			radius = 33378000;
		let specifications = [
			{label: 'axis-top', origin: [0, 0, 50000], direction: [0, 0, 1]},
			{label: 'axis-ground', origin: [0, 0, 50000], direction: [0, 0, -1]},
			{label: 'horizontal-thick', origin: [0, 0, 0], direction: [1, 0, 0]},
			{label: 'cylinder-high', origin: [0, 0, 95000], direction: [1, 0, 0]},
			{label: 'descending', origin: [radius / 2, 0, 40000], direction: [0.6, 0, -0.8]},
			{label: 'oblique-cylinder', origin: [radius / 2, 0, 80000], direction: [0.6, 0.8, 0]},
			{label: 'near-horizontal', origin: [0, 0, 1000], direction: [1, 0, 1e-8], maximumDistance: 12000},
			{label: 'shortened', origin: [radius / 2, 0, 1000], direction: [0.6, 0, -0.8], maximumDistance: 333},
			{label: 'ground-outward-zero', origin: [0, 0, 0], direction: [0, 0, -1]},
			{label: 'top-outward-zero', origin: [0, 0, top], direction: [0, 0, 1]},
			{label: 'cylinder-outward-zero', origin: [radius, 0, 1000], direction: [1, 0, 0]},
			{label: 'cylinder-inward', origin: [radius, 0, 90000], direction: [-1, 0, 0]},
		];
		let rays = specifications.map((specification) => {
			let origin = specification.origin,
				norm = Math.hypot(...specification.direction),
				direction = specification.direction.map((v) => v / norm);
			let [x, y, z] = origin,
				[dx, dy, dz] = direction;
			let plane = dz > 0 ? (top - z) / dz : dz < 0 ? -z / dz : Infinity;
			let a = dx * dx + dy * dy,
				b = x * dx + y * dy;
			let cylinder = a === 0 ? Infinity : (-b + Math.sqrt(b * b + a * (radius * radius - x * x - y * y))) / a;
			let full = Math.min(plane, cylinder),
				boundary = plane <= cylinder ? (dz > 0 ? 'top-atmosphere' : 'ground') : 'cache-radial-boundary';
			if (specification.maximumDistance !== undefined && specification.maximumDistance < full) {
				full = specification.maximumDistance;
				boundary = 'shortened';
			}
			let channels = CANONICAL_SPECTRAL_CHANNELS.map((_value, channel) => {
				let retained = full;
				if (this.tau(z, dz * full, full, channel) > 64) {
					let low = 0,
						high = full;
					for (let i = 0; i < 24; i++) {
						let mid = (low + high) / 2;
						if (this.tau(z, dz * mid, mid, channel) > 64) high = mid;
						else low = mid;
					}
					retained = high;
				}
				let distances = Array.from({length: 49}, (_unused, index) => {
					if (index === 48) return retained;
					let q = (index / 48) ** 2,
						exponent = (-dz * retained) / 8000;
					if (Math.abs(exponent) < 0.001) return retained * q;
					let t = q * Math.expm1(exponent);
					let logarithm = Math.abs(t) < 0.001 ? t - (t * t) / 2 + t ** 3 / 3 : Math.log1p(t);
					return Math.min(retained, Math.max(0, (-8000 / dz) * logarithm));
				});
				let radiance = 0,
					transmission = 1,
					previousSource = height ** 2 / (x * x + y * y + (height - z) ** 2);
				for (let i = 1; i <= 48; i++) {
					let s = distances[i],
						prior = distances[i - 1],
						px = x + dx * s,
						py = y + dy * s,
						pz = z + dz * s;
					let source = height ** 2 / (px * px + py * py + (height - pz) ** 2);
					let tau = this.tau(z + dz * prior, dz * (s - prior), s - prior, channel),
						weights = this.weights(tau);
					radiance += transmission * (previousSource * weights[0] + source * weights[1]);
					transmission *= Math.exp(-tau);
					previousSource = source;
				}
				return {retained, distances, radiance, transmission, physicalEnd: retained === full};
			});
			return {...specification, direction, full, boundary, channels};
		});
		let columns = [0, 1e-8, 0.009, 0.01, 1, -0.009, -1, 12.5].flatMap((q) =>
			[8000, 1200].map((scaleHeight) => {
				let z = q < 0 ? -q * scaleHeight : 0;
				return {
					z,
					endAltitude: z + q * scaleHeight,
					length: 10000,
					scaleHeight,
					expected: this.column(z, q * scaleHeight, 10000, scaleHeight),
				};
			}),
		);
		let weights = [0, 1e-12, 1e-6, 0.009, 0.01, 0.1, 1, 64, 100].map((tau) => ({tau, expected: this.weights(tau)}));
		let producer = 'scripts/algorithm32/local-sun-cache/transport/LocalSunTransportControls.js';
		return {
			schema: 'local-sun-transport-controls-v1',
			policy: 'column48-tail64',
			geometry: {height, top, radius},
			rays,
			columns,
			weights,
			limits: {
				endpointMeters: 0.01,
				sampleMeters: 0.00001,
				columnRelative: 1e-9,
				weightAbsolute: 1e-10,
				radianceAbsolute: 1e-9,
				radianceRelative: 2e-7,
				transmissionAbsolute: 1e-7,
			},
			derivation: {
				parents,
				producer: {path: producer, sha256: this.paths.hash(producer)},
				operation:
					'Independent slab/cylinder intersection equations; expm1 exponential integrals; retained 24-step tau64 prefix and squared Rayleigh-column selection, with 48 exact endpoint intervals; convergent attenuation-weight series; synthetic physical J=kappa*(h/r)^2. No production numerical owner or candidate output supplies gold.',
				tools: {node: process.version},
			},
		};
	}

	/** Call this method to write the intended portable control once, before candidate implementation/scoring.
	 *
	 * @returns {void} - No value.
	 * @throws {Error} - Existing fixture, changed parent or unsupported destination.
	 */
	writeAuthority() {
		let destination = this.paths.checkedPath(this.fixturePath);
		if (existsSync(destination)) throw new Error('Existing transport authority rejected.');
		writeFileSync(destination, JSON.stringify(this.derive(), null, '\t') + '\n', {flag: 'wx'});
	}
}

if (process.argv[1] && realpathSync(process.argv[1]) === fileURLToPath(import.meta.url)) {
	if (process.argv.slice(2).join(' ') !== '--derive')
		throw new Error('Use --derive to author the intended control once.');
	new LocalSunTransportControls().writeAuthority();
}
