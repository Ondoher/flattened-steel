import {DEFAULT_NATIVE_NUMERICAL_PROFILE} from '../../profiles/native-15/native-15-profile.js';
import {Algorithm32Transport} from '../Algorithm32Transport.js';

describe('Algorithm32Transport', /** Called by Jasmine to register the named test suite. */ () => {
	it('keeps view suppression separate from physical medium and celestial composition', () => {
		const contribution = new Algorithm32Transport().createShaderContribution(createRequest({}, {}));
		expect(contribution.uniforms).toContain(
			jasmine.objectContaining({valueKey: 'presentation.atmosphericViewEnabled', defaultValue: true}),
		);
		const hook = contribution.mainHooks.find((block) => block.id === 'transport-main-evaluate').code;
		expect(hook).toContain('if (uAtmosphericViewEnabled)');
		expect(hook).toContain('state.pathRadiance = zeroSpectral();');
		expect(hook).toContain('state.transmittance = oneSpectral();');
		expect(contribution.provides).toContain('composition.composeSpectralRadiance');
	});
	it('owns one source- and geometry-neutral cumulative-cache transport', /** Called by Jasmine to exercise the named behavior. */ () => {
		const contribution = new Algorithm32Transport().createShaderContribution(createRequest());
		const code = shaderCode(contribution);

		expect(contribution.owner).toBe('transport');
		expect(code).not.toContain('lookupIncidentRadiance');
		expect(code).not.toContain('sampleIncidentIrradiance');
		expect(code).not.toContain('CACHE_INCIDENT_DIRECTION_COUNT');
	});

	it('declares the complete cumulative-cache shader symbol set', /** Called by Jasmine to exercise the named behavior. */ () => {
		const transport = new Algorithm32Transport();

		expect(transport.mainRequiredShaderSymbols()).toEqual([
			'runtime.initialState',
			'geometry.reconstructViewRay',
			'geometry.resolveAtmospherePath',
			'atmosphere.sampleMedium',
			'cache.sampleCumulativeScatteringDensity',
			'transport.evaluatePathRadiance',
			'color.composeSceneColor',
			'color.encodeOutput',
		]);
	});

	it('does not require geometry or source metadata', /** Called by Jasmine to exercise the named behavior. */ () => {
		const transport = new Algorithm32Transport();
		const first = transport.createShaderContribution(createRequest());
		const second = transport.createShaderContribution(createRequest());

		expect(first.id).toBe('transport-algorithm32-cumulative-cache');
		expect(second.id).toBe(first.id);
		expect(second.requires).toEqual(first.requires);
		expect(shaderCode(second)).toBe(shaderCode(first));
	});

	it('adds path and celestial radiance exactly once only for an enabled roster', /** Called by Jasmine to exercise the named behavior. */ () => {
		const transport = new Algorithm32Transport();
		const atmospheric = transport.createShaderContribution(createRequest());
		const enabled = transport.createShaderContribution(createRequest({}, {}));
		const enabledCode = shaderCode(enabled);

		expect(atmospheric.provides).toEqual(['transport.evaluatePathRadiance']);
		expect(shaderCode(atmospheric)).not.toContain('composeSpectralRadiance');
		expect(enabled.provides).toEqual(['transport.evaluatePathRadiance', 'composition.composeSpectralRadiance']);
		expect(enabledCode.match(/preDisplayRadiance\.channels\[channelIndex\] =/gu)?.length).toBe(1);
		expect(enabledCode).toContain('+ celestialRadiance.channels[channelIndex]');
		expect(enabled.mainHooks.filter((block) => block.slot === 'composeSpectralRadiance')).toEqual([
			jasmine.objectContaining({
				code: 'SpectralValue preDisplayRadiance = composeSpectralRadiance(state.pathRadiance, celestialRadiance);',
			}),
		]);
	});

	it('queries one cumulative density per path point after updating view transmittance', /** Called by Jasmine to exercise the named behavior. */ () => {
		const contribution = new Algorithm32Transport().createShaderContribution(createRequest());
		const code = shaderCode(contribution);
		const transmittanceUpdate = code.indexOf(
			'viewTransmittance.channels[channelIndex] *= segmentTransmittance.channels[channelIndex]',
		);
		const cumulativeLookup = code.indexOf(
			'sampleCumulativeScatteringDensity(\n\t\t\tpositionMeters,\n\t\t\tatmosphereCoordinate,\n\t\t\tstate.ray.direction',
		);

		expect(contribution.requires).toEqual([
			'atmosphere.sampleMedium',
			'geometry.resolveAtmosphereCoordinate',
			'cache.sampleCumulativeScatteringDensity',
		]);
		expect(code).toContain('AtmosphereCoordinate atmosphereCoordinate = resolveAtmosphereCoordinate(');
		expect(code).toContain('MediumSample medium = sampleAtmosphere(atmosphereCoordinate);');
		expect(code).not.toContain('resolveScatteringCachePositionStencil');
		expect(code).not.toContain('resolveScatteringCacheDirectionStencil');
		expect(transmittanceUpdate).toBeGreaterThan(-1);
		expect(cumulativeLookup).toBeGreaterThan(transmittanceUpdate);
		expect(code.match(/sampleCumulativeScatteringDensity\(/gu)?.length).toBe(1);
		expect(code).toContain('* cumulativeScatteringDensity.channels[channelIndex]\n\t\t\t\t* measureMeters');
		expect(code).not.toContain('directScattering');
		expect(code).not.toContain('directionIndex');
	});

	it('applies both supported adaptive path-sampling options', /** Called by Jasmine to exercise the named behavior. */ () => {
		const transport = new Algorithm32Transport();
		const hardAdaptive = transport.createShaderContribution(
			createRequest({
				pathSampleDistribution: {kind: 'tangent-density-adaptive-v1'},
			}),
		);
		const softAdaptive = transport.createShaderContribution(
			createRequest({
				pathSampleDistribution: {kind: 'tangent-density-adaptive-soft-v1'},
			}),
		);

		expect(shaderCode(hardAdaptive)).toContain('float pathSampleFraction');
		expect(shaderCode(hardAdaptive)).toContain('return mix(uniformFraction, adaptiveFraction, 1.0);');
		expect(shaderCode(softAdaptive)).toContain('float pathSampleFraction');
		expect(shaderCode(softAdaptive)).toContain('return mix(uniformFraction, adaptiveFraction, 0.35);');
	});

	it('uses uniform endpoint trapezoids by default', /** Called by Jasmine to exercise the named behavior. */ () => {
		const contribution = new Algorithm32Transport().createShaderContribution(createRequest());
		const code = shaderCode(contribution);

		expect(code).not.toContain('float pathSampleFraction');
		expect(code).toContain(
			'float stepMeters = max(state.bounds.endDistanceMeters - state.bounds.startDistanceMeters, 0.0)',
		);
		expect(code).toContain('pointIndex == 0 || pointIndex == uTransportPathIntervalCount');
	});

	it('implements quadratic interval boundaries with one midpoint density sample and exact interval measure', () => {
		const contribution = new Algorithm32Transport().createShaderContribution(
			createRequest({
				pathIntervalCount: 30,
				pathSampleDistribution: {kind: 'quadratic-near-observer-v1'},
			}),
		);
		const code = shaderCode(contribution);

		expect(
			contribution.uniforms.find((uniform) => uniform.valueKey === 'transport.pathIntervalCount').defaultValue,
		).toBe(30);
		expect(code).toContain('clamp(fraction * fraction, 0.0, 1.0)');
		expect(code).toContain('0.5 * (startDistanceMeters + endDistanceMeters)');
		expect(code).toContain('intervalIndex < uTransportPathIntervalCount');
		expect(code).toContain('* intervalLengthMeters;');
		expect(code.match(/viewTransmittance\.channels\[channelIndex\] \*= halfIntervalTransmittance/gu)?.length).toBe(
			2,
		);
		expect(code).not.toContain('pointIndex <= uTransportPathIntervalCount');
	});

	it('binds accepted execution options as a runtime loop bound', /** Called by Jasmine to exercise the named behavior. */ () => {
		const transport = new Algorithm32Transport();
		const configured = transport.createShaderContribution(
			createRequest({
				pathIntervalCount: 12,
				pathSampleDistribution: {kind: 'uniform-distance'},
			}),
		);
		const defaulted = transport.createShaderContribution(
			createRequest({
				pathIntervalCount: undefined,
			}),
		);

		expect(configured.uniforms).toEqual(
			jasmine.arrayContaining([
				{
					name: 'uTransportPathIntervalCount',
					type: 'int',
					valueKey: 'transport.pathIntervalCount',
					defaultValue: 12,
				},
			]),
		);
		expect(shaderCode(configured)).toContain('pointIndex <= uTransportPathIntervalCount');
		expect(shaderCode(configured)).not.toContain('const int TRANSPORT_PATH_INTERVAL_COUNT');
		expect(shaderCode(configured)).not.toContain('float pathSampleFraction');
		expect(
			defaulted.uniforms.find((uniform) => uniform.valueKey === 'transport.pathIntervalCount').defaultValue,
		).toBe(DEFAULT_NATIVE_NUMERICAL_PROFILE.viewPath.intervalCount);
	});
});

/**
 * Called by this module to create request.
 * @param executionOverrides - The execution overrides value accepted by the operation.
 * @returns - The result produced by the operation.
 */
function createRequest(executionOverrides = {}, celestialSources = null) {
	const intervalCount =
		executionOverrides.pathIntervalCount === undefined
			? DEFAULT_NATIVE_NUMERICAL_PROFILE.viewPath.intervalCount
			: executionOverrides.pathIntervalCount;
	return {
		model: {
			celestialSources,
			profile: {
				numerical: {
					viewPath: {
						intervalCount: Object.hasOwn(executionOverrides, 'pathIntervalCount') ? intervalCount : 24,
						sampleDistribution: executionOverrides.pathSampleDistribution ?? null,
					},
				},
			},
		},
	};
}

/**
 * Called by this module to shader code.
 * @param contribution - The contribution value accepted by the operation.
 * @returns - The result produced by the operation.
 */
function shaderCode(contribution) {
	return contribution.functions
		.map(
			/**
			 * Called by Array.prototype.map to transform one collection value.
			 * @param block - The block value accepted by the operation.
			 * @returns - The callback result returned to its caller.
			 */ (block) => block.code,
		)
		.join('\n');
}
