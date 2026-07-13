import {LocalSunShellFactCache} from '../LocalSunShellFactCache.js';
import LocalSunConstructionLightSource from '../LocalSunConstructionLightSource.js';
import {LocalSunLightSource} from '../../LocalSunLightSource.js';
import {NATIVE_SOURCE_IRRADIANCE_DENSITY} from '../../../../profiles/index.js';

describe('LocalSunConstructionLightSource', /** Called by Jasmine to register the named test suite. */ () => {
	it('holds only primary-J1 lighting at the containing shell mean', /** Called by Jasmine to exercise the named behavior. */ () => {
		const source = createSource();
		const shellFactCache = new LocalSunShellFactCache({
			sourceConfiguration: source.configuration,
		});
		const constructionSource = new LocalSunConstructionLightSource({
			source,
			shellFactCache,
		});
		const distanceFromSource = 0.5 * (shellFactCache.boundaries[1] + shellFactCache.boundaries[2]);
		const request = {
			sourceRelativePosition: {
				distanceFromSource: {
					value: distanceFromSource,
					units: 'meters',
				},
				directionToSource: [0, 0, 1],
			},
		};
		const expected = shellFactCache.resolveShell(distanceFromSource);
		const construction = constructionSource.sampleDirectLighting(request);
		const continuous = source.sampleDirectLighting(request);

		expect(constructionSource.id).toBe(source.id);
		expect(construction.metadata).toEqual(
			jasmine.objectContaining({
				constructionLightKind: 'shell-held-arithmetic-mean',
				shellIndex: expected.shellIndex,
				heldIncidentScale: expected.heldIncidentScale,
			}),
		);
		expect(construction.sourceIrradiance.values).toEqual(
			NATIVE_SOURCE_IRRADIANCE_DENSITY.values.map((value) => value * expected.heldIncidentScale),
		);
		expect(continuous.metadata).not.toEqual(
			jasmine.objectContaining({
				constructionLightKind: 'shell-held-arithmetic-mean',
			}),
		);
	});

	it('delegates the physical finite-source path limit', /** Called by Jasmine to exercise the named behavior. */ () => {
		const source = createSource();
		const constructionSource = new LocalSunConstructionLightSource({
			source,
			shellFactCache: new LocalSunShellFactCache({
				sourceConfiguration: source.configuration,
			}),
		});

		expect(
			constructionSource.resolveSourcePathLimit({
				sourceRelativePosition: {
					distanceFromSource: {
						value: 20,
						units: 'meters',
					},
				},
			}),
		).toEqual({
			maxDistance: {
				value: 20,
				units: 'meters',
			},
			reason: 'finite-local-source-distance',
		});
	});
});

/**
 * Called by this module to create source.
 *
 *  @returns {LocalSunLightSource} - The fixed physical test source.
 */
function createSource() {
	const position = {
		coordinates: [4_800_000, 0, 4_800_000],
		units: 'meters',
	};
	const source = new LocalSunLightSource({
		sourceKey: 'construction-local-sun',
		referenceDistance: {
			value: 4_800_000,
			units: 'meters',
		},
		referenceSpectralIncidentScale: 1,
		radius: {
			value: 25_749.504,
			units: 'meters',
		},
		distanceFalloff: true,
	});
	source.configureGeometryPlacement({kind: 'finite-position', position});

	return source;
}
