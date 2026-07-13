import { RUNTIME_NUMERICAL_CONTROLS } from '../../constants/Algorithm32CanonicalData.js';
import { Algorithm32Transport } from '../Algorithm32Transport.js';

describe('Algorithm32Transport', () => {
	it('owns one source- and geometry-neutral cumulative-cache transport', () => {
		const contribution = new Algorithm32Transport().createShaderContribution(
			createRequest('spherical-earth-geometry'),
		);
		const code = shaderCode(contribution);

		expect(contribution.owner).toBe('transport');
		expect(code).not.toContain('lookupIncidentRadiance');
		expect(code).not.toContain('sampleIncidentIrradiance');
		expect(code).not.toContain('CACHE_INCIDENT_DIRECTION_COUNT');
	});

	it('declares the complete cumulative-cache shader symbol set', () => {
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

	it('uses the same contribution for every geometry and source hidden behind the interfaces', () => {
		const transport = new Algorithm32Transport();
		const spherical = transport.createShaderContribution(
			createRequest('spherical-earth-geometry'),
		);
		const flat = transport.createShaderContribution(
			createRequest('flat-earth-geometry'),
		);

		expect(spherical.id).toBe('transport-algorithm32-cumulative-cache');
		expect(flat.id).toBe(spherical.id);
		expect(flat.requires).toEqual(spherical.requires);
		expect(shaderCode(flat)).toBe(shaderCode(spherical));
	});

	it('queries one cumulative density per path point after updating view transmittance', () => {
		const contribution = new Algorithm32Transport().createShaderContribution(
			createRequest('spherical-earth-geometry'),
		);
		const code = shaderCode(contribution);
		const transmittanceUpdate = code.indexOf(
			'viewTransmittance.c[channelIndex] *= segmentTransmittance.c[channelIndex]',
		);
		const cumulativeLookup = code.indexOf(
			'sampleCumulativeScatteringDensity(\n\t\t\tpositionStencil,\n\t\t\tdirectionStencil',
		);

		expect(contribution.requires).toEqual([
			'atmosphere.sampleMedium',
			'geometry.resolveAtmosphereCoordinate',
			'geometry.resolveScatteringCachePositionStencil',
			'geometry.resolveScatteringCacheDirectionStencil',
			'cache.sampleCumulativeScatteringDensity',
		]);
		expect(code).toContain(
			'AtmosphereCoordinate atmosphereCoordinate = resolveAtmosphereCoordinate(',
		);
		expect(code).toContain('MediumSample medium = sampleAtmosphere(atmosphereCoordinate);');
		expect(code).toContain(
			'resolveScatteringCachePositionStencil(atmosphereCoordinate)',
		);
		expect(transmittanceUpdate).toBeGreaterThan(-1);
		expect(cumulativeLookup).toBeGreaterThan(transmittanceUpdate);
		expect(code.match(/sampleCumulativeScatteringDensity\(/gu)?.length).toBe(1);
		expect(code).toContain(
			'* cumulativeScatteringDensity.c[channelIndex]\n\t\t\t\t* measureMeters',
		);
		expect(code).not.toContain('directScattering');
		expect(code).not.toContain('directionIndex');
	});

	it('applies both supported adaptive path-sampling controls', () => {
		const transport = new Algorithm32Transport();
		const hardAdaptive = transport.createShaderContribution(
			createRequest('spherical-earth-geometry', {
				pathSampleDistribution: { kind: 'tangent-density-adaptive-v1' },
			}),
		);
		const softAdaptive = transport.createShaderContribution(
			createRequest('spherical-earth-geometry', {
				pathSampleDistribution: { kind: 'tangent-density-adaptive-soft-v1' },
			}),
		);

		expect(shaderCode(hardAdaptive)).toContain('float pathSampleFraction');
		expect(shaderCode(hardAdaptive))
			.toContain('return mix(uniformFraction, adaptiveFraction, 1.0);');
		expect(shaderCode(softAdaptive)).toContain('float pathSampleFraction');
		expect(shaderCode(softAdaptive))
			.toContain('return mix(uniformFraction, adaptiveFraction, 0.35);');
	});

	it('uses uniform endpoint trapezoids by default', () => {
		const contribution = new Algorithm32Transport().createShaderContribution(
			createRequest('spherical-earth-geometry'),
		);
		const code = shaderCode(contribution);

		expect(code).not.toContain('float pathSampleFraction');
		expect(code).toContain(
			'float stepMeters = max(state.bounds.endDistanceMeters - state.bounds.startDistanceMeters, 0.0)',
		);
		expect(code).toContain(
			'pointIndex == 0 || pointIndex == uTransportPathIntervalCount',
		);
	});

	it('binds accepted execution controls as a runtime loop bound', () => {
		const transport = new Algorithm32Transport();
		const configured = transport.createShaderContribution(
			createRequest('spherical-earth-geometry', {
				pathIntervalCount: 12,
				pathSampleDistribution: { kind: 'uniform-distance' },
			}),
		);
		const defaulted = transport.createShaderContribution(
			createRequest('spherical-earth-geometry', {
				pathIntervalCount: undefined,
			}),
		);

		expect(configured.uniforms).toEqual([
			{
				name: 'uTransportPathIntervalCount',
				type: 'int',
				valueKey: 'transport.pathIntervalCount',
				defaultValue: 12,
			},
		]);
		expect(shaderCode(configured)).toContain(
			'pointIndex <= uTransportPathIntervalCount',
		);
		expect(shaderCode(configured)).not.toContain(
			'const int TRANSPORT_PATH_INTERVAL_COUNT',
		);
		expect(shaderCode(configured)).not.toContain('float pathSampleFraction');
		expect(defaulted.uniforms[0].defaultValue)
			.toBe(RUNTIME_NUMERICAL_CONTROLS.pathIntervalCount);
	});
});

function createRequest(geometryKind, executionOverrides = {}) {
	return {
		descriptor: createDescriptor(geometryKind),
		config: {
			config: {
				execution: {
					pathIntervalCount: 24,
					...executionOverrides,
				},
			},
		},
	};
}

function createDescriptor(geometryKind) {
	return {
		descriptorId: 'descriptor',
		variantId: 'variant',
		fingerprint: 'descriptor',
		compatibilityTags: [],
		spectralBasis: createSection('basis', { channelCount: 15 }),
		geometry: createSection('geometry', { kind: geometryKind }),
		atmosphere: createSection('atmosphere', {}),
		lightSource: createSection('light-source', {}),
		cache: createSection('cache', {}),
		transport: createSection('transport', {
			execution: {
				pathIntervalCount: 3,
				pathSampleDistribution: { kind: 'tangent-density-adaptive-v1' },
			},
		}),
		color: createSection('color', {}),
		runtime: createSection('runtime', {}),
	};
}

function shaderCode(contribution) {
	return contribution.functions.map((block) => block.code).join('\n');
}

function createSection(fingerprint, facts) {
	return {
		descriptorId: fingerprint,
		fingerprint,
		compatibilityTags: [fingerprint],
		facts,
	};
}
