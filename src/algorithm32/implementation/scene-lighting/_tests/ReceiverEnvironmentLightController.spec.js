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
	const radiance = (value) => new SpectralPacket({
		basis,
		quantity: SPECTRAL_QUANTITIES.RADIANCE_DENSITY,
		units: SPECTRAL_UNITS.RADIANCE_DENSITY,
		values: [value],
		provenanceIdentity: `receiver-environment-controller:${value}`,
	});

	it('publishes only a complete batch, reuses identity, and retains the prior result on failure', async () => {
		const controller = new ReceiverEnvironmentLightController({calculator: new LocalLightLevelCalculator()});
		let calls = 0;
		const first = await controller.build({
			identity: 'first',
			sampleIncomingRadiance: (directions) => {
				calls += 1;
				return directions.map(() => radiance(2));
			},
		});
		expect(first.spectralIrradiance.values[0]).toBeCloseTo(2 * Math.PI, 12);
		expect(first.brightnessProxy.value).toBeCloseTo(1366, 11);
		expect(await controller.build({identity: 'first', sampleIncomingRadiance: () => []})).toBe(first);
		expect(calls).toBe(1);

		await expectAsync(
			controller.build({identity: 'failed', sampleIncomingRadiance: () => [radiance(1)]}),
		).toBeRejectedWithError(RangeError);
		expect(controller.active).toBe(first);
	});

	it('clears publication and rejects builds after disposal', async () => {
		const controller = new ReceiverEnvironmentLightController({calculator: new LocalLightLevelCalculator()});
		controller.dispose();
		expect(controller.active).toBeNull();
		await expectAsync(controller.build({identity: 'late', sampleIncomingRadiance: () => []})).toBeRejectedWithError(
			Error,
			'Receiver environment-light controller is disposed.',
		);
	});

	it('atomically publishes the renderer-specific irradiance reduction', async () => {
		const controller = new ReceiverEnvironmentLightController({calculator: new LocalLightLevelCalculator()});
		const reduced = new SpectralPacket({
			basis,
			quantity: SPECTRAL_QUANTITIES.IRRADIANCE_DENSITY,
			units: SPECTRAL_UNITS.IRRADIANCE_DENSITY,
			values: [3],
			provenanceIdentity: 'receiver-environment-controller:gpu-reduced',
		});
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
		expect(measurement.spectralIrradiance).toBe(reduced);
		expect(measurement.brightnessProxy.value).toBeCloseTo(652.2169568, 6);
	});
});
