import * as THREE from 'three';
import {ThreeCacheBackend} from '../../src/algorithm32/implementation/three-cache-backend/ThreeCacheBackend.js';
import {sampleField, cpuRays, residual} from './rotation-model.js';
import {column, attenuationWeights} from './shell-runtime-math.js';
import {ShellRuntimeCalculator} from './shell-runtime-calculator.js';
import {primaryDensity} from './primary-oracle.js';
import {gpuRays} from './rotation-gpu.js';
import {CANONICAL_ATMOSPHERE_CONSTANTS as constants} from '../../src/algorithm32/implementation/canonical-atmosphere/consts.js';
import {CANONICAL_SPECTRAL_CHANNELS} from '../../src/algorithm32/profiles/native-15/consts.js';
import {SpectralPacket, SPECTRAL_QUANTITIES, SPECTRAL_UNITS} from '../../src/algorithm32/spectral-values/index.js';
import {createFlat32ColorDisplayModel} from '../../src/flat32/Flat32ColorDisplayModel.js';
import {ColorResetSlope078P2ColorDisplayModel} from '../../src/algorithm32/implementation/color-reset-slope-078-p2/ColorResetSlope078P2ColorDisplayModel.js';

/** Attribute fixed visible-band pixels without changing any rendered equation.
 * @param {LocalSunRotationOwners} owners - Exact fresh candidate physical model.
 * @param {Map<string,LocalSunRotationField>} fields - Complete measured pure fields.
 * @param {LocalSunRotationField} cumulative - Measured cumulative density.
 * @param {LocalSunFrozenPlacement} state - Frozen source/time controls.
 * @param {THREE.PerspectiveCamera} camera - Actual capture camera.
 * @param {THREE.WebGLRenderer} renderer - Caller-owned live renderer.
 * @param {GpuScatteringCache} cache - Caller-owned candidate cache.
 * @param {ThreeCacheBackend} backend - Caller-owned diagnostic backend.
 * @returns {Promise<LocalSunBandTraceResult>} - Bounded additive spectral/source attribution.
 */
export async function traceLowerBand(owners, fields, cumulative, state, camera, renderer, cache, backend) {
	const pixels = [
		{x: 360, y: 205},
		{x: 360, y: 195},
		{x: 360, y: 175},
		{x: 180, y: 195},
		{x: 360, y: 100},
	];
	const directions = pixels.map((pixel) => {
		const scene = new THREE.Vector3((2 * (pixel.x + 0.5)) / 720 - 1, 1 - (2 * (pixel.y + 0.5)) / 414, 0.5)
			.unproject(camera)
			.sub(camera.position)
			.normalize();
		return owners.geometry.mapObserverLocalSceneDirectionToModelDirection([scene.x, scene.y, scene.z]);
	});
	const cpu = cpuRays(owners, cumulative, directions),
		gl = renderer.getContext();
	const pixelBytes = pixels.map((pixel) => {
		const bytes = new Uint8Array(4);
		gl.readPixels(pixel.x, 413 - pixel.y, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, bytes);
		return Array.from(bytes.slice(0, 3));
	});
	const gpu = await gpuRays({owners, cache, backend, renderer, directions});
	const calculator = new ShellRuntimeCalculator({model: owners.model});
	const sea = owners.model.atmosphere.sampleMedium({altitude: {value: 0, units: 'meters'}});
	const optical = (/** @type {number} */ a, /** @type {number} */ b, /** @type {number} */ length) =>
		sea.rayleighScattering.values.map(
			(v, c) =>
				v * column(a, b, length, constants.rayleighScaleHeight.value) +
				sea.mieExtinction.values[c] * column(a, b, length, constants.mieScaleHeight.value),
		);
	const color = createFlat32ColorDisplayModel();
	if (!(color instanceof ColorResetSlope078P2ColorDisplayModel))
		throw new Error('Trace requires the unchanged selected p2 color model.');
	/** @type {LocalSunBandRayTrace[]} */ const rays = [];
	for (let rayIndex = 0; rayIndex < pixels.length; rayIndex++) {
		const segment = cpu[rayIndex].segment,
			origin = segment.ray.origin.coordinates,
			direction = segment.ray.direction;
		const schedule = calculator.buildEndpointTrapezoidPathIntegrationPoints(
			segment,
			owners.profile.numerical.viewPath.intervalCount,
		);
		const center = owners.geometry.configuration.sourceSubpoint.coordinates;
		const points = schedule.map((point) => {
			const d = point.distanceAlongRay.value,
				p = origin.map((v, i) => v + direction[i] * d),
				z = Math.max(0, p[2]);
			const sourceDistance = Math.hypot(
				p[0] - center[0],
				p[1] - center[1],
				state.geometry.sourcePosition.coordinates[2] - z,
			);
			const sourceLength =
				((state.geometry.topAltitude.value - z) * sourceDistance) /
				(state.geometry.sourcePosition.coordinates[2] - z);
			const medium = owners.model.atmosphere.sampleMedium({altitude: {value: z, units: 'meters'}});
			return {
				distanceMeters: d,
				positionMeters: p,
				sourceDistanceMeters: sourceDistance,
				sourceAtmosphericLengthMeters: sourceLength,
				sourceOpticalDepth: Array.from(optical(z, state.geometry.topAltitude.value, sourceLength)),
				viewOpticalDepth: Array.from(optical(origin[2], z, d)),
				extinction: Array.from(medium.extinction.values),
				densities: [1, 2, 3, 4].map((order) => {
					const field = fields.get('local-sun-j' + order);
					if (!field) throw new Error('Missing pure order.');
					return Array.from(sampleField(field, owners.geometry, p, direction));
				}),
				continuousJ1: primaryDensity(state, [p[0] - center[0], p[1] - center[1], z], direction),
			};
		});
		const orders = Array.from({length: 4}, () => new Array(15).fill(0)),
			analytic = new Array(15).fill(0),
			unattenuated = new Array(15).fill(0),
			t = new Array(15).fill(1);
		/** @type {LocalSunBandTraceInterval[]} */ const intervals = [];
		for (let i = 1; i < points.length; i++) {
			const a = points[i - 1],
				b = points[i],
				ds = b.distanceMeters - a.distanceMeters,
				tau = optical(a.positionMeters[2], b.positionMeters[2], ds);
			const contributions = Array.from({length: 4}, () => new Array(15).fill(0)),
				continuous = new Array(15).fill(0);
			for (let c = 0; c < 15; c++) {
				const [lower, upper] = attenuationWeights(Math.max(0, tau[c]));
				for (let order = 0; order < 4; order++) {
					contributions[order][c] =
						t[c] *
						((lower * a.densities[order][c]) / Math.max(a.extinction[c], 1e-30) +
							(upper * b.densities[order][c]) / Math.max(b.extinction[c], 1e-30));
					orders[order][c] += contributions[order][c];
					unattenuated[c] += 0.5 * ds * (a.densities[order][c] + b.densities[order][c]);
				}
				continuous[c] =
					t[c] *
					((lower * a.continuousJ1[c]) / Math.max(a.extinction[c], 1e-30) +
						(upper * b.continuousJ1[c]) / Math.max(b.extinction[c], 1e-30));
				analytic[c] += continuous[c];
				t[c] *= Math.exp(-tau[c]);
			}
			intervals.push({
				lowerMeters: a.distanceMeters,
				upperMeters: b.distanceMeters,
				byOrder: contributions,
				continuousJ1: continuous,
			});
		}
		const total = Array.from({length: 15}, (_, c) => orders.reduce((v, order) => v + order[c], 0));
		const packet = new SpectralPacket({
			basis: owners.profile.spectral.basis,
			quantity: SPECTRAL_QUANTITIES.RADIANCE_DENSITY,
			units: SPECTRAL_UNITS.RADIANCE_DENSITY,
			values: total,
			provenanceIdentity: 'measured-pure-field-band-attribution-v1',
		});
		const rgb = color.radianceToLinearSrgb(/** @type {SpectralRadiancePacket} */ (packet)),
			display = color.linearSrgbToDisplayRgb(rgb, owners.facade.totalHorizontalIlluminance);
		rays.push({
			pixel: pixels[rayIndex],
			direction: directions[rayIndex],
			segment,
			points,
			intervals,
			orderSpectra: orders,
			totalSpectrum: total,
			cpuSpectrum: cpu[rayIndex].radiance,
			gpuSpectrum: gpu[rayIndex].radiance,
			continuousJ1Spectrum: analytic,
			noViewAttenuationSpectrum: unattenuated,
			linearRgb: rgb,
			displayRgb: display,
			pixelBytes: pixelBytes[rayIndex],
		});
	}
	const closure = residual(
			rays.flatMap((r) => r.totalSpectrum),
			rays.flatMap((r) => r.cpuSpectrum),
			1e-9,
			0.002,
		),
		cpuGpu = residual(
			rays.flatMap((r) => r.totalSpectrum),
			rays.flatMap((r) => r.gpuSpectrum),
			1e-9,
			0.002,
		);
	const pixelDifference = Math.max(
		...rays.flatMap((r) => r.displayRgb.map((v, c) => Math.abs(Math.round(v * 255) - r.pixelBytes[c]))),
	);
	if (closure.failures || cpuGpu.failures || pixelDifference > 2)
		throw new Error('Band trace does not close against the actual rendered transport/pixels.');
	return {
		schema: 'local-sun-lower-band-trace-v1',
		state: state.observation.instant,
		wavelengthsNm: CANONICAL_SPECTRAL_CHANNELS.map((c) => c.wavelength.value),
		widthsNm: CANONICAL_SPECTRAL_CHANNELS.map((c) => c.wavelengthBinWidth.value),
		rays,
		closure,
		cpuGpu,
		maximumPixelByteDifference: pixelDifference,
		limitations:
			'Attribution of the fixed column15 source-function interpolation on measured J1-J4, not unique photon histories or error bars. Final-scattering intervals do not recover upstream paths for J2-J4. Continuous-primary substitution and zero-survival-loss density trapezoid are separate diagnostics, not modified rendered images or independent total accuracy proofs. Black ground, zero ozone and finite-domain policies remain unchanged.',
	};
}
