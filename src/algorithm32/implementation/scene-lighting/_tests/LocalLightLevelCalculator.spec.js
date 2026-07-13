import {LocalLightLevelCalculator} from '../LocalLightLevelCalculator.js';
import {
	RECEIVER_ENVIRONMENT_LIGHT_QUADRATURE,
	RECEIVER_ENVIRONMENT_SAMPLE_COUNT,
} from '../ReceiverEnvironmentLightQuadrature.js';
import {
	SPECTRAL_QUANTITIES,
	SPECTRAL_SAMPLE_SEMANTICS,
	SPECTRAL_UNITS,
	SpectralBasis,
	SpectralPacket,
} from '../../../spectral-values/index.js';

describe('LocalLightLevelCalculator', /** Called by Jasmine to register the named test suite. */ () => {
	const basis = new SpectralBasis({
		id: 'local-light-level-555nm-control',
		semantics: SPECTRAL_SAMPLE_SEMANTICS.BIN_AVERAGE,
		channels: [
			{
				id: 'photopic-peak',
				center: {value: 555, units: 'nanometers'},
				width: {value: 1, units: 'nanometers'},
			},
		],
	});

	it('combines an unchanged exposure baseline with one separate achromatic modifier', /** Called by Jasmine to exercise the named behavior. */ () => {
		const calculator = new LocalLightLevelCalculator();
		const baselineExposure = 1 / (5 * 683);

		expect(calculator.modifyExposure({baselineExposure})).toEqual({
			baselineExposure,
			exposureModifier: 1,
			effectiveExposure: baselineExposure,
		});
		expect(calculator.modifyExposure({baselineExposure, exposureModifier: 8})).toEqual({
			baselineExposure,
			exposureModifier: 8,
			effectiveExposure: baselineExposure * 8,
		});
	});

	it('derives a finite Ward target while preserving the exact photopic Bruneton baseline', /** Called by Jasmine to exercise the named behavior. */ () => {
		const calculator = new LocalLightLevelCalculator();
		const samples = [0, 0.001, 0.01, 0.1, 1, 5].map((value) =>
			calculator.deriveExposureModifier({value, units: 'cd m^-2'}),
		);

		expect(samples[0]).toBeCloseTo(10.50268593548108, 12);
		expect(samples[samples.length - 1]).toBe(1);
		expect(calculator.deriveExposureModifier({value: 100000, units: 'cd m^-2'})).toBe(1);
		expect(samples.every(Number.isFinite)).toBeTrue();
		for (let index = 1; index < samples.length; index += 1) {
			expect(samples[index]).toBeLessThan(samples[index - 1]);
		}
	});

	it('converts local spectral irradiance to photopic illuminance and the retained luminance proxy', /** Called by Jasmine to exercise the named behavior. */ () => {
		const calculator = new LocalLightLevelCalculator();
		const result = calculator.measureDirectIrradiance(createPacket(SPECTRAL_QUANTITIES.IRRADIANCE_DENSITY, [1]));

		expect(result.photopicDirectIlluminance).toEqual({value: 683, units: 'lux'});
		expect(result.adaptingLuminanceProxy.units).toBe('cd m^-2');
		expect(result.adaptingLuminanceProxy.value).toBeCloseTo(683 / Math.PI, 12);
	});

	it('publishes one fixed camera-independent cosine-weighted hemisphere', /** Called by Jasmine to exercise the named behavior. */ () => {
		expect(RECEIVER_ENVIRONMENT_LIGHT_QUADRATURE.length).toBe(RECEIVER_ENVIRONMENT_SAMPLE_COUNT);
		expect(
			RECEIVER_ENVIRONMENT_LIGHT_QUADRATURE.reduce(
				(sum, sample) => sum + sample.irradianceWeightSteradians,
				0,
			),
		).toBeCloseTo(Math.PI, 14);
		for (const sample of RECEIVER_ENVIRONMENT_LIGHT_QUADRATURE) {
			expect(Object.isFrozen(sample)).toBeTrue();
			expect(Object.isFrozen(sample.directionLocal)).toBeTrue();
			expect(sample.directionLocal[2]).toBeGreaterThan(0);
			expect(Math.hypot(...sample.directionLocal)).toBeCloseTo(1, 14);
		}
	});

	it('reduces uniform receiver radiance to pi-scaled environmental irradiance', /** Called by Jasmine to exercise the named behavior. */ () => {
		const calculator = new LocalLightLevelCalculator();
		const radiance = createPacket(SPECTRAL_QUANTITIES.RADIANCE_DENSITY, [2]);
		const irradiance = calculator.measureEnvironmentIrradiance({
			samples: RECEIVER_ENVIRONMENT_LIGHT_QUADRATURE.map((sample) => ({
				spectralRadiance: radiance,
				irradianceWeightSteradians: sample.irradianceWeightSteradians,
			})),
		});

		expect(irradiance.quantity).toBe(SPECTRAL_QUANTITIES.IRRADIANCE_DENSITY);
		expect(irradiance.units).toBe(SPECTRAL_UNITS.IRRADIANCE_DENSITY);
		expect(irradiance.values[0]).toBeCloseTo(2 * Math.PI, 12);
		expect(calculator.measureDirectIrradiance(irradiance).adaptingLuminanceProxy.value).toBeCloseTo(
			2 * 683,
			11,
		);
	});

	it('measures configured source scale with geometry-owned night support', /** Called by Jasmine to exercise the named behavior. */ () => {
		const lightSource = /** @type {LightSourceModel} */ (
			/** @type {unknown} */ ({
				id: 'night-source',
				sampleDirectLighting: /** Return a source sample below the local horizon. */ () => ({
					sourceIrradiance: createPacket(SPECTRAL_QUANTITIES.IRRADIANCE_DENSITY, [1]),
					directionToLight: [0, 0, -1],
				}),
			})
		);
		const calculator = new LocalLightLevelCalculator({lightSource});
		const result = calculator.measureConfiguredDirectSource({
			geometry: /** @type {GeometryModel} */ (
				/** @type {unknown} */ ({
					resolveViewRaySegment: /** Return the configured receiver position. */ () => ({
						ray: {origin: {coordinates: [0, 0, 1], units: 'meters'}, direction: [0, 0, 1]},
						startDistance: {value: 0, units: 'meters'},
						endDistance: {value: 0, units: 'meters'},
					}),
					resolveSourceRelativePosition: /** Return the configured source direction. */ () => ({
						directionToSource: [0, 0, -1],
						directionFromSource: [0, 0, 1],
						distanceFromSource: null,
					}),
				})
			),
			observation: /** @type {GeometryObservation} */ (/** @type {unknown} */ ({})),
		});

		expect(result.directSpectralIrradiance.values).toEqual([0]);
		expect(result.photopicDirectIlluminance.value).toBe(0);
		expect(result.adaptingLuminanceProxy).toEqual({value: 0, units: 'cd m^-2'});
		expect(
			calculator.measureBrightnessProxy({
				geometry: /** @type {GeometryModel} */ (
					/** @type {unknown} */ ({
						resolveViewRaySegment: /** Return the configured receiver position. */ () => ({
							ray: {origin: {coordinates: [0, 0, 1], units: 'meters'}, direction: [0, 0, 1]},
							startDistance: {value: 0, units: 'meters'},
							endDistance: {value: 0, units: 'meters'},
						}),
						resolveSourceRelativePosition: /** Return the configured source direction. */ () => ({
							directionToSource: [0, 0, -1],
							directionFromSource: [0, 0, 1],
							distanceFromSource: null,
						}),
					})
				),
				observation: /** @type {GeometryObservation} */ (/** @type {unknown} */ ({})),
			}),
		).toEqual({value: 0, units: 'cd m^-2'});
	});

	it('derives a camera-independent brightness policy before horizon clipping', /** Called by Jasmine to exercise the named behavior. */ () => {
		let directionToLight = /** @type {UnitVector3} */ ([
			Math.sqrt(1 - 0.0007345177958817672 ** 2),
			0,
			0.0007345177958817672,
		]);
		const fullSourcePhotopicProxy = 42259.92746573373;
		const sourceIrradiance = createPacket(SPECTRAL_QUANTITIES.IRRADIANCE_DENSITY, [
			(fullSourcePhotopicProxy * Math.PI) / 683,
		]);
		const lightSource = /** @type {LightSourceModel} */ (
			/** @type {unknown} */ ({
				id: 'brightness-policy-source',
				sampleDirectLighting: /** Return the current receiver-local source direction. */ () => ({
					sourceIrradiance,
					directionToLight,
				}),
			})
		);
		const geometry = /** @type {GeometryModel} */ (
			/** @type {unknown} */ ({
				resolveViewRaySegment: /** Return a receiver whose local up is positive Z. */ () => ({
					ray: {origin: {coordinates: [0, 0, 1], units: 'meters'}, direction: [0, 0, 1]},
					startDistance: {value: 0, units: 'meters'},
					endDistance: {value: 0, units: 'meters'},
				}),
				resolveSourceRelativePosition: /** Return a source-relative placeholder. */ () => ({
					directionToSource: directionToLight,
					directionFromSource: directionToLight.map((value) => -value),
					distanceFromSource: null,
				}),
			})
		);
		const calculator = new LocalLightLevelCalculator({lightSource});
		const request = {
			geometry,
			observation: /** @type {GeometryObservation} */ (/** @type {unknown} */ ({})),
		};
		expect(calculator.measureSourceBrightness(request).value).toBeCloseTo(fullSourcePhotopicProxy, 9);
		expect(calculator.measureBrightnessProxy(request).value).toBeCloseTo(fullSourcePhotopicProxy, 9);

		directionToLight = /** @type {UnitVector3} */ ([Math.sqrt(1 - 0.9707576860549317 ** 2), 0, 0.9707576860549317]);
		expect(calculator.measureBrightnessProxy(request).value).toBeCloseTo(fullSourcePhotopicProxy, 9);

		directionToLight = /** @type {UnitVector3} */ ([
			Math.cos((9.74525026663458 * Math.PI) / 180),
			0,
			-Math.sin((9.74525026663458 * Math.PI) / 180),
		]);
		expect(calculator.measureBrightnessProxy(request).value).toBe(0);

		directionToLight = /** @type {UnitVector3} */ ([
			Math.cos((15.527384771856092 * Math.PI) / 180),
			0,
			-Math.sin((15.527384771856092 * Math.PI) / 180),
		]);
		expect(calculator.measureBrightnessProxy(request).value).toBe(0);

		directionToLight = /** @type {UnitVector3} */ ([Math.cos(Math.PI / 8), 0, -Math.sin(Math.PI / 8)]);
		expect(calculator.measureBrightnessProxy(request)).toEqual({value: 0, units: 'cd m^-2'});
	});

	it('derives exact visible uniform-disk support without a sky probe', /** Called by Jasmine to exercise the named behavior. */ () => {
		const calculator = new LocalLightLevelCalculator();
		const angularRadiusRadians = 0.01;
		const full = calculator.measureUniformDisk({
			spectralRadiance: createPacket(SPECTRAL_QUANTITIES.RADIANCE_DENSITY, [1]),
			elevationRadians: angularRadiusRadians,
			angularRadiusRadians,
		});
		const horizon = calculator.measureUniformDisk({
			spectralRadiance: createPacket(SPECTRAL_QUANTITIES.RADIANCE_DENSITY, [1]),
			elevationRadians: 0,
			angularRadiusRadians,
		});

		const fullSolidAngle = Math.PI * Math.sin(angularRadiusRadians) ** 2;
		expect(full.visibleFraction).toBe(1);
		expect(full.visibleProjectedSolidAngleSteradians).toBeCloseTo(fullSolidAngle, 15);
		expect(full.photopicDirectIlluminance.value).toBeCloseTo(683 * fullSolidAngle, 12);
		expect(horizon.visibleFraction).toBe(0.5);
		expect(horizon.directSpectralIrradiance.values[0]).toBeCloseTo(fullSolidAngle / 2, 15);
	});

	it('rejects invalid physical inputs', /** Called by Jasmine to exercise the named behavior. */ () => {
		const calculator = new LocalLightLevelCalculator();
		expect(
			/** Called by Jasmine to invoke the rejected operation. */ () =>
				calculator.modifyExposure({baselineExposure: 0}),
		).toThrowError(RangeError, 'baselineExposure must be positive and finite.');
		expect(
			/** Called by Jasmine to invoke the rejected operation. */ () =>
				calculator.modifyExposure({baselineExposure: 1, exposureModifier: Number.POSITIVE_INFINITY}),
		).toThrowError(RangeError, 'exposureModifier must be positive and finite.');
		expect(
			/** Called by Jasmine to invoke the rejected operation. */ () =>
				calculator.modifyExposure({baselineExposure: Number.MAX_VALUE, exposureModifier: 2}),
		).toThrowError(RangeError, 'Modified exposure must be positive and finite.');
		expect(
			/** Called by Jasmine to invoke the rejected operation. */ () =>
				calculator.measureDirectIrradiance(createPacket(SPECTRAL_QUANTITIES.IRRADIANCE_DENSITY, [-1])),
		).toThrowError(RangeError, 'Local direct spectral irradiance must be nonnegative.');
		expect(
			/** Called by Jasmine to invoke the rejected operation. */ () =>
				calculator.visibleProjectedDiskFraction(0, 0),
		).toThrowError(RangeError, 'angularRadiusRadians must be positive and finite.');
		expect(
			/** Called by Jasmine to invoke the rejected operation. */ () =>
				calculator.deriveExposureModifier({value: 0, units: 'lux'}),
		).toThrowError(TypeError, 'adaptingLuminanceProxy.units must be "cd m^-2".');
		expect(
			/** Called by Jasmine to invoke the rejected operation. */ () =>
				calculator.deriveExposureModifier({value: -1, units: 'cd m^-2'}),
		).toThrowError(RangeError, 'adaptingLuminanceProxy.value must be finite and nonnegative.');
	});

	/**
	 * Create one single-channel physical packet.
	 * @param {SpectralQuantity} quantity - Requested spectral quantity.
	 * @param {readonly number[]} values - Channel values.
	 * @returns {SpectralPacket} - Validated packet.
	 */
	function createPacket(quantity, values) {
		return new SpectralPacket({
			basis,
			quantity,
			units:
				quantity === SPECTRAL_QUANTITIES.RADIANCE_DENSITY
					? SPECTRAL_UNITS.RADIANCE_DENSITY
					: SPECTRAL_UNITS.IRRADIANCE_DENSITY,
			values,
			provenanceIdentity: `local-light-level-spec:${quantity}:${values.join(',')}`,
		});
	}
});
