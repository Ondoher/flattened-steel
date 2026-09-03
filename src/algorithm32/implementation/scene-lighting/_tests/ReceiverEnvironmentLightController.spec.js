import {ReceiverEnvironmentLightController} from '../ReceiverEnvironmentLightController.js';
import {LocalLightLevelCalculator} from '../LocalLightLevelCalculator.js';
import {
	SPECTRAL_QUANTITIES,
	SPECTRAL_SAMPLE_SEMANTICS,
	SPECTRAL_UNITS,
	SpectralBasis,
	SpectralPacket,
} from '../../../spectral-values/index.js';

describe('ReceiverEnvironmentLightController', () => {
	const basis = new SpectralBasis({
		id: 'receiver-environment-controller-555nm',
		semantics: SPECTRAL_SAMPLE_SEMANTICS.BIN_AVERAGE,
		channels: [{id: 'photopic-peak', center: {value: 555, units: 'nanometers'}, width: {value: 1, units: 'nanometers'}}],
	});
	const packet = (quantity, value, id) => new SpectralPacket({
		basis,
		quantity,
		units:
			quantity === SPECTRAL_QUANTITIES.RADIANCE_DENSITY
				? SPECTRAL_UNITS.RADIANCE_DENSITY
				: SPECTRAL_UNITS.IRRADIANCE_DENSITY,
		values: [value],
		provenanceIdentity: `receiver-environment-controller:${id ?? value}`,
	});
	const radiance = (value) => packet(SPECTRAL_QUANTITIES.RADIANCE_DENSITY, value);
	const directLight = Object.freeze({
		directNormal: packet(SPECTRAL_QUANTITIES.IRRADIANCE_DENSITY, 4, 'direct-normal'),
		directHorizontal: packet(SPECTRAL_QUANTITIES.IRRADIANCE_DENSITY, 1, 'direct-horizontal'),
		sourceCenterCosine: 0.25,
		photopicDirectNormalIlluminance: {value: 4 * 683, units: 'lux'},
		photopicDirectHorizontalIlluminance: {value: 683, units: 'lux'},
	});
	const createController = () => new ReceiverEnvironmentLightController({
		calculator: new LocalLightLevelCalculator(),
		directLight,
		identity: 'receiver-controller-initial',
	});

	it('starts with a complete direct-only publication', () => {
		const controller = createController();
		expect(controller.active.directNormal).toBe(directLight.directNormal);
		expect(controller.active.directHorizontal).toBe(directLight.directHorizontal);
		expect(controller.active.diffuseHorizontal.values).toEqual([0]);
		expect(controller.active.totalHorizontal.values).toEqual([1]);
		expect(controller.active.photopicTotalHorizontalIlluminance).toEqual({value: 683, units: 'lux'});
	});

	it('publishes only a complete additive batch, reuses identity, and retains the prior result on failure', async () => {
		const controller = createController();
		let calls = 0;
		const first = await controller.build({
			identity: 'first',
			sampleIncomingRadiance: (directions) => {
				calls += 1;
				return directions.map(() => radiance(2));
			},
		});
		expect(first.diffuseHorizontal.values[0]).toBeCloseTo(2 * Math.PI, 12);
		expect(first.totalHorizontal.values[0]).toBeCloseTo(1 + 2 * Math.PI, 12);
		expect(first.photopicTotalHorizontalIlluminance.value).toBeCloseTo((1 + 2 * Math.PI) * 683, 9);
		expect(await controller.build({identity: 'first', sampleIncomingRadiance: () => []})).toBe(first);
		expect(calls).toBe(1);

		await expectAsync(
			controller.build({identity: 'failed', sampleIncomingRadiance: () => [radiance(1)]}),
		).toBeRejectedWithError(RangeError);
		expect(controller.active).toBe(first);
	});

	it('clears publication and rejects builds after disposal', async () => {
		const controller = createController();
		controller.dispose();
		expect(controller.active).toBeNull();
		await expectAsync(controller.build({identity: 'late', sampleIncomingRadiance: () => []})).toBeRejectedWithError(
			Error,
			'Receiver environment-light controller is disposed.',
		);
	});

	it('atomically publishes the renderer-specific diffuse-horizontal reduction', async () => {
		const controller = createController();
		const reduced = packet(SPECTRAL_QUANTITIES.IRRADIANCE_DENSITY, 3, 'gpu-reduced');
		let acceptedRadiances = null;
		const measurement = await controller.build({
			identity: 'gpu-reduced',
			sampleIncomingRadiance: (directions) => directions.map(() => radiance(7)),
			reduceIncomingRadiance: (radiances) => {
				acceptedRadiances = radiances;
				return reduced;
			},
		});
		expect(acceptedRadiances).toHaveSize(32);
		expect(measurement.diffuseHorizontal).toBe(reduced);
		expect(measurement.totalHorizontal.values).toEqual([4]);
		expect(measurement.totalHorizontalLuminanceProxy.value).toBeCloseTo((4 * 683) / Math.PI, 9);
	});

	it('preserves the last complete publication on cancellation and supersession', async () => {
		const controller = createController();
		const baseline = controller.active;
		const cancellation = new AbortController();
		cancellation.abort();
		await expectAsync(controller.build({
			identity: 'cancelled',
			signal: cancellation.signal,
			sampleIncomingRadiance: () => [],
		})).toBeRejectedWithError(Error, 'Receiver environment-light build was cancelled.');
		expect(controller.active).toBe(baseline);

		let resolveSlow;
		const slowRadiances = new Promise((resolve) => {
			resolveSlow = resolve;
		});
		const slow = controller.build({identity: 'slow', sampleIncomingRadiance: () => slowRadiances});
		const latest = await controller.build({
			identity: 'latest',
			sampleIncomingRadiance: (directions) => directions.map(() => radiance(1)),
		});
		resolveSlow(Array.from({length: 32}, () => radiance(9)));
		await expectAsync(slow).toBeRejectedWithError(Error, 'Receiver environment-light build was superseded.');
		expect(controller.active).toBe(latest);
	});
});
