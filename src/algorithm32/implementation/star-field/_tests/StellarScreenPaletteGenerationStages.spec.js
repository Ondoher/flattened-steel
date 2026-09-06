import {DistantSunLightSource, SphericalEarthGeometry, StellarPointSetSource} from '../../index.js';
import {
	STELLAR_SCREEN_PALETTE_NUMERICAL_POLICY,
	StellarScreenPaletteGenerationPolicy,
} from '../StellarScreenPaletteGenerationPolicy.js';
import {StellarScreenPaletteGenerationIdentity} from '../StellarScreenPaletteGenerationIdentity.js';
import {STELLAR_ONE_PIXEL_PRESENTATION} from '../StellarPointPresentation.js';
import {STELLAR_SKY_REFERENCE_CONTROLS} from './StellarSkyReferenceControls.js';

const FIXED_OBSERVATION = {
	instant: '2024-06-21T06:26:03.503Z',
	location: {
		latitude: {value: 37.3382, units: 'degrees'},
		longitude: {value: -121.8863, units: 'degrees'},
	},
};

/** Create configured spherical geometry for one exact observation snapshot. */
function createGeometry(observation = FIXED_OBSERVATION) {
	const sun = new DistantSunLightSource({angularRadius: {value: 0.004675, units: 'radians'}});
	const geometry = new SphericalEarthGeometry({
		bottomRadius: {value: 6_360_000, units: 'meters'},
		topRadius: {value: 6_420_000, units: 'meters'},
		observerHeight: {value: 10, units: 'meters'},
	});
	geometry.configureLightSource({
		lightSource: sun,
		observation,
		placement: {kind: 'distant-direction', directionToLight: [0, 0, 1]},
	});

	return geometry;
}

/** Create one independently mutable policy request for ingress rejection tests. */
function createPolicyConfiguration(memberCount = 500) {
	return {
		sourceLayout: {
			schema: 'stellar-generation-source-table-v2',
			storageFormat: 'RGBA32F+R32F',
			memberOrder: 'canonical-selection-order',
			memberCount,
			spectralChannelCount: 15,
		},
		layout: {
			zeroIndex: 0,
			candidateSlotPolicy: 'canonical-member-index-plus-one',
			collisionRepresentative: 'lowest-canonical-member',
			accumulationOrder: 'canonical-member-order',
			memberCount,
			entryCapacity: memberCount + 1,
			indexFormat: 'R16UI',
			paletteFormat: 'R32F',
			channelCount: 15,
			rowCount: 16,
			visualMagnitudeRow: 15,
		},
		numericalPolicy: {...STELLAR_SCREEN_PALETTE_NUMERICAL_POLICY},
	};
}

/** Create one exact perspective view and derive its content identity. */
function createView(overrides = {}) {
	const facts = {
		projection: 'perspective',
		modelViewProjectionMatrix: [
			0.36084391824351614, 0, 0, 0, 0, 0, 1.02020202020202, 1, 0, 0.577350269189626, 0, 0, 0, 0,
			-0.20202020202020202, 0,
		],
		inverseProjectionMatrix: [
			2.7712812921102032, 0, 0, 0, 0, 1.732050807568877, 0, 0, 0, 0, 0, -4.95, 0, 0, -1, 5.05,
		],
		viewportSize: {width: 32, height: 20, units: 'pixels'},
		...overrides,
	};

	return {
		...facts,
		identity: StellarScreenPaletteGenerationIdentity.createViewIdentity(facts),
	};
}

describe('stellar screen-palette generation stages', /** Called by Jasmine to register the named test suite. */ () => {
	it('accepts the complete R16UI boundary without wrapping its highest candidate index', /** Called by Jasmine to exercise the named behavior. */ () => {
		const policy = new StellarScreenPaletteGenerationPolicy(createPolicyConfiguration(65_535));

		expect(policy.layout).toEqual({
			zeroIndex: 0,
			candidateSlotPolicy: 'canonical-member-index-plus-one',
			collisionRepresentative: 'lowest-canonical-member',
			accumulationOrder: 'canonical-member-order',
			memberCount: 65_535,
			entryCapacity: 65_536,
			indexFormat: 'R16UI',
			paletteFormat: 'R32F',
			channelCount: 15,
			rowCount: 16,
			visualMagnitudeRow: 15,
		});
	});

	it('rejects R16UI overflow and inconsistent capacity, formats, channels, or numerical rules', /** Called by Jasmine to exercise the named behavior. */ () => {
		expect(() => new StellarScreenPaletteGenerationPolicy(createPolicyConfiguration(65_536))).toThrowError(
			/member index exceeds.*R16UI/,
		);

		const invalidCases = [
			{path: 'layout', key: 'entryCapacity', value: 500},
			{path: 'layout', key: 'memberCount', value: 499},
			{path: 'layout', key: 'indexFormat', value: 'R32UI'},
			{path: 'layout', key: 'paletteFormat', value: 'R16F'},
			{path: 'layout', key: 'channelCount', value: 14},
			{path: 'numericalPolicy', key: 'accumulationOrder', value: 'implementation-dependent'},
			{path: 'numericalPolicy', key: 'packing', value: 'binary64'},
		];

		for (const invalidCase of invalidCases) {
			const configuration = createPolicyConfiguration();
			configuration[invalidCase.path][invalidCase.key] = invalidCase.value;
			expect(() => new StellarScreenPaletteGenerationPolicy(configuration)).toThrowError(/Stellar generation/);
		}
	});

	it('publishes the validated sparse layout and named numerical policy on both stages', /** Called by Jasmine to exercise the named behavior. */ () => {
		const source = new StellarPointSetSource();
		const stages = source.createStellarGenerationStages({
			geometry: createGeometry(),
			observation: FIXED_OBSERVATION,
		});

		expect(stages[0].policyIdentity).toBe(stages[1].policyIdentity);
		expect(stages[0].policyIdentity).toBe(
			'sha256:edb006d1e5bae4eacdfc2fc0bc9a5fdf5aa000b25725d78f86be1bc0dcf3b89f',
		);
		expect(stages[0].stellarLayout.entryCapacity).toBe(501);
		expect(stages[0].stellarLayout.memberCount).toBe(500);
		expect(stages[0].stellarLayout.indexFormat).toBe('R16UI');
		expect(stages[0].stellarLayout.paletteFormat).toBe('R32F');
		expect(stages[0].stellarLayout.channelCount).toBe(15);
		expect(stages[0].stellarLayout.rowCount).toBe(16);
		expect(stages[0].stellarLayout.visualMagnitudeRow).toBe(15);
		expect(stages[0].numericalPolicy).toEqual(STELLAR_SCREEN_PALETTE_NUMERICAL_POLICY);
		expect(stages[1].stellarLayout).toEqual(stages[0].stellarLayout);
		expect(stages[1].numericalPolicy).toEqual(stages[0].numericalPolicy);
	});

	it('promotes the accepted CR6C q24 calibration over the frozen 000435 base scale', () => {
		expect(STELLAR_SKY_REFERENCE_CONTROLS.view).toEqual({
			widthPixels: 640,
			heightPixels: 400,
			verticalFieldOfViewDegrees: 78,
		});
		expect(STELLAR_SKY_REFERENCE_CONTROLS.nightCapture).toEqual({
			nonBlackPixelCount: 32,
			minimumNonBlackByte: 43,
			maximumByte: 235,
			exactWhitePixelCount: 0,
		});
		expect(STELLAR_ONE_PIXEL_PRESENTATION.reference.runId).toBe(STELLAR_SKY_REFERENCE_CONTROLS.sourceRun.id);
		expect(STELLAR_ONE_PIXEL_PRESENTATION.calibration).toEqual({
			runId: '000049-cr6c-one-pixel-brightness-calibration-narrowed',
			multiplier: 24,
			baseIrradianceToBoundaryRadianceScale: 60999.839486002405,
		});
		expect(
			STELLAR_ONE_PIXEL_PRESENTATION.calibration.baseIrradianceToBoundaryRadianceScale *
				STELLAR_ONE_PIXEL_PRESENTATION.reference.centerPixelSolidAngleSteradians,
		).toBeCloseTo(1, 12);
		expect(
			STELLAR_ONE_PIXEL_PRESENTATION.irradianceToBoundaryRadianceScale *
				STELLAR_ONE_PIXEL_PRESENTATION.reference.centerPixelSolidAngleSteradians,
		).toBeCloseTo(24, 12);
	});

	it('derives stable source, fixed-observation, view, and complete generation identities', /** Called by Jasmine to exercise the named behavior. */ () => {
		const source = new StellarPointSetSource();
		const geometry = createGeometry();
		const view = createView();
		const first = source.createStellarGenerationIdentity({geometry, observation: FIXED_OBSERVATION, view});
		const equivalent = source.createStellarGenerationIdentity({
			geometry,
			observation: FIXED_OBSERVATION,
			view: createView(),
		});

		expect(first).toEqual(equivalent);
		expect(first.policyIdentity).toBe('sha256:edb006d1e5bae4eacdfc2fc0bc9a5fdf5aa000b25725d78f86be1bc0dcf3b89f');
		expect(first.generationIdentity).toBe(
			'sha256:107555b8d919722cc6363034d6918c5fc921ad65d93bebd12eeaac604397e3a5',
		);
		expect(first.compatibility).toEqual({
			sourceIdentity: 'sha256:92216da236031ebadc17f08c52de792e6c4d614a70975edad7720b14f02248d9',
			observationIdentity: 'sha256:b2bd1287f80229c6d2d201f28597497d35043aa7247cfd3643c6291d3500de85',
			viewIdentity: 'sha256:bff251cf07f6a051fa3492c2460e51b6b8e15b1b05c3aee83385f194164e114b',
		});
		expect(first.compatibility.viewIdentity).toBe(view.identity);
	});

	it('changes only the affected compatibility dimensions for replacement observation or view facts', /** Called by Jasmine to exercise the named behavior. */ () => {
		const source = new StellarPointSetSource();
		const first = source.createStellarGenerationIdentity({
			geometry: createGeometry(),
			observation: FIXED_OBSERVATION,
			view: createView(),
		});
		const replacementObservation = {...FIXED_OBSERVATION, instant: '2024-06-21T07:26:03.503Z'};
		const changedObservation = source.createStellarGenerationIdentity({
			geometry: createGeometry(replacementObservation),
			observation: replacementObservation,
			view: createView(),
		});
		const changedView = source.createStellarGenerationIdentity({
			geometry: createGeometry(),
			observation: FIXED_OBSERVATION,
			view: createView({viewportSize: {width: 64, height: 40, units: 'pixels'}}),
		});

		expect(changedObservation.compatibility.sourceIdentity).toBe(first.compatibility.sourceIdentity);
		expect(changedObservation.compatibility.observationIdentity).not.toBe(first.compatibility.observationIdentity);
		expect(changedObservation.compatibility.viewIdentity).toBe(first.compatibility.viewIdentity);
		expect(changedObservation.generationIdentity).not.toBe(first.generationIdentity);
		expect(changedView.compatibility.sourceIdentity).toBe(first.compatibility.sourceIdentity);
		expect(changedView.compatibility.observationIdentity).toBe(first.compatibility.observationIdentity);
		expect(changedView.compatibility.viewIdentity).not.toBe(first.compatibility.viewIdentity);
		expect(changedView.generationIdentity).not.toBe(first.generationIdentity);
	});

	it('rejects a declared view identity that does not match its exact projection facts', /** Called by Jasmine to exercise the named behavior. */ () => {
		const source = new StellarPointSetSource();
		const view = createView();

		expect(() =>
			source.createStellarGenerationIdentity({
				geometry: createGeometry(),
				observation: FIXED_OBSERVATION,
				view: {...view, identity: 'sha256:not-the-view'},
			}),
		).toThrowError(/view identity does not match/);
		expect(() =>
			StellarScreenPaletteGenerationIdentity.createViewIdentity({
				...view,
				modelViewProjectionMatrix: [Number.NaN],
			}),
		).toThrowError(/finite perspective matrices/);
	});

	it('contributes the fixed IAU-2000, sidereal, local-ENU, and projection operations', /** Called by Jasmine to exercise the named behavior. */ () => {
		const geometry = createGeometry();
		const contribution = geometry.createStellarGenerationShaderContribution({observation: FIXED_OBSERVATION});
		const defaultValues = new Map(contribution.uniforms.map((uniform) => [uniform.name, uniform.defaultValue]));

		expect(geometry.describeStellarEpochRelativeTransform()).toEqual({
			precession: 'iau-2000-three-angle',
			siderealTime: 'usno-mean-sidereal-time',
			ut1Approximation: 'utc-as-ut1',
			terrestrialTimeApproximation: 'utc-as-tt',
			localFrame: 'east-north-up-rh-v1',
		});
		expect(contribution.identity).toBe('sha256:75f052333168d5b6211ecebadff7d270fc23a3bb4ba7d257e4cddf6388d7bba9');
		expect(defaultValues.get('uStellarJulianCenturiesSinceJ2000')).toBeCloseTo(0.24470275417110493, 14);
		expect(defaultValues.get('uStellarDaysAtZeroHoursSinceJ2000')).toBe(8937.5);
		expect(defaultValues.get('uStellarHoursSinceZero')).toBeCloseTo(6.434306390583515, 12);
		expect(defaultValues.get('uStellarObserverLatitudeRadians')).toBeCloseTo(0.6516745267681467, 14);
		expect(defaultValues.get('uStellarObserverLongitudeRadians')).toBeCloseTo(-2.1273172480735645, 14);
		expect(contribution.source).toContain('stellarPrecessFk5J2000ToMeanOfDate');
		expect(contribution.source).toContain('2306.083227 * t');
		expect(contribution.source).toContain('stellarGreenwichMeanSiderealTimeRadians');
		expect(contribution.source).toContain('1.0027379 * uStellarHoursSinceZero');
		expect(contribution.source).toContain('stellarCatalogDirectionToLocalEnu');
		expect(contribution.source).toContain('localDirection.z <= 0.0');
		expect(contribution.source).toContain('stellarLocalEnuToScene');
		expect(contribution.source).toContain('uStellarModelViewProjectionMatrix * vec4(sceneDirection, 0.0)');
		expect(contribution.source).toContain('screen.x < 0.0 || screen.x >= float(uStellarViewportSize.x)');
		expect(contribution.source).not.toContain('stellarPixelSolidAngleSteradians');
		expect(contribution.bindingRequirements.map((binding) => binding.updateFrequency)).toEqual([
			'config',
			'config',
			'config',
			'config',
			'config',
			'frame',
			'frame',
			'frame',
		]);
	});

	it('rejects a different clock/location object after geometry configuration', /** Called by Jasmine to exercise the named behavior. */ () => {
		const geometry = createGeometry();
		const equivalentButDifferentSnapshot = {
			...FIXED_OBSERVATION,
			location: {...FIXED_OBSERVATION.location},
		};

		expect(() =>
			geometry.createStellarGenerationShaderContribution({observation: equivalentButDifferentSnapshot}),
		).toThrowError(/exact configured observation snapshot/);
	});

	it('changes geometry and stage identity for a replacement observation while retaining source identity', /** Called by Jasmine to exercise the named behavior. */ () => {
		const replacementObservation = {
			...FIXED_OBSERVATION,
			instant: '2024-06-21T07:26:03.503Z',
		};
		const source = new StellarPointSetSource();
		const firstGeometry = createGeometry();
		const replacementGeometry = createGeometry(replacementObservation);
		const firstContribution = firstGeometry.createStellarGenerationShaderContribution({
			observation: FIXED_OBSERVATION,
		});
		const replacementContribution = replacementGeometry.createStellarGenerationShaderContribution({
			observation: replacementObservation,
		});
		const firstStages = source.createStellarGenerationStages({
			geometry: firstGeometry,
			observation: FIXED_OBSERVATION,
		});
		const replacementStages = source.createStellarGenerationStages({
			geometry: replacementGeometry,
			observation: replacementObservation,
		});

		expect(replacementContribution.identity).not.toBe(firstContribution.identity);
		expect(replacementStages.map((stage) => stage.sourceHash)).not.toEqual(
			firstStages.map((stage) => stage.sourceHash),
		);
		expect(source.createStellarGenerationSourceTable().identity).toBe(
			'sha256:1b8f8143033d2ebc0b9a6f918c7e809411c737a873f229cb7dc5e05a84c02429',
		);
	});

	it('declares a one-point-per-member R16UI stage with lowest-member collision ownership', /** Called by Jasmine to exercise the named behavior. */ () => {
		const source = new StellarPointSetSource();
		const [point] = source.createStellarGenerationStages({
			geometry: createGeometry(),
			observation: FIXED_OBSERVATION,
		});

		expect(point.id).toBe('celestial-generation.stellar-point-index');
		expect(point.sourceHash).toBe('fnv1a32:52d295ae');
		expect(point.order).toBe(100);
		expect(point.vertexCount).toBe(500);
		expect(point.topology).toBe('points');
		expect(point.depthPolicy).toBe('lowest-canonical-member');
		expect(point.dependencies).toEqual([]);
		expect(point.completionBoundary).toBe('stage');
		expect(point.outputs).toEqual([
			{
				id: 'celestial.stellar.screen-index',
				format: 'R16UI',
				persistence: 'published',
				shape: 'viewport',
				clearValue: 0,
			},
			{
				id: 'celestial.stellar.order-depth',
				format: 'DEPTH_COMPONENT24',
				persistence: 'transient',
				shape: 'viewport-depth-order',
				clearValue: 1,
			},
		]);
		expect(point.vertexShaderSource).toContain('int memberIndex = gl_VertexID;');
		expect(point.vertexShaderSource).toContain('vStellarCandidateIndex = uint(memberIndex + 1);');
		expect(point.vertexShaderSource).toContain('gl_PointSize = 1.0;');
		expect(point.vertexShaderSource).toContain('stellarTopLeftPixelCenterToClip(projection.topLeftPixel)');
		expect(point.vertexShaderSource).toContain('(float(memberIndex) + 1.0) / 501.0');
		expect(point.fragmentShaderSource).toContain('outStellarScreenIndex = vStellarCandidateIndex;');
	});

	it('declares the sparse representative palette stage with canonical collision accumulation', /** Called by Jasmine to exercise the named behavior. */ () => {
		const source = new StellarPointSetSource();
		const [, palette] = source.createStellarGenerationStages({
			geometry: createGeometry(),
			observation: FIXED_OBSERVATION,
		});

		expect(palette.id).toBe('celestial-generation.stellar-sparse-palette');
		expect(palette.sourceHash).toBe('fnv1a32:288673e3');
		expect(palette.order).toBe(110);
		expect(palette.vertexCount).toBe(3);
		expect(palette.topology).toBe('fullscreen-triangles');
		expect(palette.depthPolicy).toBe('disabled');
		expect(palette.dependencies).toEqual(['celestial.stellar.screen-index']);
		expect(palette.completionBoundary).toBe('publication');
		expect(palette.outputs).toEqual([
			{
				id: 'celestial.stellar.palette',
				format: 'R32F',
				persistence: 'published',
				shape: 'stellar-entry-by-native-channel-plus-visual-magnitude',
				clearValue: 0,
			},
		]);
		expect(palette.fragmentShaderSource).toContain('entryIndex == 0');
		expect(palette.fragmentShaderSource).toContain('selectedIndex != uint(entryIndex)');
		expect(palette.fragmentShaderSource).toContain(
			'for (int memberIndex = 0; memberIndex < 500; memberIndex += 1)',
		);
		expect(palette.fragmentShaderSource).not.toContain('stellarPixelSolidAngleSteradians');
		expect(palette.fragmentShaderSource).toContain('accumulatedValue += irradiance * 1463996.14766;');
		expect(palette.fragmentShaderSource).toContain('accumulatedValue += pow(10.0, -0.4 * visualMagnitude);');
		expect(palette.fragmentShaderSource).toContain('? -2.5 * log(accumulatedValue) / log(10.0)');
		expect(palette.fragmentShaderSource).toContain(': accumulatedValue;');
	});
});
