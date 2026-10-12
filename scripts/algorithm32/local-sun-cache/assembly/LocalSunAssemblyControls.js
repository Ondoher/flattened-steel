import {existsSync, readFileSync, realpathSync, writeFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {LocalSunTransportControls} from '../transport/LocalSunTransportControls.js';
import {CANONICAL_ATMOSPHERE_CONSTANTS} from '../../../../src/algorithm32/implementation/canonical-atmosphere/consts.js';

/** Independent selected primary/transport/scattering-step authority using frozen inputs and analytic equations only. */
export class LocalSunAssemblyControls {
	/** Existing independent expm1/series and checked-path tooling. @type {LocalSunTransportControls} */
	_transport = new LocalSunTransportControls();
	/** Intended portable frozen authority. @readonly @type {string} */
	fixturePath = 'src/algorithm32/implementation/local-sun/cache/fixtures/local-sun-assembly-controls.json';

	/** Call this method to access the shared checked repository path/identity owner.
	 *
	 * @returns {LocalSunTransportControls['paths']} - Existing immutable path tooling.
	 */
	get paths() {
		return this._transport.paths;
	}

	/** Called by independent authoring to evaluate standard physical phase equations from literal constants.
	 *
	 * @param {number} cosine - Physical direction cosine.
	 * @returns {readonly number[]} - Rayleigh and Mie inverse-solid-angle values.
	 */
	_phase(cosine) {
		let g = CANONICAL_ATMOSPHERE_CONSTANTS.miePhaseFunctionG;
		return [
			(3 * (1 + cosine * cosine)) / (16 * Math.PI),
			(3 * (1 - g * g) * (1 + cosine * cosine)) /
				(8 * Math.PI * (2 + g * g) * (1 + g * g - 2 * g * cosine) ** 1.5),
		];
	}

	/** Called by independent authoring to evaluate physical scattering coefficients using literal Native15 wavelength data.
	 *
	 * @param {number} wavelengthNanometers - Physical wavelength in nanometres.
	 * @param {number} altitudeMeters - Physical altitude in metres.
	 * @returns {readonly number[]} - Rayleigh and Mie scattering in m^-1.
	 */
	_coefficients(wavelengthNanometers, altitudeMeters) {
		let a = CANONICAL_ATMOSPHERE_CONSTANTS,
			wavelength = wavelengthNanometers / 1000;
		return [
			a.rayleighCoefficientScale * wavelength ** -4 * Math.exp(-altitudeMeters / a.rayleighScaleHeight.value),
			(a.mieAngstromBeta / a.mieScaleHeight.value) *
				wavelength ** -a.mieAngstromAlpha *
				a.mieSingleScatteringAlbedo *
				Math.exp(-altitudeMeters / a.mieScaleHeight.value),
		];
	}

	/** Call this method to freeze selected J1, two axis J1-transport rays and a distinct manufactured full-measure L-to-J2 step.
	 * Expected results never call a production numerical owner. All controls and gates precede candidate scoring.
	 *
	 * @returns {LocalSunAssemblyFixture} - Complete selected assembly controls and derivation.
	 * @throws {Error} - Authenticated physical, quadrature, normalization or tool parents differ.
	 */
	derive() {
		let parents = [
			{
				path: 'src/algorithm32/implementation/local-sun/cache/fixtures/local-sun-compact-p0-controls.json',
				sha256: '74a7cb03fd646d6ec4754e45e46f7ed622c815d09cd82ceeef174819c3513db6',
			},
			{
				path: 'src/algorithm32/implementation/local-sun/cache/fixtures/local-sun-held-amplitude-controls.json',
				sha256: '9d157f86ddbc15d66302341cb2cb5e9817c9b60f28010334b3840e53d689a4ff',
			},
			{
				path: 'src/algorithm32/implementation/local-sun/cache/fixtures/local-sun-normalization-controls.json',
				sha256: 'cb1097c038b416023a3f8ca67eee2d7d95c307b3784b70e0cb48ec1f0b81b3df',
			},
			{
				path: 'src/algorithm32/sampling-domains/direction/horizon-partitioned/fixtures/local-sun-incoming-controls.json',
				sha256: 'c7a90b1462678980f64dbc46627327d3e3a2281941937391cafb2efb740f1579',
			},
			{
				path: 'scripts/algorithm32/local-sun-cache/transport/LocalSunTransportControls.js',
				sha256: 'fe8b9a48f28ff9bbea57314800e315b8a842fa43e6ac2fceeaa4d630e65d6f43',
			},
			{
				path: 'src/algorithm32/implementation/canonical-atmosphere/consts.js',
				sha256: '963105b88e4cabbc27a53544a4bd185f098ab9d77474c0bf39107483717aceaf',
			},
		];
		for (let parent of parents)
			if (this.paths.hash(parent.path) !== parent.sha256) throw new Error('Assembly control parent changed.');
		let p0 = /** @type {LocalSunP0Fixture} */ (
			JSON.parse(readFileSync(this.paths.checkedPath(parents[0].path), 'utf8'))
		);
		let amplitude = /** @type {LocalSunAmplitudeFixture} */ (
			JSON.parse(readFileSync(this.paths.checkedPath(parents[1].path), 'utf8'))
		);
		let factors = /** @type {LocalSunNormalizationFixture} */ (
			JSON.parse(readFileSync(this.paths.checkedPath(parents[2].path), 'utf8'))
		);
		let incoming = /** @type {LocalSunIncomingQuadratureFixture} */ (
			JSON.parse(readFileSync(this.paths.checkedPath(parents[3].path), 'utf8'))
		);
		let h = p0.controls.geometry.sourceHeight.value,
			top = p0.controls.geometry.atmosphereTop.value;
		let directions = [
			{index: 364, vector: [1, 0, 0]},
			{index: 1093, vector: [-1, 0, 0]},
			{index: 1822, vector: [0, 1, 0]},
			{index: 2551, vector: [0, -1, 0]},
			{index: 3280, vector: [0, 0, 1]},
			{index: 4009, vector: [0, 0, -1]},
		];
		let selected = [...new Set([0, 400, 1048, ...p0.controls.rows.map((row) => row.indices[0])])].sort(
			(a, b) => a - b,
		);
		let primary = selected.map((index) => {
			let node = p0.controls.nodes[index],
				rho = node.horizontalDistance.value,
				z = node.altitude.value,
				distance = node.sourceDistance.value;
			let band = 0;
			while (band < 2047 && distance >= p0.controls.sourceAmplitude.boundaries[band + 1].value) band++;
			let sourceDirection = [-rho / distance, 0, (h - z) / distance],
				pathLength = (top - z) / sourceDirection[2];
			let samples = directions.map((direction) => {
				let phase = this._phase(direction.vector.reduce((sum, v, i) => sum + v * sourceDirection[i], 0));
				return amplitude.packet.channels.map((channel, c) => {
					let coefficients = this._coefficients(channel.center, z),
						survival = Math.exp(-this._transport.tau(z, top - z, pathLength, c));
					return (
						channel.value *
						amplitude.heldScales[band] *
						survival *
						(coefficients[0] * phase[0] + coefficients[1] * phase[1])
					);
				});
			});
			return {positionIndex: index, rho, altitude: z, heldBand: band, samples};
		});
		let rays = [
			{row: 3, directionIndex: 3280, dz: 1, length: 10000},
			{row: 9, directionIndex: 4009, dz: -1, length: 14000},
		].map((specification) => {
			let row = p0.controls.rows[specification.row],
				origin = row.altitude.value;
			if (
				origin + specification.dz * specification.length < 0 ||
				origin + specification.dz * specification.length > top
			)
				throw new Error('Independent selected axis ray is outside slab.');
			let directionSlot = directions.findIndex((d) => d.index === specification.directionIndex);
			let normalizedAt = (z, c) => {
				let lower = 0;
				while (lower < p0.controls.rows.length - 2 && z > p0.controls.rows[lower + 1].altitude.value) lower++;
				let a = p0.controls.rows[lower],
					b = p0.controls.rows[lower + 1],
					fraction = (z - a.altitude.value) / (b.altitude.value - a.altitude.value);
				let ja = primary.find((n) => n.positionIndex === a.indices[0]),
					jb = primary.find((n) => n.positionIndex === b.indices[0]);
				if (!ja || !jb) throw new Error('Independent axis primary support missing.');
				return (
					((((1 - fraction) * ja.samples[directionSlot][c]) / factors.nodes[a.indices[0]].factors[c] +
						(fraction * jb.samples[directionSlot][c]) / factors.nodes[b.indices[0]].factors[c]) *
						h *
						h) /
					(h - z) ** 2
				);
			};
			let radiance = amplitude.packet.channels.map((_value, c) => {
				let previousDistance = 0,
					previousSource = normalizedAt(origin, c),
					value = 0,
					transmission = 1;
				for (let i = 1; i <= 48; i++) {
					let q = (i / 48) ** 2,
						exponent = (-specification.dz * specification.length) / 8000,
						x = q * Math.expm1(exponent);
					let logarithm = Math.abs(x) < 0.001 ? x - (x * x) / 2 + x ** 3 / 3 : Math.log1p(x);
					let distance =
						i === 48
							? specification.length
							: Math.min(specification.length, Math.max(0, (-8000 / specification.dz) * logarithm));
					let z = origin + specification.dz * distance,
						source = normalizedAt(z, c),
						tau = this._transport.tau(
							origin + specification.dz * previousDistance,
							specification.dz * (distance - previousDistance),
							distance - previousDistance,
							c,
						),
						weights = this._transport.weights(tau);
					value += transmission * (previousSource * weights[0] + source * weights[1]);
					transmission *= Math.exp(-tau);
					previousSource = source;
					previousDistance = distance;
				}
				return value;
			});
			return {
				positionIndex: row.indices[0],
				directionIndex: specification.directionIndex,
				length: specification.length,
				radiance,
			};
		});
		let scatterPositions = [0, 400],
			scatterDirections = [364, 3280, 1093];
		let scatter = scatterPositions.flatMap((positionIndex) =>
			scatterDirections.map((directionIndex) => {
				let node = p0.controls.nodes[positionIndex],
					outgoing = directions.find((d) => d.index === directionIndex);
				if (!outgoing) throw new Error('Independent outgoing control missing.');
				let values = amplitude.packet.channels.map((channel, c) => {
					let coefficients = this._coefficients(channel.center, node.altitude.value),
						value = 0;
					for (let sample of incoming.samples) {
						let phase = this._phase(
							outgoing.vector.reduce((sum, v, i) => sum + v * sample.direction[i], 0),
						);
						let radiance = (c + 1) * 1e-6 * (1 + 0.2 * sample.direction[2] + 0.1 * sample.direction[0]);
						value += radiance * sample.weight * (coefficients[0] * phase[0] + coefficients[1] * phase[1]);
					}
					return value;
				});
				return {positionIndex, directionIndex, values};
			}),
		);
		let producer = 'scripts/algorithm32/local-sun-cache/assembly/LocalSunAssemblyControls.js';
		return {
			schema: 'local-sun-assembly-controls-v1',
			primary,
			directions,
			rays,
			scatter,
			scatterPositions,
			scatterDirections,
			limits: {
				primaryAbsolute: 1e-12,
				primaryRelative: 2e-7,
				radianceAbsolute: 1e-9,
				radianceRelative: 2e-7,
				scatterAbsolute: 1e-18,
				scatterRelative: 1e-10,
			},
			derivation: {
				parents,
				producer: {path: producer, sha256: this.paths.hash(producer)},
				operation:
					'Frozen P0 physical nodes and source-distance bands, independent held spectra/normalization/incoming controls; analytic shared-constant medium and phase equations; exact expm1 source columns; independently integrated selected vertical J1 rays with endpoint-linear optical weights; separate anisotropic manufactured L-to-J2 full incoming measure. No production numerical owner, candidate output, physical-field or full-recurrence claim.',
				tools: {node: process.version},
			},
		};
	}

	/** Call this method to write the intended control once before candidate implementation/scoring.
	 *
	 * @returns {void} - No value.
	 * @throws {Error} - Existing authority or unsupported/changed parent.
	 */
	writeAuthority() {
		let destination = this.paths.checkedPath(this.fixturePath);
		if (existsSync(destination)) throw new Error('Existing assembly authority rejected.');
		writeFileSync(destination, JSON.stringify(this.derive(), null, '\t') + '\n', {flag: 'wx'});
	}
}

if (process.argv[1] && realpathSync(process.argv[1]) === fileURLToPath(import.meta.url)) {
	if (process.argv.slice(2).join(' ') !== '--derive')
		throw new Error('Use --derive to author the intended control once.');
	new LocalSunAssemblyControls().writeAuthority();
}
